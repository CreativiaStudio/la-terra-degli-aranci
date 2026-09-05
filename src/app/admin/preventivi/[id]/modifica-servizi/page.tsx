import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { getQuoteForAdmin, getQuoteChangesHistory } from "@/app/preventivi/modifica/actions";
import { isWithinEditableWindow } from "@/lib/eventWindow";
import ModificaServiziForm from "./ModificaServiziForm";

export const revalidate = 0;

export default async function ModificaServiziPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuoteForAdmin(id);
  if (!quote) return notFound();

  const isFirmato = quote.status === 'firmato';
  const withinWindow = isWithinEditableWindow(quote.data_evento);
  const history = await getQuoteChangesHistory(id);

  return (
    <div className="container">
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/admin" style={{ color: "#666", textDecoration: "none", fontWeight: "600" }}>← Torna alla Dashboard Direzionale</Link>
        <h1 style={{ margin: "1rem 0 0 0", fontSize: "2.2rem" }}>Modifica Servizi Post-Firma</h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>
          {quote.clients?.nome} {quote.clients?.cognome} - TDA-{quote.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {!isFirmato ? (
        <div className="premium-card" style={{ padding: "2rem", textAlign: "center", color: "#856404", background: "#fff3cd" }}>
          Questo preventivo non ha ancora un contratto firmato: la modifica servizi è disponibile solo dopo la firma.
        </div>
      ) : !withinWindow ? (
        <div className="premium-card" style={{ padding: "2rem", textAlign: "center", color: "#856404", background: "#fff3cd" }}>
          Sono trascorsi meno di 10 giorni dalla data dell&apos;evento: non è più possibile modificare i servizi, per nessuno.
        </div>
      ) : (
        <ModificaServiziForm quote={quote} />
      )}

      <div className="premium-card" style={{ padding: "2rem", marginTop: "2rem" }}>
        <h2 style={{ marginTop: 0, color: "#514d48", fontSize: "1.3rem" }}>📜 Storico Modifiche</h2>
        {history.length === 0 ? (
          <p style={{ color: "#888" }}>Nessuna modifica registrata per questo preventivo.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #eee", textAlign: "left", color: "#888", fontSize: "0.85rem", textTransform: "uppercase" }}>
                <th style={{ padding: "0.8rem" }}>Data</th>
                <th style={{ padding: "0.8rem" }}>Iniziata da</th>
                <th style={{ padding: "0.8rem" }}>Totale Prima → Dopo</th>
                <th style={{ padding: "0.8rem" }}>Stato</th>
                <th style={{ padding: "0.8rem" }}>Allegato</th>
              </tr>
            </thead>
            <tbody>
              {history.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f0eee9" }}>
                  <td style={{ padding: "0.8rem" }}>{format(new Date(c.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}</td>
                  <td style={{ padding: "0.8rem", textTransform: "capitalize" }}>{c.initiated_by}</td>
                  <td style={{ padding: "0.8rem" }}>
                    € {Number(c.totale_before).toLocaleString('it-IT')} → € {Number(c.totale_after).toLocaleString('it-IT')}
                  </td>
                  <td style={{ padding: "0.8rem" }}>
                    <span style={{
                      padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold",
                      background: c.status === 'confermato' ? "#d4edda" : "#fff3cd",
                      color: c.status === 'confermato' ? "#155724" : "#856404"
                    }}>
                      {c.status === 'confermato' ? 'Confermata' : 'In attesa di firma'}
                    </span>
                  </td>
                  <td style={{ padding: "0.8rem" }}>
                    {c.pdf_url ? <a href={c.pdf_url} target="_blank" rel="noopener noreferrer">📄 PDF</a> : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
