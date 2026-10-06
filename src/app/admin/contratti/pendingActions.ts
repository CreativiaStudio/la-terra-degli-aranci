'use server';

import { revalidatePath } from 'next/cache';
import { deletePendingContractLocal } from '@/lib/localDb';

/**
 * Revoca un contratto in attesa di firma (libera la data opzionata).
 * Dopo l'eliminazione rinfresca la cache delle pagine admin interessate.
 */
export async function deletePendingContractAction(quoteId: string) {
  deletePendingContractLocal(quoteId);

  revalidatePath('/admin/contratti');
  revalidatePath('/admin');

  return { success: true as const };
}
