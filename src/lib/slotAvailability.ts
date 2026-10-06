/**
 * slotAvailability.ts
 * Verifica della disponibilità di una data/turno/spazi considerando preventivi,
 * contratti firmati e contratti finali presenti nel database locale.
 *
 * Regole di business (Art. 2-bis):
 *  - un evento "esclusiva" (firmato o opzionato attivo) occupa l'intera giornata;
 *  - un evento "semi_esclusiva" occupa solo il turno e gli spazi indicati;
 *  - una semi-esclusiva entra in conflitto se nello stesso giorno esiste
 *    un'esclusiva, oppure un'altra semi-esclusiva nello stesso turno con spazi
 *    sovrapposti.
 */

import { getAllQuotesLocal, getLocalStore } from "@/lib/localDb";
import { isoToItalian, isValidDateParts } from "@/lib/dateInput";

export type TipoEsclusiva = "esclusiva" | "semi_esclusiva";
export type OptionStato = "attiva" | "in_prelazione" | "scaduta" | "convertita" | "rilasciata";

/** Durata standard dell'opzione in giorni. */
export const OPTION_DAYS = 7;
/** Finestra di prelazione (diritto di precedenza) dopo la scadenza dell'opzione. */
export const OPTION_GRACE_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const BOOKED_STATUSES = ["firmato", "convertito", "confermato"];
const BOOKED_FASI = ["firmato", "convertito", "accordo_diretto"];
const CANCELLED_STATUSES = [
  "annullato",
  "annullata",
  "cancellato",
  "archiviato",
  "scaduto",
  "ricusato",
  "rilasciato",
  "rilasciata",
];

export interface OptionState {
  /** Stato calcolato dell'opzione. */
  stato: OptionStato;
  /** True se l'opzione blocca ancora la disponibilità (attiva o in prelazione). */
  active: boolean;
  /** Scadenza calcolata in formato ISO, se determinabile. */
  scadenza: string | null;
  /** Giorni residui alla scadenza (negativi se già scaduta). */
  giorniResidui: number | null;
}

export interface SlotAvailabilityResult {
  available: boolean;
  conflictReason?: string;
}

interface Reservation {
  quoteId: string;
  date: string;
  turno?: string;
  tipo: TipoEsclusiva;
  spazi: string[];
  source: "quote" | "signed_contract" | "final_contract";
}

/* --------------------------- utilità interne --------------------------- */

/**
 * Normalizza una data evento in ISO `yyyy-mm-dd`.
 * Accetta sia `yyyy-mm-dd` (anche con componente oraria) sia `gg/mm/aaaa`.
 * Non applica il vincolo d'età: le date degli eventi sono future.
 */
export function normalizeEventDate(value?: string | null): string | null {
  const s = String(value ?? "").trim();
  if (!s) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const [, year, month, day] = iso;
    return isValidDateParts(Number(day), Number(month), Number(year))
      ? `${year}-${month}-${day}`
      : null;
  }

  const ita = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (ita) {
    const [, day, month, year] = ita;
    return isValidDateParts(Number(day), Number(month), Number(year))
      ? `${year}-${month}-${day}`
      : null;
  }

  return null;
}

function normalizeSpazi(spazi?: any): string[] {
  if (!spazi) return [];
  const arr = Array.isArray(spazi) ? spazi : [spazi];
  return arr.map(s => String(s).trim().toLowerCase()).filter(Boolean);
}

function turniOverlap(a?: string, b?: string): boolean {
  if (!a || !b) return true; // turno ignoto => prudenzialmente in conflitto
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function spaziOverlap(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) return true; // spazi ignoti => prudenzialmente sovrapposti
  return a.some(x => b.includes(x));
}

function quoteTipo(q: any): TipoEsclusiva {
  const raw = String(q?.tipo_esclusiva || q?.opzione?.tipo || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  return raw === "semi_esclusiva" ? "semi_esclusiva" : "esclusiva";
}

function shortId(id?: string): string {
  const s = String(id || "").trim();
  return s ? s.slice(0, 8).toUpperCase() : "n/d";
}

function isExcluded(quoteId: string, excludeQuoteId?: string): boolean {
  if (!excludeQuoteId) return false;
  const a = String(quoteId || "").toLowerCase();
  const b = String(excludeQuoteId).toLowerCase();
  if (!a) return false;
  return a === b || a.startsWith(b) || b.startsWith(a);
}

/* ------------------------------ opzioni ------------------------------ */

/**
 * Calcola lo stato dell'opzione (7 giorni) di un preventivo.
 *
 * Precedenze: rilasciata > convertita > (attiva | in_prelazione | scaduta).
 * Dopo i 7 giorni standard si apre una finestra di prelazione (diritto di
 * precedenza) prima che l'opzione risulti definitivamente scaduta.
 */
export function getOptionState(quote: any, now: Date = new Date()): OptionState {
  const op = quote?.opzione && typeof quote.opzione === "object" ? quote.opzione : {};
  const status = String(quote?.status || "").toLowerCase();
  const fase = String(quote?.fase_contratto || "").toLowerCase();

  const released =
    op.rilasciata === true ||
    op.stato === "rilasciata" ||
    ["rilasciato", "rilasciata", "annullato", "annullata"].includes(status);
  if (released) {
    return { stato: "rilasciata", active: false, scadenza: null, giorniResidui: null };
  }

  const converted =
    op.convertita === true ||
    op.stato === "convertita" ||
    BOOKED_STATUSES.includes(status) ||
    fase === "firmato" ||
    fase === "convertito";
  if (converted) {
    return { stato: "convertita", active: false, scadenza: null, giorniResidui: null };
  }

  const hasOption =
    op.attiva === true ||
    op.data_inizio != null ||
    op.data != null ||
    op.start != null ||
    op.scadenza != null ||
    op.scadenza_data != null ||
    quote?.opzione_scadenza != null;
  if (!hasOption) {
    return { stato: "scaduta", active: false, scadenza: null, giorniResidui: null };
  }

  let deadline: Date | null = null;
  const explicit = op.scadenza || op.scadenza_data || quote?.opzione_scadenza;
  if (explicit) {
    const d = new Date(explicit);
    if (!isNaN(d.getTime())) deadline = d;
  }
  if (!deadline) {
    const start = op.data_inizio || op.data || op.start || quote?.created_at;
    if (start) {
      const s = new Date(start);
      if (!isNaN(s.getTime())) deadline = new Date(s.getTime() + OPTION_DAYS * MS_PER_DAY);
    }
  }
  if (!deadline) {
    return { stato: "scaduta", active: false, scadenza: null, giorniResidui: null };
  }

  const msLeft = deadline.getTime() - now.getTime();
  const giorniResidui = Math.ceil(msLeft / MS_PER_DAY);
  if (msLeft >= 0) {
    return { stato: "attiva", active: true, scadenza: deadline.toISOString(), giorniResidui };
  }
  // Le opzioni rapide da calendario dichiarano la propria prelazione (24h).
  const graceMs =
    typeof op.prelazione_ore === "number" && op.prelazione_ore >= 0
      ? op.prelazione_ore * 60 * 60 * 1000
      : OPTION_GRACE_DAYS * MS_PER_DAY;
  if (msLeft + graceMs >= 0) {
    return { stato: "in_prelazione", active: true, scadenza: deadline.toISOString(), giorniResidui };
  }
  return { stato: "scaduta", active: false, scadenza: deadline.toISOString(), giorniResidui };
}

/** Scorciatoia: restituisce solo la stringa dello stato dell'opzione. */
export function getOptionStato(quote: any, now: Date = new Date()): OptionStato {
  return getOptionState(quote, now).stato;
}

/* --------------------------- prenotazioni --------------------------- */

function quoteReservation(q: any, now: Date): Reservation | null {
  const date = normalizeEventDate(q?.data_evento);
  if (!date) return null;

  const status = String(q?.status || "").toLowerCase();
  if (CANCELLED_STATUSES.includes(status)) return null;

  const fase = String(q?.fase_contratto || "").toLowerCase();
  const booked =
    BOOKED_STATUSES.includes(status) || BOOKED_FASI.includes(fase) || q?.fase_contratto === "firmato";
  const active = booked || getOptionState(q, now).active;
  if (!active) return null;

  return {
    quoteId: String(q?.id || ""),
    date,
    turno: q?.turno || q?.turno_evento || q?.opzione?.turno || undefined,
    tipo: quoteTipo(q),
    spazi: normalizeSpazi(q?.spazi_riservati || q?.spazi_selezionati || q?.opzione?.spazi),
    source: "quote",
  };
}

function contractReservation(
  c: any,
  source: "signed_contract" | "final_contract"
): Reservation | null {
  const date = normalizeEventDate(
    c?.data_evento || c?.datiCliente?.data_evento || c?.giorno_ed_ora_evento
  );
  if (!date) return null;

  const status = String(c?.status || "").toLowerCase();
  if (CANCELLED_STATUSES.includes(status)) return null;

  const rawTipo = String(c?.tipo_esclusiva || c?.datiCliente?.tipo_esclusiva || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");

  return {
    quoteId: String(c?.quote_id || c?.preventivo || c?.id || ""),
    date,
    turno: c?.turno || c?.datiCliente?.turno || undefined,
    tipo: rawTipo === "semi_esclusiva" ? "semi_esclusiva" : "esclusiva",
    spazi: normalizeSpazi(c?.spazi_riservati || c?.datiCliente?.spazi_riservati),
    source,
  };
}

/**
 * Restituisce tutte le prenotazioni attive (firmate o opzionate) note al sistema.
 */
export function getActiveReservations(now: Date = new Date()): Reservation[] {
  const reservations: Reservation[] = [];

  let quotes: any[] = [];
  try {
    quotes = getAllQuotesLocal();
  } catch {
    quotes = [];
  }

  const quoteIds = new Set(quotes.map(q => String(q.id || "").toLowerCase()));

  for (const q of quotes) {
    const r = quoteReservation(q, now);
    if (r) reservations.push(r);
  }

  let store: any = {};
  try {
    store = getLocalStore();
  } catch {
    store = {};
  }

  const contractSources: Array<{
    items: any[];
    source: "signed_contract" | "final_contract";
  }> = [
    { items: store?.signed_contracts || [], source: "signed_contract" },
    { items: store?.final_contracts || [], source: "final_contract" },
  ];

  for (const { items, source } of contractSources) {
    for (const c of items) {
      const qid = String(c?.quote_id || c?.preventivo || "").toLowerCase();
      // Se esiste già il preventivo collegato, la prenotazione è già stata raccolta.
      if (qid && Array.from(quoteIds).some(id => id.startsWith(qid))) continue;
      const r = contractReservation(c, source);
      if (r) reservations.push(r);
    }
  }

  return reservations;
}

/* --------------------------- disponibilità --------------------------- */

/**
 * Verifica la disponibilità di una data per una nuova prenotazione.
 *
 * @param date Data evento (`yyyy-mm-dd` o `gg/mm/aaaa`).
 * @param turno Turno richiesto (`pranzo` | `cena`), per le semi-esclusive.
 * @param tipoEsclusiva Formula richiesta (`esclusiva` | `semi_esclusiva`).
 * @param spazi Spazi richiesti, per le semi-esclusive.
 * @param excludeQuoteId Preventivo da escludere dal controllo (modifica).
 */
export function checkSlotAvailability(
  date: string,
  turno?: string,
  tipoEsclusiva?: TipoEsclusiva | string,
  spazi?: string[],
  excludeQuoteId?: string
): SlotAvailabilityResult {
  const targetDate = normalizeEventDate(date);
  if (!targetDate) {
    return {
      available: false,
      conflictReason: "Data non valida: indicare la data nel formato gg/mm/aaaa o aaaa-mm-gg.",
    };
  }

  const rawTipo = String(tipoEsclusiva || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  const tipo: TipoEsclusiva = rawTipo === "esclusiva" ? "esclusiva" : "semi_esclusiva";
  const requestedTurno = turno ? String(turno).toLowerCase() : undefined;
  const requestedSpazi = normalizeSpazi(spazi);

  const now = new Date();
  const sameDay = getActiveReservations(now).filter(
    r => r.date === targetDate && !isExcluded(r.quoteId, excludeQuoteId)
  );

  if (sameDay.length === 0) return { available: true };

  const dataLabel = isoToItalian(targetDate) || targetDate;
  const exclusive = sameDay.find(r => r.tipo === "esclusiva");

  // Richiesta in esclusiva: serve l'intera struttura libera.
  if (tipo === "esclusiva") {
    if (exclusive) {
      return {
        available: false,
        conflictReason: `Data non disponibile: il ${dataLabel} è già riservato in esclusiva (preventivo ${shortId(
          exclusive.quoteId
        )}).`,
      };
    }
    const other = sameDay[0];
    return {
      available: false,
      conflictReason: `Data non disponibile: il ${dataLabel} ospita già un altro evento e non può essere concesso in esclusiva (preventivo ${shortId(
        other.quoteId
      )}).`,
    };
  }

  // Semi-esclusiva: bloccata da un'esclusiva già presente.
  if (exclusive) {
    return {
      available: false,
      conflictReason: `Data non disponibile in semi-esclusiva: il ${dataLabel} è già riservato in esclusiva (preventivo ${shortId(
        exclusive.quoteId
      )}).`,
    };
  }

  // Semi-esclusiva: conflitto solo con un'altra semi-esclusiva nello stesso turno con spazi sovrapposti.
  const semiSameTurno = sameDay.filter(
    r => r.tipo === "semi_esclusiva" && turniOverlap(requestedTurno, r.turno)
  );
  const overlap = semiSameTurno.find(r => spaziOverlap(requestedSpazi, r.spazi));

  if (overlap) {
    const turnoLabel = requestedTurno ? `turno ${requestedTurno}` : "turno indicato";
    return {
      available: false,
      conflictReason: `Turno non disponibile: un'altra semi-esclusiva nello stesso ${turnoLabel} occupa spazi sovrapposti (preventivo ${shortId(
        overlap.quoteId
      )}).`,
    };
  }

  return { available: true };
}
