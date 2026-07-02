import { getServiceSupabase } from "@/lib/supabase";
import { generateSecureToken } from "@/app/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";

export const revalidate = 0;

export default async function ConvertiPreventivoPage({ searchParams }: { searchParams: { quote_id: string } }) {
  if (!searchParams.quote_id) return notFound();

  const supabase = getServiceSupabase();

  // 1. Prendi il preventivo
  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', searchParams.quote_id)
    .single();

  if (error || !quote) return notFound();

  // 2. Prepara i dati per il contratto
  // Il "preventivo" nel token era il numero preventivo testuale. 
  // Useremo l'ID accorciato o un numero progressivo. Per ora usiamo i primi 8 caratteri dell'UUID come numero.
  const numeroPreventivo = quote.id.split('-')[0].toUpperCase();
  const prezzoConcordato = quote.totale_calcolato.toString();
  const tipo = quote.tipo_evento;

  // 3. Genera il token sicuro
  const { prezzo: p, preventivo: prev, sig } = await generateSecureToken(prezzoConcordato, numeroPreventivo);
  
  // URL base
  const headersList = headers();
  const host = headersList.get('host') || 'ecosistema.laterradegliaranci.it';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  
  const generatedLink = `${baseUrl}/contratti/${tipo}?prezzo=${p}&preventivo=${prev}&sig=${sig}`;

  // 4. Aggiorna lo stato del preventivo a "convertito"
  await supabase
    .from('quotes')
    .update({ status: 'convertito' })
    .eq('id', quote.id);

  return (
    <div className="container">
      <div className="premium-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
        <h1 style={{ color: "var(--primary-color)", marginBottom: "1rem" }}>Magia Compiuta!</h1>
        <p style={{ fontSize: "1.2rem", color: "#666", marginBottom: "2rem" }}>
          Il preventivo è stato convertito in contratto senza dover scrivere una sola parola.
        </p>

        <div style={{ background: "#f0eee9", padding: "2rem", borderRadius: "8px", textAlign: "left", marginBottom: "2rem" }}>
          <label style={{ fontWeight: "bold", color: "#333", display: "block", marginBottom: "0.5rem" }}>
            Link Sicuro del Contratto da inviare al cliente:
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input 
              type="text" 
              readOnly 
              value={generatedLink} 
              style={{ width: "100%", padding: "1rem", border: "1px solid #ccc", borderRadius: "6px", backgroundColor: "white" }} 
            />
          </div>
          <small style={{ display: "block", marginTop: "1rem", color: "#666" }}>
            * Questo link contiene i prezzi e i dati crittografati e non può essere modificato dal cliente.
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
          Torna ai Preventivi
        </Link>
      </div>
    </div>
  );
}
