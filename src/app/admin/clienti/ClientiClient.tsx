"use client";

import React, { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createEventForClientAction,
  type ClientiFormula,
} from "./actions";
import TagEditorModal, { TAG_STYLES } from "./TagEditorModal";

export interface ClienteEventoRow {
  id: string;
  titolo: string;
  data: string | null;
  formula: string;
  stage: string;
  stageLabel: string;
  badgeColor: string;
}

export interface ClienteRow {
  id: string;
  nome: string;
  cognome: string;
  partner?: string;
  email: string;
  telefono: string;
  /** Tag assegnati: VIP Club TDA, Sposi, Privato, Nuovo. */
  tags: string[];
  isClub: boolean;
  isOpenDay?: boolean;
  eventiCount: number;
  ltvCents: number;
  eventi: ClienteEventoRow[];
  /** true se il cliente ha un evento confermato/in regia/svolto o una quote firmata. */
  hasSignedContract: boolean;
}

interface ClientiClientProps {
  clienti: ClienteRow[];
}

function whatsappHref(telefono: string): string {
  return `https://wa.me/${String(telefono).replace(/[^0-9]/g, "")}`;
}

function formatDate(value: string | null): string {
  if (!value) return "Da definire";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/** Mesi in italiano per le etichette dei filtri (es. "Maggio 2026"). */
const MESI_ITALIANI = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

/** Estrae la chiave mese "YYYY-MM" da una data evento. */
function eventMonthKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})/.exec(String(value));
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

/** Etichetta italiana del mese, es. "Maggio 2026". */
function formatMonthLabel(key: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return key;
  const mese = MESI_ITALIANI[Number(match[2]) - 1];
  return mese ? `${mese} ${match[1]}` : key;
}

/** Data evento come Date locale (mezzanotte), senza slittamenti di fuso orario. */
function parseEventDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWeddingEvent(ev: ClienteEventoRow): boolean {
  return /matrimoni|sposi|nozze|wedding/i.test(String(ev?.titolo || ""));
}

function clienteHasWedding(cliente: ClienteRow): boolean {
  if ((cliente.tags || []).some((tag) => /sposi|matrimon/i.test(tag))) return true;
  return (cliente.eventi || []).some(isWeddingEvent);
}

function clienteHasPrivato(cliente: ClienteRow): boolean {
  if ((cliente.tags || []).some((tag) => /privato/i.test(tag))) return true;
  return (cliente.eventi || []).some((ev) => !isWeddingEvent(ev));
}

/** Evento di riferimento per il messaggio: il prossimo, altrimenti il più recente. */
function getEventoRiferimento(cliente: ClienteRow): ClienteEventoRow | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const validi = (cliente.eventi || []).filter((ev) => parseEventDate(ev.data));
  const futuri = validi
    .filter((ev) => {
      const data = parseEventDate(ev.data);
      return data ? data.getTime() >= today.getTime() : false;
    })
    .sort((a, b) => String(a.data).localeCompare(String(b.data)));
  if (futuri.length > 0) return futuri[0];
  const passati = [...validi].sort((a, b) => String(b.data).localeCompare(String(a.data)));
  return passati[0] ?? null;
}

/** Data estesa in italiano, es. "18 Giugno 2027". */
function formatLongDate(value: string | null | undefined): string {
  if (!value) return "una data da definire";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!match) return String(value);
  const mese = MESI_ITALIANI[Number(match[2]) - 1];
  if (!mese) return String(value);
  return `${Number(match[3])} ${mese} ${match[1]}`;
}

/** Numero normalizzato per wa.me: prefisso internazionale 39 per i numeri italiani. */
function whatsappPhone(telefono: string): string {
  const digits = String(telefono || "").replace(/\D/g, "");
  let cleanPhone = digits;
  if (cleanPhone.startsWith("00")) cleanPhone = cleanPhone.slice(2);
  if (cleanPhone.startsWith("0")) cleanPhone = `39${cleanPhone}`;
  return cleanPhone;
}

/** Nome della coppia per titolo modale e saluto del messaggio. */
function nomeCoppia(cliente: ClienteRow): string {
  const nome = String(cliente.nome || "").trim();
  const partner = String(cliente.partner || "").trim();
  if (nome && partner) return `${nome} e ${partner}`;
  return nome || partner || "carissimi";
}

/** Testo sartoriale precompilato per l'invito a definire l'organizzazione delle nozze. */
function buildNozzeMessage(cliente: ClienteRow): string {
  const evento = getEventoRiferimento(cliente);
  const data = evento ? formatLongDate(evento.data) : "una data da definire";
  return `Ciao ${nomeCoppia(cliente)}! Sono Roberto de La Terra degli Aranci. In vista del vostro matrimonio del ${data}, è arrivato il momento di vederci con calma in villa per iniziare a definire insieme tutti i dettagli: allestimenti, mise en place, timeline e menu. Quando vi farebbe piacere passare in settimana per un caffè insieme? Fatemi sapere! Un caro saluto, Roberto Sola`;
}

/** Riepilogo pulito dei tipi di evento (senza duplicati), es. "Matrimonio + Battesimo". */
function getEventTypesSummary(eventi: ClienteEventoRow[]): string {
  if (!eventi || eventi.length === 0) return "";
  const tipi: string[] = [];
  for (const ev of eventi) {
    const titolo = String(ev?.titolo || "").trim();
    if (titolo && !tipi.includes(titolo)) tipi.push(titolo);
  }
  return tipi.join(" + ");
}

/**
 * Cellula compatta "Eventi Agganciati": mostra in evidenza l'evento corrente attivo
 * (dalla firma del contratto fino al giorno dell'evento).
 * Lo storico degli eventi passati già conclusi è archiviato nella Scheda CRM del cliente.
 */
function EventiCell({ eventi }: { eventi: ClienteEventoRow[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);

  // Filtra eventi attivi/correnti: non conclusi e con data odierna o futura
  const eventiAttivi = (eventi || []).filter(
    (ev) => ev.stage !== "svolto" && (!ev.data || ev.data >= todayIso)
  );
  const eventiPassati = (eventi || []).filter(
    (ev) => ev.stage === "svolto" || (ev.data && ev.data < todayIso)
  );

  if (eventiAttivi.length === 0) {
    if (eventiPassati.length > 0) {
      return (
        <span style={{ fontSize: "0.78rem", color: "#8a847c" }} title="Evento passato concluso: consulta lo storico completo nella Scheda CRM">
          Nessun evento attivo <small style={{ color: "#a8a29e" }}>({eventiPassati.length} nello storico)</small>
        </span>
      );
    }
    return <span style={{ fontSize: "0.78rem", color: "#a8a29e" }}>Nessun evento collegato</span>;
  }

  const primo = eventiAttivi[0];
  const altri = eventiAttivi.slice(1);

  const toggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const width = 300;
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      setPos({ top: rect.bottom + 6, left });
    }
    setOpen((v) => !v);
  };

  const badgeStyle: React.CSSProperties = {
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "0.18rem 0.5rem",
    borderRadius: "6px",
    textDecoration: "none",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", flexWrap: "nowrap" }}>
      <a
        href={`/admin/eventi/${primo.id}`}
        title={`${primo.titolo} · ${formatDate(primo.data)} · ${primo.formula}`}
        style={{ ...badgeStyle, background: primo.badgeColor, color: "#ffffff" }}
      >
        {primo.stageLabel} · {formatDate(primo.data)}
      </a>

      {altri.length > 0 && (
        <button
          ref={btnRef}
          type="button"
          onClick={toggle}
          title={`Mostra altri ${altri.length} eventi attivi`}
          aria-expanded={open}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.15rem",
            fontSize: "0.68rem",
            fontWeight: 700,
            padding: "0.16rem 0.45rem",
            borderRadius: 999,
            border: "1px solid #e8e2d9",
            background: open ? "#1e1b18" : "#fff",
            color: open ? "#f6c177" : "#c2410c",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          ▾ +{altri.length} altri attivi
        </button>
      )}

      {open && altri.length > 0 && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 900 }}
          />
          <div
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: 300,
              maxHeight: 300,
              overflowY: "auto",
              zIndex: 901,
              background: "#fff",
              border: "1px solid #e8e2d9",
              borderRadius: 12,
              boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
              padding: "0.5rem",
            }}
          >
            <div
              style={{
                fontSize: "0.68rem",
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "#8a847c",
                fontWeight: 700,
                padding: "0.25rem 0.5rem 0.5rem",
              }}
            >
              Eventi attivi in corso ({altri.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              {altri.map((ev) => (
                <a
                  key={ev.id}
                  href={`/admin/eventi/${ev.id}`}
                  title={`Apri scheda regia: ${ev.titolo}`}
                  style={{
                    display: "block",
                    padding: "0.45rem 0.5rem",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: "#1e1b18",
                    background: "#faf8f5",
                    border: "1px solid #f0eee9",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "baseline" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{ev.titolo}</span>
                    <span style={{ fontSize: "0.72rem", color: "#8a847c", whiteSpace: "nowrap" }}>{formatDate(ev.data)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "center", marginTop: "0.2rem" }}>
                    <span
                      style={{
                        fontSize: "0.64rem",
                        fontWeight: 700,
                        padding: "0.1rem 0.4rem",
                        borderRadius: 999,
                        background: ev.badgeColor,
                        color: "#fff",
                      }}
                    >
                      {ev.stageLabel}
                    </span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#c2410c" }}>
                      Scheda regia →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ClientiClient({ clienti }: ClientiClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedType, setSelectedType] = useState<"all" | "wedding" | "privato">("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [tagsCliente, setTagsCliente] = useState<ClienteRow | null>(null);
  const [invitoCliente, setInvitoCliente] = useState<ClienteRow | null>(null);
  const [invitoTesto, setInvitoTesto] = useState("");
  const [formClienteId, setFormClienteId] = useState("");
  const [formData, setFormData] = useState("");
  const [formTurno, setFormTurno] = useState<"pranzo" | "cena">("pranzo");
  const [formFormula, setFormFormula] = useState<ClientiFormula>("sala_bianca");
  const [formTipo, setFormTipo] = useState<"wedding" | "eventi">("wedding");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  /** Mesi (YYYY-MM) in cui esiste almeno un evento, in ordine cronologico. */
  const monthOptions = useMemo(() => {
    const mesi = new Set<string>();
    for (const c of clienti) {
      for (const ev of c.eventi || []) {
        const key = eventMonthKey(ev.data);
        if (key) mesi.add(key);
      }
    }
    return Array.from(mesi).sort();
  }, [clienti]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(today);
    if (selectedMonth === "prossimi_30") rangeEnd.setDate(rangeEnd.getDate() + 30);
    if (selectedMonth === "prossimi_60") rangeEnd.setDate(rangeEnd.getDate() + 60);

    return clienti.filter((c) => {
      if (q && !`${c.nome} ${c.cognome} ${c.partner || ""} ${c.email} ${c.telefono}`.toLowerCase().includes(q)) {
        return false;
      }

      if (selectedType === "wedding" && !clienteHasWedding(c)) return false;
      if (selectedType === "privato" && !clienteHasPrivato(c)) return false;

      if (selectedStage === "firmato" && !c.hasSignedContract) return false;
      if (selectedStage === "opzione" && !c.eventi?.some((ev) => ev.stage === "opzione")) return false;
      if (selectedStage === "lead" && (c.hasSignedContract || c.eventi?.some((ev) => ev.stage === "opzione"))) return false;
      if (selectedStage === "openday" && !c.isOpenDay && !c.tags?.some((t) => t.toLowerCase().includes("open"))) return false;
      if (selectedStage === "svolto" && !c.eventi?.some((ev) => ev.stage === "svolto")) return false;

      if (selectedMonth === "prossimi_30" || selectedMonth === "prossimi_60") {
        const hasEventoInRange = (c.eventi || []).some((ev) => {
          const data = parseEventDate(ev.data);
          return data ? data.getTime() >= today.getTime() && data.getTime() <= rangeEnd.getTime() : false;
        });
        if (!hasEventoInRange) return false;
      } else if (selectedMonth !== "all") {
        const hasMese = (c.eventi || []).some((ev) => eventMonthKey(ev.data) === selectedMonth);
        if (!hasMese) return false;
      }

      return true;
    });
  }, [clienti, search, selectedMonth, selectedType, selectedStage]);

  const totalClients = clienti.length;
  const clubMembers = clienti.filter((c) => c.isClub).length;
  const repeatClients = clienti.filter((c) => c.eventiCount > 1).length;
  const loyaltyRate = totalClients > 0 ? Math.round((repeatClients / totalClients) * 100) : 0;

  const openModal = (clienteId?: string) => {
    setError("");
    setFormClienteId(clienteId || clienti[0]?.id || "");
    setFormData("");
    setFormTurno("pranzo");
    setFormFormula("sala_bianca");
    setFormTipo("wedding");
    setModalOpen(true);
  };

  /** Apre la modale di personalizzazione dell'invito nozze (solo clienti con contratto firmato). */
  const openInvito = (cliente: ClienteRow) => {
    setInvitoCliente(cliente);
    setInvitoTesto(buildNozzeMessage(cliente));
  };

  const closeInvito = () => {
    setInvitoCliente(null);
    setInvitoTesto("");
  };

  /** Invia il testo personalizzato su WhatsApp in una nuova scheda e chiude la modale. */
  const handleInvioInvito = () => {
    if (!invitoCliente) return;
    const telefono = whatsappPhone(invitoCliente.telefono);
    if (!telefono) return;
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(invitoTesto)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    closeInvito();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formClienteId) {
      setError("Seleziona un cliente esistente.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData)) {
      setError("Inserisci una data evento valida.");
      return;
    }
    startTransition(async () => {
      const res = await createEventForClientAction({
        clientId: formClienteId,
        data_evento: formData,
        turno: formTurno,
        formula: formFormula,
        tipo_evento: formTipo,
      });
      if (res.success && res.contractUrl) {
        window.location.href = res.contractUrl;
      } else {
        setError(res.error || "Impossibile creare l'evento.");
      }
    });
  };

  const kpiCard = (label: string, value: string, accent: string) => (
    <div
      className="premium-card"
      style={{
        padding: "1.4rem 1.6rem",
        borderLeft: `4px solid ${accent}`,
        display: "flex",
        flexDirection: "column",
        gap: "0.3rem",
      }}
    >
      <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "1px", color: "#8a847c", fontWeight: 700 }}>
        {label}
      </span>
      <span style={{ fontSize: "1.9rem", fontWeight: 800, color: "#1e1b18", lineHeight: 1.1 }}>{value}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: "1250px", margin: "0 auto", fontFamily: "'Outfit', sans-serif" }}>
      {/* Intestazione */}
      <div style={{ marginBottom: "1.5rem" }}>
        <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", color: "#e58c2c", fontWeight: "bold" }}>
          PILASTRO CLIENTI & CLUB TDA
        </span>
        <h1 style={{ margin: "0.3rem 0 0 0", color: "#514d48", fontSize: "2.2rem", fontFamily: "serif" }}>
          👥 Rubrica Clienti & Club TDA
        </h1>
        <p style={{ margin: 0, color: "#777" }}>
          Anagrafica unificata e fidelizzazione degli ospiti che hanno scelto La Terra degli Aranci. Gli importi e il valore storico (LTV) sono disponibili nella scheda CRM di ogni cliente.
        </p>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.2rem", marginBottom: "1.8rem" }}>
        {kpiCard("Clienti Registrati", String(totalClients), "#e58c2c")}
        {kpiCard("Membri Club TDA", String(clubMembers), "#1e1b18")}
        {kpiCard("Eventi Ripetuti / Fidelizzati", String(repeatClients), "#16a34a")}
        {kpiCard("Tasso Fidelizzazione", `${loyaltyRate}%`, "#0284c7")}
      </div>

      {/* Barra superiore */}
      <div className="premium-card" style={{ padding: "1.2rem 1.5rem", marginBottom: "1.6rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="🔍 Cerca per nome, email o telefono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "0.7rem 1.2rem", borderRadius: "8px", border: "1px solid #ddd", width: "320px", fontSize: "0.95rem" }}
            />
            <label style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700, color: "#8a847c" }}>
              Mese evento
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: "0.62rem 0.9rem",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  background: "#fff",
                  color: "#514d48",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  minWidth: "190px",
                  cursor: "pointer",
                }}
              >
                <option value="all">Tutti i Mesi</option>
                <option value="prossimi_30">Prossimi 30 giorni</option>
                <option value="prossimi_60">Prossimi 60 giorni</option>
                {monthOptions.map((key) => (
                  <option key={key} value={key}>
                    {formatMonthLabel(key)}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700, color: "#8a847c" }}>
              Tipo evento
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as "all" | "wedding" | "privato")}
                style={{
                  padding: "0.62rem 0.9rem",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  background: "#fff",
                  color: "#514d48",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  minWidth: "190px",
                  cursor: "pointer",
                }}
              >
                <option value="all">Tutti i tipi</option>
                <option value="wedding">Solo Matrimoni / Sposi</option>
                <option value="privato">Solo Eventi Privati</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700, color: "#8a847c" }}>
              Fase pratica / Stato
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                style={{
                  padding: "0.62rem 0.9rem",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  background: "#fff",
                  color: "#514d48",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  minWidth: "190px",
                  cursor: "pointer",
                }}
              >
                <option value="all">Tutte le Fasi</option>
                <option value="firmato">🟢 Contratti Firmati</option>
                <option value="opzione">⏳ Opzioni 7gg Attive</option>
                <option value="lead">🌿 Nuovi Lead & Visite</option>
                  <option value="openday">💍 Registrati Open Day</option>
                  <option value="svolto">🏛️ Eventi Svolti / Storico</option>
              </select>
            </label>
            <span
              style={{
                alignSelf: "flex-end",
                padding: "0.62rem 1rem",
                borderRadius: "8px",
                background: "#fff7ed",
                border: "1px solid #ffedd5",
                color: "#c2410c",
                fontSize: "0.9rem",
                whiteSpace: "nowrap",
              }}
            >
              Trovati: <strong>{filtered.length}</strong> {filtered.length === 1 ? "cliente" : "clienti"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => openModal()}
            style={{
              padding: "0.7rem 1.3rem",
              background: "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(229,140,44,0.3)",
            }}
          >
            ⚡ Nuovo Evento per Cliente Esistente
          </button>
        </div>
      </div>

      {/* Tabella Clienti */}
      <div className="premium-card" style={{ padding: "1rem", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e8e2d9", color: "#78716c", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <th style={{ padding: "0.8rem 0.7rem" }}>Cliente</th>
              <th style={{ padding: "0.8rem 0.7rem" }}>Contatti</th>
              <th style={{ padding: "0.8rem 0.7rem" }}>Eventi Agganciati</th>
              <th style={{ padding: "0.8rem 0.7rem", textAlign: "right" }}>Azione</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "2.5rem", textAlign: "center", color: "#94a3b8" }}>
                  Nessun cliente trovato con i criteri di ricerca.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f0eee9", verticalAlign: "top" }}>
                  <td style={{ padding: "0.9rem 0.7rem" }}>
                    <div>
                      <Link
                        href={`/admin/clienti/${c.id}`}
                        style={{
                          fontSize: "0.95rem",
                          color: "#1e1b18",
                          display: "inline-block",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                        title="Apri Scheda CRM 360°"
                      >
                        {c.nome} {c.cognome}
                        {c.partner ? (
                          <span style={{ color: "#c2410c", fontWeight: 700 }}> &amp; {c.partner}</span>
                        ) : null}
                      </Link>
                    </div>
                    <div style={{ display: "inline-flex", gap: "0.35rem", flexWrap: "nowrap", marginTop: "0.35rem", alignItems: "center" }}>
                      {c.tags.length === 0 ? (
                        <span style={{ fontSize: "0.72rem", color: "#a8a29e" }}>—</span>
                      ) : (
                        <>
                          {(c.tags.length > 2 ? c.tags.slice(0, 2) : c.tags).map((tag) => {
                            const s = TAG_STYLES[tag] || { bg: "#f5f5f4", color: "#57534e", border: "#e7e5e4" };
                            return (
                              <span
                                key={tag}
                                style={{
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "999px",
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
                          {c.tags.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setTagsCliente(c)}
                              title={`Altre etichette: ${c.tags.slice(2).join(", ")}`}
                              aria-label={`Mostra le altre ${c.tags.length - 2} etichette di ${c.nome} ${c.cognome}`}
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "0.15rem 0.5rem",
                                borderRadius: "999px",
                                background: "#f5f5f4",
                                color: "#57534e",
                                border: "1px solid #e7e5e4",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              +{c.tags.length - 2} altri
                            </button>
                          )}
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setTagsCliente(c)}
                        title="Modifica etichette"
                        aria-label={`Modifica etichette di ${c.nome} ${c.cognome}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0.1rem 0.4rem",
                          borderRadius: 999,
                          border: "1px solid #e8e2d9",
                          background: "#fff",
                          color: "#c2410c",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          lineHeight: 1.4,
                          flexShrink: 0,
                        }}
                      >
                        🏷️
                      </button>
                    </div>
                  </td>

                  <td style={{ padding: "0.9rem 0.7rem" }}>
                    <small style={{ display: "block", color: "#6a6764", fontSize: "0.78rem" }}>{c.email || "—"}</small>
                    {c.telefono ? (
                      <div style={{ marginTop: "0.2rem" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                          <a
                            href={`tel:${c.telefono}`}
                            style={{ fontSize: "0.78rem", color: "#514d48", fontWeight: 700, textDecoration: "none" }}
                          >
                            📞 {c.telefono}
                          </a>
                          <a
                            href={whatsappHref(c.telefono)}
                            target="_blank"
                            rel="noreferrer"
                            title={`Apri chat WhatsApp con ${c.nome}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              background: "#25D366",
                              color: "#ffffff",
                              textDecoration: "none",
                              boxShadow: "0 1px 3px rgba(37,211,102,0.35)",
                              flexShrink: 0,
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                          </a>
                        </div>
                        {c.hasSignedContract === true && (
                          <div style={{ marginTop: "0.28rem" }}>
                            <button
                              type="button"
                              onClick={() => openInvito(c)}
                              title={`Prepara l'invito WhatsApp a ${c.nome} per l'organizzazione delle nozze`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                padding: "0.22rem 0.6rem",
                                borderRadius: 999,
                                border: "none",
                                background: "#16a34a",
                                color: "#ffffff",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                boxShadow: "0 2px 5px rgba(22,163,74,0.22)",
                              }}
                            >
                              💬 Invito Nozze WA
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <small style={{ color: "#a8a29e" }}>Telefono non disponibile</small>
                    )}
                  </td>

                  <td style={{ padding: "0.9rem 0.7rem" }}>
                    <EventiCell eventi={c.eventi} />
                    {c.eventi && c.eventi.length > 0 && (
                      <div
                        style={{
                          marginTop: "0.28rem",
                          fontSize: "0.72rem",
                          color: "#78716c",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.1rem 0.45rem",
                            borderRadius: "999px",
                            background: "#fff7ed",
                            color: "#c2410c",
                            border: "1px solid #ffedd5",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                          }}
                        >
                          {c.eventiCount} {c.eventiCount === 1 ? "evento" : "eventi"}
                        </span>
                        <span>{getEventTypesSummary(c.eventi) || "Nessun dettaglio"}</span>
                      </div>
                    )}
                  </td>

                  <td style={{ padding: "0.9rem 0.7rem", textAlign: "right", whiteSpace: "nowrap" }}>
                    <Link
                      href={`/admin/clienti/${c.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.45rem 0.9rem",
                        background: "#fff7ed",
                        color: "#c2410c",
                        border: "1px solid #ffedd5",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                      title="Apri Scheda CRM 360°"
                    >
                      👤 Scheda CRM
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODALE NUOVO EVENTO */}
      {modalOpen && (
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
              background: "#ffffff",
              width: "100%",
              maxWidth: "560px",
              borderRadius: "16px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              padding: "2.2rem",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                position: "absolute",
                top: "1.2rem",
                right: "1.2rem",
                background: "#f0eee9",
                border: "none",
                fontSize: "1.1rem",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✕
            </button>

            <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700 }}>
              NUOVO EVENTO
            </span>
            <h2 style={{ margin: "0.3rem 0 1.4rem 0", color: "#514d48", fontSize: "1.6rem", fontFamily: "serif" }}>
              Crea evento per cliente esistente
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                Cliente
                <select
                  value={formClienteId}
                  onChange={(e) => setFormClienteId(e.target.value)}
                  required
                  style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", background: "#fff" }}
                >
                  <option value="">— Seleziona cliente —</option>
                  {clienti.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.cognome} {c.telefono ? `· ${c.telefono}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                  Tipo evento
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as "wedding" | "eventi")}
                    style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", background: "#fff" }}
                  >
                    <option value="wedding">Matrimonio (Wedding)</option>
                    <option value="eventi">Evento Privato</option>
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                  Data evento
                  <input
                    type="date"
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    required
                    style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem" }}
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                  Turno
                  <select
                    value={formTurno}
                    onChange={(e) => setFormTurno(e.target.value as "pranzo" | "cena")}
                    style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", background: "#fff" }}
                  >
                    <option value="pranzo">Pranzo (12:30)</option>
                    <option value="cena">Cena (19:30)</option>
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                  Formula
                  <select
                    value={formFormula}
                    onChange={(e) => setFormFormula(e.target.value as ClientiFormula)}
                    style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", background: "#fff" }}
                  >
                    <option value="esclusiva">Esclusiva Villa</option>
                    <option value="sala_bianca">Semi-esclusiva · Sala Bianca</option>
                    <option value="sala_tufo">Semi-esclusiva · Sala Tufo</option>
                  </select>
                </label>
              </div>

              {error && (
                <div style={{ color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "0.6rem 0.8rem", fontSize: "0.85rem", fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.4rem" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={pending}
                  style={{ flex: 1, padding: "0.85rem", borderRadius: "10px", border: "1px solid #ddd", background: "#fff", color: "#555", fontWeight: 600, cursor: pending ? "not-allowed" : "pointer" }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  style={{
                    flex: 2,
                    padding: "0.85rem",
                    borderRadius: "10px",
                    border: "none",
                    background: pending ? "#d6c3ac" : "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: pending ? "not-allowed" : "pointer",
                  }}
                >
                  {pending ? "Creazione in corso..." : "✍️ Crea Quote & Vai al Contratto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE INVITO ORGANIZZAZIONE NOZZE (solo clienti con contratto firmato) */}
      {invitoCliente && (() => {
        const evento = getEventoRiferimento(invitoCliente);
        const formulaEvento = evento ? String(evento.formula || "").trim() : "";
        const dettagliEvento = evento
          ? [formatLongDate(evento.data), formulaEvento].filter(Boolean).join(" · ")
          : "Data evento da definire";
        const telefonoValido = whatsappPhone(invitoCliente.telefono) !== "";

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invito-nozze-title"
            onClick={closeInvito}
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
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#FAF8F5",
                width: "100%",
                maxWidth: "620px",
                borderRadius: "16px",
                border: "1px solid #e8e2d9",
                boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                padding: "2.2rem",
                position: "relative",
              }}
            >
              <button
                type="button"
                onClick={closeInvito}
                aria-label="Chiudi la modale"
                style={{
                  position: "absolute",
                  top: "1.2rem",
                  right: "1.2rem",
                  background: "#f0eee9",
                  border: "none",
                  fontSize: "1.1rem",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontWeight: "bold",
                  color: "#514d48",
                }}
              >
                ✕
              </button>

              <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700 }}>
                INVITO ORGANIZZAZIONE NOZZE
              </span>
              <h2
                id="invito-nozze-title"
                style={{ margin: "0.3rem 0 0.8rem 0", color: "#514d48", fontSize: "1.5rem", fontFamily: "serif", paddingRight: "2.2rem" }}
              >
                💬 Invito Organizzazione Nozze — {nomeCoppia(invitoCliente)}
              </h2>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.85rem",
                  borderRadius: 999,
                  background: "#fff7ed",
                  border: "1px solid #ffedd5",
                  color: "#c2410c",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                }}
              >
                <span>📅</span>
                <span>{dettagliEvento}</span>
              </div>

              <label
                htmlFor="invito-nozze-testo"
                style={{ display: "block", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700, color: "#8a847c", marginBottom: "0.4rem" }}
              >
                Messaggio WhatsApp personalizzabile
              </label>
              <textarea
                id="invito-nozze-testo"
                value={invitoTesto}
                onChange={(e) => setInvitoTesto(e.target.value)}
                rows={9}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "0.85rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  background: "#ffffff",
                  color: "#2B2B2B",
                  fontSize: "0.9rem",
                  lineHeight: 1.55,
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />

              <p style={{ margin: "0.6rem 0 1.2rem 0", color: "#8a847c", fontSize: "0.76rem", lineHeight: 1.4 }}>
                Puoi modificare liberamente il testo prima dell&apos;invio: il messaggio verrà aperto in WhatsApp già compilato e potrai inviarlo tu.
              </p>

              {!telefonoValido && (
                <div style={{ color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "0.6rem 0.8rem", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.8rem" }}>
                  Telefono non disponibile: impossibile aprire WhatsApp per questo cliente.
                </div>
              )}

              <div style={{ display: "flex", gap: "0.8rem" }}>
                <button
                  type="button"
                  onClick={closeInvito}
                  style={{
                    flex: 1,
                    padding: "0.85rem",
                    borderRadius: "10px",
                    border: "1px solid #ddd",
                    background: "#ffffff",
                    color: "#555",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Chiudi / Annulla
                </button>
                <button
                  type="button"
                  onClick={handleInvioInvito}
                  disabled={!telefonoValido || invitoTesto.trim() === ""}
                  style={{
                    flex: 2,
                    padding: "0.85rem",
                    borderRadius: "10px",
                    border: "none",
                    background: !telefonoValido || invitoTesto.trim() === "" ? "#b9c9b6" : "linear-gradient(135deg, #16a34a 0%, #12813c 100%)",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: !telefonoValido || invitoTesto.trim() === "" ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(22,163,74,0.25)",
                  }}
                >
                  🚀 Apri in WhatsApp e Invia
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODALE MODIFICA ETICHETTE */}
      {tagsCliente && (
        <TagEditorModal
          clientId={tagsCliente.id}
          clientName={`${tagsCliente.nome} ${tagsCliente.cognome}`.trim()}
          initialTags={tagsCliente.tags}
          onClose={() => setTagsCliente(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
