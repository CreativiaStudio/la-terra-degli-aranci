"use server";

import { revalidatePath } from "next/cache";
import { logActivity as logBlackboxAction } from "@/lib/blackbox";
import {
  createAppointmentLocal,
  updateAppointmentStatusLocal,
  deleteAppointmentLocal,
  type Appointment,
} from "@/lib/localDb";

/** Stati ammessi per un appuntamento. */
const VALID_STATES: Appointment["stato"][] = [
  "da_confermare",
  "confermato",
  "effettuato",
  "annullato",
];

type AppointmentInput = Partial<Record<keyof Appointment, unknown>>;

/** Converte una FormData in un oggetto semplice tipizzato per createAppointmentLocal. */
function formDataToInput(formData: FormData): AppointmentInput {
  const input: AppointmentInput = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") input[key as keyof Appointment] = value;
  });
  return input;
}

function normalizeInput(raw: AppointmentInput): Partial<Appointment> {
  const str = (v: unknown): string | undefined => {
    const s = String(v ?? "").trim();
    return s || undefined;
  };
  const ospitiNum = Number(raw.ospitiPrevisti);

  return {
    tipo: raw.tipo === "privato" ? "privato" : "wedding",
    nome: str(raw.nome) || "",
    cognome: str(raw.cognome),
    partnerNome: str(raw.partnerNome),
    partnerCognome: str(raw.partnerCognome),
    telefono: str(raw.telefono) || "",
    email: str(raw.email),
    dataOra: str(raw.dataOra) || (str(raw.dataAppuntamento) && str(raw.orarioAppuntamento) ? `${raw.dataAppuntamento}T${raw.orarioAppuntamento}` : str(raw.dataAppuntamento) || ""),
    dataAppuntamento: str(raw.dataAppuntamento) || "",
    orarioAppuntamento: str(raw.orarioAppuntamento) || "",
    dataEventoPresunta: str(raw.dataEventoPresunta),
    interesse: (typeof raw.interesse === "string" ? raw.interesse : "da_definire") as Appointment["interesse"],
    ospitiPrevisti: Number.isFinite(ospitiNum) && ospitiNum > 0 ? ospitiNum : undefined,
    canale: (typeof raw.canale === "string" ? raw.canale : "telefono") as Appointment["canale"],
    stato: (typeof raw.stato === "string" && VALID_STATES.includes(raw.stato as Appointment["stato"])
      ? (raw.stato as Appointment["stato"])
      : "da_confermare"),
    note: str(raw.note),
  };
}

/**
 * Crea un nuovo appuntamento / visita in tenuta.
 * Accetta sia un oggetto payload sia una FormData.
 */
export async function createAppointmentAction(
  input: AppointmentInput | FormData
): Promise<{ success: true; appointment: Appointment } | { success: false; error: string }> {
  try {
    const raw = input instanceof FormData ? formDataToInput(input) : input;
    const data = normalizeInput(raw || {});

    if (!data.nome) {
      return { success: false, error: "Inserisci il nome del referente o degli sposi." };
    }
    if (!data.telefono) {
      return { success: false, error: "Il numero di telefono è obbligatorio." };
    }
    if (!data.dataAppuntamento) {
      return { success: false, error: "Seleziona la data dell'appuntamento." };
    }
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
      return { success: false, error: "L'indirizzo email non è valido." };
    }

    const appointment = createAppointmentLocal(data);

    const intestatario = [appointment.nome, appointment.cognome].filter(Boolean).join(" ").trim();
    logBlackboxAction({
      category: "LEAD_VISITA",
      actor: "Segreteria TDA",
      action: "APPUNTAMENTO_CREATO",
      message: `Nuovo appuntamento per ${intestatario || "cliente"} — ${appointment.tipo === "wedding" ? "Wedding" : "Evento privato"} del ${appointment.dataAppuntamento} ${appointment.orarioAppuntamento}`,
      metadata: {
        id: appointment.id,
        tipo: appointment.tipo,
        telefono: appointment.telefono,
        canale: appointment.canale,
        interesse: appointment.interesse,
        stato: appointment.stato,
      },
    });

    revalidatePath("/admin");

    return { success: true, appointment };
  } catch (error) {
    console.error("Errore createAppointmentAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore durante il salvataggio dell'appuntamento.",
    };
  }
}

/** Aggiorna lo stato di un appuntamento (conferma / effettuato / annulla). */
export async function updateAppointmentStatusAction(
  id: string,
  stato: Appointment["stato"]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) return { success: false, error: "Appuntamento non valido." };
    if (!VALID_STATES.includes(stato)) {
      return { success: false, error: "Stato non riconosciuto." };
    }

    const updated = updateAppointmentStatusLocal(id, stato);
    if (!updated) return { success: false, error: "Appuntamento non trovato." };

    logBlackboxAction({
      category: "LEAD_VISITA",
      actor: "Segreteria TDA",
      action: "APPUNTAMENTO_STATO_AGGIORNATO",
      message: `Appuntamento ${id.slice(0, 12)} aggiornato a "${stato}"`,
      metadata: { id, stato },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Errore updateAppointmentStatusAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore durante l'aggiornamento dello stato.",
    };
  }
}

/** Elimina definitivamente un appuntamento. */
export async function deleteAppointmentAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) return { success: false, error: "Appuntamento non valido." };

    const deleted = deleteAppointmentLocal(id);
    if (!deleted) return { success: false, error: "Appuntamento non trovato." };

    logBlackboxAction({
      category: "LEAD_VISITA",
      actor: "Segreteria TDA",
      action: "APPUNTAMENTO_ELIMINATO",
      message: `Appuntamento ${id.slice(0, 12)} eliminato`,
      metadata: { id },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Errore deleteAppointmentAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore durante l'eliminazione dell'appuntamento.",
    };
  }
}
