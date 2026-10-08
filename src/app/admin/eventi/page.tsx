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
  const store = getStore();

  const [quotes, payments] = await Promise.all([
    getQuotesFast(),
    Promise.resolve(getAllPaymentsLocal()),
  ]);

  // Chiavi dei contratti già firmati/finalizzati (`signed_contracts` +
  // `final_contracts`), normalizzate lowercase/trim. Come in
  // `collectContractKeys` includiamo anche il prefisso a 8 caratteri (numero
  // preventivo) per tollerare gli id troncati usati nel resto dell'ecosistema.
  const signedQuoteIds = new Set<string>();
  for (const contract of [
    ...(store.signed_contracts ?? []),
    ...(store.final_contracts ?? []),
  ]) {
    if (!contract) continue;
    const record = contract as Record<string, unknown>;
    for (const value of [record.quote_id, record.preventivo, record.quoteId]) {
      if (!value) continue;
      const key = String(value).trim().toLowerCase();
      if (!key) continue;
      signedQuoteIds.add(key);
      signedQuoteIds.add(key.slice(0, 8));
    }
  }

  /**
   * Un contratto è firmato se lo status è 'firmato', se è stata registrata una
   * firma (`signed_at` / `data_firma`) oppure se compare tra i contratti
   * firmati/finalizzati dello store.
   */
  const isQuoteSigned = (q: EventQuote): boolean => {
    if (String(q.status ?? "").trim().toLowerCase() === "firmato") return true;
    if (q.signed_at || q.data_firma) return true;
    const candidates = [q.id, q.preventivo, q.id ? String(q.id).slice(0, 8) : ""];
    return candidates.some(
      (value) => Boolean(value) && signedQuoteIds.has(String(value).trim().toLowerCase())
    );
  };

  // Indicizza i pagamenti per quote_id (match case-insensitive) per il ledger.
  const paymentsByQuote = new Map<string, Payment[]>();
  for (const payment of payments) {
    const key = String(payment?.quote_id ?? "").trim().toLowerCase();
    if (!key) continue;
    const bucket = paymentsByQuote.get(key);
    if (bucket) bucket.push(payment);
    else paymentsByQuote.set(key, [payment]);
  }

  // Imbuto di conversione: la vista Eventi mostra ESCLUSIVAMENTE i contratti
  // confermati/firmati. Pendenti, preventivi, bozze e opzioni non firmate
  // appartengono a /admin/contratti.
  const eventi: EventoRow[] = (quotes as EventQuote[])
    .filter((q) => {
      if (!q || !q.id) return false;
      const isSigned = isQuoteSigned(q);
      if (isSigned) return true;
      return SIGNED_STAGES.includes(deriveEventStage(q, { isSigned }).stage);
    })
    .map((q): EventoRow => {
      const isSigned = isQuoteSigned(q);
      const ledger = computeEventLedger(
        q,
        paymentsByQuote.get(String(q.id).toLowerCase()) ?? []
      );
      const stage = deriveEventStage(q, { isSigned });

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
        isSigned: isSigned || SIGNED_STAGES.includes(stage.stage),
        totaleCents: Math.round(prezzoTotale * 100),
        incassatoCents: ledger.incassato_cents,
        residuoCents: ledger.residuo_cents,
      };
    })
    .sort((a, b) => String(b.dataEvento || "").localeCompare(String(a.dataEvento || "")));

  return <EventiClient events={eventi} />;
}
