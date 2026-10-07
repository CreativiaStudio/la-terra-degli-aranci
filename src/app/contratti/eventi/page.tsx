import { Suspense } from "react";
import EventiForm from "./EventiForm";
import { generateSignature } from "@/lib/crypto";
import { getQuotesFast } from "@/lib/dataHelper";
import {
  resolveTurno,
  normalizeEventDateTime,
  computeContractFinancials,
  derivePaymentDates,
  defaultEventDate,
} from "@/lib/contractPayments";

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  
  const prezzo = params.prezzo as string | undefined;
  const preventivo = params.preventivo as string | undefined;
  const sig = params.sig as string | undefined;

  if (!prezzo || !preventivo || !sig) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <h2>⚠️ Accesso Negato</h2>
        <p>Il link del contratto non è completo. Mancano dei parametri di sicurezza.</p>
      </div>
    );
  }

  const expectedSig = generateSignature(prezzo, preventivo);

  if (sig !== expectedSig) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <h2>⚠️ Link Manomesso</h2>
        <p>Il link del contratto è stato alterato. Richiedi un nuovo link all'amministrazione.</p>
      </div>
    );
  }

  // Cerca il preventivo e il cliente collegato per precompilare automaticamente i dati
  const quotes = await getQuotesFast();
  const matchingQuote = quotes.find(q => q.id.toLowerCase().startsWith(preventivo.toLowerCase()));
  
  const todayIso = new Date().toISOString().slice(0, 10);
  const turno = resolveTurno(matchingQuote);

  // DATA EVENTO: rigorosamente da matchingQuote se presente, altrimenti fallback
  // deterministico basato sull'anno del codice preventivo (mai date nel passato).
  const resolvedEvento = matchingQuote?.data_evento
    ? normalizeEventDateTime(matchingQuote.data_evento, turno)
    : normalizeEventDateTime(defaultEventDate(preventivo, todayIso), turno);
  const dataEvento = resolvedEvento || normalizeEventDateTime(defaultEventDate(preventivo, todayIso), turno);
  const dataEventoIso = dataEvento ? dataEvento.slice(0, 10) : "";

  // DATE ECONOMICHE: derivate SOLO dalla data evento (saldo = evento; 2° acconto = -6 mesi;
  // anticipo = oggi). Non leggono mai da bozze locali.
  const paymentDates = derivePaymentDates(dataEventoIso, todayIso);
  const financials = computeContractFinancials(matchingQuote, prezzo, "eventi");

  // initialData è SEMPRE definito: garantisce date e importi anche senza preventivo trovato.
  const initialData = {
    nome: matchingQuote?.clients?.nome || "",
    cognome: matchingQuote?.clients?.cognome || "",
    email: matchingQuote?.clients?.email || "",
    telefono: matchingQuote?.clients?.telefono || "",
    codice_fiscale: matchingQuote?.clients?.codice_fiscale || "",
    tipo_cliente: (matchingQuote as any)?.tipo_cliente || matchingQuote?.clients?.tipo_cliente || "privato",
    ragione_sociale: (matchingQuote as any)?.ragione_sociale || matchingQuote?.clients?.ragione_sociale || "",
    partita_iva: (matchingQuote as any)?.partita_iva || matchingQuote?.clients?.partita_iva || "",
    sdi: (matchingQuote as any)?.sdi || matchingQuote?.clients?.sdi || "",
    pec: (matchingQuote as any)?.pec || matchingQuote?.clients?.pec || "",
    data_evento: dataEvento,
    turno,
    tipo_evento: (matchingQuote as any)?.tipo_evento || "",
    tipo_esclusiva: (matchingQuote as any)?.tipo_esclusiva || "",
    spazi_riservati: (matchingQuote as any)?.spazi_riservati || (matchingQuote as any)?.spazi_selezionati || [],
    data_anticipo: paymentDates.dataAnticipo,
    data_secondo_acconto: paymentDates.dataSecondoAcconto,
    data_saldo: paymentDates.dataSaldo,
    mezzo_anticipo: "Bonifico Bancario",
    mezzo_secondo_acconto: "Bonifico Bancario",
    mezzo_saldo: "Bonifico Bancario",
    prezzo_totale: financials.prezzoTotale,
    importo_caparra: financials.caparra,
    importo_secondo_acconto: financials.secondoAcconto,
    importo_saldo: financials.saldo,
  };

  return (
    <div className="container">
      <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem" }}>Caricamento contratto in corso...</div>}>
        <EventiForm initialPrezzo={prezzo} initialPreventivo={preventivo} initialData={initialData} initialSig={sig} />
      </Suspense>
    </div>
  );
}
