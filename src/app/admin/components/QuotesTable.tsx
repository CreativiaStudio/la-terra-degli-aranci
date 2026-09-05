"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface QuotesTableProps {
  quotes: any[];
  signedPdfs?: any[];
}

export default function QuotesTable({ quotes, signedPdfs = [] }: QuotesTableProps) {
  const [filterStatus, setFilterStatus] = useState<string>("tutti");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredQuotes = quotes.filter(q => {
    if (filterStatus === "bozza_visita") {
      if (q.status !== "bozza_visita" && q.source !== "tablet_segreteria") return false;
    } else if (filterStatus !== "tutti" && q.status !== filterStatus) {
      return false;
    }

    if (searchQuery.trim() !== "") {
      const qLower = searchQuery.toLowerCase();
      const nomeCompleto = `${q.clients?.nome || ''} ${q.clients?.cognome || ''}`.toLowerCase();
      const email = (q.clients?.email || '').toLowerCase();
      return nomeCompleto.includes(qLower) || email.includes(qLower);
    }

    return true;
  });

  const handleCopyLink = (quoteId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
    const publicUrl = `${origin}/preventivi/${quoteId}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedId(quoteId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filterTabStyle = (status: string) => ({
    padding: "0.6rem 1.2rem",
    borderRadius: "20px",
    border: "none",
    fontWeight: "600" as const,
    fontSize: "0.85rem",
    cursor: "pointer",
    background: filterStatus === status ? "#514d48" : "#f0eee9",
    color: filterStatus === status ? "white" : "#555",
    transition: "all 0.2s ease"
  });

  return (
    <div className="premium-card" style={{ padding: "2rem" }}>
      {/* Header Tabella & Control Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", borderBottom: "2px solid #f0eee9", paddingBottom: "1.2rem" }}>
        <div>
          <h2 style={{ margin: 0, color: "#514d48", fontSize: "1.4rem", border: "none", padding: 0 }}>
            📋 Registro Preventivi & Proposte
          </h2>
          <small style={{ color: "#777" }}>Gestisci i preventivi attivi, copia i link per i clienti e convertili in contratti con 1 click.</small>
        </div>

        {/* Campo Ricerca */}
        <div>
          <input 
            type="text" 
            placeholder="🔍 Cerca cliente o email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "0.6rem 1rem", border: "1px solid #ddd", borderRadius: "8px", width: "240px", fontSize: "0.9rem" }}
          />
        </div>
      </div>

      {/* Tabs Filtro Stato */}
      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
        <button type="button" onClick={() => setFilterStatus("tutti")} style={filterTabStyle("tutti")}>
          Tutti ({quotes.length})
        </button>
        <button type="button" onClick={() => setFilterStatus("bozza_visita")} style={filterTabStyle("bozza_visita")}>
          📱 Bozze Tour Segreteria ({quotes.filter(q => q.status === 'bozza_visita' || q.source === 'tablet_segreteria').length})
        </button>
        <button type="button" onClick={() => setFilterStatus("inviato")} style={filterTabStyle("inviato")}>
          📩 Preventivi inviati ({quotes.filter(q => q.status === 'inviato').length})
        </button>
        <button type="button" onClick={() => setFilterStatus("accettato")} style={filterTabStyle("accettato")}>
          🎯 Preventivi accettati ({quotes.filter(q => q.status === 'accettato').length})
        </button>
        <button type="button" onClick={() => setFilterStatus("convertito")} style={filterTabStyle("convertito")}>
          ⚡ Preventivi trasformati in contratti ({quotes.filter(q => q.status === 'convertito' || q.status === 'firmato').length})
        </button>
      </div>

      {/* Tabella Dati */}
      {filteredQuotes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#888", background: "#faf8f5", borderRadius: "10px" }}>
          Nessun preventivo trovato per i filtri selezionati.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e0ddd9", textAlign: "left", color: "#888", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                <th style={{ padding: "1rem" }}>Cliente</th>
                <th style={{ padding: "1rem" }}>Evento & Data</th>
                <th style={{ padding: "1rem" }}>Totale Proposta</th>
                <th style={{ padding: "1rem" }}>Stato Workflow</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Azioni Riservate Admin</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((quote) => {
                const nomeRaw = (quote.clients?.nome || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const cognomeRaw = (quote.clients?.cognome || '').toLowerCase().replace(/[^a-z0-9]/g, '');

                // Cerca se esiste un PDF del contratto firmato in Cloudflare R2 per questo cliente
                const signedPdfMatch = signedPdfs.find(pdf => {
                  const keyLower = pdf.key.toLowerCase().replace(/[^a-z0-9]/g, '');
                  return (nomeRaw && keyLower.includes(nomeRaw)) || (cognomeRaw && keyLower.includes(cognomeRaw));
                });

                const isBozzaVisita = (quote.status === 'bozza_visita' || quote.source === 'tablet_segreteria') && !(quote.status === 'firmato' || Boolean(signedPdfMatch));
                const isFirmato = quote.status === 'firmato' || Boolean(signedPdfMatch);
                const isAccettato = quote.status === 'accettato' && !isFirmato;
                const isConvertito = quote.status === 'convertito' && !isFirmato;
                const isInviato = (quote.status === 'inviato' || quote.status === 'bozza') && !isFirmato && !isBozzaVisita;

                return (
                  <tr key={quote.id} style={{ borderBottom: "1px solid #f0eee9" }}>
                    {/* Cliente */}
                    <td style={{ padding: "1.2rem 1rem" }}>
                      <strong style={{ fontSize: "1.05rem", color: "#333", display: "block" }}>
                        {quote.clients?.nome} {quote.clients?.cognome}
                      </strong>
                      <small style={{ color: "#666" }}>{quote.clients?.email}</small>
                      {quote.clients?.telefono && (
                        <small style={{ display: "block", color: "#25D366", fontWeight: "600" }}>
                          📱 {quote.clients.telefono}
                        </small>
                      )}
                    </td>

                    {/* Evento & Data */}
                    <td style={{ padding: "1.2rem 1rem" }}>
                      <span style={{ textTransform: "capitalize", fontWeight: "600", color: "#514d48" }}>
                        {quote.tipo_evento === 'wedding' ? '💍 Matrimonio' : '🎉 Evento Privato'}
                      </span>
                      <small style={{ display: "block", color: "#777", marginTop: "2px" }}>
                        {quote.data_evento ? format(new Date(quote.data_evento), 'dd MMMM yyyy', { locale: it }) : 'Data da definire'}
                      </small>
                    </td>

                    {/* Totale */}
                    <td style={{ padding: "1.2rem 1rem" }}>
                      <strong style={{ fontSize: "1.15rem", color: "#e58c2c" }}>
                        € {Number(quote.totale_calcolato).toLocaleString('it-IT')}
                      </strong>
                      {Number(quote.sconto_fisso) > 0 && (
                        <small style={{ display: "block", color: "#2d5a27" }}>
                          Sconto: €{Number(quote.sconto_fisso).toLocaleString('it-IT')}
                        </small>
                      )}
                    </td>

                    {/* Stato Badge automatico */}
                    <td style={{ padding: "1.2rem 1rem" }}>
                      <span style={{
                        padding: "0.4rem 0.9rem",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                        display: "inline-block",
                        background: isBozzaVisita ? '#ffedd5' : isFirmato ? '#d4edda' : isAccettato ? '#d4edda' : isConvertito ? '#cce5ff' : '#fff3cd',
                        color: isBozzaVisita ? '#c2410c' : isFirmato ? '#155724' : isAccettato ? '#155724' : isConvertito ? '#004085' : '#856404'
                      }}>
                        {isBozzaVisita ? '📱 BOZZA TOUR SEGRETERIA' : isFirmato ? 'CONTRATTO FIRMATO' : isAccettato ? 'PREVENTIVO ACCETTATO' : isConvertito ? 'LINK CONTRATTO INVIATO' : 'INVIATO'}
                      </span>
                    </td>

                    {/* Azioni Riservate Admin */}
                    <td style={{ padding: "1.2rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                        
                        {/* TASTO BOZZA: Se è bozza visita da segreteria */}
                        {isBozzaVisita && (
                          <Link
                            href={`/admin/contratti/converti?quote_id=${quote.id}`}
                            style={{
                              padding: "0.6rem 1.1rem",
                              background: "#16a34a",
                              color: "white",
                              textDecoration: "none",
                              borderRadius: "8px",
                              fontSize: "0.85rem",
                              fontWeight: "bold",
                              boxShadow: "0 3px 10px rgba(22,163,74,0.3)"
                            }}
                          >
                            ✍️ Converti in Contratto (sig)
                          </Link>
                        )}

                        {/* TASTO 1: Preventivo Accettato */}
                        <Link 
                          href={`/preventivi/${quote.id}`} 
                          target="_blank" 
                          style={{
                            padding: "0.6rem 1.1rem",
                            background: "#faf8f5",
                            color: "#514d48",
                            border: "1px solid #ddd",
                            textDecoration: "none",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            fontWeight: "600"
                          }}
                        >
                          📋 Preventivo accettato
                        </Link>

                        {/* TASTO 2: Contratto Firmato */}
                        {isFirmato && (
                          <a
                            href={signedPdfMatch ? signedPdfMatch.url : "/admin/contratti"}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "0.6rem 1.1rem",
                              background: "#2d5a27",
                              color: "white",
                              textDecoration: "none",
                              borderRadius: "8px",
                              fontSize: "0.85rem",
                              fontWeight: "bold",
                              boxShadow: "0 3px 10px rgba(45,90,39,0.3)"
                            }}
                          >
                            ✍️ Contratto firmato
                          </a>
                        )}

                        {isFirmato && (
                          <Link
                            href={`/admin/preventivi/${quote.id}/modifica-servizi`}
                            style={{
                              padding: "0.6rem 1.1rem",
                              background: "#faf8f5",
                              color: "#514d48",
                              border: "1px solid #ddd",
                              textDecoration: "none",
                              borderRadius: "8px",
                              fontSize: "0.85rem",
                              fontWeight: "600"
                            }}
                          >
                            🔧 Modifica Servizi
                          </Link>
                        )}

                        {isConvertito && (
                          <Link 
                            href={`/admin/contratti/converti?quote_id=${quote.id}`} 
                            style={{
                              padding: "0.6rem 1.1rem",
                              background: "#1c4f82",
                              color: "white",
                              textDecoration: "none",
                              borderRadius: "8px",
                              fontSize: "0.85rem",
                              fontWeight: "bold",
                              boxShadow: "0 3px 10px rgba(28,79,130,0.3)"
                            }}
                          >
                            📑 Link contratto
                          </Link>
                        )}

                        {isAccettato && (
                          <Link 
                            href={`/admin/contratti/converti?quote_id=${quote.id}`} 
                            style={{
                              padding: "0.6rem 1.1rem",
                              background: "#e58c2c",
                              color: "white",
                              textDecoration: "none",
                              borderRadius: "8px",
                              fontSize: "0.85rem",
                              fontWeight: "bold",
                              boxShadow: "0 3px 10px rgba(229,140,44,0.3)"
                            }}
                          >
                            ⚡ Genera contratto
                          </Link>
                        )}

                        {isInviato && (
                          <button 
                            type="button" 
                            onClick={() => handleCopyLink(quote.id)}
                            style={{
                              padding: "0.6rem 1.1rem",
                              background: copiedId === quote.id ? "#2d5a27" : "#e58c2c",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              fontSize: "0.85rem",
                              fontWeight: "bold",
                              cursor: "pointer",
                              boxShadow: "0 3px 10px rgba(229,140,44,0.3)"
                            }}
                          >
                            {copiedId === quote.id ? "Copiato! ✓" : "📋 Link preventivo"}
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
