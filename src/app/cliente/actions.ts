"use server";

import { saveWeddingDiaryLocal, getWeddingDiaryLocal } from "@/lib/localDb";

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
