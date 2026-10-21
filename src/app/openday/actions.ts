"use server";

import { revalidatePath } from "next/cache";
import { registerOrFindOpenDayLead, OpenDayLeadInput } from "@/lib/openDayService";
import { setClientSessionCookie } from "@/lib/magicLinkAuth";
import {
  registerOrFindOpenDayLeadCloud,
  recordOpenDayScanCloud,
  getOpenDayAdminData,
} from "@/lib/openDayCloudSync";

export async function submitOpenDayEntryAction(input: OpenDayLeadInput) {
  try {
    // 1. Registra in cloud su R2 (persistente e sincronizzato su tutti i nodi Vercel)
    const result = await registerOrFindOpenDayLeadCloud(input);
    if (!result.success || !result.client) {
      return { success: false, error: result.error || "Impossibile completare la registrazione." };
    }

    // 2. Imposta sessione client sicura per 30 giorni
    await setClientSessionCookie(result.client.email, result.client.id);

    revalidatePath("/openday");
    revalidatePath("/openday/diario");
    revalidatePath("/cliente");
    revalidatePath("/admin");
    revalidatePath("/admin/openday");
    revalidatePath("/admin/clienti");
    revalidatePath("/admin/eventi");

    return {
      success: true,
      isNew: result.isNew,
      clientId: result.client.id,
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
    return await recordOpenDayScanCloud(source, userAgent);
  } catch {
    return { success: false, count: 0 };
  }
}

export async function fetchOpenDayStatsAction() {
  const data = await getOpenDayAdminData();
  return data.stats;
}
