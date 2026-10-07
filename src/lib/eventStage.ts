/**
 * eventStage.ts — Derivazione dello stato (stage) di un evento e regole di
 * conflitto sulla disponibilità di data/turno/spazi de La Terra degli Aranci.
 *
 * Il modulo è PURO e CLIENT-SAFE: importa `Quote` solo come *tipo* (`import type`),
 * quindi non trascina mai nel bundle la dipendenza server-only di `localDb`
 * (`fs`, `path`, `crypto`). Può essere usato sia nei Server Component sia nei
 * Client Component.
 *
 * Regole di business non negoziabili:
 *  1. PRANZO (12:30) e CENA (19:30) sono turni COMPLETAMENTE INDIPENDENTI.
 *     Un'esclusiva a pranzo NON blocca la cena.
 *  2. Un'esclusiva valida (stage != archiviato) blocca il proprio turno a chiunque.
 *  3. Un evento richiesto in esclusiva richiede l'intero turno: se esiste già
 *     qualsiasi evento in quel turno, c'è conflitto.
 *  4. Due semi-esclusive coesistono nello stesso turno solo se una è `sala_bianca`
 *     e l'altra `sala_tufo`; stessa sala => conflitto.
 */

import type { Quote } from "./localDb";

/* ------------------------------------------------------------------ */
/* Tipi                                                                */
/* ------------------------------------------------------------------ */

export type EventStage =
  | "archiviato"
  | "svolto"
  | "in_regia"
  | "confermato"
  | "in_firma"
  | "opzione"
  | "preventivo"
  | "lead";

export interface EventStageInfo {
  stage: EventStage;
  label: string;
  /** Colore HEX di sfondo del badge (testo bianco per contrasto). */
  badgeColor: string;
  descrizione: string;
}

export interface EventStageCtx {
  /** Data di riferimento 'YYYY-MM-DD' (default: oggi). */
  today?: string;
  /** Forza lo stato "firmato" (es. presenza in `signed_contracts`). */
  isSigned?: boolean;
  /** Forza la presenza di un'opzione pendente/attiva. */
  hasPendingOption?: boolean;
}

export interface VenueConflictResult {
  hasConflict: boolean;
  reason?: string;
  conflictingQuoteId?: string;
}

type TurnoNorm = "pranzo" | "cena" | "";
type FormulaNorm = "esclusiva" | "sala_bianca" | "sala_tufo";

/* ------------------------------------------------------------------ */
/* Catalogo stati                                                      */
/* ------------------------------------------------------------------ */

const STAGES: Record<EventStage, Omit<EventStageInfo, "stage">> = {
  archiviato: {
    label: "Archiviato",
    badgeColor: "#6b7280",
    descrizione: "Evento concluso, annullato o archiviato negli storici.",
  },
  svolto: {
    label: "Svolto",
    badgeColor: "#0d9488",
    descrizione: "Evento già svolto, in attesa di archiviazione definitiva.",
  },
  in_regia: {
    label: "In Regia",
    badgeColor: "#7c3aed",
    descrizione: "Contratto firmato: regia operativa attiva (planner -6 mesi).",
  },
  confermato: {
    label: "Confermato",
    badgeColor: "#16a34a",
    descrizione: "Contratto firmato e confermato.",
  },
  in_firma: {
    label: "In Firma",
    badgeColor: "#d97706",
    descrizione: "Contratto pronto, in attesa della firma digitale degli sposi.",
  },
  opzione: {
    label: "Opzione",
    badgeColor: "#2563eb",
    descrizione: "Data opzionata, in attesa di conferma entro la scadenza.",
  },
  preventivo: {
    label: "Preventivo",
    badgeColor: "#0891b2",
    descrizione: "Preventivo inviato, in trattativa con i clienti.",
  },
  lead: {
    label: "Lead",
    badgeColor: "#e58c2c",
    descrizione: "Contatto raccolto (tour o web), da qualificare.",
  },
};

/* ------------------------------------------------------------------ */
/* Helper interni                                                      */
/* ------------------------------------------------------------------ */

function str(value: unknown): string {
  return String(value ?? "").trim();
}

/** Data in formato 'YYYY-MM-DD' da un valore ISO/italiano; '' se non valida. */
function onlyDate(value: unknown): string {
  const raw = str(value);
  if (!raw) return "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const ita = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (ita) return `${ita[3]}-${ita[2]}-${ita[1]}`;
  return "";
}

/** Giorni tra due date ISO (positivo se `to` è dopo `from`). */
function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T00:00:00Z`);
  const b = Date.parse(`${toIso}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.POSITIVE_INFINITY;
  return Math.round((b - a) / 86_400_000);
}

/** Normalizza un turno testuale in 'pranzo' | 'cena' ('' se ignoto). */
export function normalizeTurno(value: unknown): TurnoNorm {
  const raw = str(value).toLowerCase();
  if (!raw) return "";
  if (raw.includes("pranzo") || raw.includes("lunch") || raw.includes("mattin") || raw === "12:30") {
    return "pranzo";
  }
  if (raw.includes("cena") || raw.includes("dinner") || raw.includes("sera") || raw === "19:30") {
    return "cena";
  }
  return "";
}

/** Normalizza una formula in 'esclusiva' | 'sala_bianca' | 'sala_tufo'. */
export function normalizeFormula(value: unknown): FormulaNorm {
  const raw = str(value).toLowerCase();
  if (raw === "esclusiva" || raw === "exclusive") return "esclusiva";
  if (raw === "sala_tufo" || raw.includes("tufo") || raw.includes("promesse")) return "sala_tufo";
  return "sala_bianca";
}

function isArchivedStatus(status: string): boolean {
  return [
    "archiviato",
    "archiviata",
    "annullato",
    "annullata",
    "cancellato",
    "cancellata",
    "ricusato",
    "ricusata",
    "rilasciato",
    "rilasciata",
  ].includes(status);
}

function hasOption(quote: Partial<Quote>): boolean {
  const anyQuote = quote as Record<string, any>;
  const op = anyQuote.opzione;
  if (op && typeof op === "object" && op.attiva === true) return true;
  const fase = str(anyQuote.fase_contratto).toLowerCase();
  if (fase === "opzione_rapida") return true;
  return str(anyQuote.status).toLowerCase() === "opzione";
}

/* ------------------------------------------------------------------ */
/* Deriviazione stage                                                  */
/* ------------------------------------------------------------------ */

/**
 * Determina lo stage di pipeline dell'evento in modo deterministico.
 * Precedenza: archiviato > (firmato: svolto/in_regia/confermato) > opzione >
 * in_firma > lead > preventivo.
 */
export function deriveEventStage(
  quote: Partial<Quote>,
  ctx: EventStageCtx = {}
): EventStageInfo {
  const anyQuote = quote as Record<string, any>;
  const today = onlyDate(ctx.today) || new Date().toISOString().slice(0, 10);

  const status = str(anyQuote.status).toLowerCase();
  const fase = str(anyQuote.fase_contratto).toLowerCase();
  const canale = str(anyQuote.canale_contratto).toLowerCase();
  const source = str(anyQuote.source).toLowerCase();
  const dataEvento = onlyDate(anyQuote.data_evento);
  const signedAt = str(anyQuote.data_firma) || str(anyQuote.signed_at);

  let stage: EventStage;

  if (isArchivedStatus(status)) {
    stage = "archiviato";
  } else {
    const signed = ctx.isSigned === true || status === "firmato" || Boolean(signedAt);

    if (signed) {
      if (dataEvento && dataEvento < today) {
        stage = "svolto";
      } else if (dataEvento) {
        stage = daysBetween(today, dataEvento) <= 180 ? "in_regia" : "confermato";
      } else {
        stage = "confermato";
      }
    } else if (ctx.hasPendingOption === true || hasOption(quote)) {
      stage = "opzione";
    } else {
      const pendingFirma =
        fase === "accordo_diretto" ||
        canale === "accordo_diretto" ||
        source === "admin_rapido" ||
        status === "convertito";

      if (pendingFirma) {
        stage = "in_firma";
      } else {
        const items = Array.isArray(anyQuote.items) ? (anyQuote.items as unknown[]) : [];
        const prezzo = Number(anyQuote.prezzo ?? anyQuote.totale ?? anyQuote.totale_calcolato ?? 0);
        const isLead =
          status === "bozza_visita" ||
          source === "tablet_segreteria" ||
          (!dataEvento && items.length === 0 && !(prezzo > 0));

        if (isLead) {
          stage = "lead";
        } else if (
          ["inviato", "accettato", "preventivo"].includes(status) ||
          items.length > 0 ||
          prezzo > 0
        ) {
          stage = "preventivo";
        } else {
          stage = "lead";
        }
      }
    }
  }

  return { stage, ...STAGES[stage] };
}

/* ------------------------------------------------------------------ */
/* Turni                                                               */
/* ------------------------------------------------------------------ */

const TURNO_TIMES: Record<"pranzo" | "cena", { time: string; label: string }> = {
  pranzo: { time: "12:30", label: "Pranzo" },
  cena: { time: "19:30", label: "Cena" },
};

/** Orario e etichetta ufficiale del turno (pranzo 12:30 / cena 19:30). */
export function getTurnoTime(turno?: string): {
  time: string;
  label: string;
  isPranzo: boolean;
} {
  const norm = normalizeTurno(turno);
  if (norm === "pranzo") {
    return { time: TURNO_TIMES.pranzo.time, label: TURNO_TIMES.pranzo.label, isPranzo: true };
  }
  if (norm === "cena") {
    return { time: TURNO_TIMES.cena.time, label: TURNO_TIMES.cena.label, isPranzo: false };
  }
  return { time: "—", label: "Turno da definire", isPranzo: false };
}

/* ------------------------------------------------------------------ */
/* Conflitti di disponibilità                                          */
/* ------------------------------------------------------------------ */

function resolveQuoteFormula(quote: Partial<Quote>): FormulaNorm {
  const anyQuote = quote as Record<string, any>;
  const formulaOpzione = str(anyQuote.formula_opzione);
  const tipo = str(anyQuote.tipo_esclusiva).toLowerCase();

  if (normalizeFormula(formulaOpzione) === "esclusiva" || tipo === "esclusiva" || tipo === "exclusive") {
    return "esclusiva";
  }
  if (formulaOpzione) return normalizeFormula(formulaOpzione);

  const spazi = Array.isArray(anyQuote.spazi_riservati) ? (anyQuote.spazi_riservati as unknown[]) : [];
  const tufo = spazi.some((s) => /tufo|promesse/i.test(String(s)));
  return tufo ? "sala_tufo" : "sala_bianca";
}

function resolveQuoteTurno(quote: Partial<Quote>): TurnoNorm {
  const anyQuote = quote as Record<string, any>;
  return normalizeTurno(anyQuote.turno ?? anyQuote.turno_evento ?? anyQuote.opzione?.turno);
}

function isExcluded(quoteId: string, excludeQuoteId?: string): boolean {
  if (!excludeQuoteId) return false;
  const a = str(quoteId).toLowerCase();
  const b = str(excludeQuoteId).toLowerCase();
  if (!a) return false;
  return a === b || a.startsWith(b) || b.startsWith(a);
}

function formulaLabel(formula: FormulaNorm): string {
  if (formula === "esclusiva") return "esclusiva";
  return formula === "sala_tufo" ? "Sala Tufo" : "Sala Bianca";
}

/**
 * Verifica se una nuova prenotazione (data/turno/formula) entra in conflitto con
 * le quote esistenti. Le regole sono quelle dell'Art. 2-bis riviste: pranzo e cena
 * sono turni indipendenti e l'esclusiva blocca solo il proprio turno.
 */
export function checkVenueConflict(
  targetDate: string,
  targetTurno: "pranzo" | "cena" | string,
  targetFormula: "esclusiva" | "sala_bianca" | "sala_tufo" | string,
  existingQuotes: Array<Partial<Quote>>,
  excludeQuoteId?: string
): VenueConflictResult {
  const target = onlyDate(targetDate);
  if (!target) return { hasConflict: false };

  const turnoTarget = normalizeTurno(targetTurno);
  const formulaTarget = normalizeFormula(targetFormula);
  const targetExclusive = formulaTarget === "esclusiva";

  for (const quote of existingQuotes || []) {
    if (!quote) continue;

    const qid = str((quote as Record<string, any>).id);
    if (isExcluded(qid, excludeQuoteId)) continue;
    if (onlyDate((quote as Record<string, any>).data_evento) !== target) continue;

    if (deriveEventStage(quote).stage === "archiviato") continue;

    const quoteTurno = resolveQuoteTurno(quote);
    const sameTurno = !quoteTurno || !turnoTarget || quoteTurno === turnoTarget;
    if (!sameTurno) continue;

    const quoteFormula = resolveQuoteFormula(quote);
    const turnoLabel = turnoTarget || "indicato";
    const ref = qid ? ` (rif. ${qid.slice(0, 8).toUpperCase()})` : "";

    // Regola 3: la richiesta in esclusiva richiede l'intero turno libero.
    if (targetExclusive) {
      return {
        hasConflict: true,
        reason: `Il turno ${turnoLabel} del ${target} è già occupato: non è concedibile in esclusiva${ref}.`,
        conflictingQuoteId: qid || undefined,
      };
    }

    // Regola 2: un'esclusiva esistente blocca il proprio turno a chiunque.
    if (quoteFormula === "esclusiva") {
      return {
        hasConflict: true,
        reason: `Il turno ${turnoLabel} del ${target} è già riservato in esclusiva${ref}.`,
        conflictingQuoteId: qid || undefined,
      };
    }

    // Regola 4: due semi-esclusive coesistono solo con sale diverse.
    if (quoteFormula === formulaTarget) {
      return {
        hasConflict: true,
        reason: `Nel turno ${turnoLabel} del ${target} è già attiva una semi-esclusiva in ${formulaLabel(
          quoteFormula
        )}${ref}. Scegli l'altra sala o un altro turno.`,
        conflictingQuoteId: qid || undefined,
      };
    }

    // Sale diverse nello stesso turno: coesistenza consentita.
  }

  return { hasConflict: false };
}
