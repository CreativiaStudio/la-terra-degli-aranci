import { Suspense } from "react";
import WeddingForm from "./WeddingForm";
import { generateSignature } from "@/lib/crypto";

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

  return (
    <div className="container">
      <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem" }}>Caricamento contratto in corso...</div>}>
        <WeddingForm initialPrezzo={prezzo} initialPreventivo={preventivo} />
      </Suspense>
    </div>
  );
}
