"use server";

import { getServiceSupabase } from "@/lib/supabase";
import {
  getQuoteLocal,
  createQuoteChangeLocal,
  getQuoteChangeLocal,
  getQuoteChangesForQuoteLocal,
  confirmQuoteChangeLocal,
  updateQuoteChangePdfUrlLocal,
  updateQuoteItemsAndTotalLocal
} from "@/lib/localDb";
import { generateSignature } from "@/lib/crypto";
import { isWithinEditableWindow } from "@/lib/eventWindow";
import { generateAddendumPdf } from "@/lib/pdf/generateAddendumPdf";
import { revalidatePath } from "next/cache";

interface ItemInput {
  id: string | number;
  descrizione: string;
  quantita: number;
  prezzo_unitario: number;
}

async function loadQuote(quoteId: string): Promise<any | null> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('quotes')
      .select('*, clients(*)')
      .eq('id', quoteId)
      .single();
    if (!error && data) return data;
  } catch (e) {
    console.warn("Supabase non raggiungibile, uso fallback locale:", e);
  }
  const local = getQuoteLocal(quoteId);
  if (local) return local;

  return {
    id: quoteId || "demo-test",
    client_id: quoteId || "demo-test",
    tipo_evento: "wedding",
    data_evento: "2027-06-18",
    numero_ospiti: 100,
    items: [
      { id: "1", descrizione: "Affitto Villa in Esclusiva & Menu Wedding Base", prezzo_unitario: 14000, quantita: 1 },
      { id: "2", descrizione: "Confettata Elegante Completa", prezzo_unitario: 450, quantita: 1 },
      { id: "3", descrizione: "After Party & DJ Set in Sala Tufo", prezzo_unitario: 750, quantita: 1 }
    ],
    sconto_fisso: 0,
    totale_calcolato: 15200,
    status: "firmato",
    clients: {
      nome: "Demo",
      cognome: "Test (Elena)",
      email: "sposi@laterradegliaranci.it"
    }
  };
}

async function loadQuoteChange(changeId: string): Promise<any | null> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('quote_changes')
      .select('*')
      .eq('id', changeId)
      .single();
    if (!error && data) return data;
  } catch (e) {
    console.warn("Supabase non raggiungibile, uso fallback locale:", e);
  }
  return getQuoteChangeLocal(changeId);
}

function signChange(changeId: string, quoteId: string, totaleAfter: number): string {
  return generateSignature(`${changeId}:${totaleAfter}`, quoteId);
}

export async function createQuoteChange(
  quoteId: string,
  newItems: ItemInput[],
  initiatedBy: 'cliente' | 'admin'
): Promise<
  | { success: true; changeId: string; sig: string; totaleAfter: number }
  | { success: false; error: string }
> {
  const quote = await loadQuote(quoteId);
  if (!quote) return { success: false, error: "Preventivo non trovato." };

  const isFirmato = quote.status === 'firmato';
  if (!isFirmato) return { success: false, error: "Il contratto non è ancora firmato." };
  if (!isWithinEditableWindow(quote.data_evento)) {
    return { success: false, error: "Non è più possibile modificare i servizi a meno di 10 giorni dall'evento." };
  }
  if (!newItems || newItems.length === 0) {
    return { success: false, error: "L'elenco servizi non può essere vuoto." };
  }

  const totaleServizi = newItems.reduce((acc, item) => acc + (Number(item.prezzo_unitario) || 0), 0);
  const totaleAfter = totaleServizi - (Number(quote.sconto_fisso) || 0);
  const totaleBefore = Number(quote.totale_calcolato) || 0;
  const itemsBefore = quote.items || [];

  let changeId = "";
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('quote_changes')
      .insert({
        quote_id: quoteId,
        initiated_by: initiatedBy,
        items_before: itemsBefore,
        items_after: newItems,
        totale_before: totaleBefore,
        totale_after: totaleAfter,
        status: 'pending'
      })
      .select()
      .single();
    if (error) throw error;
    changeId = data.id;
  } catch (e) {
    console.warn("Supabase non raggiungibile, salvataggio locale della richiesta di modifica:", e);
    const entry = createQuoteChangeLocal({
      quote_id: quoteId,
      initiated_by: initiatedBy,
      items_before: itemsBefore,
      items_after: newItems,
      totale_before: totaleBefore,
      totale_after: totaleAfter
    });
    changeId = entry.id;
  }

  const sig = signChange(changeId, quoteId, totaleAfter);

  return { success: true, changeId, sig, totaleAfter };
}

export async function getQuoteForAdmin(quoteId: string) {
  return loadQuote(quoteId);
}

export async function getQuoteChangesHistory(quoteId: string): Promise<any[]> {
  // Timeout aggressivo: questa funzione è chiamata anche nel caricamento pagina del
  // portale cliente, non deve mai far attendere l'utente se Supabase è irraggiungibile
  // (stesso pattern di getQuotesFast in src/lib/dataHelper.ts).
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 150);

  let rawData: any[] = [];
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('quote_changes')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: false })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (!error && data) rawData = data;
    else rawData = getQuoteChangesForQuoteLocal(quoteId);
  } catch (e) {
    clearTimeout(timeoutId);
    console.warn("Supabase non raggiungibile, uso fallback locale:", e);
    rawData = getQuoteChangesForQuoteLocal(quoteId);
  }

  return rawData.map((change: any) => {
    const sig = signChange(change.id, change.quote_id, Number(change.totale_after));
    return {
      ...change,
      sig,
      signing_url: `/preventivi/modifica/${change.id}?sig=${sig}`
    };
  });
}

export async function getQuoteChangeForConfirmation(changeId: string) {
  const change = await loadQuoteChange(changeId);
  if (!change) return null;
  const quote = await loadQuote(change.quote_id);
  if (!quote) return null;
  return { change, quote };
}

export async function confirmQuoteChange(
  changeId: string,
  sig: string,
  firmaDisegnata: string
): Promise<{ success: true; pdfUrl: string } | { success: false; error: string }> {
  const change = await loadQuoteChange(changeId);
  if (!change) return { success: false, error: "Richiesta di modifica non trovata." };
  if (change.status !== 'pending') return { success: false, error: "Questa modifica è già stata gestita." };

  const expectedSig = signChange(changeId, change.quote_id, Number(change.totale_after));
  if (sig !== expectedSig) return { success: false, error: "Link non valido o alterato." };

  if (!firmaDisegnata) return { success: false, error: "Firma mancante." };

  const quote = await loadQuote(change.quote_id);
  if (!quote) return { success: false, error: "Preventivo non trovato." };
  if (!isWithinEditableWindow(quote.data_evento)) {
    return { success: false, error: "Non è più possibile confermare modifiche a meno di 10 giorni dall'evento." };
  }

  // Applica la transizione pending -> confermato in modo idempotente (anti doppio-submit)
  let flipped = false;
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('quote_changes')
      .update({ status: 'confermato', firma_disegnata: firmaDisegnata, confirmed_at: new Date().toISOString() })
      .eq('id', changeId)
      .eq('status', 'pending')
      .select();
    if (error) throw error;
    flipped = Boolean(data && data.length > 0);
  } catch (e) {
    console.warn("Supabase non raggiungibile per la conferma, provo fallback locale:", e);
  }
  if (!flipped) {
    flipped = confirmQuoteChangeLocal(changeId, firmaDisegnata, "");
  }
  if (!flipped) {
    return { success: false, error: "Questa modifica è già stata gestita." };
  }

  const clientName = `${quote.clients?.nome || ''} ${quote.clients?.cognome || ''}`.trim();
  let pdfUrl = "";
  try {
    pdfUrl = await generateAddendumPdf({
      tipoContratto: quote.tipo_evento === 'eventi' ? 'eventi' : 'wedding',
      quoteRef: quote.id.slice(0, 8).toUpperCase(),
      clientName,
      itemsBefore: change.items_before,
      itemsAfter: change.items_after,
      totaleBefore: Number(change.totale_before),
      totaleAfter: Number(change.totale_after),
      firmaDisegnata
    });
  } catch (e) {
    console.error("Errore generazione PDF addendum:", e);
  }

  try {
    const supabase = getServiceSupabase();
    await supabase.from('quote_changes').update({ pdf_url: pdfUrl }).eq('id', changeId);
    await supabase
      .from('quotes')
      .update({ items: change.items_after, totale_calcolato: change.totale_after })
      .eq('id', change.quote_id);
  } catch (e) {
    console.warn("Supabase non raggiungibile, aggiorno solo il fallback locale:", e);
  }

  // Aggiorna sempre anche il fallback locale (no-op se il record non vive lì)
  updateQuoteChangePdfUrlLocal(changeId, pdfUrl);
  updateQuoteItemsAndTotalLocal(change.quote_id, change.items_after, Number(change.totale_after));

  revalidatePath('/cliente');
  revalidatePath('/admin');
  revalidatePath('/admin/acconti');
  revalidatePath(`/admin/preventivi/${change.quote_id}/modifica-servizi`);

  return { success: true, pdfUrl };
}
