import {
  getGoogleCalendarEventsLocal,
  saveGoogleCalendarEventsLocal,
  getGoogleCalendarAuthLocal,
  saveGoogleCalendarAuthLocal,
  getStore,
  saveStore,
} from "./localDb";
import type { GoogleCalendarEvent } from "./localDb";

export type LocationKey = "tutte" | "laterradegliaranci" | "villa_pagodina" | "sala_bianca" | "sala_tufo";

export interface ParsedGCalEventInput {
  summary: string;
  description?: string;
  start: string;
  end?: string;
  gcal_id?: string;
  location?: string;
  /** Email già estratta a monte (es. da un campo strutturato dell'integrazione). */
  email?: string;
}

/** Endpoint OAuth di Google per il refresh dell'access token. */
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

/** Endpoint Google Calendar per la lettura degli eventi del calendario primario. */
const GOOGLE_CALENDAR_EVENTS_ENDPOINT =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

/** Sottoinsieme dei campi restituiti dall'API Google Calendar usati dalla sincronizzazione. */
interface GoogleCalendarApiEvent {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
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
 * Normalizza un numero di telefono per il confronto (Dual-Key Matching):
 * - rimuove tutti i caratteri non numerici;
 * - se il numero inizia con il prefisso internazionale '39' ed è lungo 12 cifre,
 *   rimuove il '39' iniziale per confrontarlo con i numeri nazionali.
 */
export function normalizePhoneNumber(raw?: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("39")) {
    return digits.slice(2);
  }
  return digits;
}

/**
 * Normalizza e classifica un evento da Google Calendar:
 * 1. Riconosce '?' come opzione verbale non confermata
 * 2. Riconosce la location ('VP', 'Pagodina', 'Sala Tufo', 'Sala Bianca', 'TDA')
 * 3. Estrae telefono, email e nome se presenti nel testo
 * 4. Riconosce gli "eventi amici" (slot occupato senza contratto)
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

  // 3b. Estrazione Email (dal testo oppure dal campo strutturato fornito a monte)
  const emailMatch = (summary + " " + desc).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const clientEmail =
    (input.email || "").trim() || (emailMatch ? emailMatch[0].trim() : undefined);

  // 3c. Riconoscimento Evento Amici (slot occupato, senza generazione contratto)
  const isAmici = /\bAMIC[OI]\b/i.test(`${summary} ${desc}`);

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
    client_email: clientEmail,
    has_incomplete_data: true,
    imported_at: new Date().toISOString(),
    is_amici: isAmici,
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

/**
 * Sincronizzazione live dal calendario Google della segreteria.
 *
 * Flusso:
 * 1. Verifica le credenziali salvate (refresh token presente).
 * 2. Rinfresca l'access token tramite OAuth.
 * 3. Scarica gli eventi del calendario primario.
 * 4. Interpreta ogni evento con parseGCalEvent.
 * 5. Esegue il Dual-Key Matching con l'anagrafica clienti:
 *    prima per telefono normalizzato, poi per email normalizzata.
 *    Se il cliente non esiste viene creato in CRM con i tag di importazione.
 * 6. Salva eventi e stato della sincronizzazione.
 */
export async function syncGoogleCalendarLive(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  const auth = getGoogleCalendarAuthLocal();

  if (!auth.connected || !auth.refresh_token) {
    return { success: false, error: "non_connesso" };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { success: false, error: "configurazione_oauth_mancante" };
  }

  // 1. Refresh dell'access token
  let accessToken = "";
  let expiresIn = 0;

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: auth.refresh_token,
      }).toString(),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      return { success: false, error: "refresh_token_fallito" };
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!tokenData.access_token) {
      return { success: false, error: "refresh_token_fallito" };
    }

    accessToken = tokenData.access_token;
    expiresIn = Number(tokenData.expires_in || 0);
  } catch {
    return { success: false, error: "refresh_token_fallito" };
  }

  // 2. Download degli eventi dal calendario primario
  let items: GoogleCalendarApiEvent[] = [];

  try {
    const eventsResponse = await fetch(
      `${GOOGLE_CALENDAR_EVENTS_ENDPOINT}?singleEvents=true&orderBy=startTime&maxResults=2500`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!eventsResponse.ok) {
      return { success: false, error: "download_eventi_fallito" };
    }

    const eventsData = (await eventsResponse.json()) as {
      items?: GoogleCalendarApiEvent[];
    };

    items = Array.isArray(eventsData.items) ? eventsData.items : [];
  } catch {
    return { success: false, error: "download_eventi_fallito" };
  }

  // 3. Interpretazione degli eventi Google con il parser del gestionale
  const events: GoogleCalendarEvent[] = items
    .filter((item) => {
      if (!item.id) return false;
      return Boolean(item.start?.dateTime || item.start?.date);
    })
    .map((item) => {
      const start = (item.start?.dateTime || item.start?.date) as string;
      const end = item.end?.dateTime || item.end?.date;

      return parseGCalEvent({
        summary: item.summary || "",
        description: item.description || "",
        start,
        end: end || start,
        gcal_id: item.id,
        location: item.location || "",
      });
    });

  // 4. Dual-Key Matching con l'anagrafica clienti
  const store = getStore();
  if (!Array.isArray(store.clients)) store.clients = [];

  // Mantiene l'aggancio già effettuato per lo stesso evento Google, evitando
  // duplicati di anagrafica al secondo passaggio di sincronizzazione.
  const previousClientByGcalId = new Map<string, string>();
  for (const previous of getGoogleCalendarEventsLocal()) {
    if (previous.gcal_id && previous.client_id) {
      previousClientByGcalId.set(previous.gcal_id, previous.client_id);
    }
  }

  for (const event of events) {
    const eventPhone = normalizePhoneNumber(event.client_telefono);
    const eventEmail = String(event.client_email || "").trim().toLowerCase();

    let client: any | undefined;

    // a. Aggancio già registrato per lo stesso evento Google
    if (event.gcal_id) {
      const previousClientId = previousClientByGcalId.get(event.gcal_id);
      if (previousClientId) {
        client = store.clients.find(
          (c) => c && String(c.id || "") === previousClientId
        );
      }
    }

    // b. Ricerca per telefono normalizzato
    if (!client && eventPhone) {
      client = store.clients.find(
        (c) =>
          c && normalizePhoneNumber(String(c.telefono || "")) === eventPhone
      );
    }

    // c. Ricerca per email normalizzata
    if (!client && eventEmail) {
      client = store.clients.find(
        (c) =>
          c &&
          String(c.email || "").trim().toLowerCase() === eventEmail
      );
    }

    // d. Cliente non trovato: creazione in CRM con i tag di importazione
    if (!client) {
      const nomeCompleto = String(event.client_nome || "").trim();
      const nomeParts = nomeCompleto.split(/\s+/).filter(Boolean);

      client = {
        id: crypto.randomUUID(),
        nome: nomeParts[0] || "Cliente",
        cognome: nomeParts.slice(1).join(" "),
        email: String(event.client_email || "").trim(),
        telefono: String(event.client_telefono || "").trim(),
        lead_source: `gcal_${event.location || "laterradegliaranci"}`,
        note: `Importato da Google Calendar (${event.summary}).`.trim(),
        tags: [
          "Import GCal",
          event.location || "laterradegliaranci",
          event.is_amici ? "Amici" : "Standard",
        ],
        created_at: new Date().toISOString(),
      };

      store.clients.push(client);
      saveStore(store);
    }

    // e. Arricchimento dell'evento con i dati del cliente CRM
    event.client_id = client.id;
    event.client_nome =
      `${String(client.nome || "").trim()} ${String(client.cognome || "").trim()}`.trim() ||
      event.client_nome;
    event.client_email = String(client.email || event.client_email || "").trim();
    event.client_telefono = String(
      client.telefono || event.client_telefono || ""
    ).trim();
    event.has_incomplete_data = false;
  }

  // 5. Persistenza eventi e stato della sincronizzazione
  saveGoogleCalendarEventsLocal(events);

  auth.last_synced_at = new Date().toISOString();
  auth.access_token = accessToken;
  if (expiresIn > 0) {
    auth.expires_at = Date.now() + expiresIn * 1000;
  }
  saveGoogleCalendarAuthLocal(auth);

  return { success: true, count: events.length };
}
