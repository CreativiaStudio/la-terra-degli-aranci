import { getServiceSupabase } from "@/lib/supabase";
import { getQuoteLocal, updateQuoteStatusLocal } from "@/lib/localDb";
import { generateSecureToken } from "@/app/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import CopyLinkButton from "./CopyLinkButton";

export const revalidate = 0;

export default async function ConvertiPreventivoPage({ searchParams }: { searchParams: Promise<{ quote_id: string }> }) {
  const { quote_id } = await searchParams;
  if (!quote_id) return notFound();

  let quote = null;

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quote_id)
      .single();

    if (!error && data) {
      quote = data;
      await supabase
        .from('quotes')
        .update({ status: 'convertito' })
        .eq('id', quote.id);
    }
  } catch (e) {
    console.warn("Supabase disconnesso su conversione, uso local fallback...");
  }

  if (!quote) {
    quote = getQuoteLocal(quote_id);
    if (quote) {
      updateQuoteStatusLocal(quote.id, 'convertito');
    }
  }

  if (!quote) return notFound();

  const numeroPreventivo = quote.id.split('-')[0].toUpperCase();
  const prezzoConcordato = quote.totale_calcolato.toString();
  const tipo = quote.tipo_evento || 'wedding';

  const { prezzo: p, preventivo: prev, sig } = await generateSecureToken(prezzoConcordato, numeroPreventivo);
  
  const headersList = await headers();
  const host = headersList.get('host') || 'ecosistema.laterradegliaranci.it';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  
  const generatedLink = `${baseUrl}/contratti/${tipo}?prezzo=${p}&preventivo=${prev}&sig=${sig}`;

  return (
    <div className="container">
      <div className="premium-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
        <h1 style={{ color: "#e58c2c", marginBottom: "1rem" }}>Preventivo Convertito in Contratto!</h1>
        <p style={{ fontSize: "1.2rem", color: "#666", marginBottom: "2rem" }}>
          La proposta è stata trasformata nel contratto ufficiale con i prezzi ed i riferimenti crittografati.
        </p>

        <div style={{ background: "#faf8f5", padding: "2rem", borderRadius: "12px", border: "1px solid #e0ddd9", textAlign: "left", marginBottom: "2.5rem" }}>
          <label style={{ fontWeight: "bold", color: "#514d48", display: "block", fontSize: "1.05rem" }}>
            Link del Contratto Digitale pronto da inviare al cliente:
          </label>
          <CopyLinkButton link={generatedLink} />
          <small style={{ display: "block", marginTop: "1rem", color: "#888", fontSize: "0.9rem" }}>
            * Roberto può copiare questo link e inviarlo direttamente al cliente tramite WhatsApp o Email per la firma digitale.
          </small>
        </div>

        <Link href="/admin/preventivi" style={{
          padding: "1rem 2rem",
          background: "#333",
          color: "white",
          textDecoration: "none",
          borderRadius: "8px",
          fontWeight: "bold"
        }}>
          ← Torna alla Gestione Preventivi
        </Link>
      </div>
    </div>
  );
}
