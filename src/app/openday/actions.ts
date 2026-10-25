"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { registerOrFindOpenDayLead, OpenDayLeadInput } from "@/lib/openDayService";
import { setClientSessionCookie, verifyDiaryShareToken } from "@/lib/magicLinkAuth";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import {
  registerOrFindOpenDayLeadCloud,
  recordOpenDayScanCloud,
  getOpenDayAdminData,
  getOpenDayLeadAndDiary,
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

export async function trackOpenDayScanAction(
  source: string = "qr",
  userAgent?: string,
  isUnique: boolean = true
) {
  try {
    return await recordOpenDayScanCloud(source, userAgent, isUnique);
  } catch {
    return { success: false, count: 0, totalScans: 0, uniqueScans: 0 };
  }
}

export async function fetchOpenDayStatsAction() {
  const data = await getOpenDayAdminData();
  return data.stats;
}

export async function syncPartnerSessionCookieAction(clientId: string, shareToken: string) {
  try {
    if (!clientId || !shareToken || !verifyDiaryShareToken(clientId, shareToken)) {
      return { success: false };
    }
    const cookieStore = await cookies();
    const staffCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const staffSession = staffCookie ? await verifySessionToken(staffCookie) : null;
    if (staffSession?.role === "admin") {
      return { success: true, skippedForAdmin: true };
    }
    const cloud = await getOpenDayLeadAndDiary(clientId);
    if (cloud.client?.email) {
      await setClientSessionCookie(cloud.client.email, cloud.client.id);
    }
    return { success: true };
  } catch {
    return { success: false };
  }
}
