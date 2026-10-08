"use client";

import React, { useMemo, useState } from "react";
import type { Appointment } from "@/lib/localDb";

interface PlannerTicketItem {
  id?: string;
  nome?: string;
  categoria?: string;
  prezzo_unitario?: number;
  quantita?: number;
  azione?: "aggiunta" | "rimozione" | "variazione";
  note?: string;
}

interface PlannerTicket {
  id: string;
  quote_id?: string;
  client_id?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  event_date?: string;
  tipo_evento?: string;
  servizi?: PlannerTicketItem[];
  note_sposi?: string;
  status?: "nuovo" | "in_valutazione" | "approvato" | "rifiutato";
  note_direzione?: string;
  allegato_b_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PlannerEvent {
  id: string;
  coppia: string;
  tipo: "wedding" | "privato";
  dataEvento: string;
  ospiti: number;
  spazi: string[];
  rito: string;
  statoAi: boolean;
  telefono: string;
  email: string;
  /** Ticket Richiesta Servizi inviati dalla coppia per questo evento. */
  tickets?: PlannerTicket[];
  dossier: {
    palette: { nome: string; colori: string[] };
    stile: string;
    intolleranze: { celiaci: number; vegetariani: number; allergieNote: string };
    cronoprogramma: { ora: string; momento: string; luogo: string; note: string }[];
    musica: { rito: string; ingresso: string; balloSposi: string; torta: string; dj: string };
    fornitori: { ruolo: string; nome: string; telefono: string }[];
    /** Voci e servizi inclusi a contratto (descrizioni delle righe `quote.items`). */
    serviziContratto?: string[];
    /** Note generali raccolte dalla coppia (Wedding Diary / quote). */
    noteSposiGenerali?: string;
    notePlanner: string;
  };
}

interface PlannerClientProps {
  appointments?: Appointment[];
  diaries?: any[];
  quotes?: any[];
  clients?: any[];
  tickets?: any[];
}

/** Normalizza per confronti (minuscole, senza accenti). */
function norm(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Converte array o stringa CSV in array di stringhe pulite. */
function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v ?? "").trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/,|\n|;/).map((v) => v.trim()).filter(Boolean);
  return [];
}

/** Primo valore "valorizzato" tra quelli forniti. */
function firstDefined(...values: unknown[]): unknown {
  for (const v of values) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    return v;
  }
  return undefined;
}

/** Deduplica case-insensitive preservando l'ordine. */
function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  values.forEach((v) => {
    const key = v.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(v);
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Wedding/Event Planner — derivazione eventi REALI da quote & diary   */
/* ------------------------------------------------------------------ */

/** Etichette leggibili per le chiavi-formula degli spazi della tenuta. */
const SPACE_LABELS: Record<string, string> = {
  esclusiva: "Tenuta in Esclusiva Totale",
  semi_esclusiva: "Semi-Esclusiva",
  sala_bianca: "Sala Bianca",
  sala_tufo: "Sala Tufo",
  giardino_d_inverno: "Giardino d'Inverno",
  agrumeto: "Agrumeto Storico",
  agrumeto_storico: "Agrumeto Storico",
  terrazza: "Terrazza Panoramica",
  terrazza_panoramica: "Terrazza Panoramica",
  terrazza_taglio_torta: "Terrazza Taglio Torta",
};

/** Metadati visivi per gli stati di un Ticket Richiesta Servizi. */
const TICKET_STATUS_META: Record<string, { label: string; bg: string; color: string; border: string }> = {
  nuovo: { label: "Nuovo", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  in_valutazione: { label: "In Valutazione", bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
  approvato: { label: "Approvato", bg: "#dcfce7", color: "#166534", border: "#86efac" },
  rifiutato: { label: "Rifiutato", bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
};

/** Legge la nota operativa della planner salvata in localStorage per l'evento. */
function readPlannerNoteLocal(id: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(`planner_note_${id}`) || "";
  } catch {
    return "";
  }
}

/** Persiste la nota operativa della planner in localStorage per l'evento. */
function writePlannerNoteLocal(id: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`planner_note_${id}`, value);
  } catch {
    // ignore (storage non disponibile)
  }
}

/** Un evento reale è un contratto firmato/convertito o un'opzione attiva. */
function isRealEvent(quote: any): boolean {
  if (!quote || !quote.id || !quote.data_evento) return false;
  const status = String(quote.status || "").toLowerCase();
  const fase = String(quote.fase_contratto || "").toLowerCase();
  const opzioneAttiva = quote.opzione ? quote.opzione.attiva !== false : false;
  if (status === "firmato" || status === "convertito") return true;
  if (status === "opzione" && (opzioneAttiva || fase === "opzione_rapida")) return true;
  return false;
}

/** Ticket collegati a una quote, dal più recente al più vecchio. */
function ticketsForQuote(tickets: any[], quoteId: string): PlannerTicket[] {
  const id = String(quoteId ?? "").trim().toLowerCase();
  if (!id) return [];
  return tickets
    .filter((t) => String(t?.quote_id ?? "").trim().toLowerCase() === id)
    .map((t) => t as PlannerTicket)
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
}

/** Nome della coppia: nome cliente + partner, in mancanza il cognome. */
function resolveCoppia(client: any, quote: any): string {
  const nome = String(client?.nome ?? quote?.clients?.nome ?? "").trim();
  const cognome = String(client?.cognome ?? quote?.clients?.cognome ?? "").trim();
  const partner = firstDefined(
    client?.sposera_nome,
    client?.partner_nome,
    client?.partnerNome,
    client?.coniuge,
    quote?.partner_nome
  );
  const partnerStr = typeof partner === "string" ? partner.trim() : "";
  if (nome && partnerStr) return `${nome} & ${partnerStr}`;
  return [nome, cognome].filter(Boolean).join(" ").trim() || "Coppia";
}

/** Spazi riservati della quote o dal diary, con etichette leggibili, o default tenuta. */
function resolveSpazi(quote: any, answers: any): string[] {
  const labelify = (value: string): string =>
    SPACE_LABELS[norm(value)] || value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const raw = toArray(
    firstDefined(quote?.spazi_riservati, answers?.preferred_spaces, quote?.spazi_selezionati)
  );
  const mapped = unique(raw.map(labelify).filter(Boolean));
  return mapped.length > 0 ? mapped : ["Tenuta in Esclusiva Totale"];
}

/** Palette cromatica dalle risposte reali del diary (o dichiarata nello stile). */
function buildPalette(answers: any, stile: string): { nome: string; colori: string[] } {
  const rawColori = firstDefined(
    answers?.palette_colors,
    answers?.colori,
    answers?.color_palette,
    answers?.palette
  );
  let colori: string[] = [];
  if (Array.isArray(rawColori)) {
    colori = rawColori.map((c) => String(c ?? "").trim()).filter(Boolean);
  } else if (typeof rawColori === "string") {
    colori = toArray(rawColori).filter((c) => /^#?[0-9a-fA-F]{3,8}$/.test(c));
  }
  const rawNome = firstDefined(answers?.palette_name, answers?.nome_palette);
  const nome = String(rawNome || "").trim() || (stile ? "Palette dallo stile" : "Palette da definire");
  return { nome, colori };
}

/** Intolleranze & celiaci estratti dalle note reali di diary, cliente e quote. */
function parseIntolleranze(
  answers: any,
  client: any,
  quote: any,
  noteSposi: string
): { celiaci: number; vegetariani: number; allergieNote: string } {
  const parts = [
    answers?.dietary_notes,
    client?.memoria?.intolleranze,
    quote?.note_visita_segreteria,
    noteSposi,
  ]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);
  const text = unique(parts).join(" — ");
  const cel = /(\d+)\s*celiac/i.exec(text) || /celiac[^\d]{0,15}(\d+)/i.exec(text);
  const veg = /(\d+)\s*(?:vegetarian|vegan)/i.exec(text) || /(?:vegetarian|vegan)[^\d]{0,15}(\d+)/i.exec(text);
  return {
    celiaci: cel ? Number(cel[1]) || 0 : 0,
    vegetariani: veg ? Number(veg[1]) || 0 : 0,
    allergieNote: text || "Nessuna segnalazione",
  };
}

/** Scelte musicali reali del diary (rito, ingresso, primo ballo, torta, dj). */
function buildMusica(answers: any): { rito: string; ingresso: string; balloSposi: string; torta: string; dj: string } {
  const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
  return {
    rito:
      str(firstDefined(answers?.music_ceremony, answers?.music_rito, answers?.music_preference)) ||
      "Da definire",
    ingresso:
      str(firstDefined(answers?.music_entrance, answers?.ingresso_sposa, answers?.entry_music)) ||
      "Da definire",
    balloSposi: str(firstDefined(answers?.first_dance, answers?.ballo_sposi)) || "Da definire",
    torta:
      str(firstDefined(answers?.cake_cutting, answers?.music_cake, answers?.taglio_torta)) ||
      "Da definire",
    dj:
      str(firstDefined(answers?.dj, answers?.dj_set, answers?.musica_dj, answers?.music_preference)) ||
      "Da definire",
  };
}

/** Scaletta oraria di default (integrabile dalle risposte del diary). */
function buildCronoprogramma(
  tipo: string,
  turno: string,
  rito: string
): { ora: string; momento: string; luogo: string; note: string }[] {
  if (tipo === "wedding") {
    if (turno === "pranzo") {
      return [
        { ora: "11:30", momento: "Arrivo Ospiti & Welcome Drink", luogo: "Agrumeto Storico", note: "Aperitivo di benvenuto" },
        { ora: "12:30", momento: "Cerimonia", luogo: "Giardino delle Promesse", note: rito || "Rito civile/simbolico" },
        { ora: "13:30", momento: "Pranzo Nuziale", luogo: "Sala Bianca", note: "Banchetto Iovino Banqueting" },
        { ora: "16:30", momento: "Taglio della Torta", luogo: "Terrazza Panoramica", note: "Buffet dolci" },
        { ora: "17:30", momento: "After Party", luogo: "Lounge Agrumeto", note: "DJ set & open bar" },
      ];
    }
    return [
      { ora: "17:30", momento: "Arrivo Ospiti & Welcome Drink", luogo: "Agrumeto Storico", note: "Cocktail e finger food" },
      { ora: "18:30", momento: "Cerimonia", luogo: "Giardino delle Promesse", note: rito || "Rito civile/simbolico" },
      { ora: "20:00", momento: "Cena di Gala", luogo: "Sala Tufo", note: "Banchetto Iovino Banqueting" },
      { ora: "22:30", momento: "Taglio della Torta", luogo: "Terrazza Panoramica", note: "Fontane luminose e buffet dolci" },
      { ora: "23:00", momento: "After Party & DJ Set", luogo: "Lounge Agrumeto", note: "Open bar premium" },
    ];
  }
  return [
    { ora: "19:30", momento: "Accoglienza & Cocktail di Benvenuto", luogo: "Agrumeto", note: "Musica lounge" },
    { ora: "21:00", momento: "Servizio Ristorazione", luogo: "Sala dedicata", note: "Banqueting Iovino" },
    { ora: "22:30", momento: "Taglio Torta & Brindisi", luogo: "Terrazza Panoramica", note: "Spettacolo luci" },
    { ora: "23:00", momento: "Festa & DJ Set", luogo: "Lounge Agrumeto", note: "Open bar" },
  ];
}

/** Voci e servizi inclusi a contratto, dalle righe reali di `quote.items`. */
function buildServiziContratto(quote: any): string[] {
  const items = Array.isArray(quote?.items) ? quote.items : [];
  return items
    .map((it: any) => {
      const desc = String(it?.descrizione || it?.nome || "").trim();
      if (!desc) return "";
      const qtyRaw = Number(it?.quantita);
      const qty = Number.isFinite(qtyRaw) ? qtyRaw : 0;
      return qty > 1 ? `${desc} (×${qty})` : desc;
    })
    .filter(Boolean);
}

/**
 * Costruisce gli eventi REALI della planner combinando le quote (contratti
 * firmati e opzioni attive) con i rispettivi clienti, i Wedding Diary e i
 * Ticket Richiesta Servizi inviati dalla coppia.
 */
function buildRealEvents(quotes: any[], diaries: any[], clients: any[], tickets: any[]): PlannerEvent[] {
  const clientById = new Map<string, any>();
  clients.forEach((c) => {
    if (c?.id) clientById.set(String(c.id), c);
  });

  const diaryByQuote = new Map<string, any>();
  const diaryByClient = new Map<string, any>();
  diaries.forEach((d) => {
    if (!d) return;
    if (d.quote_id) diaryByQuote.set(String(d.quote_id), d);
    if (d.client_id) diaryByClient.set(String(d.client_id), d);
  });

  const events: PlannerEvent[] = [];
  quotes.forEach((quote) => {
    if (!isRealEvent(quote)) return;
    const quoteId = String(quote.id);
    const client = quote.clients || (quote.client_id ? clientById.get(String(quote.client_id)) : null) || null;
    const diary =
      diaryByQuote.get(quoteId) ||
      (quote.client_id ? diaryByClient.get(String(quote.client_id)) : null) ||
      null;
    const answers = diary?.answers && typeof diary.answers === "object" ? diary.answers : {};

    const tipo: PlannerEvent["tipo"] = quote.tipo_evento === "wedding" ? "wedding" : "privato";
    const stile = String(
      firstDefined(answers.style_mood, answers.style, answers.Stile_evento, quote.stile_mood, quote.style) ?? ""
    );
    const noteSposiGenerali = String(
      firstDefined(answers.general_notes, answers.notes, quote.note_visita_segreteria) ?? ""
    );
    const rito = String(
      firstDefined(answers.ceremony_type, quote.tipo_cerimonia, quote.formula_opzione) ?? ""
    ).trim() || "Da definire";
    const ospiti =
      Number(firstDefined(answers.guest_count_estimate, quote.numero_ospiti)) || 100;
    const turno = String(quote.turno || "").toLowerCase();
    const diaryTimeline = Array.isArray(answers.cronoprogramma)
      ? answers.cronoprogramma
          .map((row: any) => ({
            ora: String(row?.ora ?? "").trim(),
            momento: String(row?.momento ?? row?.titolo ?? "").trim(),
            luogo: String(row?.luogo ?? "").trim(),
            note: String(row?.note ?? "").trim(),
          }))
          .filter((row: any) => row.ora || row.momento)
      : [];

    events.push({
      id: quoteId,
      coppia: resolveCoppia(client, quote),
      tipo,
      dataEvento: String(quote.data_evento || "").slice(0, 10),
      ospiti,
      spazi: resolveSpazi(quote, answers),
      rito,
      statoAi: true,
      telefono: String(client?.telefono ?? quote?.telefono ?? ""),
      email: String(client?.email ?? quote?.email ?? ""),
      tickets: ticketsForQuote(tickets, quoteId),
      dossier: {
        palette: buildPalette(answers, stile),
        stile: stile || "Stile da definire con la coppia",
        intolleranze: parseIntolleranze(answers, client, quote, noteSposiGenerali),
        cronoprogramma: diaryTimeline.length > 0 ? diaryTimeline : buildCronoprogramma(tipo, turno, rito),
        musica: buildMusica(answers),
        fornitori: [],
        serviziContratto: buildServiziContratto(quote),
        noteSposiGenerali,
        notePlanner: readPlannerNoteLocal(quoteId),
      },
    });
  });

  return events.sort((a, b) => String(a.dataEvento).localeCompare(String(b.dataEvento)));
}

/**
 * Preferenze unificate di una coppia: fonde le risposte del Wedding Diary
 * (Portale Sposi) con le preferenze raccolte dalla Segreteria sull'appuntamento.
 */
interface PrefsEntry {
  id: string;
  coppia: string;
  fonte: string;
  statoLabel: string;
  statoColor: string;
  statoBg: string;
  statoBorder: string;
  dataEvento: string;
  stile: string;
  spazi: string[];
  cerimonia: string;
  musica: string;
  intolleranze: string;
  note: string;
  servizi: string[];
  dateCandidates: string[];
  updatedAt: string;
  contatto: string;
  ticketCount: number;
}

const INITIAL_EVENTS: PlannerEvent[] = [
  {
    id: "evt-1",
    coppia: "Marco & Sofia",
    tipo: "wedding",
    dataEvento: "2027-06-19",
    ospiti: 120,
    spazi: ["L'Agrumeto Storico", "La Sala Tufo", "Terrazza Taglio Torta"],
    rito: "Cerimonia Civile nel Giardino delle Promesse",
    statoAi: true,
    telefono: "+39 333 9876543",
    email: "sposi.ai@laterradegliaranci.it",
    dossier: {
      palette: {
        nome: "Agrumi & Lamina d'Oro",
        colori: ["#e58c2c", "#1e3a2f", "#fef3c7", "#ffffff"],
      },
      stile: "Botanico Chic con illuminazione a catene vintage e mise en place in lino naturale",
      intolleranze: {
        celiaci: 4,
        vegetariani: 6,
        allergieNote: "2 ospiti allergici ai crostacei, 1 intollerante al lattosio severo (preparazione cucina dedicata Iovino Banqueting)",
      },
      cronoprogramma: [
        { ora: "17:30", momento: "Arrivo Ospiti & Welcome Drink", luogo: "Agrumeto Storico", note: "Cocktail floreali all'arancio e finger food caldi" },
        { ora: "18:30", momento: "Rito Civile Panoramico", luogo: "Giardino delle Promesse", note: "Arco botanico e archi di violino acustico dal vivo" },
        { ora: "20:00", momento: "Banchetto Placè", luogo: "Sala Tufo", note: "Cena di gala Iovino Banqueting con 2 primi e 1 secondo d'autore" },
        { ora: "22:30", momento: "Taglio della Torta Sotto le Stelle", luogo: "Terrazza Panoramica", note: "Fontane luminose fredde e gran buffet di dolci" },
        { ora: "23:00", momento: "After Party & DJ Set", luogo: "Lounge Agrumeto", note: "Open bar premium e carretto graffette calde all'arancio" },
      ],
      musica: {
        rito: "Pachelbel - Canone in D (Archi)",
        ingresso: "Coldplay - Viva La Vida",
        balloSposi: "Ed Sheeran - Perfect Symphony",
        torta: "Ennio Morricone - Gabriel's Oboe",
        dj: "Deep House / Revival '90 per dopocena",
      },
      fornitori: [
        { ruolo: "Floral Designer", nome: "Fiori & Zagare Napoli", telefono: "338 1122334" },
        { ruolo: "Fotografo", nome: "Studio Fotografico d'Autore", telefono: "339 4455667" },
        { ruolo: "Musicisti Rito", nome: "Quartetto d'Archi Partenope", telefono: "331 7788990" },
        { ruolo: "DJ Set & Service", nome: "TDA Sound Experience", telefono: "335 9900112" },
      ],
      notePlanner:
        "La sposa tiene particolarmente all'atmosfera a lume di candela per il taglio torta. Verificare la disponibilità del carretto graffette prima delle ore 23:00.",
    },
  },
  {
    id: "evt-2",
    coppia: "Roberto Sola & Partner",
    tipo: "wedding",
    dataEvento: "2026-10-15",
    ospiti: 150,
    spazi: ["Tenuta in Esclusiva Totale"],
    rito: "Rito Simbolico al Tramonto",
    statoAi: true,
    telefono: "+39 335 1234567",
    email: "roberto@laterradegliaranci.it",
    dossier: {
      palette: {
        nome: "Verde Bosco & Terracotta",
        colori: ["#1e3a2f", "#c5a059", "#b45309", "#f8f6f0"],
      },
      stile: "Luxury Mediterranean Gala con allestimento sartoriale e cantina vini campani riserva",
      intolleranze: {
        celiaci: 2,
        vegetariani: 8,
        allergieNote: "Tutti i finger food del buffet di benvenuto senza glutine su richiesta",
      },
      cronoprogramma: [
        { ora: "18:00", momento: "Accoglienza Ospiti", luogo: "Agrumeto", note: "Aperitivo con bollicine e ostriche live" },
        { ora: "19:00", momento: "Cerimonia Simbolica", luogo: "Giardino delle Promesse", note: "Musica jazz soft" },
        { ora: "20:30", momento: "Cena di Gala", luogo: "Sala Tufo & Sala Bianca collegate", note: "Menu 4 portate stellato" },
        { ora: "23:00", momento: "Taglio Torta & Fuochi Freddi", luogo: "Terrazza Belvedere", note: "Spettacolo pirotecnico a tempo di musica" },
      ],
      musica: {
        rito: "Ennio Morricone Medley",
        ingresso: "Stevie Wonder - For Once In My Life",
        balloSposi: "Frank Sinatra - The Way You Look Tonight",
        torta: "Andrea Bocelli - Con Te Partirò",
        dj: "Live Sax & DJ Set",
      },
      fornitori: [
        { ruolo: "Floral Designer", nome: "Garden Luxury Design", telefono: "340 1234567" },
        { ruolo: "Service Luci", nome: "Glow & Sound TDA", telefono: "348 7654321" },
      ],
      notePlanner: "Controllo rigoroso tempi di servizio tra cucina Iovino e momenti musicali.",
    },
  },
  {
    id: "evt-3",
    coppia: "Mario Pepe & Elena",
    tipo: "wedding",
    dataEvento: "2026-11-20",
    ospiti: 130,
    spazi: ["Agrumeto", "Sala Bianca", "Terrazza"],
    rito: "Rito Civile Ufficiale",
    statoAi: true,
    telefono: "+39 331 4455667",
    email: "mario.elena@email.it",
    dossier: {
      palette: {
        nome: "Bianco Puro & Oro Spazzolato",
        colori: ["#ffffff", "#d4af37", "#a1a1aa", "#18181b"],
      },
      stile: "Modern Luxury Glamour",
      intolleranze: {
        celiaci: 3,
        vegetariani: 4,
        allergieNote: "1 celiaco severo con piatto sigillato",
      },
      cronoprogramma: [
        { ora: "12:00", momento: "Aperitivo di Benvenuto", luogo: "Agrumeto", note: "Finger food biologici" },
        { ora: "13:30", momento: "Pranzo Nuziale", luogo: "Sala Bianca", note: "Luce naturale diffusa" },
        { ora: "17:00", momento: "Taglio Torta", luogo: "Terrazza", note: "Buffet dolci e distillati" },
      ],
      musica: {
        rito: "Violoncello Solo",
        ingresso: "U2 - Beautiful Day",
        balloSposi: "John Legend - All of Me",
        torta: "Coldplay - A Sky Full of Stars",
        dj: "Commerciale & Latino Dopocena",
      },
      fornitori: [
        { ruolo: "Fotografo", nome: "Emotion Wedding Photo", telefono: "329 1122334" },
      ],
      notePlanner: "Confermare orario arrivo del celebrante civile del Comune di Napoli per le 11:45.",
    },
  },
  {
    id: "evt-4",
    coppia: "Famiglia Sola (Festa Privata)",
    tipo: "privato",
    dataEvento: "2026-09-28",
    ospiti: 85,
    spazi: ["Agrumeto", "Lounge Bar"],
    rito: "Nessun rito (Compleanno & Anniversario)",
    statoAi: false,
    telefono: "+39 338 9988776",
    email: "festa.sola@email.it",
    dossier: {
      palette: {
        nome: "Sunset Glow & Tangerine",
        colori: ["#e58c2c", "#f59e0b", "#1f2937", "#f3f4f6"],
      },
      stile: "Festa Dinamica ad Isole Gastronomiche & Cocktail Bar",
      intolleranze: {
        celiaci: 1,
        vegetariani: 5,
        allergieNote: "Nessuna allergia severa segnalata",
      },
      cronoprogramma: [
        { ora: "20:00", momento: "Accoglienza & Cocktail di Benvenuto", luogo: "Agrumeto", note: "Musica lounge con DJ set" },
        { ora: "21:00", momento: "Isole Gastronomiche Live", luogo: "Agrumeto", note: "Pizze fritte, primi caldi e fritti della tradizione" },
        { ora: "23:00", momento: "Brindisi & Torta Scenografica", luogo: "Terrazza", note: "Spettacolo luci" },
      ],
      musica: {
        rito: "N/A",
        ingresso: "Dua Lipa - Levitating",
        balloSposi: "N/A",
        torta: "Queen - Don't Stop Me Now",
        dj: "Dance 80/90/2000",
      },
      fornitori: [
        { ruolo: "DJ", nome: "DJ Resident TDA", telefono: "333 5544332" },
      ],
      notePlanner: "Configurare l'open bar fin dalle ore 20:30 per accompagnare il buffet a isole.",
    },
  },
];

export default function PlannerClient({
  appointments = [],
  diaries = [],
  quotes = [],
  clients = [],
  tickets = [],
}: PlannerClientProps) {
  // Eventi REALI: contratti firmati/convertiti e opzioni attive, arricchiti con
  // clienti, Wedding Diary e Ticket Richiesta Servizi della coppia.
  const realEvents = useMemo(
    () => buildRealEvents(quotes, diaries, clients, tickets),
    [quotes, diaries, clients, tickets]
  );
  const [events, setEvents] = useState<PlannerEvent[]>(
    realEvents.length > 0 ? realEvents : INITIAL_EVENTS
  );
  const [activeFilter, setActiveFilter] = useState<"tutti" | "meno6mesi" | "wedding" | "privato">("tutti");
  const [selectedEventForDossier, setSelectedEventForDossier] = useState<PlannerEvent | null>(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [notesSavedBanner, setNotesSavedBanner] = useState(false);

  // Calcolo giorni all'evento
  const getDaysLeft = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const openDossier = (evt: PlannerEvent) => {
    setSelectedEventForDossier(evt);
    setEditingNotes(evt.dossier.notePlanner);
    setNotesSavedBanner(false);
  };

  const saveNotes = () => {
    if (!selectedEventForDossier) return;
    // Persistenza per-evento: la Planner ritrova le sue note al rientro.
    writePlannerNoteLocal(selectedEventForDossier.id, editingNotes);
    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEventForDossier.id
          ? { ...e, dossier: { ...e.dossier, notePlanner: editingNotes } }
          : e
      )
    );
    setSelectedEventForDossier((prev) =>
      prev ? { ...prev, dossier: { ...prev.dossier, notePlanner: editingNotes } } : null
    );
    setNotesSavedBanner(true);
    setTimeout(() => setNotesSavedBanner(false), 3000);
  };

  const filteredEvents = events.filter((evt) => {
    const days = getDaysLeft(evt.dataEvento);
    if (activeFilter === "meno6mesi") return days <= 180 && evt.tipo === "wedding";
    if (activeFilter === "wedding") return evt.tipo === "wedding";
    if (activeFilter === "privato") return evt.tipo === "privato";
    return true;
  });

  const activeUnder6MonthsCount = events.filter(
    (e) => getDaysLeft(e.dataEvento) <= 180 && e.tipo === "wedding"
  ).length;

  /**
   * Preferenze sincronizzate Sposi ↔ Segreteria: unifica le risposte dei
   * `wedding_diaries` (compilate dagli sposi nel portale) con le preferenze
   * raccolte sugli appuntamenti (segreteria in visita). Comprende anche le
   * coppie in opzione / pre-firma, così la planner ha il quadro completo.
   */
  const prefsEntries = useMemo<PrefsEntry[]>(() => {
    const clientById = new Map<string, any>();
    clients.forEach((c) => {
      if (c?.id) clientById.set(c.id, c);
    });

    const matchAppointment = (c: any): Appointment | undefined => {
      if (!c) return undefined;
      const em = norm(c.email);
      const ph = String(c.telefono || "").replace(/\D/g, "");
      const nome = norm(c.nome);
      const cognome = norm(c.cognome);
      return appointments.find((a) => {
        const ae = norm(a.email);
        const ap = String(a.telefono || "").replace(/\D/g, "");
        if (em && ae && em === ae) return true;
        if (ph && ap && ph === ap) return true;
        if (nome && cognome && norm(a.nome) === nome && norm(a.cognome) === cognome) return true;
        return false;
      });
    };

    const build = (d: any | null, c: any | null, appt: Appointment | null): PrefsEntry | null => {
      const ans = d?.answers && typeof d.answers === "object" ? d.answers : {};
      const p = appt?.preferenze;

      const stile = String(
        firstDefined(ans.style_mood, ans.style, ans.Stile_evento, p?.stileMood, d?.style, d?.palette) ?? ""
      );
      const spazi = toArray(firstDefined(ans.preferred_spaces, p?.spaziSelezionati, d?.preferred_spaces));
      const cerimonia = String(firstDefined(ans.ceremony_type, p?.tipoCerimonia) ?? "");
      const musica = String(
        firstDefined(
          ans.music_preference,
          ans.music_preferences,
          ans.Note_che_ci_rappresentano,
          p?.musicaNote,
          d?.music_preferences
        ) ?? ""
      );
      const intolleranze = String(firstDefined(ans.dietary_notes, p?.celiaciNote, d?.dietary_notes) ?? "");
      const note = String(firstDefined(ans.general_notes, ans.notes, p?.noteGenerali, d?.notes) ?? "");
      const dateCandidates = toArray(
        firstDefined(ans.target_dates, ans.la_nostra_data_perfetta, p?.dateCandidate, d?.target_dates)
      );
      const servizi = unique([
        ...toArray(ans.tour_service_preferences),
        ...toArray(ans.open_bar_cocktails),
        ...toArray(ans.matrimonio_su_misura),
        ...toArray(ans.accogliere_accompagnare),
        ...toArray(ans.prima_dopo_matrimonio),
        ...toArray(p?.preferenzeServizi),
        ...toArray(p?.serviziInteresse),
      ]);

      const coppia = c
        ? [c.nome, c.cognome].filter(Boolean).join(" ").trim()
        : appt
          ? [appt.nome, appt.cognome].filter(Boolean).join(" ").trim()
          : `Coppia ${String(d?.client_id || "").slice(0, 6)}`;
      if (!coppia) return null;

      // Stato contratto: match della quote per email o nome cliente.
      const email = norm(c?.email || appt?.email);
      const quote =
        (email ? quotes.find((q) => norm(q?.clients?.email) === email) : undefined) ||
        quotes.find(
          (q) =>
            norm(q?.clients?.nome) === norm(c?.nome) &&
            norm(q?.clients?.cognome) === norm(c?.cognome) &&
            (c?.nome || c?.cognome)
        );
      const status = String(quote?.status || "").toLowerCase();
      const quoteTickets = quote ? ticketsForQuote(tickets, quote.id) : [];
      let statoLabel = "Visita / Pre-Firma";
      let statoColor = "#92400e";
      let statoBg = "#fef3c7";
      let statoBorder = "#fcd34d";
      if (status === "firmato") {
        statoLabel = "Contratto Firmato";
        statoColor = "#166534";
        statoBg = "#dcfce7";
        statoBorder = "#86efac";
      } else if (status) {
        statoLabel = `In Opzione (${quote.status})`;
      }

      const fonti: string[] = [];
      if (d && Object.keys(ans).length > 0) fonti.push("Portale Sposi");
      if (p) fonti.push("Segreteria Visita");

      return {
        id: d?.id || appt?.id || coppia,
        coppia,
        fonte: fonti.join(" + ") || "Segreteria",
        statoLabel,
        statoColor,
        statoBg,
        statoBorder,
        dataEvento: String(quote?.data_evento || appt?.dataEventoPresunta || ""),
        stile,
        spazi,
        cerimonia,
        musica,
        intolleranze,
        note,
        servizi,
        dateCandidates,
        updatedAt: String(d?.updated_at || p?.updated_at || ""),
        contatto: String(c?.telefono || appt?.telefono || ""),
        ticketCount: quoteTickets.length,
      };
    };

    const list: PrefsEntry[] = [];
    const usedApptIds = new Set<string>();

    diaries.forEach((d) => {
      const ans = d?.answers && typeof d.answers === "object" ? d.answers : {};
      const hasAns = Object.keys(ans).length > 0;
      const hasLegacy = Boolean(
        d?.style ||
          d?.palette ||
          d?.dietary_notes ||
          d?.music_preferences ||
          (Array.isArray(d?.preferred_spaces) && d.preferred_spaces.length > 0)
      );
      if (!hasAns && !hasLegacy) return;
      const c = d?.client_id ? clientById.get(d.client_id) : null;
      const appt = matchAppointment(c) || null;
      if (appt) usedApptIds.add(appt.id);
      const entry = build(d, c || null, appt);
      if (entry) list.push(entry);
    });

    appointments.forEach((a) => {
      if (usedApptIds.has(a.id) || !a.preferenze) return;
      const entry = build(null, null, a);
      if (entry) list.push(entry);
    });

    return list;
  }, [appointments, diaries, quotes, clients, tickets]);

  const opzionePrefsCount = prefsEntries.filter((e) => e.statoLabel.startsWith("In Opzione")).length;

  // Ticket della coppia per l'evento attualmente aperto nel Dossier 360°.
  const dossierTickets = selectedEventForDossier?.tickets ?? [];

  return (
    <div>
      {/* Intestazione Sezione */}
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: "Georgia, 'Playfair Display', serif",
            fontSize: "2rem",
            margin: "0 0 0.5rem 0",
            color: "#1e1b18",
          }}
        >
          Panoramica Eventi & Dossier 360° Sposi
        </h2>
        <p style={{ color: "#57534e", fontSize: "1rem", margin: 0 }}>
          Coordinamento operativo a <strong>-6 mesi dall&apos;evento</strong>: consulta il dossier già alimentato silenziosamente dall&apos;AI Concierge durante i primi mesi e gestisci la regia con la coppia.
        </p>
      </div>

      {/* KPI Bar Planner */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.2rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "1.4rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            border: "1px solid #e7e2d9",
          }}
        >
          <div style={{ color: "#78716c", fontSize: "0.85rem", fontWeight: 600 }}>
            EVENTI ASSEGNATI
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#1e1b18", margin: "0.3rem 0" }}>
            {events.length}
          </div>
          <small style={{ color: "#059669", fontWeight: 600 }}>Matrimoni & Feste TDA</small>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "1.4rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            border: "2px solid #8b5cf6",
          }}
        >
          <div style={{ color: "#8b5cf6", fontSize: "0.85rem", fontWeight: 700 }}>
            FINESTRA -6 MESI ATTIVA
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#6b21a8", margin: "0.3rem 0" }}>
            {activeUnder6MonthsCount}
          </div>
          <small style={{ color: "#6b21a8", fontWeight: 600 }}>Subentro Priorità Alta</small>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "1.4rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            border: "1px solid #e7e2d9",
          }}
        >
          <div style={{ color: "#78716c", fontSize: "0.85rem", fontWeight: 600 }}>
            PROSSIMI 45 GIORNI
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#e58c2c", margin: "0.3rem 0" }}>
            {events.filter((e) => getDaysLeft(e.dataEvento) <= 45).length}
          </div>
          <small style={{ color: "#b45309", fontWeight: 600 }}>Regia Finale & Scalette</small>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "1.4rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            border: "1px solid #e7e2d9",
          }}
        >
          <div style={{ color: "#78716c", fontSize: "0.85rem", fontWeight: 600 }}>
            DOSSIER AI PRE-POPOLATI
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#10b981", margin: "0.3rem 0" }}>
            {events.filter((e) => e.statoAi).length}
          </div>
          <small style={{ color: "#047857", fontWeight: 600 }}>Zero Domande Duplicate</small>
        </div>
      </div>

      {/* ===== PREFERENZE SINCRONIZZATE SPOSI ↔ SEGRETERIA ===== */}
      {prefsEntries.length > 0 && (
        <div style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.6rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: "Georgia, 'Playfair Display', serif",
                  fontSize: "1.55rem",
                  margin: 0,
                  color: "#1e1b18",
                }}
              >
                📖 Wedding Diary &amp; Preferenze Sincronizzate
              </h3>
              <p style={{ margin: "0.3rem 0 0", color: "#57534e", fontSize: "0.95rem", maxWidth: "840px" }}>
                Quadro unico Sposi ↔ Segreteria: stile, spazi della tenuta, rito, musica, note alimentari
                (Iovino Banqueting) e date candidate. Include anche le coppie in{" "}
                <strong>opzione / pre-firma</strong> che hanno già compilato il Diary nel portale.
              </p>
            </div>
            {opzionePrefsCount > 0 && (
              <span
                style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  border: "1px solid #fcd34d",
                  borderRadius: "999px",
                  padding: "0.35rem 0.9rem",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                }}
              >
                ⏳ {opzionePrefsCount} in opzione con preferenze
              </span>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "1.2rem",
            }}
          >
            {prefsEntries.map((entry) => {
              const hasDiet = entry.intolleranze.trim().length > 0;
              return (
                <div
                  key={entry.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    padding: "1.4rem",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                    border: "1px solid #e7e2d9",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.85rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.6rem" }}>
                    <div>
                      <h4
                        style={{
                          fontFamily: "Georgia, 'Playfair Display', serif",
                          fontSize: "1.25rem",
                          margin: 0,
                          color: "#1e1b18",
                        }}
                      >
                        {entry.coppia}
                      </h4>
                      <div style={{ fontSize: "0.82rem", color: "#78716c", marginTop: "0.15rem" }}>
                        {entry.dataEvento ? `📅 ${entry.dataEvento}` : "📅 Data da definire"}
                        {entry.contatto ? ` · 📞 ${entry.contatto}` : ""}
                      </div>
                    </div>
                    <span
                      style={{
                        background: entry.statoBg,
                        color: entry.statoColor,
                        border: `1px solid ${entry.statoBorder}`,
                        borderRadius: "999px",
                        padding: "0.25rem 0.7rem",
                        fontSize: "0.74rem",
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.statoLabel}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    <span
                      style={{
                        background: "#f5f3ff",
                        color: "#6d28d9",
                        border: "1px solid #ddd6fe",
                        borderRadius: "999px",
                        padding: "0.2rem 0.65rem",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                      }}
                    >
                      🔄 Fonte: {entry.fonte}
                    </span>
                    {entry.dateCandidates.length > 0 && (
                      <span
                        style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                          borderRadius: "999px",
                          padding: "0.2rem 0.65rem",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                        }}
                      >
                        📆 {entry.dateCandidates.length} date candidate
                      </span>
                    )}
                    {entry.ticketCount > 0 && (
                      <span
                        style={{
                          background: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #fcd34d",
                          borderRadius: "999px",
                          padding: "0.2rem 0.65rem",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                        }}
                      >
                        🎫 {entry.ticketCount} {entry.ticketCount === 1 ? "Dubbio/Richiesta Sposi" : "Dubbi/Richieste Sposi"}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "grid", gap: "0.55rem", fontSize: "0.88rem" }}>
                    {entry.stile && (
                      <div>
                        <strong style={{ color: "#514d48" }}>🎨 Stile:</strong>{" "}
                        <span style={{ color: "#44403c" }}>{entry.stile}</span>
                      </div>
                    )}
                    {entry.spazi.length > 0 && (
                      <div>
                        <strong style={{ color: "#514d48" }}>🏛️ Spazi:</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.3rem" }}>
                          {entry.spazi.map((s, i) => (
                            <span
                              key={i}
                              style={{
                                background: "#f0f4f8",
                                color: "#1c4f82",
                                borderRadius: "6px",
                                padding: "0.15rem 0.5rem",
                                fontSize: "0.76rem",
                                fontWeight: 600,
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {entry.cerimonia && (
                      <div>
                        <strong style={{ color: "#514d48" }}>💍 Rito:</strong>{" "}
                        <span style={{ color: "#44403c" }}>{entry.cerimonia}</span>
                      </div>
                    )}
                    {entry.musica && (
                      <div>
                        <strong style={{ color: "#514d48" }}>🎵 Musica:</strong>{" "}
                        <span style={{ color: "#44403c" }}>{entry.musica}</span>
                      </div>
                    )}
                    <div>
                      <strong style={{ color: "#b91c1c" }}>🍽️ Note alimentari / celiaci:</strong>{" "}
                      <span
                        style={{
                          color: hasDiet ? "#991b1b" : "#166534",
                          background: hasDiet ? "#fef2f2" : "#f0fdf4",
                          border: `1px solid ${hasDiet ? "#fecaca" : "#bbf7d0"}`,
                          borderRadius: "8px",
                          padding: "0.15rem 0.5rem",
                          fontSize: "0.82rem",
                        }}
                      >
                        {hasDiet ? entry.intolleranze : "Nessuna segnalazione"}
                      </span>
                    </div>
                    {entry.servizi.length > 0 && (
                      <div>
                        <strong style={{ color: "#514d48" }}>
                          💎 Servizi d&apos;interesse ({entry.servizi.length}):
                        </strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.3rem" }}>
                          {entry.servizi.map((s, i) => (
                            <span
                              key={i}
                              style={{
                                background: "#f0fdf4",
                                color: "#166534",
                                border: "1px solid #bbf7d0",
                                borderRadius: "999px",
                                padding: "0.15rem 0.55rem",
                                fontSize: "0.74rem",
                                fontWeight: 600,
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {entry.dateCandidates.length > 0 && (
                      <div>
                        <strong style={{ color: "#1d4ed8" }}>📆 Date candidate:</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.3rem" }}>
                          {entry.dateCandidates.map((d, i) => (
                            <span
                              key={i}
                              style={{
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                border: "1px solid #bfdbfe",
                                borderRadius: "999px",
                                padding: "0.15rem 0.55rem",
                                fontSize: "0.74rem",
                                fontWeight: 600,
                              }}
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {entry.note && (
                      <div>
                        <strong style={{ color: "#514d48" }}>📝 Note sposi:</strong>{" "}
                        <span style={{ color: "#44403c" }}>{entry.note}</span>
                      </div>
                    )}
                  </div>

                  {entry.updatedAt && (
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "#a8a29e",
                        borderTop: "1px solid #f0ede7",
                        paddingTop: "0.6rem",
                      }}
                    >
                      Ultimo aggiornamento: {new Date(entry.updatedAt).toLocaleString("it-IT")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtri Rapidi */}
      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { key: "tutti", label: "Tutti gli Eventi" },
          { key: "meno6mesi", label: "⏳ Matrimoni a -6 Mesi" },
          { key: "wedding", label: "👰 Tutti i Matrimoni" },
          { key: "privato", label: "🎉 Feste ed Eventi Privati" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActiveFilter(f.key as any)}
            style={{
              minHeight: "44px",
              padding: "0 1.2rem",
              borderRadius: "10px",
              border: activeFilter === f.key ? "none" : "1px solid #d6cebf",
              background: activeFilter === f.key ? "#1e3a2f" : "#ffffff",
              color: activeFilter === f.key ? "#ffffff" : "#44403c",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Elenco Card Eventi */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", marginBottom: "3rem" }}>
        {filteredEvents.map((evt) => {
          const daysLeft = getDaysLeft(evt.dataEvento);
          const isPriority = daysLeft <= 180;
          return (
            <div
              key={evt.id}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "1.5rem 2rem",
                boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                border: isPriority ? "2px solid #e58c2c" : "1px solid #e7e2d9",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1.5rem",
              }}
            >
              <div style={{ flex: 2, minWidth: "280px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: evt.tipo === "wedding" ? "#fdf2f8" : "#ecfdf5",
                      color: evt.tipo === "wedding" ? "#db2777" : "#059669",
                      border: `1px solid ${evt.tipo === "wedding" ? "#fbcfe8" : "#a7f3d0"}`,
                    }}
                  >
                    {evt.tipo === "wedding" ? "MATRIMONIO" : "EVENTO PRIVATO"}
                  </span>

                  {evt.statoAi && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      🤖 Dossier AI Pre-Compilato
                    </span>
                  )}

                  {(evt.tickets?.length ?? 0) > 0 && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fcd34d",
                      }}
                    >
                      🎫 {evt.tickets!.length}{" "}
                      {evt.tickets!.length === 1 ? "Dubbio/Richiesta Sposi" : "Dubbi/Richieste Sposi"}
                    </span>
                  )}
                </div>

                <h3
                  style={{
                    fontFamily: "Georgia, 'Playfair Display', serif",
                    fontSize: "1.5rem",
                    margin: "0 0 0.4rem 0",
                    color: "#1e1b18",
                  }}
                >
                  {evt.coppia}
                </h3>

                <div style={{ color: "#57534e", fontSize: "0.92rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                  <span>📅 Data: <strong>{evt.dataEvento}</strong></span>
                  <span>👥 Ospiti: <strong>{evt.ospiti} presunti</strong></span>
                  <span>📍 Spazi: <strong>{evt.spazi.join(", ")}</strong></span>
                </div>
              </div>

              {/* Countdown Badge */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isPriority ? "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)" : "#f8f6f2",
                  border: isPriority ? "1px solid #fbd38d" : "1px solid #e7e2d9",
                  padding: "0.8rem 1.4rem",
                  borderRadius: "12px",
                  minWidth: "120px",
                }}
              >
                <span
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 800,
                    color: isPriority ? "#e58c2c" : "#57534e",
                    lineHeight: 1,
                  }}
                >
                  {daysLeft}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: isPriority ? "#b45309" : "#78716c",
                    marginTop: "4px",
                  }}
                >
                  Giorni Rimasti
                </span>
              </div>

              {/* Pulsante Apri Dossier */}
              <div>
                <button
                  type="button"
                  onClick={() => openDossier(evt)}
                  style={{
                    minHeight: "48px",
                    padding: "0 1.6rem",
                    borderRadius: "10px",
                    border: "none",
                    background: "#1e3a2f",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    boxShadow: "0 3px 10px rgba(30,58,47,0.2)",
                  }}
                >
                  <span>📋</span>
                  <span>Apri Dossier 360°</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL / DRAWER: DOSSIER 360° SPOSI */}
      {/* ========================================================================= */}
      {selectedEventForDossier && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 200,
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "960px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header Modale */}
            <div
              style={{
                padding: "1.5rem 2rem",
                borderBottom: "1px solid #e7e2d9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                background: "#faf8f5",
                borderTopLeftRadius: "20px",
                borderTopRightRadius: "20px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", color: "#8b5cf6", fontWeight: 700 }}>
                    DOSSIER 360° REGIA EVENTO
                  </span>
                  <span style={{ fontSize: "0.75rem", background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                    🤖 Dati Alimentati dall&apos;AI Concierge
                  </span>
                </div>
                <h2
                  style={{
                    fontFamily: "Georgia, 'Playfair Display', serif",
                    fontSize: "1.8rem",
                    margin: "0 0 0.3rem 0",
                    color: "#1e1b18",
                  }}
                >
                  {selectedEventForDossier.coppia}
                </h2>
                <div style={{ color: "#57534e", fontSize: "0.9rem" }}>
                  Data: <strong>{selectedEventForDossier.dataEvento}</strong> • Rito: <strong>{selectedEventForDossier.rito}</strong>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    minHeight: "44px",
                    padding: "0 1.1rem",
                    borderRadius: "10px",
                    border: "1px solid #1e3a2f",
                    background: "#ffffff",
                    color: "#1e3a2f",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    cursor: "pointer",
                  }}
                >
                  <span>🖨️</span>
                  <span>Stampa Scheda Sala & Cucina</span>
                </button>

                <a
                  href={`https://wa.me/${selectedEventForDossier.telefono.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    minHeight: "44px",
                    padding: "0 1.2rem",
                    borderRadius: "10px",
                    border: "none",
                    background: "#25d366",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    textDecoration: "none",
                  }}
                >
                  <span>💬</span>
                  <span>WhatsApp Sposi</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedEventForDossier(null)}
                  style={{
                    minHeight: "44px",
                    width: "44px",
                    borderRadius: "50%",
                    border: "1px solid #d6cebf",
                    background: "#ffffff",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenuto Modale */}
            <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* SEZIONE CHIAVE: Storico Ticket, Dubbi & Richieste Sposi */}
              <div
                style={{
                  border: "2px solid #fcd34d",
                  background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                  borderRadius: "14px",
                  padding: "1.3rem 1.4rem",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.2rem",
                    color: "#92400e",
                    margin: "0 0 0.5rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>🎫</span>
                  <span>Storico Ticket, Dubbi &amp; Richieste Sposi</span>
                </h3>
                <p style={{ margin: "0 0 0.9rem", color: "#78350f", fontSize: "0.88rem" }}>
                  Tutti i ticket aperti dalla coppia su questo evento: servizi richiesti, dubbi e note,
                  con l&apos;esito della direzione.
                </p>

                {dossierTickets.length === 0 ? (
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px dashed #fcd34d",
                      borderRadius: "10px",
                      padding: "0.9rem 1rem",
                      color: "#92400e",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    Nessun dubbio o ticket aggiuntivo aperto dalla coppia.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    {dossierTickets.map((ticket, idx) => {
                      const meta =
                        TICKET_STATUS_META[String(ticket.status || "nuovo")] || TICKET_STATUS_META.nuovo;
                      const servizi = Array.isArray(ticket.servizi) ? ticket.servizi : [];
                      return (
                        <div
                          key={ticket.id || idx}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #fde68a",
                            borderRadius: "12px",
                            padding: "1rem 1.1rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "0.6rem",
                              flexWrap: "wrap",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <span style={{ fontSize: "0.8rem", color: "#78716c", fontWeight: 700 }}>
                              {ticket.created_at
                                ? `🗓️ ${new Date(ticket.created_at).toLocaleString("it-IT")}`
                                : "🗓️ Data non disponibile"}
                            </span>
                            <span
                              style={{
                                background: meta.bg,
                                color: meta.color,
                                border: `1px solid ${meta.border}`,
                                borderRadius: "999px",
                                padding: "0.2rem 0.7rem",
                                fontSize: "0.74rem",
                                fontWeight: 800,
                              }}
                            >
                              {meta.label}
                            </span>
                          </div>

                          {servizi.length > 0 && (
                            <div
                              style={{
                                marginBottom:
                                  ticket.note_sposi || ticket.note_direzione ? "0.7rem" : 0,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  textTransform: "uppercase",
                                  letterSpacing: "1px",
                                  color: "#9a948c",
                                  fontWeight: 800,
                                }}
                              >
                                Servizi richiesti ({servizi.length})
                              </span>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "0.35rem",
                                  marginTop: "0.35rem",
                                }}
                              >
                                {servizi.map((s, i) => (
                                  <span
                                    key={s.id || i}
                                    style={{
                                      background: "#f8f6f2",
                                      border: "1px solid #e7e2d9",
                                      borderRadius: "8px",
                                      padding: "0.2rem 0.6rem",
                                      fontSize: "0.78rem",
                                      color: "#44403c",
                                    }}
                                  >
                                    {s.azione === "rimozione" ? "− " : s.azione === "variazione" ? "↻ " : "+ "}
                                    {s.nome || "Servizio"}
                                    {Number(s.quantita) > 1 ? ` ×${s.quantita}` : ""}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {ticket.note_sposi && (
                            <div style={{ marginBottom: ticket.note_direzione ? "0.6rem" : 0 }}>
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  textTransform: "uppercase",
                                  letterSpacing: "1px",
                                  color: "#9a948c",
                                  fontWeight: 800,
                                }}
                              >
                                Dubbio / Nota degli Sposi
                              </span>
                              <p
                                style={{
                                  margin: "0.25rem 0 0",
                                  color: "#514d48",
                                  fontSize: "0.9rem",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {ticket.note_sposi}
                              </p>
                            </div>
                          )}

                          {ticket.note_direzione && (
                            <div
                              style={{
                                background: "#fdf8f1",
                                border: "1px solid #efe7db",
                                borderRadius: "8px",
                                padding: "0.6rem 0.8rem",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  textTransform: "uppercase",
                                  letterSpacing: "1px",
                                  color: "#9a948c",
                                  fontWeight: 800,
                                }}
                              >
                                Nota della Direzione
                              </span>
                              <p
                                style={{
                                  margin: "0.25rem 0 0",
                                  color: "#514d48",
                                  fontSize: "0.88rem",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {ticket.note_direzione}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div
                  style={{
                    marginTop: "0.9rem",
                    background: "rgba(255,255,255,0.75)",
                    border: "1px solid #fde68a",
                    borderRadius: "10px",
                    padding: "0.8rem 1rem",
                    color: "#78350f",
                    fontSize: "0.86rem",
                    lineHeight: 1.5,
                  }}
                >
                  💡 <strong>Insight per Elena (Wedding Planner):</strong> Conoscere i dubbi e le richieste
                  pregresse della coppia (anche se rifiutate o variate dalla direzione) ti permette di
                  anticipare le loro esigenze e curare l&apos;esperienza dell&apos;evento al millimetro.
                </div>
              </div>

              {/* Wedding Diary & Preferenze complete */}
              <div>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    color: "#1e3a2f",
                    margin: "0 0 0.8rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>📖</span>
                  <span>Wedding Diary — Rito, Spazi &amp; Note degli Sposi</span>
                </h3>
                <div
                  style={{
                    background: "#fbf9f5",
                    padding: "1.2rem",
                    borderRadius: "12px",
                    border: "1px solid #e7e2d9",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.7rem",
                    fontSize: "0.92rem",
                  }}
                >
                  <div>
                    <strong style={{ color: "#514d48" }}>💍 Rito:</strong>{" "}
                    <span style={{ color: "#44403c" }}>{selectedEventForDossier.rito}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#514d48" }}>🏛️ Spazi riservati:</strong>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.3rem" }}>
                      {selectedEventForDossier.spazi.map((s, i) => (
                        <span
                          key={i}
                          style={{
                            background: "#f0f4f8",
                            color: "#1c4f82",
                            borderRadius: "6px",
                            padding: "0.15rem 0.5rem",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: "#514d48" }}>📝 Note sposi:</strong>{" "}
                    <span style={{ color: "#44403c" }}>
                      {selectedEventForDossier.dossier.noteSposiGenerali &&
                      selectedEventForDossier.dossier.noteSposiGenerali.trim()
                        ? selectedEventForDossier.dossier.noteSposiGenerali
                        : "Nessuna nota generale lasciata dalla coppia."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Voci e servizi inclusi a contratto */}
              <div>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    color: "#1e3a2f",
                    margin: "0 0 0.8rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>📦</span>
                  <span>Voci e Servizi Inclusi a Contratto</span>
                </h3>
                {(selectedEventForDossier.dossier.serviziContratto ?? []).length === 0 ? (
                  <div
                    style={{
                      background: "#fbf9f5",
                      border: "1px dashed #d6cebf",
                      borderRadius: "10px",
                      padding: "0.9rem 1rem",
                      color: "#78716c",
                      fontSize: "0.9rem",
                    }}
                  >
                    Nessuna voce di servizio registrata nel contratto.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: "0.6rem",
                    }}
                  >
                    {(selectedEventForDossier.dossier.serviziContratto ?? []).map((s, i) => (
                      <div
                        key={i}
                        style={{
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: "10px",
                          padding: "0.7rem 0.9rem",
                          color: "#166534",
                          fontSize: "0.88rem",
                          fontWeight: 600,
                        }}
                      >
                        ✅ {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sezione 1: Palette Colori & Stile */}
              <div>
                <h3 style={{ fontSize: "1.15rem", color: "#1e3a2f", margin: "0 0 0.8rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>🎨</span>
                  <span>Palette Cromatica & Allestimenti Concordati</span>
                </h3>
                <div style={{ background: "#fbf9f5", padding: "1.2rem", borderRadius: "12px", border: "1px solid #e7e2d9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.8rem" }}>
                    <strong>{selectedEventForDossier.dossier.palette.nome}:</strong>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {selectedEventForDossier.dossier.palette.colori.map((c, i) => (
                        <div
                          key={i}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: c,
                            border: "2px solid #ffffff",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                          }}
                          title={c}
                        />
                      ))}
                      {selectedEventForDossier.dossier.palette.colori.length === 0 && (
                        <small style={{ color: "#a8a29e", fontStyle: "italic" }}>
                          Nessuna palette specificata nel Wedding Diary.
                        </small>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: 0, color: "#44403c", fontSize: "0.95rem" }}>
                    {selectedEventForDossier.dossier.stile}
                  </p>
                </div>
              </div>

              {/* Sezione 2: Intolleranze & Celiaci */}
              <div>
                <h3 style={{ fontSize: "1.15rem", color: "#b91c1c", margin: "0 0 0.8rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>🥗</span>
                  <span>Allergie, Intolleranze & Regime Celiaci (Iovino Banqueting)</span>
                </h3>
                <div style={{ background: "#fef2f2", padding: "1.2rem", borderRadius: "12px", border: "1px solid #fecaca" }}>
                  <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.6rem" }}>
                    <div style={{ color: "#991b1b", fontWeight: 700, fontSize: "0.95rem" }}>
                      🌾 Celiaci Certificati: <strong>{selectedEventForDossier.dossier.intolleranze.celiaci} ospiti</strong>
                    </div>
                    <div style={{ color: "#991b1b", fontWeight: 700, fontSize: "0.95rem" }}>
                      🥦 Vegetariani / Vegani: <strong>{selectedEventForDossier.dossier.intolleranze.vegetariani} ospiti</strong>
                    </div>
                  </div>
                  <div style={{ color: "#7f1d1d", fontSize: "0.92rem", lineHeight: 1.5 }}>
                    <strong>Note Operative Cucina:</strong> {selectedEventForDossier.dossier.intolleranze.allergieNote}
                  </div>
                </div>
              </div>

              {/* Sezione 3: Cronoprogramma & Regia Oraria */}
              <div>
                <h3 style={{ fontSize: "1.15rem", color: "#1e3a2f", margin: "0 0 0.8rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>⏰</span>
                  <span>Cronoprogramma & Scaletta della Giornata</span>
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {selectedEventForDossier.dossier.cronoprogramma.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        padding: "0.9rem 1.2rem",
                        background: "#fbf9f5",
                        borderRadius: "10px",
                        border: "1px solid #e7e2d9",
                      }}
                    >
                      <span
                        style={{
                          background: "#e58c2c",
                          color: "#ffffff",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          minWidth: "52px",
                          textAlign: "center",
                        }}
                      >
                        {c.ora}
                      </span>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: "0.95rem", color: "#1e1b18" }}>{c.momento}</strong>
                        <div style={{ fontSize: "0.85rem", color: "#57534e" }}>
                          Spazio: <em>{c.luogo}</em> • {c.note}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sezione 4: Musica & Playlist */}
              <div>
                <h3 style={{ fontSize: "1.15rem", color: "#1e3a2f", margin: "0 0 0.8rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>🎵</span>
                  <span>Scelte Musicali & Momenti Chiave</span>
                </h3>
                <div style={{ background: "#fbf9f5", padding: "1.2rem", borderRadius: "12px", border: "1px solid #e7e2d9", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.8rem" }}>
                  <div>
                    <small style={{ color: "#78716c", display: "block" }}>Musica Rito:</small>
                    <strong style={{ fontSize: "0.9rem" }}>{selectedEventForDossier.dossier.musica.rito}</strong>
                  </div>
                  <div>
                    <small style={{ color: "#78716c", display: "block" }}>Ingresso Sala:</small>
                    <strong style={{ fontSize: "0.9rem" }}>{selectedEventForDossier.dossier.musica.ingresso}</strong>
                  </div>
                  <div>
                    <small style={{ color: "#78716c", display: "block" }}>Primo Ballo Sposi:</small>
                    <strong style={{ fontSize: "0.9rem" }}>{selectedEventForDossier.dossier.musica.balloSposi}</strong>
                  </div>
                  <div>
                    <small style={{ color: "#78716c", display: "block" }}>Taglio Torta:</small>
                    <strong style={{ fontSize: "0.9rem" }}>{selectedEventForDossier.dossier.musica.torta}</strong>
                  </div>
                </div>
              </div>

              {/* Sezione 5: Fornitori Coinvolti */}
              <div>
                <h3 style={{ fontSize: "1.15rem", color: "#1e3a2f", margin: "0 0 0.8rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>💐</span>
                  <span>Fornitori Esterni & Contatti</span>
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.8rem" }}>
                  {selectedEventForDossier.dossier.fornitori.map((f, i) => (
                    <div key={i} style={{ padding: "0.8rem 1rem", background: "#fbf9f5", borderRadius: "10px", border: "1px solid #e7e2d9" }}>
                      <div style={{ fontSize: "0.78rem", color: "#e58c2c", fontWeight: 700, textTransform: "uppercase" }}>
                        {f.ruolo}
                      </div>
                      <strong style={{ fontSize: "0.92rem", color: "#1e1b18", display: "block" }}>{f.nome}</strong>
                      <small style={{ color: "#57534e" }}>Tel: {f.telefono}</small>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sezione 6: Note Operative Planner (Modificabili) */}
              <div>
                <h3 style={{ fontSize: "1.15rem", color: "#8b5cf6", margin: "0 0 0.8rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>📝</span>
                  <span>Note di Regia Elena (Wedding Planner)</span>
                </h3>
                <textarea
                  rows={4}
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Inserisci note operative, verifiche da compiere o accordi presi durante la call di coordinamento a -6 mesi..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "0.8rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid #d6cebf",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                    marginBottom: "0.8rem",
                  }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <button
                    type="button"
                    onClick={saveNotes}
                    style={{
                      minHeight: "44px",
                      padding: "0 1.4rem",
                      borderRadius: "8px",
                      border: "none",
                      background: "#8b5cf6",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                    }}
                  >
                    Salva Note Dossier
                  </button>
                  {notesSavedBanner && (
                    <span style={{ color: "#059669", fontWeight: 600, fontSize: "0.85rem" }}>
                      ✓ Note salvate con successo!
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Modale */}
            <div
              style={{
                padding: "1.2rem 2rem",
                borderTop: "1px solid #e7e2d9",
                background: "#faf8f5",
                borderBottomLeftRadius: "20px",
                borderBottomRightRadius: "20px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
              }}
            >
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  minHeight: "44px",
                  padding: "0 1.2rem",
                  borderRadius: "8px",
                  border: "1px solid #d6cebf",
                  background: "#ffffff",
                  color: "#44403c",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                📄 Stampa Foglio Regia Staff
              </button>
              <button
                type="button"
                onClick={() => setSelectedEventForDossier(null)}
                style={{
                  minHeight: "44px",
                  padding: "0 1.5rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "#1e1b18",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Chiudi Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
