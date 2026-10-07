'use server';

import { revalidatePath } from 'next/cache';
import {
  recordPaymentLocal,
  cancelPaymentLocal,
  getQuoteLocal,
  getAllPaymentsLocal,
} from '@/lib/localDb';
import {
  VALID_PAYMENT_METHODS,
  VALID_COMPANIES,
  type Payment,
  type PaymentMethod,
  type Company,
} from '@/lib/eventLedger';
import { logActivity, logError } from '@/lib/blackbox';

/** Payload di registrazione di un incasso reale. */
export interface RecordPaymentPayload {
  quote_id: string;
  /** 'YYYY-MM-DD' */
  data_incasso: string;
  /** Intero > 0 in centesimi. */
  importo_cents: number;
  metodo: PaymentMethod;
  incassato_da: Company;
  riferimento?: string;
  note?: string;
  /** Utente che ha materialmente registrato l'incasso (default: 'admin'). */
  registrato_da?: string;
}

export interface RecordPaymentResult {
  success: boolean;
  payment?: Payment;
  error?: string;
}

export interface CancelPaymentResult {
  success: boolean;
  error?: string;
}

/**
 * Invalida tutte le viste economiche toccate da un incasso. Unico punto di
 * revalidation per il registro pagamenti.
 */
function revalidateEvent(quoteId?: string): void {
  revalidatePath('/admin');
  revalidatePath('/admin/cassa');
  revalidatePath('/admin/eventi');
  revalidatePath('/admin/eventi-cassa');
  if (quoteId) revalidatePath(`/admin/eventi/${quoteId}`);
  revalidatePath('/cliente');
}

/** Estrae un messaggio leggibile da un errore catturato (`unknown`). */
function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  const message = String(err ?? '');
  return message || 'Errore inatteso';
}

/** Formatta un importo in centesimi come stringa euro leggibile (es. "1.250,00"). */
function formatEuroCents(cents: number): string {
  return new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(Math.max(0, Number(cents) || 0) / 100);
}

/** Etichetta leggibile della società incassante. */
function companyLabel(company: Company): string {
  return company === 'santo_stefano'
    ? 'Tenuta Santo Stefano S.r.l.'
    : 'Iovino Banqueting S.r.l.';
}

/** Verifica che una stringa sia una data valida 'YYYY-MM-DD' non futura (max oggi+1). */
function isValidIncassoDate(value: unknown): value is string {
  const raw = String(value ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;

  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  // Scarta date "normalizzate" da JS (es. 2026-02-31 → marzo).
  if (parsed.toISOString().slice(0, 10) !== raw) return false;

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const max = tomorrow.toISOString().slice(0, 10);
  return raw <= max;
}

/**
 * Registra un incasso reale su una quote esistente (id esatto).
 * Append-only: nessuna eliminazione fisica, solo successivo annullamento.
 */
export async function recordPaymentAction(
  payload: RecordPaymentPayload
): Promise<RecordPaymentResult> {
  try {
    const quoteId = String(payload?.quote_id || '').trim();
    if (!quoteId) {
      return { success: false, error: 'quote_id obbligatorio' };
    }
    if (!getQuoteLocal(quoteId)) {
      return { success: false, error: 'Evento non trovato per l\'id indicato' };
    }

    const importoCents = Number(payload?.importo_cents);
    if (!Number.isInteger(importoCents) || importoCents <= 0) {
      return { success: false, error: 'Importo non valido: atteso un intero positivo in centesimi' };
    }

    if (!isValidIncassoDate(payload?.data_incasso)) {
      return {
        success: false,
        error: 'Data incasso non valida (formato YYYY-MM-DD, non oltre oggi+1)',
      };
    }

    const metodo = payload?.metodo;
    if (!VALID_PAYMENT_METHODS.includes(metodo)) {
      return { success: false, error: 'Metodo di pagamento non ammesso' };
    }

    const incassatoDa = payload?.incassato_da;
    if (!VALID_COMPANIES.includes(incassatoDa)) {
      return { success: false, error: 'Società incassante non ammessa' };
    }

    const payment = recordPaymentLocal({
      quote_id: quoteId,
      data_incasso: payload.data_incasso,
      importo_cents: importoCents,
      metodo,
      incassato_da: incassatoDa,
      riferimento: payload.riferimento,
      note: payload.note,
      registrato_da: String(payload.registrato_da || 'admin').trim() || 'admin',
    });

    revalidateEvent(quoteId);

    logActivity({
      category: 'CASSA',
      actor: 'Direzione Roberto',
      action: 'INCASSO_REGISTRATO',
      message: `Incasso di € ${formatEuroCents(importoCents)} registrato il ${payload.data_incasso} su ${companyLabel(incassatoDa)}.`,
      metadata: {
        paymentId: payment.id,
        quoteId,
        importo_cents: importoCents,
        data_incasso: payload.data_incasso,
        metodo,
        incassato_da: incassatoDa,
        riferimento: payload.riferimento ?? null,
        registrato_da: payment.registrato_da,
      },
    });

    return { success: true, payment };
  } catch (err: unknown) {
    console.error('Errore in recordPaymentAction:', err);
    logError('CASSA', 'Direzione Roberto', 'INCASSO_ERRORE', err, {
      quote_id: payload?.quote_id,
      importo_cents: payload?.importo_cents,
    });
    return { success: false, error: errorMessage(err) };
  }
}

/**
 * Annulla un pagamento (soft delete append-only). Il motivo è obbligatorio.
 */
export async function cancelPaymentAction(
  paymentId: string,
  motivo: string
): Promise<CancelPaymentResult> {
  try {
    const id = String(paymentId || '').trim();
    if (!id) {
      return { success: false, error: 'paymentId obbligatorio' };
    }

    const reason = String(motivo || '').trim();
    if (reason.length < 3) {
      return { success: false, error: 'Motivo di annullamento obbligatorio (minimo 3 caratteri)' };
    }

    const existing = getAllPaymentsLocal().find((p) => p.id === id);

    const success = cancelPaymentLocal(id, reason);
    if (!success) {
      return { success: false, error: 'Pagamento non trovato o già annullato' };
    }

    revalidateEvent();

    logActivity({
      category: 'CASSA',
      actor: 'Direzione Roberto',
      action: 'INCASSO_ANNULLATO',
      message: `Incasso annullato${
        existing ? ` di € ${formatEuroCents(existing.importo_cents)}` : ''
      }. Motivo: ${reason}`,
      metadata: {
        paymentId: id,
        motivo: reason,
        quote_id: existing?.quote_id ?? null,
        importo_cents: existing?.importo_cents ?? null,
      },
    });

    return { success: true };
  } catch (err: unknown) {
    console.error('Errore in cancelPaymentAction:', err);
    logError('CASSA', 'Direzione Roberto', 'INCASSO_ANNULLAMENTO_ERRORE', err, {
      paymentId,
      motivo,
    });
    return { success: false, error: errorMessage(err) };
  }
}
