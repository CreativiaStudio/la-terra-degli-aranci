"use server";

/**
 * notificationsAction.ts — Centro Notifiche Direzionale de La Terra degli Aranci.
 *
 * Aggrega, dalle diverse collezioni dello store locale, tutte le azioni che
 * richiedono l'attenzione di Roberto Sola (direzione):
 *  - Ticket Richiesta Servizi aperti dagli sposi (`service_tickets`);
 *  - Contratti ufficiali firmati (`signed_contracts` / `quotes.status === 'firmato'`);
 *  - Variazioni servizi / Allegato B (`quote_changes`);
 *  - Nuovi appuntamenti in attesa di conferma (`appointments`).
 *
 * La funzione è di sola lettura: non muta mai lo store.
 */

import { getStore, type LocalStore } from "@/lib/localDb";

/* ------------------------------------------------------------------ */
/* Tipi pubblici                                                       */
/* ------------------------------------------------------------------ */

export interface AdminNotification {
  id: string;
  tipo: "ticket_servizi" | "contratto_firmato" | "allegato_b" | "appuntamento" | "diary";
  titolo: string;
  messaggio: string;
  data: string;
  link: string;
  badgeLabel: string;
  badgeColor: string;
  badgeBg: string;
  priorita: "alta" | "media" | "bassa";
  letta?: boolean;
}

/* ------------------------------------------------------------------ */
/* Configurazione                                                      */
/* ------------------------------------------------------------------ */

/** Finestra temporale (giorni) per considerare "recente" una firma. */
const RECENT_DAYS = 30;
/** Finestra temporale (giorni) per considerare "recente" un Diary. */
const DIARY_RECENT_DAYS = 7;

/* ------------------------------------------------------------------ */
/* Helper puri                                                         */
/* ------------------------------------------------------------------ */

/** Converte una data (ISO o testo) in timestamp; 0 se non valida. */
function toTime(value: unknown): number {
  if (!value) return 0;
  const time = new Date(String(value)).getTime();
  return Number.isFinite(time) ? time : 0;
}

/** true se la data è compresa negli ultimi `days` giorni. */
function isRecent(value: unknown, days: number): boolean {
  const time = toTime(value);
  if (!time) return false;
  return Date.now() - time <= days * 24 * 60 * 60 * 1000;
}

/** Unisce nome e cognome ignorando i valori vuoti. */
function fullName(...parts: unknown[]): string {
  return parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

/** Stato di lavorazione di un ticket che merita una notifica. */
function isTicketPending(status: unknown): boolean {
  return status === "nuovo" || status === "in_valutazione";
}

/** Forma minima di un cliente/coppia presente nello store. */
interface StoreClient {
  id?: string;
  nome?: string;
  cognome?: string;
}

/** Forma minima di una quote rilevante per le notifiche. */
interface StoreQuote {
  id?: string;
  client_id?: string;
  clients?: StoreClient | null;
  [key: string]: unknown;
}

/** Elenco tipizzato dei clienti dello store. */
function getClients(store: LocalStore): StoreClient[] {
  return Array.isArray(store.clients) ? (store.clients as StoreClient[]) : [];
}

/** Elenco tipizzato delle quote dello store. */
function getQuotes(store: LocalStore): StoreQuote[] {
  return Array.isArray(store.quotes) ? (store.quotes as StoreQuote[]) : [];
}

/** Risolve il nome dello sposo/cliente a partire da una quote id. */
function resolveQuoteName(store: LocalStore, quoteId: string, fallback = "Cliente TDA"): string {
  const search = String(quoteId || "").trim().toLowerCase();
  if (!search) return fallback;

  const quote = getQuotes(store).find((q) => {
    const id = String(q?.id || "").trim().toLowerCase();
    if (!id) return false;
    return id === search || id.startsWith(search) || search.startsWith(id);
  });

  const client =
    quote?.clients ||
    getClients(store).find((c) => c && quote?.client_id && c.id === quote.client_id) ||
    {};

  return fullName(client.nome, client.cognome) || fallback;
}

/* ------------------------------------------------------------------ */
/* Server Action                                                       */
/* ------------------------------------------------------------------ */

/**
 * Costruisce l'elenco completo delle notifiche direzionali, ordinate dalla
 * più recente alla più vecchia.
 */
export async function getAdminNotificationsAction(): Promise<AdminNotification[]> {
  const store = getStore();
  const notifications: AdminNotification[] = [];

  /* 1) Ticket Richiesta Servizi ------------------------------------- */
  const tickets = Array.isArray(store.service_tickets) ? store.service_tickets : [];
  for (const ticket of tickets) {
    if (!ticket || !isTicketPending(ticket.status)) continue;

    const servizi = Array.isArray(ticket.servizi) ? ticket.servizi : [];
    const count = servizi.length;
    const clientName =
      String(ticket.client_name || "").trim() || resolveQuoteName(store, ticket.quote_id, "Sposi");
    const isNew = ticket.status === "nuovo";

    notifications.push({
      id: `ticket:${ticket.id}`,
      tipo: "ticket_servizi",
      titolo: isNew ? "Nuova richiesta servizi" : "Richiesta servizi in valutazione",
      messaggio: `${clientName} richiede ${count} ${
        count === 1 ? "nuovo servizio" : "nuovi servizi"
      }`,
      data: String(ticket.updated_at || ticket.created_at || ""),
      link: `/admin/eventi/${ticket.quote_id}?tab=ticket`,
      badgeLabel: isNew ? "Nuovo" : "In valutazione",
      badgeColor: isNew ? "#b91c1c" : "#92400e",
      badgeBg: isNew ? "#fee2e2" : "#fef3c7",
      priorita: "alta",
    });
  }

  /* 2a) Contratti firmati (signed_contracts) ------------------------ */
  const signedContracts = Array.isArray(store.signed_contracts) ? store.signed_contracts : [];
  const signedQuoteIds = new Set<string>();

  for (const signed of signedContracts) {
    if (!signed) continue;
    const quoteId = String(signed.quote_id || signed.preventivo || signed.quoteId || "").trim();
    if (!quoteId) continue;

    const key = quoteId.toLowerCase();
    signedQuoteIds.add(key);

    const signedAt = signed.firmato_il || signed.signed_at || signed.created_at;
    if (!isRecent(signedAt, RECENT_DAYS)) continue;

    const client = signed.datiCliente || {};
    const name = fullName(client.nome, client.cognome) || resolveQuoteName(store, quoteId);

    notifications.push({
      id: `contract:${key}`,
      tipo: "contratto_firmato",
      titolo: "Contratto firmato",
      messaggio: `${name} ha firmato il contratto ufficiale`,
      data: String(signedAt || ""),
      link: `/admin/eventi/${quoteId}`,
      badgeLabel: "Firmato",
      badgeColor: "#166534",
      badgeBg: "#dcfce7",
      priorita: "alta",
    });
  }

  /* 2b) Contratti firmati presenti solo su quotes ------------------- */
  const quotes = getQuotes(store);
  for (const quote of quotes) {
    if (!quote || quote.status !== "firmato") continue;

    const quoteId = String(quote.id || "").trim();
    if (!quoteId) continue;
    const key = quoteId.toLowerCase();

    const alreadyCovered = Array.from(signedQuoteIds).some(
      (id) =>
        id === key ||
        (id.length >= 8 && key.length >= 8 && (id.startsWith(key) || key.startsWith(id)))
    );
    if (alreadyCovered) continue;

    const signedAt = quote.signed_at || quote.data_firma || quote.updated_at || quote.created_at;
    if (!isRecent(signedAt, RECENT_DAYS)) continue;

    const client =
      quote.clients ||
      getClients(store).find((c) => c && c.id === quote.client_id) ||
      {};
    const name = fullName(client.nome, client.cognome) || "Cliente TDA";

    notifications.push({
      id: `contract:${key}`,
      tipo: "contratto_firmato",
      titolo: "Contratto firmato",
      messaggio: `${name} ha firmato il contratto ufficiale`,
      data: String(signedAt || ""),
      link: `/admin/eventi/${quoteId}`,
      badgeLabel: "Firmato",
      badgeColor: "#166534",
      badgeBg: "#dcfce7",
      priorita: "alta",
    });
  }

  /* 3) Variazioni servizi / Allegato B ------------------------------ */
  const quoteChanges = Array.isArray(store.quote_changes) ? store.quote_changes : [];
  for (const change of quoteChanges) {
    if (!change) continue;

    const status = String(change.status || "").toLowerCase();
    if (status !== "pending" && status !== "confermato") continue;

    const quoteId = String(change.quote_id || "").trim();
    const name = resolveQuoteName(store, quoteId);
    const isPending = status === "pending";

    notifications.push({
      id: `allegato-b:${change.id || quoteId || String(change.created_at || "")}`,
      tipo: "allegato_b",
      titolo: isPending ? "Allegato B in attesa di firma" : "Allegato B confermato",
      messaggio: isPending
        ? `${name}: variazione servizi in attesa della firma`
        : `${name}: variazione servizi confermata`,
      data: String((isPending ? change.created_at : change.confirmed_at || change.created_at) || ""),
      link: `/admin/preventivi/${quoteId}/modifica-servizi`,
      badgeLabel: isPending ? "Da firmare" : "Confermato",
      badgeColor: isPending ? "#92400e" : "#166534",
      badgeBg: isPending ? "#fef3c7" : "#dcfce7",
      priorita: isPending ? "media" : "bassa",
    });
  }

  /* 4) Appuntamenti da confermare ----------------------------------- */
  const appointments = Array.isArray(store.appointments) ? store.appointments : [];
  for (const appointment of appointments) {
    if (!appointment || appointment.stato !== "da_confermare") continue;

    const name =
      fullName(appointment.nome, appointment.cognome) ||
      fullName(appointment.partnerNome, appointment.partnerCognome) ||
      "Nuovo contatto";
    const when = [appointment.dataAppuntamento, appointment.orarioAppuntamento]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(" ");

    notifications.push({
      id: `appointment:${appointment.id}`,
      tipo: "appuntamento",
      titolo: "Appuntamento da confermare",
      messaggio: `${name}${when ? ` — visita ${when}` : ""}`,
      data: String(appointment.created_at || appointment.dataOra || ""),
      link: "/admin",
      badgeLabel: appointment.tipo === "wedding" ? "Wedding" : "Privato",
      badgeColor: "#1d4ed8",
      badgeBg: "#dbeafe",
      priorita: "media",
    });
  }

  /* 5) Wedding Diary aggiornati di recente -------------------------- */
  const diaries = Array.isArray(store.wedding_diaries) ? store.wedding_diaries : [];
  for (const diary of diaries) {
    if (!diary) continue;

    const updatedAt = diary.updated_at || diary.created_at;
    if (!isRecent(updatedAt, DIARY_RECENT_DAYS)) continue;

    const name =
      resolveQuoteName(store, String(diary.quote_id || diary.client_id || ""), "") ||
      fullName(diary?.answers?.nome, diary?.answers?.cognome) ||
      "Coppia";
    const quoteId = String(diary.quote_id || diary.client_id || "").trim();

    notifications.push({
      id: `diary:${diary.id || quoteId || String(updatedAt || "")}`,
      tipo: "diary",
      titolo: "Wedding Diary aggiornato",
      messaggio: `${name} ha aggiornato le preferenze del proprio Wedding Diary`,
      data: String(updatedAt || ""),
      link: quoteId ? `/admin/eventi/${quoteId}` : "/admin/wedding-diary",
      badgeLabel: "Diary",
      badgeColor: "#6d28d9",
      badgeBg: "#ede9fe",
      priorita: "bassa",
    });
  }

  /* Ordinamento: dalla più recente alla più vecchia ----------------- */
  return notifications.sort((a, b) => toTime(b.data) - toTime(a.data));
}
