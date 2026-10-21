import React from "react";
import Link from "next/link";
import { getStore, getWeddingDiaryLocal } from "@/lib/localDb";
import { getOpenDayStats } from "@/lib/openDayTracker";
import { computeDiaryProgress } from "@/app/cliente/components/weddingDiaryFields";
import { createDiaryShareToken } from "@/lib/magicLinkAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminOpenDayDashboardPage() {
  const store = getStore();
  const stats = getOpenDayStats();
  const clients = store.clients || [];

  // Filtra i lead provenienti dall'Open Day
  const openDayClients = clients
    .filter(
      (c: any) =>
        c?.provenienza === "QR Code Open Day" ||
        (c?.tags && c.tags.includes("Open Day"))
    )
    .map((c: any) => {
      const diary = getWeddingDiaryLocal(c.id);
      const progress = computeDiaryProgress(diary?.answers);
      return {
        ...c,
        diaryProgress: progress,
        diaryAnswers: diary?.answers || {},
      };
    });

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.2rem", marginBottom: "2.5rem" }}>
        
        {/* Scansioni */}
        <div style={{ background: "#ffffff", padding: "1.4rem", borderRadius: "18px", border: "1px solid #E8E2D8", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#6A6764", fontWeight: 600 }}>Scansioni QR Code Rilevate</span>
            <span style={{ fontSize: "1.2rem" }}>📷</span>
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#2B2B2B" }}>
            {stats.totalScans}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#2D5A27", marginTop: "0.3rem", fontWeight: 600 }}>
            {stats.totalScans > 0 ? "🟢 Tracciamento attivo live" : "In attesa delle prime scansioni"}
          </div>
        </div>

        {/* Diari Avviati */}
        <div style={{ background: "#ffffff", padding: "1.4rem", borderRadius: "18px", border: "1px solid #E8E2D8", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#6A6764", fontWeight: 600 }}>Coppie Registrate nel Diario</span>
            <span style={{ fontSize: "1.2rem" }}>💍</span>
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#E58C2C" }}>
            {openDayClients.length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#8E8880", marginTop: "0.3rem" }}>
            Lead qualificati con nome, email e WhatsApp
          </div>
        </div>

        {/* Tasso di Conversione */}
        <div style={{ background: "#ffffff", padding: "1.4rem", borderRadius: "18px", border: "1px solid #E8E2D8", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#6A6764", fontWeight: 600 }}>Tasso Conversione Scansione ➔ Diario</span>
            <span style={{ fontSize: "1.2rem" }}>📈</span>
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#2D5A27" }}>
            {stats.totalScans > 0 ? `${Math.round((openDayClients.length / stats.totalScans) * 100)}%` : "—"}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#8E8880", marginTop: "0.3rem" }}>
            Efficacia dell'accoglienza in villa
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
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E8E2D8", color: "#8E8880", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <th style={{ padding: "0.8rem 1rem" }}>Coppia Sposi</th>
                  <th style={{ padding: "0.8rem 1rem" }}>Contatti (Email / WhatsApp)</th>
                  <th style={{ padding: "0.8rem 1rem" }}>Periodo Sognato</th>
                  <th style={{ padding: "0.8rem 1rem" }}>Progresso Diario</th>
                  <th style={{ padding: "0.8rem 1rem", textAlign: "right" }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {openDayClients.map((c: any) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #F0EAE1" }}>
                    <td style={{ padding: "1rem", fontWeight: 600, color: "#2B2B2B" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>💍</span>
                        <span>{c.nome} {c.cognome || ""}</span>
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "#8E8880", marginTop: "0.2rem" }}>
                        Registrato: {new Date(c.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontSize: "0.88rem", color: "#2B2B2B" }}>{c.email}</div>
                      <div style={{ fontSize: "0.8rem", color: "#2D5A27", fontWeight: 600, marginTop: "0.15rem" }}>
                        {c.telefono_display || c.telefono}
                      </div>
                    </td>

                    <td style={{ padding: "1rem", color: "#514D48" }}>
                      {c.data_evento_sognata || "Da definire"}
                    </td>

                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ flex: 1, maxWidth: "100px", height: "6px", background: "#E8E2D8", borderRadius: "999px", overflow: "hidden" }}>
                          <div style={{ width: `${c.diaryProgress}%`, height: "100%", background: c.diaryProgress >= 80 ? "#2D5A27" : "#E58C2C" }} />
                        </div>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: c.diaryProgress >= 80 ? "#2D5A27" : "#E58C2C" }}>
                          {c.diaryProgress}%
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                        <Link
                          href={`/openday/diario?id=${c.id}`}
                          target="_blank"
                          style={{
                            padding: "0.4rem 0.8rem",
                            borderRadius: "8px",
                            background: "#FAF8F5",
                            border: "1px solid #E8E2D8",
                            color: "#2B2B2B",
                            textDecoration: "none",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          👁️ Guarda Diario
                        </Link>

                        {c.telefono && (
                          <a
                            href={`https://wa.me/${c.telefono.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Gentili ${c.nome}, grazie per la visita a La Terra degli Aranci! Ecco il vostro Wedding Diary custodito: https://ecosistema.laterradegliaranci.it/openday/diario?id=${c.id}&share=${createDiaryShareToken(c.id)}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "0.4rem 0.8rem",
                              borderRadius: "8px",
                              background: "#25D366",
                              color: "#ffffff",
                              textDecoration: "none",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                            }}
                          >
                            💬 WhatsApp
                          </a>
                        )}
                      </div>
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
