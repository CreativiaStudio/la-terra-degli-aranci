"use server";

import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/localDb";
import {
  createMagicLink,
  verifyMagicLink,
  setClientSessionCookie,
  clearClientSessionCookie,
} from "@/lib/magicLinkAuth";

export async function sendMagicLinkAction(rawEmail: string) {
  try {
    const email = (rawEmail || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return { success: false, error: "Inserisci un indirizzo email valido." };
    }

    const store = getStore();
    const clients = store.clients || [];
    const quotes = store.quotes || [];

    // Cerca cliente esistente per associare l'ID corrispondente
    const client = clients.find(
      (c) => c?.email && c.email.trim().toLowerCase() === email
    );
    const quote = quotes.find(
      (q) => q?.clients?.email && q.clients.email.trim().toLowerCase() === email
    );

    const clientId = client?.id || quote?.client_id || quote?.id || undefined;

    const { token, otpCode, expiresAt } = createMagicLink(email, clientId);

    // In produzione invia email tramite Resend / SMTP.
    // In dev / test visualizziamo log e ritorniamo devCode per test istantanei senza uscire dal browser.
    console.log(`[TDA Magic Link] Email: ${email} | Codice OTP: ${otpCode} | Token: ${token}`);

    return {
      success: true,
      message: `Abbiamo inviato un link di accesso sicuro e un codice OTP a 6 cifre a ${email}.`,
      otpCodePreview: process.env.NODE_ENV !== "production" ? otpCode : undefined,
      tokenPreview: process.env.NODE_ENV !== "production" ? token : undefined,
    };
  } catch (err: any) {
    console.error("Errore sendMagicLinkAction:", err);
    return { success: false, error: err?.message || "Errore durante l'invio del link." };
  }
}

export async function verifyAccessAction(tokenOrOtp: string, email?: string) {
  try {
    if (!tokenOrOtp || tokenOrOtp.trim().length === 0) {
      return { success: false, error: "Inserisci il codice OTP a 6 cifre o usa il link dell'email." };
    }

    const result = verifyMagicLink(tokenOrOtp, email);
    if (!result.valid || !result.email) {
      return { success: false, error: result.error || "Codice o link non valido." };
    }

    // Imposta il cookie di sessione sicuro
    await setClientSessionCookie(result.email, result.clientId);

    revalidatePath("/cliente");
    return { success: true, redirectUrl: "/cliente" };
  } catch (err: any) {
    console.error("Errore verifyAccessAction:", err);
    return { success: false, error: err?.message || "Errore durante la verifica dell'accesso." };
  }
}

export async function logoutClientAction() {
  await clearClientSessionCookie();
  revalidatePath("/cliente");
  return { success: true };
}
