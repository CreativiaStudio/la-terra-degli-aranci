"use server";

import { saveTicketOrderLocal, TicketOrder } from "@/lib/localDb";

export interface CreateTicketOrderInput {
  evento_id: string;
  evento_titolo: string;
  data_evento: string;
  cliente_nome: string;
  cliente_email: string;
  numero_biglietti: number;
  prezzo_unitario: number;
  totale: number;
  sconto_club_applicato?: boolean;
}

export interface CreateTicketOrderResponse {
  success: boolean;
  order?: TicketOrder;
  error?: string;
}

export async function submitTicketOrder(input: CreateTicketOrderInput): Promise<CreateTicketOrderResponse> {
  try {
    if (!input.evento_id || !input.cliente_email) {
      return { success: false, error: "Dati evento o email cliente mancanti." };
    }

    const order = saveTicketOrderLocal({
      evento_id: input.evento_id,
      evento_titolo: input.evento_titolo,
      data_evento: input.data_evento,
      cliente_nome: input.cliente_nome.trim() || "Ospite Club TDA",
      cliente_email: input.cliente_email.trim().toLowerCase(),
      numero_biglietti: input.numero_biglietti,
      prezzo_unitario: input.prezzo_unitario,
      totale: input.totale,
      sconto_club_applicato: input.sconto_club_applicato ?? true,
    });

    // Prova salvataggio su Supabase se configurato
    try {
      const { getServiceSupabase } = await import("@/lib/supabase");
      const supabase = getServiceSupabase();
      await supabase.from("ticket_orders").insert({
        id: order.id,
        event_id: order.evento_id,
        event_title: order.evento_titolo,
        event_date: order.data_evento,
        client_name: order.cliente_nome,
        client_email: order.cliente_email,
        tickets_count: order.numero_biglietti,
        unit_price: order.prezzo_unitario,
        total_amount: order.totale,
        club_discount: order.sconto_club_applicato,
        qr_pass_token: order.qr_pass_token,
        status: order.status,
      });
    } catch {
      // Ignora silenziosamente l'errore se la tabella Supabase non è ancora migrata
    }

    return {
      success: true,
      order,
    };
  } catch (error: any) {
    console.error("Errore salvataggio ticket order:", error);
    return {
      success: false,
      error: error?.message || "Errore sconosciuto durante l'ordine dei ticket.",
    };
  }
}
