'use server';

import { revalidatePath } from 'next/cache';
import {
  createClientEventQuoteLocal,
  getAllQuotesLocal,
  getStore,
} from '@/lib/localDb';
import { checkVenueConflict } from '@/lib/eventStage';
import { SEMI_ESCLUSIVA_FORMULE } from '@/lib/contractMeta';
import { generateSignature } from '@/lib/crypto';

/** Formula di concessione selezionata dall'operatore nella Rubrica Clienti. */
export type ClientiFormula = 'esclusiva' | 'sala_bianca' | 'sala_tufo';

export interface CreateEventForClientInput {
  /** id esatto del cliente esistente in `store.clients`. */
  clientId: string;
  /** 'YYYY-MM-DD' */
  data_evento: string;
  turno: 'pranzo' | 'cena';
  formula: ClientiFormula;
  tipo_evento: 'wedding' | 'eventi';
}

export interface CreateEventForClientResult {
  success: boolean;
  error?: string;
  quoteId?: string;
  /** URL della pagina di firma/creazione del contratto per la nuova quote. */
  contractUrl?: string;
}

/** Verifica il formato di una data 'YYYY-MM-DD' realmente valida. */
function isValidDate(value: unknown): value is string {
  const raw = String(value ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === raw;
}

/**
 * Crea una quote rapida ("Nuovo Evento") per un cliente ESISTENTE, riusando
 * nome/contatti del record originali e la data/turno/formula scelti.
 *
 * Prima di generare l'evento viene eseguito il controllo di disponibilità
 * (`checkVenueConflict`): pranzo e cena sono turni indipendenti e le regole di
 * esclusiva/semi-esclusiva sono quelle ufficiali dell'Art. 2-bis.
 */
export async function createEventForClientAction(
  input: CreateEventForClientInput
): Promise<CreateEventForClientResult> {
  try {
    const clientId = String(input?.clientId || '').trim();
    if (!clientId) return { success: false, error: 'Seleziona un cliente esistente.' };

    const store = getStore();
    const client = (store.clients || []).find((c: any) => c && c.id === clientId);
    if (!client) return { success: false, error: 'Cliente non trovato nella rubrica.' };

    const dataEvento = String(input?.data_evento || '').trim();
    if (!isValidDate(dataEvento)) {
      return { success: false, error: 'Data evento non valida (formato YYYY-MM-DD).' };
    }

    const turno = input.turno === 'cena' ? 'cena' : 'pranzo';
    const formula: ClientiFormula =
      input.formula === 'esclusiva'
        ? 'esclusiva'
        : input.formula === 'sala_tufo'
          ? 'sala_tufo'
          : 'sala_bianca';

    const tipoEvento: 'wedding' | 'eventi' =
      input.tipo_evento === 'eventi' ? 'eventi' : 'wedding';

    // Controllo disponibilità sull'intero calendario (escluso il nuovo record).
    const conflict = checkVenueConflict(dataEvento, turno, formula, getAllQuotesLocal());
    if (conflict.hasConflict) {
      return { success: false, error: conflict.reason || 'Slot non disponibile nella data indicata.' };
    }

    const isEsclusiva = formula === 'esclusiva';
    const spazi = isEsclusiva ? [] : [...SEMI_ESCLUSIVA_FORMULE[formula].spazi];

    const saved = createClientEventQuoteLocal({
      client_id: clientId,
      tipo_evento: tipoEvento,
      data_evento: dataEvento,
      turno,
      tipo_esclusiva: isEsclusiva ? 'esclusiva' : 'semi_esclusiva',
      spazi_riservati: spazi,
      canale_contratto: 'accordo_diretto',
      source: 'admin_clienti',
      fase_contratto: 'accordo_diretto',
      prezzo: 0,
      items: [],
      note: 'Nuovo evento generato dalla Rubrica Clienti & Club TDA.',
    });

    if (!saved) {
      return { success: false, error: 'Cliente non trovato nella rubrica.' };
    }

    revalidatePath('/admin/clienti');
    revalidatePath('/admin/eventi');
    revalidatePath('/admin/cassa');

    // Prezzo ancora da concordare: il contratto viene aperto in modalità firma,
    // così la Direzione completa gli importi nella scheda di creazione.
    const prezzo = '0';
    const preventivo = saved.quoteId.slice(0, 8);
    const sig = generateSignature(prezzo, preventivo);
    const tipoContratto = tipoEvento === 'eventi' ? 'eventi' : 'wedding';
    const contractUrl = `/contratti/${tipoContratto}?prezzo=${prezzo}&preventivo=${preventivo}&sig=${sig}`;

    return { success: true, quoteId: saved.quoteId, contractUrl };
  } catch (err: unknown) {
    console.error('Errore in createEventForClientAction:', err);
    const message = err instanceof Error && err.message ? err.message : 'Errore inatteso';
    return { success: false, error: message };
  }
}
