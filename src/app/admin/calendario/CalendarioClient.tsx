"use client";

import React, { useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { PendingContractLocal, QuickCalendarOptionLocal } from "@/lib/localDb";
import { normalizeTipoEsclusiva, isTufoSide, SEMI_ESCLUSIVA_FORMULE } from "@/lib/contractMeta";
import {
  saveQuickCalendarOptionAction,
  releaseQuickCalendarOptionAction,
} from "@/app/admin/calendario/calendarioActions";

interface CalendarioClientProps {
  quotes: any[];
  signedPdfs: any[];
  pendingContracts?: PendingContractLocal[];
  quickOptions?: QuickCalendarOptionLocal[];
}

type OptionFormula = "esclusiva" | "sala_bianca" | "sala_tufo";

/** Evento normalizzato usato dal calendario: unifica firmati, opzioni 7gg e visite. */
interface CalendarEvent {
  id: string;
  title: string;
  clientName: string;
  tipo: string; // wedding, privato, visita
  status: string; // firmato, opzione, visita
  data: string;
  ora: string;
  turno: string; // pranzo, cena, mattina, pomeriggio
  invitati: number;
  importo: number;
  sala: string; // esclusiva_villa, sala_bianca, sala_tufo
  note: string;
  // Ciclo di vita reale
  isSigned?: boolean;
  isPending?: boolean;
  tipoEsclusiva?: "esclusiva" | "semi_esclusiva";
  spaziRiservati?: string[];
  signedPdfUrl?: string | null;
  contractUrl?: string;
  absoluteUrl?: string;
  whatsappText?: string;
  preventivo?: string;
  scadenza?: string;
  giorniRimanenti?: number;
  scaduta?: boolean;
  pending?: PendingContractLocal;
  // Opzione veloce 7gg da calendario (senza prezzo)
  isQuickOption?: boolean;
  quoteId?: string;
  telefono?: string;
  email?: string;
  formulaOpzione?: OptionFormula;
}

const COLOR_SIGNED_SEMI = "#15803d"; // verde — semi-esclusiva confermata
const COLOR_PENDING = "#e58c2c"; // ambra
const COLOR_PENDING_DARK = "#d97706";

const OPTION_STATUSES = ["opzione", "opzionato", "convertito"];

/* ------------------------------------------------------------------ */
/* Palette "colpo d'occhio" (allineata alla legenda richiesta)         */
/* ------------------------------------------------------------------ */
const GREEN_BG = "#dcfce7";
const GREEN_BORDER = "#86efac";
const GREEN_TEXT = "#166534";
const AMBER_BG = "#fef3c7";
const AMBER_BORDER = "#fcd34d";
const AMBER_TEXT = "#92400e";
const RED_BG = "#fee2e2";
const RED_BORDER = "#fca5a5";
const RED_TEXT = "#991b1b";
const GOLD_BG = "#fff7ed";
const GOLD_BORDER = "#c9a24b";
const GOLD_TEXT = "#7c3f08";

/* ------------------------------------------------------------------ */
/* Tipi di supporto per il "colpo d'occhio"                            */
/* ------------------------------------------------------------------ */
type ViewMode = "griglia" | "matrice";
type MacroSpace = "bianca" | "tufo";
type OccupantTone = "free" | "option" | "signed";

interface SpaceSlot {
  occupant: CalendarEvent | null;
  tone: OccupantTone;
}

interface TurnoPlan {
  bianca: SpaceSlot;
  tufo: SpaceSlot;
}

interface DayPlan {
  iso: string;
  isWeekend: boolean;
  exclusive: CalendarEvent | null;
  pranzo: TurnoPlan;
  cena: TurnoPlan;
  /** Eventi "di contorno" (visits, turni mattina/pomeriggio). */
  visits: CalendarEvent[];
  /** True se la giornata contiene almeno una prenotazione (opzione o firmata). */
  hasAnyBooking: boolean;
}

const EMPTY_SLOT: SpaceSlot = { occupant: null, tone: "free" };

/* ------------------------------------------------------------------ */
/* Stili statici (evitano ricostruzioni inutili ad ogni render)        */
/* ------------------------------------------------------------------ */
const BAND_WRAP: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "3px",
  padding: "4px 5px",
  borderRadius: "9px",
  background: "#fbfaf7",
  border: "1px solid #f0ece4",
};
const BAND_LABEL: CSSProperties = {
  fontSize: "0.6rem",
  fontWeight: 800,
  letterSpacing: "0.5px",
  color: "#8c857b",
};
const FREE_BADGE: CSSProperties = {
  fontSize: "0.63rem",
  fontWeight: 800,
  color: GREEN_TEXT,
  background: GREEN_BG,
  border: `1px solid ${GREEN_BORDER}`,
  borderRadius: "999px",
  padding: "2px 7px",
  whiteSpace: "nowrap",
};
const FREE_MINI: CSSProperties = {
  fontSize: "0.63rem",
  fontWeight: 700,
  color: GREEN_TEXT,
  whiteSpace: "nowrap",
};
const SIGNED_MINI: CSSProperties = {
  fontSize: "0.63rem",
  fontWeight: 800,
  color: RED_TEXT,
  background: RED_BG,
  border: `1px solid ${RED_BORDER}`,
  borderRadius: "7px",
  padding: "2px 6px",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
};
const OPTION_MINI: CSSProperties = {
  ...SIGNED_MINI,
  color: AMBER_TEXT,
  background: AMBER_BG,
  border: `1px solid ${AMBER_BORDER}`,
};
const EXCLUSIVE_BANNER: CSSProperties = {
  background: "linear-gradient(135deg, #7c3f08 0%, #5a2d06 100%)",
  color: "#ffe9c7",
  borderRadius: "9px",
  padding: "6px 8px",
  fontWeight: 800,
  fontSize: "0.72rem",
  textAlign: "center",
  letterSpacing: "0.3px",
};
const LOCKED_BADGE: CSSProperties = {
  fontSize: "0.63rem",
  fontWeight: 700,
  color: GOLD_TEXT,
  background: GOLD_BG,
  border: "1px dashed #c9a24b",
  borderRadius: "6px",
  padding: "2px 6px",
  whiteSpace: "nowrap",
};
const VISIT_CHIP: CSSProperties = {
  fontSize: "0.64rem",
  fontWeight: 700,
  color: "#0369a1",
  background: "#f0f9ff",
  border: "1px dashed #0284c7",
  borderRadius: "7px",
  padding: "2px 6px",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
};
const MATRIX_TH: CSSProperties = {
  padding: "0.7rem 0.6rem",
  fontSize: "0.7rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.4px",
  color: "#78716c",
  textAlign: "center",
  background: "#faf7f2",
  borderBottom: `2px solid ${GOLD_BORDER}`,
  whiteSpace: "nowrap",
};
const MATRIX_TD: CSSProperties = {
  padding: "0.45rem 0.5rem",
  verticalAlign: "middle",
  minWidth: "150px",
  borderBottom: "1px solid #f0ece4",
  textAlign: "center",
};
const MATRIX_DAY_TD: CSSProperties = {
  padding: "0.45rem 0.7rem",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  borderBottom: "1px solid #f0ece4",
  textAlign: "left",
};
const MATRIX_OCC_BTN: CSSProperties = {
  display: "block",
  width: "100%",
  background: "transparent",
  border: "none",
  padding: 0,
  margin: "1px 0",
  fontFamily: "inherit",
  fontSize: "0.72rem",
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const LEGEND_ITEMS: Array<{ dot: string; label: string }> = [
  { dot: GREEN_BG, label: "Verde = Spazio Disponibile / Prenotabile" },
  { dot: AMBER_BG, label: "Ambra = Opzione 7 Giorni in attesa di firma" },
  { dot: RED_BG, label: "Rosso = Contratto Firmato / Data Bloccata" },
  { dot: "#e6c976", label: "Oro = Esclusiva Intera Tenuta" },
];

/** "Sposo & Sposa" per i matrimoni, solo il cliente per gli eventi. */
function getIntestatari(c: PendingContractLocal): string {
  const cliente = c.cliente || {};
  const primary = [cliente.nome, cliente.cognome].filter(Boolean).join(" ").trim();
  const partner = [cliente.sposera_nome, cliente.sposera_cognome].filter(Boolean).join(" ").trim();
  if (primary && partner) return `${primary} & ${partner}`;
  return primary || c.intestatari || "Cliente";
}

function formatDateOnly(value?: string | null): string {
  if (!value) return "";
  const iso = String(value).slice(0, 10);
  try {
    return format(parseISO(iso), "dd/MM/yyyy");
  } catch {
    return iso;
  }
}

function resolveSala(
  tipoEsclusiva: "esclusiva" | "semi_esclusiva",
  spazi: string[]
): string {
  if (tipoEsclusiva === "esclusiva") return "esclusiva_villa";
  if (spazi.some((s) => isTufoSide(String(s)))) return "sala_tufo";
  return "sala_bianca";
}

/** Etichetta "colpo d'occhio" di un'opzione attiva con countdown. */
function optionStatusLabel(evt: CalendarEvent): string {
  if (evt.scaduta) return "⚠️ OPZIONE SCADUTA";
  const giorni = Math.max(0, Number(evt.giorniRimanenti ?? 0));
  return `🟡 OPZIONE ATTIVA (mancano ${giorni} gg)`;
}

const OPTION_FORMULA_LABEL: Record<OptionFormula, string> = {
  esclusiva: "Esclusiva Villa",
  sala_bianca: SEMI_ESCLUSIVA_FORMULE.sala_bianca.label,
  sala_tufo: SEMI_ESCLUSIVA_FORMULE.sala_tufo.label,
};

function quickOptionToEvent(o: QuickCalendarOptionLocal): CalendarEvent {
  const tipoEsclusiva = normalizeTipoEsclusiva(o.tipo_esclusiva);
  const formula: OptionFormula =
    o.formula === "sala_tufo" ? "sala_tufo" : o.formula === "sala_bianca" ? "sala_bianca" : "esclusiva";
  return {
    id: `quick-${o.quoteId}`,
    title: `Opzione Rapida ${o.nome}`,
    clientName: o.nome,
    tipo: "wedding",
    status: "opzione",
    data: o.data_evento,
    ora: o.turno === "cena" ? "19:00" : "12:00",
    turno: o.turno,
    invitati: 0,
    importo: 0,
    sala: resolveSala(tipoEsclusiva, o.spazi),
    note: o.note,
    isPending: true,
    isQuickOption: true,
    quoteId: o.quoteId,
    telefono: o.telefono,
    email: o.email,
    formulaOpzione: formula,
    tipoEsclusiva,
    spaziRiservati: o.spazi,
    scadenza: o.scadenza,
    giorniRimanenti: o.giorniRimanenti,
    scaduta: o.scaduta,
  };
}

/** Link `/admin/contratti` precompilato per formalizzare un'opzione rapida con 1 click. */
function buildContractFromOptionHref(evt: CalendarEvent): string {
  const params = new URLSearchParams();
  params.set("nome", evt.clientName || "");
  params.set("telefono", evt.telefono || "");
  if (evt.email) params.set("email", evt.email);
  params.set("data", evt.data);
  params.set("turno", evt.turno === "cena" ? "cena" : "pranzo");
  params.set("tipo_esclusiva", evt.tipoEsclusiva === "esclusiva" ? "esclusiva" : "semi_esclusiva");
  if (evt.formulaOpzione && evt.formulaOpzione !== "esclusiva") params.set("formula", evt.formulaOpzione);
  if (evt.quoteId) params.set("opzione", evt.quoteId);
  return `/admin/contratti?${params.toString()}`;
}

function matchSignedPdf(signedPdfs: any[], quote: any): string | null {
  const nome = String(quote?.clients?.nome || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const cognome = String(quote?.clients?.cognome || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const found = (signedPdfs || []).find((pdf) => {
    const key = String(pdf?.key || pdf?.url || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return (nome && key.includes(nome)) || (cognome && key.includes(cognome));
  });
  return found?.url || quote?.signed_contract?.pdf_url || null;
}

/** Fallback dimostrativo: riancorato al mese corrente così resta visibile. */
const DEMO_EVENT_TEMPLATES = [
  {
    id: "demo-mario-elena",
    title: "Matrimonio Mario Pepe & Elena",
    clientName: "Mario Pepe & Elena",
    tipo: "wedding",
    status: "firmato",
    ora: "11:30",
    turno: "pranzo",
    invitati: 120,
    importo: 15330,
    sala: "esclusiva_villa",
    note: "Rito Simbolico in Giardino delle Promesse + Banchetto in Sala Bianca & After Party in Sala Tufo."
  },
  {
    id: "demo-giuseppe-maria",
    title: "Matrimonio Giuseppe & Maria",
    clientName: "Giuseppe Rossi & Maria",
    tipo: "wedding",
    status: "firmato",
    ora: "12:00",
    turno: "pranzo",
    invitati: 150,
    importo: 18500,
    sala: "sala_bianca",
    note: "Contratto firmato. Acconto caparra €5.550 versato."
  },
  {
    id: "demo-battesimo-luca",
    title: "Battesimo Luca Esposito",
    clientName: "Antonio Esposito",
    tipo: "privato",
    status: "firmato",
    ora: "16:00",
    turno: "cena",
    invitati: 65,
    importo: 4800,
    sala: "sala_tufo",
    note: "Festa in semi-esclusiva in Sala Tufo e giardino antistante."
  },
  {
    id: "demo-opzione-7gg",
    title: "Opzione Matrimonio De Luca & Russo",
    clientName: "De Luca & Russo",
    tipo: "wedding",
    status: "opzione",
    ora: "12:00",
    turno: "pranzo",
    invitati: 90,
    importo: 12000,
    sala: "sala_bianca",
    note: "Opzione 7 giorni attiva in attesa di firma."
  },
  {
    id: "demo-visita-1",
    title: "Visita Accoglienza Sposi (Segreteria)",
    clientName: "Coppia Ferrara & Capri",
    tipo: "visita",
    status: "visita",
    ora: "11:00",
    turno: "mattina",
    invitati: 2,
    importo: 0,
    sala: "giardino_agrumeto",
    note: "Prima visita guidata con la segreteria (Project Builder su Tablet)."
  }
];

function buildDemoEvents(reference: Date): CalendarEvent[] {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const daySlots = [4, 9, 15, 21, 27];
  return DEMO_EVENT_TEMPLATES.map((t, index) => {
    const day = daySlots[index % daySlots.length];
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const tipoEsclusiva: "esclusiva" | "semi_esclusiva" =
      t.sala === "esclusiva_villa" ? "esclusiva" : "semi_esclusiva";
    return {
      ...t,
      data: iso,
      isSigned: t.status === "firmato",
      isPending: t.status === "opzione",
      tipoEsclusiva,
      spaziRiservati: [],
      giorniRimanenti: t.status === "opzione" ? 5 : undefined,
      scaduta: false,
      signedPdfUrl: null,
    } as CalendarEvent;
  });
}

function buildEvents(
  quotes: any[],
  signedPdfs: any[],
  pendingContracts: PendingContractLocal[],
  reference: Date,
  quickOptions: QuickCalendarOptionLocal[] = []
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const handledQuoteIds = new Set<string>();

  // --- Opzioni veloci 7gg da calendario ---
  (quickOptions || []).forEach((o) => {
    if (!o || !o.data_evento) return;
    handledQuoteIds.add(String(o.quoteId).toLowerCase());
    events.push(quickOptionToEvent(o));
  });

  // --- Opzioni / contratti in attesa (pendingContracts) ---
  (pendingContracts || []).forEach((c) => {
    if (!c || !c.data_evento) return;
    const intestatari = getIntestatari(c);
    const tipoEsclusiva = normalizeTipoEsclusiva(
      c.opzione?.tipo || c.quote?.tipo_esclusiva
    );
    const spazi: string[] = Array.isArray(c.opzione?.spazi)
      ? c.opzione.spazi
      : Array.isArray(c.quote?.spazi_riservati)
        ? c.quote.spazi_riservati
        : [];
    const turno = c.quote?.turno || c.opzione?.turno || "pranzo";
    const isWedding = c.tipoEvento === "wedding";

    handledQuoteIds.add(String(c.quoteId).toLowerCase());
    events.push({
      id: `pending-${c.quoteId}`,
      title: `Opzione ${isWedding ? "Matrimonio" : "Evento Privato"} ${intestatari}`,
      clientName: intestatari,
      tipo: isWedding ? "wedding" : "privato",
      status: "opzione",
      data: String(c.data_evento).slice(0, 10),
      ora: turno === "cena" ? "19:00" : "12:00",
      turno,
      invitati: Number(c.quote?.numero_ospiti || 0),
      importo: Number(c.prezzo || 0),
      sala: resolveSala(tipoEsclusiva, spazi),
      note: `Preventivo ${c.preventivo} in attesa di firma (opzione 7 giorni).`,
      isPending: true,
      tipoEsclusiva,
      spaziRiservati: spazi,
      contractUrl: c.url,
      absoluteUrl: c.absoluteUrl,
      whatsappText: c.whatsappText,
      preventivo: c.preventivo,
      scadenza: c.scadenza,
      giorniRimanenti: c.giorniRimanenti,
      scaduta: c.scaduta,
      pending: c,
    });
  });

  // --- Contratti firmati / opzioni provenienti dalle quote ---
  (quotes || []).forEach((q) => {
    if (!q || !q.data_evento || !q.id) return;
    const id = String(q.id).toLowerCase();
    if (handledQuoteIds.has(id)) return;

    const isSigned = q.status === "firmato";
    const isOption = !isSigned && OPTION_STATUSES.includes(String(q.status || "").toLowerCase());
    if (!isSigned && !isOption) return; // non è ancora una prenotazione reale

    const intestatari =
      [q.clients?.nome, q.clients?.cognome].filter(Boolean).join(" ").trim() || "Cliente";
    const partner = [q.clients?.sposera_nome, q.clients?.sposera_cognome]
      .filter(Boolean)
      .join(" ")
      .trim();
    const clientName = partner ? `${intestatari} & ${partner}` : intestatari;

    const tipoEsclusiva = normalizeTipoEsclusiva(
      q.tipo_esclusiva || q.opzione?.tipo || (q.tipo_evento === "wedding" ? "esclusiva" : "semi_esclusiva")
    );
    const spazi: string[] = Array.isArray(q.spazi_riservati)
      ? q.spazi_riservati
      : Array.isArray(q.opzione?.spazi)
        ? q.opzione.spazi
        : [];
    const turno = q.turno || q.opzione?.turno || "pranzo";
    const isWedding = q.tipo_evento === "wedding";

    events.push({
      id: String(q.id),
      title: `${isWedding ? "Matrimonio" : "Evento Privato"} ${clientName}`,
      clientName,
      tipo: isWedding ? "wedding" : "privato",
      status: isSigned ? "firmato" : "opzione",
      data: String(q.data_evento).slice(0, 10),
      ora: turno === "cena" ? "19:00" : "12:00",
      turno,
      invitati: Number(q.numero_ospiti || 0),
      importo: Number(q.totale_calcolato ?? q.prezzo ?? q.totale ?? 0),
      sala: resolveSala(tipoEsclusiva, spazi),
      note: q.note_visita_segreteria || `Preventivo ${q.status || ""}`,
      isSigned,
      isPending: false,
      tipoEsclusiva,
      spaziRiservati: spazi,
      signedPdfUrl: isSigned ? matchSignedPdf(signedPdfs, q) : null,
    });
  });

  // Fallback dimostrativo solo se non esiste alcun dato reale.
  if (events.length === 0) {
    return buildDemoEvents(reference);
  }

  return events;
}

/* ------------------------------------------------------------------ */
/* Logica "colpo d'occhio": occupazione macro-spazi per turno          */
/* ------------------------------------------------------------------ */

/** L'evento occupa l'intera tenuta (esclusiva) per tutta la giornata. */
function isExclusiveEvent(evt: CalendarEvent): boolean {
  return evt.tipoEsclusiva === "esclusiva" || evt.sala === "esclusiva_villa";
}

function isSignedEvent(evt: CalendarEvent): boolean {
  return Boolean(evt.isSigned || evt.status === "firmato");
}

/** Verifica se l'evento riserva il macro-spazio richiesto (Bianca/Giardini o Tufo/Parco). */
function eventCoversMacro(evt: CalendarEvent, macro: MacroSpace): boolean {
  const spazi = (evt.spaziRiservati || []).map((s) => String(s));
  const tufo =
    evt.sala === "sala_tufo" || spazi.some((s) => isTufoSide(s));
  const bianca =
    evt.sala === "sala_bianca" ||
    evt.sala === "giardino_agrumeto" ||
    spazi.some((s) => !isTufoSide(s));

  if (macro === "tufo") return tufo;
  // Macro "Bianca & Giardini": tutti gli spazi non-Tufo; un evento Tufo-only non la occupa.
  if (evt.sala === "sala_tufo" && !bianca) return false;
  return bianca || !tufo;
}

/** Un evento occupa un turno? (Pranzo/Cena; turni vuoti o ignoti => pranzo.) */
function eventMatchesTurno(evt: CalendarEvent, turno: "pranzo" | "cena"): boolean {
  const raw = String(evt.turno || "pranzo").toLowerCase();
  return raw === turno;
}

function buildDayPlan(day: Date, events: CalendarEvent[]): DayPlan {
  const dayEvents = events.filter((e) => {
    if (!e.data) return false;
    try {
      return isSameDay(parseISO(e.data), day);
    } catch {
      return false;
    }
  });

  const exclusive = dayEvents.find(isExclusiveEvent) || null;
  const visits = dayEvents.filter((e) => e.tipo === "visita");
  const bookingEvents = dayEvents.filter((e) => !isExclusiveEvent(e) && e.tipo !== "visita");

  const slotFor = (turno: "pranzo" | "cena", macro: MacroSpace): SpaceSlot => {
    const match = bookingEvents.find(
      (e) => eventMatchesTurno(e, turno) && eventCoversMacro(e, macro)
    );
    if (!match) return EMPTY_SLOT;
    return { occupant: match, tone: isSignedEvent(match) ? "signed" : "option" };
  };

  return {
    iso: format(day, "yyyy-MM-dd"),
    isWeekend: day.getDay() === 0 || day.getDay() === 6,
    exclusive,
    pranzo: { bianca: slotFor("pranzo", "bianca"), tufo: slotFor("pranzo", "tufo") },
    cena: { bianca: slotFor("cena", "bianca"), tufo: slotFor("cena", "tufo") },
    visits,
    hasAnyBooking: Boolean(exclusive) || bookingEvents.length > 0,
  };
}

/* ------------------------------------------------------------------ */
/* Componenti presentazionali riutilizzabili                           */
/* ------------------------------------------------------------------ */

const BLOCK_LINK_BASE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "2px",
  fontWeight: 800,
  color: "#b45f0c",
  background: GOLD_BG,
  border: `1px solid ${AMBER_BORDER}`,
  borderRadius: "999px",
  textDecoration: "none",
  whiteSpace: "nowrap",
};

/** Slot libero selezionato dal calendario, in attesa della scelta contratto / opzione rapida. */
interface SlotChoice {
  iso: string;
  turno?: "pranzo" | "cena";
  exclusive: boolean;
  formula: OptionFormula;
}

/** Pulsante rapido per bloccare una data/turno dal calendario (apre la scelta contratto / opzione). */
function BloccaLink({
  iso,
  turno,
  exclusive = false,
  compact = false,
  formula,
  onChoose,
}: {
  iso: string;
  turno?: "pranzo" | "cena";
  exclusive?: boolean;
  compact?: boolean;
  formula?: OptionFormula;
  onChoose: (slot: SlotChoice) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChoose({ iso, turno, exclusive, formula: formula ?? (exclusive ? "esclusiva" : "sala_bianca") })
      }
      style={{
        ...BLOCK_LINK_BASE,
        fontFamily: "inherit",
        cursor: "pointer",
        fontSize: compact ? "0.6rem" : "0.72rem",
        padding: compact ? "1px 6px" : "3px 9px",
      }}
    >
      ＋ Blocca
    </button>
  );
}

const MODAL_OVERLAY: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(30,27,24,0.55)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1100,
  padding: "1.2rem",
};

const MODAL_INPUT: CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.75rem",
  borderRadius: "10px",
  border: "1px solid #e2d7c7",
  background: "#fdfbf7",
  color: "#1e1b18",
  fontWeight: 600,
  fontFamily: "inherit",
  fontSize: "0.92rem",
  outline: "none",
  boxSizing: "border-box",
};

const MODAL_LABEL: CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 800,
  color: "#78716c",
  display: "block",
  marginBottom: "0.3rem",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

function ChoiceChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        flex: "1 1 0",
        padding: "0.55rem 0.7rem",
        borderRadius: "10px",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "0.84rem",
        fontWeight: 700,
        textAlign: "center",
        border: `1.5px solid ${active ? COLOR_PENDING : "#e2d7c7"}`,
        background: active ? "#fff7ed" : "#ffffff",
        color: active ? "#b45f0c" : "#544e45",
        boxShadow: active ? "0 3px 10px rgba(229,140,44,0.18)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function ViewTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.45rem",
        padding: "0.65rem 1.1rem",
        borderRadius: "12px",
        border: active ? `2px solid ${AMBER_BG}` : "1px solid #e8e2d9",
        background: active
          ? `linear-gradient(135deg, ${COLOR_PENDING} 0%, ${COLOR_PENDING_DARK} 100%)`
          : "#fdfbf7",
        color: active ? "#ffffff" : "#544e45",
        fontFamily: "inherit",
        fontWeight: 800,
        fontSize: "0.85rem",
        cursor: "pointer",
        boxShadow: active ? "0 6px 16px rgba(229,140,44,0.28)" : "none",
        transition: "all 0.18s ease",
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden style={{ fontSize: "1rem" }}>
        {icon}
      </span>
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Componente principale                                               */
/* ------------------------------------------------------------------ */

export default function CalendarioClient({
  quotes,
  signedPdfs,
  pendingContracts = [],
  quickOptions = [],
}: CalendarioClientProps) {
  const router = useRouter();
  // Mese corrente reale (non più Gennaio 2027 hardcoded).
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("griglia");
  const [activeFilter, setActiveFilter] = useState<string>("tutti");
  const [eventsList, setEventsList] = useState<CalendarEvent[]>(() =>
    buildEvents(quotes, signedPdfs, pendingContracts, new Date(), quickOptions)
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editForm, setEditForm] = useState<CalendarEvent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Opzione rapida 7gg: scelta slot, modale compatto e feedback
  const [slotChoice, setSlotChoice] = useState<SlotChoice | null>(null);
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [optNome, setOptNome] = useState("");
  const [optTelefono, setOptTelefono] = useState("");
  const [optEmail, setOptEmail] = useState("");
  const [optData, setOptData] = useState("");
  const [optTurno, setOptTurno] = useState<"pranzo" | "cena">("pranzo");
  const [optFormula, setOptFormula] = useState<OptionFormula>("esclusiva");
  const [optNote, setOptNote] = useState("");
  const [optSaving, setOptSaving] = useState(false);
  const [optError, setOptError] = useState("");
  const [toast, setToast] = useState("");

  const openOptionModal = (preset?: { iso?: string; turno?: "pranzo" | "cena"; formula?: OptionFormula }) => {
    setOptNome("");
    setOptTelefono("");
    setOptEmail("");
    setOptData(preset?.iso ?? "");
    setOptTurno(preset?.turno ?? "pranzo");
    setOptFormula(preset?.formula ?? "esclusiva");
    setOptNote("");
    setOptError("");
    setSlotChoice(null);
    setOptionModalOpen(true);
  };

  const handleChooseSlot = (slot: SlotChoice) => setSlotChoice(slot);

  const handleChooseContract = (slot: SlotChoice) => {
    const params = [`data=${slot.iso}`];
    if (slot.turno) params.push(`turno=${slot.turno}`);
    if (slot.exclusive) params.push("tipo_esclusiva=esclusiva");
    setSlotChoice(null);
    router.push(`/admin/contratti?${params.join("&")}`);
  };

  const handleSaveQuickOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (optSaving) return;
    if (!optNome.trim()) return setOptError("Inserisci il nome del cliente o degli sposi.");
    if (!optTelefono.trim()) return setOptError("Il telefono è obbligatorio.");
    if (!optData) return setOptError("Seleziona la data dell'evento.");

    setOptError("");
    setOptSaving(true);
    try {
      const res = await saveQuickCalendarOptionAction({
        nome: optNome.trim(),
        telefono: optTelefono.trim(),
        email: optEmail.trim() || undefined,
        dataEvento: optData,
        turno: optTurno,
        formula: optFormula,
        note: optNote.trim() || undefined,
      });
      if (!res.success) {
        setOptError(res.error || "Impossibile fissare l'opzione. Riprova.");
        return;
      }
      if (res.option) {
        const newEvent = quickOptionToEvent(res.option);
        setEventsList((prev) => [...prev.filter((ev) => !ev.id.startsWith("demo-")), newEvent]);
        const [y, m] = res.option.data_evento.split("-").map(Number);
        if (y && m) setCurrentMonth(new Date(y, m - 1, 1));
      }
      setOptionModalOpen(false);
      setToast(`Opzione fissata per 7 giorni: ${optNome.trim()}`);
      window.setTimeout(() => setToast(""), 4000);
    } catch (err) {
      console.error("Errore salvataggio opzione rapida:", err);
      setOptError("Errore di connessione. Riprova tra qualche istante.");
    } finally {
      setOptSaving(false);
    }
  };

  const handleReleaseQuickOption = async (evt: CalendarEvent) => {
    if (!evt.quoteId) return;
    if (!window.confirm(`Rilasciare l'opzione di ${evt.clientName}? Lo slot tornerà libero.`)) return;
    const res = await releaseQuickCalendarOptionAction(evt.quoteId);
    if (!res.success) {
      window.alert("Impossibile rilasciare l'opzione.");
      return;
    }
    setEventsList((prev) => prev.filter((ev) => ev.id !== evt.id));
    setSelectedEvent(null);
    setEditForm(null);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Piano "colpo d'occhio" per ogni giorno (disponibilità sempre veritiera,
  // indipendente dal filtro attivo che agisce solo sui dettagli).
  const dayPlans = days.map((day) => ({ day, plan: buildDayPlan(day, eventsList) }));

  // --- Statistiche / KPI ---
  const totalWeddings = eventsList.filter(e => e.tipo === "wedding" && e.status === "firmato").length;
  const totalPrivate = eventsList.filter(e => e.tipo === "privato" && e.status === "firmato").length;
  const totalVisits = eventsList.filter(e => e.tipo === "visita").length;
  const totalExclusives = eventsList.filter(
    e => e.status === "firmato" && (e.tipoEsclusiva === "esclusiva" || e.sala === "esclusiva_villa")
  ).length;
  const totalPendingActive = eventsList.filter(e => e.isPending && !e.scaduta).length;

  /** Tutti gli eventi del giorno, indipendentemente dal filtro attivo. */
  const getEventsForDayRaw = (day: Date) => {
    return eventsList.filter(e => {
      if (!e.data) return false;
      try {
        return isSameDay(parseISO(e.data), day);
      } catch {
        return false;
      }
    });
  };

  const getEventsForDay = (day: Date) => {
    const base = getEventsForDayRaw(day);
    if (activeFilter === "tutti") return base;

    return base.filter(e => {
      if (activeFilter === "wedding") return e.tipo === "wedding";
      if (activeFilter === "privato") return e.tipo === "privato";
      if (activeFilter === "visita") return e.tipo === "visita";
      if (activeFilter === "esclusiva") {
        return e.tipoEsclusiva === "esclusiva" || e.sala === "esclusiva_villa";
      }
      if (activeFilter === "opzione") return Boolean(e.isPending || e.status === "opzione");
      return true;
    });
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleOpenEdit = (evt: CalendarEvent) => {
    setSelectedEvent(evt);
    setEditForm({ ...evt });
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    setEventsList(prev => prev.map(e => e.id === editForm.id ? editForm : e));
    setSelectedEvent(null);
    setEditForm(null);
  };

  const handleCopyLink = async (evt: CalendarEvent) => {
    const link = evt.absoluteUrl || evt.contractUrl || "";
    if (!link) {
      window.alert("Link contratto non disponibile per questo evento.");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(evt.id);
      window.setTimeout(() => {
        setCopiedId(current => (current === evt.id ? null : current));
      }, 2000);
    } catch (err) {
      console.error("Impossibile copiare il link del contratto:", err);
      window.alert("Impossibile copiare il link. Copialo manualmente:\n" + link);
    }
  };

  /* ------------------ Render: pill macro-spazio (Tab 1) ------------------ */
  const renderSpacePill = (plan: DayPlan, slot: SpaceSlot, macro: MacroSpace, turno: "pranzo" | "cena") => {
    const macroLabel = macro === "bianca" ? "Bianca" : "Tufo";
    if (!slot.occupant) {
      return (
        <span key={`${plan.iso}-${turno}-${macro}-free`} style={FREE_MINI}>
          🏛️ {macroLabel}: 🟢 Libera
        </span>
      );
    }
    const occ = slot.occupant;
    const isOption = slot.tone === "option";

    if (isOption && occ.isQuickOption) {
      return (
        <button
          key={`${plan.iso}-${turno}-${macro}-occ`}
          type="button"
          onClick={() => handleOpenEdit(occ)}
          title={`${optionStatusLabel(occ)} · ${occ.clientName}${occ.telefono ? ` · ${occ.telefono}` : ""}`}
          style={{ ...OPTION_MINI, whiteSpace: "normal", lineHeight: 1.3 }}
        >
          {optionStatusLabel(occ)}
          <br />
          {occ.clientName}
          {occ.telefono ? ` · 📞 ${occ.telefono}` : ""}
        </button>
      );
    }

    const giorni =
      isOption && typeof occ.giorniRimanenti === "number"
        ? occ.scaduta
          ? " · ⚠️ scaduta"
          : ` · ${occ.giorniRimanenti}gg`
        : "";
    return (
      <button
        key={`${plan.iso}-${turno}-${macro}-occ`}
        type="button"
        onClick={() => handleOpenEdit(occ)}
        title={`${macroLabel}: ${occ.clientName}`}
        style={isOption ? OPTION_MINI : SIGNED_MINI}
      >
        🏛️ {macroLabel}: {occ.clientName}
        {giorni}
      </button>
    );
  };

  /* ------------------ Render: fascia turno (Tab 1) ------------------ */
  const renderBand = (plan: DayPlan, turno: "pranzo" | "cena", label: string, slot: TurnoPlan) => {
    const allFree = !slot.bianca.occupant && !slot.tufo.occupant;
    return (
      <div style={BAND_WRAP}>
        <div style={BAND_LABEL}>{label}</div>
        {plan.exclusive ? (
          <span style={LOCKED_BADGE}>🔒 Turno Riservato</span>
        ) : allFree ? (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px" }}>
            <span style={FREE_BADGE}>🟢 Libera (Tufo &amp; Bianca)</span>
            <BloccaLink iso={plan.iso} turno={turno} compact onChoose={handleChooseSlot} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "flex-start" }}>
            {renderSpacePill(plan, slot.bianca, "bianca", turno)}
            {renderSpacePill(plan, slot.tufo, "tufo", turno)}
            {(!slot.bianca.occupant || !slot.tufo.occupant) && (
              <BloccaLink
                iso={plan.iso}
                turno={turno}
                compact
                formula={slot.bianca.occupant ? "sala_tufo" : "sala_bianca"}
                onChoose={handleChooseSlot}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  /* ------------------ Render: celle matrice (Tab 2) ------------------ */
  const renderSlotCell = (
    plan: DayPlan,
    slot: SpaceSlot,
    turno: "pranzo" | "cena",
    macro: MacroSpace
  ) => {
    if (plan.exclusive) {
      const signed = isSignedEvent(plan.exclusive);
      return (
        <td
          style={{
            ...MATRIX_TD,
            background: signed ? RED_BG : AMBER_BG,
            border: `1px solid ${signed ? RED_BORDER : AMBER_BORDER}`,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: "0.72rem", color: signed ? GOLD_TEXT : AMBER_TEXT }}>
            {plan.exclusive.isQuickOption ? optionStatusLabel(plan.exclusive) : "👑 Intera Tenuta Riservata"}
          </div>
          <div style={{ fontSize: "0.7rem", color: signed ? RED_TEXT : AMBER_TEXT, fontWeight: 700 }}>
            {plan.exclusive.clientName}
            {plan.exclusive.isQuickOption && plan.exclusive.telefono ? ` · 📞 ${plan.exclusive.telefono}` : ""}
          </div>
        </td>
      );
    }

    if (!slot.occupant) {
      return (
        <td style={{ ...MATRIX_TD, background: GREEN_BG, border: `1px solid ${GREEN_BORDER}` }}>
          <div style={{ fontWeight: 800, fontSize: "0.72rem", color: GREEN_TEXT }}>LIBERO</div>
          <BloccaLink
            iso={plan.iso}
            turno={turno}
            compact
            formula={macro === "tufo" ? "sala_tufo" : "sala_bianca"}
            onChoose={handleChooseSlot}
          />
        </td>
      );
    }

    const occ = slot.occupant;
    const isOption = slot.tone === "option";
    const bg = isOption ? AMBER_BG : RED_BG;
    const border = isOption ? AMBER_BORDER : RED_BORDER;
    const text = isOption ? AMBER_TEXT : RED_TEXT;
    return (
      <td style={{ ...MATRIX_TD, background: bg, border: `1px solid ${border}` }}>
        <div style={{ fontWeight: 800, fontSize: "0.68rem", color: text, letterSpacing: "0.3px" }}>
          {isOption ? (occ.isQuickOption ? optionStatusLabel(occ) : "OPZIONE 7GG") : "OCCUPATO / FIRMATO"}
        </div>
        <button type="button" onClick={() => handleOpenEdit(occ)} style={{ ...MATRIX_OCC_BTN, color: text }}>
          {occ.clientName}
        </button>
        {occ.isQuickOption && occ.telefono && (
          <div style={{ fontSize: "0.68rem", color: text, fontWeight: 700 }}>📞 {occ.telefono}</div>
        )}
        {isOption && !occ.isQuickOption && typeof occ.giorniRimanenti === "number" && (
          <div style={{ fontSize: "0.68rem", color: text, fontWeight: 700 }}>
            {occ.scaduta ? "⚠️ Scaduta" : `⏳ ${occ.giorniRimanenti} gg rimanenti`}
          </div>
        )}
      </td>
    );
  };

  const renderExclusiveColumnCell = (plan: DayPlan) => {
    if (plan.exclusive) {
      const signed = isSignedEvent(plan.exclusive);
      return (
        <td
          style={{
            ...MATRIX_TD,
            background: signed ? "linear-gradient(135deg, #7c3f08 0%, #5a2d06 100%)" : AMBER_BG,
            border: `1px solid ${signed ? "#7c3f08" : AMBER_BORDER}`,
            color: signed ? "#ffe9c7" : AMBER_TEXT,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: "0.72rem" }}>
            {signed ? "👑 Riservata" : plan.exclusive.isQuickOption ? optionStatusLabel(plan.exclusive) : "👑 Opzione"}
          </div>
          <div style={{ fontSize: "0.7rem", fontWeight: 700 }}>
            {plan.exclusive.clientName}
            {plan.exclusive.isQuickOption && plan.exclusive.telefono ? ` · 📞 ${plan.exclusive.telefono}` : ""}
          </div>
        </td>
      );
    }

    if (plan.hasAnyBooking) {
      return (
        <td style={{ ...MATRIX_TD, background: RED_BG, border: `1px solid ${RED_BORDER}` }}>
          <div style={{ fontWeight: 800, fontSize: "0.7rem", color: RED_TEXT }}>
            Non disponibile in esclusiva
          </div>
        </td>
      );
    }

    return (
      <td style={{ ...MATRIX_TD, background: GOLD_BG, border: `1px solid ${GOLD_BORDER}` }}>
        <div style={{ fontWeight: 800, fontSize: "0.72rem", color: GOLD_TEXT }}>👑 Libera per Esclusiva</div>
        <BloccaLink iso={plan.iso} exclusive compact onChoose={handleChooseSlot} />
      </td>
    );
  };

  return (
    <div style={{ maxWidth: "1250px", margin: "0 auto", fontFamily: "'Outfit', system-ui, sans-serif", color: "#2c2a27" }}>

      {/* Header Sezione */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ textTransform: "uppercase", letterSpacing: "2.5px", fontSize: "0.78rem", color: "#e58c2c", fontWeight: 800 }}>
            DISPONIBILITÀ LOCATION & AGENDA DIREZIONALE
          </span>
          <h1 style={{ margin: "0.2rem 0 0 0", color: "#1e1b18", fontSize: "2.2rem", fontFamily: "Georgia, serif", fontWeight: 600 }}>
            📅 Calendario Villa, Eventi & Visite
          </h1>
          <p style={{ margin: "0.2rem 0 0 0", color: "#78716c", fontSize: "0.95rem" }}>
            Gestione occupazione sale in esclusiva, contratti firmati e opzioni 7 giorni in tempo reale.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openOptionModal()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.8rem 1.3rem",
            borderRadius: "14px",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 800,
            fontSize: "0.95rem",
            color: "#ffffff",
            background: "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)",
            boxShadow: "0 8px 20px rgba(229,140,44,0.35)",
            whiteSpace: "nowrap",
          }}
        >
          ⚡ Fissa Opzione Rapida (7gg)
        </button>

        {/* Controlli Mese */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "#ffffff", padding: "0.6rem 1.2rem", borderRadius: "14px", border: "1px solid #e8e2d9", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <button type="button" onClick={handlePrevMonth} style={{ background: "#f5f0e8", border: "none", borderRadius: "8px", padding: "0.4rem 0.8rem", fontSize: "1rem", cursor: "pointer", fontWeight: "bold" }}>⬅️</button>
          <strong style={{ fontSize: "1.15rem", color: "#1e1b18", textTransform: "capitalize", minWidth: "170px", textAlign: "center", fontFamily: "Georgia, serif" }}>
            {format(currentMonth, "MMMM yyyy", { locale: it })}
          </strong>
          <button type="button" onClick={handleNextMonth} style={{ background: "#f5f0e8", border: "none", borderRadius: "8px", padding: "0.4rem 0.8rem", fontSize: "1rem", cursor: "pointer", fontWeight: "bold" }}>➡️</button>
        </div>
      </div>

      {/* SELETTORE MODALITÀ DI VISUALIZZAZIONE */}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <ViewTab
          active={viewMode === "griglia"}
          onClick={() => setViewMode("griglia")}
          icon="📅"
          label={"Griglia Mensile (con Slot Spazi)"}
        />
        <ViewTab
          active={viewMode === "matrice"}
          onClick={() => setViewMode("matrice")}
          icon="🏢"
          label={"Matrice Spazi & Turni (Colpo d'Occhio)"}
        />
      </div>

      {/* TOP KPI COUNTERS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>

        <div style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", border: "1px solid #fed7aa", padding: "1.1rem 1.25rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(229,140,44,0.08)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#c2410c", textTransform: "uppercase", letterSpacing: "1px" }}>
            💍 MATRIMONI FIRMATI
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1e1b18", margin: "0.2rem 0" }}>
            {totalWeddings}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#78716c" }}>Contratti d&apos;esclusiva confermati</span>
        </div>

        <div style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)", border: "1px solid #ddd6fe", padding: "1.1rem 1.25rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(139,92,246,0.08)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6d28d9", textTransform: "uppercase", letterSpacing: "1px" }}>
            🎉 EVENTI PRIVATI
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1e1b18", margin: "0.2rem 0" }}>
            {totalPrivate}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#78716c" }}>Comunioni, Battesimi e Feste</span>
        </div>

        <div style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fde68a 100%)", border: "2px solid #e58c2c", padding: "1.1rem 1.25rem", borderRadius: "16px", boxShadow: "0 6px 18px rgba(229,140,44,0.18)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#b45f0c", textTransform: "uppercase", letterSpacing: "1px" }}>
            ⏳ OPZIONI ATTIVE (7GG)
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1e1b18", margin: "0.2rem 0" }}>
            {totalPendingActive}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#78716c" }}>Contratti in pending da firmare</span>
        </div>

        <div style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", border: "1px solid #bae6fd", padding: "1.1rem 1.25rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(2,132,199,0.08)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0369a1", textTransform: "uppercase", letterSpacing: "1px" }}>
            🕒 VISITE ACCOGLIENZA
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1e1b18", margin: "0.2rem 0" }}>
            {totalVisits}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#78716c" }}>Slot segreteria &amp; Roberto</span>
        </div>

        <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #bbf7d0", padding: "1.1rem 1.25rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(22,163,74,0.08)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: "1px" }}>
            👑 ESCLUSIVA VILLA
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1e1b18", margin: "0.2rem 0" }}>
            {totalExclusives}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#78716c" }}>Struttura interamente bloccata</span>
        </div>

      </div>

      {/* BARRA FILTRI RAPIDI PER CATEGORIA */}
      <div style={{ background: "#ffffff", padding: "1rem 1.25rem", borderRadius: "16px", border: "1px solid #e8e2d9", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", boxShadow: "0 4px 14px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1e1b18", textTransform: "uppercase", letterSpacing: "1px" }}>
            Filtra Visualizzazione:
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveFilter("tutti")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: activeFilter === "tutti" ? "2px solid #1e1b18" : "1px solid #e2d7c7",
              background: activeFilter === "tutti" ? "#1e1b18" : "#fdfbf7",
              color: activeFilter === "tutti" ? "#ffffff" : "#544e45",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            🌐 Tutti gli Eventi &amp; Visite
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("wedding")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: activeFilter === "wedding" ? "2px solid #e58c2c" : "1px solid #e2d7c7",
              background: activeFilter === "wedding" ? "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)" : "#fdfbf7",
              color: activeFilter === "wedding" ? "#ffffff" : "#544e45",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            💍 Solo Matrimoni ({totalWeddings})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("privato")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: activeFilter === "privato" ? "2px solid #8b5cf6" : "1px solid #e2d7c7",
              background: activeFilter === "privato" ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" : "#fdfbf7",
              color: activeFilter === "privato" ? "#ffffff" : "#544e45",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            🎉 Solo Eventi Privati ({totalPrivate})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("opzione")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: activeFilter === "opzione" ? "2px solid #e58c2c" : "1px solid #fde68a",
              background: activeFilter === "opzione" ? `linear-gradient(135deg, ${COLOR_PENDING} 0%, ${COLOR_PENDING_DARK} 100%)` : "#fff7ed",
              color: activeFilter === "opzione" ? "#ffffff" : "#b45f0c",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            ⏳ Solo Opzioni 7GG ({totalPendingActive})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("visita")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: activeFilter === "visita" ? "2px solid #0284c7" : "1px solid #bae6fd",
              background: activeFilter === "visita" ? "#0284c7" : "#f0f9ff",
              color: activeFilter === "visita" ? "#ffffff" : "#0369a1",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            🕒 Solo Appuntamenti Visita ({totalVisits})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("esclusiva")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: activeFilter === "esclusiva" ? "2px solid #16a34a" : "1px solid #bbf7d0",
              background: activeFilter === "esclusiva" ? "#16a34a" : "#f0fdf4",
              color: activeFilter === "esclusiva" ? "#ffffff" : "#15803d",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            👑 Solo Esclusiva Villa ({totalExclusives})
          </button>
        </div>
      </div>

      {/* LEGENDA FISSA BEN VISIBILE */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.55rem",
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(6px)",
          padding: "0.65rem 0.9rem",
          borderRadius: "14px",
          border: "1px solid #e8e2d9",
          marginBottom: "1.25rem",
          boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
        }}
      >
        <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#8c857b", marginRight: "0.2rem" }}>
          Legenda
        </span>
        {LEGEND_ITEMS.map((item) => (
          <span
            key={item.label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.74rem",
              fontWeight: 700,
              color: "#544e45",
            }}
          >
            <span
              aria-hidden
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "4px",
                background: item.dot,
                border: "1px solid rgba(0,0,0,0.12)",
                display: "inline-block",
              }}
            />
            {item.label}
          </span>
        ))}
      </div>

      {/* ============================ TAB 1: GRIGLIA MENSILE ============================ */}
      {viewMode === "griglia" && (
        <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e8e2d9", padding: "1.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.15rem", fontFamily: "Georgia, serif", color: "#1e1b18", fontWeight: 600 }}>
              🗓️ Slot Spazi per Giorno
            </h2>
            <span style={{ fontSize: "0.8rem", color: "#78716c" }}>
              Clicca su un giorno o su <strong>＋ Blocca</strong> per bloccare subito la data.
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px" }}>

            {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(dayName => (
              <div key={dayName} style={{ padding: "0.8rem", fontWeight: 800, color: "#8c857b", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "1px", textAlign: "center" }}>
                {dayName}
              </div>
            ))}

            {dayPlans.map(({ day, plan }) => {
              const exclusiveSigned = plan.exclusive ? isSignedEvent(plan.exclusive) : false;
              const cellBackground = plan.exclusive
                ? (exclusiveSigned ? "#fef2f2" : "#fff7ed")
                : "#ffffff";
              const cellBorder = plan.exclusive
                ? (exclusiveSigned ? "2px solid #7c3f08" : `2px solid ${GOLD_BORDER}`)
                : plan.isWeekend
                  ? "1.5px solid #f0d9b5"
                  : "1px solid #eee8df";

              const chipSource = activeFilter === "tutti" ? plan.visits : getEventsForDay(day);

              return (
                <div
                  key={plan.iso}
                  style={{
                    minHeight: "190px",
                    background: cellBackground,
                    borderRadius: "14px",
                    border: cellBorder,
                    padding: "0.55rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                    transition: "all 0.2s ease-out",
                  }}
                >
                  {/* Intestazione giorno */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.3rem" }}>
                    <Link
                      href={`/admin/contratti?data=${plan.iso}`}
                      title="Blocca questa data (apri contratti)"
                      style={{
                        fontWeight: 800,
                        color: plan.isWeekend ? "#b45f0c" : "#1e1b18",
                        fontSize: "1rem",
                        fontFamily: "Georgia, serif",
                        textDecoration: "none",
                      }}
                    >
                      {format(day, "d")}
                      {plan.isWeekend && (
                        <span style={{ fontSize: "0.58rem", marginLeft: "4px", fontWeight: 700, color: "#b45f0c" }}>
                          weekend
                        </span>
                      )}
                    </Link>
                    {plan.visits.length > 0 && (
                      <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "#0369a1", background: "#f0f9ff", padding: "0.1rem 0.35rem", borderRadius: "9px", border: "1px solid #bae6fd" }}>
                        🕒 {plan.visits.length}
                      </span>
                    )}
                  </div>

                  {/* Badge esclusiva: copre l'intera giornata */}
                  {plan.exclusive && (
                    <div style={EXCLUSIVE_BANNER}>
                      👑 ESCLUSIVA TENUTA
                      {plan.exclusive.isQuickOption && (
                        <div style={{ fontSize: "0.66rem", fontWeight: 800, marginTop: "1px" }}>
                          {optionStatusLabel(plan.exclusive)}
                        </div>
                      )}
                      <div style={{ fontSize: "0.66rem", fontWeight: 600, marginTop: "1px" }}>
                        {plan.exclusive.clientName}
                        {plan.exclusive.isQuickOption && plan.exclusive.telefono
                          ? ` · 📞 ${plan.exclusive.telefono}`
                          : plan.exclusive.isPending && typeof plan.exclusive.giorniRimanenti === "number"
                            ? ` · opzione ${plan.exclusive.giorniRimanenti}gg`
                            : ""}
                      </div>
                    </div>
                  )}

                  {/* Micro-fasce PRANZO / CENA */}
                  {renderBand(plan, "pranzo", "☀️ PRANZO", plan.pranzo)}
                  {renderBand(plan, "cena", "🌙 CENA", plan.cena)}

                  {/* Chips di dettaglio (visite o eventi filtrati) */}
                  {chipSource.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "auto" }}>
                      {chipSource.map((evt) => {
                        const isVisita = evt.tipo === "visita";
                        const isPending = Boolean(evt.isPending || evt.status === "opzione");
                        const isSigned = Boolean(evt.isSigned || evt.status === "firmato");
                        const isExclusive = isExclusiveEvent(evt);
                        const toneStyle: CSSProperties = isVisita
                          ? VISIT_CHIP
                          : isExclusive || isSigned
                            ? SIGNED_MINI
                            : isPending
                              ? OPTION_MINI
                              : OPTION_MINI;
                        return (
                          <button
                            key={evt.id}
                            type="button"
                            onClick={() => handleOpenEdit(evt)}
                            title={evt.title}
                            style={{ ...toneStyle, cursor: "pointer" }}
                          >
                            {isVisita
                              ? `🕒 ${evt.ora} Visita · ${evt.clientName}`
                              : `${isExclusive ? "👑 " : isPending ? "⏳ " : ""}${evt.turno === "cena" ? "Cena" : "Pranzo"} · ${evt.clientName}`}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* ==================== TAB 2: MATRICE SPAZI & TURNI (COLPO D'OCCHIO) ==================== */}
      {viewMode === "matrice" && (
        <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e8e2d9", padding: "1.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.15rem", fontFamily: "Georgia, serif", color: "#1e1b18", fontWeight: 600 }}>
              🏢 Planning Mensile — Dove c&apos;è posto a colpo d&apos;occhio
            </h2>
            <span style={{ fontSize: "0.8rem", color: "#78716c" }}>
              Sab/Dom evidenziati · clicca <strong>＋ Blocca</strong> sulle celle verdi.
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "980px" }}>
              <thead>
                <tr>
                  <th style={{ ...MATRIX_TH, textAlign: "left" }}>Giorno</th>
                  <th style={MATRIX_TH}>☀️ PRANZO — Sala Bianca &amp; Giardini</th>
                  <th style={MATRIX_TH}>☀️ PRANZO — Sala Tufo &amp; Parco</th>
                  <th style={MATRIX_TH}>🌙 CENA — Sala Bianca &amp; Giardini</th>
                  <th style={MATRIX_TH}>🌙 CENA — Sala Tufo &amp; Parco</th>
                  <th style={MATRIX_TH}>👑 Formula Esclusiva Villa</th>
                </tr>
              </thead>
              <tbody>
                {dayPlans.map(({ day, plan }) => (
                  <tr key={plan.iso} style={{ background: plan.isWeekend ? "#fffaf0" : "#ffffff" }}>
                    <td
                      style={{
                        ...MATRIX_DAY_TD,
                        borderLeft: plan.isWeekend ? `4px solid ${COLOR_PENDING}` : "4px solid transparent",
                        background: plan.isWeekend ? "#fff5e2" : "#ffffff",
                      }}
                    >
                      <div style={{ fontWeight: 800, color: plan.isWeekend ? "#b45f0c" : "#1e1b18", textTransform: "capitalize", fontFamily: "Georgia, serif" }}>
                        {format(day, "EEE dd/MM", { locale: it })}
                      </div>
                      {plan.isWeekend && (
                        <span style={{ fontSize: "0.58rem", fontWeight: 800, color: "#b45f0c", background: "#fde68a", borderRadius: "999px", padding: "1px 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Weekend
                        </span>
                      )}
                      {plan.visits.length > 0 && (
                        <div style={{ fontSize: "0.66rem", color: "#0369a1", fontWeight: 700, marginTop: "2px" }}>
                          🕒 {plan.visits.length} visita
                        </div>
                      )}
                    </td>
                    {renderSlotCell(plan, plan.pranzo.bianca, "pranzo", "bianca")}
                    {renderSlotCell(plan, plan.pranzo.tufo, "pranzo", "tufo")}
                    {renderSlotCell(plan, plan.cena.bianca, "cena", "bianca")}
                    {renderSlotCell(plan, plan.cena.tufo, "cena", "tufo")}
                    {renderExclusiveColumnCell(plan)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALE DETTAGLIO & MODIFICA */}
      {selectedEvent && editForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1.5rem"
        }}>
          <div style={{
            background: "#ffffff",
            width: "100%",
            maxWidth: "680px",
            maxHeight: "92vh",
            overflowY: "auto",
            borderRadius: "24px",
            border: "1px solid #e8e2d9",
            padding: "2rem",
            boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            position: "relative"
          }}>

            <button
              type="button"
              onClick={() => { setSelectedEvent(null); setEditForm(null); }}
              style={{
                position: "absolute",
                top: "1.5rem",
                right: "1.5rem",
                background: "#f5f0e8",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "1rem"
              }}
            >
              ✕
            </button>

            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 800 }}>
              GESTIONE DIREZIONALE EVENTO &amp; APPUNTAMENTO
            </span>
            <h2 style={{ margin: "0.3rem 0 1rem 0", color: "#1e1b18", fontSize: "1.6rem", fontFamily: "Georgia, serif" }}>
              {selectedEvent.title}
            </h2>

            {/* Blocco opzione veloce 7gg da calendario: conversione in contratto con 1 click */}
            {selectedEvent.isQuickOption && (
              <div style={{
                background: "#fffbeb",
                border: `1.5px solid ${COLOR_PENDING}`,
                borderRadius: "14px",
                padding: "1rem 1.1rem",
                marginBottom: "1.4rem"
              }}>
                <div style={{ fontWeight: 800, color: "#b45f0c", marginBottom: "0.5rem" }}>
                  {optionStatusLabel(selectedEvent)}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#2c2a27", lineHeight: 1.6, marginBottom: "0.75rem" }}>
                  <div>
                    <strong>{selectedEvent.clientName}</strong>
                    {selectedEvent.telefono && (
                      <> · <a href={`tel:${selectedEvent.telefono}`} style={{ color: "#b45f0c", fontWeight: 700, textDecoration: "none" }}>📞 {selectedEvent.telefono}</a></>
                    )}
                    {selectedEvent.email && <> · ✉️ {selectedEvent.email}</>}
                  </div>
                  <div>
                    📅 {formatDateOnly(selectedEvent.data)} · {selectedEvent.turno === "cena" ? "🌙 Cena" : "☀️ Pranzo"} ·{" "}
                    {selectedEvent.formulaOpzione ? OPTION_FORMULA_LABEL[selectedEvent.formulaOpzione] : "Formula da definire"}
                  </div>
                  <div>
                    {selectedEvent.scadenza && (
                      <>Data scadenza opzione: <strong>{formatDateOnly(selectedEvent.scadenza)}</strong> · </>
                    )}
                    {selectedEvent.scaduta
                      ? <strong style={{ color: "#b91c1c" }}>SCADUTA</strong>
                      : <>Mancano <strong>{selectedEvent.giorniRimanenti ?? 0} giorni</strong></>}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#78716c" }}>
                    Se arriva un&apos;altra richiesta per questa data, il cliente ha 24 ore di prelazione per confermare.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => router.push(buildContractFromOptionHref(selectedEvent))}
                    style={{ padding: "0.7rem 1.1rem", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)", color: "#ffffff", fontFamily: "inherit", fontSize: "0.92rem", fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 16px rgba(229,140,44,0.3)" }}
                  >
                    ⚡ Emetti Contratto da questa Opzione
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReleaseQuickOption(selectedEvent)}
                    style={{ padding: "0.7rem 1rem", borderRadius: "12px", border: "1px solid #fecaca", background: "#ffffff", color: "#b91c1c", fontFamily: "inherit", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    🗑️ Rilascia Opzione
                  </button>
                </div>
              </div>
            )}

            {/* Blocco ciclo di vita: opzione pending con azioni rapide */}
            {selectedEvent.isPending && !selectedEvent.isQuickOption && (
              <div style={{
                background: "#fff7ed",
                border: `1px solid ${COLOR_PENDING}`,
                borderRadius: "14px",
                padding: "1rem 1.1rem",
                marginBottom: "1.4rem"
              }}>
                <div style={{ fontWeight: 800, color: "#b45f0c", marginBottom: "0.5rem" }}>
                  🟡 OPZIONE 7GG (Pending){selectedEvent.preventivo ? ` · Preventivo ${selectedEvent.preventivo}` : ""}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#2c2a27", marginBottom: "0.75rem" }}>
                  {selectedEvent.scadenza && (
                    <>Data scadenza opzione: <strong>{formatDateOnly(selectedEvent.scadenza)}</strong> · </>
                  )}
                  {typeof selectedEvent.giorniRimanenti === "number" && (
                    selectedEvent.scaduta
                      ? <strong style={{ color: "#b91c1c" }}>SCADUTA</strong>
                      : <>Mancano <strong>{selectedEvent.giorniRimanenti} giorni</strong></>
                  )}
                </div>

                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(selectedEvent)}
                    style={{ padding: "0.55rem 0.95rem", borderRadius: "10px", border: "1px solid #e0ddd9", background: copiedId === selectedEvent.id ? "#f0fdf4" : "#ffffff", color: copiedId === selectedEvent.id ? "#15803d" : "#1e1b18", fontFamily: "inherit", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    {copiedId === selectedEvent.id ? "Copiato! ✓" : "📋 Copia Link Contratto"}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(selectedEvent.whatsappText || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: "0.55rem 0.95rem", borderRadius: "10px", border: "1px solid #e0ddd9", background: "#ffffff", color: "#1e1b18", fontSize: "0.88rem", fontWeight: 600, textDecoration: "none" }}
                  >
                    💬 Invia WhatsApp
                  </a>
                  <a
                    href={selectedEvent.contractUrl || selectedEvent.absoluteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: "0.55rem 0.95rem", borderRadius: "10px", border: "1px solid #e0ddd9", background: "#ffffff", color: "#1e1b18", fontSize: "0.88rem", fontWeight: 600, textDecoration: "none" }}
                  >
                    👁️ Apri Contratto Sposi
                  </a>
                </div>
              </div>
            )}

            {/* Blocco ciclo di vita: contratto firmato */}
            {selectedEvent.isSigned && (
              <div style={{
                background: "#f0fdf4",
                border: `1px solid ${COLOR_SIGNED_SEMI}`,
                borderRadius: "14px",
                padding: "1rem 1.1rem",
                marginBottom: "1.4rem"
              }}>
                <div style={{ fontWeight: 800, color: "#15803d", marginBottom: "0.5rem" }}>
                  ✅ CONTRATTO FIRMATO — Data bloccata
                </div>
                <div style={{ fontSize: "0.9rem", color: "#2c2a27", marginBottom: selectedEvent.signedPdfUrl ? "0.75rem" : 0 }}>
                  {selectedEvent.tipoEsclusiva === "esclusiva"
                    ? "Formula: Esclusiva intera villa (occupazione totale della giornata)."
                    : `Formula: Semi-esclusiva (turno ${selectedEvent.turno === "cena" ? "cena" : "pranzo"}).`}
                </div>
                {selectedEvent.signedPdfUrl ? (
                  <a
                    href={selectedEvent.signedPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-block", padding: "0.55rem 0.95rem", borderRadius: "10px", border: "1px solid #bbf7d0", background: "#ffffff", color: "#15803d", fontSize: "0.88rem", fontWeight: 700, textDecoration: "none" }}
                  >
                    📄 Apri PDF Contratto Firmato
                  </a>
                ) : (
                  <span style={{ fontSize: "0.85rem", color: "#78716c" }}>
                    Stato confermato (PDF firmato non ancora archiviato su storage).
                  </span>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

              {/* Riga 1: Data Evento & Orario */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#78716c", display: "block", marginBottom: "0.4rem" }}>
                    Data Evento / Appuntamento:
                  </label>
                  <input
                    type="date"
                    value={editForm.data || ""}
                    onChange={(e) => setEditForm({ ...editForm, data: e.target.value })}
                    style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #e58c2c", background: "#fff7ed", color: "#1e1b18", fontWeight: 700, outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#78716c", display: "block", marginBottom: "0.4rem" }}>
                    Ora / Turno:
                  </label>
                  <input
                    type="text"
                    value={editForm.ora || ""}
                    onChange={(e) => setEditForm({ ...editForm, ora: e.target.value })}
                    style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #e2d7c7", background: "#fdfbf7", color: "#1e1b18", fontWeight: 600, outline: "none" }}
                  />
                </div>
              </div>

              {/* Riga 2: Tipologia & Assegnazione Sale */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#78716c", display: "block", marginBottom: "0.4rem" }}>
                    Tipologia Evento:
                  </label>
                  <select
                    value={editForm.tipo || "wedding"}
                    onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })}
                    style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #e2d7c7", background: "#fdfbf7", color: "#1e1b18", fontWeight: 600, outline: "none" }}
                  >
                    <option value="wedding">💍 Matrimonio</option>
                    <option value="privato">🎉 Evento Privato (Battesimo/Comunione/Festa)</option>
                    <option value="visita">🕒 Visita Accoglienza Segreteria</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#78716c", display: "block", marginBottom: "0.4rem" }}>
                    Occupazione Sale &amp; Esclusività:
                  </label>
                  <select
                    value={editForm.sala || "esclusiva_villa"}
                    onChange={(e) => setEditForm({ ...editForm, sala: e.target.value })}
                    style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #e2d7c7", background: "#fdfbf7", color: "#1e1b18", fontWeight: 600, outline: "none" }}
                  >
                    <option value="esclusiva_villa">👑 Esclusiva Intera Villa (6.000 mq)</option>
                    <option value="sala_bianca">🏛️ Sala Bianca (Fino a 200 Pax)</option>
                    <option value="sala_tufo">🏛️ Sala Tufo (Fino a 80 Pax / After Party)</option>
                  </select>
                </div>
              </div>

              {/* Riga 3: Note & Istruzioni */}
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#78716c", display: "block", marginBottom: "0.4rem" }}>
                  Note Direzionali per lo Staff / Motivo Spostamento:
                </label>
                <textarea
                  value={editForm.note || ""}
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #e2d7c7", background: "#fffefb", color: "#2c2a27", fontSize: "0.88rem", minHeight: "80px" }}
                />
              </div>

              {/* Pulsante Salvataggio */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => { setSelectedEvent(null); setEditForm(null); }}
                  style={{ padding: "0.8rem 1.2rem", background: "#f5f0e8", border: "none", borderRadius: "12px", fontWeight: 700, color: "#78716c", cursor: "pointer" }}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  style={{ padding: "0.8rem 1.6rem", background: "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)", border: "none", borderRadius: "12px", fontWeight: 800, color: "#ffffff", cursor: "pointer", boxShadow: "0 4px 14px rgba(229,140,44,0.3)" }}
                >
                  💾 Salva Modifiche Evento
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* SCELTA SLOT LIBERO: contratto completo oppure opzione rapida */}
      {slotChoice && (
        <div style={MODAL_OVERLAY} onClick={() => setSlotChoice(null)}>
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#faf8f5", width: "100%", maxWidth: "430px", borderRadius: "20px", border: "1px solid #e8e2d9", borderTop: `4px solid ${COLOR_PENDING}`, padding: "1.6rem", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}
          >
            <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 800 }}>
              Blocca data
            </span>
            <h3 style={{ margin: "0.2rem 0 1.1rem 0", fontFamily: "Georgia, serif", fontSize: "1.3rem", color: "#1e1b18" }}>
              {formatDateOnly(slotChoice.iso)}
              {slotChoice.exclusive ? " · 👑 Esclusiva" : slotChoice.turno ? ` · ${slotChoice.turno === "cena" ? "🌙 Cena" : "☀️ Pranzo"}` : ""}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              <button
                type="button"
                onClick={() => handleChooseContract(slotChoice)}
                style={{ padding: "0.95rem 1rem", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #1e1b18 0%, #2e2924 100%)", color: "#ffffff", fontFamily: "inherit", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer", textAlign: "left" }}
              >
                ⚡ Emetti Contratto Completo
                <div style={{ fontSize: "0.76rem", fontWeight: 500, color: "#d6cfc4", marginTop: "2px" }}>
                  Apre i Contratti con data e turno già impostati
                </div>
              </button>
              <button
                type="button"
                onClick={() => openOptionModal({ iso: slotChoice.iso, turno: slotChoice.turno, formula: slotChoice.formula })}
                style={{ padding: "0.95rem 1rem", borderRadius: "14px", border: `1.5px solid ${COLOR_PENDING}`, background: "#fff7ed", color: "#b45f0c", fontFamily: "inherit", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer", textAlign: "left" }}
              >
                ⏳ Fissa Opzione Rapida 7gg (Senza Prezzo)
                <div style={{ fontSize: "0.76rem", fontWeight: 500, color: "#92400e", marginTop: "2px" }}>
                  Solo nome, telefono e spazio: 5 secondi
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSlotChoice(null)}
                style={{ padding: "0.6rem", borderRadius: "12px", border: "none", background: "transparent", color: "#78716c", fontFamily: "inherit", fontWeight: 700, cursor: "pointer" }}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE OPZIONE RAPIDA 7GG */}
      {optionModalOpen && (
        <div style={MODAL_OVERLAY} onClick={() => !optSaving && setOptionModalOpen(false)}>
          <form
            role="dialog"
            aria-modal="true"
            aria-busy={optSaving}
            noValidate
            onSubmit={handleSaveQuickOption}
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#faf8f5", width: "100%", maxWidth: "500px", maxHeight: "94vh", overflowY: "auto", borderRadius: "20px", border: "1px solid #e8e2d9", borderTop: `4px solid ${COLOR_PENDING}`, padding: "1.5rem", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}
          >
            <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 800 }}>
              Opzione veloce · scade tra 7 giorni
            </span>
            <h3 style={{ margin: "0.2rem 0 1rem 0", fontFamily: "Georgia, serif", fontSize: "1.35rem", color: "#1e1b18" }}>
              ⚡ Fissa Opzione Rapida
            </h3>

            <div style={{ display: "grid", gap: "0.8rem" }}>
              <div>
                <label htmlFor="opt-nome" style={MODAL_LABEL}>Nome Cliente / Sposi *</label>
                <input id="opt-nome" type="text" autoFocus value={optNome} onChange={(e) => setOptNome(e.target.value)} placeholder="Es. De Luca & Russo" style={MODAL_INPUT} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                <div>
                  <label htmlFor="opt-tel" style={MODAL_LABEL}>Telefono *</label>
                  <input id="opt-tel" type="tel" inputMode="tel" autoComplete="tel" value={optTelefono} onChange={(e) => setOptTelefono(e.target.value)} placeholder="+39 333 1234567" style={MODAL_INPUT} />
                </div>
                <div>
                  <label htmlFor="opt-email" style={MODAL_LABEL}>Email (opzionale)</label>
                  <input id="opt-email" type="email" autoComplete="email" value={optEmail} onChange={(e) => setOptEmail(e.target.value)} style={MODAL_INPUT} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", alignItems: "end" }}>
                <div>
                  <label htmlFor="opt-data" style={MODAL_LABEL}>Data Evento *</label>
                  <input id="opt-data" type="date" value={optData} onChange={(e) => setOptData(e.target.value)} style={MODAL_INPUT} />
                </div>
                <div>
                  <span style={MODAL_LABEL}>Turno</span>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <ChoiceChip active={optTurno === "pranzo"} onClick={() => setOptTurno("pranzo")}>☀️ Pranzo</ChoiceChip>
                    <ChoiceChip active={optTurno === "cena"} onClick={() => setOptTurno("cena")}>🌙 Cena</ChoiceChip>
                  </div>
                </div>
              </div>

              <div>
                <span style={MODAL_LABEL}>Formula</span>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <ChoiceChip active={optFormula === "esclusiva"} onClick={() => setOptFormula("esclusiva")}>👑 Esclusiva</ChoiceChip>
                  <ChoiceChip active={optFormula === "sala_bianca"} onClick={() => setOptFormula("sala_bianca")}>🏛️ {SEMI_ESCLUSIVA_FORMULE.sala_bianca.label}</ChoiceChip>
                  <ChoiceChip active={optFormula === "sala_tufo"} onClick={() => setOptFormula("sala_tufo")}>🏛️ {SEMI_ESCLUSIVA_FORMULE.sala_tufo.label}</ChoiceChip>
                </div>
              </div>

              <div>
                <label htmlFor="opt-note" style={MODAL_LABEL}>Note interne</label>
                <textarea id="opt-note" value={optNote} onChange={(e) => setOptNote(e.target.value)} rows={2} style={{ ...MODAL_INPUT, fontWeight: 500, resize: "vertical" }} />
              </div>
            </div>

            {optError && (
              <div role="alert" style={{ marginTop: "0.9rem", padding: "0.7rem 0.9rem", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "0.88rem", fontWeight: 600 }}>
                {optError}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.7rem", marginTop: "1.2rem" }}>
              <button
                type="button"
                disabled={optSaving}
                onClick={() => setOptionModalOpen(false)}
                style={{ padding: "0.85rem 1.1rem", background: "#f5f0e8", border: "none", borderRadius: "12px", fontFamily: "inherit", fontWeight: 700, color: "#78716c", cursor: "pointer" }}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={optSaving}
                style={{ flex: 1, padding: "0.85rem 1.2rem", background: "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)", border: "none", borderRadius: "12px", fontFamily: "inherit", fontWeight: 800, fontSize: "0.98rem", color: "#ffffff", cursor: optSaving ? "wait" : "pointer", opacity: optSaving ? 0.8 : 1, boxShadow: "0 6px 16px rgba(229,140,44,0.3)" }}
              >
                {optSaving ? "Salvataggio…" : "⏳ Fissa Opzione 7gg"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div
          role="status"
          style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 1200, background: "#1e1b18", color: "#ffe9c7", padding: "0.8rem 1.3rem", borderRadius: "14px", borderLeft: `4px solid ${COLOR_PENDING}`, fontWeight: 700, fontSize: "0.9rem", boxShadow: "0 12px 30px rgba(0,0,0,0.3)" }}
        >
          ✅ {toast}
        </div>
      )}

    </div>
  );
}
