"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface PreventiviOverviewClientProps {
  quotes: any[];
  signedPdfs?: any[];
}

export default function PreventiviOverviewClient({
  quotes,
  signedPdfs = [],
}: PreventiviOverviewClientProps) {
  const [filterStatus, setFilterStatus] = useState<string>("tutti");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Identifica le bozze create da tablet segreteria
  const bozzeVisita = quotes.filter(
    (q) => q.status === "bozza_visita" || q.source === "tablet_segreteria"
  );

  const filteredQuotes = quotes.filter((q) => {
    if (filterStatus === "bozze") {
      return q.status === "bozza_visita" || q.source === "tablet_segreteria";
    }
    if (filterStatus !== "tutti" && q.status !== filterStatus) return false;

    if (searchQuery.trim() !== "") {
      const qLower = searchQuery.toLowerCase();
      const nomeCompleto = `${q.clients?.nome || ""} ${q.clients?.cognome || ""}`.toLowerCase();
      const email = (q.clients?.email || "").toLowerCase();
      return nomeCompleto.includes(qLower) || email.includes(qLower);
    }

    return true;
  });

  const handleCopyLink = (quoteId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
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
    background: filterStatus === status ? "#1e1b18" : "#f1f5f9",
    color: filterStatus === status ? "white" : "#475569",
    transition: "all 0.2s ease",
  });

  return (
    <div style={{ maxWidth: "1250px", margin: "0 auto", fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span
            style={{
              textTransform: "uppercase",
              letterSpacing: "2px",
              fontSize: "0.85rem",
              color: "#e58c2c",
              fontWeight: "bold",
            }}
          >
            COMMERCIALE & PROPOSTE
          </span>
          <h1
            style={{
              margin: "0.3rem 0 0 0",
              color: "#514d48",
              fontSize: "2.2rem",
              fontFamily: "serif",
            }}
          >
            📋 Registro Preventivi, Contratti & Schede Tour Lead
          </h1>
          <p style={{ margin: 0, color: "#777" }}>
            Visualizza le proposte attive, converti le bozze da tablet segreteria in contratti digitali con firma crittografica.
          </p>
        </div>

        <Link href="/admin/preventivi/nuovo">
          <button
            type="button"
            style={{
              padding: "0.8rem 1.6rem",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(229,140,44,0.3)",
            }}
          >
            + Nuovo Preventivo
          </button>
        </Link>
      </div>

      {/* SEZIONE 1: BOZZE DA TABLET SEGRETERIA (EVIDENZIATE) */}
      {bozzeVisita.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #fffbf5 0%, #fff7ed 100%)",
            border: "2px solid #fed7aa",
            borderRadius: "18px",
            padding: "1.8rem 2rem",
            marginBottom: "2.5rem",
            boxShadow: "0 8px 24px rgba(234, 88, 12, 0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "0.8rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <span style={{ fontSize: "1.8rem" }}>📱</span>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "#c2410c", fontWeight: 800 }}>
                  IN ATTESA DI REVISIONE ROBERTO SOLA
                </span>
                <h3 style={{ margin: "0.2rem 0 0 0", color: "#1e1b18", fontSize: "1.3rem" }}>
                  Bozze Visita Lead Ricevute da Tablet Segreteria ({bozzeVisita.length})
                </h3>
              </div>
            </div>
            <span style={{ fontSize: "0.85rem", color: "#78350f", background: "#fef3c7", padding: "0.3rem 0.8rem", borderRadius: "12px", fontWeight: 700 }}>
              Zero dati finanziari visibili allo staff • Pronte per la quantificazione economica
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.2rem" }}>
            {bozzeVisita.map((bozza) => {
              const client = bozza.clients || {};
              const ospiti = bozza.numero_ospiti || 100;
              const spazi = bozza.spazi_selezionati || [];
              const servizi = bozza.servizi_interesse || [];

              return (
                <div
                  key={bozza.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #fed7aa",
                    padding: "1.4rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                      <div>
                        <strong style={{ fontSize: "1.15rem", color: "#1e1b18", display: "block" }}>
                          {client.nome || "Coppia"} {client.cognome || "Lead"}
                        </strong>
                        <small style={{ color: "#64748b" }}>
                          📞 {client.telefono || "Nessun telefono"} • ✉️ {client.email || "Nessuna email"}
                        </small>
                      </div>
                      <span
                        style={{
                          background: "#ffedd5",
                          color: "#c2410c",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          padding: "0.25rem 0.6rem",
                          borderRadius: "10px",
                          textTransform: "uppercase",
                        }}
                      >
                        Bozza Visita
                      </span>
                    </div>

                    <div style={{ fontSize: "0.85rem", color: "#475569", display: "flex", flexDirection: "column", gap: "0.3rem", marginTop: "0.8rem" }}>
                      <div>
                        📅 <strong>Data Richiesta:</strong>{" "}
                        {bozza.data_evento ? format(new Date(bozza.data_evento), "dd MMMM yyyy", { locale: it }) : "Da concordare"} (
                        {bozza.turno === "pranzo" ? "Pranzo" : "Cena"})
                      </div>
                      <div>
                        👥 <strong>Invitati Stimati:</strong> {ospiti} persone
                      </div>
                      {bozza.stile_mood && (
                        <div>
                          🎨 <strong>Stile Desiderato:</strong> {bozza.stile_mood}
                        </div>
                      )}
                      {spazi.length > 0 && (
                        <div>
                          🏛️ <strong>Ambienti Scelti:</strong> {spazi.join(", ")}
                        </div>
                      )}
                      {servizi.length > 0 && (
                        <div>
                          ✨ <strong>Servizi d&apos;Interesse:</strong> {servizi.join(", ")}
                        </div>
                      )}
                      {bozza.note_visita_segreteria && (
                        <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "6px", fontStyle: "italic", marginTop: "4px" }}>
                          📝 Note Staff: &quot;{bozza.note_visita_segreteria}&quot;
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Azioni Direzionali */}
                  <div style={{ display: "flex", gap: "0.6rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.8rem", flexWrap: "wrap" }}>
                    <Link
                      href={`/admin/preventivi/nuovo?from_lead=${bozza.id}&ospiti=${ospiti}&nome=${encodeURIComponent(client.nome || "")}&cognome=${encodeURIComponent(client.cognome || "")}&telefono=${encodeURIComponent(client.telefono || "")}&email=${encodeURIComponent(client.email || "")}&data=${bozza.data_evento || ""}`}
                      style={{ flex: 1 }}
                    >
                      <button
                        type="button"
                        style={{
                          width: "100%",
                          padding: "0.6rem",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#1e1b18",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        🎯 Calibra Preventivo Definitivo
                      </button>
                    </Link>

                    <Link href={`/admin/contratti/converti?quote_id=${bozza.id}`} style={{ flex: 1 }}>
                      <button
                        type="button"
                        style={{
                          width: "100%",
                          padding: "0.6rem",
                          borderRadius: "8px",
                          border: "none",
                          background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                          color: "#ffffff",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        ✍️ Genera Contratto con `sig`
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SEZIONE 2: TUTTI I PREVENTIVI E CONTRATTI */}
      <div className="premium-card" style={{ padding: "2rem" }}>
        {/* Controlli & Filtri */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem",
            borderBottom: "2px solid #f1f5f9",
            paddingBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button type="button" onClick={() => setFilterStatus("tutti")} style={filterTabStyle("tutti")}>
              Tutti ({quotes.length})
            </button>
            <button type="button" onClick={() => setFilterStatus("bozze")} style={filterTabStyle("bozze")}>
              📱 Bozze Tour Segreteria ({bozzeVisita.length})
            </button>
            <button type="button" onClick={() => setFilterStatus("inviato")} style={filterTabStyle("inviato")}>
              ✉️ Preventivi Inviati ({quotes.filter((q) => q.status === "inviato").length})
            </button>
            <button type="button" onClick={() => setFilterStatus("accettato")} style={filterTabStyle("accettato")}>
              🤝 Accettati ({quotes.filter((q) => q.status === "accettato").length})
            </button>
            <button type="button" onClick={() => setFilterStatus("convertito")} style={filterTabStyle("convertito")}>
              🔒 Contratti con sig ({quotes.filter((q) => q.status === "convertito" || q.status === "firmato").length})
            </button>
          </div>

          <div>
            <input
              type="text"
              placeholder="🔍 Cerca cliente o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "0.5rem 0.9rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.88rem",
                width: "220px",
              }}
            />
          </div>
        </div>

        {/* Tabella Preventivi */}
        {filteredQuotes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
            Nessun preventivo trovato per i criteri selezionati.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid #e2e8f0",
                    textAlign: "left",
                    color: "#64748b",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  <th style={{ padding: "0.8rem" }}>Cliente</th>
                  <th style={{ padding: "0.8rem" }}>Evento & Data</th>
                  <th style={{ padding: "0.8rem" }}>Totale Proposta</th>
                  <th style={{ padding: "0.8rem" }}>Stato Workflow</th>
                  <th style={{ padding: "0.8rem", textAlign: "right" }}>Azioni Riservate Roberto</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((quote) => {
                  const nomeRaw = (quote.clients?.nome || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                  const cognomeRaw = (quote.clients?.cognome || "").toLowerCase().replace(/[^a-z0-9]/g, "");

                  const signedPdfMatch = signedPdfs.find((pdf) => {
                    const keyLower = pdf.key.toLowerCase().replace(/[^a-z0-9]/g, "");
                    return (nomeRaw && keyLower.includes(nomeRaw)) || (cognomeRaw && keyLower.includes(cognomeRaw));
                  });

                  const isBozzaVisita = quote.status === "bozza_visita" || quote.source === "tablet_segreteria";
                  const isFirmato = quote.status === "firmato" || Boolean(signedPdfMatch);
                  const isAccettato = quote.status === "accettato" && !isFirmato;
                  const isConvertito = quote.status === "convertito" && !isFirmato;

                  return (
                    <tr key={quote.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "1rem 0.8rem" }}>
                        <strong style={{ fontSize: "1rem", color: "#1e1b18", display: "block" }}>
                          {quote.clients?.nome} {quote.clients?.cognome}
                        </strong>
                        <small style={{ color: "#64748b" }}>{quote.clients?.email}</small>
                        {quote.clients?.telefono && (
                          <small style={{ display: "block", color: "#16a34a", fontWeight: 600 }}>
                            📱 {quote.clients.telefono}
                          </small>
                        )}
                      </td>

                      <td style={{ padding: "1rem 0.8rem" }}>
                        <span style={{ textTransform: "capitalize", fontWeight: 600, color: "#1e1b18" }}>
                          {quote.tipo_evento === "wedding" ? "💍 Matrimonio" : "🎉 Evento Privato"}
                        </span>
                        <small style={{ display: "block", color: "#64748b", marginTop: "2px" }}>
                          {quote.data_evento
                            ? format(new Date(quote.data_evento), "dd MMMM yyyy", { locale: it })
                            : "Data da concordare"}
                        </small>
                      </td>

                      <td style={{ padding: "1rem 0.8rem" }}>
                        <strong style={{ fontSize: "1.1rem", color: "#ea580c" }}>
                          € {Number(quote.totale_calcolato || 0).toLocaleString("it-IT")}
                        </strong>
                        {Number(quote.sconto_fisso) > 0 && (
                          <small style={{ display: "block", color: "#16a34a" }}>
                            Sconto: €{Number(quote.sconto_fisso).toLocaleString("it-IT")}
                          </small>
                        )}
                      </td>

                      <td style={{ padding: "1rem 0.8rem" }}>
                        <span
                          style={{
                            padding: "0.35rem 0.8rem",
                            borderRadius: "20px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            display: "inline-block",
                            background: isBozzaVisita
                              ? "#ffedd5"
                              : isFirmato
                              ? "#dcfce7"
                              : isAccettato
                              ? "#dcfce7"
                              : isConvertito
                              ? "#e0f2fe"
                              : "#fef3c7",
                            color: isBozzaVisita
                              ? "#c2410c"
                              : isFirmato
                              ? "#166534"
                              : isAccettato
                              ? "#166534"
                              : isConvertito
                              ? "#0369a1"
                              : "#92400e",
                          }}
                        >
                          {isBozzaVisita
                            ? "📱 BOZZA TOUR SEGRETERIA"
                            : isFirmato
                            ? "CONTRATTO FIRMATO ✓"
                            : isAccettato
                            ? "PREVENTIVO ACCETTATO"
                            : isConvertito
                            ? "CONTRATTO GENERATO (SIG)"
                            : "INVIATO"}
                        </span>
                      </td>

                      <td style={{ padding: "1rem 0.8rem", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                          {isBozzaVisita ? (
                            <>
                              <Link
                                href={`/admin/contratti/converti?quote_id=${quote.id}`}
                                style={{ textDecoration: "none" }}
                              >
                                <button
                                  type="button"
                                  style={{
                                    padding: "0.45rem 0.8rem",
                                    borderRadius: "8px",
                                    border: "none",
                                    background: "#16a34a",
                                    color: "#fff",
                                    fontSize: "0.82rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  ✍️ Converti in Contratto
                                </button>
                              </Link>
                              <Link
                                href={`/admin/preventivi/nuovo?from_lead=${quote.id}`}
                                style={{ textDecoration: "none" }}
                              >
                                <button
                                  type="button"
                                  style={{
                                    padding: "0.45rem 0.8rem",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    background: "#fff",
                                    color: "#1e1b18",
                                    fontSize: "0.82rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  🎯 Modifica Voci
                                </button>
                              </Link>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCopyLink(quote.id)}
                                style={{
                                  padding: "0.45rem 0.8rem",
                                  borderRadius: "8px",
                                  border: "1px solid #cbd5e1",
                                  background: "#ffffff",
                                  color: "#1e1b18",
                                  fontSize: "0.82rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                {copiedId === quote.id ? "✓ Copiato!" : "🔗 Copia Link"}
                              </button>

                              <Link
                                href={`/admin/contratti/converti?quote_id=${quote.id}`}
                                style={{ textDecoration: "none" }}
                              >
                                <button
                                  type="button"
                                  style={{
                                    padding: "0.45rem 0.8rem",
                                    borderRadius: "8px",
                                    border: "none",
                                    background: isFirmato ? "#1e1b18" : "#ea580c",
                                    color: "#fff",
                                    fontSize: "0.82rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  {isFirmato ? "📄 Vedi Contratto" : "✍️ Contratto (sig)"}
                                </button>
                              </Link>
                            </>
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
    </div>
  );
}
