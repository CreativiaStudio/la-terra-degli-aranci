"use client";

import React, { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { Appointment, AppointmentPreferences } from "@/lib/localDb";
import {
  saveAppointmentPreferencesAction,
  updateAppointmentStatoAction,
  type AppointmentPreferencesInput,
} from "./actions";

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

interface SegreteriaClientProps {
  initialAppointments: Appointment[];
}

type CategoriaFilter = "tutti" | "wedding" | "privato";
type TabId = "agenda" | "tour";

/* ------------------------------------------------------------------ */
/* Opzioni modale Preferenze (tocco rapido)                            */
/* ------------------------------------------------------------------ */

const STILI_OPZIONI = [
  "Botanico Chic & Agrumi",
  "Romantico & Lucine Calde",
  "Minimal Moderno",
  "Country Rustico",
  "Luxury Glamour",
];

const SPAZI_OPZIONI = [
  "Agrumeto Storico",
  "Giardino delle Promesse",
  "Sala Tufo",
  "Sala Bianca",
  "Terrazza Taglio Torta",
  "After Party Lounge",
];

const CERIMONIA_OPZIONI = ["Rito Simbolico in Tenuta", "Cerimonia in Chiesa", "Solo Ricevimento"];

const SERVIZI_OPZIONI = [
  "Open Bar Illimitato",
  "Graffette Calde",
  "Fontane Luminose Fredde",
  "Musica Live Buffet",
  "DJ Set Dopocena",
  "Carretto Gelato",
  "Angolo Sigari & Rum",
  "Animazione Bimbi",
];

/* ------------------------------------------------------------------ */
/* Tour fotografico                                                    */
/* ------------------------------------------------------------------ */

interface VenueSpace {
  id: string;
  name: string;
  moment: string;
  description: string;
  gallery: string[];
}

const VENUE_SPACES: VenueSpace[] = [
  {
    id: "agrumeto",
    name: "L'Agrumeto Storico",
    moment: "Accoglienza & Gran Buffet di Benvenuto",
    description:
      "Oasi botanica centenaria immersa nel profumo delle zagare e degli aranci secolari di Napoli, con isole gastronomiche dal vivo.",
    gallery: [
      "/media/project-builder/agrumeto_hero.jpg",
      "/media/project-builder/agrumeto_1.jpg",
      "/media/project-builder/agrumeto_2.jpg",
      "/media/project-builder/agrumeto_3.jpg",
    ],
  },
  {
    id: "giardino_promesse",
    name: "Il Giardino delle Promesse",
    moment: "Rito Civile & Cerimonia Simbolica",
    description:
      "Spazio romantico all'aperto affacciato sul panorama verde della collina, con passerella in corteccia e arco botanico.",
    gallery: [
      "/media/project-builder/giardino_promesse_hero.jpg",
      "/media/project-builder/giardino_promesse_1.jpg",
      "/media/project-builder/giardino_promesse_2.jpg",
      "/media/project-builder/giardino_promesse_3.jpg",
    ],
  },
  {
    id: "sala_tufo",
    name: "La Sala Tufo",
    moment: "Banchetto & Cena di Gala",
    description:
      "Le storiche pareti in tufo napoletano a vista custodiscono l'atmosfera più intima ed elegante per il pranzo o la cena seduta.",
    gallery: [
      "/media/project-builder/sala_tufo_hero.jpg",
      "/media/project-builder/sala_tufo_1.jpg",
      "/media/project-builder/sala_tufo_2.jpg",
      "/media/project-builder/sala_tufo_3.jpg",
    ],
  },
  {
    id: "sala_bianca",
    name: "La Sala Bianca",
    moment: "Ricevimento Panoramico & Luce Naturale",
    description:
      "Ampie vetrate continue che affacciano sul parco, pavimento in cotto chiaro e design luminoso contemporaneo.",
    gallery: [
      "/media/project-builder/sala_bianca_hero.jpg",
      "/media/project-builder/sala_bianca_1.jpg",
      "/media/project-builder/sala_bianca_2.jpg",
      "/media/project-builder/sala_bianca_3.jpg",
    ],
  },
  {
    id: "taglio_torta",
    name: "La Terrazza del Taglio Torta",
    moment: "Il Momento Clou Sotto le Stelle",
    description:
      "La terrazza panoramica all'imbrunire, con scenografia di luci architetturali, fontane luminose fredde e gran buffet dolci.",
    gallery: [
      "/media/project-builder/taglio_torta_hero.jpg",
      "/media/project-builder/taglio_torta_1.jpg",
      "/media/project-builder/taglio_torta_2.jpg",
      "/media/project-builder/taglio_torta_3.jpg",
    ],
  },
  {
    id: "after_party",
    name: "L'After Party & Lounge",
    moment: "Musica, DJ Set & Dopocena",
    description:
      "Area dopocena per ballare fino a tarda notte con open bar, lounge esterna e l'iconico carretto delle graffette calde.",
    gallery: [
      "/media/project-builder/after_party_hero.jpg",
      "/media/project-builder/after_party_1.jpg",
      "/media/project-builder/after_party_2.jpg",
      "/media/project-builder/after_party_3.jpg",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Helper puri                                                         */
/* ------------------------------------------------------------------ */

const GIORNI = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

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

/** Etichetta estesa in italiano: 'giovedì 8 ottobre 2026'. */
function formatDataLunga(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "Data da definire";
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return date.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

function hasPreferences(a: Appointment): boolean {
  const p = a.preferenze;
  if (!p) return false;
  return Boolean(
    p.stileMood ||
      p.tipoCerimonia ||
      p.musicaNote ||
      p.celiaciNote ||
      p.noteGenerali ||
      (Array.isArray(p.spaziSelezionati) && p.spaziSelezionati.length > 0) ||
      (Array.isArray(p.serviziInteresse) && p.serviziInteresse.length > 0)
  );
}

const INTERESSE_LABEL: Record<Appointment["interesse"], string> = {
  esclusiva: "Esclusiva Location",
  semi_esclusiva: "Semi-Esclusività",
  sala_bianca: "Semi-Esclusività Sala Bianca",
  sala_tufo: "Semi-Esclusività Sala Tufo",
  da_definire: "Formula da consigliare",
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

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #efe7db",
  borderRadius: "18px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
};

/* ------------------------------------------------------------------ */
/* Componente principale                                               */
/* ------------------------------------------------------------------ */

export default function SegreteriaClient({ initialAppointments }: SegreteriaClientProps) {
  const [list, setList] = useState<Appointment[]>(initialAppointments);
  const [activeTab, setActiveTab] = useState<TabId>("agenda");
  const [categoria, setCategoria] = useState<CategoriaFilter>("tutti");
  const [soloOggi, setSoloOggi] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const tomorrowIso = useMemo(() => addDays(todayIso, 1), [todayIso]);

  const showFeedback = (tone: "ok" | "err", text: string) => {
    setFeedback({ tone, text });
    window.setTimeout(() => setFeedback(null), 4500);
  };

  const indexed = useMemo(() => list.map((a) => ({ a, hay: buildHaystack(a) })), [list]);

  // 1) Ricerca testuale (nome, telefono, email, note)
  const searched = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return indexed.map(({ a }) => a);
    return indexed.filter(({ hay }) => terms.every((t) => hay.includes(t))).map(({ a }) => a);
  }, [indexed, query]);

  // 2) Oggi
  const preCategoria = useMemo(
    () => (soloOggi ? searched.filter((a) => a.dataAppuntamento === todayIso) : searched),
    [searched, soloOggi, todayIso]
  );

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

  const kpi = useMemo(() => {
    const wedding = list.filter((a) => a.tipo === "wedding").length;
    const privato = list.filter((a) => a.tipo === "privato").length;
    const oggi = list.filter((a) => a.dataAppuntamento === todayIso).length;
    return { oggi, wedding, privato, total: list.length };
  }, [list, todayIso]);

  const handleStatus = async (id: string, next: Appointment["stato"]) => {
    setPendingId(id);
    try {
      const res = await updateAppointmentStatoAction(id, next);
      if (res.success) {
        setList((prev) => prev.map((a) => (a.id === id ? { ...a, stato: next } : a)));
        showFeedback("ok", "Stato dell'appuntamento aggiornato.");
      } else {
        showFeedback("err", res.error || "Impossibile aggiornare lo stato.");
      }
    } finally {
      setPendingId(null);
    }
  };

  const handlePreferencesSaved = (appointmentId: string, preferenze: AppointmentPreferences) => {
    setList((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, preferenze } : a))
    );
  };

  return (
    <div style={{ maxWidth: "1250px", margin: "0 auto", fontFamily: "'Outfit', sans-serif" }}>
      {/* Testata rassicurante */}
      <div style={{ marginBottom: "1.4rem" }}>
        <span
          style={{
            textTransform: "uppercase",
            letterSpacing: "2px",
            fontSize: "0.8rem",
            color: "#e58c2c",
            fontWeight: 800,
          }}
        >
          Postazione Tablet · Segreteria & Accoglienza
        </span>
        <h1
          style={{
            margin: "0.3rem 0 0",
            fontFamily: "Georgia, 'Playfair Display', serif",
            fontSize: "2.1rem",
            color: "#1e1b18",
          }}
        >
          👋 Benvenuta in Segreteria
        </h1>
        <p style={{ margin: "0.35rem 0 0", color: "#6a6764", maxWidth: "760px", fontSize: "1rem" }}>
          Qui trovi tutte le visite e gli appuntamenti in agenda. Durante il giro della tenuta,
          annota le preferenze degli sposi: le ritroveranno già pronte nella loro Area Riservata.
        </p>
      </div>

      {/* Tab di navigazione touch */}
      <div
        style={{
          display: "flex",
          gap: "0.6rem",
          background: "#ffffff",
          padding: "0.5rem",
          borderRadius: "16px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
          marginBottom: "1.6rem",
        }}
      >
        {[
          { id: "agenda" as const, icon: "📅", label: "Agenda Appuntamenti & Visite" },
          { id: "tour" as const, icon: "🌿", label: "Tour Fotografico Sale" },
        ].map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1,
                minHeight: "56px",
                borderRadius: "12px",
                border: "none",
                background: active ? "#1e3a2f" : "transparent",
                color: active ? "#ffffff" : "#44403c",
                fontWeight: 800,
                fontSize: "1.02rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          role="status"
          style={{
            marginBottom: "1.2rem",
            padding: "0.85rem 1.1rem",
            borderRadius: "12px",
            fontWeight: 800,
            fontSize: "0.95rem",
            background: feedback.tone === "ok" ? "#f0fdf4" : "#fef2f2",
            color: feedback.tone === "ok" ? "#166534" : "#991b1b",
            border: `1px solid ${feedback.tone === "ok" ? "#bbf7d0" : "#fecaca"}`,
          }}
        >
          {feedback.tone === "ok" ? "✅ " : "⚠️ "}
          {feedback.text}
        </div>
      )}

      {/* ============================= AGENDA ============================= */}
      {activeTab === "agenda" && (
        <div>
          {/* KPI semplici */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.85rem",
              marginBottom: "1.3rem",
            }}
          >
            <KpiCard
              label="☀️ Appuntamenti di Oggi"
              value={String(kpi.oggi)}
              accent="#e58c2c"
              highlight={kpi.oggi > 0}
            />
            <KpiCard label="💍 Wedding" value={String(kpi.wedding)} accent="#be185d" />
            <KpiCard label="🎉 Eventi Privati" value={String(kpi.privato)} accent="#7c3aed" />
            <KpiCard label="📅 Totale in Agenda" value={String(kpi.total)} accent="#1e3a2f" />
          </div>

          {/* Filtri puliti */}
          <div style={{ ...cardStyle, padding: "1.1rem 1.3rem", marginBottom: "1.3rem", display: "grid", gap: "0.9rem" }}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Cerca per nome o telefono…"
              aria-label="Cerca appuntamenti"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "0.85rem 1rem",
                borderRadius: "12px",
                border: "1px solid #e0ddd9",
                fontFamily: "inherit",
                fontSize: "1.02rem",
                background: "#fff",
                color: "#2c2a27",
              }}
            />

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.55rem", alignItems: "center" }}>
              <FilterPill active={soloOggi} onClick={() => setSoloOggi((v) => !v)} tone="orange">
                ☀️ Oggi
              </FilterPill>

              <span style={{ width: "1px", height: "26px", background: "#eae5db", margin: "0 0.2rem" }} />

              {([
                { key: "tutti" as const, label: "Tutti", count: counts.tutti },
                { key: "wedding" as const, label: "💍 Solo Wedding", count: counts.wedding },
                { key: "privato" as const, label: "🎉 Solo Eventi Privati", count: counts.privato },
              ]).map((t) => (
                <FilterPill
                  key={t.key}
                  active={categoria === t.key}
                  onClick={() => setCategoria(t.key)}
                  tone="dark"
                >
                  {t.label}
                  <span
                    style={{
                      background: categoria === t.key ? "#e58c2c" : "#f0eee9",
                      color: categoria === t.key ? "#fff" : "#514d48",
                      borderRadius: "999px",
                      padding: "0.05rem 0.55rem",
                      fontSize: "0.8rem",
                      marginLeft: "0.1rem",
                    }}
                  >
                    {t.count}
                  </span>
                </FilterPill>
              ))}
            </div>
          </div>

          {/* Elenco appuntamenti */}
          <div style={{ display: "grid", gap: "0.9rem" }}>
            {sorted.map((a) => (
              <AppuntamentoCard
                key={a.id}
                appointment={a}
                todayIso={todayIso}
                tomorrowIso={tomorrowIso}
                pending={pendingId === a.id}
                onStatus={handleStatus}
                onOpenPreferences={() => setEditing(a)}
              />
            ))}

            {sorted.length === 0 && (
              <div
                style={{
                  background: "#fff",
                  border: "1px dashed #e0ddd9",
                  borderRadius: "16px",
                  padding: "2.6rem",
                  textAlign: "center",
                  color: "#9a948c",
                  fontSize: "1rem",
                }}
              >
                {list.length === 0
                  ? "Nessun appuntamento in agenda. Le visite appariranno qui."
                  : "Nessun appuntamento corrisponde ai filtri scelti."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================== TOUR ============================== */}
      {activeTab === "tour" && <TourFotografico />}

      {/* Modale Preferenze */}
      {editing && (
        <PreferenzeModal
          appointment={editing}
          onClose={() => setEditing(null)}
          onSaved={(prefs) => {
            handlePreferencesSaved(editing.id, prefs);
            showFeedback("ok", "Preferenze salvate! La coppia le troverà pronte nel proprio Wedding Diary.");
          }}
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
        padding: "1.1rem 1.3rem",
        borderTop: `5px solid ${accent}`,
        background: highlight ? "#fff7ed" : "#fff",
        boxShadow: highlight ? "0 10px 26px rgba(229,140,44,0.18)" : cardStyle.boxShadow,
      }}
    >
      <div
        style={{
          fontSize: "0.78rem",
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          color: "#9a948c",
          fontWeight: 800,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "1.8rem", fontWeight: 800, color: accent, marginTop: "0.15rem" }}>{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filtro a pillola                                                    */
/* ------------------------------------------------------------------ */

function FilterPill({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone: "orange" | "dark";
  children: React.ReactNode;
}) {
  const activeStyles: CSSProperties =
    tone === "orange"
      ? { background: "#e58c2c", color: "#fff", border: "1px solid #c9791f" }
      : { background: "#1e3a2f", color: "#f5efe6", border: "1px solid #1e3a2f" };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        cursor: "pointer",
        minHeight: "46px",
        padding: "0.55rem 1.1rem",
        borderRadius: "999px",
        border: "1px solid #e0ddd9",
        background: active ? activeStyles.background : "#fff",
        color: active ? activeStyles.color : "#514d48",
        fontWeight: 800,
        fontSize: "0.92rem",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Card appuntamento                                                   */
/* ------------------------------------------------------------------ */

function AppuntamentoCard({
  appointment: a,
  todayIso,
  tomorrowIso,
  pending,
  onStatus,
  onOpenPreferences,
}: {
  appointment: Appointment;
  todayIso: string;
  tomorrowIso: string;
  pending: boolean;
  onStatus: (id: string, stato: Appointment["stato"]) => void;
  onOpenPreferences: () => void;
}) {
  const isWedding = a.tipo === "wedding";
  const partner = partnerName(a);
  const wa = whatsappNumber(a.telefono);
  const isToday = a.dataAppuntamento === todayIso;
  const isTomorrow = a.dataAppuntamento === tomorrowIso;
  const isPast = Boolean(a.dataAppuntamento && a.dataAppuntamento < todayIso);
  const saved = hasPreferences(a);

  const waMessage = encodeURIComponent(
    `Gentile ${fullName(a)}, le confermiamo il suo appuntamento presso La Terra degli Aranci per ${formatDataBreve(
      a.dataAppuntamento
    )} alle ${a.orarioAppuntamento || "--:--"}. La aspettiamo! Per qualsiasi necessità può rispondere a questo messaggio.`
  );

  const dateBadge: CSSProperties = isToday
    ? { background: "linear-gradient(135deg, #e58c2c 0%, #c9791f 100%)", color: "#fff", border: "1px solid #c9791f" }
    : isTomorrow
      ? { background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }
      : { background: isPast ? "#f0eee9" : "#fff", color: "#514d48", border: "1px solid #e0ddd9" };

  return (
    <div
      style={{
        ...cardStyle,
        padding: "1.2rem 1.4rem",
        display: "grid",
        gridTemplateColumns: "minmax(160px, 0.75fr) minmax(250px, 1.5fr) minmax(190px, 1fr) minmax(220px, auto)",
        gap: "1.2rem",
        alignItems: "center",
        borderLeft: isToday ? "6px solid #e58c2c" : "1px solid #efe7db",
        opacity: a.stato === "annullato" ? 0.65 : 1,
      }}
    >
      {/* Data e orario */}
      <div style={{ display: "grid", gap: "0.45rem", justifyItems: "start" }}>
        <span
          style={{
            ...dateBadge,
            borderRadius: "10px",
            padding: "0.5rem 0.85rem",
            fontWeight: 800,
            fontSize: "0.92rem",
            whiteSpace: "nowrap",
          }}
        >
          {(isToday ? "☀️ OGGI · " : isTomorrow ? "🌅 DOMANI · " : "") + formatDataBreve(a.dataAppuntamento)}
        </span>
        <span style={{ fontWeight: 800, fontSize: "1.4rem", color: isToday ? "#c2410c" : "#1e1b18" }}>
          🕐 {a.orarioAppuntamento || "--:--"}
        </span>
        <span
          style={{
            background: isWedding ? "#fce7f3" : "#ede9fe",
            color: isWedding ? "#9d174d" : "#5b21b6",
            padding: "0.25rem 0.75rem",
            borderRadius: "999px",
            fontSize: "0.78rem",
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          {isWedding ? "💍 Wedding" : "🎉 Evento Privato"}
        </span>
      </div>

      {/* Identità + contatti + dettagli */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "#1e1b18" }}>{displayName(a)}</div>
        {isWedding && partner && (
          <div style={{ fontSize: "0.9rem", color: "#6a6764", marginTop: "0.1rem" }}>
            💞 {fullName(a)} &amp; {partner}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.55rem", alignItems: "center", marginTop: "0.6rem", fontSize: "0.9rem" }}>
          {a.telefono ? (
            <>
              <a
                href={`tel:${a.telefono.replace(/[^\d+]/g, "")}`}
                style={{ color: "#2c2a27", fontWeight: 700, textDecoration: "none" }}
              >
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
                    padding: "0.35rem 0.85rem",
                    borderRadius: "999px",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  💬 WhatsApp
                </a>
              )}
            </>
          ) : (
            <span style={{ color: "#b5b0a8" }}>📞 Telefono n.d.</span>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginTop: "0.6rem", fontSize: "0.82rem" }}>
          <span
            style={{
              background: "#faf7f2",
              border: "1px solid #efe7db",
              borderRadius: "999px",
              padding: "0.2rem 0.7rem",
              fontWeight: 700,
              color: "#7c3f08",
            }}
          >
            🎯 {INTERESSE_LABEL[a.interesse]}
          </span>
          {a.ospitiPrevisti ? (
            <span
              style={{
                background: "#faf7f2",
                border: "1px solid #efe7db",
                borderRadius: "999px",
                padding: "0.2rem 0.7rem",
                color: "#514d48",
              }}
            >
              👥 {a.ospitiPrevisti} ospiti
            </span>
          ) : null}
        </div>
      </div>

      {/* Periodo evento + note */}
      <div style={{ display: "grid", gap: "0.35rem", fontSize: "0.92rem", minWidth: 0 }}>
        <div>
          <span style={{ color: "#9a948c", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800 }}>
            Periodo evento
          </span>
          <div style={{ fontWeight: 700 }}>📆 {a.dataEventoPresunta || "Da definire"}</div>
        </div>
        {a.note && (
          <div
            style={{
              color: "#6a6764",
              fontSize: "0.85rem",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            📝 {a.note}
          </div>
        )}
        {saved && (
          <div style={{ color: "#166534", fontWeight: 800, fontSize: "0.82rem" }}>
            ✅ Preferenze già registrate
          </div>
        )}
      </div>

      {/* Stato + azioni */}
      <div style={{ display: "grid", gap: "0.55rem", justifyItems: "stretch", minWidth: "220px" }}>
        <span
          style={{
            ...STATO_STYLE[a.stato],
            borderRadius: "999px",
            padding: "0.35rem 0.8rem",
            fontSize: "0.82rem",
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          {STATO_LABEL[a.stato]}
        </span>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {a.stato !== "confermato" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => onStatus(a.id, "confermato")}
              style={quickBtn("#166534")}
            >
              ✅ Conferma
            </button>
          )}
          {a.stato !== "effettuato" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => onStatus(a.id, "effettuato")}
              style={quickBtn("#5b21b6")}
            >
              🟣 Effettuato
            </button>
          )}
        </div>

        {/* AZIONE CHIAVE: nessun "Crea Preventivo", solo Preferenze Visita. */}
        <button
          type="button"
          onClick={onOpenPreferences}
          style={{
            minHeight: "54px",
            borderRadius: "12px",
            border: "none",
            background: saved
              ? "linear-gradient(135deg, #1e3a2f 0%, #2f5a48 100%)"
              : "linear-gradient(135deg, #e58c2c 0%, #c9791f 100%)",
            color: "#fff",
            fontWeight: 800,
            fontSize: "0.98rem",
            cursor: "pointer",
            boxShadow: saved ? "0 5px 16px rgba(30,58,47,0.28)" : "0 5px 16px rgba(229,140,44,0.32)",
            fontFamily: "inherit",
          }}
        >
          {saved ? "✏️ Modifica Preferenze ✨" : "📝 Inserisci Preferenze Visita"}
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
    padding: "0.45rem 0.75rem",
    borderRadius: "9px",
    fontWeight: 700,
    fontSize: "0.8rem",
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

/* ------------------------------------------------------------------ */
/* Tour fotografico + lightbox                                         */
/* ------------------------------------------------------------------ */

function TourFotografico() {
  const [lightbox, setLightbox] = useState<{ gallery: string[]; index: number; title: string } | null>(null);

  const close = () => setLightbox(null);
  const move = (delta: number) =>
    setLightbox((prev) => {
      if (!prev) return prev;
      const next = (prev.index + delta + prev.gallery.length) % prev.gallery.length;
      return { ...prev, index: next };
    });

  return (
    <div>
      <div style={{ marginBottom: "1.4rem" }}>
        <h2
          style={{
            fontFamily: "Georgia, 'Playfair Display', serif",
            fontSize: "1.8rem",
            margin: "0 0 0.35rem 0",
            color: "#1e1b18",
          }}
        >
          Tour Fotografico delle Sale
        </h2>
        <p style={{ color: "#57534e", fontSize: "1rem", margin: 0 }}>
          Mostra agli ospiti le foto in alta definizione degli ambienti durante il giro della villa.
          Tocca una foto per ingrandirla a tutto schermo.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1.4rem",
        }}
      >
        {VENUE_SPACES.map((space) => (
          <div
            key={space.id}
            style={{
              background: "#fff",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
              border: "1px solid #e5dfd5",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <button
              type="button"
              onClick={() => setLightbox({ gallery: space.gallery, index: 0, title: space.name })}
              style={{ padding: 0, border: "none", background: "none", cursor: "zoom-in", position: "relative", height: "230px", width: "100%" }}
              aria-label={`Ingrandisci ${space.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={space.gallery[0]}
                alt={space.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <span
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  background: "rgba(30, 27, 24, 0.85)",
                  color: "#fcfbf9",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  border: "1px solid rgba(229,140,44,0.4)",
                }}
              >
                {space.moment}
              </span>
              <span
                style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  background: "rgba(255,255,255,0.92)",
                  color: "#1e1b18",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                }}
              >
                🔍 Alta definizione
              </span>
            </button>

            <div style={{ padding: "1.3rem", flex: 1, display: "flex", flexDirection: "column" }}>
              <h3
                style={{
                  fontFamily: "Georgia, 'Playfair Display', serif",
                  fontSize: "1.3rem",
                  margin: "0 0 0.5rem 0",
                  color: "#1e1b18",
                }}
              >
                {space.name}
              </h3>
              <p style={{ color: "#57534e", fontSize: "0.92rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                {space.description}
              </p>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", overflowX: "auto" }}>
                {space.gallery.map((src, idx) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setLightbox({ gallery: space.gallery, index: idx, title: space.name })}
                    style={{
                      padding: 0,
                      border: "1px solid #e5dfd5",
                      borderRadius: "10px",
                      overflow: "hidden",
                      cursor: "pointer",
                      flex: "0 0 74px",
                      height: "58px",
                      background: "#f5f2eb",
                    }}
                    aria-label={`Apri foto ${idx + 1} di ${space.name}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,18,16,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: "2rem",
          }}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Chiudi"
            style={{
              position: "absolute",
              top: "1.2rem",
              right: "1.4rem",
              background: "rgba(255,255,255,0.14)",
              color: "#fff",
              border: "none",
              borderRadius: "999px",
              width: "52px",
              height: "52px",
              fontSize: "1.5rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              move(-1);
            }}
            aria-label="Foto precedente"
            style={lightboxNav("left")}
          >
            ‹
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.gallery[lightbox.index]}
            alt={lightbox.title}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "min(1200px, 92vw)",
              maxHeight: "86vh",
              objectFit: "contain",
              borderRadius: "14px",
              boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
            }}
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              move(1);
            }}
            aria-label="Foto successiva"
            style={lightboxNav("right")}
          >
            ›
          </button>

          <div
            style={{
              position: "absolute",
              bottom: "1.4rem",
              left: "50%",
              transform: "translateX(-50%)",
              color: "#f5efe6",
              fontWeight: 700,
              fontSize: "0.95rem",
              background: "rgba(0,0,0,0.35)",
              padding: "0.45rem 1rem",
              borderRadius: "999px",
            }}
          >
            {lightbox.title} · {lightbox.index + 1}/{lightbox.gallery.length}
          </div>
        </div>
      )}
    </div>
  );
}

function lightboxNav(side: "left" | "right"): CSSProperties {
  const style: CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.14)",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    width: "58px",
    height: "58px",
    fontSize: "2rem",
    lineHeight: 1,
    cursor: "pointer",
  };
  if (side === "left") style.left = "1.4rem";
  else style.right = "1.4rem";
  return style;
}

/* ------------------------------------------------------------------ */
/* Modale Compila Preferenze (touch-friendly)                          */
/* ------------------------------------------------------------------ */

function preferencesFromAppointment(a: Appointment): AppointmentPreferencesInput {
  const p = a.preferenze;
  return {
    stileMood: p?.stileMood || "",
    spaziSelezionati: Array.isArray(p?.spaziSelezionati) ? p!.spaziSelezionati : [],
    tipoCerimonia: p?.tipoCerimonia || "",
    serviziInteresse: Array.isArray(p?.serviziInteresse) ? p!.serviziInteresse : [],
    musicaNote: p?.musicaNote || "",
    celiaciNote: p?.celiaciNote || "",
    noteGenerali: p?.noteGenerali || "",
  };
}

function PreferenzeModal({
  appointment,
  onClose,
  onSaved,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSaved: (prefs: AppointmentPreferences) => void;
}) {
  const [prefs, setPrefs] = useState<AppointmentPreferencesInput>(() => preferencesFromAppointment(appointment));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [savedDone, setSavedDone] = useState(false);

  const isWedding = appointment.tipo === "wedding";

  const toggle = (key: "spaziSelezionati" | "serviziInteresse", value: string) => {
    setPrefs((prev) => {
      const current = prev[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const setSingle = (key: "stileMood" | "tipoCerimonia", value: string) =>
    setPrefs((prev) => ({ ...prev, [key]: prev[key] === value ? "" : value }));

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await saveAppointmentPreferencesAction(appointment.id, prefs);
      if (res.success) {
        setSavedDone(true);
        setMessage({ tone: "ok", text: "Preferenze salvate! La coppia le troverà pronte nel proprio Wedding Diary." });
        onSaved({
          ...prefs,
          updated_at: new Date().toISOString(),
        });
      } else {
        setMessage({ tone: "err", text: res.message || "Errore durante il salvataggio." });
      }
    } catch {
      setMessage({ tone: "err", text: "Errore di connessione. Riprova." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Compila Preferenze Sposi / Visita"
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
        zIndex: 1100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fcfbfa",
          borderRadius: "20px",
          width: "min(900px, 100%)",
          padding: "1.6rem 1.8rem 2rem",
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
          border: "1px solid #efe7db",
        }}
      >
        {/* Testata */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <span
              style={{
                textTransform: "uppercase",
                letterSpacing: "2px",
                fontSize: "0.74rem",
                color: "#e58c2c",
                fontWeight: 800,
              }}
            >
              {isWedding ? "Compila Preferenze Sposi / Visita" : "Compila Preferenze Referente / Visita"}
            </span>
            <h2
              style={{
                margin: "0.25rem 0 0",
                fontFamily: "Georgia, 'Playfair Display', serif",
                fontSize: "1.6rem",
                color: "#1e1b18",
              }}
            >
              📝 {displayName(appointment)}
            </h2>
            <p style={{ margin: "0.2rem 0 0", color: "#6a6764", fontSize: "0.9rem" }}>
              Visita del {formatDataLunga(appointment.dataAppuntamento)}
              {appointment.orarioAppuntamento ? ` · ore ${appointment.orarioAppuntamento}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#6a6764",
            }}
          >
            ✕
          </button>
        </div>

        {message && (
          <div
            role="status"
            style={{
              marginTop: "1.1rem",
              padding: "0.9rem 1.1rem",
              borderRadius: "12px",
              fontWeight: 800,
              background: message.tone === "ok" ? "#f0fdf4" : "#fef2f2",
              color: message.tone === "ok" ? "#166534" : "#991b1b",
              border: `1px solid ${message.tone === "ok" ? "#bbf7d0" : "#fecaca"}`,
            }}
          >
            {message.tone === "ok" ? "✅ " : "⚠️ "}
            {message.text}
          </div>
        )}

        {/* Stile & Mood */}
        <ModalSection icon="🎨" title="Stile & Mood" hint="Scegliete l'atmosfera che sognano.">
          {STILI_OPZIONI.map((val) => (
            <ChoicePill key={val} selected={prefs.stileMood === val} onClick={() => setSingle("stileMood", val)}>
              {val}
            </ChoicePill>
          ))}
        </ModalSection>

        {/* Spazi preferiti */}
        <ModalSection icon="🏛️" title="Spazi Preferiti" hint="Gli ambienti che li hanno emozionati. Puoi sceglierne più di uno.">
          {SPAZI_OPZIONI.map((val) => (
            <ChoicePill
              key={val}
              selected={prefs.spaziSelezionati.includes(val)}
              onClick={() => toggle("spaziSelezionati", val)}
            >
              {val}
            </ChoicePill>
          ))}
        </ModalSection>

        {/* Tipo cerimonia */}
        <ModalSection icon="💍" title="Tipo di Cerimonia" hint="Come immaginano il momento del rito.">
          {CERIMONIA_OPZIONI.map((val) => (
            <ChoicePill key={val} selected={prefs.tipoCerimonia === val} onClick={() => setSingle("tipoCerimonia", val)}>
              {val}
            </ChoicePill>
          ))}
        </ModalSection>

        {/* Servizi speciali */}
        <ModalSection icon="✨" title="Desideri & Servizi Speciali" hint="Senza prezzi: la direzione preparerà la proposta.">
          {SERVIZI_OPZIONI.map((val) => (
            <ChoicePill
              key={val}
              selected={prefs.serviziInteresse.includes(val)}
              onClick={() => toggle("serviziInteresse", val)}
            >
              {val}
            </ChoicePill>
          ))}
        </ModalSection>

        {/* Note testuali */}
        <ModalSection icon="🎵" title="Musica & Colonna Sonora" hint="Brani, artista o stile musicale desiderato.">
          <TextArea
            value={prefs.musicaNote}
            onChange={(v) => setPrefs((p) => ({ ...p, musicaNote: v }))}
            placeholder="Es. Ingresso sposa con arpa, DJ set dopocena anni '90…"
          />
        </ModalSection>

        <ModalSection icon="🍽️" title="Celiaci, Allergie o Intolleranze" hint="Fondamentale per il menù: scrivi tutto con calma.">
          <TextArea
            value={prefs.celiaciNote}
            onChange={(v) => setPrefs((p) => ({ ...p, celiaciNote: v }))}
            placeholder="Es. 2 ospiti celiaci, 1 intollerante al lattosio…"
          />
        </ModalSection>

        <ModalSection icon="📝" title="Impressioni Generali della Visita" hint="Sensazioni, richieste speciali, dettagli emersi.">
          <TextArea
            value={prefs.noteGenerali}
            onChange={(v) => setPrefs((p) => ({ ...p, noteGenerali: v }))}
            placeholder="Es. molto colpiti dall'agrumeto al tramonto, vorrebbero cerimonia all'aperto…"
          />
        </ModalSection>

        {/* Azioni */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "1.6rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: "2 1 320px",
              minHeight: "60px",
              borderRadius: "14px",
              border: "none",
              background: "linear-gradient(135deg, #e58c2c 0%, #c9791f 100%)",
              color: "#fff",
              fontWeight: 800,
              fontSize: "1.1rem",
              cursor: saving ? "wait" : "pointer",
              boxShadow: "0 6px 20px rgba(229,140,44,0.35)",
              opacity: saving ? 0.75 : 1,
              fontFamily: "inherit",
            }}
          >
            {saving ? "Salvataggio… ⏳" : "💾 Salva Preferenze nella Scheda Sposi"}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              flex: "1 1 140px",
              minHeight: "60px",
              borderRadius: "14px",
              border: "1px solid #d6cebf",
              background: "#fff",
              color: "#57534e",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {savedDone ? "Chiudi" : "Annulla"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalSection({
  icon,
  title,
  hint,
  children,
}: {
  icon: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: "1.6rem" }}>
      <div style={{ marginBottom: "0.7rem" }}>
        <h3
          style={{
            margin: 0,
            fontSize: "1.08rem",
            color: "#1e3a2f",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>{icon}</span>
          <span>{title}</span>
        </h3>
        {hint && <small style={{ color: "#9a948c", fontSize: "0.8rem" }}>{hint}</small>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.55rem" }}>{children}</div>
    </div>
  );
}

function ChoicePill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        minHeight: "48px",
        padding: "0.6rem 1.05rem",
        borderRadius: "999px",
        border: selected ? "2px solid #e58c2c" : "1px solid #e3dace",
        background: selected ? "#fff7ec" : "#fff",
        color: selected ? "#c2410c" : "#4a4642",
        fontWeight: selected ? 800 : 600,
        fontSize: "0.92rem",
        cursor: "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
      }}
    >
      {selected && <span aria-hidden>✓</span>}
      {children}
    </button>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      rows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "0.85rem 1rem",
        borderRadius: "12px",
        border: "1px solid #ded7cd",
        fontFamily: "inherit",
        fontSize: "0.98rem",
        color: "#2c2a27",
        background: "#fff",
        resize: "vertical",
      }}
    />
  );
}
