"use server";

import { getServiceSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createQuote(formData: any) {
  const supabase = getServiceSupabase();

  try {
    // 1. Inserisci o aggiorna il cliente (usiamo l'email come chiave se vogliamo, 
    // ma per semplicità ne creiamo uno nuovo o usiamo l'ID se passato. Qui per ora creiamo un record cliente)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        nome: formData.cliente.nome,
        cognome: formData.cliente.cognome,
        email: formData.cliente.email,
        telefono: formData.cliente.telefono,
        codice_fiscale: formData.cliente.codice_fiscale
      })
      .select()
      .single();

    if (clientError) throw clientError;

    // 2. Inserisci il preventivo collegato al cliente
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        client_id: client.id,
        tipo_evento: formData.tipo_evento,
        data_evento: formData.data_evento || null,
        items: formData.items,
        sconto_fisso: formData.sconto_fisso || 0,
        totale_calcolato: formData.totale_calcolato,
        status: 'inviato' // Lo mettiamo direttamente come Inviato/Generato
      })
      .select()
      .single();

    if (quoteError) throw quoteError;

    revalidatePath('/admin/preventivi');
    return { success: true, quoteId: quote.id };

  } catch (error: any) {
    console.error("Errore creazione preventivo:", error);
    return { success: false, error: error.message };
  }
}
