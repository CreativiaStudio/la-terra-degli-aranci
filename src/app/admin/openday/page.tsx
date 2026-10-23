import React from "react";
import Link from "next/link";
import { getStore, getWeddingDiaryLocal } from "@/lib/localDb";
import { computeDiaryProgress } from "@/app/cliente/components/weddingDiaryFields";
import { createDiaryShareToken } from "@/lib/magicLinkAuth";
import { getOpenDayAdminData } from "@/lib/openDayCloudSync";

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
  const totalScans = Math.max(cloudData.stats.totalScans, openDayClients.length > 0 ? openDayClients.length : 0);
  const totalRegistered = openDayClients.length;
  const conversionRate = totalScans > 0 ? Math.round((totalRegistered / totalScans) * 100) : 0;

  const stats = {
    totalScans,
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
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
          margin-bottom: 2.5rem;
        }
        @media (max-width: 1024px) and (min-width: 580px) {
          .openday-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 579px) {
          .openday-kpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="openday-kpi-grid">
        
        {/* Scansioni */}
        <div style={{ background: "#ffffff", padding: "1.25rem 1.15rem", borderRadius: "18px", border: "1px solid #E8E2D8", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#6A6764", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Scansioni QR Code Rilevate</span>
            <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>📷</span>
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#2B2B2B" }}>
            {stats.totalScans}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#2D5A27", marginTop: "0.3rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {stats.totalScans > 0 ? "🟢 Tracciamento attivo live" : "In attesa delle prime scansioni"}
          </div>
        </div>

        {/* Diari Avviati */}
        <div style={{ background: "#ffffff", padding: "1.25rem 1.15rem", borderRadius: "18px", border: "1px solid #E8E2D8", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#6A6764", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Coppie Registrate nel Diario</span>
            <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>💍</span>
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#E58C2C" }}>
            {openDayClients.length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#8E8880", marginTop: "0.3rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Lead qualificati con nome, email e WhatsApp
          </div>
        </div>

        {/* Tasso di Conversione */}
        <div style={{ background: "#ffffff", padding: "1.25rem 1.15rem", borderRadius: "18px", border: "1px solid #E8E2D8", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#6A6764", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Tasso Conversione Scansione ➔ Diario</span>
            <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>📈</span>
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#2D5A27" }}>
            {stats.totalScans > 0 ? `${Math.round((openDayClients.length / stats.totalScans) * 100)}%` : "—"}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#8E8880", marginTop: "0.3rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Efficacia dell'accoglienza in villa
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
                        <Link
                          href={`/admin/crm?client=${c.id}`}
                          style={{
                            color: "#1e1b18",
                            textDecoration: "none",
                            fontWeight: 700,
                            borderBottom: "1px dashed #e58c2c",
                          }}
                          title="Apri Scheda Cliente 360° nel CRM"
                        >
                          {c.nome} {c.cognome || ""}
                        </Link>
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

                    <td style={{ padding: "0.8rem 1rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "inline-flex", justifyContent: "flex-end", alignItems: "center", gap: "0.45rem", whiteSpace: "nowrap" }}>
                        <Link
                          href={`/admin/clienti/${c.id}`}
                          style={{
                            padding: "0.45rem 0.8rem",
                            borderRadius: "9px",
                            background: "#1e1b18",
                            color: "#ffffff",
                            textDecoration: "none",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                            whiteSpace: "nowrap",
                          }}
                          title="Apri Scheda CRM 360° della Coppia"
                        >
                          <span>👥</span>
                          <span>Scheda CRM</span>
                        </Link>

                        <Link
                          href={`/admin/contratti?nome=${encodeURIComponent(c.nome)}${(c as any).sposera_nome ? `&partner_nome=${encodeURIComponent((c as any).sposera_nome)}` : ""}&email=${encodeURIComponent(c.email || "")}&telefono=${encodeURIComponent(c.telefono || "")}&data=${encodeURIComponent(c.dataSognata || "")}`}
                          style={{
                            padding: "0.45rem 0.8rem",
                            borderRadius: "9px",
                            background: "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)",
                            color: "#ffffff",
                            textDecoration: "none",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            boxShadow: "0 2px 6px rgba(229,140,44,0.28)",
                            whiteSpace: "nowrap",
                          }}
                          title="Converti in Contratto Sposi (Opzione 7gg)"
                        >
                          <span>✍️</span>
                          <span>Emetti Contratto</span>
                        </Link>

                        <Link
                          href={`/openday/diario?id=${c.id}`}
                          target="_blank"
                          style={{
                            padding: "0.45rem 0.8rem",
                            borderRadius: "9px",
                            background: "#FAF8F5",
                            border: "1px solid #E8E2D8",
                            color: "#2B2B2B",
                            textDecoration: "none",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            whiteSpace: "nowrap",
                          }}
                          title="Visualizza Wedding Diary compilato dagli sposi"
                        >
                          <span>👁️</span>
                          <span>Guarda Diario</span>
                        </Link>

                        {c.telefono && (
                          <a
                            href={`https://wa.me/${c.telefono.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Gentili ${c.nome}, grazie per la visita a La Terra degli Aranci! Ecco il vostro Wedding Diary custodito: https://ecosistema.laterradegliaranci.it/openday/diario?id=${c.id}&share=${createDiaryShareToken(c.id)}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "9px",
                              background: "#25D366",
                              color: "#ffffff",
                              textDecoration: "none",
                              fontSize: "1rem",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 2px 6px rgba(37,211,102,0.25)",
                              flexShrink: 0,
                            }}
                            title={`Invia Wedding Diary su WhatsApp a ${c.nome} (${c.telefono})`}
                            aria-label="Contatta su WhatsApp"
                          >
                            <span style={{ lineHeight: 1 }}>💬</span>
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
