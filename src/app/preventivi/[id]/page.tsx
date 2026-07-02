import { getServiceSupabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import AcceptQuoteButton from "./AcceptQuoteButton";

export const revalidate = 0;

export default async function PreventivoPublicPage({ params }: { params: { id: string } }) {
  const supabase = getServiceSupabase();

  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      *,
      clients (*)
    `)
    .eq('id', params.id)
    .single();

  if (error || !quote) {
    return notFound();
  }

  const items = quote.items || [];
  const totaleServizi = items.reduce((acc: number, item: any) => acc + (item.quantita * item.prezzo_unitario), 0);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#faf8f5", padding: "2rem 1rem", fontFamily: "var(--font-primary)" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Header Emozionale */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ color: "var(--primary-color)", fontSize: "2.5rem", marginBottom: "0.5rem" }}>La Terra degli Aranci</h1>
          <p style={{ color: "#666", fontSize: "1.1rem" }}>Proposta per il Vostro {quote.tipo_evento === 'wedding' ? 'Matrimonio' : 'Evento'}</p>
        </div>

        <div className="premium-card" style={{ padding: "3rem" }}>
          
          {/* Info Cliente */}
          <div style={{ borderBottom: "1px solid #eee", paddingBottom: "2rem", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Dettagli della Proposta</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", color: "#555" }}>
              <div>
                <strong>Intestato a:</strong><br/>
                {quote.clients.nome} {quote.clients.cognome}<br/>
                {quote.clients.email}
              </div>
              <div>
                <strong>Data Evento:</strong><br/>
                {quote.data_evento ? format(new Date(quote.data_evento), 'dd MMMM yyyy', { locale: it }) : 'Da definire'}
              </div>
            </div>
          </div>

          {/* Servizi */}
          <div style={{ marginBottom: "3rem" }}>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "1.5rem", color: "#333" }}>Servizi Inclusi</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--primary-color)", textAlign: "left", color: "#666" }}>
                  <th style={{ padding: "1rem 0" }}>Descrizione</th>
                  <th style={{ padding: "1rem 0", textAlign: "center" }}>Q.tà</th>
                  <th style={{ padding: "1rem 0", textAlign: "right" }}>Prezzo</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "1rem 0" }}>{item.descrizione}</td>
                    <td style={{ padding: "1rem 0", textAlign: "center" }}>{item.quantita}</td>
                    <td style={{ padding: "1rem 0", textAlign: "right" }}>€ {Number(item.prezzo_unitario).toLocaleString('it-IT')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Riepilogo Costi */}
          <div style={{ background: "#f8f9fa", padding: "2rem", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", color: "#666" }}>
              <span>Totale Servizi</span>
              <span>€ {totaleServizi.toLocaleString('it-IT')}</span>
            </div>
            
            {Number(quote.sconto_fisso) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", color: "var(--primary-color)" }}>
                <span>Vantaggio Cliente (Sconto)</span>
                <span>- € {Number(quote.sconto_fisso).toLocaleString('it-IT')}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", paddingTop: "1rem", borderTop: "2px solid #ddd", fontSize: "1.5rem", fontWeight: "bold" }}>
              <span>Totale Proposta</span>
              <span>€ {Number(quote.totale_calcolato).toLocaleString('it-IT')}</span>
            </div>
          </div>

          {/* Azioni */}
          <div style={{ marginTop: "3rem", textAlign: "center" }}>
            {quote.status === 'inviato' || quote.status === 'bozza' ? (
              <div>
                <p style={{ color: "#666", marginBottom: "1.5rem" }}>Se i dettagli della proposta soddisfano le vostre aspettative, potete accettare il preventivo per procedere alla generazione del contratto.</p>
                <AcceptQuoteButton quoteId={quote.id} />
              </div>
            ) : quote.status === 'accettato' ? (
              <div style={{ padding: "2rem", background: "#d4edda", color: "#155724", borderRadius: "8px" }}>
                <h3 style={{ margin: "0 0 0.5rem 0" }}>Preventivo Accettato! 🎉</h3>
                <p style={{ margin: 0 }}>La segreteria è stata informata e genererà a breve il vostro contratto ufficiale.</p>
              </div>
            ) : quote.status === 'convertito' ? (
              <div style={{ padding: "2rem", background: "#cce5ff", color: "#004085", borderRadius: "8px" }}>
                <h3 style={{ margin: "0 0 0.5rem 0" }}>Proposta Finalizzata</h3>
                <p style={{ margin: 0 }}>Questo preventivo è già stato convertito in contratto.</p>
              </div>
            ) : (
              <p style={{ color: "#666" }}>Stato preventivo: {quote.status}</p>
            )}
          </div>
        </div>
        
        <div style={{ textAlign: "center", marginTop: "2rem", color: "#999", fontSize: "0.9rem" }}>
          La Terra degli Aranci - Piazzetta S. Stefano, 7, 80127 Napoli NA
        </div>
      </div>
    </div>
  );
}
