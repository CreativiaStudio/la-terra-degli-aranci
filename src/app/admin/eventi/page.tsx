import { getQuotesFast } from "@/lib/dataHelper";
import { getStore, getAllPaymentsLocal } from "@/lib/localDb";
import { computeEventLedger, type Payment, type Quote } from "@/lib/eventLedger";
import { deriveEventStage, getTurnoTime } from "@/lib/eventStage";
import EventiClient, { type EventoRow } from "./EventiClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Quote vista dalla pagina, con i campi opzionali usati per la mappatura. */
interface EventQuote extends Quote {
  turno?: string | null;
  numero_ospiti?: number | string | null;
  spazi_riservati?: string[] | null;
  note_visita_segreteria?: string | null;
  formula_opzione?: string | null;
  tipo_esclusiva?: string | null;
  clients?: Record<string, unknown> | null;
}

/** Stage che implicano un contratto firmato (incassi reali attivi). */
const SIGNED_STAGES = ["confermato", "in_regia", "svolto"];

/** Estrae 'YYYY-MM-DD' da un valore ISO, '' se non valido. */
function toIsoDate(value: unknown): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value ?? "").trim());
  return match ? match[1] : "";
}

/** Etichetta formula: Esclusiva / Sala Tufo / Sala Bianca. */
function formulaLabel(quote: EventQuote): string {
  const raw = String(quote.formula_opzione ?? "").toLowerCase().trim();
  const tipo = String(quote.tipo_esclusiva ?? "").toLowerCase().trim();

  if (raw === "esclusiva" || tipo === "esclusiva" || tipo === "exclusive") return "Esclusiva";
  if (raw.includes("tufo") || raw.includes("promesse")) return "Sala Tufo";
  if (raw.includes("bianca")) return "Sala Bianca";

  const spazi = Array.isArray(quote.spazi_riservati) ? quote.spazi_riservati : [];
  if (spazi.some((s) => /tufo|promesse/i.test(String(s)))) return "Sala Tufo";
  if (spazi.length > 0) return "Sala Bianca";

  return "—";
}

export default async function EventiPage() {
  // Warm-up del DB locale: garantisce che lo store esista anche su runtime
  // serverless (fs in /tmp) prima delle letture di quotes e pagamenti.
  getStore();

  const [quotes, payments] = await Promise.all([
    getQuotesFast(),
    Promise.resolve(getAllPaymentsLocal()),
  ]);

  // Indicizza i pagamenti per quote_id (match case-insensitive) per il ledger.
  const paymentsByQuote = new Map<string, Payment[]>();
  for (const payment of payments) {
    const key = String(payment?.quote_id ?? "").trim().toLowerCase();
    if (!key) continue;
    const bucket = paymentsByQuote.get(key);
    if (bucket) bucket.push(payment);
    else paymentsByQuote.set(key, [payment]);
  }

  const eventi: EventoRow[] = (quotes as EventQuote[])
    .filter((q) => Boolean(q && q.id))
    .map((q): EventoRow => {
      const ledger = computeEventLedger(
        q,
        paymentsByQuote.get(String(q.id).toLowerCase()) ?? []
      );
      const stage = deriveEventStage(q);

      const turnoTime = getTurnoTime(q.turno ?? undefined);
      const turno: EventoRow["turno"] =
        turnoTime.label === "Pranzo" ? "pranzo" : turnoTime.label === "Cena" ? "cena" : "";

      const clientRaw: Record<string, unknown> = q.clients ?? {};
      const spaziArr = Array.isArray(q.spazi_riservati)
        ? q.spazi_riservati.map((s) => String(s))
        : [];

      const prezzoTotale = Number(q.totale_calcolato ?? q.prezzo ?? q.totale ?? 0);

      return {
        id: String(q.id),
        codice: `TDA-${String(q.id).slice(0, 8).toUpperCase()}`,
        tipo: q.tipo_evento === "wedding" ? "wedding" : "privato",
        nome: String(clientRaw.nome ?? ""),
        cognome: String(clientRaw.cognome ?? ""),
        partnerNome: String(clientRaw.sposera_nome ?? clientRaw.partnerNome ?? ""),
        partnerCognome: String(clientRaw.sposera_cognome ?? clientRaw.partnerCognome ?? ""),
        telefono: String(clientRaw.telefono ?? ""),
        email: String(clientRaw.email ?? ""),
        dataEvento: toIsoDate(q.data_evento),
        turno,
        spazi: spaziArr.join(" · ") || formulaLabel(q),
        ospiti: Number(q.numero_ospiti || 0),
        note: q.note_visita_segreteria || "",
        stageKey: stage.stage,
        stageLabel: stage.label,
        stageColor: stage.badgeColor,
        isSigned: SIGNED_STAGES.includes(stage.stage),
        totaleCents: Math.round(prezzoTotale * 100),
        incassatoCents: ledger.incassato_cents,
        residuoCents: ledger.residuo_cents,
      };
    })
    .sort((a, b) => String(b.dataEvento || "").localeCompare(String(a.dataEvento || "")));

  return <EventiClient events={eventi} />;
}
