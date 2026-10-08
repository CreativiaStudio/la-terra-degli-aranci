"use server";

import fs from "fs";
import path from "path";
import crypto from "crypto";

import { revalidatePath } from "next/cache";

import {
  saveLeadQuoteLocal,
  getAppointmentLocal,
  updateAppointmentPreferencesLocal,
  updateAppointmentStatusLocal,
  findOrCreateClientForAppointmentLocal,
  toggleTourServicePreferenceLocal,
  saveWeddingDiaryLocal,
  type Appointment,
} from "@/lib/localDb";
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

/* ------------------------------------------------------------------ */
/* Preferenze Visita (Tablet Segreteria)                               */
/* ------------------------------------------------------------------ */

/**
 * Preferenze raccolte dalla segreteria durante la visita in tenuta.
 * Corrispondono 1:1 ai campi mostrati nella modale touch-friendly.
 */
export interface AppointmentPreferencesInput {
  stileMood: string;
  spaziSelezionati: string[];
  tipoCerimonia: string;
  serviziInteresse: string[];
  preferenzeServizi?: string[];
  /** Date candidate di preferenza della coppia (fino a 4 date ISO 'YYYY-MM-DD'). */
  dateCandidate?: string[];
  /** Mese di riferimento per il controllo disponibilità (es. '2027-07'). */
  mesePreferenza?: string;
  musicaNote: string;
  celiaciNote: string;
  noteGenerali: string;
}

export interface SaveAppointmentPreferencesResponse {
  success: boolean;
  message: string;
}

/** Normalizza in modo difensivo le preferenze ricevute dal client. */
function normalizeAppointmentPreferences(
  preferences: Partial<AppointmentPreferencesInput> | null | undefined
): AppointmentPreferencesInput {
  const asString = (value: unknown): string => String(value ?? "").trim();
  const asArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((v) => typeof v === "string" && v.trim().length > 0) : [];

  return {
    stileMood: asString(preferences?.stileMood),
    spaziSelezionati: asArray(preferences?.spaziSelezionati),
    tipoCerimonia: asString(preferences?.tipoCerimonia),
    serviziInteresse: asArray(preferences?.serviziInteresse),
    preferenzeServizi: asArray(preferences?.preferenzeServizi),
    dateCandidate: asArray(preferences?.dateCandidate),
    mesePreferenza: asString(preferences?.mesePreferenza),
    musicaNote: asString(preferences?.musicaNote),
    celiaciNote: asString(preferences?.celiaciNote),
    noteGenerali: asString(preferences?.noteGenerali),
  };
}

/**
 * Salva le preferenze raccolte dalla Segreteria durante la visita:
 * 1. aggiorna l'appuntamento con il campo `preferenze`;
 * 2. trova/crea il cliente collegato e scrive le risposte canoniche nel
 *    Wedding Diary, così la coppia le ritrova già compilate nell'Area Riservata;
 * 3. traccia l'azione nella Scatola Nera.
 */
export async function saveAppointmentPreferencesAction(
  appointmentId: string,
  preferences: AppointmentPreferencesInput
): Promise<SaveAppointmentPreferencesResponse> {
  try {
    if (!appointmentId) {
      return { success: false, message: "Appuntamento non valido. Riprova." };
    }

    const appointment = getAppointmentLocal(appointmentId);
    if (!appointment) {
      return {
        success: false,
        message: "Appuntamento non trovato. Aggiorna la pagina e riprova.",
      };
    }

    const normalized = normalizeAppointmentPreferences(preferences);

    // 1) Aggiorna l'appuntamento con le preferenze della visita.
    updateAppointmentPreferencesLocal(appointmentId, normalized);

    // 2) Sincronizza il Wedding Diary della coppia (trova o crea il cliente).
    const client = findOrCreateClientForAppointmentLocal(appointment);

    saveWeddingDiaryLocal({
      client_id: client.id,
      answers: {
        style_mood: normalized.stileMood,
        preferred_spaces: normalized.spaziSelezionati,
        ceremony_type: normalized.tipoCerimonia,
        open_bar_cocktails: normalized.serviziInteresse.join(", "),
        tour_service_preferences: (normalized.preferenzeServizi || []).join(", "),
        target_dates: (normalized.dateCandidate || []).join(", "),
        music_preference: normalized.musicaNote,
        dietary_notes: normalized.celiaciNote,
        general_notes: normalized.noteGenerali,
        guest_count_estimate: String(appointment.ospitiPrevisti || ""),
      },
    });

    const sposi =
      [appointment.nome, appointment.cognome].filter(Boolean).join(" ").trim() ||
      [appointment.nome, appointment.partnerNome].filter(Boolean).join(" ").trim() ||
      "cliente";

    // 3) Scatola Nera.
    logActivity({
      category: "LEAD_VISITA",
      actor: "Tablet Segreteria (iPad)",
      action: "PREFERENZE_VISITA_REGISTRATE",
      message: "Preferenze visita registrate dalla Segreteria",
      metadata: {
        appointmentId,
        clientId: client.id,
        sposi,
        tipo: appointment.tipo,
        tipo_cerimonia: normalized.tipoCerimonia,
        spazi: normalized.spaziSelezionati,
        servizi: normalized.serviziInteresse,
        date_candidate: normalized.dateCandidate,
      },
    });

    revalidatePath("/segreteria");

    return {
      success: true,
      message:
        "Preferenze salvate! Gli sposi le troveranno già precompilate nella loro Area Riservata.",
    };
  } catch (error) {
    console.error("Errore nel salvataggio preferenze visita:", error);
    logError("LEAD_VISITA", "Tablet Segreteria (iPad)", "PREFERENZE_VISITA_ERRORE", error, {
      appointmentId,
    });
    return {
      success: false,
      message: "Errore durante il salvataggio delle preferenze. Riprova.",
    };
  }
}

/** Aggiorna lo stato di un appuntamento (confermato / effettuato). */
export async function updateAppointmentStatoAction(
  id: string,
  stato: Appointment["stato"]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) return { success: false, error: "Appuntamento non valido." };
    const validi: Appointment["stato"][] = ["da_confermare", "confermato", "effettuato", "annullato"];
    if (!validi.includes(stato)) return { success: false, error: "Stato non riconosciuto." };

    const updated = updateAppointmentStatusLocal(id, stato);
    if (!updated) return { success: false, error: "Appuntamento non trovato." };

    logActivity({
      category: "LEAD_VISITA",
      actor: "Tablet Segreteria (iPad)",
      action: "APPUNTAMENTO_STATO_AGGIORNATO",
      message: `Appuntamento aggiornato a "${stato}"`,
      metadata: { id, stato },
    });

    revalidatePath("/segreteria");
    return { success: true };
  } catch (error) {
    console.error("Errore updateAppointmentStatoAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore durante l'aggiornamento dello stato.",
    };
  }
}

/* ------------------------------------------------------------------ */
/* Tour Fotografico Servizi — preferenze servizio per visita          */
/* ------------------------------------------------------------------ */

export interface ToggleTourServiceResponse {
  success: boolean;
  /** `true` se il servizio è stato appena aggiunto, `false` se rimosso. */
  active: boolean;
  /** Elenco aggiornato dei servizi preferiti per quella visita. */
  allServices: string[];
  message?: string;
}

/**
 * Toggle 1-click di un servizio/spazio del Tour Fotografico per una visita.
 * Aggiorna l'appuntamento, sincronizza il Wedding Diary della coppia e
 * revalida sia la segreteria sia la dashboard direzione.
 */
export async function toggleAppointmentTourServiceAction(
  appointmentId: string,
  serviceTitle: string
): Promise<ToggleTourServiceResponse> {
  try {
    if (!appointmentId || !serviceTitle) {
      return { success: false, active: false, allServices: [], message: "Dati mancanti. Riprova." };
    }

    const result = toggleTourServicePreferenceLocal(appointmentId, serviceTitle);
    if (!result) {
      return {
        success: false,
        active: false,
        allServices: [],
        message: "Appuntamento non trovato. Aggiorna la pagina e riprova.",
      };
    }

    const { appointment, added, currentServices } = result;
    const sposi =
      [appointment.nome, appointment.cognome].filter(Boolean).join(" ").trim() ||
      [appointment.nome, appointment.partnerNome].filter(Boolean).join(" ").trim() ||
      "cliente";

    logActivity({
      category: "LEAD_VISITA",
      actor: "Tablet Segreteria (iPad)",
      action: added ? "TOUR_SERVIZIO_ASSEGNATO" : "TOUR_SERVIZIO_RIMOSSO",
      message: `"${serviceTitle}" ${added ? "assegnato" : "rimosso"} per ${sposi}`,
      metadata: {
        appointmentId,
        sposi,
        servizio: serviceTitle,
        servizi_totali: currentServices,
      },
    });

    revalidatePath("/segreteria");
    revalidatePath("/admin");

    return { success: true, active: added, allServices: currentServices };
  } catch (error) {
    console.error("Errore toggleAppointmentTourServiceAction:", error);
    logError("LEAD_VISITA", "Tablet Segreteria (iPad)", "TOUR_SERVIZIO_ERRORE", error, {
      appointmentId,
      serviceTitle,
    });
    return {
      success: false,
      active: false,
      allServices: [],
      message: "Errore durante l'aggiornamento della preferenza. Riprova.",
    };
  }
}
