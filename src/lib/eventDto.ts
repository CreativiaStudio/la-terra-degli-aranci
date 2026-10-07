/**
 * eventDto.ts — Proiezioni whitelist (server-side) dei dati evento, per segregare
 * rigidamente ciò che ogni ruolo può vedere.
 *
 *  - Admin   → accesso totale (quote + ledger + split societario + note interne).
 *  - Planner → zero prezzi/totali/rate/IBAN/split: solo dati operativi evento.
 *  - Cliente → dati evento + rate con importi/residui, ma nessun dato societario.
 *
 * Le funzioni sono PURE e usano `import type` per `Quote`/`EventLedger`, così non
 * trascinano dipendenze server-only nel bundle client.
 */

import type { Quote } from "./localDb";
import type { EventLedger } from "./eventLedger";
import { deriveEventStage } from "./eventStage";

/* ------------------------------------------------------------------ */
/* DTO                                                                 */
/* ------------------------------------------------------------------ */

export interface AdminEventDTO {
  /** Accesso totale: dati quote, anagrafica, ledger economico, split societario, note interne. */
  quote: Quote;
  ledger: EventLedger;
  role: "admin";
}

export interface PlannerEventDTO {
  /** Accesso Wedding Planner: zero prezzi, zero totali, zero rate, zero iban, zero split! */
  id: string;
  data_evento?: string;
  turno?: string;
  formula?: string;
  numero_ospiti?: number;
  client: {
    nome: string;
    cognome: string;
    telefono?: string;
    email?: string;
  };
  servizi: Array<{
    nome: string;
    categoria?: string;
    quantita: number;
    note?: string;
  }>;
  stage: string;
  role: "planner";
}

export interface ClientEventDTO {
  /** Accesso Sposi: dati evento, diary, rate con importo/residuo, nessun dato societario né note interne. */
  id: string;
  data_evento?: string;
  turno?: string;
  formula?: string;
  stage: string;
  concordato_cents: number;
  incassato_cents: number;
  residuo_cents: number;
  rate: Array<{
    label: string;
    importo_cents: number;
    scadenza: string | null;
    stato: string;
  }>;
  isSigned: boolean;
  role: "cliente";
}

/* ------------------------------------------------------------------ */
/* Helper interni                                                      */
/* ------------------------------------------------------------------ */

type AnyRecord = Record<string, any>;

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function optString(value: unknown): string | undefined {
  const s = String(value ?? "").trim();
  return s ? s : undefined;
}

/* ------------------------------------------------------------------ */
/* Proiezioni                                                          */
/* ------------------------------------------------------------------ */

export function toAdminEventDTO(quote: Quote, ledger: EventLedger): AdminEventDTO {
  return { quote, ledger, role: "admin" };
}

export function toPlannerEventDTO(quote: Quote): PlannerEventDTO {
  const q = asRecord(quote);
  const client = asRecord(q.clients);
  const items = Array.isArray(q.items) ? (q.items as unknown[]) : [];

  return {
    id: String(q.id ?? ""),
    data_evento: optString(q.data_evento),
    turno: optString(q.turno),
    formula: optString(q.formula_opzione ?? q.tipo_esclusiva),
    numero_ospiti: Number.isFinite(Number(q.numero_ospiti)) ? Number(q.numero_ospiti) : undefined,
    client: {
      nome: String(client.nome ?? ""),
      cognome: String(client.cognome ?? ""),
      telefono: optString(client.telefono),
      email: optString(client.email),
    },
    // Whitelist operativa: NESSUN prezzo, totale, split o nota economica.
    servizi: items.map((raw) => {
      const item = asRecord(raw);
      const qtyRaw = Number(item.quantita ?? item.qty ?? 1);
      return {
        nome: String(item.nome ?? item.descrizione ?? item.titoloBase ?? "Servizio"),
        categoria: optString(item.categoria),
        quantita: Number.isFinite(qtyRaw) ? qtyRaw : 0,
        note: optString(item.note),
      };
    }),
    stage: deriveEventStage(quote).stage,
    role: "planner",
  };
}

export function toClientEventDTO(
  quote: Quote,
  ledger: EventLedger,
  isSigned: boolean
): ClientEventDTO {
  const q = asRecord(quote);

  return {
    id: String(q.id ?? ""),
    data_evento: optString(q.data_evento),
    turno: optString(q.turno),
    formula: optString(q.formula_opzione ?? q.tipo_esclusiva),
    stage: deriveEventStage(quote).stage,
    concordato_cents: ledger.concordato_cents,
    incassato_cents: ledger.incassato_cents,
    residuo_cents: ledger.residuo_cents,
    // Rate con importo e residuo, ma senza alcun dato societario o split.
    rate: ledger.rate.map((rate) => ({
      label: rate.label,
      importo_cents: rate.importo_cents,
      scadenza: rate.scadenza,
      stato: rate.stato,
    })),
    isSigned,
    role: "cliente",
  };
}
