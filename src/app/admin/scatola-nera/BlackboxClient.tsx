"use client";

import React, { useMemo, useState } from "react";
import type {
  BlackboxCategory,
  BlackboxEntry,
  BlackboxLevel,
  BlackboxStats,
} from "@/lib/blackbox";

/* ------------------------------------------------------------------ */
/* Tipi e costanti di presentazione                                    */
/* ------------------------------------------------------------------ */

interface BlackboxClientProps {
  entries: BlackboxEntry[];
  stats: BlackboxStats;
}

type FilterKey = "ALL" | "ERRORS" | BlackboxCategory;

interface PillDef {
  key: FilterKey;
  label: string;
}

const PILLS: PillDef[] = [
  { key: "ALL", label: "Tutti" },
  { key: "ERRORS", label: "🚨 Errori" },
  { key: "CONTRATTI", label: "✍️ Contratti" },
  { key: "CASSA", label: "💶 Cassa" },
  { key: "LEAD_VISITA", label: "📱 Visite iPad" },
  { key: "EVENTI", label: "💍 Eventi" },
  { key: "SISTEMA", label: "⚙️ Sistema" },
];

const CATEGORY_META: Record<BlackboxCategory, { label: string; icon: string }> = {
  CONTRATTI: { label: "Contratti", icon: "✍️" },
  CASSA: { label: "Cassa", icon: "💶" },
  LEAD_VISITA: { label: "Visita iPad", icon: "📱" },
  EVENTI: { label: "Eventi", icon: "💍" },
  CLIENTI: { label: "Clienti", icon: "👥" },
  DIARIO: { label: "Diario", icon: "📖" },
  PDF: { label: "PDF", icon: "📄" },
  SISTEMA: { label: "Sistema", icon: "⚙️" },
};

const LEVEL_META: Record<BlackboxLevel, { bg: string; color: string; label: string }> = {
  INFO: { bg: "#e7f8ee", color: "#15803d", label: "INFO" },
  WARN: { bg: "#fef3c7", color: "#b45309", label: "WARN" },
  ERROR: { bg: "#fee2e2", color: "#b91c1c", label: "ERROR" },
  CRITICAL: { bg: "#7f1d1d", color: "#ffffff", label: "CRITICAL" },
};

/* ------------------------------------------------------------------ */
/* Helper di formattazione                                             */
/* ------------------------------------------------------------------ */

function relativeTime(iso: string): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return "";
  const diffMin = Math.floor((Date.now() - ts) / 60000);
  if (diffMin < 1) return "adesso";
  if (diffMin < 60) return `${diffMin} min fa`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours} h fa`;
  const days = Math.floor(hours / 24);
  return `${days} g fa`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function actorIcon(actor: string): string {
  const a = actor.toLowerCase();
  if (a.includes("roberto") || a.includes("direzione")) return "👔";
  if (a.includes("rosaria")) return "👩‍💼";
  if (a.includes("segreteria") || a.includes("tablet") || a.includes("ipad")) return "📱";
  if (a.includes("cliente") || a.includes("spos")) return "💍";
  if (a.includes("sistema")) return "⚙️";
  return "👤";
}

function isErrorLevel(level: BlackboxLevel): boolean {
  return level === "ERROR" || level === "CRITICAL";
}

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

export default function BlackboxClient({ entries, stats }: BlackboxClientProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (filter === "ERRORS") {
        if (!isErrorLevel(entry.level)) return false;
      } else if (filter !== "ALL") {
        if (entry.category !== filter) return false;
      }

      if (!q) return true;
      let meta = "";
      try {
        meta = entry.metadata ? JSON.stringify(entry.metadata) : "";
      } catch {
        meta = "";
      }
      const haystack = `${entry.actor} ${entry.action} ${entry.message} ${entry.category} ${meta}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, query, filter]);

  const hasErrors = stats.errorsLast24h > 0;

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleExport = () => {
    const payload = JSON.stringify(filtered, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scatola-nera-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const kpis: Array<{ label: string; value: string; hint: string; color: string; icon: string }> = [
    {
      label: "Attività 24h",
      value: String(stats.totalLast24h),
      hint: "eventi registrati",
      color: "#2563eb",
      icon: "📊",
    },
    {
      label: "Errori Rilevati",
      value: String(stats.errorsLast24h),
      hint: "nelle ultime 24 ore",
      color: hasErrors ? "#dc2626" : "#16a34a",
      icon: hasErrors ? "🚨" : "✅",
    },
    {
      label: "Avvisi / Conflitti",
      value: String(stats.warningsLast24h),
      hint: "segnalazioni WARN",
      color: "#d97706",
      icon: "⚠️",
    },
    {
      label: "Ritenzione Attiva",
      value: "30 Giorni",
      hint: "Archivio Storico Attivo",
      color: "#7c3aed",
      icon: "🗄️",
    },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Intestazione */}
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#1e1b18", fontFamily: "serif" }}>
          📟 Scatola Nera — Registro Attività &amp; Errori TDA
        </h1>
        <p style={{ margin: "0.5rem 0 0", color: "#6b6560", fontSize: "0.95rem" }}>
          Monitoraggio continuo delle operazioni: contratti, incassi, visite iPad e anomalie di sistema.
        </p>
      </header>

      {/* Banner di stato del sistema */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.9rem",
          padding: "1rem 1.25rem",
          borderRadius: "12px",
          marginBottom: "1.5rem",
          fontWeight: 600,
          fontSize: "0.98rem",
          background: hasErrors ? "#fee2e2" : "#dcfce7",
          color: hasErrors ? "#991b1b" : "#166534",
          border: `1px solid ${hasErrors ? "#fca5a5" : "#86efac"}`,
          boxShadow: hasErrors ? "0 4px 14px rgba(220,38,38,0.12)" : "0 4px 14px rgba(22,163,74,0.12)",
        }}
      >
        <span style={{ fontSize: "1.4rem" }}>{hasErrors ? "🚨" : "🟢"}</span>
        {hasErrors ? (
          <span>
            Attenzione: {stats.errorsLast24h} Errori Rilevati nelle Ultime 24 Ore — verifica i dettagli nel feed
            sottostante.
          </span>
        ) : (
          <span>Tutti i Sistemi Operativi — Nessun Errore nelle Ultime 24 Ore</span>
        )}
      </div>

      {/* KPI */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: "#ffffff",
              border: "1px solid #ece7e1",
              borderRadius: "14px",
              padding: "1.1rem 1.25rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "1px", color: "#8a837c", fontWeight: 700 }}>
                {kpi.label}
              </span>
              <span style={{ fontSize: "1.2rem" }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: "1.9rem", fontWeight: 800, color: kpi.color, marginTop: "0.4rem", lineHeight: 1.1 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#8a837c", marginTop: "0.2rem" }}>{kpi.hint}</div>
          </div>
        ))}
      </div>

      {/* Barra filtri & ricerca */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #ece7e1",
          borderRadius: "14px",
          padding: "1rem 1.25rem",
          marginBottom: "1.25rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per attore, azione, messaggio, cliente..."
            aria-label="Ricerca nella scatola nera"
            style={{
              flex: "1 1 260px",
              minWidth: "220px",
              padding: "0.7rem 0.95rem",
              borderRadius: "10px",
              border: "1px solid #d9d3cc",
              fontSize: "0.9rem",
              outline: "none",
              color: "#1e1b18",
            }}
          />
          <button
            type="button"
            onClick={handleExport}
            style={{
              padding: "0.7rem 1.1rem",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(90deg, #e58c2c 0%, #d47b1e 100%)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(229,140,44,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            📥 Esporta Registro (JSON)
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.9rem" }}>
          {PILLS.map((pill) => {
            const active = filter === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => setFilter(pill.key)}
                style={{
                  padding: "0.45rem 0.85rem",
                  borderRadius: "999px",
                  border: active ? "1px solid #e58c2c" : "1px solid #ddd7d0",
                  background: active ? "#fdf1e2" : "#ffffff",
                  color: active ? "#b96a12" : "#5f5952",
                  fontWeight: active ? 700 : 500,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed Cronologico */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #ece7e1",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.9rem 1.25rem",
            borderBottom: "1px solid #f0ebe5",
            background: "#faf8f5",
          }}
        >
          <strong style={{ color: "#1e1b18", fontSize: "0.95rem" }}>Feed Cronologico</strong>
          <span style={{ color: "#8a837c", fontSize: "0.82rem" }}>
            {filtered.length} event{filtered.length === 1 ? "o" : "i"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "#8a837c" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🗒️</div>
            Nessun evento corrisponde ai filtri selezionati.
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {filtered.map((entry, index) => {
              const levelMeta = LEVEL_META[entry.level] ?? LEVEL_META.INFO;
              const catMeta = CATEGORY_META[entry.category] ?? { label: entry.category, icon: "•" };
              const isOpen = Boolean(expanded[entry.id]);
              const hasDetails = Boolean(entry.metadata || entry.errorDetails);

              return (
                <li
                  key={entry.id}
                  style={{ borderTop: index === 0 ? "none" : "1px solid #f0ebe5" }}
                >
                  <div
                    onClick={() => hasDetails && toggleExpanded(entry.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "150px 78px 1fr auto",
                      gap: "1rem",
                      alignItems: "start",
                      padding: "1rem 1.25rem",
                      cursor: hasDetails ? "pointer" : "default",
                    }}
                  >
                    {/* Orario */}
                    <div style={{ fontSize: "0.82rem", color: "#6b6560", lineHeight: 1.35 }}>
                      <div style={{ fontWeight: 600, color: "#3f3a34" }}>{relativeTime(entry.timestamp)}</div>
                      <div>{formatDateTime(entry.timestamp)}</div>
                    </div>

                    {/* Livello */}
                    <span
                      style={{
                        display: "inline-block",
                        textAlign: "center",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "6px",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        letterSpacing: "0.5px",
                        background: levelMeta.bg,
                        color: levelMeta.color,
                      }}
                    >
                      {levelMeta.label}
                    </span>

                    {/* Corpo */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, color: "#1e1b18", fontSize: "0.9rem" }}>
                          {actorIcon(entry.actor)} {entry.actor}
                        </span>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "#7c736a",
                            background: "#f4f0eb",
                            borderRadius: "999px",
                            padding: "0.12rem 0.55rem",
                            fontWeight: 600,
                          }}
                        >
                          {catMeta.icon} {catMeta.label}
                        </span>
                        <code
                          style={{
                            fontSize: "0.74rem",
                            color: "#b96a12",
                            background: "#fdf1e2",
                            borderRadius: "6px",
                            padding: "0.1rem 0.45rem",
                            fontWeight: 700,
                          }}
                        >
                          {entry.action}
                        </code>
                      </div>
                      <div style={{ marginTop: "0.35rem", color: "#4b453f", fontSize: "0.88rem", lineHeight: 1.45 }}>
                        {entry.message}
                      </div>
                    </div>

                    {/* Chevron */}
                    <div style={{ color: "#b3aca4", fontSize: "0.85rem", paddingTop: "0.2rem" }}>
                      {hasDetails ? (isOpen ? "▾" : "▸") : ""}
                    </div>
                  </div>

                  {isOpen && hasDetails && (
                    <div
                      style={{
                        padding: "0 1.25rem 1.1rem 1.25rem",
                        background: "#faf8f5",
                        borderTop: "1px dashed #e8e1d9",
                      }}
                    >
                      {entry.errorDetails && (
                        <div style={{ marginTop: "0.85rem" }}>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#b91c1c", marginBottom: "0.35rem" }}>
                            Dettagli Errore
                          </div>
                          <pre
                            style={{
                              margin: 0,
                              padding: "0.85rem",
                              borderRadius: "8px",
                              background: "#1e1b18",
                              color: "#f8d7d7",
                              fontSize: "0.76rem",
                              overflowX: "auto",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            }}
                          >
                            {entry.errorDetails.name ? `${entry.errorDetails.name}: ` : ""}
                            {entry.errorDetails.message}
                            {entry.errorDetails.stack ? `\n\n${entry.errorDetails.stack}` : ""}
                          </pre>
                        </div>
                      )}

                      {entry.metadata && (
                        <div style={{ marginTop: "0.85rem" }}>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b6560", marginBottom: "0.35rem" }}>
                            Metadata
                          </div>
                          <pre
                            style={{
                              margin: 0,
                              padding: "0.85rem",
                              borderRadius: "8px",
                              background: "#f4f0eb",
                              color: "#3f3a34",
                              fontSize: "0.76rem",
                              overflowX: "auto",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            }}
                          >
                            {JSON.stringify(entry.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
