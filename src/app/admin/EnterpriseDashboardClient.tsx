"use client";

import React from "react";
import Link from "next/link";
import StatsOverview from "./components/StatsOverview";
import QuickActionsBar from "./components/QuickActionsBar";
import QuotesTable from "./components/QuotesTable";

interface EnterpriseDashboardClientProps {
  quotes: any[];
  signedPdfs?: any[];
}

export default function EnterpriseDashboardClient({ quotes, signedPdfs = [] }: EnterpriseDashboardClientProps) {
  const preventiviInviati = quotes.length;
  const preventiviInAttesa = quotes.filter(q => q.status === 'inviato' || q.status === 'bozza').length;
  const contrattiInviati = quotes.filter(q => q.status === 'accettato' || q.status === 'convertito' || q.status === 'firmato').length;
  
  // Contratti in Attesa: contratti per cui è stato generato/inviato il link ma non sono ancora stati firmati dagli sposi
  const contrattiInAttesa = quotes.filter(q => {
    if (q.status !== 'convertito' && q.status !== 'accettato') return false;
    const nomeRaw = (q.clients?.nome || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cognomeRaw = (q.clients?.cognome || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const isSigned = signedPdfs.some(pdf => {
      const keyLower = pdf.key.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (nomeRaw && keyLower.includes(nomeRaw)) || (cognomeRaw && keyLower.includes(cognomeRaw));
    });
    return !isSigned && q.status !== 'firmato';
  }).length;

  // Schede Visita compilate dal tablet segreteria durante il tour location
  const leadVisits = quotes.filter(
    (q) => q.status === "bozza_visita" || q.source === "tablet_segreteria"
  );

  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "1.5rem 0" }}>
      
      {/* Header Direzionale Co-Branded Roberto & Rosaria */}
      <div style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.82rem", color: "#e58c2c", fontWeight: "800" }}>
              La Terra degli Aranci • Direzione Generale
            </span>
            <span style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", padding: "0.15rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700" }}>
              Roberto Sola & Rosaria Iovino
            </span>
          </div>
          <h1 style={{ margin: "0.2rem 0 0 0", color: "#514d48", fontSize: "2.3rem", fontFamily: "serif", textAlign: "left" }}>
            Pannello di Controllo Direzionale
          </h1>
          <p style={{ margin: "0.4rem 0 0 0", color: "#666", fontSize: "0.98rem" }}>
            Benvenuti Roberto e Rosaria. Panoramica completa della tenuta: schede visita dal parco, preventivi, split banqueting 60/40 e contratti digitali.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
          <div style={{ background: "#ffffff", padding: "0.6rem 1.2rem", borderRadius: "20px", border: "1px solid #e0ddd9", fontSize: "0.85rem", fontWeight: "600", color: "#514d48" }}>
            🟢 Sistema Online & Sincronizzato con Cloudflare R2
          </div>
          <Link
            href="/admin/articoli"
            style={{
              fontSize: "0.8rem",
              color: "#166534",
              textDecoration: "none",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              padding: "0.3rem 0.8rem",
              borderRadius: "14px",
              fontWeight: 600,
            }}
          >
            ✍️ Approvazione Blog WP (1-Click) →
          </Link>
        </div>
      </div>

      {/* 1. Bar dei 4 Box Pipeline */}
      <StatsOverview 
        preventiviInviati={preventiviInviati} 
        preventiviInAttesa={preventiviInAttesa} 
        contrattiInviati={contrattiInviati} 
        contrattiInAttesa={contrattiInAttesa} 
      />

      {/* 2. Schede Visita dal Tour Location (Tablet Segreteria) */}
      <div
        style={{
          background: "linear-gradient(135deg, #fffbf5 0%, #fff7ed 100%)",
          border: "2px solid #fed7aa",
          borderRadius: "18px",
          padding: "1.8rem",
          marginBottom: "2rem",
          boxShadow: "0 8px 25px rgba(229, 140, 44, 0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "0.8rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <span style={{ fontSize: "1.6rem" }}>📱</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#9a3412", fontWeight: 700 }}>
                  Schede Visita dal Tour Location (Tablet Accoglienza)
                </h2>
                <span
                  style={{
                    background: leadVisits.length > 0 ? "#ea580c" : "#78716c",
                    color: "#ffffff",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                  }}
                >
                  {leadVisits.length} {leadVisits.length === 1 ? "NUOVA SCHEDA" : "SCHEDE"}
                </span>
              </div>
              <small style={{ color: "#78350f" }}>
                Raccolte in tempo reale dallo staff all'ingresso del parco secolare (Zero prezzi sul tablet).
              </small>
            </div>
          </div>

          <Link
            href="/segreteria"
            style={{
              fontSize: "0.85rem",
              color: "#c2410c",
              textDecoration: "none",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            Apri Vista Tablet Segreteria →
          </Link>
        </div>

        {leadVisits.length === 0 ? (
          <div
            style={{
              background: "rgba(255,255,255,0.7)",
              borderRadius: "12px",
              padding: "1.5rem",
              textAlign: "center",
              color: "#78716c",
              fontSize: "0.95rem",
              border: "1px dashed #fdba74",
            }}
          >
            🌿 Tutte le schede visita sono state lavorate. Quando la segreteria compilerà una nuova visita durante il tour con iPad, la troverai subito qui in evidenza con il pulsante per generare il preventivo.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {leadVisits.map((lead) => {
              const client = lead.clients || {};
              const nomeCompleto = `${client.nome || "Lead"} ${client.cognome || ""}`.trim();
              const telefono = client.telefono || "";
              const email = client.email || "";
              const telClean = telefono.replace(/[^0-9]/g, "");

              return (
                <div
                  key={lead.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    padding: "1.3rem 1.6rem",
                    border: "1px solid #fed7aa",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1.2rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  {/* Dati Principali Lead */}
                  <div style={{ flex: "1 1 340px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "1.1rem" }}>
                        {lead.tipo_evento === "wedding" ? "💍" : "🎉"}
                      </span>
                      <strong style={{ fontSize: "1.15rem", color: "#1e1b18" }}>
                        {nomeCompleto}
                      </strong>
                      <span
                        style={{
                          background: lead.tipo_evento === "wedding" ? "#fdf2f8" : "#f0fdf4",
                          color: lead.tipo_evento === "wedding" ? "#9d174d" : "#166534",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "10px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {lead.tipo_evento === "wedding" ? "Matrimonio" : "Evento Privato"}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.85rem", color: "#57534e", lineHeight: 1.5 }}>
                      <span>📅 <strong>Data:</strong> {lead.data_evento || "Da definire"}</span>
                      {" • "}
                      <span>👥 <strong>Ospiti:</strong> ~{lead.numero_ospiti || 100}</span>
                      {telefono && (
                        <>
                          {" • "}
                          <span>📞 {telefono}</span>
                        </>
                      )}
                      {email && (
                        <>
                          {" • "}
                          <span>✉️ {email}</span>
                        </>
                      )}
                    </div>

                    {/* Note & Spazi di interesse */}
                    {(lead.spazi_selezionati?.length > 0 || lead.note_visita_segreteria) && (
                      <div
                        style={{
                          marginTop: "0.6rem",
                          fontSize: "0.82rem",
                          color: "#78350f",
                          background: "#fffbeb",
                          padding: "0.5rem 0.8rem",
                          borderRadius: "8px",
                          border: "1px solid #fef3c7",
                        }}
                      >
                        {lead.spazi_selezionati?.length > 0 && (
                          <div>
                            <strong>Spazi visitati:</strong> {lead.spazi_selezionati.join(", ")}
                          </div>
                        )}
                        {lead.note_visita_segreteria && (
                          <div style={{ marginTop: "0.2rem" }}>
                            <strong>Note staff:</strong> &ldquo;{lead.note_visita_segreteria}&rdquo;
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Azioni Rapide Direzione */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                    <Link
                      href={`/admin/contratti/converti?quote_id=${lead.id}`}
                      style={{
                        background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                        color: "#ffffff",
                        padding: "0.65rem 1.2rem",
                        borderRadius: "10px",
                        fontSize: "0.88rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
                      }}
                    >
                      <span>⚡</span>
                      <span>Genera Contratto 1-Click</span>
                    </Link>

                    <Link
                      href={`/preventivi/${lead.id}`}
                      target="_blank"
                      style={{
                        background: "#faf8f5",
                        border: "1px solid #e5e7eb",
                        color: "#514d48",
                        padding: "0.65rem 1rem",
                        borderRadius: "10px",
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      <span>📋 Scheda Lead</span>
                    </Link>

                    {telClean && (
                      <a
                        href={`https://wa.me/${telClean}?text=Gentile%20${encodeURIComponent(
                          client.nome || ""
                        )},%20grazie%20per%20aver%20visitato%20La%20Terra%20degli%20Aranci!%20Stiamo%20preparando%20la%20vostra%20proposta%20personalizzata.`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: "#25d366",
                          color: "#ffffff",
                          padding: "0.65rem 1rem",
                          borderRadius: "10px",
                          fontSize: "0.88rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <span>💬</span>
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Box Ripartizione Banqueting 60/40 (Roberto & Rosaria) */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          padding: "1.6rem 2rem",
          border: "1px solid #e5e7eb",
          marginBottom: "2rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ borderRight: "1px solid #f3f4f6", paddingRight: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.2rem" }}>🍽️</span>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "#86198f", fontWeight: 800 }}>
              Iovino Banqueting S.r.l. (60%)
            </span>
          </div>
          <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1.3rem", color: "#1e1b18" }}>
            Rosaria Iovino • Somministrazione Food & Beverage
          </h3>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "#57534e", lineHeight: 1.5 }}>
            Regime fiscale al <strong>10% IVA</strong>: include menu nuziale, isole gastronomiche, show cooking graffette, open bar e brigata di sala e cucina.
          </p>
          <div style={{ marginTop: "0.8rem" }}>
            <Link
              href="/admin/split"
              style={{ fontSize: "0.82rem", color: "#86198f", fontWeight: 700, textDecoration: "none" }}
            >
              Consulta Ripartizione Fiscale Dettagliata →
            </Link>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.2rem" }}>🏛️</span>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "#e58c2c", fontWeight: 800 }}>
              Tenuta Santo Stefano S.r.l. (40%)
            </span>
          </div>
          <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1.3rem", color: "#1e1b18" }}>
            Roberto Sola • Esclusiva Location & Parco Secolare
          </h3>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "#57534e", lineHeight: 1.5 }}>
            Regime fiscale al <strong>22% IVA</strong>: include affitto spazi, Agrumeto storico, Giardino delle promesse, Sala Tufo, suite sposi e regia generale.
          </p>
          <div style={{ marginTop: "0.8rem" }}>
            <Link
              href="/admin/servizi"
              style={{ fontSize: "0.82rem", color: "#e58c2c", fontWeight: 700, textDecoration: "none" }}
            >
              Gestisci Catalogo 129 Servizi & Split →
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Azioni Rapide a Portata di Mano */}
      <QuickActionsBar />

      {/* 5. Registro Preventivi & Conversione 1-Click */}
      <QuotesTable quotes={quotes} signedPdfs={signedPdfs} />

    </div>
  );
}
