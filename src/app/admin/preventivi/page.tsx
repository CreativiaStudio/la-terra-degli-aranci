import { getServiceSupabase } from "@/lib/supabase";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export const revalidate = 0; // Disabilita cache

export default async function PreventiviDashboard() {
  const supabase = getServiceSupabase();
  
  // Fetch quotes with client data
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select(`
      *,
      clients (*)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ margin: 0 }}>Gestione Preventivi</h1>
        <Link href="/admin/preventivi/nuovo" style={{
          background: "var(--primary-color)",
          color: "white",
          padding: "0.8rem 1.5rem",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "600",
          boxShadow: "0 4px 15px rgba(229, 140, 44, 0.3)"
        }}>
          + Nuovo Preventivo
        </Link>
      </div>

      <div className="premium-card">
        {error ? (
          <p style={{ color: "var(--error)" }}>Errore nel caricamento dei preventivi: {error.message}</p>
        ) : !quotes || quotes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <h3 style={{ color: "var(--secondary-color)", marginBottom: "1rem" }}>Nessun preventivo creato</h3>
            <p style={{ color: "#666" }}>Inizia creando il tuo primo preventivo per un cliente.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                <th style={{ padding: "1rem" }}>Cliente</th>
                <th style={{ padding: "1rem" }}>Evento</th>
                <th style={{ padding: "1rem" }}>Data Evento</th>
                <th style={{ padding: "1rem" }}>Totale</th>
                <th style={{ padding: "1rem" }}>Stato</th>
                <th style={{ padding: "1rem" }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.2s" }} className="table-row-hover">
                  <td style={{ padding: "1rem" }}>
                    <strong>{quote.clients?.nome} {quote.clients?.cognome}</strong><br/>
                    <small style={{ color: "#666" }}>{quote.clients?.email}</small>
                  </td>
                  <td style={{ padding: "1rem", textTransform: "capitalize" }}>{quote.tipo_evento}</td>
                  <td style={{ padding: "1rem" }}>
                    {quote.data_evento ? format(new Date(quote.data_evento), 'dd MMMM yyyy', { locale: it }) : '-'}
                  </td>
                  <td style={{ padding: "1rem", fontWeight: "bold" }}>
                    € {Number(quote.totale_calcolato).toLocaleString('it-IT')}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{
                      padding: "0.4rem 0.8rem",
                      borderRadius: "20px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      background: quote.status === 'accettato' ? '#d4edda' : 
                                  quote.status === 'convertito' ? '#cce5ff' :
                                  quote.status === 'inviato' ? '#fff3cd' : '#f8f9fa',
                      color: quote.status === 'accettato' ? '#155724' : 
                             quote.status === 'convertito' ? '#004085' :
                             quote.status === 'inviato' ? '#856404' : '#383d41'
                    }}>
                      {quote.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <Link href={`/preventivi/${quote.id}`} target="_blank" style={{
                        padding: "0.4rem 0.8rem",
                        background: "#f1f3f5",
                        color: "#333",
                        textDecoration: "none",
                        borderRadius: "6px",
                        fontSize: "0.9rem"
                      }}>
                        Vedi Pubblico
                      </Link>
                      {quote.status === 'accettato' && (
                        <Link href={`/admin/contratti/converti?quote_id=${quote.id}`} style={{
                          padding: "0.4rem 0.8rem",
                          background: "var(--primary-color)",
                          color: "white",
                          textDecoration: "none",
                          borderRadius: "6px",
                          fontSize: "0.9rem",
                          fontWeight: "bold"
                        }}>
                          Genera Contratto ⚡
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .table-row-hover:hover {
          background-color: #f8f9fa;
        }
      `}} />
    </div>
  );
}
