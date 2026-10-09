"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatEuro } from "@/lib/contractPayments";
import {
  addClientExperienceAction,
  createEventForClientAction,
  deleteClientExperienceAction,
  updateClientAction,
  updateClientPreferencesAction,
  type ClientiFormula,
} from "../actions";
import TagEditorModal, { TAG_STYLES } from "../TagEditorModal";

/* ------------------------------------------------------------------ */
/* Tipi esportati (consumati dal Server Component)                     */
/* ------------------------------------------------------------------ */

export interface ClienteMemoria {
  note_roberto: string;
  intolleranze: string;
  cibi_preferiti: string;
  vini_preferiti: string;
  spazi_del_cuore: string;
  anniversario: string;
}

export interface ClienteDetail {
  id: string;
  nome: string;
  cognome: string;
  coniuge: string;
  email: string;
  telefono: string;
  citta: string;
  provenienza: string;
  codiceFiscale: string;
  tipoCliente: "privato" | "azienda";
  ragioneSociale: string;
  partitaIva: string;
  sdi: string;
  pec: string;
  tags: string[];
  isClub: boolean;
  createdAt: string;
  memoria: ClienteMemoria;
}

export interface ClienteRicevimentoRow {
  id: string;
  tipoEvento: "wedding" | "eventi";
  titolo: string;
  data: string | null;
  turno: string;
  formula: string;
  spazi: string[];
  codiceTda: string;
  stage: string;
  stageLabel: string;
  badgeColor: string;
  concordato: number;
  incassato: number;
  isSigned: boolean;
  contractUrl: string;
}

export interface ClienteEsperienzaRow {
  id: string;
  titolo: string;
  data: string;
  coperti: number;
  totale_speso: number;
  note: string;
  created_at: string;
}

export interface ClienteMetrics {
  ltvTotale: number;
  ltvRicevimenti: number;
  ltvEsperienze: number;
  incassatoReale: number;
  ricevimentiCount: number;
  eventiLocationCount: number;
  clienteDal: string;
}

interface ClienteDettaglioProps {
  cliente: ClienteDetail;
  ricevimenti: ClienteRicevimentoRow[];
  esperienze: ClienteEsperienzaRow[];
  metrics: ClienteMetrics;
  today: string;
}

/* ------------------------------------------------------------------ */
/* Costanti & stili                                                    */
/* ------------------------------------------------------------------ */

type TabKey = "ricevimenti" | "location" | "memoria" | "anagrafica";

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "ricevimenti", label: "Ricevimenti Privati", icon: "💍" },
  { key: "location", label: "Eventi Location", icon: "🥂" },
  { key: "memoria", label: "Memoria della Tenuta", icon: "🌿" },
  { key: "anagrafica", label: "Anagrafica & Fiscale", icon: "📇" },
];

const ANTHRACITE = "#1e1b18";
const AMBER = "#e58c2c";
const GOLD = "#c9a24b";
const BORDER = "#e8e2d9";
const CREAM = "#faf8f5";

const TAG_STYLES_FALLBACK = { bg: "#33302c", color: "#f6c177", border: "#33302c" };

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
  fontSize: "0.85rem",
  color: "#514d48",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  padding: "0.65rem 0.8rem",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: "0.95rem",
  fontFamily: "inherit",
  background: "#fff",
};

const buttonPrimary: React.CSSProperties = {
  padding: "0.7rem 1.3rem",
  background: `linear-gradient(135deg, ${AMBER} 0%, #d17a22 100%)`,
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "0.9rem",
  boxShadow: "0 4px 12px rgba(229,140,44,0.3)",
};

const buttonGhost: React.CSSProperties = {
  padding: "0.7rem 1.3rem",
  background: "#fff",
  color: ANTHRACITE,
  border: `1px solid ${BORDER}`,
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "0.9rem",
};

const buttonDark: React.CSSProperties = {
  padding: "0.7rem 1.3rem",
  background: ANTHRACITE,
  color: GOLD,
  border: "none",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "0.9rem",
};

/* ------------------------------------------------------------------ */
/* Helper puri                                                         */
/* ------------------------------------------------------------------ */

function digitsOnly(value: unknown): string {
  return String(value ?? "").replace(/[^\d]/g, "");
}

function whatsappHref(telefono: string): string {
  return `https://wa.me/${digitsOnly(telefono)}`;
}

function formatDate(value: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ""));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "—";
}

/** "Mario Rossi" → { nome: "Mario", cognome: "Rossi" }; stringa unica → nome. */
function splitConiuge(full: string): { nome: string; cognome: string } {
  const value = full.trim();
  if (!value) return { nome: "", cognome: "" };
  const idx = value.indexOf(" ");
  if (idx === -1) return { nome: value, cognome: "" };
  return { nome: value.slice(0, idx), cognome: value.slice(idx + 1).trim() };
}

function turnoLabel(turno: string): string {
  if (turno === "pranzo") return "Pranzo (12:30)";
  if (turno === "cena") return "Cena (19:30)";
  return "Da definire";
}

/* ------------------------------------------------------------------ */
/* Sottocomponenti                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent: string;
}) {
  return (
    <div
      className="premium-card"
      style={{
        padding: "1.25rem 1.4rem",
        borderTop: `3px solid ${accent}`,
        display: "flex",
        flexDirection: "column",
        gap: "0.2rem",
      }}
    >
      <span
        style={{
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: "#8a847c",
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: "1.65rem", fontWeight: 800, color: ANTHRACITE, lineHeight: 1.1 }}>
        {value}
      </span>
      {hint && <span style={{ fontSize: "0.74rem", color: "#a8a29e" }}>{hint}</span>}
    </div>
  );
}

function Modal({
  eyebrow,
  title,
  onClose,
  children,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: "580px",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          padding: "2.2rem",
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          style={{
            position: "absolute",
            top: "1.2rem",
            right: "1.2rem",
            background: "#f0eee9",
            border: "none",
            fontSize: "1.05rem",
            width: 36,
            height: 36,
            borderRadius: "50%",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ✕
        </button>
        <span
          style={{
            fontSize: "0.76rem",
            textTransform: "uppercase",
            letterSpacing: "2px",
            color: AMBER,
            fontWeight: 700,
          }}
        >
          {eyebrow}
        </span>
        <h2
          style={{
            margin: "0.3rem 0 1.4rem 0",
            color: "#514d48",
            fontSize: "1.5rem",
            fontFamily: "serif",
          }}
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Riga / scheda riutilizzabile per i ricevimenti privati              */
/* ------------------------------------------------------------------ */

/** Riga compatta di un ricevimento (usata nella tabella e nell'accordion). */
function RicevimentoRow({ r, compact = false }: { r: ClienteRicevimentoRow; compact?: boolean }) {
  const pad = compact ? "0.6rem 0.55rem" : "0.85rem 0.6rem";
  return (
    <tr style={{ borderBottom: `1px solid #f0eee9`, verticalAlign: "top" }}>
      <td style={{ padding: pad, fontWeight: 700, color: ANTHRACITE, whiteSpace: "nowrap" }}>
        {formatDate(r.data)}
        <div style={{ fontSize: "0.72rem", color: "#a8a29e", fontWeight: 400 }}>
          {r.tipoEvento === "wedding" ? "💍 Matrimonio" : "🎉 Evento"}
        </div>
      </td>
      <td style={{ padding: pad, fontSize: compact ? "0.8rem" : "0.85rem", color: "#514d48" }}>
        {turnoLabel(r.turno)}
      </td>
      <td style={{ padding: pad, fontSize: "0.82rem", color: "#514d48", maxWidth: 190 }}>
        {r.spazi.length > 0 ? r.spazi.join(", ") : <span style={{ color: "#a8a29e" }}>{r.formula}</span>}
      </td>
      <td style={{ padding: pad }}>
        <code style={{ fontSize: "0.78rem", background: CREAM, padding: "0.15rem 0.4rem", borderRadius: 5, fontWeight: 700 }}>
          {r.codiceTda}
        </code>
      </td>
      <td style={{ padding: pad }}>
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            padding: "0.2rem 0.6rem",
            borderRadius: 999,
            background: r.badgeColor,
            color: "#fff",
            whiteSpace: "nowrap",
          }}
        >
          {r.stageLabel}
        </span>
      </td>
      <td style={{ padding: pad, textAlign: "right", fontWeight: 700, color: ANTHRACITE, whiteSpace: "nowrap" }}>
        {formatEuro(r.concordato)}
      </td>
      <td style={{ padding: pad, textAlign: "right", fontWeight: 700, color: "#16a34a", whiteSpace: "nowrap" }}>
        {formatEuro(r.incassato)}
      </td>
      <td style={{ padding: pad, textAlign: "right", whiteSpace: "nowrap" }}>
        <a
          href={`/admin/eventi/${r.id}`}
          style={{
            display: "inline-block",
            padding: "0.4rem 0.7rem",
            background: ANTHRACITE,
            color: GOLD,
            borderRadius: 7,
            fontSize: "0.76rem",
            fontWeight: 700,
            textDecoration: "none",
            marginRight: "0.35rem",
          }}
        >
          🔎 Scheda Regia 360°
        </a>
        {!r.isSigned && (
          <a
            href={r.contractUrl}
            style={{
              display: "inline-block",
              padding: "0.4rem 0.7rem",
              background: "#fff7ed",
              color: "#c2410c",
              border: "1px solid #ffedd5",
              borderRadius: 7,
              fontSize: "0.76rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ✍️ Contratto
          </a>
        )}
      </td>
    </tr>
  );
}

/** Scheda estesa del ricevimento più recente/attivo (Overload Guard). */
function RicevimentoCard({ r }: { r: ClienteRicevimentoRow }) {
  return (
    <div
      style={{
        border: `1px solid ${BORDER}`,
        borderLeft: `4px solid ${AMBER}`,
        borderRadius: 12,
        padding: "1rem 1.1rem",
        background: CREAM,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.6rem", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "1.02rem", fontWeight: 800, color: ANTHRACITE }}>
            {r.tipoEvento === "wedding" ? "💍 Matrimonio" : "🎉 Ricevimento Privato"} · {formatDate(r.data)}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#6a6764", marginTop: "0.2rem" }}>
            {turnoLabel(r.turno)} · {r.spazi.length > 0 ? r.spazi.join(", ") : r.formula}
          </div>
        </div>
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            padding: "0.22rem 0.7rem",
            borderRadius: 999,
            background: r.badgeColor,
            color: "#fff",
            whiteSpace: "nowrap",
          }}
        >
          {r.stageLabel}
        </span>
      </div>

      <div style={{ display: "flex", gap: "1.6rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
        <div>
          <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "#a8a29e", fontWeight: 700 }}>Codice TDA</div>
          <code style={{ fontSize: "0.82rem", background: "#fff", padding: "0.15rem 0.45rem", borderRadius: 5, fontWeight: 700, border: `1px solid ${BORDER}` }}>
            {r.codiceTda}
          </code>
        </div>
        <div>
          <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "#a8a29e", fontWeight: 700 }}>Concordato</div>
          <strong style={{ color: ANTHRACITE }}>{formatEuro(r.concordato)}</strong>
        </div>
        <div>
          <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "#a8a29e", fontWeight: 700 }}>Incassato</div>
          <strong style={{ color: "#16a34a" }}>{formatEuro(r.incassato)}</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem", flexWrap: "wrap" }}>
        <a
          href={`/admin/eventi/${r.id}`}
          style={{
            display: "inline-block",
            padding: "0.45rem 0.8rem",
            background: ANTHRACITE,
            color: GOLD,
            borderRadius: 7,
            fontSize: "0.78rem",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          🔎 Scheda Regia 360°
        </a>
        {!r.isSigned && (
          <a
            href={r.contractUrl}
            style={{
              display: "inline-block",
              padding: "0.45rem 0.8rem",
              background: "#fff7ed",
              color: "#c2410c",
              border: "1px solid #ffedd5",
              borderRadius: 7,
              fontSize: "0.78rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ✍️ Contratto
          </a>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Componente principale                                               */
/* ------------------------------------------------------------------ */

export default function ClienteDettaglioClient({
  cliente,
  ricevimenti,
  esperienze,
  metrics,
}: ClienteDettaglioProps) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("ricevimenti");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Modali
  const [ricevimentoOpen, setRicevimentoOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

  // Overload Guard: accordion storico (righe snelle, zero fisarmonica di default)
  const [showAltriRicevimenti, setShowAltriRicevimenti] = useState(false);
  const [showTutteEsperienze, setShowTutteEsperienze] = useState(false);

  // Form Nuovo Ricevimento Privato
  const [ricevimentoTipo, setRicevimentoTipo] = useState("Matrimonio");
  const [ricevimentoData, setRicevimentoData] = useState("");
  const [ricevimentoTurno, setRicevimentoTurno] = useState<"pranzo" | "cena">("pranzo");
  const [ricevimentoFormula, setRicevimentoFormula] = useState<ClientiFormula>("sala_bianca");

  // Form Registra Evento Location
  const [locationTitolo, setLocationTitolo] = useState("");
  const [locationData, setLocationData] = useState("");
  const [locationCoperti, setLocationCoperti] = useState("");
  const [locationTotale, setLocationTotale] = useState("");
  const [locationNote, setLocationNote] = useState("");

  // Form Memoria della Tenuta
  const [memoria, setMemoria] = useState<ClienteMemoria>({ ...cliente.memoria });

  // Form Anagrafica
  const [ana, setAna] = useState({
    nome: cliente.nome,
    cognome: cliente.cognome,
    coniuge: cliente.coniuge,
    email: cliente.email,
    telefono: cliente.telefono,
    citta: cliente.citta,
    codiceFiscale: cliente.codiceFiscale,
    tipoCliente: cliente.tipoCliente,
    ragioneSociale: cliente.ragioneSociale,
    partitaIva: cliente.partitaIva,
    sdi: cliente.sdi,
    pec: cliente.pec,
  });

  const nomeCompleto = `${cliente.nome} ${cliente.cognome}`.trim() || "Cliente";

  const contractDirectUrl = (() => {
    const params = new URLSearchParams();
    if (nomeCompleto) params.set("nome", nomeCompleto);
    if (cliente.telefono) params.set("telefono", cliente.telefono);
    if (cliente.email) params.set("email", cliente.email);
    const query = params.toString();
    return query ? `/admin/contratti?${query}` : "/admin/contratti";
  })();

  const resetLocationForm = () => {
    setLocationTitolo("");
    setLocationData("");
    setLocationCoperti("");
    setLocationTotale("");
    setLocationNote("");
  };

  const handleRicevimentoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ricevimentoData)) {
      setFeedback({ type: "err", text: "Inserisci una data evento valida." });
      return;
    }
    const tipoEvento: "wedding" | "eventi" =
      ricevimentoTipo === "Matrimonio" ? "wedding" : "eventi";
    startTransition(async () => {
      const res = await createEventForClientAction({
        clientId: cliente.id,
        data_evento: ricevimentoData,
        turno: ricevimentoTurno,
        formula: ricevimentoFormula,
        tipo_evento: tipoEvento,
      });
      if (res.success && res.contractUrl) {
        window.location.href = res.contractUrl;
      } else {
        setFeedback({ type: "err", text: res.error || "Impossibile creare il ricevimento." });
      }
    });
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!locationTitolo.trim()) {
      setFeedback({ type: "err", text: "Indica il titolo dell'evento." });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(locationData)) {
      setFeedback({ type: "err", text: "Inserisci una data evento valida." });
      return;
    }
    startTransition(async () => {
      const res = await addClientExperienceAction(cliente.id, {
        titolo: locationTitolo.trim(),
        data: locationData,
        coperti: Number(locationCoperti) || 0,
        totale_speso: Number(String(locationTotale).replace(",", ".")) || 0,
        note: locationNote.trim() || undefined,
      });
      if (res.success) {
        setLocationOpen(false);
        resetLocationForm();
        setFeedback({ type: "ok", text: "Evento location registrato nella storia del cliente." });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error || "Impossibile registrare l'evento." });
      }
    });
  };

  const handleDeleteExperience = (expId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteClientExperienceAction(cliente.id, expId);
      if (res.success) {
        setFeedback({ type: "ok", text: "Esperienza rimossa." });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error || "Impossibile rimuovere l'esperienza." });
      }
    });
  };

  const handleMemoriaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await updateClientPreferencesAction(cliente.id, memoria);
      if (res.success) {
        setFeedback({ type: "ok", text: "Memoria della tenuta salvata." });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error || "Impossibile salvare le preferenze." });
      }
    });
  };

  const handleAnagraficaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const coniuge = splitConiuge(ana.coniuge);
    startTransition(async () => {
      const res = await updateClientAction(cliente.id, {
        nome: ana.nome.trim(),
        cognome: ana.cognome.trim(),
        sposera_nome: coniuge.nome,
        sposera_cognome: coniuge.cognome,
        email: ana.email.trim(),
        telefono: ana.telefono.trim(),
        citta_di_residenza: ana.citta.trim(),
        codice_fiscale: ana.codiceFiscale.trim(),
        tipo_cliente: ana.tipoCliente,
        ragione_sociale: ana.tipoCliente === "azienda" ? ana.ragioneSociale.trim() : "",
        partita_iva: ana.tipoCliente === "azienda" ? ana.partitaIva.trim() : "",
        sdi: ana.tipoCliente === "azienda" ? ana.sdi.trim() : "",
        pec: ana.tipoCliente === "azienda" ? ana.pec.trim() : "",
      });
      if (res.success) {
        setFeedback({ type: "ok", text: "Anagrafica aggiornata." });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error || "Impossibile salvare l'anagrafica." });
      }
    });
  };

  const showFeedback = feedback && (
    <div
      role="status"
      style={{
        marginBottom: "1.4rem",
        padding: "0.8rem 1rem",
        borderRadius: 10,
        fontSize: "0.88rem",
        fontWeight: 600,
        background: feedback.type === "ok" ? "#f0fdf4" : "#fef2f2",
        border: `1px solid ${feedback.type === "ok" ? "#bbf7d0" : "#fecaca"}`,
        color: feedback.type === "ok" ? "#15803d" : "#b91c1c",
      }}
    >
      {feedback.type === "ok" ? "✓ " : "⚠️ "}
      {feedback.text}
    </div>
  );

  // Overload Guard: valori derivati per la UI compatta
  const altriRicevimenti = ricevimenti.slice(1);
  const ricevimentoEsteso = ricevimenti.length > 2;
  const esperienzeVisibili = showTutteEsperienze ? esperienze : esperienze.slice(0, 4);

  return (
    <div
      style={{
        maxWidth: "1250px",
        margin: "0 auto",
        fontFamily: "'Outfit', sans-serif",
        paddingBottom: "3rem",
      }}
    >
      {/* Torna alla rubrica */}
      <Link
        href="/admin/clienti"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          marginBottom: "1rem",
          color: ANTHRACITE,
          fontWeight: 700,
          textDecoration: "none",
          fontSize: "0.92rem",
        }}
      >
        ← Torna a Club TDA (CRM)
      </Link>

      {/* Header Cliente */}
      <div
        className="premium-card"
        style={{
          padding: "1.8rem 2rem",
          marginBottom: "1.4rem",
          background: `linear-gradient(135deg, ${ANTHRACITE} 0%, #2e2924 100%)`,
          color: "#fff",
        }}
      >
        <span
          style={{
            textTransform: "uppercase",
            letterSpacing: "2px",
            fontSize: "0.78rem",
            color: GOLD,
            fontWeight: 700,
          }}
        >
          Scheda Cliente · Club TDA
        </span>
        <h1
          style={{
            margin: "0.35rem 0 0 0",
            fontFamily: "Georgia, serif",
            fontWeight: 400,
            fontSize: "2.3rem",
            color: "#fff",
          }}
        >
          {cliente.nome} {cliente.cognome}
          {cliente.coniuge && (
            <span style={{ color: GOLD, fontSize: "1.35rem" }}> &amp; {cliente.coniuge}</span>
          )}
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.7rem" }}>
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", alignItems: "center" }}>
            {cliente.tags.length === 0 ? (
              <span style={{ fontSize: "0.78rem", color: "#bdb5aa" }}>Contatto nuovo</span>
            ) : (
              <>
                {(cliente.tags.length > 3 ? cliente.tags.slice(0, 3) : cliente.tags).map((tag) => {
                  const s = TAG_STYLES[tag] || TAG_STYLES_FALLBACK;
                  return (
                    <span
                      key={tag}
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        padding: "0.2rem 0.65rem",
                        borderRadius: 999,
                        background: s.bg,
                        color: s.color,
                        border: `1px solid ${s.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tag}
                    </span>
                  );
                })}
                {cliente.tags.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setTagsOpen(true)}
                    title={`Altre etichette: ${cliente.tags.slice(3).join(", ")}`}
                    aria-label={`Mostra le altre ${cliente.tags.length - 3} etichette`}
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      padding: "0.2rem 0.65rem",
                      borderRadius: 999,
                      background: "transparent",
                      color: "#f6c177",
                      border: "1px solid #6b6258",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    +{cliente.tags.length - 3} altri
                  </button>
                )}
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setTagsOpen(true)}
            style={{
              ...buttonGhost,
              background: "transparent",
              color: "#f6c177",
              border: "1px solid #6b6258",
              padding: "0.4rem 0.8rem",
              fontSize: "0.8rem",
            }}
          >
            🏷️ Modifica Etichette
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "1.2rem" }}>
          {cliente.telefono && (
            <a
              href={whatsappHref(cliente.telefono)}
              target="_blank"
              rel="noreferrer"
              style={{
                ...buttonGhost,
                background: "#25D366",
                color: "#fff",
                border: "none",
                textDecoration: "none",
              }}
            >
              💬 WhatsApp
            </a>
          )}
          {cliente.telefono && (
            <a
              href={`tel:${cliente.telefono}`}
              style={{ ...buttonGhost, textDecoration: "none", background: "transparent", color: "#fff", border: `1px solid #6b6258` }}
            >
              📞 {cliente.telefono}
            </a>
          )}
          {cliente.email && (
            <a
              href={`mailto:${cliente.email}`}
              style={{ ...buttonGhost, textDecoration: "none", background: "transparent", color: "#fff", border: `1px solid #6b6258` }}
            >
              ✉️ {cliente.email}
            </a>
          )}
        </div>
      </div>

      {/* CTA principali */}
      <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", marginBottom: "1.6rem" }}>
        <button type="button" style={buttonPrimary} onClick={() => setRicevimentoOpen(true)}>
          ➕ Nuovo Ricevimento Privato
        </button>
        <button type="button" style={buttonDark} onClick={() => setLocationOpen(true)}>
          🥂 Registra Evento Location
        </button>
        <a href={contractDirectUrl} style={{ ...buttonGhost, textDecoration: "none" }}>
          ✍️ Emetti Contratto Diretto
        </a>
      </div>

      {showFeedback}

      {/* Metriche LTV */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "1rem",
          marginBottom: "1.8rem",
        }}
      >
        <StatCard
          label="LTV Complessivo Negli Anni"
          value={formatEuro(metrics.ltvTotale)}
          hint={`${metrics.ricevimentiCount} ricevimenti · ${metrics.eventiLocationCount} eventi location`}
          accent={AMBER}
        />
        <StatCard
          label="Incassato Reale"
          value={formatEuro(metrics.incassatoReale)}
          hint="Somma dei pagamenti registrati"
          accent="#16a34a"
        />
        <StatCard
          label="Ricevimenti Privati"
          value={String(metrics.ricevimentiCount)}
          hint="Matrimoni, battesimi, comunioni..."
          accent="#7c3aed"
        />
        <StatCard
          label="Eventi Location / Serate"
          value={String(metrics.eventiLocationCount)}
          hint="San Valentino, Pasqua, serate a tema"
          accent="#0284c7"
        />
        <StatCard
          label="Cliente dal"
          value={metrics.clienteDal ? formatDate(metrics.clienteDal) : "—"}
          hint="Primo evento o registrazione"
          accent="#c9a24b"
        />
      </div>

      {/* Tab navigation */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.2rem" }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                padding: "0.6rem 1.05rem",
                borderRadius: 10,
                border: `1px solid ${active ? ANTHRACITE : BORDER}`,
                background: active ? ANTHRACITE : "#fff",
                color: active ? GOLD : "#514d48",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.86rem",
              }}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {/* A) Ricevimenti Privati */}
      {tab === "ricevimenti" && (
        <div className="premium-card" style={{ padding: "1.2rem", overflowX: "auto" }}>
          <h2 style={{ margin: "0 0 1rem 0", color: "#514d48", fontFamily: "serif", fontSize: "1.4rem" }}>
            💍 Ricevimenti Privati
            <span style={{ fontSize: "0.85rem", color: "#a8a29e", fontFamily: "inherit", fontWeight: 400, marginLeft: "0.6rem" }}>
              Matrimonio, battesimo, comunione, anniversario
            </span>
          </h2>

          {ricevimenti.length === 0 ? (
            <p style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
              Nessun ricevimento privato registrato. Usa “➕ Nuovo Ricevimento Privato” per crearne uno.
            </p>
          ) : ricevimentoEsteso ? (
            <>
              <RicevimentoCard r={ricevimenti[0]} />

              {altriRicevimenti.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowAltriRicevimenti((v) => !v)}
                    aria-expanded={showAltriRicevimenti}
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.6rem 0.9rem",
                      borderRadius: 10,
                      border: `1px solid ${BORDER}`,
                      background: showAltriRicevimenti ? "#fff" : CREAM,
                      color: ANTHRACITE,
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    <span>
                      {showAltriRicevimenti ? "▾" : "▸"} Storico precedente · {altriRicevimenti.length}{" "}
                      {altriRicevimenti.length === 1 ? "ricevimento" : "ricevimenti"}
                    </span>
                    <span style={{ color: "#c2410c" }}>{showAltriRicevimenti ? "Riduci" : "Apri l'elenco"}</span>
                  </button>

                  {showAltriRicevimenti && (
                    <div style={{ marginTop: "0.7rem", overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                          <tr
                            style={{
                              borderBottom: `2px solid ${BORDER}`,
                              color: "#78716c",
                              fontSize: "0.72rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            <th style={{ padding: "0.6rem 0.55rem" }}>Data</th>
                            <th style={{ padding: "0.6rem 0.55rem" }}>Turno</th>
                            <th style={{ padding: "0.6rem 0.55rem" }}>Spazi</th>
                            <th style={{ padding: "0.6rem 0.55rem" }}>Codice TDA</th>
                            <th style={{ padding: "0.6rem 0.55rem" }}>Stato</th>
                            <th style={{ padding: "0.6rem 0.55rem", textAlign: "right" }}>Concordato</th>
                            <th style={{ padding: "0.6rem 0.55rem", textAlign: "right" }}>Incassato</th>
                            <th style={{ padding: "0.6rem 0.55rem", textAlign: "right" }}>Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {altriRicevimenti.map((r) => (
                            <RicevimentoRow key={r.id} r={r} compact />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: `2px solid ${BORDER}`,
                    color: "#78716c",
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <th style={{ padding: "0.7rem 0.6rem" }}>Data</th>
                  <th style={{ padding: "0.7rem 0.6rem" }}>Turno</th>
                  <th style={{ padding: "0.7rem 0.6rem" }}>Spazi</th>
                  <th style={{ padding: "0.7rem 0.6rem" }}>Codice TDA</th>
                  <th style={{ padding: "0.7rem 0.6rem" }}>Stato</th>
                  <th style={{ padding: "0.7rem 0.6rem", textAlign: "right" }}>Concordato</th>
                  <th style={{ padding: "0.7rem 0.6rem", textAlign: "right" }}>Incassato</th>
                  <th style={{ padding: "0.7rem 0.6rem", textAlign: "right" }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {ricevimenti.map((r) => (
                  <RicevimentoRow key={r.id} r={r} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* B) Eventi Location */}
      {tab === "location" && (
        <div className="premium-card" style={{ padding: "1.2rem", overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.8rem", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, color: "#514d48", fontFamily: "serif", fontSize: "1.4rem" }}>
              🥂 Eventi Organizzati dalla Location
              <span style={{ fontSize: "0.85rem", color: "#a8a29e", fontFamily: "inherit", fontWeight: 400, marginLeft: "0.6rem" }}>
                San Valentino, Pasqua, serate a tema...
              </span>
            </h2>
            <button type="button" style={buttonDark} onClick={() => setLocationOpen(true)}>
              ➕ Aggiungi Partecipazione
            </button>
          </div>

          {esperienze.length === 0 ? (
            <p style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
              Nessuna partecipazione registrata. Usa “🥂 Registra Evento Location” per storicizzarla.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: `2px solid ${BORDER}`,
                    color: "#78716c",
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <th style={{ padding: "0.7rem 0.6rem" }}>Data</th>
                  <th style={{ padding: "0.7rem 0.6rem" }}>Titolo Evento</th>
                  <th style={{ padding: "0.7rem 0.6rem", textAlign: "right" }}>Coperti</th>
                  <th style={{ padding: "0.7rem 0.6rem", textAlign: "right" }}>Spesa Totale</th>
                  <th style={{ padding: "0.7rem 0.6rem" }}>Note</th>
                  <th style={{ padding: "0.7rem 0.6rem", textAlign: "right" }}>Azione</th>
                </tr>
              </thead>
              <tbody>
                {esperienzeVisibili.map((e) => (
                  <tr key={e.id} style={{ borderBottom: `1px solid #f0eee9`, verticalAlign: "top" }}>
                    <td style={{ padding: "0.85rem 0.6rem", fontWeight: 700, color: ANTHRACITE, whiteSpace: "nowrap" }}>
                      {formatDate(e.data)}
                    </td>
                    <td style={{ padding: "0.85rem 0.6rem", color: "#514d48" }}>{e.titolo}</td>
                    <td style={{ padding: "0.85rem 0.6rem", textAlign: "right", fontWeight: 600 }}>
                      {e.coperti}
                    </td>
                    <td style={{ padding: "0.85rem 0.6rem", textAlign: "right", fontWeight: 700, color: AMBER, whiteSpace: "nowrap" }}>
                      {formatEuro(e.totale_speso)}
                    </td>
                    <td style={{ padding: "0.85rem 0.6rem", color: "#6a6764", fontSize: "0.84rem", maxWidth: 260 }}>
                      {e.note || <span style={{ color: "#c4c0bb" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.85rem 0.6rem", textAlign: "right" }}>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleDeleteExperience(e.id)}
                        title="Rimuovi esperienza"
                        style={{
                          padding: "0.38rem 0.7rem",
                          background: "#fff",
                          color: "#b91c1c",
                          border: "1px solid #fecaca",
                          borderRadius: 7,
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          cursor: pending ? "not-allowed" : "pointer",
                        }}
                      >
                        🗑️ Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {esperienze.length > 4 && (
            <div style={{ marginTop: "0.9rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowTutteEsperienze((v) => !v)}
                aria-expanded={showTutteEsperienze}
                style={{
                  padding: "0.5rem 0.95rem",
                  borderRadius: 10,
                  border: `1px solid ${BORDER}`,
                  background: showTutteEsperienze ? "#fff" : ANTHRACITE,
                  color: showTutteEsperienze ? ANTHRACITE : GOLD,
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                {showTutteEsperienze
                  ? "▴ Riduci"
                  : `▾ Mostra tutte le ${esperienze.length} cene/serate location`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* C) Memoria della Tenuta */}
      {tab === "memoria" && (
        <form className="premium-card" style={{ padding: "1.6rem" }} onSubmit={handleMemoriaSubmit}>
          <h2 style={{ margin: "0 0 0.3rem 0", color: "#514d48", fontFamily: "serif", fontSize: "1.4rem" }}>
            🌿 Memoria della Tenuta &amp; Preferenze Permanenti
          </h2>
          <p style={{ margin: "0 0 1.4rem 0", color: "#8a847c", fontSize: "0.9rem" }}>
            Ciò che rende unico il rapporto con questa famiglia, da custodire negli anni.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.1rem" }}>
            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
              📝 Note confidenziali di Roberto
              <textarea
                value={memoria.note_roberto}
                onChange={(e) => setMemoria({ ...memoria, note_roberto: e.target.value })}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Appunti riservati della Direzione su questa persona e famiglia..."
              />
            </label>

            <label style={labelStyle}>
              🌾 Intolleranze &amp; allergie permanenti
              <textarea
                value={memoria.intolleranze}
                onChange={(e) => setMemoria({ ...memoria, intolleranze: e.target.value })}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Es. 2 celiaci, 1 intollerante al lattosio, menu baby..."
              />
            </label>

            <label style={labelStyle}>
              🍷 Vini &amp; cibi preferiti
              <textarea
                value={memoria.vini_preferiti}
                onChange={(e) => setMemoria({ ...memoria, vini_preferiti: e.target.value })}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Es. Aglianico, pesce fresco, dolci al limone..."
              />
            </label>

            <label style={labelStyle}>
              🏛️ Spazi del cuore
              <input
                type="text"
                value={memoria.spazi_del_cuore}
                onChange={(e) => setMemoria({ ...memoria, spazi_del_cuore: e.target.value })}
                style={inputStyle}
                placeholder="Belvedere, Giardino d'Inverno, Sala Tufo..."
              />
            </label>

            <label style={labelStyle}>
              💛 Data anniversario
              <input
                type="date"
                value={memoria.anniversario}
                onChange={(e) => setMemoria({ ...memoria, anniversario: e.target.value })}
                style={inputStyle}
              />
            </label>

            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
              🍽️ Cibi preferiti (dettaglio)
              <textarea
                value={memoria.cibi_preferiti}
                onChange={(e) => setMemoria({ ...memoria, cibi_preferiti: e.target.value })}
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Piatti e portate gradite dalla famiglia..."
              />
            </label>
          </div>

          <button type="submit" disabled={pending} style={{ ...buttonPrimary, marginTop: "1.4rem", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Salvataggio..." : "💾 Salva Memoria della Tenuta"}
          </button>
        </form>
      )}

      {/* D) Anagrafica & Dati Fiscali */}
      {tab === "anagrafica" && (
        <form className="premium-card" style={{ padding: "1.6rem" }} onSubmit={handleAnagraficaSubmit}>
          <h2 style={{ margin: "0 0 0.3rem 0", color: "#514d48", fontFamily: "serif", fontSize: "1.4rem" }}>
            📇 Anagrafica &amp; Dati Fiscali
          </h2>
          <p style={{ margin: "0 0 1.4rem 0", color: "#8a847c", fontSize: "0.9rem" }}>
            I dati aggiornati si riflettono su tutte le schede regia e i contratti collegati.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1.1rem" }}>
            <label style={labelStyle}>
              Nome
              <input type="text" value={ana.nome} onChange={(e) => setAna({ ...ana, nome: e.target.value })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Cognome
              <input type="text" value={ana.cognome} onChange={(e) => setAna({ ...ana, cognome: e.target.value })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Coniuge / Partner
              <input type="text" value={ana.coniuge} onChange={(e) => setAna({ ...ana, coniuge: e.target.value })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Email
              <input type="email" value={ana.email} onChange={(e) => setAna({ ...ana, email: e.target.value })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Telefono
              <input type="text" value={ana.telefono} onChange={(e) => setAna({ ...ana, telefono: e.target.value })} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Città / Provenienza
              <input
                type="text"
                value={ana.citta}
                onChange={(e) => setAna({ ...ana, citta: e.target.value })}
                style={inputStyle}
                placeholder={cliente.provenienza || "Es. Napoli"}
              />
            </label>
            <label style={labelStyle}>
              Codice Fiscale
              <input
                type="text"
                value={ana.codiceFiscale}
                onChange={(e) => setAna({ ...ana, codiceFiscale: e.target.value.toUpperCase() })}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              Tipo cliente
              <select
                value={ana.tipoCliente}
                onChange={(e) =>
                  setAna({ ...ana, tipoCliente: e.target.value === "azienda" ? "azienda" : "privato" })
                }
                style={inputStyle}
              >
                <option value="privato">Privato</option>
                <option value="azienda">Azienda / Società</option>
              </select>
            </label>
          </div>

          {ana.tipoCliente === "azienda" && (
            <div
              style={{
                marginTop: "1.4rem",
                paddingTop: "1.4rem",
                borderTop: `1px solid ${BORDER}`,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: "1.1rem",
              }}
            >
              <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
                Ragione Sociale
                <input type="text" value={ana.ragioneSociale} onChange={(e) => setAna({ ...ana, ragioneSociale: e.target.value })} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Partita IVA
                <input type="text" value={ana.partitaIva} onChange={(e) => setAna({ ...ana, partitaIva: e.target.value })} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Codice SDI
                <input type="text" value={ana.sdi} onChange={(e) => setAna({ ...ana, sdi: e.target.value.toUpperCase() })} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                PEC
                <input type="email" value={ana.pec} onChange={(e) => setAna({ ...ana, pec: e.target.value })} style={inputStyle} />
              </label>
            </div>
          )}

          <button type="submit" disabled={pending} style={{ ...buttonPrimary, marginTop: "1.5rem", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Salvataggio..." : "💾 Salva Modifiche Anagrafica"}
          </button>
        </form>
      )}

      {/* Modale Nuovo Ricevimento Privato */}
      {ricevimentoOpen && (
        <Modal
          eyebrow="Nuovo Ricevimento Privato"
          title={`Crea ricevimento per ${nomeCompleto}`}
          onClose={() => setRicevimentoOpen(false)}
        >
          <form onSubmit={handleRicevimentoSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <label style={labelStyle}>
                Tipo di ricorrenza
                <select
                  value={ricevimentoTipo}
                  onChange={(e) => setRicevimentoTipo(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Matrimonio">Matrimonio</option>
                  <option value="Battesimo">Battesimo</option>
                  <option value="Comunione">Prima Comunione</option>
                  <option value="Anniversario">Anniversario</option>
                  <option value="Altro">Altro evento privato</option>
                </select>
              </label>
              <label style={labelStyle}>
                Data evento
                <input
                  type="date"
                  value={ricevimentoData}
                  onChange={(e) => setRicevimentoData(e.target.value)}
                  style={inputStyle}
                  required
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <label style={labelStyle}>
                Turno
                <select
                  value={ricevimentoTurno}
                  onChange={(e) => setRicevimentoTurno(e.target.value as "pranzo" | "cena")}
                  style={inputStyle}
                >
                  <option value="pranzo">Pranzo (12:30)</option>
                  <option value="cena">Cena (19:30)</option>
                </select>
              </label>
              <label style={labelStyle}>
                Formula
                <select
                  value={ricevimentoFormula}
                  onChange={(e) => setRicevimentoFormula(e.target.value as ClientiFormula)}
                  style={inputStyle}
                >
                  <option value="esclusiva">Esclusiva Villa</option>
                  <option value="sala_bianca">Semi-esclusiva · Sala Bianca</option>
                  <option value="sala_tufo">Semi-esclusiva · Sala Tufo</option>
                </select>
              </label>
            </div>

            <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.4rem" }}>
              <button type="button" onClick={() => setRicevimentoOpen(false)} disabled={pending} style={{ ...buttonGhost, flex: 1 }}>
                Annulla
              </button>
              <button type="submit" disabled={pending} style={{ ...buttonPrimary, flex: 2, opacity: pending ? 0.7 : 1 }}>
                {pending ? "Creazione..." : "✍️ Crea Ricevimento & Vai al Contratto"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modale Registra Evento Location */}
      {locationOpen && (
        <Modal
          eyebrow="Evento Location"
          title={`Registra partecipazione di ${nomeCompleto}`}
          onClose={() => setLocationOpen(false)}
        >
          <form onSubmit={handleLocationSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <label style={labelStyle}>
              Titolo evento
              <input
                type="text"
                value={locationTitolo}
                onChange={(e) => setLocationTitolo(e.target.value)}
                style={inputStyle}
                placeholder="San Valentino, Pasqua, Serata a tema..."
                required
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <label style={labelStyle}>
                Data
                <input
                  type="date"
                  value={locationData}
                  onChange={(e) => setLocationData(e.target.value)}
                  style={inputStyle}
                  required
                />
              </label>
              <label style={labelStyle}>
                Coperti
                <input
                  type="number"
                  min={0}
                  value={locationCoperti}
                  onChange={(e) => setLocationCoperti(e.target.value)}
                  style={inputStyle}
                  placeholder="Es. 2"
                />
              </label>
            </div>

            <label style={labelStyle}>
              Spesa totale (€)
              <input
                type="number"
                min={0}
                step="any"
                value={locationTotale}
                onChange={(e) => setLocationTotale(e.target.value)}
                style={inputStyle}
                placeholder="Es. 120"
              />
            </label>

            <label style={labelStyle}>
              Note
              <textarea
                value={locationNote}
                onChange={(e) => setLocationNote(e.target.value)}
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Es. tavolo panoramico, menu degustazione..."
              />
            </label>

            <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.4rem" }}>
              <button type="button" onClick={() => setLocationOpen(false)} disabled={pending} style={{ ...buttonGhost, flex: 1 }}>
                Annulla
              </button>
              <button type="submit" disabled={pending} style={{ ...buttonPrimary, flex: 2, opacity: pending ? 0.7 : 1 }}>
                {pending ? "Salvataggio..." : "🥂 Registra Evento"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modale Modifica Etichette */}
      {tagsOpen && (
        <TagEditorModal
          clientId={cliente.id}
          clientName={nomeCompleto}
          initialTags={cliente.tags}
          onClose={() => setTagsOpen(false)}
          onSaved={() => {
            setFeedback({ type: "ok", text: "Etichette aggiornate." });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
