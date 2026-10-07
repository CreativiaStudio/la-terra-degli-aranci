"use server";

import { revalidatePath } from "next/cache";
import {
  saveQuickCalendarOptionLocal,
  getQuickCalendarOptionsLocal,
  deletePendingContractLocal,
} from "@/lib/localDb";
import { checkSlotAvailability, normalizeEventDate } from "@/lib/slotAvailability";
import { SEMI_ESCLUSIVA_FORMULE } from "@/lib/contractMeta";

/**
 * Fissa un'opzione veloce di 7 giorni dal calendario: solo contatto, data, turno e spazio,
 * senza prezzi né preventivi. Verifica la disponibilità prima di bloccare lo slot.
 */
export async function saveQuickCalendarOptionAction(input: {
  nome: string;
  telefono: string;
  email?: string;
  dataEvento: string;
  turno: string;
  formula: string;
  note?: string;
}) {
  try {
    const nome = String(input.nome || "").trim();
    const telefono = String(input.telefono || "").trim();
    const email = String(input.email || "").trim();
    const turno = input.turno === "cena" ? "cena" : "pranzo";
    const formula = String(input.formula || "esclusiva");
    const dataEvento = normalizeEventDate(input.dataEvento);

    if (!nome) return { success: false as const, error: "Inserisci il nome del cliente o degli sposi." };
    if (!telefono) return { success: false as const, error: "Il telefono è obbligatorio." };
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return { success: false as const, error: "L'indirizzo email non è valido." };
    }
    if (!dataEvento) return { success: false as const, error: "Seleziona una data evento valida." };
    if (formula !== "esclusiva" && formula !== "sala_bianca" && formula !== "sala_tufo") {
      return { success: false as const, error: "Formula non riconosciuta." };
    }

    const isEsclusiva = formula === "esclusiva";
    const availability = checkSlotAvailability(
      dataEvento,
      turno,
      isEsclusiva ? "esclusiva" : "semi_esclusiva",
      isEsclusiva ? [] : SEMI_ESCLUSIVA_FORMULE[formula].spazi
    );
    if (!availability.available) {
      return {
        success: false as const,
        error: availability.conflictReason || "Slot non disponibile per la data selezionata.",
      };
    }

    const { quoteId } = saveQuickCalendarOptionLocal({
      nome,
      telefono,
      email: email || undefined,
      dataEvento,
      turno,
      formula,
      note: String(input.note || "").trim() || undefined,
    });

    revalidatePath("/admin/calendario");

    const option = getQuickCalendarOptionsLocal().find((o) => o.quoteId === quoteId) || null;
    return { success: true as const, quoteId, option };
  } catch (error) {
    console.error("Errore saveQuickCalendarOptionAction:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Errore durante il salvataggio dell'opzione.",
    };
  }
}

/** Rilascia (elimina) un'opzione rapida liberando lo slot in calendario. */
export async function releaseQuickCalendarOptionAction(quoteId: string) {
  const deleted = deletePendingContractLocal(quoteId);
  revalidatePath("/admin/calendario");
  revalidatePath("/admin/contratti");
  revalidatePath("/admin");
  return { success: deleted };
}
