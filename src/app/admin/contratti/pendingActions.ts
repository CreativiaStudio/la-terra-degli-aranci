'use server';

import { revalidatePath } from 'next/cache';
import { deletePendingContractLocal, getQuoteLocal } from '@/lib/localDb';
import { logActivity, logError } from '@/lib/blackbox';

/**
 * Revoca un contratto in attesa di firma (libera la data opzionata).
 * Dopo l'eliminazione rinfresca la cache delle pagine admin interessate.
 */
export async function deletePendingContractAction(quoteId: string) {
  try {
    // Snapshot pre-eliminazione: ci serve per un log leggibile (cliente/data).
    const quote = getQuoteLocal(quoteId);
    const cliente = quote?.clients
      ? `${String(quote.clients.nome || '').trim()} ${String(quote.clients.cognome || '').trim()}`.trim()
      : '';
    const preventivo = String(quoteId || '').slice(0, 8);

    const success = deletePendingContractLocal(quoteId);

    // Prova eliminazione/aggiornamento su Supabase se configurato
    try {
      const { getServiceSupabase } = await import('@/lib/supabase');
      const supabase = getServiceSupabase();
      await supabase.from('quotes').delete().eq('id', quoteId);
    } catch {
      // ignore
    }

    if (success) {
      logActivity({
        category: 'CONTRATTI',
        actor: 'Direzione Roberto',
        action: 'OPZIONE_REVOCATA',
        message: `Opzione revocata per ${cliente || `preventivo ${preventivo}`}${
          quote?.data_evento ? ` (evento del ${quote.data_evento})` : ''
        }. La data è tornata disponibile.`,
        metadata: {
          quoteId,
          preventivo,
          cliente: cliente || null,
          data_evento: quote?.data_evento ?? null,
          tipo_evento: quote?.tipo_evento ?? null,
        },
      });
    } else {
      logError(
        'CONTRATTI',
        'Direzione Roberto',
        'OPZIONE_REVOCA_FALLITA',
        new Error('Contratto in attesa non trovato o già revocato'),
        { quoteId, preventivo }
      );
    }

    revalidatePath('/admin/contratti', 'page');
    revalidatePath('/admin/contratti', 'layout');
    revalidatePath('/admin/eventi', 'page');
    revalidatePath('/admin/calendario', 'page');
    revalidatePath('/admin', 'page');
    revalidatePath('/calendario', 'page');

    return { success };
  } catch (err: unknown) {
    console.error('Errore in deletePendingContractAction:', err);
    logError('CONTRATTI', 'Direzione Roberto', 'OPZIONE_REVOCA_ERRORE', err, { quoteId });
    return { success: false };
  }
}
