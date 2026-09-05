"use server";

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_FILE = path.join(process.cwd(), "data_store.json");

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
    let store: any = { clients: [], quotes: [] };
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, "utf8");
        store = JSON.parse(raw);
      } catch {
        store = { clients: [], quotes: [] };
      }
    }

    if (!store.clients) store.clients = [];
    if (!store.quotes) store.quotes = [];

    const clientId = crypto.randomUUID();
    const newClient = {
      id: clientId,
      nome: data.nome.trim(),
      cognome: data.cognome.trim(),
      email: data.email.trim(),
      telefono: data.telefono.trim(),
      provenienza: data.canaleProvenienza || "Tour Location Tablet",
      created_at: new Date().toISOString(),
    };
    store.clients.push(newClient);

    const quoteId = crypto.randomUUID();
    const newQuote = {
      id: quoteId,
      client_id: clientId,
      tipo_evento: data.tipoEvento === "wedding" ? "wedding" : "eventi",
      data_evento: data.dataEvento || null,
      numero_ospiti: data.numeroOspiti || 100,
      spazi_selezionati: data.spaziSelezionati || [],
      stile_mood: data.stileMood || "",
      servizi_interesse: data.serviziInteresse || [],
      note_visita_segreteria: data.note || "",
      status: "bozza_visita",
      source: "tablet_segreteria",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      clients: newClient,
    };
    store.quotes.unshift(newQuote);

    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");

    // Prova sincronizzazione asincrona su Supabase se configurato
    try {
      const { getServiceSupabase } = await import("@/lib/supabase");
      const supabase = getServiceSupabase();
      await supabase.from("clients").insert({
        id: clientId,
        nome: newClient.nome,
        cognome: newClient.cognome,
        email: newClient.email,
        telefono: newClient.telefono,
        provenienza: newClient.provenienza,
      });
      await supabase.from("quotes").insert({
        id: quoteId,
        client_id: clientId,
        tipo_evento: newQuote.tipo_evento,
        data_evento: newQuote.data_evento,
        numero_ospiti: newQuote.numero_ospiti,
        status: "bozza_visita",
        source: "tablet_segreteria",
      });
    } catch {
      // Ignora silenziosamente: fallback locale completato con successo
    }

    return {
      success: true,
      message:
        "Scheda Visita registrata con successo. La direzione (Roberto & Rosaria) troverà la bozza pronta in Amministrazione per la formulazione del preventivo.",
      leadId: quoteId,
    };
  } catch (error) {
    console.error("Errore nel salvataggio scheda visita:", error);
    return {
      success: false,
      message: "Errore durante il salvataggio della scheda. Riprova.",
    };
  }
}
