'use server';

import { revalidatePath } from 'next/cache';
import { deletePendingContractLocal } from '@/lib/localDb';

/**
 * Revoca un contratto in attesa di firma (libera la data opzionata).
 * Dopo l'eliminazione rinfresca la cache delle pagine admin interessate.
 */
export async function deletePendingContractAction(quoteId: string) {
  const success = deletePendingContractLocal(quoteId);

  // Prova eliminazione/aggiornamento su Supabase se configurato
  try {
    const { getServiceSupabase } = await import('@/lib/supabase');
    const supabase = getServiceSupabase();
    await supabase.from('quotes').delete().eq('id', quoteId);
  } catch {
    // ignore
  }

  revalidatePath('/admin/contratti', 'page');
  revalidatePath('/admin/contratti', 'layout');
  revalidatePath('/admin/eventi', 'page');
  revalidatePath('/admin/calendario', 'page');
  revalidatePath('/admin', 'page');
  revalidatePath('/calendario', 'page');

  return { success };
}
