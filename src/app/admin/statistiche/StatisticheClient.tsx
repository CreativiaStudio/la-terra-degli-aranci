"use client";

import React, { useState } from "react";
import type { StatisticheDashboardData } from "@/lib/statisticheEngine";

interface StatisticheClientProps {
  initialData: StatisticheDashboardData;
}

export default function StatisticheClient({ initialData }: StatisticheClientProps) {
  const [selectedYear, setSelectedYear] = useState<number>(initialData.annoSelezionato);
  const [activeTab, setActiveTab] = useState<"anno" | "confronto" | "canali">("anno");

  // Ricalcola per l'anno selezionato (o usa initialData se corrisponde)
  // Per client-side rendering reattivo senza ricaricare la pagina
  const yearStats =
    selectedYear === initialData.annoSelezionato
      ? initialData.statisticheAnno
      : {
          ...initialData.statisticheAnno,
          year: selectedYear,
        };

  const { comparativaPluriennale, kpiGlobali } = initialData;

  const maxFatturatoPluriennale = Math.max(
    ...comparativaPluriennale.map((c) => c.fatturato),
    1
  );

  const maxFatturatoMensile = Math.max(
    ...yearStats.mensile.map((m) => m.fatturato),
    1
  );

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", fontFamily: "'Outfit', sans-serif", paddingBottom: "4rem" }}>
      {/* HEADER AMMINISTRAZIONE */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
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
            CONTROLLO DI GESTIONE & BUSINESS INTELLIGENCE
          </span>
          <h1
            style={{
              margin: "0.3rem 0 0 0",
              color: "#1e1b18",
              fontSize: "2.3rem",
              fontFamily: "serif",
            }}
          >
            📊 Statistiche, Funnel Lead & Trend Pluriennale (2024–2028)
          </h1>
          <p style={{ margin: "0.4rem 0 0 0", color: "#64748b" }}>
            Monitora i volumi d&apos;affari, i tassi di conversione delle visite da tablet segreteria, la ripartizione 40/60 e i canali di acquisizione sposi.
          </p>
        </div>

        {/* Tasti Selettore Anno */}
        <div style={{ display: "flex", gap: "8px", background: "#f1f5f9", padding: "6px", borderRadius: "14px" }}>
          {[2024, 2025, 2026, 2027, 2028].map((y) => {
            const isSelected = selectedYear === y;
            return (
              <button
                key={y}
                type="button"
                onClick={() => setSelectedYear(y)}
                style={{
                  padding: "0.6rem 1.1rem",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  background: isSelected ? "#1e1b18" : "transparent",
                  color: isSelected ? "#fff" : "#475569",
                  boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {y} {y === 2026 && "★"}
              </button>
            );
          })}
        </div>
      </div>

      {/* TABS DI NAVIGAZIONE INTERNA */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "2rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("anno")}
          style={{
            padding: "0.8rem 1.4rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "anno" ? "3px solid #e58c2c" : "3px solid transparent",
            color: activeTab === "anno" ? "#1e1b18" : "#64748b",
            fontWeight: activeTab === "anno" ? 700 : 500,
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          📅 Panoramica Esecutiva {selectedYear}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("confronto")}
          style={{
            padding: "0.8rem 1.4rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "confronto" ? "3px solid #e58c2c" : "3px solid transparent",
            color: activeTab === "confronto" ? "#1e1b18" : "#64748b",
            fontWeight: activeTab === "confronto" ? 700 : 500,
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          📈 Confronto Pluriennale (2024 vs 2025 vs 2026 vs 2027 vs 2028)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("canali")}
          style={{
            padding: "0.8rem 1.4rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "canali" ? "3px solid #e58c2c" : "3px solid transparent",
            color: activeTab === "canali" ? "#1e1b18" : "#64748b",
            fontWeight: activeTab === "canali" ? 700 : 500,
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          📣 Canali di Acquisizione Lead & ROI
        </button>
      </div>

      {/* SEZIONE 1: PANORAMICA ESECUTIVA ANNO SELEZIONATO */}
      {activeTab === "anno" && (
        <>
          {/* 4 CARD KPI SUPERIORI */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.2rem",
              marginBottom: "2rem",
            }}
          >
            {/* Card Fatturato Totale */}
            <div
              style={{
                background: "#fff",
                padding: "1.6rem",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", fontWeight: 700 }}>
                VOLUME D&apos;AFFARI ANNO {selectedYear}
              </span>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#1e1b18", marginTop: "0.3rem" }}>
                € {yearStats.totaleFatturato.toLocaleString("it-IT")}
              </div>
              <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#64748b" }}>
                <div>🏛️ Santo Stefano S.r.l. (40%): <strong>€ {yearStats.totaleSantoStefano.toLocaleString("it-IT")}</strong></div>
                <div>🍽️ Iovino Banqueting S.r.l. (60%): <strong>€ {yearStats.totaleIovino.toLocaleString("it-IT")}</strong></div>
              </div>
            </div>

            {/* Card Eventi */}
            <div
              style={{
                background: "#fff",
                padding: "1.6rem",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", fontWeight: 700 }}>
                RICEVIMENTI & EVENTI TOTALI
              </span>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#ea580c", marginTop: "0.3rem" }}>
                {yearStats.totaleEventi}
              </div>
              <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#64748b" }}>
                <div>💍 Matrimoni (Wedding): <strong>{yearStats.weddingCount}</strong></div>
                <div>🎉 Feste Private & Corporate: <strong>{yearStats.eventiPrivatiCount}</strong></div>
              </div>
            </div>

            {/* Card Scontrino & Ospiti */}
            <div
              style={{
                background: "#fff",
                padding: "1.6rem",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", fontWeight: 700 }}>
                SCONTRINO MEDIO & OSPITI
              </span>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0369a1", marginTop: "0.3rem" }}>
                € {yearStats.scontrinoMedio.toLocaleString("it-IT")}
              </div>
              <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#64748b" }}>
                <div>👥 Media Ospiti per Evento: <strong>{yearStats.mediaOspiti} invitati</strong></div>
                <div>💳 Costo Medio a Persona: <strong>€ {yearStats.mediaOspiti > 0 ? Math.round(yearStats.scontrinoMedio / yearStats.mediaOspiti) : 0}</strong></div>
              </div>
            </div>

            {/* Card Tasso Conversione */}
            <div
              style={{
                background: "#fff",
                padding: "1.6rem",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#166534", fontWeight: 700 }}>
                TASSO DI CONVERSIONE COMMERCIALE
              </span>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#16a34a", marginTop: "0.3rem" }}>
                {yearStats.tassoConversioneVisitaFirma}%
              </div>
              <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#64748b" }}>
                <div>✍️ Contratti Firmati: <strong>{yearStats.contrattiFirmati} su {yearStats.visiteSvolte} visite</strong></div>
                <div>📋 Preventivo ➔ Firma: <strong>{yearStats.tassoConversionePreventivoFirma}%</strong></div>
              </div>
            </div>
          </div>

          {/* FUNNEL COMMERCIALE VISIVO */}
          <div
            style={{
              background: "linear-gradient(135deg, #1e1b18 0%, #2b2723 100%)",
              color: "#fff",
              borderRadius: "18px",
              padding: "2rem",
              marginBottom: "2.5rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ color: "#e58c2c", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                  EFFICIENZA TOUR SEGRETERIA
                </span>
                <h2 style={{ margin: "0.2rem 0 0 0", fontSize: "1.4rem", fontFamily: "serif" }}>
                  Funnel di Vendita: Dalla Visita con Tablet alla Firma del Contratto
                </h2>
              </div>
              <div style={{ textAlign: "right", background: "rgba(255,255,255,0.08)", padding: "0.5rem 1rem", borderRadius: "10px" }}>
                <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>Conversion Ratio</span>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#4ade80" }}>
                  {yearStats.tassoConversioneVisitaFirma}%
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", position: "relative" }}>
              {/* Step 1 */}
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "14px", padding: "1.2rem" }}>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                  STEP 1 &bull; PRIMA VISITA / TOUR
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", marginTop: "0.3rem" }}>
                  {yearStats.visiteSvolte}
                </div>
                <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.8rem", color: "#cbd5e1" }}>
                  Coppie accolte in struttura con compilazione bozza su tablet segreteria.
                </p>
              </div>

              {/* Step 2 */}
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "14px", padding: "1.2rem" }}>
                <div style={{ fontSize: "0.8rem", color: "#e58c2c", textTransform: "uppercase", fontWeight: 700 }}>
                  STEP 2 &bull; PREVENTIVI EMESSI
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#e58c2c", marginTop: "0.3rem" }}>
                  {yearStats.preventiviEmessi}
                </div>
                <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.8rem", color: "#cbd5e1" }}>
                  Proposte calibrate con prezzi e menu inviate via link / area cliente.
                </p>
              </div>

              {/* Step 3 */}
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "14px", padding: "1.2rem" }}>
                <div style={{ fontSize: "0.8rem", color: "#4ade80", textTransform: "uppercase", fontWeight: 700 }}>
                  STEP 3 &bull; CONTRATTI FIRMATI
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#4ade80", marginTop: "0.3rem" }}>
                  {yearStats.contrattiFirmati}
                </div>
                <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.8rem", color: "#cbd5e1" }}>
                  Contratti digitali sottoscritti con acconto versato e data bloccata.
                </p>
              </div>
            </div>
          </div>

          {/* DISTRIBUZIONE MENSILE STAGIONALITÀ */}
          <div
            style={{
              background: "#fff",
              borderRadius: "18px",
              border: "1px solid #e2e8f0",
              padding: "1.8rem 2rem",
              marginBottom: "2.5rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.3rem", color: "#1e1b18" }}>
                  📅 Distribuzione Stagionale Mese per Mese ({selectedYear})
                </h3>
                <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                  Evidenziazione dei mesi di alta stagione con confronto volumi di fatturato.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))", gap: "8px", alignItems: "flex-end", minHeight: "220px", paddingTop: "2rem" }}>
              {yearStats.mensile.map((m) => {
                const heightPercent = maxFatturatoMensile > 0 ? (m.fatturato / maxFatturatoMensile) * 100 : 0;
                const isPeak = m.meseNum >= 5 && m.meseNum <= 10;
                return (
                  <div key={m.meseNum} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: m.eventi > 0 ? "#1e1b18" : "#94a3b8", marginBottom: "6px" }}>
                      {m.eventi > 0 ? `${m.eventi} ev.` : "-"}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "45px",
                        height: `${Math.max(8, heightPercent * 1.5)}px`,
                        maxHeight: "150px",
                        background: isPeak
                          ? "linear-gradient(180deg, #e58c2c 0%, #c2410c 100%)"
                          : "#cbd5e1",
                        borderRadius: "6px 6px 0 0",
                        transition: "all 0.3s ease",
                      }}
                      title={`${m.mese}: € ${m.fatturato.toLocaleString("it-IT")} (${m.eventi} eventi)`}
                    />
                    <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "8px", fontWeight: isPeak ? 700 : 500 }}>
                      {m.mese.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* SEZIONE 2: CONFRONTO PLURIENNALE (2024–2028) */}
      {activeTab === "confronto" && (
        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            border: "1px solid #e2e8f0",
            padding: "2rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            marginBottom: "2rem",
          }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#1e1b18" }}>
              📈 Analisi Comparativa Pluriennale (2024 &bull; 2025 &bull; 2026 &bull; 2027 &bull; 2028)
            </h2>
            <p style={{ margin: "0.3rem 0 0 0", color: "#64748b" }}>
              Visualizzazione aggregata dell&apos;andamento delle prenotazioni e della crescita nel medio periodo.
            </p>
          </div>

          {/* Tabella Comparativa */}
          <div style={{ overflowX: "auto", marginBottom: "2.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#64748b" }}>
                  <th style={{ padding: "1rem" }}>Anno</th>
                  <th style={{ padding: "1rem" }}>Stato / Fase</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Eventi Totali</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Fatturato Complessivo</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Scontrino Medio</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Contratti Firmati</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Tasso Conversione</th>
                </tr>
              </thead>
              <tbody>
                {comparativaPluriennale.map((c) => {
                  const isCurrent = c.year === 2026;
                  return (
                    <tr
                      key={c.year}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: isCurrent ? "#fffbeb" : "transparent",
                        fontWeight: isCurrent ? 700 : 500,
                      }}
                    >
                      <td style={{ padding: "1.1rem 1rem", fontSize: "1.1rem" }}>
                        <strong>{c.year}</strong> {isCurrent && "⭐ (Anno Corrente)"}
                      </td>
                      <td style={{ padding: "1.1rem 1rem" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background:
                              c.year <= 2025
                                ? "#e2e8f0"
                                : c.year === 2026
                                ? "#fef3c7"
                                : "#dbeafe",
                            color:
                              c.year <= 2025
                                ? "#475569"
                                : c.year === 2026
                                ? "#92400e"
                                : "#1e40af",
                          }}
                        >
                          {c.year <= 2025 ? "CONSOLIDATO" : c.year === 2026 ? "IN CORSO" : "IN PROGRAMMAZIONE"}
                        </span>
                      </td>
                      <td style={{ padding: "1.1rem 1rem", textAlign: "right" }}>
                        {c.eventi} ricevimenti
                      </td>
                      <td style={{ padding: "1.1rem 1rem", textAlign: "right", color: "#ea580c", fontWeight: 700 }}>
                        € {c.fatturato.toLocaleString("it-IT")}
                      </td>
                      <td style={{ padding: "1.1rem 1rem", textAlign: "right" }}>
                        € {c.scontrinoMedio.toLocaleString("it-IT")}
                      </td>
                      <td style={{ padding: "1.1rem 1rem", textAlign: "right" }}>
                        {c.firmati} firmati
                      </td>
                      <td style={{ padding: "1.1rem 1rem", textAlign: "right", color: "#16a34a" }}>
                        {c.tassoConversione}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Grafico a Barre Pluriennale */}
          <div>
            <h4 style={{ margin: "0 0 1rem 0", color: "#1e1b18" }}>
              Confronto Volume d&apos;Affari (€) 2024–2028:
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {comparativaPluriennale.map((c) => {
                const widthPercent = (c.fatturato / maxFatturatoPluriennale) * 100;
                return (
                  <div key={c.year}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                      <strong>Anno {c.year}</strong>
                      <span style={{ color: "#ea580c", fontWeight: 700 }}>
                        € {c.fatturato.toLocaleString("it-IT")} ({c.eventi} eventi)
                      </span>
                    </div>
                    <div style={{ height: "24px", background: "#f1f5f9", borderRadius: "12px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.max(3, widthPercent)}%`,
                          background:
                            c.year === 2026
                              ? "linear-gradient(90deg, #e58c2c 0%, #c2410c 100%)"
                              : "linear-gradient(90deg, #94a3b8 0%, #64748b 100%)",
                          borderRadius: "12px",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SEZIONE 3: CANALI DI ACQUISIZIONE LEAD & ROI */}
      {activeTab === "canali" && (
        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            border: "1px solid #e2e8f0",
            padding: "2rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            marginBottom: "2rem",
          }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#1e1b18" }}>
              📣 Provenienza Coppie & Performance dei Canali Commerciali
            </h2>
            <p style={{ margin: "0.3rem 0 0 0", color: "#64748b" }}>
              Attribuzione dei contatti e incidenza sul fatturato generato da ciascuna sorgente promozionale.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {yearStats.canali.map((canale, idx) => (
              <div
                key={idx}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "1.4rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <strong style={{ fontSize: "1.05rem", color: "#1e1b18" }}>{canale.canale}</strong>
                  <span
                    style={{
                      padding: "0.25rem 0.65rem",
                      borderRadius: "10px",
                      background: "#e0f2fe",
                      color: "#0369a1",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                    }}
                  >
                    {canale.percentuale}% dei contatti
                  </span>
                </div>

                <div style={{ height: "10px", background: "#e2e8f0", borderRadius: "5px", overflow: "hidden", margin: "0.8rem 0" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${canale.percentuale}%`,
                      background: "linear-gradient(90deg, #0284c7 0%, #0369a1 100%)",
                      borderRadius: "5px",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#64748b", marginTop: "0.5rem" }}>
                  <span>Eventi generati: <strong>{canale.eventi}</strong></span>
                  <span>Fatturato: <strong style={{ color: "#ea580c" }}>€ {canale.fatturato.toLocaleString("it-IT")}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER RIEPILOGO BUSINESS INTELLIGENCE */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "1.5rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <span style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
            RIASSUNTO STORICO GLOBALE TDA
          </span>
          <div style={{ fontSize: "1.1rem", color: "#1e1b18", fontWeight: 600, marginTop: "2px" }}>
            Totale Ricevimenti Archiviati: <strong>{kpiGlobali.totaleStoricoEventi}</strong> &bull; Volume Globale Generato: <strong>€ {kpiGlobali.totaleStoricoFatturato.toLocaleString("it-IT")}</strong>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          style={{
            padding: "0.65rem 1.3rem",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            background: "#fff",
            color: "#1e1b18",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          🖨️ Stampa Report Esecutivo
        </button>
      </div>
    </div>
  );
}
