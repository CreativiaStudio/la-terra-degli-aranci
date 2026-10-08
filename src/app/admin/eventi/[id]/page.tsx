import { notFound } from "next/navigation";
import {
  getAllQuotesLocal,
  getLocalStore,
  getPaymentsForQuoteLocal,
  getQuoteChangesForQuoteLocal,
  getQuoteLocal,
  getWeddingDiaryLocal,
} from "@/lib/localDb";
import { computeEventLedger } from "@/lib/eventLedger";
import { deriveEventStage } from "@/lib/eventStage";
import EventRegiaClient from "./EventRegiaClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Cerca la quote per id esatto e, in fallback, per prefisso a 8 caratteri. */
function findQuote(id: string) {
  const exact = getQuoteLocal(id);
  if (exact) return exact;

  const store = getLocalStore();
  const search = String(id || "").toLowerCase();
  const found =
    store.quotes.find((q: any) => String(q.id).toLowerCase() === search) ||
    store.quotes.find((q: any) => String(q.id).toLowerCase().startsWith(search));
  if (!found) return null;

  const client = store.clients.find((c: any) => c.id === found.client_id) || null;
  return { ...found, clients: client };
}

export default async function EventRegiaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const validTabs = ["panoramica", "servizi", "cassa", "diario", "ospiti"];
  const initialTab = (validTabs.includes(String(tab)) ? String(tab) : "panoramica") as
    | "panoramica"
    | "servizi"
    | "cassa"
    | "diario"
    | "ospiti";

  const quote = findQuote(id);
  if (!quote) return notFound();

  const store = getLocalStore();
  const fullId = String(quote.id || "").toLowerCase();
  const shortId = fullId.slice(0, 8);

  const matchesQuote = (record: any): boolean => {
    const qid = String(record?.quote_id || record?.preventivo || record?.quoteId || "").toLowerCase();
    if (!qid) return false;
    return qid === fullId || fullId.startsWith(qid) || qid.startsWith(fullId) || qid.startsWith(shortId);
  };

  const signedContracts = (store.signed_contracts || []).filter(Boolean);
  const finalContracts = (store.final_contracts || []).filter(Boolean);
  const signedRecord = signedContracts.find(matchesQuote) || null;
  const finalRecord = finalContracts.find(matchesQuote) || null;

  const isSigned = quote.status === "firmato" || Boolean(signedRecord);
  const contractPdfUrl =
    signedRecord?.pdf_url || finalRecord?.pdf_url || finalRecord?.contract_pdf_url || null;

  const payments = getPaymentsForQuoteLocal(quote.id);
  const changes = getQuoteChangesForQuoteLocal(quote.id);
  const confirmedChanges = changes.filter((c: any) => c.status === "confermato");
  const pendingChanges = changes.filter((c: any) => c.status === "pending");
  const diary = getWeddingDiaryLocal(quote.id) || getWeddingDiaryLocal(quote.client_id || "");

  const today = new Date().toISOString().slice(0, 10);
  const ledger = computeEventLedger(quote, payments, confirmedChanges, pendingChanges, today);
  const stage = deriveEventStage(quote, { today, isSigned });
  const hasPendingOption = pendingChanges.length > 0 || Boolean((quote as any).opzione?.attiva);

  // Proiezione minimale di tutte le quote per la verifica conflitti lato client.
  const conflictQuotes = getAllQuotesLocal().map((q: any) => ({
    id: q.id,
    data_evento: q.data_evento,
    turno: q.turno,
    tipo_esclusiva: q.tipo_esclusiva,
    formula_opzione: q.formula_opzione,
    spazi_riservati: q.spazi_riservati,
    opzione: q.opzione,
    status: q.status,
    fase_contratto: q.fase_contratto,
    source: q.source,
    data_firma: q.data_firma,
    signed_at: q.signed_at,
    items: q.items,
    prezzo: q.prezzo,
    totale: q.totale,
    totale_calcolato: q.totale_calcolato,
  }));

  return (
    <EventRegiaClient
      quote={quote}
      payments={payments}
      changes={changes}
      diary={diary}
      ledger={ledger}
      stage={stage}
      today={today}
      conflictQuotes={conflictQuotes}
      contractPdfUrl={contractPdfUrl}
      isSigned={isSigned}
      hasPendingOption={hasPendingOption}
      initialTab={initialTab}
    />
  );
}
