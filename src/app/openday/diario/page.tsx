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
import { getOpenDayLeadAndDiary } from "@/lib/openDayCloudSync";
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

  // 3. Flusso Condivisione WhatsApp tra Sposi o Accesso Direzionale 1-Click (Token HMAC)
  const hasValidShareToken = Boolean(
    requestedId && shareToken && verifyDiaryShareToken(requestedId, shareToken)
  );

  if (hasValidShareToken && requestedId) {
    const cloudData = await getOpenDayLeadAndDiary(requestedId);
    const matchedClient = cloudData.client || clients.find((c) => c.id === requestedId);
    if (matchedClient) {
      targetClientId = requestedId;
    }
  } else if (isAdmin) {
    // L'amministratore autenticato può ispezionare qualsiasi diario (accesso direzionale Roberto 1-Click)
    targetClientId = requestedId || clientSession?.clientId;
  } else if (clientSession?.clientId) {
    // Lo sposo/sposa autenticato vede il proprio diario
    targetClientId = requestedId && requestedId === clientSession.clientId ? requestedId : clientSession.clientId;
  }

  // 4. Se nessun accesso autorizzato, reindirizza alla pagina di benvenuto Open Day
  if (!targetClientId) {
    redirect("/openday");
  }

  // Risoluzione cliente prima su cloud R2 (persistente e condiviso), poi su localDb
  const cloudData = await getOpenDayLeadAndDiary(targetClientId);
  let client = cloudData.client || clients.find((c) => c.id === targetClientId);

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

  const initialDiary = cloudData.diary || getWeddingDiaryLocal(client.id);
  const partnerShareToken = createDiaryShareToken(client.id);
  const shouldSetPartnerCookie = Boolean(
    hasValidShareToken && !isAdmin && clientSession?.clientId !== client.id
  );

  return (
    <DiarioClientView
      client={client}
      quote={quote}
      initialDiary={initialDiary}
      shareToken={partnerShareToken}
      shouldSetPartnerCookie={shouldSetPartnerCookie}
    />
  );
}
