import React from "react";
import Link from "next/link";
import { getStore, getWeddingDiaryLocal } from "@/lib/localDb";
import { computeDiaryProgress } from "@/app/cliente/components/weddingDiaryFields";
import { createDiaryShareToken } from "@/lib/magicLinkAuth";
import { getOpenDayAdminData } from "@/lib/openDayCloudSync";
import OpenDayActionsMenu from "./OpenDayActionsMenu";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminOpenDayDashboardPage() {
  const cloudData = await getOpenDayAdminData();
  const store = getStore();
  const localClients = (store.clients || []).filter(
    (c: any) =>
      c?.provenienza === "QR Code Open Day" ||
      (c?.tags && c.tags.includes("Open Day"))
  );

  // Unione dedup tra Cloudflare R2 (persistente globale) e localDb
  const clientMap = new Map<string, any>();
  for (const c of cloudData.openDayClients) {
    clientMap.set(c.id, c);
  }
  for (const c of localClients) {
    if (!clientMap.has(c.id)) {
      const diary = getWeddingDiaryLocal(c.id);
      clientMap.set(c.id, {
        ...c,
        diaryProgress: computeDiaryProgress(diary?.answers),
        diaryAnswers: diary?.answers || {},
      });
    }
  }

  const openDayClients = Array.from(clientMap.values());
  const rawTotalScans = cloudData.stats.totalScans ?? 0;
  const rawUniqueScans = cloudData.stats.uniqueScans ?? rawTotalScans;
  const totalScans = Math.max(rawTotalScans, openDayClients.length > 0 ? openDayClients.length : 0);
  const uniqueScans = Math.max(rawUniqueScans, openDayClients.length > 0 ? openDayClients.length : 0);
  const totalRegistered = openDayClients.length;

  // Calcolo tasso di conversione su base scansioni uniche: robusto a div per zero e capped a 100%
  const conversionRate = uniqueScans > 0 ? Math.min(100, Math.round((totalRegistered / uniqueScans) * 100)) : 0;

  const stats = {
    totalScans,
    uniqueScans,
    totalRegistered,
    conversionRate,
    recentScans: cloudData.stats.recentScans || [],
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1280px", margin: "0 auto", fontFamily: "'Outfit', sans-serif", color: "#2B2B2B" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🌿</span>
            <span style={{ fontSize: "0.85rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#2D5A27", fontWeight: 700 }}>
              Regia Direzionale
            </span>
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 0.4rem 0", color: "#2B2B2B" }}>
            Monitoraggio Live Open Day 2026
          </h1>
          <p style={{ margin: 0, color: "#6A6764", fontSize: "0.95rem" }}>
            Tracciamento in tempo reale delle scansioni QR Code e dei Wedding Diary compilati in villa.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <a
            href="/openday/qr/Cartoncino_Tavolo_OpenDay_A5.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "0.7rem 1.2rem",
              background: "#E58C2C",
              color: "#ffffff",
              borderRadius: "12px",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 4px 12px rgba(229,140,44,0.25)",
            }}
          >
            <span>🖨️</span>
            <span>Stampa Cartoncino A5</span>
          </a>

          <a
            href="/openday/qr/QR_01_Botanico_Chic_300DPI.png"
            download="QR_LaTerraDegliAranci_300DPI.png"
            style={{
              padding: "0.7rem 1.2rem",
              background: "#2D5A27",
              color: "#ffffff",
              borderRadius: "12px",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span>⬇️</span>
            <span>Scarica QR Code HD</span>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <style>{`
        .openday-kpi-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 1rem;
          margin-bottom: 2.5rem;
        }
        @media (max-width: 1200px) and (min-width: 768px) {
          .openday-kpi-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 767px) {
          .openday-kpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="openday-kpi-grid">
        
        {/* Scansioni Totali */}
        <div style={{ background: "#ffffff", padding: "1.25rem 1.15rem", borderRadius: "18px", border: "1px solid #E8E2D8", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#6A6764", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Scansioni Totali QR</span>
            <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>📷</span>
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#2B2B2B" }}>
            {stats.totalScans}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#2D5A27", marginTop: "0.3rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {stats.totalScans > 0 ? "Visualizzazioni totali QR" : "Nessuna scansione"}
          </div>
        </div>

        {/* Scansioni Uniche */}
        <div style={{ background: "#ffffff", padding: "1.25rem 1.15rem", borderRadius: "18px", border: "1px solid #E8E2D8", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#6A6764", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Scansioni Uniche</span>
            <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>📱</span>
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#1e1b18" }}>
            {stats.uniqueScans}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#2D5A27", marginTop: "0.3rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {stats.uniqueScans > 0 ? "🟢 Dispositivi unici rilevati" : "In attesa delle prime scansioni"}
          </div>
        </div>

        {/* Diari Avviati */}
        <div style={{ background: "#ffffff", padding: "1.25rem 1.15rem", borderRadius: "18px", border: "1px solid #E8E2D8", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#6A6764", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Coppie Registrate</span>
            <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>💍</span>
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#E58C2C" }}>
            {openDayClients.length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#8E8880", marginTop: "0.3rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Lead qualificati nel Diario
          </div>
        </div>

        {/* Tasso di Conversione su base Scansioni Uniche */}
        <div style={{ background: "#ffffff", padding: "1.25rem 1.15rem", borderRadius: "18px", border: "1px solid #E8E2D8", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#6A6764", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Tasso Conversione Uniche ➔ Diario</span>
            <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>📈</span>
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#2D5A27" }}>
            {stats.uniqueScans > 0 ? `${stats.conversionRate}%` : "—"}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#8E8880", marginTop: "0.3rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Calcolato su scansioni uniche
          </div>
        </div>

        {/* Funnel CRM & Statistiche */}
        <div style={{ background: "#ffffff", padding: "1.25rem 1.15rem", borderRadius: "18px", border: "1px solid #E8E2D8", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#6A6764", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Evoluzione Lead nel CRM</span>
            <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>📊</span>
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#1e1b18" }}>
            {openDayClients.length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#2D5A27", marginTop: "0.3rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <Link href="/admin/statistiche?preset=openday" style={{ color: "#2D5A27", textDecoration: "none" }}>
              Analisi tassi chiusura in Statistiche →
            </Link>
          </div>
        </div>

      </div>

      {/* Tabella Coppie Sposi */}
      <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #E8E2D8", padding: "1.5rem", boxShadow: "0 8px 24px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.2rem 0" }}>
              Coppie Connesse & Wedding Diary ({openDayClients.length})
            </h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#6A6764" }}>
              Le coppie compaiono qui in tempo reale man mano che inquadrano il QR Code e aprono il loro diario.
            </p>
          </div>
        </div>

        {openDayClients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", background: "#FAF8F5", borderRadius: "16px", border: "1px dashed #E8E2D8" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🌿</div>
            <div style={{ fontWeight: 600, color: "#2B2B2B", marginBottom: "0.2rem" }}>
              Nessuna coppia registrata finora
            </div>
            <div style={{ fontSize: "0.85rem", color: "#8E8880", maxWidth: "420px", margin: "0 auto" }}>
              Domenica durante l'Open Day, appena gli sposi inquadreranno il QR Code, vedrai comparire qui i loro nomi, i desideri espressi e lo stato di avanzamento del diario.
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", overflow: "visible" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E8E2D8", color: "#8E8880", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <th style={{ padding: "0.8rem 0.8rem", width: "26%" }}>Coppia Sposi</th>
                  <th style={{ padding: "0.8rem 0.8rem", width: "30%" }}>Contatti (Email / WhatsApp)</th>
                  <th style={{ padding: "0.8rem 0.8rem", width: "18%" }}>Periodo Sognato</th>
                  <th style={{ padding: "0.8rem 0.8rem", width: "18%" }}>Progresso Diario</th>
                  <th style={{ padding: "0.8rem 0.8rem", width: "8%", textAlign: "right" }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {openDayClients.map((c: any) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #F0EAE1" }}>
                    <td style={{ padding: "0.9rem 0.8rem", fontWeight: 600, color: "#2B2B2B" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>💍</span>
                        <Link
                          href={`/admin/clienti/${c.id}`}
                          style={{
                            color: "#1e1b18",
                            textDecoration: "none",
                            fontWeight: 700,
                            borderBottom: "1px dashed #e58c2c",
                          }}
                          title="Apri Scheda Cliente 360° nel CRM"
                        >
                          {c.nome} {c.cognome || ""}{" "}
                          {(c as any).sposera_nome ? (
                            <span style={{ color: "#c2410c", fontWeight: 700 }}>
                              &amp; {(c as any).sposera_nome}
                            </span>
                          ) : null}
                        </Link>
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "#8E8880", marginTop: "0.2rem" }}>
                        Registrato: {new Date(c.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    <td style={{ padding: "0.9rem 0.8rem" }}>
                      <div style={{ fontSize: "0.88rem", color: "#2B2B2B" }}>{c.email}</div>
                      <div style={{ fontSize: "0.8rem", color: "#2D5A27", fontWeight: 600, marginTop: "0.15rem" }}>
                        {c.telefono_display || c.telefono}
                      </div>
                    </td>

                    <td style={{ padding: "0.9rem 0.8rem", color: "#514D48" }}>
                      {c.data_evento_sognata || c.dataSognata || "Da definire"}
                    </td>

                    <td style={{ padding: "0.9rem 0.8rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ flex: 1, maxWidth: "100px", height: "6px", background: "#E8E2D8", borderRadius: "999px", overflow: "hidden" }}>
                          <div style={{ width: `${c.diaryProgress}%`, height: "100%", background: c.diaryProgress >= 80 ? "#2D5A27" : "#E58C2C" }} />
                        </div>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: c.diaryProgress >= 80 ? "#2D5A27" : "#E58C2C" }}>
                          {c.diaryProgress}%
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "0.9rem 0.8rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      <OpenDayActionsMenu
                        clientId={c.id}
                        nome={c.nome}
                        partnerNome={(c as any).sposera_nome}
                        email={c.email}
                        telefono={c.telefono}
                        dataSognata={c.data_evento_sognata || c.dataSognata}
                        shareToken={createDiaryShareToken(c.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
