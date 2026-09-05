"use server";

import { getServiceSupabase } from "@/lib/supabase";
import { updateQuoteStatusLocal, getQuoteLocal } from "@/lib/localDb";
import { uploadJsonToR2 } from "@/lib/r2";
import { revalidatePath } from "next/cache";

export async function acceptQuote(quoteId: string) {
  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'accettato' })
      .eq('id', quoteId);

    if (error) throw error;
  } catch (error: any) {
    console.warn("Supabase fallback accettazione locale:", error?.message || error);
    updateQuoteStatusLocal(quoteId, 'accettato');
  }

  // Backup aggiornamento stato accettato su Cloudflare R2
  try {
    const localQuote = getQuoteLocal(quoteId);
    if (localQuote) {
      await uploadJsonToR2({
        ...localQuote,
        status: 'accettato',
        updated_at: new Date().toISOString()
      }, `preventivi/${quoteId}.json`);
    }
  } catch (r2Err) {
    console.warn("Avviso aggiornamento R2 per preventivo accettato:", r2Err);
  }

  revalidatePath(`/preventivi/${quoteId}`);
  revalidatePath('/admin');
  revalidatePath('/admin/preventivi');
  
  return { success: true };
}
