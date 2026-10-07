"use server";

import fs from "fs";
import path from "path";
import crypto from "crypto";

import { saveLeadQuoteLocal } from "@/lib/localDb";
import { logActivity, logError } from "@/lib/blackbox";

export interface LeadVisitData {
  nome: string;
  cognome: string;
  telefono: string;
  email: string;
  canaleProvenienza: string;
  tipoEvento: string;
  dataEvento: string;
  numeroOspiti: number;
  spaziSelezionati: string[];
  stileMood: string;
  serviziInteresse: string[];
  note: string;
}

export interface SaveLeadResponse {
  success: boolean;
  message: string;
  leadId?: string;
}

export async function saveLeadVisitSheet(data: LeadVisitData): Promise<SaveLeadResponse> {
  try {
    const { quoteId, client, quote } = saveLeadQuoteLocal({
      nome: data.nome,
      cognome: data.cognome,
      telefono: data.telefono,
      email: data.email,
      canaleProvenienza: data.canaleProvenienza,
      tipoEvento: data.tipoEvento,
      dataEvento: data.dataEvento,
      numeroOspiti: data.numeroOspiti,
      spaziSelezionati: data.spaziSelezionati,
      stileMood: data.stileMood,
      serviziInteresse: data.serviziInteresse,
      note: data.note,
    });

    // Prova sincronizzazione asincrona su Supabase se configurato
    try {
      const { getServiceSupabase } = await import("@/lib/supabase");
      const supabase = getServiceSupabase();
      await supabase.from("clients").insert({
        id: client.id,
        nome: client.nome,
        cognome: client.cognome,
        email: client.email,
        telefono: client.telefono,
        provenienza: client.provenienza,
      });
      await supabase.from("quotes").insert({
        id: quoteId,
        client_id: client.id,
        tipo_evento: quote.tipo_evento,
        data_evento: quote.data_evento,
        numero_ospiti: quote.numero_ospiti,
        status: "bozza_visita",
        source: "tablet_segreteria",
      });
    } catch {
      // Ignora silenziosamente: fallback locale completato con successo
    }

    const sposi = `${String(data.nome || "").trim()} ${String(data.cognome || "").trim()}`.trim();

    logActivity({
      category: "LEAD_VISITA",
      actor: "Tablet Segreteria (iPad)",
      action: "SCHEDA_VISITA_COMPILATA",
      message: `Scheda visita compilata per ${sposi || "cliente"} — data richiesta: ${
        data.dataEvento || "da definire"
      }.`,
      metadata: {
        quoteId,
        clientId: client.id,
        sposi: sposi || null,
        data_richiesta: data.dataEvento || null,
        tipo_evento: data.tipoEvento,
        canale_provenienza: data.canaleProvenienza,
        numero_ospiti: data.numeroOspiti,
      },
    });

    return {
      success: true,
      message:
        "Scheda Visita registrata con successo. La direzione (Roberto & Rosaria) troverà la bozza pronta in Amministrazione per la formulazione del preventivo.",
      leadId: quoteId,
    };
  } catch (error) {
    console.error("Errore nel salvataggio scheda visita:", error);
    logError("LEAD_VISITA", "Tablet Segreteria (iPad)", "SCHEDA_VISITA_ERRORE", error, {
      nome: data?.nome,
      cognome: data?.cognome,
      dataEvento: data?.dataEvento,
    });
    return {
      success: false,
      message: "Errore durante il salvataggio della scheda. Riprova.",
    };
  }
}
