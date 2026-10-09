"use client";

import React, { useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import Link from "next/link";
import type { Appointment } from "@/lib/localDb";
import {
  createAppointmentAction,
  updateAppointmentAction,
  updateAppointmentStatusAction,
  deleteAppointmentAction,
} from "@/app/admin/appuntamentiActions";

/* ------------------------------------------------------------------ */
/* Tipi                                                                */
/* ------------------------------------------------------------------ */

interface AppuntamentiClientProps {
  appointments: Appointment[];
}

type CategoriaFilter = "tutti" | "wedding" | "privato";
type PeriodoFilter = "tutti" | "oggi" | "domani" | "settimana" | "passati";
type StatoFilter = "tutti" | "da_confermare" | "confermato" | "effettuato";

interface FormState {
  tipo: "wedding" | "privato";
  nome: string;
  cognome: string;
  partnerNome: string;
  partnerCognome: string;
  telefono: string;
  email: string;
  dataAppuntamento: string;
  orarioAppuntamento: string;
  dataEventoPresunta: string;
  interesse: Appointment["interesse"];
  ospitiPrevisti: string;
  canale: Appointment["canale"];
  stato: Appointment["stato"];
  note: string;
}

/* ------------------------------------------------------------------ */
/* Helper puri                                                         */
/* ------------------------------------------------------------------ */

const GIORNI = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

/** Data locale in formato 'YYYY-MM-DD' (evita lo shift di UTC). */
function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(iso: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** Etichetta breve con giorno della settimana: 'Gio 08/10'. */
function formatDataBreve(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "Data da definire";
  const dow = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getDay();
  return `${GIORNI[dow]} ${m[3]}/${m[2]}`;
}

/** Etichetta di una data candidata: '17/07/2027'. */
function formatDataCandidata(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function whatsappNumber(raw: string): string {
  let digits = String(raw || "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.length >= 9 && digits.length <= 10 && digits.startsWith("3")) digits = `39${digits}`;
  return digits.replace(/\D/g, "");
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function fullName(a: Appointment): string {
  return [a.nome, a.cognome].filter(Boolean).join(" ").trim() || "Cliente";
}

function partnerName(a: Appointment): string {
  return [a.partnerNome, a.partnerCognome].filter(Boolean).join(" ").trim();
}

/** Nome da mostrare: coppia per i wedding, referente per gli eventi privati. */
function displayName(a: Appointment): string {
  const nome = fullName(a);
  const partner = partnerName(a);
  if (a.tipo === "wedding" && partner) return `${nome} & ${partner}`;
  return nome;
}

function buildHaystack(a: Appointment): string {
  return normalize(
    [
      a.nome,
      a.cognome,
      fullName(a),
      a.partnerNome,
      a.partnerCognome,
      partnerName(a),
      a.telefono,
      String(a.telefono).replace(/\D/g, ""),
      a.email,
      a.dataEventoPresunta,
      a.note,
    ].join(" | ")
  );
}

const INTERESSE_LABEL: Record<Appointment["interesse"], string> = {
  esclusiva: "Esclusiva Location",
  semi_esclusiva: "Semi-Esclusività",
  sala_bianca: "Semi-Esclusività Sala Bianca",
  sala_tufo: "Semi-Esclusività Sala Tufo",
  da_definire: "Da consigliare",
};

const CANALE_LABEL: Record<Appointment["canale"], string> = {
  sito_web: "🌐 Sito Web",
  telefono: "📞 Telefono",
  whatsapp: "💬 WhatsApp",
  instagram: "📸 Instagram",
  passaparola: "🗣️ Passaparola",
};

const STATO_LABEL: Record<Appointment["stato"], string> = {
  da_confermare: "🟡 Da confermare",
  confermato: "🟢 Confermato",
  effettuato: "🟣 Effettuato",
  annullato: "⚪ Annullato",
};

const STATO_STYLE: Record<Appointment["stato"], CSSProperties> = {
  da_confermare: { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" },
  confermato: { background: "#dcfce7", color: "#166534", border: "1px solid #86efac" },
  effettuato: { background: "#ede9fe", color: "#5b21b6", border: "1px solid #c4b5fd" },
  annullato: { background: "#f0eee9", color: "#6a6764", border: "1px solid #dbd6cd" },
};

/* ------------------------------------------------------------------ */
/* Stili condivisi                                                     */
/* ------------------------------------------------------------------ */

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #efe7db",
  borderRadius: "14px",
  boxShadow: "0 8px 26px rgba(0,0,0,0.03)",
};

const inputStyle: CSSProperties = {
  padding: "0.6rem 0.8rem",
  borderRadius: "10px",
  border: "1px solid #e0ddd9",
  fontFamily: "inherit",
  fontSize: "0.9rem",
  background: "#fff",
  color: "#2c2a27",
  width: "100%",
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: "0.25rem",
  fontSize: "0.74rem",
  fontWeight: 700,
  color: "#6a6764",
};

const headerBtn: CSSProperties = {
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
  cursor: "pointer",
  fontFamily: "inherit",
};

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

export default function AppuntamentiClient({ appointments }: AppuntamentiClientProps) {
  const [list, setList] = useState<Appointment[]>(appointments);
  const [categoria, setCategoria] = useState<CategoriaFilter>("tutti");
  const [periodo, setPeriodo] = useState<PeriodoFilter>("tutti");
  const [stato, setStato] = useState<StatoFilter>("tutti");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const tomorrowIso = useMemo(() => addDays(todayIso, 1), [todayIso]);
  const weekEndIso = useMemo(() => addDays(todayIso, 7), [todayIso]);

  const indexed = useMemo(() => list.map((a) => ({ a, hay: buildHaystack(a) })), [list]);

  // 1) Ricerca testuale
  const searched = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return indexed.map(({ a }) => a);
    return indexed.filter(({ hay }) => terms.every((t) => hay.includes(t))).map(({ a }) => a);
  }, [indexed, query]);

  // 2) Periodo + stato (indipendenti dalla categoria, per contare i tab)
  const preCategoria = useMemo(() => {
    return searched.filter((a) => {
      const d = a.dataAppuntamento || "";
      if (periodo === "oggi" && d !== todayIso) return false;
      if (periodo === "domani" && d !== tomorrowIso) return false;
      if (periodo === "settimana" && !(d >= todayIso && d <= weekEndIso)) return false;
      if (periodo === "passati" && !(d && d < todayIso)) return false;
      if (stato !== "tutti" && a.stato !== stato) return false;
      return true;
    });
  }, [searched, periodo, stato, todayIso, tomorrowIso, weekEndIso]);

  const counts = useMemo(() => {
    const wedding = preCategoria.filter((a) => a.tipo === "wedding").length;
    return { tutti: preCategoria.length, wedding, privato: preCategoria.length - wedding };
  }, [preCategoria]);

  // 3) Categoria
  const filtered = useMemo(
    () => (categoria === "tutti" ? preCategoria : preCategoria.filter((a) => a.tipo === categoria)),
    [preCategoria, categoria]
  );

  // Ordine di lavoro: oggi+futuro in avanti, archivio passato in coda.
  const sorted = useMemo(() => {
    return filtered.slice().sort((a, b) => {
      const aPast = Boolean(a.dataAppuntamento && a.dataAppuntamento < todayIso);
      const bPast = Boolean(b.dataAppuntamento && b.dataAppuntamento < todayIso);
      if (aPast !== bPast) return aPast ? 1 : -1;
      const ka = `${a.dataAppuntamento} ${a.orarioAppuntamento}`;
      const kb = `${b.dataAppuntamento} ${b.orarioAppuntamento}`;
      const cmp = ka.localeCompare(kb);
      return aPast ? -cmp : cmp;
    });
  }, [filtered, todayIso]);

  // KPI globali (sull'intero set, non filtrati)
  const kpi = useMemo(() => {
    const wedding = list.filter((a) => a.tipo === "wedding").length;
    const privato = list.filter((a) => a.tipo === "privato").length;
    const daConfermare = list.filter((a) => a.stato === "da_confermare").length;
    const oggi = list.filter((a) => a.dataAppuntamento === todayIso).length;
    return { oggi, wedding, privato, daConfermare, total: list.length };
  }, [list, todayIso]);

  const showFeedback = (tone: "ok" | "err", text: string) => {
    setFeedback({ tone, text });
    window.setTimeout(() => setFeedback(null), 4000);
  };

  const handleStatus = async (id: string, next: Appointment["stato"]) => {
    setPendingId(id);
    try {
      const res = await updateAppointmentStatusAction(id, next);
      if (res.success) {
        setList((prev) => prev.map((a) => (a.id === id ? { ...a, stato: next } : a)));
        showFeedback("ok", "Stato aggiornato.");
      } else {
        showFeedback("err", res.error || "Impossibile aggiornare lo stato.");
      }
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Eliminare definitivamente questo appuntamento?")) return;
    setPendingId(id);
    try {
      const res = await deleteAppointmentAction(id);
      if (res.success) {
        setList((prev) => prev.filter((a) => a.id !== id));
        showFeedback("ok", "Appuntamento eliminato.");
      } else {
        showFeedback("err", res.error || "Impossibile eliminare l'appuntamento.");
      }
    } finally {
      setPendingId(null);
    }
  };

  const handleCreated = (appointment: Appointment) => {
    setList((prev) => [...prev, appointment]);
    setModalOpen(false);
    showFeedback("ok", "Appuntamento registrato in agenda.");
  };

  const handleUpdated = (updated: Appointment) => {
    setList((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setEditing(null);
    showFeedback("ok", "Appuntamento aggiornato con successo.");
  };

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
            Agenda Segreteria & Direzione
          </span>
          <h1 style={{ margin: "0.3rem 0 0", fontFamily: "Georgia, serif", fontSize: "2.1rem", color: "#1e1b18", textAlign: "left" }}>
            📅 Appuntamenti &amp; Visite in Tenuta
          </h1>
          <p style={{ margin: "0.3rem 0 0", color: "#6a6764", maxWidth: "720px" }}>
            La tabella di lavoro quotidiana di Roberto e della segreteria: telefonate, sopralluoghi e visite guidate
            per matrimoni ed eventi privati.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          <Link href="/admin/calendario" style={headerBtn}>
            📅 Calendario &amp; Opzioni
          </Link>
          <Link href="/admin/contratti" style={headerBtn}>
            ✍️ Nuovo Contratto Diretto
          </Link>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              ...headerBtn,
              background: "linear-gradient(135deg, #e58c2c 0%, #c9791f 100%)",
              color: "#fff",
              border: "1px solid #c9791f",
              boxShadow: "0 4px 12px rgba(229,140,44,0.3)",
            }}
          >
            + Registra Visita / Telefonata
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          style={{
            marginBottom: "1rem",
            padding: "0.7rem 1rem",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "0.88rem",
            background: feedback.tone === "ok" ? "#f0fdf4" : "#fef2f2",
            color: feedback.tone === "ok" ? "#166534" : "#991b1b",
            border: `1px solid ${feedback.tone === "ok" ? "#bbf7d0" : "#fecaca"}`,
          }}
        >
          {feedback.tone === "ok" ? "✅ " : "⚠️ "}
          {feedback.text}
        </div>
      )}

      {/* KPI */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "0.8rem",
          marginBottom: "1.4rem",
        }}
      >
        <KpiCard
          label="☀️ Appuntamenti di Oggi"
          value={String(kpi.oggi)}
          accent={kpi.oggi > 0 ? "#e58c2c" : "#1e1b18"}
          highlight={kpi.oggi > 0}
        />
        <KpiCard label="💍 Richieste Wedding" value={String(kpi.wedding)} accent="#be185d" />
        <KpiCard label="🎉 Eventi Privati" value={String(kpi.privato)} accent="#7c3aed" />
        <KpiCard label="🟡 Da Confermare" value={String(kpi.daConfermare)} accent="#d97706" />
        <KpiCard label="📅 Totale in Agenda" value={String(kpi.total)} accent="#1e1b18" />
      </div>

      {/* Filtri */}
      <div style={{ ...cardStyle, padding: "1.1rem 1.3rem", marginBottom: "1.2rem", display: "grid", gap: "1rem" }}>
        <input
          type="search"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          placeholder="🔍 Cerca per nome, cognome, partner, telefono, data evento presunta, note…"
          aria-label="Ricerca appuntamenti"
          style={{ ...inputStyle, fontSize: "1rem", padding: "0.8rem 1rem" }}
        />

        {/* Categoria */}
        <div role="tablist" aria-label="Categoria" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {([
            { key: "tutti" as const, label: "Tutti", count: counts.tutti },
            { key: "wedding" as const, label: "💍 Solo Wedding", count: counts.wedding },
            { key: "privato" as const, label: "🎉 Solo Eventi Privati", count: counts.privato },
          ]).map((t) => {
            const active = categoria === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategoria(t.key)}
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

        {/* Periodo + Stato */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {([
              { key: "tutti" as const, label: "Tutti" },
              { key: "oggi" as const, label: "☀️ Oggi" },
              { key: "domani" as const, label: "Domani" },
              { key: "settimana" as const, label: "Questa Settimana" },
              { key: "passati" as const, label: "Archivio/Passati" },
            ]).map((p) => {
              const active = periodo === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriodo(p.key)}
                  style={{
                    cursor: "pointer",
                    padding: "0.5rem 0.9rem",
                    borderRadius: "999px",
                    border: active ? "1px solid #e58c2c" : "1px solid #e0ddd9",
                    background: active ? "#fff7ed" : "#fff",
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

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {([
              { key: "tutti" as const, label: "Tutti gli stati" },
              { key: "da_confermare" as const, label: "🟡 Da Confermare" },
              { key: "confermato" as const, label: "🟢 Confermati" },
              { key: "effettuato" as const, label: "🟣 Effettuati" },
            ]).map((s) => {
              const active = stato === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStato(s.key)}
                  style={{
                    cursor: "pointer",
                    padding: "0.5rem 0.9rem",
                    borderRadius: "999px",
                    border: active ? "1px solid #1e1b18" : "1px solid #e0ddd9",
                    background: active ? "#f0eee9" : "#fff",
                    color: "#514d48",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    fontFamily: "inherit",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Elenco */}
      <div style={{ display: "grid", gap: "0.8rem" }}>
        {sorted.map((a) => (
          <AppuntamentoCard
            key={a.id}
            appointment={a}
            todayIso={todayIso}
            tomorrowIso={tomorrowIso}
            pending={pendingId === a.id}
            onStatus={handleStatus}
            onDelete={handleDelete}
            onEdit={() => setEditing(a)}
          />
        ))}

        {sorted.length === 0 && (
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
            {list.length === 0
              ? "Nessun appuntamento in agenda. Registra la prima visita o telefonata."
              : "Nessun appuntamento corrisponde ai filtri selezionati."}
          </div>
        )}
      </div>

      {modalOpen && (
        <NuovoAppuntamentoModal
          todayIso={todayIso}
          onClose={() => setModalOpen(false)}
          onCreated={handleCreated}
          onError={(msg) => showFeedback("err", msg)}
        />
      )}

      {editing && (
        <ModificaAppuntamentoModal
          appointment={editing}
          onClose={() => setEditing(null)}
          onUpdated={handleUpdated}
          onError={(msg) => showFeedback("err", msg)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* KPI Card                                                            */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  accent,
  highlight = false,
}: {
  label: string;
  value: string;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: "1rem 1.2rem",
        borderTop: `4px solid ${accent}`,
        background: highlight ? "#fff7ed" : "#fff",
        boxShadow: highlight ? "0 8px 24px rgba(229,140,44,0.18)" : cardStyle.boxShadow,
      }}
    >
      <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "#9a948c", fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: accent, marginTop: "0.2rem" }}>{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Riga appuntamento                                                   */
/* ------------------------------------------------------------------ */

function AppuntamentoCard({
  appointment: a,
  todayIso,
  tomorrowIso,
  pending,
  onStatus,
  onDelete,
  onEdit,
}: {
  appointment: Appointment;
  todayIso: string;
  tomorrowIso: string;
  pending: boolean;
  onStatus: (id: string, stato: Appointment["stato"]) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}) {
  const isWedding = a.tipo === "wedding";
  const partner = partnerName(a);
  const wa = whatsappNumber(a.telefono);
  const isToday = a.dataAppuntamento === todayIso;
  const isTomorrow = a.dataAppuntamento === tomorrowIso;
  const isPast = Boolean(a.dataAppuntamento && a.dataAppuntamento < todayIso);

  const prefServices =
    a.preferenze?.preferenzeServizi && a.preferenze.preferenzeServizi.length > 0
      ? a.preferenze.preferenzeServizi
      : a.preferenze?.serviziInteresse ?? [];
  const prefDates = Array.isArray(a.preferenze?.dateCandidate)
    ? a.preferenze!.dateCandidate!.filter(Boolean)
    : [];
  const prefDietary = String(a.preferenze?.celiaciNote || "").trim();
  const prefStyle = String(a.preferenze?.stileMood || "").trim();
  const hasSyncedPrefs = Boolean(
    prefServices.length > 0 ||
      prefDates.length > 0 ||
      prefDietary ||
      prefStyle ||
      a.preferenze?.tipoCerimonia ||
      a.preferenze?.musicaNote ||
      a.preferenze?.noteGenerali ||
      (a.preferenze?.spaziSelezionati && a.preferenze.spaziSelezionati.length > 0)
  );

  const tourServices =
    a.preferenze?.preferenzeServizi && a.preferenze.preferenzeServizi.length > 0
      ? a.preferenze.preferenzeServizi
      : a.preferenze?.serviziInteresse ?? [];

  const dateCandidates = Array.isArray(a.preferenze?.dateCandidate)
    ? a.preferenze!.dateCandidate!.filter(Boolean)
    : [];

  const waMessage = encodeURIComponent(
    `Gentile ${fullName(a)}, le confermiamo il suo appuntamento presso La Terra degli Aranci per ${formatDataBreve(a.dataAppuntamento)} alle ${a.orarioAppuntamento || "--:--"}. La aspettiamo! Per qualsiasi necessità può rispondere a questo messaggio.`
  );

  const dateBadge: CSSProperties = isToday
    ? { background: "linear-gradient(135deg, #e58c2c 0%, #c9791f 100%)", color: "#fff", border: "1px solid #c9791f" }
    : isTomorrow
      ? { background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }
      : { background: isPast ? "#f0eee9" : "#fff", color: "#514d48", border: "1px solid #e0ddd9" };

  // Ponte verso /admin/contratti: precompila il contratto diretto con i dati
  // dell'appuntamento, così Roberto può emetterlo senza ripartire da zero.
  const contractParams = new URLSearchParams();
  contractParams.set("nome", displayName(a));
  if (a.telefono) contractParams.set("telefono", a.telefono);
  if (a.email) contractParams.set("email", a.email);
  const dataEventoPresunta = String(a.dataEventoPresunta ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataEventoPresunta)) {
    contractParams.set("data", dataEventoPresunta);
  }
  if (a.interesse === "esclusiva") {
    contractParams.set("tipo_esclusiva", "esclusiva");
  } else if (
    a.interesse === "semi_esclusiva" ||
    a.interesse === "sala_bianca" ||
    a.interesse === "sala_tufo"
  ) {
    contractParams.set("tipo_esclusiva", "semi_esclusiva");
  }
  if (a.interesse === "sala_tufo") contractParams.set("formula", "sala_tufo");
  else if (a.interesse === "sala_bianca") contractParams.set("formula", "sala_bianca");

  const contractHref = `/admin/contratti?${contractParams.toString()}`;
  const contractLabel = isWedding ? "✍️ Emetti Contratto Sposi" : "✍️ Emetti Contratto";

  return (
    <div
      style={{
        ...cardStyle,
        padding: "1.1rem 1.3rem",
        display: "grid",
        gridTemplateColumns: "minmax(150px, 0.8fr) minmax(260px, 1.6fr) minmax(200px, 1.1fr) auto",
        gap: "1.2rem",
        alignItems: "center",
        color: "#2c2a27",
        borderLeft: isToday ? "5px solid #e58c2c" : "1px solid #efe7db",
        opacity: a.stato === "annullato" ? 0.65 : 1,
      }}
    >
      {/* Data e orario */}
      <div style={{ display: "grid", gap: "0.4rem", justifyItems: "start" }}>
        <span
          style={{
            ...dateBadge,
            borderRadius: "10px",
            padding: "0.5rem 0.8rem",
            fontWeight: 800,
            fontSize: "0.9rem",
            whiteSpace: "nowrap",
          }}
        >
          {(isToday ? "☀️ OGGI · " : isTomorrow ? "🌅 DOMANI · " : "") + formatDataBreve(a.dataAppuntamento)}
        </span>
        <span style={{ fontWeight: 800, fontSize: "1.25rem", color: isToday ? "#c2410c" : "#1e1b18" }}>
          🕐 {a.orarioAppuntamento || "--:--"}
        </span>
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
      </div>

      {/* Identità + contatti + dettagli */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: "1.08rem" }}>{displayName(a)}</div>
        {isWedding && partner && (
          <div style={{ fontSize: "0.85rem", color: "#6a6764" }}>
            💞 {fullName(a)} &amp; {partner}
          </div>
        )}

        {hasSyncedPrefs && (
          <div
            style={{
              marginTop: "0.55rem",
              display: "inline-flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "0.5rem",
              background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
              border: "1px solid #a7f3d0",
              borderRadius: "10px",
              padding: "0.4rem 0.65rem",
              fontSize: "0.74rem",
              fontWeight: 800,
              color: "#166534",
            }}
          >
            <span>✨ Preferenze Sincronizzate (Sposi + Segreteria)</span>
            <span style={{ color: "#047857", fontWeight: 700 }}>
              💎 {prefServices.length} servizi · 📆 {prefDates.length} date · 🍽️ {prefDietary ? "note alimentari" : "nessuna nota"}
            </span>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginTop: "0.5rem", fontSize: "0.85rem" }}>
          {a.telefono ? (
            <>
              <a href={`tel:${a.telefono.replace(/[^\d+]/g, "")}`} style={{ color: "#2c2a27", fontWeight: 700, textDecoration: "none" }}>
                📞 {a.telefono}
              </a>
              {wa && (
                <a
                  href={`https://wa.me/${wa}?text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#25d366",
                    color: "#fff",
                    padding: "0.22rem 0.7rem",
                    borderRadius: "999px",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    textDecoration: "none",
                  }}
                >
                  💬 WhatsApp
                </a>
              )}
            </>
          ) : (
            <span style={{ color: "#b5b0a8" }}>📞 Telefono n.d.</span>
          )}
          {a.email && (
            <a href={`mailto:${a.email}`} style={{ color: "#2563eb", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis" }}>
              ✉️ {a.email}
            </a>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem", fontSize: "0.78rem" }}>
          <span style={{ background: "#faf7f2", border: "1px solid #efe7db", borderRadius: "999px", padding: "0.18rem 0.65rem", fontWeight: 700, color: "#7c3f08" }}>
            🎯 {INTERESSE_LABEL[a.interesse]}
          </span>
          <span style={{ background: "#faf7f2", border: "1px solid #efe7db", borderRadius: "999px", padding: "0.18rem 0.65rem", color: "#514d48" }}>
            {CANALE_LABEL[a.canale]}
          </span>
        </div>
      </div>

      {/* Periodo evento + ospiti + note */}
      <div style={{ display: "grid", gap: "0.35rem", fontSize: "0.88rem", minWidth: 0 }}>
        <div>
          <span style={{ color: "#9a948c", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 700 }}>
            Periodo evento desiderato
          </span>
          <div style={{ fontWeight: 700 }}>📆 {a.dataEventoPresunta || "Da definire"}</div>
        </div>
        <div>👥 {a.ospitiPrevisti && a.ospitiPrevisti > 0 ? `${a.ospitiPrevisti} ospiti stimati` : "Ospiti da definire"}</div>
        {a.note && <NoteBlock note={a.note} />}
        {dateCandidates.length > 0 && (
          <div
            style={{
              marginTop: "0.35rem",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "10px",
              padding: "0.55rem 0.65rem",
            }}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1d4ed8", marginBottom: "0.35rem" }}>
              📆 Date Candidate Sposi ({dateCandidates.length}):
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
              {dateCandidates.map((d) => (
                <span
                  key={d}
                  style={{
                    background: "#fff",
                    border: "1px solid #93c5fd",
                    color: "#1d4ed8",
                    borderRadius: "999px",
                    padding: "0.15rem 0.55rem",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                  }}
                >
                  {formatDataCandidata(d)}
                </span>
              ))}
            </div>
          </div>
        )}
        {tourServices.length > 0 && (
          <div
            style={{
              marginTop: "0.35rem",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "10px",
              padding: "0.55rem 0.65rem",
            }}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#166534", marginBottom: "0.35rem" }}>
              💎 Servizi d&apos;Interesse Sposi ({tourServices.length} scelti durante la visita):
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
              {tourServices.map((s) => (
                <span
                  key={s}
                  style={{
                    background: "#fff",
                    border: "1px solid #86efac",
                    color: "#166534",
                    borderRadius: "999px",
                    padding: "0.15rem 0.55rem",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stato + azioni */}
      <div style={{ display: "grid", gap: "0.55rem", justifyItems: "stretch", minWidth: "190px" }}>
        <span
          style={{
            ...STATO_STYLE[a.stato],
            borderRadius: "999px",
            padding: "0.3rem 0.75rem",
            fontSize: "0.78rem",
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          {STATO_LABEL[a.stato]}
        </span>

        <button
          type="button"
          disabled={pending}
          onClick={onEdit}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
            padding: "0.55rem 0.8rem",
            borderRadius: "10px",
            fontWeight: 800,
            fontSize: "0.85rem",
            fontFamily: "inherit",
            background: "linear-gradient(135deg, #e58c2c 0%, #c9791f 100%)",
            color: "#fff",
            border: "1px solid #c9791f",
            cursor: pending ? "wait" : "pointer",
            boxShadow: "0 4px 12px rgba(229,140,44,0.25)",
          }}
        >
          ✏️ Modifica / Sposta
        </button>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
          {a.stato !== "confermato" && (
            <button type="button" disabled={pending} onClick={() => onStatus(a.id, "confermato")} style={quickBtn("#166534")}>
              ✅ Conferma
            </button>
          )}
          {a.stato !== "effettuato" && (
            <button type="button" disabled={pending} onClick={() => onStatus(a.id, "effettuato")} style={quickBtn("#5b21b6")}>
              🟣 Effettuato
            </button>
          )}
          {a.stato !== "annullato" && (
            <button type="button" disabled={pending} onClick={() => onStatus(a.id, "annullato")} style={quickBtn("#991b1b")}>
              ✖ Annulla
            </button>
          )}
        </div>

        <Link
          href={contractHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
            padding: "0.5rem 0.8rem",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: 800,
            fontSize: "0.82rem",
            background: "linear-gradient(135deg, #1e1b18 0%, #332f2b 100%)",
            color: "#f5efe6",
          }}
        >
          {contractLabel}
        </Link>

        <button
          type="button"
          disabled={pending}
          onClick={() => onDelete(a.id)}
          style={{
            background: "transparent",
            border: "1px solid #e0ddd9",
            color: "#9a948c",
            padding: "0.35rem 0.6rem",
            borderRadius: "8px",
            cursor: pending ? "wait" : "pointer",
            fontSize: "0.75rem",
            fontFamily: "inherit",
          }}
        >
          🗑️ Elimina
        </button>
      </div>
    </div>
  );
}

function quickBtn(color: string): CSSProperties {
  return {
    background: "#fff",
    color,
    border: `1px solid ${color}33`,
    padding: "0.35rem 0.6rem",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: "0.75rem",
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

/* ------------------------------------------------------------------ */
/* Blocco note (testo integrale, senza troncamento CSS)                */
/* ------------------------------------------------------------------ */

const NOTE_COLLAPSE_LIMIT = 200;

function NoteBlock({ note }: { note: string }) {
  const [expanded, setExpanded] = useState(false);
  const clean = String(note || "");
  const isLong = clean.length > NOTE_COLLAPSE_LIMIT;
  const shown = isLong && !expanded ? `${clean.slice(0, NOTE_COLLAPSE_LIMIT).trimEnd()}…` : clean;

  return (
    <div style={{ marginTop: "0.4rem" }}>
      <div
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          lineHeight: 1.45,
          color: "#44403c",
          background: "#fcfaf7",
          borderLeft: "3px solid #e58c2c",
          padding: "0.45rem 0.65rem",
          borderRadius: "6px",
          fontSize: "0.85rem",
        }}
      >
        📝 {shown}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            marginTop: "0.3rem",
            background: "transparent",
            border: "none",
            color: "#c2410c",
            fontWeight: 800,
            fontSize: "0.78rem",
            cursor: "pointer",
            fontFamily: "inherit",
            padding: 0,
          }}
        >
          {expanded ? "▲ Riduci" : "▼ Espandi"}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modale nuovo appuntamento                                           */
/* ------------------------------------------------------------------ */

function emptyForm(todayIso: string): FormState {
  return {
    tipo: "wedding",
    nome: "",
    cognome: "",
    partnerNome: "",
    partnerCognome: "",
    telefono: "",
    email: "",
    dataAppuntamento: todayIso,
    orarioAppuntamento: "10:00",
    dataEventoPresunta: "",
    interesse: "da_definire",
    ospitiPrevisti: "",
    canale: "telefono",
    stato: "da_confermare",
    note: "",
  };
}

function NuovoAppuntamentoModal({
  todayIso,
  onClose,
  onCreated,
  onError,
}: {
  todayIso: string;
  onClose: () => void;
  onCreated: (appointment: Appointment) => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState<FormState>(() => emptyForm(todayIso));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    try {
      const dataOra = form.dataAppuntamento && form.orarioAppuntamento
        ? `${form.dataAppuntamento}T${form.orarioAppuntamento}`
        : form.dataAppuntamento;

      const res = await createAppointmentAction({
        tipo: form.tipo,
        nome: form.nome,
        cognome: form.cognome,
        partnerNome: form.tipo === "wedding" ? form.partnerNome : "",
        partnerCognome: form.tipo === "wedding" ? form.partnerCognome : "",
        telefono: form.telefono,
        email: form.email,
        dataOra,
        dataAppuntamento: form.dataAppuntamento,
        orarioAppuntamento: form.orarioAppuntamento,
        dataEventoPresunta: form.dataEventoPresunta,
        interesse: form.interesse,
        ospitiPrevisti: form.ospitiPrevisti ? Number(form.ospitiPrevisti) : undefined,
        canale: form.canale,
        stato: form.stato,
        note: form.note,
      });

      if (res.success) {
        onCreated(res.appointment);
      } else {
        onError(res.error);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nuovo appuntamento"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(30,27,24,0.55)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "3vh 1rem",
        overflowY: "auto",
        zIndex: 1000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(ev) => ev.stopPropagation()}
        style={{
          background: "#fcfbfa",
          borderRadius: "16px",
          width: "min(760px, 100%)",
          padding: "1.6rem 1.8rem",
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
          border: "1px solid #efe7db",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.72rem", color: "#e58c2c", fontWeight: 800 }}>
              Segreteria · Inserimento rapido
            </span>
            <h2 style={{ margin: "0.2rem 0 0", fontFamily: "Georgia, serif", fontSize: "1.5rem", color: "#1e1b18", border: "none", padding: 0 }}>
              + Nuovo Appuntamento
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            style={{ background: "transparent", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#6a6764" }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.8rem", marginTop: "1.2rem" }}>
          <label style={labelStyle}>
            Categoria *
            <select value={form.tipo} onChange={(ev) => set("tipo", ev.target.value as FormState["tipo"])} style={inputStyle}>
              <option value="wedding">💍 Wedding (Matrimonio)</option>
              <option value="privato">🎉 Evento Privato</option>
            </select>
          </label>
          <label style={labelStyle}>
            Nome referente / sposo/a *
            <input value={form.nome} onChange={(ev) => set("nome", ev.target.value)} style={inputStyle} placeholder="Es. Marco" required />
          </label>
          <label style={labelStyle}>
            Cognome
            <input value={form.cognome} onChange={(ev) => set("cognome", ev.target.value)} style={inputStyle} placeholder="Es. Esposito" />
          </label>

          {form.tipo === "wedding" && (
            <>
              <label style={labelStyle}>
                Nome partner
                <input value={form.partnerNome} onChange={(ev) => set("partnerNome", ev.target.value)} style={inputStyle} placeholder="Es. Sofia" />
              </label>
              <label style={labelStyle}>
                Cognome partner
                <input value={form.partnerCognome} onChange={(ev) => set("partnerCognome", ev.target.value)} style={inputStyle} placeholder="Es. De Luca" />
              </label>
            </>
          )}

          <label style={labelStyle}>
            Telefono cellulare *
            <input value={form.telefono} onChange={(ev) => set("telefono", ev.target.value)} style={inputStyle} placeholder="Es. 333 123 4567" required />
          </label>
          <label style={labelStyle}>
            Email
            <input type="email" value={form.email} onChange={(ev) => set("email", ev.target.value)} style={inputStyle} placeholder="nome@email.it" />
          </label>

          <label style={labelStyle}>
            Data appuntamento *
            <input type="date" value={form.dataAppuntamento} onChange={(ev) => set("dataAppuntamento", ev.target.value)} style={inputStyle} required />
          </label>
          <label style={labelStyle}>
            Orario
            <input type="time" value={form.orarioAppuntamento} onChange={(ev) => set("orarioAppuntamento", ev.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Periodo evento presunto
            <input value={form.dataEventoPresunta} onChange={(ev) => set("dataEventoPresunta", ev.target.value)} style={inputStyle} placeholder="Es. Luglio 2027" />
          </label>

          <label style={labelStyle}>
            Interesse / Formula
            <select value={form.interesse} onChange={(ev) => set("interesse", ev.target.value as Appointment["interesse"])} style={inputStyle}>
              <option value="da_definire">Da consigliare</option>
              <option value="esclusiva">Esclusiva Location</option>
              <option value="semi_esclusiva">Semi-Esclusività</option>
              <option value="sala_bianca">Semi-Esclusività Sala Bianca</option>
              <option value="sala_tufo">Semi-Esclusività Sala Tufo</option>
            </select>
          </label>
          <label style={labelStyle}>
            Ospiti previsti
            <input type="number" min="0" value={form.ospitiPrevisti} onChange={(ev) => set("ospitiPrevisti", ev.target.value)} style={inputStyle} placeholder="Es. 120" />
          </label>
          <label style={labelStyle}>
            Canale di provenienza
            <select value={form.canale} onChange={(ev) => set("canale", ev.target.value as Appointment["canale"])} style={inputStyle}>
              <option value="telefono">📞 Telefono</option>
              <option value="sito_web">🌐 Sito Web</option>
              <option value="whatsapp">💬 WhatsApp</option>
              <option value="instagram">📸 Instagram</option>
              <option value="passaparola">🗣️ Passaparola</option>
            </select>
          </label>
          <label style={labelStyle}>
            Stato
            <select value={form.stato} onChange={(ev) => set("stato", ev.target.value as Appointment["stato"])} style={inputStyle}>
              <option value="da_confermare">🟡 Da confermare</option>
              <option value="confermato">🟢 Confermato</option>
              <option value="effettuato">🟣 Effettuato</option>
              <option value="annullato">⚪ Annullato</option>
            </select>
          </label>
        </div>

        <label style={{ ...labelStyle, marginTop: "0.8rem" }}>
          Note
          <textarea
            value={form.note}
            onChange={(ev) => set("note", ev.target.value)}
            style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
            placeholder="Es. interessati alla Sala Tufo, chiedono info sul banqueting…"
          />
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1.3rem" }}>
          <button type="button" onClick={onClose} style={{ ...headerBtn, background: "#f0eee9" }}>
            Annulla
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              ...headerBtn,
              background: "linear-gradient(135deg, #e58c2c 0%, #c9791f 100%)",
              color: "#fff",
              border: "1px solid #c9791f",
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.75 : 1,
            }}
          >
            {saving ? "Salvataggio…" : "Salva in agenda"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modale modifica appuntamento                                        */
/* ------------------------------------------------------------------ */

function formFromAppointment(a: Appointment): FormState {
  return {
    tipo: a.tipo,
    nome: a.nome || "",
    cognome: a.cognome || "",
    partnerNome: a.partnerNome || "",
    partnerCognome: a.partnerCognome || "",
    telefono: a.telefono || "",
    email: a.email || "",
    dataAppuntamento: a.dataAppuntamento || "",
    orarioAppuntamento: a.orarioAppuntamento || "",
    dataEventoPresunta: a.dataEventoPresunta || "",
    interesse: a.interesse,
    ospitiPrevisti: a.ospitiPrevisti && a.ospitiPrevisti > 0 ? String(a.ospitiPrevisti) : "",
    canale: a.canale,
    stato: a.stato,
    note: a.note || "",
  };
}

function ModificaAppuntamentoModal({
  appointment,
  onClose,
  onUpdated,
  onError,
}: {
  appointment: Appointment;
  onClose: () => void;
  onUpdated: (appointment: Appointment) => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState<FormState>(() => formFromAppointment(appointment));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    try {
      const isWedding = form.tipo === "wedding";
      const dataOra = form.dataAppuntamento && form.orarioAppuntamento
        ? `${form.dataAppuntamento}T${form.orarioAppuntamento}`
        : form.dataAppuntamento;

      const res = await updateAppointmentAction(appointment.id, {
        tipo: form.tipo,
        nome: form.nome,
        cognome: form.cognome || undefined,
        partnerNome: isWedding ? form.partnerNome || undefined : undefined,
        partnerCognome: isWedding ? form.partnerCognome || undefined : undefined,
        telefono: form.telefono,
        email: form.email || undefined,
        dataOra,
        dataAppuntamento: form.dataAppuntamento,
        orarioAppuntamento: form.orarioAppuntamento,
        dataEventoPresunta: form.dataEventoPresunta || undefined,
        interesse: form.interesse,
        ospitiPrevisti: form.ospitiPrevisti ? Number(form.ospitiPrevisti) : undefined,
        canale: form.canale,
        stato: form.stato,
        note: form.note || undefined,
      });

      if (res.success && res.appointment) {
        onUpdated(res.appointment);
      } else {
        onError(res.error || "Impossibile salvare le modifiche.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Modifica appuntamento"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(30,27,24,0.55)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "3vh 1rem",
        overflowY: "auto",
        zIndex: 1000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(ev) => ev.stopPropagation()}
        style={{
          background: "#fcfbfa",
          borderRadius: "16px",
          width: "min(760px, 100%)",
          padding: "1.6rem 1.8rem",
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
          border: "1px solid #efe7db",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.72rem", color: "#e58c2c", fontWeight: 800 }}>
              Direzione &amp; Segreteria · Modifica
            </span>
            <h2 style={{ margin: "0.2rem 0 0", fontFamily: "Georgia, serif", fontSize: "1.5rem", color: "#1e1b18", border: "none", padding: 0 }}>
              ✏️ Modifica / Sposta Appuntamento
            </h2>
            <p style={{ margin: "0.25rem 0 0", color: "#6a6764", fontSize: "0.85rem" }}>
              {displayName(appointment)} · attualmente {formatDataBreve(appointment.dataAppuntamento)} alle {appointment.orarioAppuntamento || "--:--"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            style={{ background: "transparent", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#6a6764" }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.8rem", marginTop: "1.2rem" }}>
          <label style={labelStyle}>
            Categoria *
            <select value={form.tipo} onChange={(ev) => set("tipo", ev.target.value as FormState["tipo"])} style={inputStyle}>
              <option value="wedding">💍 Wedding (Matrimonio)</option>
              <option value="privato">🎉 Evento Privato</option>
            </select>
          </label>
          <label style={labelStyle}>
            Nome referente / sposo/a *
            <input value={form.nome} onChange={(ev) => set("nome", ev.target.value)} style={inputStyle} required />
          </label>
          <label style={labelStyle}>
            Cognome
            <input value={form.cognome} onChange={(ev) => set("cognome", ev.target.value)} style={inputStyle} />
          </label>

          {form.tipo === "wedding" && (
            <>
              <label style={labelStyle}>
                Nome partner
                <input value={form.partnerNome} onChange={(ev) => set("partnerNome", ev.target.value)} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Cognome partner
                <input value={form.partnerCognome} onChange={(ev) => set("partnerCognome", ev.target.value)} style={inputStyle} />
              </label>
            </>
          )}

          <label style={labelStyle}>
            Telefono cellulare *
            <input value={form.telefono} onChange={(ev) => set("telefono", ev.target.value)} style={inputStyle} required />
          </label>
          <label style={labelStyle}>
            Email
            <input type="email" value={form.email} onChange={(ev) => set("email", ev.target.value)} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Data appuntamento *
            <input type="date" value={form.dataAppuntamento} onChange={(ev) => set("dataAppuntamento", ev.target.value)} style={inputStyle} required />
          </label>
          <label style={labelStyle}>
            Orario
            <input type="time" value={form.orarioAppuntamento} onChange={(ev) => set("orarioAppuntamento", ev.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Periodo evento presunto
            <input value={form.dataEventoPresunta} onChange={(ev) => set("dataEventoPresunta", ev.target.value)} style={inputStyle} placeholder="Es. Luglio 2027" />
          </label>

          <label style={labelStyle}>
            Interesse / Formula
            <select value={form.interesse} onChange={(ev) => set("interesse", ev.target.value as Appointment["interesse"])} style={inputStyle}>
              <option value="da_definire">Da consigliare</option>
              <option value="esclusiva">Esclusiva Location</option>
              <option value="semi_esclusiva">Semi-Esclusività</option>
              <option value="sala_bianca">Semi-Esclusività Sala Bianca</option>
              <option value="sala_tufo">Semi-Esclusività Sala Tufo</option>
            </select>
          </label>
          <label style={labelStyle}>
            Ospiti previsti
            <input type="number" min="0" value={form.ospitiPrevisti} onChange={(ev) => set("ospitiPrevisti", ev.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Canale di provenienza
            <select value={form.canale} onChange={(ev) => set("canale", ev.target.value as Appointment["canale"])} style={inputStyle}>
              <option value="telefono">📞 Telefono</option>
              <option value="sito_web">🌐 Sito Web</option>
              <option value="whatsapp">💬 WhatsApp</option>
              <option value="instagram">📸 Instagram</option>
              <option value="passaparola">🗣️ Passaparola</option>
            </select>
          </label>
          <label style={labelStyle}>
            Stato
            <select value={form.stato} onChange={(ev) => set("stato", ev.target.value as Appointment["stato"])} style={inputStyle}>
              <option value="da_confermare">🟡 Da confermare</option>
              <option value="confermato">🟢 Confermato</option>
              <option value="effettuato">🟣 Effettuato</option>
              <option value="annullato">⚪ Annullato</option>
            </select>
          </label>
        </div>

        <label style={{ ...labelStyle, marginTop: "0.8rem" }}>
          Note
          <textarea
            value={form.note}
            onChange={(ev) => set("note", ev.target.value)}
            rows={4}
            style={{ ...inputStyle, minHeight: "110px", resize: "vertical", lineHeight: 1.5 }}
            placeholder="Es. interessati alla Sala Tufo, chiedono info sul banqueting…"
          />
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1.3rem" }}>
          <button type="button" onClick={onClose} style={{ ...headerBtn, background: "#f0eee9" }}>
            Annulla
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              ...headerBtn,
              background: "linear-gradient(135deg, #e58c2c 0%, #c9791f 100%)",
              color: "#fff",
              border: "1px solid #c9791f",
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.75 : 1,
            }}
          >
            {saving ? "Salvataggio…" : "Salva Modifiche"}
          </button>
        </div>
      </form>
    </div>
  );
}
