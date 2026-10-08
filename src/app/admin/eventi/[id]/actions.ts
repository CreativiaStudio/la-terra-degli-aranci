'use server';

import { revalidatePath } from 'next/cache';
import {
  getAllQuotesLocal,
  getQuoteLocal,
  updateQuoteScheduleLocal,
  updateServiceTicketStatusLocal,
} from '@/lib/localDb';
import { SEMI_ESCLUSIVA_FORMULE } from '@/lib/contractMeta';
import { checkVenueConflict } from '@/lib/eventStage';

export interface RescheduleEventInput {
  quoteId: string;
  /** 'YYYY-MM-DD' */
  data_evento: string;
  turno: string;
  formula: 'esclusiva' | 'sala_bianca' | 'sala_tufo' | string;
}

export interface RescheduleEventResult {
  success: boolean;
  error?: string;
}

/**
 * Sposta data/turno/formula di un evento dopo la verifica server-side dei conflitti
 * (pranzo e cena indipendenti, esclusiva sul turno, capienze sala Bianca/Tufo).
 */
export async function rescheduleEventAction(
  input: RescheduleEventInput
): Promise<RescheduleEventResult> {
  try {
    const quoteId = String(input?.quoteId || '').trim();
    if (!quoteId) return { success: false, error: 'Evento non specificato' };

    const quote = getQuoteLocal(quoteId);
    if (!quote) return { success: false, error: 'Evento non trovato' };

    const dataEvento = String(input?.data_evento || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataEvento)) {
      return { success: false, error: 'Data non valida (formato YYYY-MM-DD)' };
    }

    const turno = input?.turno === 'cena' ? 'cena' : 'pranzo';
    const formula = String(input?.formula || 'esclusiva');
    const tipoEsclusiva = formula === 'esclusiva' ? 'esclusiva' : 'semi_esclusiva';

    const spazi =
      formula === 'esclusiva'
        ? []
        : [...SEMI_ESCLUSIVA_FORMULE[formula === 'sala_tufo' ? 'sala_tufo' : 'sala_bianca'].spazi];

    const conflict = checkVenueConflict(
      dataEvento,
      turno,
      formula,
      getAllQuotesLocal(),
      quote.id
    );
    if (conflict.hasConflict) {
      return { success: false, error: conflict.reason || 'Conflitto di disponibilità sulla data scelta' };
    }

    const updated = updateQuoteScheduleLocal(quoteId, {
      data_evento: dataEvento,
      turno,
      tipo_esclusiva: tipoEsclusiva,
      formula_opzione: formula,
      spazi_riservati: spazi,
    });
    if (!updated) return { success: false, error: 'Aggiornamento non riuscito' };

    revalidatePath('/admin/eventi');
    revalidatePath(`/admin/eventi/${quote.id}`);
    revalidatePath('/admin/calendario');
    return { success: true };
  } catch (err: unknown) {
    console.error('Errore in rescheduleEventAction:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Errore inatteso' };
  }
}

export interface UpdateServiceTicketStatusInput {
  ticketId: string;
  status: 'nuovo' | 'in_valutazione' | 'approvato' | 'rifiutato';
  noteDirezione?: string;
  allegatoBId?: string;
  quoteId?: string;
}

export type UpdateServiceTicketStatusResult =
  | { success: true; ticket: NonNullable<ReturnType<typeof updateServiceTicketStatusLocal>> }
  | { success: false; error: string };

/** Aggiorna lo stato di valutazione di un Ticket Richiesta Servizi. */
export async function updateServiceTicketStatusAction(
  input: UpdateServiceTicketStatusInput
): Promise<UpdateServiceTicketStatusResult> {
  try {
    const ticketId = String(input?.ticketId || '').trim();
    if (!ticketId) return { success: false, error: 'Ticket non specificato' };

    const ticket = updateServiceTicketStatusLocal(
      ticketId,
      input.status,
      input.noteDirezione,
      input.allegatoBId
    );
    if (!ticket) return { success: false, error: 'Ticket non trovato' };

    if (input.quoteId) {
      revalidatePath('/admin/eventi/');
      revalidatePath('/admin/eventi');
    }

    return { success: true, ticket };
  } catch (err: unknown) {
    console.error('Errore in updateServiceTicketStatusAction:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Errore inatteso' };
  }
}
