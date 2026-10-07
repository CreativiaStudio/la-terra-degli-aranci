"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { formatEuro } from "@/lib/contractPayments";

/* ------------------------------------------------------------------ */
/* Tipi                                                                */
/* ------------------------------------------------------------------ */

export type EventoTipo = "wedding" | "privato";

export interface EventoRow {
  id: string;
  codice: string;
  tipo: EventoTipo;
  nome: string;
  cognome: string;
  partnerNome: string;
  partnerCognome: string;
  telefono: string;
  email: string;
  /** 'YYYY-MM-DD' oppure '' se da definire. */
  dataEvento: string;
  /** 'pranzo' | 'cena' | ''. */
  turno: "pranzo" | "cena" | "";
  spazi: string;
  ospiti: number;
  note: string;
  stageKey: string;
  stageLabel: string;
  stageColor: string;
  /** Contratto firmato / confermato: abilita incassato e residuo. */
  isSigned: boolean;
  totaleCents: number;
  incassatoCents: number;
  residuoCents: number;
}

interface EventiClientProps {
  events: EventoRow[];
}

type TipoFilter = "tutti" | EventoTipo;

/* ------------------------------------------------------------------ */
/* Costanti                                                            */
/* ------------------------------------------------------------------ */

const DATE_PRESETS: Array<{ key: string; label: string; from: string; to: string }> = [
  { key: "luglio", label: "Luglio 2027 (Simulazione)", from: "2027-07-01", to: "2027-07-31" },
  { key: "estate", label: "Estate 2027", from: "2027-06-21", to: "2027-09-22" },
  { key: "anno", label: "Tutto il 2027", from: "2027-01-01", to: "2027-12-31" },
  { key: "reset", label: "Azzera date", from: "", to: "" },
];

const GIORNI = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

/* ------------------------------------------------------------------ */
/* Helper puri                                                         */
/* ------------------------------------------------------------------ */

function formatDataIt(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "Data da definire";
  const dow = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay();
  return `${GIORNI[dow]} ${m[3]}/${m[2]}/${m[1]}`;
}

function whatsappNumber(raw: string): string {
  let digits = String(raw || "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.length >= 9 && digits.length <= 10 && digits.startsWith("3")) digits = `39${digits}`;
  return digits.replace(/\D/g, "");
}

function eur(cents: number): string {
  return formatEuro((Number.isFinite(cents) ? cents : 0) / 100);
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildHaystack(e: EventoRow): string {
  return normalize(
    [
      e.nome,
      e.cognome,
      `${e.nome} ${e.cognome}`,
      e.partnerNome,
      e.partnerCognome,
      `${e.partnerNome} ${e.partnerCognome}`,
      e.telefono,
      String(e.telefono).replace(/[^\d]/g, ""),
      e.email,
      e.codice,
      e.codice.replace("TDA-", ""),
      e.note,
      e.spazi,
    ].join(" | ")
  );
}

/* ------------------------------------------------------------------ */
/* Stili condivisi                                                     */
/* ------------------------------------------------------------------ */

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #efe7db",
  borderRadius: "14px",
  boxShadow: "0 8px 26px rgba(0,0,0,0.03)",
};

const inputStyle: React.CSSProperties = {
  padding: "0.6rem 0.8rem",
  borderRadius: "10px",
  border: "1px solid #e0ddd9",
  fontFamily: "inherit",
  fontSize: "0.9rem",
  background: "#fff",
  color: "#2c2a27",
};

const headerBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.65rem 1.1rem",
  borderRadius: "10px",
  fontWeight: 700,
  fontSize: "0.88rem",
  textDecoration: "none",
  border: "1px solid #e0ddd9",
  background: "#fff",
  color: "#2c2a27",
};

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

export default function EventiClient({ events }: EventiClientProps) {
  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState<TipoFilter>("tutti");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const indexed = useMemo(() => events.map((e) => ({ e, hay: buildHaystack(e) })), [events]);

  // Filtri testo + date (indipendenti dal tab, per mostrare i contatori dei tab).
  const baseFiltered = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    const hasDate = Boolean(dateFrom || dateTo);
    return indexed
      .filter(({ e, hay }) => {
        if (terms.length && !terms.every((t) => hay.includes(t))) return false;
        if (hasDate) {
          if (!e.dataEvento) return false;
          if (dateFrom && e.dataEvento < dateFrom) return false;
          if (dateTo && e.dataEvento > dateTo) return false;
        }
        return true;
      })
      .map(({ e }) => e);
  }, [indexed, query, dateFrom, dateTo]);

  const counts = useMemo(() => {
    const wedding = baseFiltered.filter((e) => e.tipo === "wedding").length;
    return { tutti: baseFiltered.length, wedding, privato: baseFiltered.length - wedding };
  }, [baseFiltered]);

  const filtered = useMemo(
    () => (tipo === "tutti" ? baseFiltered : baseFiltered.filter((e) => e.tipo === tipo)),
    [baseFiltered, tipo]
  );

  const kpi = useMemo(() => {
    let wedding = 0;
    let privati = 0;
    let portfolio = 0;
    let incassato = 0;
    for (const e of filtered) {
      if (e.tipo === "wedding") wedding += 1;
      else privati += 1;
      if (e.stageKey !== "archiviato") portfolio += e.totaleCents;
      incassato += e.incassatoCents;
    }
    return { totale: filtered.length, wedding, privati, portfolio, incassato };
  }, [filtered]);

  const activePreset = DATE_PRESETS.find((p) => p.from === dateFrom && p.to === dateTo)?.key;

  const applyPreset = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const tabs: Array<{ key: TipoFilter; label: string; count: number }> = [
    { key: "tutti", label: "Tutti gli Eventi", count: counts.tutti },
    { key: "wedding", label: "💍 Wedding (Matrimoni)", count: counts.wedding },
    { key: "privato", label: "🎉 Eventi Privati (Lauree, Compleanni, Meeting)", count: counts.privato },
  ];

  const kpiCards: Array<{ label: string; value: string; accent: string }> = [
    { label: "Eventi filtrati", value: String(kpi.totale), accent: "#1e1b18" },
    { label: "💍 Matrimoni", value: String(kpi.wedding), accent: "#be185d" },
    { label: "🎉 Eventi Privati", value: String(kpi.privati), accent: "#7c3aed" },
    { label: "Valore Portfolio", value: eur(kpi.portfolio), accent: "#e58c2c" },
    { label: "Incassato Reale", value: eur(kpi.incassato), accent: "#16a34a" },
  ];

  return (
    <div style={{ maxWidth: "1250px", margin: "0 auto", fontFamily: "'Outfit', sans-serif" }}>
      {/* Testata */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <span
            style={{
              textTransform: "uppercase",
              letterSpacing: "2px",
              fontSize: "0.8rem",
              color: "#e58c2c",
              fontWeight: 800,
            }}
          >
            PILASTRO EVENTI
          </span>
          <h1 style={{ margin: "0.3rem 0 0", fontFamily: "serif", fontSize: "2.1rem", color: "#1e1b18", textAlign: "left" }}>
            💍 Tutti gli Eventi
          </h1>
          <p style={{ margin: "0.3rem 0 0", color: "#6a6764" }}>
            Apri la Scheda Regia 360° per gestire contratti, servizi, cassa e ospiti.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          <Link href="/admin/calendario?month=2027-07" style={{ ...headerBtn, background: "#1e1b18", color: "#f5efe6", border: "1px solid #1e1b18" }}>
            📅 Vista Calendario (Luglio 2027)
          </Link>
          <Link href="/admin/cassa" style={headerBtn}>
            💶 Flusso di Cassa
          </Link>
          <Link href="/admin/clienti" style={headerBtn}>
            👥 Rubrica Clienti (CRM)
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "0.8rem",
          marginBottom: "1.4rem",
        }}
      >
        {kpiCards.map((k) => (
          <div key={k.label} style={{ ...cardStyle, padding: "1rem 1.2rem", borderTop: `4px solid ${k.accent}` }}>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "#9a948c", fontWeight: 700 }}>
              {k.label}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: k.accent, marginTop: "0.2rem" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div style={{ ...cardStyle, padding: "1.1rem 1.3rem", marginBottom: "1.2rem", display: "grid", gap: "1rem" }}>
        <input
          type="search"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          placeholder="🔍 Cerca per nome, cognome, partner/sposa, telefono, email, codice TDA, note, spazi…"
          aria-label="Ricerca eventi"
          style={{ ...inputStyle, width: "100%", fontSize: "1rem", padding: "0.8rem 1rem", boxSizing: "border-box" }}
        />

        <div role="tablist" aria-label="Tipo evento" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {tabs.map((t) => {
            const active = tipo === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTipo(t.key)}
                style={{
                  cursor: "pointer",
                  padding: "0.6rem 1.1rem",
                  borderRadius: "999px",
                  border: active ? "1px solid #1e1b18" : "1px solid #e0ddd9",
                  background: active ? "#1e1b18" : "#fff",
                  color: active ? "#f5efe6" : "#514d48",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {active && <span aria-hidden>✓</span>}
                {t.label}
                <span
                  style={{
                    background: active ? "#e58c2c" : "#f0eee9",
                    color: active ? "#fff" : "#514d48",
                    borderRadius: "999px",
                    padding: "0.05rem 0.55rem",
                    fontSize: "0.78rem",
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", alignItems: "flex-end" }}>
          <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 700, color: "#6a6764" }}>
            Da data
            <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(ev) => setDateFrom(ev.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 700, color: "#6a6764" }}>
            A data
            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(ev) => setDateTo(ev.target.value)} style={inputStyle} />
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {DATE_PRESETS.map((p) => {
              const active = activePreset === p.key && p.key !== "reset";
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p.from, p.to)}
                  style={{
                    cursor: "pointer",
                    padding: "0.5rem 0.9rem",
                    borderRadius: "999px",
                    border: active ? "1px solid #e58c2c" : "1px solid #e0ddd9",
                    background: active ? "#fff7ed" : p.key === "reset" ? "#f0eee9" : "#fff",
                    color: active ? "#c2410c" : "#514d48",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    fontFamily: "inherit",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Elenco */}
      <div style={{ display: "grid", gap: "0.8rem" }}>
        {filtered.map((e) => (
          <EventoCard key={e.id} e={e} />
        ))}

        {filtered.length === 0 && (
          <div
            style={{
              background: "#fff",
              border: "1px dashed #e0ddd9",
              borderRadius: "14px",
              padding: "2.5rem",
              textAlign: "center",
              color: "#9a948c",
            }}
          >
            {events.length === 0
              ? "Nessun evento in archivio. Crea un preventivo o registra un'opzione dal calendario."
              : "Nessun evento corrisponde ai filtri selezionati."}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Riga evento                                                         */
/* ------------------------------------------------------------------ */

function EventoCard({ e }: { e: EventoRow }) {
  const isWedding = e.tipo === "wedding";
  const fullName = `${e.nome} ${e.cognome}`.trim() || "Cliente";
  const partner = `${e.partnerNome} ${e.partnerCognome}`.trim();
  const wa = whatsappNumber(e.telefono);
  const showCash = e.isSigned || e.incassatoCents > 0;
  const pct = e.totaleCents > 0 ? Math.min(100, Math.round((e.incassatoCents / e.totaleCents) * 100)) : 0;

  const turnoLabel =
    e.turno === "pranzo" ? "☀️ Pranzo 12:30" : e.turno === "cena" ? "🌙 Cena 19:30" : "Turno da definire";

  return (
    <div
      style={{
        ...cardStyle,
        padding: "1.1rem 1.3rem",
        display: "grid",
        gridTemplateColumns: "minmax(240px, 1.4fr) minmax(200px, 1fr) minmax(220px, 1.1fr) auto",
        gap: "1.2rem",
        alignItems: "center",
        color: "#2c2a27",
      }}
    >
      {/* Identità + contatti */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center", marginBottom: "0.4rem" }}>
          <span
            style={{
              background: isWedding ? "#fce7f3" : "#ede9fe",
              color: isWedding ? "#9d174d" : "#5b21b6",
              padding: "0.2rem 0.7rem",
              borderRadius: "999px",
              fontSize: "0.72rem",
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {isWedding ? "💍 Wedding" : "🎉 Evento Privato"}
          </span>
          <span style={{ fontSize: "0.78rem", color: "#9a948c", fontWeight: 700 }}>{e.codice}</span>
        </div>
        <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{fullName}</div>
        {partner && (
          <div style={{ fontSize: "0.85rem", color: "#6a6764" }}>
            {isWedding ? "💞 con" : "con"} {partner}
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center", marginTop: "0.5rem", fontSize: "0.82rem" }}>
          {e.telefono ? (
            <>
              <a href={`tel:${e.telefono.replace(/[^\d+]/g, "")}`} style={{ color: "#2c2a27", fontWeight: 600, textDecoration: "none" }}>
                📞 {e.telefono}
              </a>
              {wa && (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#25d366",
                    color: "#fff",
                    padding: "0.2rem 0.65rem",
                    borderRadius: "999px",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    textDecoration: "none",
                  }}
                >
                  WhatsApp
                </a>
              )}
            </>
          ) : (
            <span style={{ color: "#b5b0a8" }}>📞 Telefono n.d.</span>
          )}
        </div>
        {e.email && (
          <div style={{ marginTop: "0.25rem", fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis" }}>
            <a href={`mailto:${e.email}`} style={{ color: "#2563eb", textDecoration: "none" }}>
              ✉️ {e.email}
            </a>
          </div>
        )}
      </div>

      {/* Quando / dove */}
      <div style={{ display: "grid", gap: "0.3rem", fontSize: "0.9rem" }}>
        <div style={{ fontWeight: 700 }}>📅 {formatDataIt(e.dataEvento)}</div>
        <div>{turnoLabel}</div>
        <div>🏛️ {e.spazi}</div>
        <div>👥 {e.ospiti > 0 ? `${e.ospiti} ospiti` : "Ospiti da definire"}</div>
      </div>

      {/* Economia */}
      <div style={{ display: "grid", gap: "0.35rem", fontSize: "0.88rem" }}>
        <div>
          <span style={{ color: "#9a948c", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 700 }}>
            {e.isSigned ? "Totale concordato" : "Preventivo"}
          </span>
          <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{e.totaleCents > 0 ? eur(e.totaleCents) : "—"}</div>
        </div>
        {showCash && e.totaleCents > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem" }}>
              <span style={{ color: "#16a34a", fontWeight: 700 }}>Incassato {eur(e.incassatoCents)}</span>
              <span style={{ color: e.residuoCents > 0 ? "#c2410c" : "#16a34a", fontWeight: 700 }}>
                Residuo {eur(e.residuoCents)}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{ height: "7px", background: "#f0eee9", borderRadius: "999px", overflow: "hidden" }}
            >
              <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "#16a34a" : "#e58c2c" }} />
            </div>
            <div style={{ fontSize: "0.72rem", color: "#9a948c" }}>{pct}% saldato</div>
          </>
        )}
      </div>

      {/* Stage + azione */}
      <div style={{ display: "grid", gap: "0.6rem", justifyItems: "end" }}>
        <span
          style={{
            background: e.stageColor,
            color: "#fff",
            padding: "0.3rem 0.8rem",
            borderRadius: "999px",
            fontSize: "0.75rem",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {e.stageLabel}
        </span>
        <Link
          href={`/admin/eventi/${e.id}`}
          style={{
            background: "#1e1b18",
            color: "#f5efe6",
            padding: "0.55rem 1rem",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "0.82rem",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Scheda Regia 360° ➔
        </Link>
      </div>
    </div>
  );
}
