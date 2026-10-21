import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getStore, getWeddingDiaryLocal } from "@/lib/localDb";
import {
  getClientSessionFromCookie,
  verifyDiaryShareToken,
  createDiaryShareToken,
  setClientSessionCookie,
} from "@/lib/magicLinkAuth";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import DiarioClientView from "./DiarioClientView";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ id?: string; share?: string }>;
}

export default async function OpenDayDiarioPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requestedId = params.id?.trim();
  const shareToken = params.share?.trim();

  // 1. Verifica sessione client (cookie tda_client_session firmato HMAC)
  const clientSession = await getClientSessionFromCookie();

  // 2. Verifica se l'utente è un amministratore dello staff (cookie tda_session)
  const cookieStore = await cookies();
  const staffCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const staffSession = staffCookie ? await verifySessionToken(staffCookie) : null;
  const isAdmin = staffSession?.role === "admin";

  const store = getStore();
  const clients = store.clients || [];
  const quotes = store.quotes || [];

  let targetClientId: string | undefined = undefined;

  // 3. Flusso Condivisione WhatsApp tra Sposi (Token crittografico HMAC di coppia)
  if (requestedId && shareToken && verifyDiaryShareToken(requestedId, shareToken)) {
    const matchedClient = clients.find((c) => c.id === requestedId);
    if (matchedClient) {
      targetClientId = requestedId;
      // Imposta il cookie sicuro anche sul dispositivo del partner
      if (matchedClient.email) {
        await setClientSessionCookie(matchedClient.email, matchedClient.id);
      }
    }
  } else if (isAdmin) {
    // L'amministratore autenticato può ispezionare qualsiasi diario
    targetClientId = requestedId || clientSession?.clientId;
  } else if (clientSession?.clientId) {
    // Lo sposo/sposa autenticato vede ESCLUSIVAMENTE il proprio diario (Protezione IDOR assoluta)
    targetClientId = clientSession.clientId;
  }

  // 4. Se nessun accesso autorizzato, reindirizza alla pagina di benvenuto Open Day
  if (!targetClientId) {
    redirect("/openday");
  }

  let client = clients.find((c) => c.id === targetClientId);

  // Se non trovato tramite ID cliente, controlla se corrisponde a una quote
  let quote = quotes.find(
    (q) => q.client_id === targetClientId || q.id === targetClientId
  ) || null;

  if (!client && quote?.clients) {
    client = quote.clients;
  }

  if (!client) {
    redirect("/openday");
  }

  const initialDiary = getWeddingDiaryLocal(client.id);
  const partnerShareToken = createDiaryShareToken(client.id);

  return (
    <DiarioClientView
      client={client}
      quote={quote}
      initialDiary={initialDiary}
      shareToken={partnerShareToken}
    />
  );
}
