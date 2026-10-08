"use server";

import { revalidatePath } from "next/cache";
import {
  saveWeddingDiaryLocal,
  getWeddingDiaryLocal,
  getQuoteLocal,
  getLocalStore,
  createServiceTicketLocal,
  getServiceTicketsForQuoteLocal,
  type ServiceTicket,
  type ServiceTicketItem,
} from "@/lib/localDb";
import { dispatchServiceTicketNotification } from "@/lib/notificationDispatcher";

/**
 * Payload del Wedding Diary.
 *
 * Nuovo formato (Area Clienti):
 *   { client_id, quote_id, answers: { campo: valore, ... }, completion_rate: 42 }
 *
 * Formato legacy (AI Concierge / vecchie schede):
 *   { client_id, palette, style, preferred_spaces, dietary_notes, music_preferences, notes }
 *
 * I due formati sono accettati contemporaneamente e la persistenza è
 * non distruttiva: le chiavi non inviate restano memorizzate.
 */
export interface SaveWeddingDiaryPayload {
  client_id: string;
  quote_id?: string;
  /** Risposte strutturate del questionario: { nome_campo: valore }. */
  answers?: Record<string, any>;
  /** Percentuale di completamento del Diary (0-100). */
  completion_rate?: number;
  /* --- Campi legacy (retrocompatibilità) --- */
  palette?: string;
  style?: string;
  preferred_spaces?: string[];
  dietary_notes?: string;
  music_preferences?: string;
  notes?: string;
  [key: string]: any;
}

export type SaveWeddingDiaryResult =
  | { success: true; data: any }
  | { success: false; error: string };

export async function saveWeddingDiaryAction(data: SaveWeddingDiaryPayload): Promise<SaveWeddingDiaryResult> {
  try {
    if (!data || !data.client_id) {
      return { success: false, error: "client_id mancante" };
    }

    const updated = saveWeddingDiaryLocal(data);
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error?.message || "Errore durante il salvataggio" };
  }
}

export async function getWeddingDiaryAction(clientId: string) {
  try {
    const data = getWeddingDiaryLocal(clientId);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, data: null };
  }
}

export interface SubmitServiceTicketPayload {
  quoteId: string;
  servizi: ServiceTicketItem[];
  noteSposi?: string;
}

export type SubmitServiceTicketResult =
  | { success: true; ticket: ServiceTicket }
  | { success: false; error: string };

/**
 * Invia un Ticket Richiesta Servizi dall'Area Clienti: collega i servizi
 * richiesti/rimossi alla quote, notifica la Direzione in background e
 * revalida l'area cliente.
 */
export async function submitServiceTicketAction(
  payload: SubmitServiceTicketPayload
): Promise<SubmitServiceTicketResult> {
  try {
    const quoteId = String(payload?.quoteId || "").trim();
    if (!quoteId) return { success: false, error: "quoteId mancante" };

    const store = getLocalStore();
    const quote =
      getQuoteLocal(quoteId) ||
      (store.quotes || []).find((q: any) => String(q?.id) === quoteId) ||
      null;
    if (!quote) return { success: false, error: "Preventivo non trovato" };

    const client =
      (quote as any)?.clients ||
      (store.clients || []).find((c: any) => c?.id === (quote as any)?.client_id) ||
      null;

    const clientName =
      [client?.nome, client?.cognome].filter(Boolean).join(" ").trim() ||
      (quote as any)?.client_name ||
      "Cliente";

    const ticket = createServiceTicketLocal({
      quote_id: quoteId,
      client_id: (quote as any)?.client_id || client?.id,
      client_name: clientName,
      client_email: client?.email || (quote as any)?.email || undefined,
      client_phone: client?.telefono || (quote as any)?.telefono || undefined,
      event_date: (quote as any)?.data_evento,
      tipo_evento: (quote as any)?.tipo_evento,
      servizi: Array.isArray(payload?.servizi) ? payload.servizi : [],
      note_sposi: payload?.noteSposi,
      status: "nuovo",
    });

    dispatchServiceTicketNotification(ticket).catch((err) =>
      console.error("Errore notifica ticket servizi:", err)
    );

    revalidatePath("/cliente");
    return { success: true, ticket };
  } catch (error: any) {
    return { success: false, error: error?.message || "Errore durante l'invio del ticket" };
  }
}

/** Ticket Richiesta Servizi collegati a una quote. */
export async function getServiceTicketsForQuoteAction(quoteId: string) {
  return getServiceTicketsForQuoteLocal(quoteId);
}
