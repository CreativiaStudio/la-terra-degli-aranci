/**
 * eventLedger.ts — Motore contabile puro e deterministico de La Terra degli Aranci.
 *
 * Regole fiscali non negoziabili (direttive Roberto / Rosaria):
 *  1. Canone Location / Fitto Villa → 100% Santo Stefano S.r.l. (IVA 22%).
 *     NESSUNO split 40/60 sul canone.
 *  2. Banqueting & servizi accessori → ripartiti secondo il `splitKey` della riga:
 *     - default 40% Santo Stefano (IVA 22%) / 60% Iovino (IVA 10%);
 *     - se il listino indica un `splitKey` diverso (ss100, i100, ss50, ...) vale quello.
 *  3. Cascata FIFO delle rate: caparra → 2° acconto → saldo.
 *  4. Conguaglio inter-societario sul denaro realmente incassato.
 *
 * Il modulo è PURO: nessun accesso a FS, rete, Date implicite o stato globale.
 * Tutti gli importi sono INTERI in centesimi: mai float.
 */

import { sixMonthsBefore } from '@/lib/contractPayments';

/* ------------------------------------------------------------------ */
/* Tipi                                                                */
/* ------------------------------------------------------------------ */

export type PaymentMethod = 'bonifico' | 'contanti' | 'assegno' | 'pos' | 'altro';
export type Company = 'santo_stefano' | 'iovino';

/** Metodi ammessi, riutilizzabili dalle Server Actions per la validazione. */
export const VALID_PAYMENT_METHODS: readonly PaymentMethod[] = [
  'bonifico',
  'contanti',
  'assegno',
  'pos',
  'altro',
];

/** Società ammesse dal modello (denaro realmente incassato). */
export const VALID_COMPANIES: readonly Company[] = ['santo_stefano', 'iovino'];

/**
 * Registrazione di un incasso reale.
 * Append-only: non viene mai eliminato fisicamente, solo annullato con motivo.
 */
export interface Payment {
  id: string; // uuid
  quote_id: string; // uuid completo quote
  data_incasso: string; // 'YYYY-MM-DD'
  importo_cents: number; // intero > 0 in centesimi
  metodo: PaymentMethod;
  incassato_da: Company;
  riferimento?: string; // es. CRO bonifico, numero assegno
  note?: string;
  stato: 'valido' | 'annullato';
  annullato_motivo?: string;
  annullato_at?: string;
  registrato_da: string;
  created_at: string;
}

/** Riga di servizio di un preventivo/contratto (forma minima necessaria al calcolo). */
export interface QuoteItem {
  splitKey?: string;
  split_key?: string;
  splitLabel?: string;
  split_label?: string;
  prezzo_unitario?: number;
  prezzoUnitario?: number;
  quantita?: number;
  totale?: number;
  descrizione?: string;
  [key: string]: unknown;
}

/** Preventivo/contratto visto dal motore contabile (forma volutamente tollerante). */
export interface Quote {
  id?: string;
  tipo_evento?: string | null;
  data_evento?: string | null;
  created_at?: string | null;
  signed_at?: string | null;
  data_firma?: string | null;
  /** Euro. Se assente e non ci sono righe, viene usato `prezzo`/`totale`. */
  canone?: number | null;
  /** Centesimi. Preferito a `canone` quando presente. */
  canone_cents?: number | null;
  prezzo?: number | null;
  totale?: number | null;
  totale_calcolato?: number | null;
  importo_caparra?: number | null;
  importo_secondo_acconto?: number | null;
  sconto_fisso?: number | null;
  sconto_cents?: number | null;
  items?: QuoteItem[] | null;
  [key: string]: unknown;
}

/** Variazione al preventivo (Allegato B) — pending o confermata. */
export interface QuoteChange {
  id?: string;
  status?: string;
  created_at?: string | null;
  confirmed_at?: string | null;
  totale_before?: number | null;
  totale_after?: number | null;
  items_before?: QuoteItem[] | null;
  items_after?: QuoteItem[] | null;
  [key: string]: unknown;
}

export interface Installment {
  key: 'caparra' | 'secondo_acconto' | 'saldo';
  label: string;
  importo_cents: number;
  scadenza: string | null; // 'YYYY-MM-DD'
  coperto_cents: number; // quanto di questa rata è coperto (FIFO)
  stato: 'saldata' | 'parziale' | 'da_pagare' | 'scaduta';
  in_ritardo: boolean; // non saldata e scadenza < oggi
}

export interface EventLedger {
  concordato_cents: number; // canone + servizi firmati − sconti
  in_attesa_firma_delta_cents: number;
  spettanza: Record<Company, number>; // quota del concordato per società (lordo)
  incassato_cents: number; // somma pagamenti validi
  incassato_per: Record<Company, number>;
  residuo_cents: number; // max(0, concordato − incassato)
  residuo_per: Record<Company, number>; // spettanza − incassato_per (può essere < 0)
  conguaglio: { da: Company; a: Company; importo_cents: number } | null;
  eccedenza_cents: number; // max(0, incassato − concordato)
  rate: Installment[];
  prossima_scadenza: Installment | null;
  avvisi: string[];
}

export interface GrossSplit {
  santo_stefano: number;
  iovino: number;
  /** false quando il `splitKey` non è riconosciuto (fallback 40/60 + avviso). */
  known: boolean;
}

/* ------------------------------------------------------------------ */
/* Costanti di split (tutto in centesimi)                              */
/* ------------------------------------------------------------------ */

// 40/60 sull'imponibile scorporato: denominatore = 0.40×1.22 + 0.60×1.10 = 1.148.
// Santo Stefano = round(0.488 × lordo / 1.148); Iovino = lordo − SS (il resto).
const SS_40_60_NUM = 488;
const DEN_40_60 = 1148;

// Quote fisse nette di Santo Stefano, convertite in lordo (×1.22 IVA).
const SS_FIXED_100_CENTS = 12200; // 100 € netti × 1.22
const SS_FIXED_50_CENTS = 6100; //  50 € netti × 1.22
const SS_FIXED_25_CENTS = 3050; //  25 € netti × 1.22

// After Party: base 1.750 € netti (1.750 × 1.148 = 2.009 € lordi) oltre i quali
// la quota SS resta fissa a 0.40 × 1.750 = 700 € netti = 854 € lordi.
const AFTER_PARTY_THRESHOLD_CENTS = 200900; // 1.750 × 1.148
const AFTER_PARTY_SS_CENTS = 85400; //    700 × 1.22

const DEFAULT_CAPARRA_CENTS = 150000; // € 1.500
const DEFAULT_SECONDO_ACCONTO_WEDDING_CENTS = 300000; // € 3.000
const CASH_WARNING_THRESHOLD_CENTS = 500000; // € 5.000

/* ------------------------------------------------------------------ */
/* Helper numerici                                                     */
/* ------------------------------------------------------------------ */

/** Converte euro (eventualmente float) in centesimi interi, in modo deterministico. */
export function euroToCents(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Converte centesimi interi in euro (solo per visualizzazione). */
export function centsToEuro(cents: number): number {
  return Number.isFinite(cents) ? cents / 100 : 0;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** Somma lorda di una riga servizio in centesimi (usa `totale` o prezzo × quantità). */
function itemGrossCents(item: QuoteItem | null | undefined): number {
  if (!item) return 0;
  const direct = Number(item.totale);
  if (Number.isFinite(direct) && direct !== 0) return euroToCents(direct);
  const unit = Number(item.prezzo_unitario ?? item.prezzoUnitario ?? 0);
  const qtyRaw = Number(item.quantita ?? 1);
  const qty = Number.isFinite(qtyRaw) ? qtyRaw : 1;
  return euroToCents(unit * qty);
}

/** Data (YYYY-MM-DD) estratta da un timestamp ISO o da una data già pulita. */
function dateOnly(value: unknown, fallback: string): string {
  const raw = String(value ?? '').trim();
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
  return match ? match[1] : fallback;
}

/* ------------------------------------------------------------------ */
/* Split sul lordo (scorporo IVA)                                      */
/* ------------------------------------------------------------------ */

interface ResolvedSplitRule {
  rule: string;
  known: boolean;
}

/**
 * Risolve la regola di split a partire da `splitKey` (primario) e `splitLabel`
 * (fallback per i vecchi record privi di key). Un `splitKey` non vuoto e
 * sconosciuto produce `known: false` (nessun fallback silenzioso).
 */
function resolveSplitRule(splitKey: string, splitLabel: string): ResolvedSplitRule {
  const key = String(splitKey || '').toLowerCase().trim();
  const label = String(splitLabel || '').toLowerCase().trim();

  if (key === '40_60' || key === 'ric_40_60' || label.includes('40%') || label.includes('60%')) {
    return { rule: '40_60', known: true };
  }
  if (key === 'ss100' || label.includes('100% santo stefano')) {
    return { rule: 'ss100', known: true };
  }
  if (key === 'i100' || label.includes('100% iovino')) {
    return { rule: 'i100', known: true };
  }
  if (
    key === 'ss100fixed' ||
    key === 'angle' ||
    key === 'angoli' ||
    label.includes('100 santo stefano') ||
    label.includes('angle')
  ) {
    return { rule: 'ss100fixed', known: true };
  }
  if (key === 'ss50' || label.includes('50 santo stefano')) {
    return { rule: 'ss50', known: true };
  }
  if (key === 'ss25' || key === 'ss25cap' || label.includes('25 santo stefano')) {
    return { rule: 'ss25', known: true };
  }
  if (key === 'after' || key === 'after_party') {
    return { rule: 'after_party', known: true };
  }
  if (!key) {
    // Nessuna indicazione: default storico 40/60, senza avviso.
    return { rule: '40_60', known: true };
  }
  // Chiave valorizzata ma non riconosciuta: 40/60 + avviso esplicito.
  return { rule: '40_60', known: false };
}

/**
 * Ripartisce un importo LORDO (IVA inclusa) tra le due società, scorporando
 * l'IVA. Santo Stefano è calcolato e Iovino è sempre il resto, così la somma
 * torna esattamente al centesimo.
 */
export function splitGross(lordoCents: number, splitKey = '', splitLabel = ''): GrossSplit {
  const lordo = Math.max(0, Math.trunc(Number(lordoCents) || 0));
  const { rule, known } = resolveSplitRule(splitKey, splitLabel);

  let ss = 0;
  switch (rule) {
    case 'ss100':
      ss = lordo;
      break;
    case 'i100':
      ss = 0;
      break;
    case 'ss100fixed':
      ss = Math.min(lordo, SS_FIXED_100_CENTS);
      break;
    case 'ss50':
      ss = Math.min(lordo, SS_FIXED_50_CENTS);
      break;
    case 'ss25':
      ss = Math.min(lordo, SS_FIXED_25_CENTS);
      break;
    case 'after_party':
      ss =
        lordo <= AFTER_PARTY_THRESHOLD_CENTS
          ? Math.round((SS_40_60_NUM * lordo) / DEN_40_60)
          : AFTER_PARTY_SS_CENTS;
      break;
    case '40_60':
    default:
      ss = Math.round((SS_40_60_NUM * lordo) / DEN_40_60);
      break;
  }

  ss = clamp(ss, 0, lordo);
  return { santo_stefano: ss, iovino: lordo - ss, known };
}

/* ------------------------------------------------------------------ */
/* Composizione del concordato                                         */
/* ------------------------------------------------------------------ */

/**
 * Canone Location/Fitto Villa in centesimi.
 * - Se la quote espone un canone esplicito, vale quello (100% Santo Stefano).
 * - Altrimenti, in assenza di righe, si usa `prezzo`/`totale` (contratti storici).
 * - Se ci sono righe, il canone 100% SS è già una riga `ss100`: non si somma due volte.
 */
function resolveCanoneCents(quote: Quote): number {
  if (quote.canone_cents != null) return Math.max(0, Math.trunc(Number(quote.canone_cents) || 0));
  if (quote.canone != null) return Math.max(0, euroToCents(quote.canone));

  const items = Array.isArray(quote.items) ? quote.items : [];
  if (items.length === 0) {
    const raw = quote.prezzo ?? quote.totale ?? quote.totale_calcolato ?? 0;
    return Math.max(0, euroToCents(raw));
  }
  return 0;
}

function isConfirmed(change: QuoteChange | null | undefined): boolean {
  return String(change?.status || '').toLowerCase() === 'confermato';
}

function isPending(change: QuoteChange | null | undefined): boolean {
  return String(change?.status || '').toLowerCase() === 'pending';
}

function changeTime(change: QuoteChange): number {
  const raw = change.confirmed_at || change.created_at || '';
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Righe servizio effettive: se esiste un Allegato B confermato, l'ultimo
 * `items_after` è la fonte autorevole (contiene l'intero paniere aggiornato).
 */
function resolveServiceItems(quote: Quote, confirmedChanges: QuoteChange[]): QuoteItem[] {
  const confirmed = confirmedChanges.filter(isConfirmed);
  if (confirmed.length > 0) {
    const last = [...confirmed].sort((a, b) => changeTime(a) - changeTime(b))[confirmed.length - 1];
    if (Array.isArray(last.items_after) && last.items_after.length > 0) {
      return last.items_after;
    }
  }
  return Array.isArray(quote.items) ? quote.items : [];
}

/* ------------------------------------------------------------------ */
/* Motore principale                                                   */
/* ------------------------------------------------------------------ */

/**
 * Calcola l'intero stato economico di un evento. Unica fonte di verità per
 * concordato, spettanze, incassi, rate e conguaglio inter-societario.
 */
export function computeEventLedger(
  quote: Quote,
  payments: Payment[] = [],
  confirmedChanges: QuoteChange[] = [],
  pendingChanges: QuoteChange[] = [],
  today: string = new Date().toISOString().slice(0, 10)
): EventLedger {
  const avvisi: string[] = [];

  /* --- Componenti del concordato --- */
  const canoneCents = resolveCanoneCents(quote);
  const serviceItems = resolveServiceItems(quote, confirmedChanges);

  let servicesGrossCents = 0;
  let ssFromServices = 0;
  let iovFromServices = 0;
  let unknownSplitKey = false;

  for (const item of serviceItems) {
    const gross = itemGrossCents(item);
    servicesGrossCents += gross;
    const split = splitGross(gross, item.splitKey ?? item.split_key, item.splitLabel ?? item.split_label);
    ssFromServices += split.santo_stefano;
    iovFromServices += split.iovino;
    if (!split.known) unknownSplitKey = true;
  }

  // Variazioni confermate senza `items_after`: si applica il solo delta.
  const hasConfirmedItems = confirmedChanges.some(
    (c) => isConfirmed(c) && Array.isArray(c.items_after) && c.items_after.length > 0
  );
  let extraDeltaCents = 0;
  let extraSs = 0;
  let extraIov = 0;
  if (!hasConfirmedItems) {
    for (const change of confirmedChanges.filter(isConfirmed)) {
      const delta = euroToCents(change.totale_after) - euroToCents(change.totale_before);
      if (delta === 0) continue;
      extraDeltaCents += delta;
      const split = splitGross(Math.abs(delta), '40_60');
      if (delta > 0) {
        extraSs += split.santo_stefano;
        extraIov += split.iovino;
      } else {
        extraSs -= split.santo_stefano;
        extraIov -= split.iovino;
      }
    }
  }

  // Sconto: ripartito pro-quota sulle righe servizio (default: non sul canone).
  const scontoCents =
    quote.sconto_cents != null
      ? Math.max(0, Math.trunc(Number(quote.sconto_cents) || 0))
      : Math.max(0, euroToCents(quote.sconto_fisso));

  let scontoSs = 0;
  let scontoIov = 0;
  if (scontoCents > 0) {
    if (servicesGrossCents > 0) {
      scontoSs = Math.round((scontoCents * ssFromServices) / servicesGrossCents);
      scontoIov = scontoCents - scontoSs;
    } else {
      scontoSs = Math.min(scontoCents, canoneCents);
      scontoIov = scontoCents - scontoSs;
    }
  }

  const concordatoCents = Math.max(
    0,
    canoneCents + servicesGrossCents + extraDeltaCents - scontoCents
  );

  let spettanzaSs = canoneCents + ssFromServices + extraSs - scontoSs;
  let spettanzaIov = iovFromServices + extraIov - scontoIov;
  if (spettanzaSs < 0) {
    spettanzaIov += spettanzaSs;
    spettanzaSs = 0;
  }
  if (spettanzaIov < 0) {
    spettanzaSs += spettanzaIov;
    spettanzaIov = 0;
  }
  // Il totale delle spettanze deve coincidere col concordato al centesimo.
  spettanzaSs = clamp(spettanzaSs, 0, concordatoCents);
  spettanzaIov = concordatoCents - spettanzaSs;

  /* --- Delta in attesa di firma (Allegati B pending) --- */
  const inAttesaFirmaDeltaCents = pendingChanges
    .filter(isPending)
    .reduce(
      (sum, change) =>
        sum + (euroToCents(change.totale_after) - euroToCents(change.totale_before)),
      0
    );

  /* --- Incassi reali --- */
  const validPayments = (payments || []).filter(
    (p) =>
      p &&
      p.stato !== 'annullato' &&
      Number.isInteger(p.importo_cents) &&
      p.importo_cents > 0
  );

  const incassatoPer: Record<Company, number> = { santo_stefano: 0, iovino: 0 };
  let incassatoCents = 0;
  let hasCashOverThreshold = false;

  for (const payment of validPayments) {
    incassatoCents += payment.importo_cents;
    if (payment.incassato_da === 'iovino') incassatoPer.iovino += payment.importo_cents;
    else incassatoPer.santo_stefano += payment.importo_cents;

    if (payment.metodo === 'contanti' && payment.importo_cents >= CASH_WARNING_THRESHOLD_CENTS) {
      hasCashOverThreshold = true;
    }
  }

  const residuoCents = Math.max(0, concordatoCents - incassatoCents);
  const eccedenzaCents = Math.max(0, incassatoCents - concordatoCents);

  /* --- Piano rate (derivato) --- */
  const dataEvento = dateOnly(quote.data_evento, '');
  const dataFirma = dateOnly(quote.data_firma || quote.signed_at || quote.created_at, today);

  const caparraCents =
    quote.importo_caparra != null
      ? Math.max(0, euroToCents(quote.importo_caparra))
      : Math.min(DEFAULT_CAPARRA_CENTS, concordatoCents);

  const isWedding = String(quote.tipo_evento || '').toLowerCase() === 'wedding';
  const secondoAccontoCents =
    quote.importo_secondo_acconto != null
      ? Math.max(0, euroToCents(quote.importo_secondo_acconto))
      : isWedding
        ? Math.min(DEFAULT_SECONDO_ACCONTO_WEDDING_CENTS, Math.max(0, concordatoCents - caparraCents))
        : 0;

  const saldoCents = Math.max(0, concordatoCents - caparraCents - secondoAccontoCents);

  const definitions: Array<Omit<Installment, 'coperto_cents' | 'stato' | 'in_ritardo'>> = [
    {
      key: 'caparra',
      label: 'Caparra confirmatoria',
      importo_cents: caparraCents,
      scadenza: dataFirma || null,
    },
    {
      key: 'secondo_acconto',
      label: 'Secondo acconto',
      importo_cents: secondoAccontoCents,
      scadenza: secondoAccontoCents > 0 && dataEvento ? sixMonthsBefore(dataEvento) : null,
    },
    {
      key: 'saldo',
      label: 'Saldo',
      importo_cents: saldoCents,
      scadenza: dataEvento || null,
    },
  ];
  const visibleDefinitions = definitions.filter((r) => r.importo_cents > 0);

  const rate: Installment[] = [];
  let sogliaPrecedente = 0;
  for (const def of visibleDefinitions) {
    const coperto = clamp(incassatoCents - sogliaPrecedente, 0, def.importo_cents);
    let stato: Installment['stato'];
    if (coperto === def.importo_cents) stato = 'saldata';
    else if (coperto > 0) stato = 'parziale';
    else if (def.scadenza && def.scadenza < today) stato = 'scaduta';
    else stato = 'da_pagare';

    rate.push({
      ...def,
      coperto_cents: coperto,
      stato,
      in_ritardo: stato !== 'saldata' && !!def.scadenza && def.scadenza < today,
    });
    sogliaPrecedente += def.importo_cents;
  }

  const prossimaScadenza =
    [...rate]
      .filter((r) => r.stato !== 'saldata')
      .sort((a, b) => String(a.scadenza || '9999-12-31').localeCompare(String(b.scadenza || '9999-12-31')))[0] ||
    null;

  /* --- Conguaglio inter-societario --- */
  const residuoPer: Record<Company, number> = {
    santo_stefano: spettanzaSs - incassatoPer.santo_stefano,
    iovino: spettanzaIov - incassatoPer.iovino,
  };

  let conguaglio: EventLedger['conguaglio'] = null;
  if (residuoPer.santo_stefano < 0 && residuoPer.iovino >= 0) {
    conguaglio = {
      da: 'santo_stefano',
      a: 'iovino',
      importo_cents: Math.abs(residuoPer.santo_stefano),
    };
  } else if (residuoPer.iovino < 0 && residuoPer.santo_stefano >= 0) {
    conguaglio = {
      da: 'iovino',
      a: 'santo_stefano',
      importo_cents: Math.abs(residuoPer.iovino),
    };
  }

  /* --- Avvisi --- */
  if (unknownSplitKey) avvisi.push('SPLITKEY_SCONOSCIUTA');
  if (eccedenzaCents > 0) avvisi.push('ECCEDENZA');
  if (hasCashOverThreshold) avvisi.push('CONTANTI_SOGLIA');

  return {
    concordato_cents: concordatoCents,
    in_attesa_firma_delta_cents: inAttesaFirmaDeltaCents,
    spettanza: { santo_stefano: spettanzaSs, iovino: spettanzaIov },
    incassato_cents: incassatoCents,
    incassato_per: incassatoPer,
    residuo_cents: residuoCents,
    residuo_per: residuoPer,
    conguaglio,
    eccedenza_cents: eccedenzaCents,
    rate,
    prossima_scadenza: prossimaScadenza,
    avvisi,
  };
}
