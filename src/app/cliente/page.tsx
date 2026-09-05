import React from "react";
import { getQuotesFast } from "@/lib/dataHelper";
import { getWeddingDiaryLocal } from "@/lib/localDb";
import { listPdfsInR2 } from "@/lib/r2";
import { generateSignature } from "@/lib/crypto";
import { getQuoteChangesHistory } from "@/app/preventivi/modifica/actions";
import { getServerSession } from "@/lib/auth";
import ClientPortalWrapper from "./ClientPortalWrapper";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ id?: string; lang?: string; mode?: string }>;
}

export default async function ClientPortalPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getServerSession();

  const [quotes, signedPdfs] = await Promise.all([
    getQuotesFast(),
    Promise.all([
      listPdfsInR2("contratti/wedding/"),
      listPdfsInR2("contratti/eventi/"),
    ])
      .then(([w, e]) => [...(w || []), ...(e || [])])
      .catch(() => []),
  ]);

  // Mappatura parametri e determinazione Modalità Dinamica (Wedding, Privato, Storico)
  let searchId = params.id;
  if (searchId === "demo1") searchId = "client-demo1";
  if (searchId === "demo-ai" || searchId === "demo1b") searchId = "client-demo-ai";
  if (searchId === "demo2") searchId = "client-demo-privato";
  if (searchId === "demo3") searchId = "client-demo3";
  if (searchId === "demo4") searchId = "client-demo4";

  // Modalità operativa: query param 'mode', oppure ruolo di sessione, oppure id
  let mode: "wedding" | "privato" | "storico" = "wedding";
  if (
    params.mode === "storico" ||
    session?.clientMode === "storico" ||
    session?.role === "storico" ||
    searchId === "client-demo4"
  ) {
    mode = "storico";
  } else if (
    params.mode === "privato" ||
    session?.clientMode === "privato" ||
    session?.role === "privato" ||
    searchId === "client-demo-privato"
  ) {
    mode = "privato";
  }

  // Trova il preventivo selezionato o configura i mock dedicati per le 3 modalità
  const clientQuotesRaw = searchId
    ? quotes.filter((q) => q.id === searchId || q.client_id === searchId)
    : quotes;
  let selectedQuote = clientQuotesRaw[0];

  if (mode === "storico") {
    selectedQuote = {
      id: "quote-demo-storico",
      client_id: "client-demo4",
      tipo_evento: "wedding",
      data_evento: "2024-06-15", // Evento passato!
      totale_calcolato: 17500,
      status: "firmato",
      clients: {
        id: "client-demo4",
        nome: "Elena & Ferdinando",
        cognome: "(Ospiti Storici Club TDA)",
        email: "storico.demo@laterradegliaranci.it",
      },
      items: [
        { descrizione: "Ricevimento Nuziale in Agrumeto & Villa", prezzo_unitario: 14000, quantita: 1 },
        { descrizione: "Rito Simbolico nel Giardino delle Promesse", prezzo_unitario: 1200, quantita: 1 },
        { descrizione: "Show Cooking Graffette & Open Bar in Sala Tufo", prezzo_unitario: 2300, quantita: 1 },
      ],
    };
  } else if (mode === "privato") {
    selectedQuote = {
      id: "quote-demo-privato",
      client_id: "client-demo-privato",
      tipo_evento: "eventi",
      data_evento: "2026-11-20",
      totale_calcolato: 5800,
      status: "firmato",
      clients: {
        id: "client-demo-privato",
        nome: "Famiglia Sola",
        cognome: "(Festa Privata / Laurea)",
        email: "festa@laterradegliaranci.it",
        telefono: "+39 335 1234567",
      },
      items: [
        { descrizione: "Esclusiva Sala Tufo & Giardino d'Inverno", prezzo_unitario: 2500, quantita: 1 },
        { descrizione: "Gran Buffet Gourmet Party & Finger Food (50 ospiti)", prezzo_unitario: 2500, quantita: 1 },
        { descrizione: "DJ Set & Cocktail Bar Dopocena", prezzo_unitario: 800, quantita: 1 },
      ],
    };
  } else if (searchId === "client-demo-ai" || (!selectedQuote && searchId === "demo-ai")) {
    selectedQuote = {
      id: "quote-demo-ai",
      client_id: "client-demo-ai",
      tipo_evento: "wedding",
      data_evento: "2027-09-15", // >180 giorni (Fase 1 AI Concierge)
      totale_calcolato: 16500,
      status: "firmato",
      clients: {
        id: "client-demo-ai",
        nome: "Marco & Sofia",
        cognome: "(Fase AI >6 Mesi)",
        email: "sposi.ai@laterradegliaranci.it",
      },
    };
  } else if (!selectedQuote) {
    selectedQuote = {
      id: searchId || "demo-test",
      client_id: searchId || "demo-test",
      tipo_evento: "wedding",
      data_evento: "2027-06-18",
      totale_calcolato: 15200,
      status: "firmato",
      clients: {
        id: searchId || "demo-test",
        nome: "Demo",
        cognome: "Test (Elena)",
        email: "sposi@laterradegliaranci.it",
      },
    };
  }

  const clientId = selectedQuote.client_id || selectedQuote.clients?.id || "demo-client";
  const clientEmail = selectedQuote.clients?.email || "";

  // Recupera tutti i preventivi/contratti di questo cliente
  const clientQuotes = quotes.filter(
    (q) =>
      q.client_id === clientId ||
      (clientEmail && q.clients?.email === clientEmail) ||
      q.id === selectedQuote.id
  );

  const initialDiary = getWeddingDiaryLocal(clientId);
  const serviceChangesHistory = selectedQuote.id
    ? await getQuoteChangesHistory(selectedQuote.id)
    : [];

  const nomeRaw = (selectedQuote.clients?.nome || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const cognomeRaw = (selectedQuote.clients?.cognome || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const matchedPdf = signedPdfs.find((pdf) => {
    const keyLower = pdf.key.toLowerCase().replace(/[^a-z0-9]/g, "");
    return (nomeRaw && keyLower.includes(nomeRaw)) || (cognomeRaw && keyLower.includes(cognomeRaw));
  });

  const prezzo = (selectedQuote.totale_calcolato || 15200).toString();
  const preventivoId = selectedQuote.id ? selectedQuote.id.slice(0, 8) : "demo";
  const sig = generateSignature(prezzo, preventivoId);
  const tipoContratto = selectedQuote.tipo_evento === "eventi" ? "eventi" : "wedding";
  const contractUrl = `/contratti/${tipoContratto}?prezzo=${prezzo}&preventivo=${preventivoId}&sig=${sig}`;

  // Esperienze passate (solo per storico)
  const experiences =
    mode === "storico"
      ? [
          {
            id: "exp-1",
            titolo: "Cena Romantica di San Valentino nell'Agrumeto",
            categoria: "Serata Speciale & Menu Degustazione",
            data: "14 Febbraio 2026",
            stato: "Partecipato",
            dettagli: "Menu Degustazione Gourmet a lume di candela tra gli aranci e musica dal vivo.",
          },
          {
            id: "exp-2",
            titolo: "Concerto Jazz sotto le Stelle & Aperitivo in Giardino",
            categoria: "Spettacolo & Culture Experience",
            data: "20 Luglio 2025",
            stato: "Partecipato",
            dettagli: "Serata musicale tra gli agrumi con cocktail biologici e degustazione finger food.",
          },
          {
            id: "exp-3",
            titolo: "Gran Gala di Capodanno a La Terra degli Aranci",
            categoria: "Cena di Gala & Spettacolo Pirotecnico",
            data: "31 Dicembre 2024",
            stato: "Partecipato",
            dettagli: "Cenone di Gala in Sala Bianca con vista panoramica sul Golfo di Napoli.",
          },
        ]
      : [];

  return (
    <ClientPortalWrapper
      quote={selectedQuote}
      clientQuotes={clientQuotes}
      experiences={experiences}
      initialDiary={initialDiary}
      signedPdf={matchedPdf}
      contractUrl={contractUrl}
      serviceChangesHistory={serviceChangesHistory}
      initialLang={params.lang === "en" ? "en" : "it"}
      mode={mode}
    />
  );
}
