"use server";

import { getServiceSupabase } from "@/lib/supabase";
import { saveQuoteLocal } from "@/lib/localDb";
import { uploadJsonToR2 } from "@/lib/r2";
import { revalidatePath } from "next/cache";

export async function createQuote(formData: any) {
  let quoteId: string = "";

  try {
    const supabase = getServiceSupabase();
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

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        client_id: client.id,
        tipo_evento: formData.tipo_evento,
        data_evento: formData.data_evento || null,
        items: formData.items,
        sconto_fisso: formData.sconto_fisso || 0,
        totale_calcolato: formData.totale_calcolato,
        status: 'inviato'
      })
      .select()
      .single();

    if (quoteError) throw quoteError;
    quoteId = quote.id;

  } catch (error: any) {
    console.warn("Supabase non raggiungibile, salvataggio locale sicuro attivato:", error?.message || error);
    const result = saveQuoteLocal(formData);
    quoteId = result.quoteId;
  }

  // Backup Immutabile del Preventivo su Cloudflare R2
  try {
    await uploadJsonToR2({
      id: quoteId,
      ...formData,
      created_at: new Date().toISOString()
    }, `preventivi/${quoteId}.json`);
    console.log(`✓ Preventivo ${quoteId} salvato con successo anche in backup Cloudflare R2!`);
  } catch (r2Error) {
    console.warn("Avviso salvataggio R2 preventivi:", r2Error);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/preventivi');
  return { success: true, quoteId };
}
