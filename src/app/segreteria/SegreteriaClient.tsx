"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Appointment, AppointmentPreferences, QuickCalendarOptionLocal } from "@/lib/localDb";
import {
  saveAppointmentPreferencesAction,
  updateAppointmentStatoAction,
  toggleAppointmentTourServiceAction,
  type AppointmentPreferencesInput,
} from "./actions";

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

/**
 * Prenotazione attiva (firmata o opzionata) restituita da
 * `getActiveReservations`. Il tipo è replicato qui per non importare nel
 * bundle client il modulo server `slotAvailability` (dipendente da `fs`).
 */
interface ReservationLite {
  quoteId: string;
  date: string;
  turno?: string;
  tipo: "esclusiva" | "semi_esclusiva";
  spazi: string[];
  source: string;
}

interface SegreteriaClientProps {
  initialAppointments: Appointment[];
  initialReservations: ReservationLite[];
  initialQuickOptions: QuickCalendarOptionLocal[];
}

type CategoriaFilter = "tutti" | "wedding" | "privato";
type TabId = "agenda" | "calendar" | "tour";

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
/* Tour Fotografico Servizi — spazi tenuta + servizi esclusivi TDA     */
/* ------------------------------------------------------------------ */

type TourCategory = "spazi" | "gastronomia" | "scenografie" | "rito" | "openbar" | "musica";

interface TourItem {
  id: string;
  name: string;
  category: TourCategory;
  moment: string;
  description: string;
  gallery: string[];
  isVenue?: boolean;
}

const TOUR_CATEGORIES: { key: TourCategory | "tutti"; label: string }[] = [
  { key: "tutti", label: "🌟 Tutti" },
  { key: "spazi", label: "🏛️ Spazi Tenuta" },
  { key: "gastronomia", label: "🍽️ Gastronomia & Angoli" },
  { key: "scenografie", label: "✨ Scenografie & Fuochi" },
  { key: "rito", label: "💍 Rito Civile" },
  { key: "openbar", label: "🍹 Open Bar & Party" },
  { key: "musica", label: "🎵 Musica & Luci" },
];

const PB = "/media/project-builder";

function galleryOf(...names: string[]): string[] {
  return names.map((n) => `${PB}/${n}`);
}

/**
 * Catalogo del Tour Fotografico Servizi: i 6 spazi della tenuta + i servizi
 * più amati ed emozionanti del catalogo TDA, con foto HD e gallerie.
 */
const TOUR_ITEMS: TourItem[] = [
  /* ---------------------------- Spazi ---------------------------- */
  {
    id: "agrumeto",
    name: "L'Agrumeto Storico",
    category: "spazi",
    isVenue: true,
    moment: "Accoglienza & Gran Buffet di Benvenuto",
    description:
      "Oasi botanica centenaria immersa nel profumo delle zagare e degli aranci secolari di Napoli, con isole gastronomiche dal vivo.",
    gallery: galleryOf("agrumeto_hero.jpg", "agrumeto_1.jpg", "agrumeto_2.jpg", "agrumeto_3.jpg"),
  },
  {
    id: "giardino_promesse",
    name: "Il Giardino delle Promesse",
    category: "spazi",
    isVenue: true,
    moment: "Rito Civile & Cerimonia Simbolica",
    description:
      "Spazio romantico all'aperto affacciato sul panorama verde della collina, con passerella in corteccia e arco botanico.",
    gallery: galleryOf("giardino_promesse_hero.jpg", "giardino_promesse_1.jpg", "giardino_promesse_2.jpg", "giardino_promesse_3.jpg"),
  },
  {
    id: "sala_tufo",
    name: "La Sala Tufo",
    category: "spazi",
    isVenue: true,
    moment: "Banchetto & Cena di Gala",
    description:
      "Le storiche pareti in tufo napoletano a vista custodiscono l'atmosfera più intima ed elegante per il pranzo o la cena seduta.",
    gallery: galleryOf("sala_tufo_hero.jpg", "sala_tufo_1.jpg", "sala_tufo_2.jpg", "sala_tufo_3.jpg"),
  },
  {
    id: "sala_bianca",
    name: "La Sala Bianca",
    category: "spazi",
    isVenue: true,
    moment: "Ricevimento Panoramico & Luce Naturale",
    description:
      "Ampie vetrate continue che affacciano sul parco, pavimento in cotto chiaro e design luminoso contemporaneo.",
    gallery: galleryOf("sala_bianca_hero.jpg", "sala_bianca_1.jpg", "sala_bianca_2.jpg", "sala_bianca_3.jpg"),
  },
  {
    id: "taglio_torta",
    name: "La Terrazza del Taglio Torta",
    category: "spazi",
    isVenue: true,
    moment: "Il Momento Clou Sotto le Stelle",
    description:
      "La terrazza panoramica all'imbrunire, con scenografia di luci architetturali, fontane luminose fredde e gran buffet dolci.",
    gallery: galleryOf("taglio_torta_hero.jpg", "taglio_torta_1.jpg", "taglio_torta_2.jpg", "taglio_torta_3.jpg"),
  },
  {
    id: "after_party",
    name: "L'After Party & Lounge",
    category: "spazi",
    isVenue: true,
    moment: "Musica, DJ Set & Dopocena",
    description:
      "Area dopocena per ballare fino a tarda notte con open bar, lounge esterna e l'iconico carretto delle graffette calde.",
    gallery: galleryOf("after_party_hero.jpg", "after_party_1.jpg", "after_party_2.jpg", "after_party_3.jpg"),
  },

  /* ------------------------ Gastronomia ------------------------- */
  {
    id: "angolo_mozzarella",
    name: "Angolo Mozzarella Live (Show Cooking)",
    category: "gastronomia",
    moment: "Gran Buffet di Benvenuto in Agrumeto",
    description:
      "Il casaro prepara dal vivo mozzarelle e trecce filate davanti agli ospiti, tra degustazioni calde e profumo di latte.",
    gallery: galleryOf("agrumeto_hero.jpg", "agrumeto_2.jpg", "agrumeto_3.jpg"),
  },
  {
    id: "angolo_spritz",
    name: "Angolo Spritz & Cocktail Bar d'Accoglienza",
    category: "gastronomia",
    moment: "Welcome Drink in Giardino",
    description:
      "Barman dedicati servono Spritz, cocktail d'autore e analcolici freschi durante l'accoglienza degli invitati.",
    gallery: galleryOf("agrumeto_1.jpg", "agrumeto_2.jpg", "giardino_promesse_3.jpg"),
  },
  {
    id: "champagneria",
    name: "Champagneria & Bollicine d'Élite",
    category: "gastronomia",
    moment: "Aperitivo & Taglio Torta",
    description:
      "Angolo di bollicine d'élite con calici serviti al momento, ideale per brindisi eleganti e per il taglio della torta.",
    gallery: galleryOf("taglio_torta_1.jpg", "sala_bianca_hero.jpg", "agrumeto_1.jpg"),
  },
  {
    id: "carretto_gelato",
    name: "Carretto dei Gelati Artigianali Napoletani",
    category: "gastronomia",
    moment: "Buffet Dolci & Pomeriggio estivo",
    description:
      "Il classico carretto napoletano con gelati artigianali, granite e coni preparati al momento davanti agli ospiti.",
    gallery: galleryOf("sala_bianca_1.jpg", "sala_bianca_2.jpg", "agrumeto_3.jpg"),
  },
  {
    id: "carretto_graffette",
    name: "Carretto delle Graffette Calde al Momento",
    category: "gastronomia",
    moment: "Taglio Torta / After Party",
    description:
      "Graffette calde fritte a vista, cosparse di zucchero e cannella: il dolce profumo che conquista gli invitati a fine serata.",
    gallery: galleryOf("after_party_1.jpg", "after_party_2.jpg", "taglio_torta_1.jpg"),
  },
  {
    id: "angolo_sigari",
    name: "Angolo Sigari Cubani, Rum Pregiati & Cioccolato",
    category: "gastronomia",
    moment: "Dopocena & Relax",
    description:
      "Lounge dopocena dedicata agli appassionati: sigari cubani, selezione di rum pregiati e praline di cioccolato.",
    gallery: galleryOf("after_party_2.jpg", "sala_tufo_2.jpg", "after_party_hero.jpg"),
  },
  {
    id: "angolo_sushi",
    name: "Angolo Sushi & Crudi di Mare",
    category: "gastronomia",
    moment: "Isole gastronomiche in Agrumeto",
    description:
      "Sushi, sashimi e crudi di mare freschissimi preparati al momento da sushi man dedicati, serviti su isole scenografiche.",
    gallery: galleryOf("agrumeto_2.jpg", "agrumeto_hero.jpg", "agrumeto_1.jpg"),
  },
  {
    id: "angolo_fritti",
    name: "Angolo Fritti Caldi Napoletani in Cartoccio",
    category: "gastronomia",
    moment: "Gran Buffet in Agrumeto",
    description:
      "Frittatina, crocchè, zeppoline e fritti di mare serviti caldi in cartoccio, il sapore autentico di Napoli.",
    gallery: galleryOf("agrumeto_3.jpg", "agrumeto_1.jpg", "giardino_promesse_1.jpg"),
  },

  /* ------------------------ Scenografie ------------------------- */
  {
    id: "fuochi_freddi",
    name: "Fuochi Freddi & Fontane Luminose",
    category: "scenografie",
    moment: "Taglio Torta sotto le stelle",
    description:
      "Scintille fredde pirotecniche e fontane luminose scenografiche che incorniciano il momento del taglio della torta.",
    gallery: galleryOf("taglio_torta_hero.jpg", "taglio_torta_2.jpg", "after_party_3.jpg"),
  },
  {
    id: "tensostruttura",
    name: "Tensostruttura Panoramica Giardino",
    category: "scenografie",
    moment: "Piano B di lusso e copertura totale",
    description:
      "Tensostruttura trasparente con chiusura superiore e laterale riscaldata: eleganza e comfort con qualsiasi meteo.",
    gallery: galleryOf("giardino_promesse_hero.jpg", "agrumeto_hero.jpg", "sala_bianca_hero.jpg"),
  },
  {
    id: "spot_giardino",
    name: "Spot Colorati & Cielo Stellato di Lucine in Giardino",
    category: "scenografie",
    moment: "Atmosfera serale romantica",
    description:
      "Giochi di luce colorata e un cielo di lucine calde avvolgono il giardino, creando un'atmosfera fiabesca e romantica.",
    gallery: galleryOf("giardino_promesse_2.jpg", "agrumeto_2.jpg", "giardino_promesse_3.jpg"),
  },

  /* ---------------------------- Rito ---------------------------- */
  {
    id: "rito_civile",
    name: "Rito Civile in Villa nel Giardino delle Promesse",
    category: "rito",
    moment: "Cerimonia con passerella e arco floreale",
    description:
      "Cerimonia civile o simbolica in villa, con passerella, arco floreale e allestimento scenografico nel Giardino delle Promesse.",
    gallery: galleryOf("giardino_promesse_hero.jpg", "giardino_promesse_1.jpg", "giardino_promesse_2.jpg", "giardino_promesse_3.jpg"),
  },

  /* -------------------------- Open Bar -------------------------- */
  {
    id: "after_party_openbar",
    name: "After Party in Sala Tufo con Open Bar Illimitato",
    category: "openbar",
    moment: "Notte fonda con cocktail internazionali e barman",
    description:
      "Dopo la cena, la Sala Tufo si trasforma: open bar illimitato, barman professionisti e cocktail internazionali fino a notte.",
    gallery: galleryOf("after_party_hero.jpg", "sala_tufo_hero.jpg", "after_party_3.jpg"),
  },
  {
    id: "animazione_bimbi",
    name: "Animazione Bambini con Area Giochi Riservata",
    category: "openbar",
    moment: "Per tutto l'evento con animatori dedicati",
    description:
      "Spazio giochi riservato e animatori dedicati intrattengono i più piccoli, così gli adulti godono appieno della festa.",
    gallery: galleryOf("sala_bianca_2.jpg", "agrumeto_1.jpg", "giardino_promesse_1.jpg"),
  },

  /* ------------------------- Musica & Luci ---------------------- */
  {
    id: "illuminazione_dance",
    name: "Illuminazione Dance Floor, Teste Mobili & Sfera a Specchi",
    category: "musica",
    moment: "Dopocena danzante",
    description:
      "Impianto luci professionali con teste mobili, sfera a specchi e scenografie luminose per una pista da ballo da sogno.",
    gallery: galleryOf("after_party_3.jpg", "after_party_1.jpg", "sala_tufo_3.jpg"),
  },
  {
    id: "service_musica",
    name: "Service Musica Live con Fonico & Band",
    category: "musica",
    moment: "Musica d'atmosfera durante il banchetto",
    description:
      "Fonico dedicato e postazione per band live: colonna sonora dal vivo che accompagna il banchetto e la festa.",
    gallery: galleryOf("sala_tufo_1.jpg", "sala_tufo_2.jpg", "after_party_1.jpg"),
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

/** Etichetta di una data candidata: 'Sabato 17/07/2027'. */
function formatDataCandidata(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const wd = date.toLocaleDateString("it-IT", { weekday: "long" });
  const cap = wd.charAt(0).toUpperCase() + wd.slice(1);
  return `${cap} ${m[3]}/${m[2]}/${m[1]}`;
}

/* ------------------------------------------------------------------ */
/* Disponibilità location — calcolo puro e deterministico              */
/* ------------------------------------------------------------------ */

type DayStatus = "libero" | "opzionato" | "semi" | "occupato";

interface DayAvailability {
  status: DayStatus;
  pranzoOccupato: boolean;
  cenaOccupato: boolean;
  label: string;
  color: string;
  bg: string;
  border: string;
}

const STATUS_META: Record<DayStatus, { label: string; color: string; bg: string; border: string }> = {
  libero: { label: "Villa Libera", color: "#166534", bg: "#dcfce7", border: "#86efac" },
  opzionato: { label: "Opzione 7 giorni", color: "#92400e", bg: "#fef3c7", border: "#fcd34d" },
  semi: { label: "Parzialmente occupata", color: "#92400e", bg: "#fef3c7", border: "#fbbf24" },
  occupato: { label: "Occupata · Matrimonio/Evento", color: "#991b1b", bg: "#fee2e2", border: "#fca5a5" },
};

function turnoIsPranzo(t?: string): boolean {
  const v = String(t ?? "").toLowerCase();
  return v === "" || v === "pranzo" || v === "entrambi";
}

function turnoIsCena(t?: string): boolean {
  const v = String(t ?? "").toLowerCase();
  return v === "" || v === "cena" || v === "entrambi";
}

/**
 * Calcola lo stato di disponibilità di un giorno incrociando le prenotazioni
 * attive (contratti/preventivi) con le opzioni rapide da calendario.
 *
 * Precedenza: esclusiva (🔴) > semi-esclusiva nel turno (🟡) > opzione 7gg (🟡) > libero (🟢).
 */
function computeDayAvailability(
  iso: string,
  reservations: ReservationLite[],
  quickOptions: QuickCalendarOptionLocal[]
): DayAvailability {
  const optionIds = new Set(
    quickOptions.map((o) => String(o.quoteId || "").toLowerCase()).filter(Boolean)
  );
  const isOption = (r: ReservationLite): boolean => {
    const q = String(r.quoteId || "").toLowerCase();
    if (!q) return false;
    if (optionIds.has(q)) return true;
    return Array.from(optionIds).some((id) => id.startsWith(q) || q.startsWith(id));
  };

  const sameDay = reservations.filter((r) => r.date === iso);
  const booked = sameDay.filter((r) => !isOption(r));
  const exclusive = booked.some((r) => r.tipo === "esclusiva");
  const semis = booked.filter((r) => r.tipo === "semi_esclusiva");
  const pranzoOccupato = semis.some((r) => turnoIsPranzo(r.turno));
  const cenaOccupato = semis.some((r) => turnoIsCena(r.turno));
  const hasOption =
    quickOptions.some((o) => o.data_evento === iso && !o.scaduta) ||
    sameDay.some((r) => isOption(r));

  let status: DayStatus = "libero";
  if (exclusive) status = "occupato";
  else if (pranzoOccupato || cenaOccupato) status = "semi";
  else if (hasOption) status = "opzionato";

  const base = STATUS_META[status];
  let label = base.label;
  if (status === "semi") {
    if (pranzoOccupato && cenaOccupato) label = "Occupata (pranzo e cena)";
    else if (pranzoOccupato) label = "Pranzo impegnato · cena libera";
    else label = "Cena impegnata · pranzo libero";
  }

  return {
    status,
    pranzoOccupato,
    cenaOccupato,
    label,
    color: base.color,
    bg: base.bg,
    border: base.border,
  };
}

/* ------------------------------------------------------------------ */
/* Calendario — utilità mese                                           */
/* ------------------------------------------------------------------ */

const MESI_IT = [
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

const GIORNI_SETTIMANA = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

interface YearMonth {
  year: number;
  /** Mese 0-11 (convenzione JavaScript). */
  month: number;
}

function ymKey(ym: YearMonth): string {
  return `${ym.year}-${String(ym.month + 1).padStart(2, "0")}`;
}

/** Interpreta 'YYYY-MM' oppure 'Luglio 2027' e restituisce anno+mese. */
function parseMese(value?: string | null): YearMonth | null {
  const s = String(value ?? "").trim();
  if (!s) return null;

  const iso = /^(\d{4})-(\d{1,2})\b/.exec(s);
  if (iso) {
    const m = Number(iso[2]);
    if (m >= 1 && m <= 12) return { year: Number(iso[1]), month: m - 1 };
  }

  const norm = normalize(s);
  const idx = MESI_IT.findIndex((m) => norm.includes(normalize(m)));
  if (idx >= 0) {
    const yearMatch = /\b(\d{4}|\d{2})\b/.exec(s);
    const year = yearMatch
      ? Number(yearMatch[1].length === 2 ? `20${yearMatch[1]}` : yearMatch[1])
      : NaN;
    if (Number.isFinite(year)) return { year, month: idx };
  }

  return null;
}

function addMonths(ym: YearMonth, delta: number): YearMonth {
  const total = ym.year * 12 + ym.month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

function monthLabel(ym: YearMonth): string {
  return `${MESI_IT[ym.month]} ${ym.year}`;
}

/** Griglia del mese (settimane Lunedì→Domenica): date ISO `YYYY-MM-DD` o `null`. */
function buildMonthGrid(ym: YearMonth): (string | null)[] {
  const first = new Date(ym.year, ym.month, 1);
  const offset = (first.getDay() + 6) % 7; // Lunedì = 0
  const daysInMonth = new Date(ym.year, ym.month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toIsoDate(new Date(ym.year, ym.month, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
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
      (Array.isArray(p.serviziInteresse) && p.serviziInteresse.length > 0) ||
      (Array.isArray(p.preferenzeServizi) && p.preferenzeServizi.length > 0) ||
      (Array.isArray(p.dateCandidate) && p.dateCandidate.length > 0)
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

export default function SegreteriaClient({
  initialAppointments,
  initialReservations,
  initialQuickOptions,
}: SegreteriaClientProps) {
  const [list, setList] = useState<Appointment[]>(initialAppointments);
  const reservations = initialReservations;
  const quickOptions = initialQuickOptions;
  const [activeTab, setActiveTab] = useState<TabId>("agenda");
  const [categoria, setCategoria] = useState<CategoriaFilter>("tutti");
  const [soloOggi, setSoloOggi] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  /** Visita attualmente "in corso" nel tour fotografico. */
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  /** Chiave `${appointmentId}::${serviceTitle}` dell'assegnazione in corso. */
  const [tourPendingKey, setTourPendingKey] = useState<string | null>(null);

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

  const activeAppointment = useMemo(
    () => list.find((a) => a.id === activeAppointmentId) || null,
    [list, activeAppointmentId]
  );

  /**
   * Aggiorna lo stato locale dopo un toggle del tour: allinea `preferenzeServizi`
   * e applica la stessa aggiunta/rimozione su `serviziInteresse`.
   */
  const applyTourServices = (
    appointmentId: string,
    allServices: string[],
    title: string,
    added: boolean
  ) => {
    setList((prev) =>
      prev.map((a) => {
        if (a.id !== appointmentId) return a;
        const currentInterest = a.preferenze?.serviziInteresse ?? [];
        const lower = title.toLowerCase();
        const nextInterest = added
          ? currentInterest.some((s) => s.toLowerCase() === lower)
            ? currentInterest
            : [...currentInterest, title]
          : currentInterest.filter((s) => s.toLowerCase() !== lower);
        return {
          ...a,
          preferenze: {
            stileMood: a.preferenze?.stileMood ?? "",
            spaziSelezionati: a.preferenze?.spaziSelezionati ?? [],
            tipoCerimonia: a.preferenze?.tipoCerimonia ?? "",
            serviziInteresse: nextInterest,
            preferenzeServizi: allServices,
            musicaNote: a.preferenze?.musicaNote ?? "",
            celiaciNote: a.preferenze?.celiaciNote ?? "",
            noteGenerali: a.preferenze?.noteGenerali ?? "",
            updated_at: new Date().toISOString(),
          },
        };
      })
    );
  };

  const handleTourAssign = async (
    appointmentId: string,
    serviceTitle: string,
    makeActive = false
  ) => {
    if (makeActive) setActiveAppointmentId(appointmentId);
    setTourPendingKey(`${appointmentId}::${serviceTitle}`);
    try {
      const res = await toggleAppointmentTourServiceAction(appointmentId, serviceTitle);
      if (res.success) {
        applyTourServices(appointmentId, res.allServices, serviceTitle, res.active);
        showFeedback(
          "ok",
          res.active
            ? `"${serviceTitle}" assegnato alla visita.`
            : `"${serviceTitle}" rimosso dalla visita.`
        );
      } else {
        showFeedback("err", res.message || "Impossibile aggiornare la preferenza.");
      }
    } catch {
      showFeedback("err", "Errore di connessione. Riprova.");
    } finally {
      setTourPendingKey(null);
    }
  };

  const handleStartTourFor = (appointmentId: string) => {
    setActiveAppointmentId(appointmentId);
    setActiveTab("tour");
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
          { id: "calendar" as const, icon: "📆", label: "Calendario Disponibilità Location" },
          { id: "tour" as const, icon: "🌿", label: "Tour Fotografico Servizi" },
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
                onStartTour={() => handleStartTourFor(a.id)}
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

      {/* ============================ CALENDARIO ============================ */}
      {activeTab === "calendar" && (
        <CalendarioDisponibilita reservations={reservations} quickOptions={quickOptions} />
      )}

      {/* ============================== TOUR ============================== */}
      {activeTab === "tour" && (
        <TourFotografico
          appointments={list}
          activeAppointmentId={activeAppointmentId}
          onSelectAppointment={setActiveAppointmentId}
          onToggleService={handleTourAssign}
          pendingKey={tourPendingKey}
        />
      )}

      {/* Modale Preferenze */}
      {editing && (
        <PreferenzeModal
          appointment={editing}
          reservations={reservations}
          quickOptions={quickOptions}
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
  onStartTour,
}: {
  appointment: Appointment;
  todayIso: string;
  tomorrowIso: string;
  pending: boolean;
  onStatus: (id: string, stato: Appointment["stato"]) => void;
  onOpenPreferences: () => void;
  onStartTour: () => void;
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

        <button
          type="button"
          onClick={onStartTour}
          style={{
            minHeight: "48px",
            borderRadius: "12px",
            border: "1px solid #cde3d6",
            background: "#f0fdf4",
            color: "#166534",
            fontWeight: 800,
            fontSize: "0.9rem",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          🌿 Fai Tour Fotografico con questa Coppia
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
/* Calendario mensile disponibilità (riutilizzabile)                   */
/* ------------------------------------------------------------------ */

const monthNavBtn: CSSProperties = {
  width: "46px",
  height: "46px",
  borderRadius: "12px",
  border: "1px solid #e0ddd9",
  background: "#fff",
  color: "#1e3a2f",
  fontWeight: 800,
  fontSize: "1rem",
  cursor: "pointer",
  fontFamily: "inherit",
};

function CalendarioMese({
  month,
  onPrev,
  onNext,
  onToday,
  reservations,
  quickOptions,
  selectedDates = [],
  highlightIso,
  onDayClick,
  disableOccupied = false,
  dayCellMinHeight = 76,
}: {
  month: YearMonth;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
  reservations: ReservationLite[];
  quickOptions: QuickCalendarOptionLocal[];
  selectedDates?: string[];
  highlightIso?: string;
  onDayClick?: (iso: string) => void;
  disableOccupied?: boolean;
  dayCellMinHeight?: number;
}) {
  const cells = useMemo(() => buildMonthGrid(month), [month]);
  const todayIso = toIsoDate(new Date());

  return (
    <div>
      {/* Header del mese */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.6rem",
          marginBottom: "0.9rem",
        }}
      >
        <button type="button" onClick={onPrev} aria-label="Mese precedente" style={monthNavBtn}>
          ◀
        </button>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "Georgia, 'Playfair Display', serif",
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#1e3a2f",
            }}
          >
            {monthLabel(month)}
          </div>
          {onToday && (
            <button
              type="button"
              onClick={onToday}
              style={{ ...monthNavBtn, width: "auto", height: "auto", padding: "0.2rem 0.7rem", fontSize: "0.72rem", marginTop: "0.25rem" }}
            >
              Oggi
            </button>
          )}
        </div>
        <button type="button" onClick={onNext} aria-label="Mese successivo" style={monthNavBtn}>
          ▶
        </button>
      </div>

      {/* Giorni della settimana */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.3rem", marginBottom: "0.3rem" }}>
        {GIORNI_SETTIMANA.map((g) => (
          <div
            key={g}
            style={{
              textAlign: "center",
              fontSize: "0.7rem",
              fontWeight: 800,
              color: "#9a948c",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {g}
          </div>
        ))}
      </div>

      {/* Griglia giorni */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.3rem" }}>
        {cells.map((iso, idx) => {
          if (!iso) return <div key={`empty-${idx}`} style={{ minHeight: dayCellMinHeight }} />;
          const av = computeDayAvailability(iso, reservations, quickOptions);
          const isSelected = selectedDates.includes(iso);
          const isToday = iso === todayIso;
          const isHighlight = highlightIso === iso;
          const clickable = Boolean(onDayClick) && (!disableOccupied || av.status !== "occupato");
          const dayNum = Number(iso.slice(8, 10));
          const dow = new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, dayNum).getDay();
          return (
            <button
              key={iso}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onDayClick?.(iso)}
              aria-label={`${formatDataCandidata(iso)} — ${av.label}`}
              aria-pressed={isSelected}
              style={{
                position: "relative",
                minHeight: dayCellMinHeight,
                borderRadius: "12px",
                border: isSelected
                  ? "3px solid #3b82f6"
                  : isHighlight
                    ? "3px solid #1e3a2f"
                    : `1px solid ${av.border}`,
                background: av.bg,
                color: av.color,
                cursor: clickable ? "pointer" : "default",
                opacity: av.status === "occupato" && disableOccupied ? 0.55 : 1,
                fontFamily: "inherit",
                padding: "0.35rem 0.2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.05rem",
              }}
            >
              {isToday && (
                <span style={{ position: "absolute", top: "3px", left: "4px", fontSize: "0.52rem", fontWeight: 800 }}>
                  OGGI
                </span>
              )}
              {isSelected && (
                <span style={{ position: "absolute", top: "1px", right: "3px", fontSize: "0.8rem" }}>🌟</span>
              )}
              <span style={{ fontSize: "1rem", fontWeight: 800, lineHeight: 1 }}>{dayNum}</span>
              <span style={{ fontSize: "0.58rem", fontWeight: 700, opacity: 0.85 }}>{GIORNI[dow]}</span>
              <span style={{ fontSize: "0.8rem", lineHeight: 1 }} aria-hidden>
                {av.status === "libero" ? "🟢" : av.status === "occupato" ? "🔴" : "🟡"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LegendaDisponibilita() {
  const voci: { bg: string; border: string; label: string }[] = [
    { bg: "#dcfce7", border: "#86efac", label: "🟢 Villa Libera" },
    { bg: "#fef3c7", border: "#fcd34d", label: "🟡 Opzionata / Parzialmente occupata" },
    { bg: "#fee2e2", border: "#fca5a5", label: "🔴 Occupata (matrimonio/evento)" },
    { bg: "#dbeafe", border: "#3b82f6", label: "🌟 Data Candidata Sposi" },
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
      {voci.map((v) => (
        <span
          key={v.label}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: v.bg,
            border: `1px solid ${v.border}`,
            borderRadius: "999px",
            padding: "0.35rem 0.8rem",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#3f3a35",
          }}
        >
          {v.label}
        </span>
      ))}
    </div>
  );
}

function CalendarioDisponibilita({
  reservations,
  quickOptions,
}: {
  reservations: ReservationLite[];
  quickOptions: QuickCalendarOptionLocal[];
}) {
  const today = new Date();
  const [month, setMonth] = useState<YearMonth>({ year: today.getFullYear(), month: today.getMonth() });
  const [dayDetail, setDayDetail] = useState<string | null>(null);

  const detail = dayDetail ? computeDayAvailability(dayDetail, reservations, quickOptions) : null;

  return (
    <div>
      <div style={{ marginBottom: "1.2rem" }}>
        <h2
          style={{
            fontFamily: "Georgia, 'Playfair Display', serif",
            fontSize: "1.8rem",
            margin: "0 0 0.35rem 0",
            color: "#1e1b18",
          }}
        >
          📆 Calendario Disponibilità Location
        </h2>
        <p style={{ color: "#57534e", fontSize: "1rem", margin: 0 }}>
          Il colpo d&apos;occhio mensile della villa: usa questa vista per rispondere al telefono e comunicare subito le
          date libere, opzionate o già occupate.
        </p>
      </div>

      <div style={{ marginBottom: "1.2rem" }}>
        <LegendaDisponibilita />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.2rem",
          alignItems: "start",
        }}
      >
        <div style={{ ...cardStyle, padding: "1.3rem 1.4rem" }}>
          <CalendarioMese
            month={month}
            onPrev={() => setMonth((m) => addMonths(m, -1))}
            onNext={() => setMonth((m) => addMonths(m, 1))}
            onToday={() => setMonth({ year: today.getFullYear(), month: today.getMonth() })}
            reservations={reservations}
            quickOptions={quickOptions}
            highlightIso={dayDetail ?? undefined}
            onDayClick={setDayDetail}
            dayCellMinHeight={90}
          />
        </div>

        <div style={{ ...cardStyle, padding: "1.3rem 1.4rem" }}>
          <h3 style={{ margin: "0 0 0.7rem", fontSize: "1.05rem", color: "#1e3a2f" }}>
            {dayDetail ? formatDataCandidata(dayDetail) : "Dettaglio giornata"}
          </h3>
          {detail && dayDetail ? (
            <div style={{ display: "grid", gap: "0.6rem" }}>
              <span
                style={{
                  background: detail.bg,
                  border: `1px solid ${detail.border}`,
                  color: detail.color,
                  borderRadius: "12px",
                  padding: "0.7rem 0.9rem",
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {detail.status === "libero"
                  ? "🟢"
                  : detail.status === "occupato"
                    ? "🔴"
                    : "🟡"}{" "}
                {detail.label}
              </span>
              {detail.status === "semi" && (
                <div style={{ display: "grid", gap: "0.3rem", fontSize: "0.9rem", color: "#57534e" }}>
                  <span>{detail.pranzoOccupato ? "🍽️ Pranzo: impegnato" : "🍽️ Pranzo: libero"}</span>
                  <span>{detail.cenaOccupato ? "🌙 Cena: impegnata" : "🌙 Cena: libera"}</span>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: "#9a948c", fontSize: "0.92rem", margin: 0 }}>
              Tocca un giorno nel calendario per vedere lo stato di disponibilità e comunicarlo al telefono.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Catalogo servizi & spazi integrato nella scheda preferenze          */
/* ------------------------------------------------------------------ */

function CatalogoServizi({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (title: string) => void;
}) {
  const [category, setCategory] = useState<TourCategory | "tutti">("tutti");
  const [search, setSearch] = useState("");
  const [lightbox, setLightbox] = useState<{ gallery: string[]; index: number; title: string } | null>(null);

  const filtered = useMemo(() => {
    const terms = normalize(search).split(/\s+/).filter(Boolean);
    return TOUR_ITEMS.filter((item) => {
      if (category !== "tutti" && item.category !== category) return false;
      if (terms.length === 0) return true;
      const hay = normalize(`${item.name} ${item.moment} ${item.description}`);
      return terms.every((t) => hay.includes(t));
    });
  }, [category, search]);

  const categoryIcon: Record<TourCategory, string> = {
    spazi: "🏛️",
    gastronomia: "🍽️",
    scenografie: "✨",
    rito: "💍",
    openbar: "🍹",
    musica: "🎵",
  };

  const isSelected = (item: TourItem) => selected.some((s) => s.toLowerCase() === item.name.toLowerCase());

  const move = (delta: number) =>
    setLightbox((prev) => {
      if (!prev) return prev;
      const next = (prev.index + delta + prev.gallery.length) % prev.gallery.length;
      return { ...prev, index: next };
    });

  return (
    <div>
      {/* Riepilogo servizi selezionati */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontWeight: 800, color: "#166534", fontSize: "0.9rem", marginBottom: "0.6rem" }}>
          {selected.length} {selected.length === 1 ? "servizio/spazio desiderato" : "servizi/spazi desiderati"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
          {selected.map((s) => (
            <span
              key={s}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                background: "#f0fdf4",
                border: "1px solid #86efac",
                color: "#166534",
                borderRadius: "999px",
                padding: "0.45rem 0.85rem",
                fontWeight: 800,
                fontSize: "0.85rem",
              }}
            >
              ✨ {s}
              <button
                type="button"
                onClick={() => onToggle(s)}
                aria-label={`Rimuovi ${s}`}
                style={{ border: "none", background: "transparent", color: "#166534", fontWeight: 800, cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: 0 }}
              >
                ✕
              </button>
            </span>
          ))}
          {selected.length === 0 && (
            <span style={{ color: "#9a948c", fontStyle: "italic", fontSize: "0.9rem" }}>
              Nessun servizio ancora desiderato: tocca ➕ sulle card qui sotto.
            </span>
          )}
        </div>
      </div>

      {/* Ricerca + filtri */}
      <div style={{ display: "grid", gap: "0.7rem", marginBottom: "1rem" }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Cerca servizio o spazio…"
          aria-label="Cerca servizio o spazio"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "0.8rem 1rem",
            borderRadius: "12px",
            border: "1px solid #e0ddd9",
            fontFamily: "inherit",
            fontSize: "1rem",
            background: "#fff",
            color: "#2c2a27",
          }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
          {TOUR_CATEGORIES.map((c) => (
            <FilterPill key={c.key} active={category === c.key} onClick={() => setCategory(c.key)} tone={c.key === "tutti" ? "orange" : "dark"}>
              {c.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Card catalogo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
        {filtered.map((item) => {
          const preferred = isSelected(item);
          return (
            <div
              key={item.id}
              style={{
                background: "#fff",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                border: preferred ? "2px solid #16a34a" : "1px solid #e5dfd5",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <button
                type="button"
                onClick={() => setLightbox({ gallery: item.gallery, index: 0, title: item.name })}
                aria-label={`Ingrandisci ${item.name}`}
                style={{ padding: 0, border: "none", background: "none", cursor: "zoom-in", position: "relative", height: "160px", width: "100%" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.gallery[0]} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <span
                  style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    background: "rgba(30,27,24,0.85)",
                    color: "#fcfbf9",
                    padding: "3px 8px",
                    borderRadius: "8px",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                  }}
                >
                  {categoryIcon[item.category]} {item.moment}
                </span>
                {preferred && (
                  <span style={{ position: "absolute", top: "8px", right: "8px", background: "#16a34a", color: "#fff", padding: "3px 8px", borderRadius: "8px", fontSize: "0.68rem", fontWeight: 800 }}>
                    ✅ Desiderato
                  </span>
                )}
              </button>

              <div style={{ padding: "0.9rem", flex: 1, display: "flex", flexDirection: "column" }}>
                <h4 style={{ fontFamily: "Georgia, 'Playfair Display', serif", fontSize: "1.02rem", margin: "0 0 0.4rem", color: "#1e1b18" }}>
                  {item.name}
                </h4>
                <p style={{ color: "#57534e", fontSize: "0.84rem", lineHeight: 1.45, margin: "0 0 0.8rem" }}>{item.description}</p>
                <button
                  type="button"
                  onClick={() => onToggle(item.name)}
                  style={{
                    marginTop: "auto",
                    width: "100%",
                    minHeight: "48px",
                    borderRadius: "12px",
                    border: "none",
                    background: preferred
                      ? "linear-gradient(135deg, #16a34a 0%, #15803d 100%)"
                      : "linear-gradient(135deg, #e58c2c 0%, #c9791f 100%)",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    lineHeight: 1.25,
                  }}
                >
                  {preferred ? "✅ Desiderato dagli sposi · Rimuovi ✕" : "➕ Aggiungi ai desideri"}
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", background: "#fff", border: "1px dashed #e0ddd9", borderRadius: "14px", padding: "2rem", textAlign: "center", color: "#9a948c" }}>
            Nessun servizio o spazio corrisponde alla ricerca.
          </div>
        )}
      </div>

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,18,16,0.94)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300, padding: "2rem" }}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Chiudi"
            style={{ position: "absolute", top: "1.2rem", right: "1.4rem", background: "rgba(255,255,255,0.14)", color: "#fff", border: "none", borderRadius: "999px", width: "52px", height: "52px", fontSize: "1.5rem", cursor: "pointer" }}
          >
            ✕
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); move(-1); }} aria-label="Foto precedente" style={lightboxNav("left")}>
            ‹
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.gallery[lightbox.index]}
            alt={lightbox.title}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "min(1100px, 92vw)", maxHeight: "86vh", objectFit: "contain", borderRadius: "14px", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}
          />
          <button type="button" onClick={(e) => { e.stopPropagation(); move(1); }} aria-label="Foto successiva" style={lightboxNav("right")}>
            ›
          </button>
          <div style={{ position: "absolute", bottom: "1.4rem", left: "50%", transform: "translateX(-50%)", color: "#f5efe6", fontWeight: 700, fontSize: "0.95rem", background: "rgba(0,0,0,0.35)", padding: "0.45rem 1rem", borderRadius: "999px" }}>
            {lightbox.title} · {lightbox.index + 1}/{lightbox.gallery.length}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tour fotografico + lightbox                                         */
/* ------------------------------------------------------------------ */

function TourFotografico({
  appointments,
  activeAppointmentId,
  onSelectAppointment,
  onToggleService,
  pendingKey,
}: {
  appointments: Appointment[];
  activeAppointmentId: string | null;
  onSelectAppointment: (id: string | null) => void;
  onToggleService: (appointmentId: string, serviceTitle: string, makeActive?: boolean) => void;
  pendingKey: string | null;
}) {
  const [lightbox, setLightbox] = useState<{ gallery: string[]; index: number; title: string } | null>(null);
  const [category, setCategory] = useState<TourCategory | "tutti">("tutti");
  const [search, setSearch] = useState("");

  const todayIso = toIsoDate(new Date());
  const activeAppointment = appointments.find((a) => a.id === activeAppointmentId) || null;
  const activeName = activeAppointment ? displayName(activeAppointment) : null;

  const filtered = useMemo(() => {
    const terms = normalize(search).split(/\s+/).filter(Boolean);
    return TOUR_ITEMS.filter((item) => {
      if (category !== "tutti" && item.category !== category) return false;
      if (terms.length === 0) return true;
      const hay = normalize(`${item.name} ${item.moment} ${item.description}`);
      return terms.every((t) => hay.includes(t));
    });
  }, [category, search]);

  const preferredList = (): string[] => {
    const p = activeAppointment?.preferenze;
    if (!p) return [];
    if (Array.isArray(p.preferenzeServizi) && p.preferenzeServizi.length > 0) return p.preferenzeServizi;
    return Array.isArray(p.serviziInteresse) ? p.serviziInteresse : [];
  };

  const isPreferred = (item: TourItem): boolean =>
    preferredList().some((s) => s.toLowerCase() === item.name.toLowerCase());

  const close = () => setLightbox(null);
  const move = (delta: number) =>
    setLightbox((prev) => {
      if (!prev) return prev;
      const next = (prev.index + delta + prev.gallery.length) % prev.gallery.length;
      return { ...prev, index: next };
    });

  const categoryIcon: Record<TourCategory, string> = {
    spazi: "🏛️",
    gastronomia: "🍽️",
    scenografie: "✨",
    rito: "💍",
    openbar: "🍹",
    musica: "🎵",
  };

  return (
    <div>
      {/* Banner Visita Sposi in Corso */}
      <div
        style={{
          position: "sticky",
          top: "0.5rem",
          zIndex: 6,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          background: "linear-gradient(135deg, #1e3a2f 0%, #2f5a48 100%)",
          color: "#f5efe6",
          borderRadius: "16px",
          padding: "1rem 1.3rem",
          marginBottom: "1.4rem",
          boxShadow: "0 12px 30px rgba(30,58,47,0.25)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "0.74rem", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 800, color: "#f0c98a" }}>
            👤 Visita Sposi in Corso
          </div>
          <div style={{ fontFamily: "Georgia, 'Playfair Display', serif", fontSize: "1.35rem", fontWeight: 700 }}>
            {activeName || "Nessuna visita selezionata"}
          </div>
          {activeAppointment && (
            <div style={{ fontSize: "0.85rem", opacity: 0.85 }}>
              {formatDataBreve(activeAppointment.dataAppuntamento)}
              {activeAppointment.orarioAppuntamento ? ` · ore ${activeAppointment.orarioAppuntamento}` : ""} ·{" "}
              {preferredList().length} servizi preferiti
            </div>
          )}
        </div>
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.74rem", fontWeight: 800, color: "#f0c98a", minWidth: "min(340px, 100%)" }}>
          Cambia coppia del tour
          <select
            value={activeAppointmentId ?? ""}
            onChange={(e) => onSelectAppointment(e.target.value || null)}
            style={{
              padding: "0.7rem 0.9rem",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.35)",
              background: "#ffffff",
              color: "#1e1b18",
              fontWeight: 700,
              fontSize: "0.95rem",
              fontFamily: "inherit",
              width: "100%",
            }}
          >
            <option value="">— Seleziona una visita —</option>
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                {displayName(a)} · {formatDataBreve(a.dataAppuntamento)}
                {a.dataAppuntamento === todayIso ? " ☀️ Oggi" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: "1.2rem" }}>
        <h2
          style={{
            fontFamily: "Georgia, 'Playfair Display', serif",
            fontSize: "1.8rem",
            margin: "0 0 0.35rem 0",
            color: "#1e1b18",
          }}
        >
          🌿 Tour Fotografico Servizi
        </h2>
        <p style={{ color: "#57534e", fontSize: "1rem", margin: 0 }}>
          Mostra agli sposi gli spazi della villa e tutti i servizi esclusivi del catalogo, con foto in alta
          definizione. Tocca una card per assegnare la preferenza alla visita in corso.
        </p>
      </div>

      {/* Ricerca + filtri categoria */}
      <div style={{ display: "grid", gap: "0.8rem", marginBottom: "1.4rem" }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Cerca servizio o spazio…"
          aria-label="Cerca servizio o spazio"
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {TOUR_CATEGORIES.map((c) => (
            <FilterPill
              key={c.key}
              active={category === c.key}
              onClick={() => setCategory(c.key)}
              tone={c.key === "tutti" ? "orange" : "dark"}
            >
              {c.label}
            </FilterPill>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1.4rem",
        }}
      >
        {filtered.map((item) => {
          const preferred = isPreferred(item);
          const pending = Boolean(
            activeAppointment && pendingKey === `${activeAppointment.id}::${item.name}`
          );
          return (
            <div
              key={item.id}
              style={{
                background: "#fff",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                border: preferred ? "2px solid #16a34a" : "1px solid #e5dfd5",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <button
                type="button"
                onClick={() => setLightbox({ gallery: item.gallery, index: 0, title: item.name })}
                style={{ padding: 0, border: "none", background: "none", cursor: "zoom-in", position: "relative", height: "230px", width: "100%" }}
                aria-label={`Ingrandisci ${item.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.gallery[0]}
                  alt={item.name}
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
                  {categoryIcon[item.category]} {item.moment}
                </span>
                {preferred && (
                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: "#16a34a",
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                    }}
                  >
                    ✅ Preferito
                  </span>
                )}
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
                  {item.name}
                </h3>
                <p style={{ color: "#57534e", fontSize: "0.92rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                  {item.description}
                </p>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", overflowX: "auto" }}>
                  {item.gallery.map((src, idx) => (
                    <button
                      key={src + idx}
                      type="button"
                      onClick={() => setLightbox({ gallery: item.gallery, index: idx, title: item.name })}
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
                      aria-label={`Apri foto ${idx + 1} di ${item.name}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </button>
                  ))}
                </div>

                {/* Box preferenza (cerchiato in rosso nello screenshot) */}
                <div
                  style={{
                    marginTop: "1.1rem",
                    padding: "0.9rem 1rem",
                    borderRadius: "14px",
                    border: "2px solid #e58c2c",
                    background: preferred ? "#f0fdf4" : "#fff7ed",
                  }}
                >
                  {activeAppointment ? (
                    preferred ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onToggleService(activeAppointment.id, item.name)}
                        style={{
                          width: "100%",
                          minHeight: "54px",
                          borderRadius: "12px",
                          border: "none",
                          background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          cursor: pending ? "wait" : "pointer",
                          opacity: pending ? 0.7 : 1,
                          fontFamily: "inherit",
                          lineHeight: 1.3,
                        }}
                      >
                        {pending ? "Aggiornamento… ⏳" : `✅ Preferenza assegnata a ${activeName} · ✕ Rimuovi`}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onToggleService(activeAppointment.id, item.name)}
                        style={{
                          width: "100%",
                          minHeight: "54px",
                          borderRadius: "12px",
                          border: "none",
                          background: "linear-gradient(135deg, #e58c2c 0%, #c9791f 100%)",
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: "0.98rem",
                          cursor: pending ? "wait" : "pointer",
                          opacity: pending ? 0.7 : 1,
                          fontFamily: "inherit",
                        }}
                      >
                        {pending ? "Assegnazione… ⏳" : `➕ Assegna a ${activeName}`}
                      </button>
                    )
                  ) : (
                    <label style={{ display: "grid", gap: "0.4rem" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#7c3f08" }}>
                        Assegna preferenza servizio a visita
                      </span>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) onToggleService(e.target.value, item.name, true);
                        }}
                        style={{
                          padding: "0.75rem 0.9rem",
                          borderRadius: "10px",
                          border: "1px solid #e0ddd9",
                          background: "#fff",
                          color: "#2c2a27",
                          fontWeight: 700,
                          fontFamily: "inherit",
                          fontSize: "0.92rem",
                          minHeight: "50px",
                        }}
                        aria-label={`Assegna ${item.name} a una visita`}
                      >
                        <option value="">➕ Assegna a una visita…</option>
                        {appointments.map((a) => (
                          <option key={a.id} value={a.id}>
                            {displayName(a)} · {formatDataBreve(a.dataAppuntamento)}
                            {a.dataAppuntamento === todayIso ? " ☀️ Oggi" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              background: "#fff",
              border: "1px dashed #e0ddd9",
              borderRadius: "16px",
              padding: "2.4rem",
              textAlign: "center",
              color: "#9a948c",
            }}
          >
            Nessun servizio o spazio corrisponde alla ricerca.
          </div>
        )}
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
    preferenzeServizi: Array.isArray(p?.preferenzeServizi) ? p!.preferenzeServizi : [],
    dateCandidate: Array.isArray(p?.dateCandidate) ? p!.dateCandidate : [],
    mesePreferenza: p?.mesePreferenza || "",
    musicaNote: p?.musicaNote || "",
    celiaciNote: p?.celiaciNote || "",
    noteGenerali: p?.noteGenerali || "",
  };
}

function PreferenzeModal({
  appointment,
  reservations,
  quickOptions,
  onClose,
  onSaved,
}: {
  appointment: Appointment;
  reservations: ReservationLite[];
  quickOptions: QuickCalendarOptionLocal[];
  onClose: () => void;
  onSaved: (prefs: AppointmentPreferences) => void;
}) {
  const [prefs, setPrefs] = useState<AppointmentPreferencesInput>(() => preferencesFromAppointment(appointment));
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [calMonth, setCalMonth] = useState<YearMonth>(() => {
    const parsed = parseMese(prefs.mesePreferenza) || parseMese(appointment.dataEventoPresunta);
    if (parsed) return parsed;
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() };
  });

  const isWedding = appointment.tipo === "wedding";
  const wa = whatsappNumber(appointment.telefono);

  const prefsRef = useRef(prefs);
  const onSavedRef = useRef(onSaved);
  const dirtyRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  // Evita che un debounce pendente scatti dopo la chiusura del componente.
  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  const persist = useCallback(
    async (next: AppointmentPreferencesInput) => {
      setSaveState("saving");
      try {
        const res = await saveAppointmentPreferencesAction(appointment.id, next);
        if (res.success) {
          setSaveState("saved");
          dirtyRef.current = false;
          onSavedRef.current({
            ...next,
            updated_at: new Date().toISOString(),
          } as AppointmentPreferences);
        } else {
          setSaveState("error");
          setMessage({ tone: "err", text: res.message || "Errore durante il salvataggio." });
        }
      } catch {
        setSaveState("error");
        setMessage({ tone: "err", text: "Errore di connessione. Riprova." });
      }
    },
    [appointment.id]
  );

  /** Aggiorna lo state e pianifica il salvataggio (immediato o debounced 500ms). */
  const applyChange = useCallback(
    (updater: (prev: AppointmentPreferencesInput) => AppointmentPreferencesInput, immediate: boolean) => {
      const next = updater(prefsRef.current);
      prefsRef.current = next;
      dirtyRef.current = true;
      setPrefs(next);
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (immediate) {
        void persist(next);
      } else {
        debounceRef.current = window.setTimeout(() => {
          debounceRef.current = null;
          void persist(next);
        }, 500);
      }
    },
    [persist]
  );

  const toggle = (key: "spaziSelezionati" | "serviziInteresse" | "preferenzeServizi", value: string) =>
    applyChange((prev) => {
      const current = prev[key] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      // `preferenzeServizi` e `serviziInteresse` restano allineati tra loro.
      if (key === "preferenzeServizi") {
        const interest = prev.serviziInteresse ?? [];
        const nextInterest = next.includes(value)
          ? interest.includes(value)
            ? interest
            : [...interest, value]
          : interest.filter((v) => v !== value);
        return { ...prev, preferenzeServizi: next, serviziInteresse: nextInterest };
      }
      const tour = prev.preferenzeServizi ?? [];
      const nextTour = next.includes(value)
        ? tour.includes(value)
          ? tour
          : [...tour, value]
        : tour.filter((v) => v !== value);
      return { ...prev, [key]: next, preferenzeServizi: nextTour };
    }, true);

  const setSingle = (key: "stileMood" | "tipoCerimonia", value: string) =>
    applyChange((prev) => ({ ...prev, [key]: prev[key] === value ? "" : value }), true);

  const setNote = (key: "musicaNote" | "celiaciNote" | "noteGenerali", value: string) =>
    applyChange((prev) => ({ ...prev, [key]: value }), false);

  const dateCandidates = prefs.dateCandidate ?? [];

  const changeMonth = (delta: number) => {
    const next = addMonths(calMonth, delta);
    setCalMonth(next);
    applyChange((prev) => ({ ...prev, mesePreferenza: ymKey(next) }), false);
  };

  const toggleDateCandidate = (iso: string) => {
    if (!dateCandidates.includes(iso) && dateCandidates.length >= 4) {
      setMessage({
        tone: "err",
        text: "Puoi selezionare fino a 4 date candidate per la coppia. Rimuovine una per aggiungerne un'altra.",
      });
      window.setTimeout(() => setMessage(null), 3500);
      return;
    }
    applyChange((prev) => {
      const current = prev.dateCandidate ?? [];
      const next = current.includes(iso) ? current.filter((d) => d !== iso) : [...current, iso];
      return { ...prev, dateCandidate: next, mesePreferenza: ymKey(calMonth) };
    }, true);
  };

  const flushAndClose = useCallback(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (dirtyRef.current) {
      void persist(prefsRef.current);
    }
    onClose();
  }, [persist, onClose]);

  const tourServices = prefs.preferenzeServizi ?? [];
  const statusLabel =
    saveState === "saving"
      ? "⏳ Salvataggio in corso..."
      : saveState === "error"
        ? "⚠️ Salvataggio non riuscito"
        : "🟢 Salvato automaticamente ✓";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Compila Preferenze Sposi / Visita"
      onClick={flushAndClose}
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
          <div style={{ display: "grid", justifyItems: "end", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={flushAndClose}
              aria-label="Chiudi"
              style={{
                background: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#6a6764",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
            <span
              role="status"
              style={{
                whiteSpace: "nowrap",
                fontWeight: 800,
                fontSize: "0.82rem",
                padding: "0.4rem 0.8rem",
                borderRadius: "999px",
                background:
                  saveState === "error" ? "#fef2f2" : saveState === "saving" ? "#fffbeb" : "#f0fdf4",
                color:
                  saveState === "error" ? "#991b1b" : saveState === "saving" ? "#92400e" : "#166534",
                border: `1px solid ${
                  saveState === "error" ? "#fecaca" : saveState === "saving" ? "#fcd34d" : "#bbf7d0"
                }`,
              }}
            >
              {statusLabel}
            </span>
            {wa && (
              <a
                href={`https://wa.me/${wa}?text=${encodeURIComponent(
                  `Gentile ${displayName(appointment)}, le scriviamo da La Terra degli Aranci per la sua visita del ${formatDataLunga(
                    appointment.dataAppuntamento
                  )}. Come possiamo aiutarla?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "#25d366",
                  color: "#fff",
                  borderRadius: "999px",
                  padding: "0.4rem 0.9rem",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  textDecoration: "none",
                }}
              >
                💬 WhatsApp rapido
              </a>
            )}
          </div>
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

        {/* Date Desiderate & Disponibilità Calendario */}
        <ModalSection
          icon="📆"
          title="Date Desiderate & Disponibilità Calendario"
          hint="Controlla le date in un attimo. Tocca un giorno libero o opzionato per aggiungerlo alle date candidate (max 4)."
        >
          <div style={{ width: "100%" }}>
            <div style={{ ...cardStyle, padding: "1rem 1.1rem", marginBottom: "0.9rem" }}>
              <CalendarioMese
                month={calMonth}
                onPrev={() => changeMonth(-1)}
                onNext={() => changeMonth(1)}
                reservations={reservations}
                quickOptions={quickOptions}
                selectedDates={dateCandidates}
                onDayClick={toggleDateCandidate}
                disableOccupied
                dayCellMinHeight={68}
              />
            </div>

            <LegendaDisponibilita />

            <div style={{ marginTop: "1rem" }}>
              <div style={{ fontWeight: 800, color: "#1e3a2f", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                {dateCandidates.length}/4 date candidate scelte
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {dateCandidates.map((d) => (
                  <span
                    key={d}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      background: "#eff6ff",
                      border: "2px solid #3b82f6",
                      color: "#1d4ed8",
                      borderRadius: "999px",
                      padding: "0.5rem 0.9rem",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                    }}
                  >
                    📆 {formatDataCandidata(d)}
                    <button
                      type="button"
                      onClick={() => toggleDateCandidate(d)}
                      aria-label={`Rimuovi ${formatDataCandidata(d)}`}
                      style={{ border: "none", background: "transparent", color: "#1d4ed8", fontWeight: 800, cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: 0 }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {dateCandidates.length === 0 && (
                  <span style={{ color: "#9a948c", fontStyle: "italic", fontSize: "0.9rem" }}>
                    Nessuna data candidata: tocca un giorno nel calendario per aggiungerla.
                  </span>
                )}
              </div>
            </div>
          </div>
        </ModalSection>

        {/* Catalogo Servizi & Spazi integrato nella scheda */}
        <ModalSection
          icon="🌿"
          title="Tour Fotografico Servizi & Spazi (integrato)"
          hint="Sfoglia spazi e servizi con foto HD: tocca ➕ per aggiungerli ai desideri degli sposi."
        >
          <div style={{ width: "100%" }}>
            <CatalogoServizi selected={tourServices} onToggle={(title) => toggle("preferenzeServizi", title)} />
          </div>
        </ModalSection>

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
            onChange={(v) => setNote("musicaNote", v)}
            placeholder="Es. Ingresso sposa con arpa, DJ set dopocena anni '90…"
          />
        </ModalSection>

        <ModalSection icon="🍽️" title="Celiaci, Allergie o Intolleranze" hint="Fondamentale per il menù: scrivi tutto con calma.">
          <TextArea
            value={prefs.celiaciNote}
            onChange={(v) => setNote("celiaciNote", v)}
            placeholder="Es. 2 ospiti celiaci, 1 intollerante al lattosio…"
          />
        </ModalSection>

        <ModalSection icon="📝" title="Impressioni Generali della Visita" hint="Sensazioni, richieste speciali, dettagli emersi.">
          <TextArea
            value={prefs.noteGenerali}
            onChange={(v) => setNote("noteGenerali", v)}
            placeholder="Es. molto colpiti dall'agrumeto al tramonto, vorrebbero cerimonia all'aperto…"
          />
        </ModalSection>

        {/* Azioni */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "1.6rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={flushAndClose}
            style={{
              flex: "2 1 320px",
              minHeight: "60px",
              borderRadius: "14px",
              border: "none",
              background: "linear-gradient(135deg, #e58c2c 0%, #c9791f 100%)",
              color: "#fff",
              fontWeight: 800,
              fontSize: "1.1rem",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(229,140,44,0.35)",
              fontFamily: "inherit",
            }}
          >
            ✅ Chiudi e salva
          </button>

          <button
            type="button"
            onClick={() => void persist(prefsRef.current)}
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
            💾 Salva ora
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
