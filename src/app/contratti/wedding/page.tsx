import { Suspense } from "react";
import WeddingForm from "./WeddingForm";
import { generateSignature } from "@/lib/crypto";
import { getQuotesFast } from "@/lib/dataHelper";

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  
  // Permette l'accesso diretto sia tramite link con sig sia tramite session dal Project Builder
  const session = params.session as string | undefined;
  const prezzo = (params.prezzo as string) || "15330";
  const preventivo = (params.preventivo as string) || session || "TDA-2027-089";
  const sig = (params.sig as string) || (session ? generateSignature(prezzo, preventivo) : undefined);

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
  
  const initialData = matchingQuote ? {
    nome: matchingQuote.clients?.nome || "",
    cognome: matchingQuote.clients?.cognome || "",
    email: matchingQuote.clients?.email || "",
    telefono: matchingQuote.clients?.telefono || "",
    codice_fiscale: matchingQuote.clients?.codice_fiscale || "",
    data_evento: matchingQuote.data_evento || ""
  } : undefined;

  return (
    <div className="container">
      <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem" }}>Caricamento contratto in corso...</div>}>
        <WeddingForm initialPrezzo={prezzo} initialPreventivo={preventivo} initialData={initialData} />
      </Suspense>
    </div>
  );
}
