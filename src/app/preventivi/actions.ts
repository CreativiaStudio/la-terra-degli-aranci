"use server";

import { getServiceSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function acceptQuote(quoteId: string) {
  const supabase = getServiceSupabase();

  try {
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'accettato' })
      .eq('id', quoteId);

    if (error) throw error;

    revalidatePath(`/preventivi/${quoteId}`);
    revalidatePath('/admin/preventivi');
    
    return { success: true };
  } catch (error: any) {
    console.error("Errore accettazione preventivo:", error);
    return { success: false, error: error.message };
  }
}
