"use server";

import { saveWeddingDiaryLocal, getWeddingDiaryLocal } from "@/lib/localDb";

export async function saveWeddingDiaryAction(data: {
  client_id: string;
  quote_id?: string;
  palette?: string;
  style?: string;
  preferred_spaces?: string[];
  dietary_notes?: string;
  music_preferences?: string;
  notes?: string;
}) {
  try {
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
