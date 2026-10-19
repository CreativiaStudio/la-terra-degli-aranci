"use server";

import { revalidatePath } from "next/cache";
import { getExtraQuoteLocal, saveExtraQuoteLocal, getQuoteLocal } from "@/lib/localDb";
import type { ExtraQuote, ExtraServiceItem } from "@/lib/localDb";

export async function getExtraQuoteAction(quoteId: string): Promise<ExtraQuote | null> {
  try {
    return getExtraQuoteLocal(quoteId);
  } catch (err) {
    console.error("Errore recupero ExtraQuote:", err);
    return null;
  }
}

export async function saveExtraQuoteAction(
  quoteId: string,
  items: ExtraServiceItem[],
  noteInterne?: string
): Promise<{ success: boolean; extraQuote?: ExtraQuote; error?: string }> {
  try {
    if (!quoteId) {
      return { success: false, error: "ID preventivo mancante." };
    }

    const saved = saveExtraQuoteLocal(quoteId, {
      items,
      note_interne: noteInterne || "",
    });

    revalidatePath(`/admin/preventivi/${quoteId}/extra`);
    revalidatePath(`/admin/preventivi`);
    revalidatePath(`/admin/preventivi/${quoteId}/modifica-servizi`);

    return { success: true, extraQuote: saved };
  } catch (err: any) {
    console.error("Errore salvataggio ExtraQuote:", err);
    return { success: false, error: err?.message || "Errore durante il salvataggio." };
  }
}
