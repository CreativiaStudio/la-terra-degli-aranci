"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { SANTO_STEFANO_CORP, IOVINO_CORP } from "@/lib/fiscalCalculator";

interface AccontiClientProps {
  quotes: any[];
}

export default function AccontiClient({ quotes }: AccontiClientProps) {
  const confirmedQuotes = quotes.filter(
    (q) => q.status === "accettato" || q.status === "convertito" || q.status === "firmato"
  );

  // Calcolo KPI Ufficiali TDA:
  // 1° acconto: €1.500 alla firma (Santo Stefano Srl)
  // 2° acconto: €3.000 a -6 mesi (Iovino Banquetting Srl)
  // Saldo finale a 10-15 giorni prima dell'evento con split 60/40
  const totaleIncassiPrevisti = confirmedQuotes.reduce(
    (sum, q) => sum + Number(q.totale_calcolato || 0),
    0
  );

  const totaleAcconto1Incassato = confirmedQuotes.reduce((sum, q) => {
    const tot = Number(q.totale_calcolato || 0);
    const acc1 = q.importo_caparra != null ? Number(q.importo_caparra) : Math.min(1500, tot);
    return sum + acc1;
  }, 0);

  const totaleAcconto2Previsto = confirmedQuotes.reduce((sum, q) => {
    const tot = Number(q.totale_calcolato || 0);
    const acc1 = q.importo_caparra != null ? Number(q.importo_caparra) : Math.min(1500, tot);
    const acc2 =
      q.importo_secondo_acconto != null
        ? Number(q.importo_secondo_acconto)
        : Math.min(3000, Math.max(0, tot - acc1));
    return sum + acc2;
  }, 0);

  const totaleSaldiPrevisti = Math.max(
    0,
    totaleIncassiPrevisti - totaleAcconto1Incassato - totaleAcconto2Previsto
  );

  const [filterType, setFilterType] = useState<"tutti" | "wedding" | "eventi">("tutti");

  const filteredQuotes = confirmedQuotes.filter((q) => {
    if (filterType === "tutti") return true;
    return q.tipo_evento === filterType;
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <span
          style={{
            textTransform: "uppercase",
            letterSpacing: "2px",
            fontSize: "0.85rem",
            color: "#e58c2c",
            fontWeight: "bold",
          }}
        >
          CONTROLLO FINANZIARIO & PIANO ACCONTI
        </span>
        <h1
          style={{
            margin: "0.3rem 0 0 0",
            color: "#514d48",
            fontSize: "2.2rem",
            fontFamily: "serif",
          }}
        >
          💳 Acconti & Scadenziario Pagamenti Ufficiale
        </h1>
        <p style={{ margin: 0, color: "#777" }}>
          Monitora la cassa aziendale: 1° Acconto €1.500 (Santo Stefano Srl), 2° Acconto €3.000 a -6
          mesi (Iovino Banquetting Srl) e Saldo a 10-15gg con split 60/40.
        </p>
      </div>

      {/* KPI Finanziari */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.2rem",
          marginBottom: "2rem",
        }}
      >
        <div className="premium-card" style={{ padding: "1.5rem" }}>
          <small
            style={{
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontWeight: "bold",
            }}
          >
            Incassi Totali Contrattualizzati
          </small>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#e58c2c",
              margin: "0.3rem 0",
            }}
          >
            € {totaleIncassiPrevisti.toLocaleString("it-IT")}
          </div>
          <small style={{ color: "#777" }}>
            Valore complessivo di {confirmedQuotes.length} eventi confermati
          </small>
        </div>

        <div className="premium-card" style={{ padding: "1.5rem" }}>
          <small
            style={{
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontWeight: "bold",
            }}
          >
            1° Acconto (€1.500 Fisso / Firma)
          </small>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#2d5a27",
              margin: "0.3rem 0",
            }}
          >
            € {totaleAcconto1Incassato.toLocaleString("it-IT")}
          </div>
          <small style={{ color: "#2d5a27", fontWeight: "600" }}>
            ✓ Destinato a {SANTO_STEFANO_CORP.ragioneSociale}
          </small>
        </div>

        <div className="premium-card" style={{ padding: "1.5rem" }}>
          <small
            style={{
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontWeight: "bold",
            }}
          >
            2° Acconto (€3.000 Forfettario a -6 Mesi)
          </small>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#b45309",
              margin: "0.3rem 0",
            }}
          >
            € {totaleAcconto2Previsto.toLocaleString("it-IT")}
          </div>
          <small style={{ color: "#b45309", fontWeight: "600" }}>
            ⏳ Destinato a {IOVINO_CORP.ragioneSociale}
          </small>
        </div>

        <div className="premium-card" style={{ padding: "1.5rem" }}>
          <small
            style={{
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontWeight: "bold",
            }}
          >
            Saldi Residui a 10-15gg
          </small>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#1c4f82",
              margin: "0.3rem 0",
            }}
          >
            € {totaleSaldiPrevisti.toLocaleString("it-IT")}
          </div>
          <small style={{ color: "#777" }}>Quote residue con split 60/40 su base + extra</small>
        </div>
      </div>

      {/* Box Regole Fiscali Ufficiali */}
      <div
        style={{
          background: "#fffaf0",
          border: "1px solid #fde68a",
          borderRadius: "14px",
          padding: "1.2rem 1.6rem",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <strong style={{ color: "#92400e", fontSize: "1rem", display: "block" }}>
            ⚖️ Disciplinare Fiscale e Regole di Cassa TDA (Accordi Call Direzionale)
          </strong>
          <span style={{ color: "#78350f", fontSize: "0.88rem" }}>
            • <strong>1° Acconto:</strong> € 1.500 fisso alla firma (Santo Stefano S.r.l., IVA 22%, blocco data villa) <br />
            • <strong>2° Acconto:</strong> € 3.000 forfettario a 6 mesi prima dell&apos;evento (Iovino Banquetting S.r.l., IVA 10%, avvio banqueting) <br />
            • <strong>Saldo Finale:</strong> a 10-15 giorni con conteggio definitivo invitati (minimo 70 pax) e conguaglio quote societarie.
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setFilterType("tutti")}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              background: filterType === "tutti" ? "#1e1b18" : "#fef3c7",
              color: filterType === "tutti" ? "#fff" : "#92400e",
            }}
          >
            Tutti ({confirmedQuotes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("wedding")}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              background: filterType === "wedding" ? "#e58c2c" : "#fef3c7",
              color: filterType === "wedding" ? "#fff" : "#92400e",
            }}
          >
            Wedding ({confirmedQuotes.filter((q) => q.tipo_evento === "wedding").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("eventi")}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              background: filterType === "eventi" ? "#1c4f82" : "#fef3c7",
              color: filterType === "eventi" ? "#fff" : "#92400e",
            }}
          >
            Privati ({confirmedQuotes.filter((q) => q.tipo_evento !== "wedding").length})
          </button>
        </div>
      </div>

      {/* Tabella Scadenziario */}
      <div className="premium-card" style={{ padding: "2rem" }}>
        <h2 style={{ marginTop: 0, color: "#514d48", fontSize: "1.3rem" }}>
          📋 Registro Acconti & Saldi per Evento
        </h2>

        {filteredQuotes.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
            Nessun contratto attivo corrispondente ai filtri.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid #eee",
                    textAlign: "left",
                    color: "#888",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  <th style={{ padding: "0.8rem" }}>Coppia / Cliente</th>
                  <th style={{ padding: "0.8rem" }}>Data Evento</th>
                  <th style={{ padding: "0.8rem" }}>Totale Contratto</th>
                  <th style={{ padding: "0.8rem" }}>1° Acconto (Firma - SS Srl)</th>
                  <th style={{ padding: "0.8rem" }}>2° Acconto (-6 Mesi - Iovino)</th>
                  <th style={{ padding: "0.8rem" }}>Saldo Finale (10-15gg)</th>
                  <th style={{ padding: "0.8rem" }}>Ripartizione Saldo</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((q) => {
                  const totale = Number(q.totale_calcolato || 0);
                  const isFirmato = q.status === "firmato";

                  // Quote ufficiali TDA
                  const acconto1 =
                    q.importo_caparra != null
                      ? Number(q.importo_caparra)
                      : Math.min(1500, totale);
                  const acconto2 =
                    q.importo_secondo_acconto != null
                      ? Number(q.importo_secondo_acconto)
                      : Math.min(3000, Math.max(0, totale - acconto1));
                  const saldo = Math.max(0, totale - acconto1 - acconto2);

                  // Split approssimato 40/60 sul totale per determinare spettanze residue
                  const quotaSS_totale = Math.round(totale * 0.4);
                  const quotaIovino_totale = totale - quotaSS_totale;
                  const saldoSS = Math.max(0, quotaSS_totale - acconto1);
                  const saldoIovino = Math.max(0, quotaIovino_totale - acconto2);

                  return (
                    <tr key={q.id} style={{ borderBottom: "1px solid #f0eee9" }}>
                      <td style={{ padding: "1rem 0.8rem" }}>
                        <strong style={{ color: "#2c2a27", fontSize: "1rem" }}>
                          {q.clients?.nome} {q.clients?.cognome}
                        </strong>
                        <small style={{ display: "block", color: "#666" }}>
                          {q.clients?.email} {q.clients?.telefono ? `• ${q.clients.telefono}` : ""}
                        </small>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: "0.75rem",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "10px",
                            marginTop: "3px",
                            background: q.tipo_evento === "wedding" ? "#fef3c7" : "#e0f2fe",
                            color: q.tipo_evento === "wedding" ? "#92400e" : "#0369a1",
                            fontWeight: 600,
                          }}
                        >
                          {q.tipo_evento === "wedding" ? "Wedding" : "Evento Privato"}
                        </span>
                      </td>

                      <td style={{ padding: "1rem 0.8rem" }}>
                        <strong>
                          {q.data_evento ? format(new Date(q.data_evento), "dd/MM/yyyy") : "Da definire"}
                        </strong>
                        <small style={{ display: "block", color: "#888" }}>
                          {q.data_evento
                            ? `${Math.max(
                                0,
                                Math.ceil(
                                  (new Date(q.data_evento).getTime() - new Date().getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                              )} gg all'evento`
                            : ""}
                        </small>
                      </td>

                      <td style={{ padding: "1rem 0.8rem" }}>
                        <strong style={{ color: "#e58c2c", fontSize: "1.05rem" }}>
                          € {totale.toLocaleString("it-IT")}
                        </strong>
                      </td>

                      {/* 1° Acconto €1500 */}
                      <td style={{ padding: "1rem 0.8rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span
                            style={{
                              padding: "0.3rem 0.6rem",
                              background: isFirmato ? "#d4edda" : "#fff3cd",
                              color: isFirmato ? "#155724" : "#856404",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              fontWeight: "bold",
                              display: "inline-block",
                            }}
                          >
                            € {acconto1.toLocaleString("it-IT")} {isFirmato ? "✓ Ricevuto" : "In attesa firma"}
                          </span>
                          <small style={{ color: "#888", fontSize: "0.75rem" }}>
                            Santo Stefano (22%)
                          </small>
                        </div>
                      </td>

                      {/* 2° Acconto €3000 */}
                      <td style={{ padding: "1rem 0.8rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span
                            style={{
                              padding: "0.3rem 0.6rem",
                              background: "#fef3c7",
                              color: "#92400e",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              fontWeight: "bold",
                              display: "inline-block",
                            }}
                          >
                            € {acconto2.toLocaleString("it-IT")}
                          </span>
                          <small style={{ color: "#888", fontSize: "0.75rem" }}>
                            Iovino Banqueting (-6 mesi)
                          </small>
                        </div>
                      </td>

                      {/* Saldo finale */}
                      <td style={{ padding: "1rem 0.8rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span
                            style={{
                              padding: "0.3rem 0.6rem",
                              background: "#cce5ff",
                              color: "#004085",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              fontWeight: "bold",
                              display: "inline-block",
                            }}
                          >
                            € {saldo.toLocaleString("it-IT")}
                          </span>
                          <small style={{ color: "#888", fontSize: "0.75rem" }}>
                            10-15 gg prima
                          </small>
                        </div>
                      </td>

                      {/* Ripartizione saldo */}
                      <td style={{ padding: "1rem 0.8rem", fontSize: "0.8rem" }}>
                        <div style={{ color: "#475569" }}>
                          <span>SS: <strong>€ {saldoSS.toLocaleString("it-IT")}</strong></span><br />
                          <span>Iovino: <strong>€ {saldoIovino.toLocaleString("it-IT")}</strong></span>
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
    </div>
  );
}
