"use server";

import { revalidatePath } from "next/cache";
import { registerOrFindOpenDayLead, OpenDayLeadInput } from "@/lib/openDayService";
import { setClientSessionCookie } from "@/lib/magicLinkAuth";
import { recordOpenDayScan, getOpenDayStats } from "@/lib/openDayTracker";

export async function submitOpenDayEntryAction(input: OpenDayLeadInput) {
  try {
    const result = registerOrFindOpenDayLead(input);
    if (!result.success || !result.client) {
      return { success: false, error: result.error || "Impossibile completare la registrazione." };
    }

    // Imposta sessione client sicura per 30 giorni
    await setClientSessionCookie(result.client.email, result.client.id);

    revalidatePath("/openday");
    revalidatePath("/openday/diario");
    revalidatePath("/cliente");
    revalidatePath("/admin");
    revalidatePath("/admin/clienti");
    revalidatePath("/admin/eventi");

    return {
      success: true,
      isNew: result.isNew,
      clientId: result.client.id,
      quoteId: result.quote?.id,
      clientName: result.client.nome,
      redirectUrl: `/openday/diario?id=${result.client.id}`,
    };
  } catch (err: any) {
    console.error("Errore submitOpenDayEntryAction:", err);
    return { success: false, error: err?.message || "Errore di connessione." };
  }
}

export async function trackOpenDayScanAction(source: string = "qr", userAgent?: string) {
  try {
    return recordOpenDayScan(source, userAgent);
  } catch {
    return { success: false, count: 0 };
  }
}

export async function fetchOpenDayStatsAction() {
  return getOpenDayStats();
}
