import { getServiceSupabase } from "@/lib/supabase";
import { getQuoteLocal } from "@/lib/localDb";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import AcceptQuoteButton from "./AcceptQuoteButton";

export const revalidate = 0;

export default async function PreventivoPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let quote = null;

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        clients (*)
      `)
      .eq('id', id)
      .single();

    if (!error && data) {
      quote = data;
    }
  } catch (e) {
    console.warn("Supabase fetch failed, reading local DB fallback...");
  }

  if (!quote && id) {
    quote = getQuoteLocal(id);
  }

  if (!quote) {
    return notFound();
  }

  const items = quote.items || [];
  const totaleServizi = items.reduce((acc: number, item: any) => acc + (Number(item.prezzo_unitario !== undefined ? item.prezzo_unitario : item.prezzo) || 0), 0);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#faf8f5", padding: "3rem 1rem", fontFamily: "var(--font-primary)", color: "#2b2b2b" }}>
      <div style={{ maxWidth: "850px", margin: "0 auto" }}>
        
        {/* Header Emozionale */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span style={{ textTransform: "uppercase", letterSpacing: "3px", fontSize: "0.85rem", color: "#e58c2c", fontWeight: "600" }}>
            La Terra degli Aranci • Napoli
          </span>
          <h1 style={{ color: "#514d48", fontSize: "2.8rem", margin: "0.5rem 0 0.8rem 0", fontWeight: "400", fontFamily: "serif" }}>
            Proposta per il Vostro {quote.tipo_evento === 'wedding' ? 'Ricevimento di Matrimonio' : 'Evento Privato'}
          </h1>
          <p style={{ color: "#777", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
            Un percorso unico immerso nel parco botanico tra Posillipo e il Vomero, curato in ogni minimo dettaglio.
          </p>
        </div>

        <div className="premium-card" style={{ padding: "3.5rem", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.04)", border: "1px solid #f0eee9" }}>
          
          {/* Info Cliente */}
          <div style={{ borderBottom: "2px solid #faf8f5", paddingBottom: "2rem", marginBottom: "2.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            <div>
              <small style={{ textTransform: "uppercase", letterSpacing: "1px", color: "#999", fontSize: "0.8rem", fontWeight: "bold" }}>PROPOSTA RISERVATA A</small>
              <h3 style={{ fontSize: "1.4rem", margin: "0.3rem 0 0.2rem 0", color: "#514d48" }}>
                {quote.clients?.nome} {quote.clients?.cognome}
              </h3>
              <p style={{ margin: 0, color: "#666", fontSize: "0.95rem" }}>{quote.clients?.email}</p>
              {quote.clients?.telefono && <p style={{ margin: 0, color: "#666", fontSize: "0.95rem" }}>Tel: {quote.clients?.telefono}</p>}
            </div>
            <div style={{ textAlign: "right" }}>
              <small style={{ textTransform: "uppercase", letterSpacing: "1px", color: "#999", fontSize: "0.8rem", fontWeight: "bold" }}>DATA EVENTO PREVISTA</small>
              <h3 style={{ fontSize: "1.4rem", margin: "0.3rem 0 0.2rem 0", color: "#e58c2c" }}>
                {quote.data_evento ? format(new Date(quote.data_evento), 'dd MMMM yyyy', { locale: it }) : 'Da concordare'}
              </h3>
              <p style={{ margin: 0, color: "#888", fontSize: "0.85rem" }}>Riferimento Proposta: TDA-{quote.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          {/* Servizi Inclusi */}
          <div style={{ marginBottom: "3rem" }}>
            <h3 style={{ fontSize: "1.4rem", marginBottom: "1.5rem", color: "#514d48", borderBottom: "2px solid #e58c2c", paddingBottom: "0.5rem", display: "inline-block" }}>
              Servizi & Voci Incluse nella Proposta
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", margin: "1rem 0" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ddd", textAlign: "left", color: "#888", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                  <th style={{ padding: "0.8rem 0" }}>Descrizione Servizio</th>
                  <th style={{ padding: "0.8rem 0", textAlign: "right" }}>Valore Servizio</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => {
                  const val = item.prezzo_unitario !== undefined ? item.prezzo_unitario : item.prezzo;
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f5f5f5" }}>
                      <td style={{ padding: "1.2rem 0", fontSize: "1.05rem", fontWeight: "500", color: "#333" }}>
                        ✨ {item.descrizione}
                      </td>
                      <td style={{ padding: "1.2rem 0", textAlign: "right", fontWeight: "600", color: "#514d48", fontSize: "1.1rem" }}>
                        € {Number(val).toLocaleString('it-IT')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Riepilogo Costi */}
          <div style={{ background: "#faf8f5", padding: "2.5rem", borderRadius: "12px", border: "1px solid #f0eee9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", color: "#666", fontSize: "1.1rem" }}>
              <span>Subtotale Servizi Inclusi</span>
              <span>€ {totaleServizi.toLocaleString('it-IT')}</span>
            </div>
            
            {Number(quote.sconto_fisso) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", color: "#e58c2c", fontSize: "1.1rem", fontWeight: "bold" }}>
                <span>Vantaggio Riservato alla Coppia (Sconto)</span>
                <span>- € {Number(quote.sconto_fisso).toLocaleString('it-IT')}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "2px solid #e58c2c", fontSize: "1.8rem", fontWeight: "bold", color: "#514d48" }}>
              <span>TOTALE PROPOSTA:</span>
              <span style={{ color: "#e58c2c" }}>€ {Number(quote.totale_calcolato).toLocaleString('it-IT')}</span>
            </div>
          </div>

          {/* Esclusivamente vista Cliente: Solamente pulsante Accetta */}
          <div style={{ marginTop: "3.5rem", textAlign: "center" }}>
            {quote.status === 'inviato' || quote.status === 'bozza' ? (
              <div>
                <p style={{ color: "#666", marginBottom: "1.5rem", fontSize: "1.05rem", lineHeight: "1.6" }}>
                  Se i dettagli della proposta soddisfano le vostre aspettative, potete accettare la proposta qui sotto per procedere.
                </p>
                <AcceptQuoteButton quoteId={quote.id} />
              </div>
            ) : quote.status === 'accettato' || quote.status === 'convertito' ? (
              <div style={{ padding: "2.5rem", background: "#f3f8f2", color: "#2d5a27", borderRadius: "12px", border: "1px solid #d4edda" }}>
                <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.6rem" }}>Proposta Accettata con Successo! 🎉</h3>
                <p style={{ margin: 0, fontSize: "1.05rem", lineHeight: "1.6" }}>
                  Grazie per la vostra conferma! La direzione de La Terra degli Aranci ha ricevuto l'accettazione ed invierà a breve il contratto digitale per la firma.
                </p>
              </div>
            ) : (
              <p style={{ color: "#666" }}>Stato proposta: {quote.status}</p>
            )}
          </div>
        </div>
        
        <div style={{ textAlign: "center", marginTop: "2.5rem", color: "#999", fontSize: "0.9rem" }}>
          La Terra degli Aranci • Piazzetta S. Stefano, 7, 80127 Napoli NA • Tel: 081 714 8159
        </div>
      </div>
    </div>
  );
}
