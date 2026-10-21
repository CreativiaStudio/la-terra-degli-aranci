import React from "react";
import { redirect } from "next/navigation";
import { getStore, getWeddingDiaryLocal } from "@/lib/localDb";
import { getClientSessionFromCookie } from "@/lib/magicLinkAuth";
import DiarioClientView from "./DiarioClientView";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function OpenDayDiarioPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getClientSessionFromCookie();

  let targetClientId = params.id;
  if (!targetClientId && session?.clientId) {
    targetClientId = session.clientId;
  }

  const store = getStore();
  const clients = store.clients || [];
  const quotes = store.quotes || [];

  let client = targetClientId
    ? clients.find((c) => c.id === targetClientId)
    : session?.email
    ? clients.find((c) => c.email?.toLowerCase() === session.email.toLowerCase())
    : null;

  // Se non trovato tramite ID, controlla se c'è una quote associata
  let quote = targetClientId
    ? quotes.find((q) => q.client_id === targetClientId || q.id === targetClientId)
    : null;

  if (!client && quote?.clients) {
    client = quote.clients;
  }

  // Se nessun cliente o sessione valida, reindirizza alla pagina di benvenuto Open Day
  if (!client) {
    redirect("/openday");
  }

  const initialDiary = getWeddingDiaryLocal(client.id);

  return (
    <DiarioClientView
      client={client}
      quote={quote}
      initialDiary={initialDiary}
    />
  );
}
