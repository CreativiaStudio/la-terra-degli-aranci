import { getGoogleCalendarEventsLocal, saveGoogleCalendarEventsLocal, getStore, saveStore } from "./localDb";
import type { GoogleCalendarEvent } from "./localDb";

export type LocationKey = "tutte" | "laterradegliaranci" | "villa_pagodina" | "sala_bianca" | "sala_tufo";

export interface ParsedGCalEventInput {
  summary: string;
  description?: string;
  start: string;
  end?: string;
  gcal_id?: string;
  location?: string;
}

const SEED_GCAL_EVENTS: GoogleCalendarEvent[] = [
  {
    id: "gcal-seed-01",
    gcal_id: "gcal_tda_20261024",
    summary: "? Esposito Ciro - 333 1248901",
    description: "Opzione verbale telefonica per matrimonio pranzo. Richiesta disponibilità data.",
    location: "laterradegliaranci",
    start: "2026-10-24T12:30:00",
    end: "2026-10-24T18:00:00",
    is_verbal_confirmation: true,
    client_nome: "Esposito Ciro",
    client_telefono: "333 1248901",
    has_incomplete_data: true,
    imported_at: "2026-10-10T09:00:00Z",
  },
  {
    id: "gcal-seed-02",
    gcal_id: "gcal_vp_20261107",
    summary: "VP - Anniversario Nozze De Luca",
    description: "Confermato a Villa Pagodina. 70 ospiti circa.",
    location: "villa_pagodina",
    start: "2026-11-07T13:00:00",
    end: "2026-11-07T19:00:00",
    is_verbal_confirmation: false,
    client_nome: "De Luca",
    has_incomplete_data: true,
    imported_at: "2026-10-10T09:00:00Z",
  },
  {
    id: "gcal-seed-03",
    gcal_id: "gcal_tufo_20261114",
    summary: "? Matrimonio Sorrentino (Sala Tufo)",
    description: "Opzione verbale presa da Roberto. In attesa di visita con genitori.",
    location: "sala_tufo",
    start: "2026-11-14T19:30:00",
    end: "2026-11-15T01:30:00",
    is_verbal_confirmation: true,
    client_nome: "Sorrentino",
    has_incomplete_data: true,
    imported_at: "2026-10-10T09:00:00Z",
  },
  {
    id: "gcal-seed-04",
    gcal_id: "gcal_vp_20261121",
    summary: "VP - Comunione Russo 338 9988771",
    description: "Comunione Villa Pagodina. Caparra versata su CC.",
    location: "villa_pagodina",
    start: "2026-11-21T12:30:00",
    end: "2026-11-21T18:00:00",
    is_verbal_confirmation: false,
    client_nome: "Russo",
    client_telefono: "338 9988771",
    has_incomplete_data: true,
    imported_at: "2026-10-10T09:00:00Z",
  },
  {
    id: "gcal-seed-05",
    gcal_id: "gcal_bianca_20261205",
    summary: "? Festa 18 Anni Ferrara (Sala Bianca)",
    description: "Opzione verbale sabato sera in Sala Bianca. In attesa di acconto.",
    location: "sala_bianca",
    start: "2026-12-05T20:00:00",
    end: "2026-12-06T02:00:00",
    is_verbal_confirmation: true,
    client_nome: "Ferrara",
    has_incomplete_data: true,
    imported_at: "2026-10-10T09:00:00Z",
  },
  {
    id: "gcal-seed-06",
    gcal_id: "gcal_vp_20270522",
    summary: "VP - Matrimonio Coppola (Villa Pagodina)",
    description: "Matrimonio 2027 a Villa Pagodina. Data bloccata.",
    location: "villa_pagodina",
    start: "2027-05-22T12:00:00",
    end: "2027-05-22T19:00:00",
    is_verbal_confirmation: false,
    client_nome: "Coppola",
    has_incomplete_data: true,
    imported_at: "2026-10-10T09:00:00Z",
  },
];

/**
 * Normalizza e classifica un evento da Google Calendar:
 * 1. Riconosce '?' come opzione verbale non confermata
 * 2. Riconosce la location ('VP', 'Pagodina', 'Sala Tufo', 'Sala Bianca', 'TDA')
 * 3. Estrae telefono e nome se presenti nel testo
 */
export function parseGCalEvent(input: ParsedGCalEventInput): GoogleCalendarEvent {
  const summary = (input.summary || "").trim();
  const desc = (input.description || "").trim();
  const rawLoc = ((input.location || "") + " " + summary + " " + desc).toLowerCase();

  // 1. Riconoscimento opzione verbale: se inizia con '?' o contiene 'opzione verbale'
  const isVerbal = summary.startsWith("?") || rawLoc.includes("opzione verbale");

  // Pulizia titolo rimuovendo eventuale '?' iniziale
  let cleanSummary = summary.replace(/^\?\s*/, "").trim();

  // 2. Riconoscimento Location
  let location: 'villa_pagodina' | 'sala_bianca' | 'sala_tufo' | 'laterradegliaranci' = "laterradegliaranci";
  if (rawLoc.includes("villa pagodina") || rawLoc.includes("pagodina") || summary.toUpperCase().startsWith("VP")) {
    location = "villa_pagodina";
  } else if (rawLoc.includes("sala tufo") || rawLoc.includes("tufo")) {
    location = "sala_tufo";
  } else if (rawLoc.includes("sala bianca") || rawLoc.includes("bianca")) {
    location = "sala_bianca";
  }

  // 3. Estrazione Telefono (es. 333 1234567 o 333-1234567 o 3331234567)
  const phoneMatch = (summary + " " + desc).match(/(\+?39\s*)?3\d{2}[\s.-]?\d{3}[\s.-]?\d{3,4}/);
  const clientTelefono = phoneMatch ? phoneMatch[0].trim() : undefined;

  // 4. Estrazione Nome Approssimativo
  let clientNome = cleanSummary
    .replace(/^VP\s*[-:]?\s*/i, "")
    .replace(/\s*\(.*?\)/g, "")
    .replace(/\s*[-:]\s*\d+.*$/, "")
    .trim();

  return {
    id: input.gcal_id ? `gcal-${input.gcal_id}` : `gcal-${crypto.randomUUID()}`,
    gcal_id: input.gcal_id,
    summary: summary,
    description: desc,
    location,
    start: input.start,
    end: input.end || input.start,
    is_verbal_confirmation: isVerbal,
    client_nome: clientNome || undefined,
    client_telefono: clientTelefono,
    has_incomplete_data: true,
    imported_at: new Date().toISOString(),
  };
}

/**
 * Restituisce gli eventi Google Calendar garantendo il seed iniziale
 * in modo che Mario e Roberto abbiano subito la vista ibrida funzionante.
 */
export function getOrSeedGCalEvents(): GoogleCalendarEvent[] {
  let events = getGoogleCalendarEventsLocal();
  if (!events || events.length === 0) {
    events = [...SEED_GCAL_EVENTS];
    saveGoogleCalendarEventsLocal(events);
  }
  return events;
}

/**
 * Associa un evento Google Calendar a un cliente del CRM (o ne crea uno nuovo).
 * Risolve la problematica del "momento ibrido" sollevata da Mario:
 * assegna ID, arricchisce i dati anagrafici e toglie il flag 'has_incomplete_data'.
 */
export function associateGCalEventToClient(
  eventId: string,
  clientData: {
    nome: string;
    cognome: string;
    email: string;
    telefono: string;
    note?: string;
  }
): { success: boolean; event?: GoogleCalendarEvent; clientId?: string } {
  const store = getStore();
  const events = getGoogleCalendarEventsLocal();
  const event = events.find((e) => e.id === eventId || e.gcal_id === eventId);
  if (!event) return { success: false };

  // Crea o recupera cliente CRM
  if (!Array.isArray(store.clients)) store.clients = [];
  let client = store.clients.find(
    (c) =>
      (clientData.email && c.email?.toLowerCase() === clientData.email.toLowerCase()) ||
      (clientData.telefono && c.telefono === clientData.telefono)
  );

  if (!client) {
    client = {
      id: crypto.randomUUID(),
      nome: clientData.nome,
      cognome: clientData.cognome,
      email: clientData.email,
      telefono: clientData.telefono,
      lead_source: `gcal_${event.location || "tda"}`,
      note: `Importato da Google Calendar (${event.summary}). ${clientData.note || ""}`.trim(),
      tags: ["Import GCal", event.location === "villa_pagodina" ? "Villa Pagodina" : "TDA"],
      created_at: new Date().toISOString(),
    };
    store.clients.push(client);
    saveStore(store);
  }

  // Aggiorna l'evento GCal
  event.client_id = client.id;
  event.client_nome = `${client.nome} ${client.cognome}`.trim();
  event.client_email = client.email;
  event.client_telefono = client.telefono;
  event.has_incomplete_data = false;

  saveGoogleCalendarEventsLocal(events);

  return { success: true, event, clientId: client.id };
}
