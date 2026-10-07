import { getQuotesFast } from "@/lib/dataHelper";
import { listPdfsInR2 } from "@/lib/r2";
import { getPendingContractsLocal, getQuickCalendarOptionsLocal, getStore } from "@/lib/localDb";
import CalendarioClient from "./CalendarioClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Allega il record cliente a una quote proveniente da `store.quotes` (che non lo contiene). */
function attachClient(store: ReturnType<typeof getStore>, quote: any): any {
  if (quote?.clients) return quote;
  const client =
    (store.clients || []).find((c) => c && c.id === quote?.client_id) || {
      nome: "Cliente",
      cognome: "",
      email: "",
    };
  return { ...quote, clients: client };
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const initialMonth = params?.month || undefined;
  // 1) Opzioni / contratti in attesa di firma (opzione 7 giorni).
  const pendingContracts = getPendingContractsLocal();

  // 2) Storico contratti firmati dal ciclo di vita reale.
  const store = getStore();
  const signedContracts = (store.signed_contracts || []).filter(Boolean);

  const [quotesRaw, signedPdfs] = await Promise.all([
    getQuotesFast(),
    Promise.all([
      listPdfsInR2("contratti/wedding/"),
      listPdfsInR2("contratti/eventi/")
    ]).then(([w, e]) => [...(w || []), ...(e || [])]).catch(() => [])
  ]);

  const quotes: any[] = Array.isArray(quotesRaw) ? [...quotesRaw] : [];
  const seenIds = new Set<string>(quotes.map((q) => String(q?.id || "").toLowerCase()));

  const signedKeys = new Set<string>();
  signedContracts.forEach((sc) => {
    const key = String(sc?.quote_id || sc?.preventivo || "").toLowerCase();
    if (!key) return;
    signedKeys.add(key);
    signedKeys.add(key.slice(0, 8));
  });

  // 3) Contratti firmati presenti in `store.quotes` con status 'firmato'.
  (store.quotes || [])
    .filter((q) => q && q.status === "firmato")
    .forEach((q) => {
      const id = String(q.id || "").toLowerCase();
      if (!id || seenIds.has(id)) return;
      seenIds.add(id);
      quotes.push(attachClient(store, q));
    });

  // 4) Arricchisce le quote collegate a un `signed_contract` (status 'firmato')
  //    e aggiorna lo status anche quando la quote non lo riporta esplicitamente.
  for (let i = 0; i < quotes.length; i++) {
    const q = quotes[i];
    const id = String(q?.id || "").toLowerCase();
    const isSigned = signedKeys.has(id) || signedKeys.has(id.slice(0, 8));
    if (isSigned && q.status !== "firmato") {
      quotes[i] = { ...q, status: "firmato" };
    }
  }

  // 5) Contratti firmati "orfani": presenti in `signed_contracts` ma senza una
  //    quote corrispondente. Vengono esposti come eventi firmati sintetici.
  signedContracts.forEach((sc) => {
    const quoteId = String(sc?.quote_id || "");
    const key = quoteId.toLowerCase();
    if (!quoteId || seenIds.has(key) || seenIds.has(key.slice(0, 8))) return;
    const exists = quotes.some(
      (q) => String(q?.id || "").toLowerCase().slice(0, 8) === key.slice(0, 8)
    );
    if (exists) return;

    const client =
      (store.clients || []).find((c) => c && c.id === sc.client_id) ||
      sc.datiCliente ||
      { nome: "Cliente", cognome: "" };

    seenIds.add(key);
    quotes.push({
      id: quoteId,
      client_id: sc.client_id || null,
      tipo_evento: sc.tipoContratto === "eventi" ? "eventi" : "wedding",
      data_evento: sc.datiCliente?.data_evento || null,
      turno: sc.datiCliente?.turno || null,
      tipo_esclusiva: sc.datiCliente?.tipo_esclusiva || "esclusiva",
      numero_ospiti: 0,
      prezzo: Number(sc.prezzo) || 0,
      totale_calcolato: Number(sc.prezzo) || 0,
      status: "firmato",
      signed_contract: sc,
      clients: client,
      created_at: sc.signed_at || null,
    });
  });

  return (
    <CalendarioClient
      quotes={quotes}
      signedPdfs={signedPdfs}
      pendingContracts={pendingContracts}
      quickOptions={getQuickCalendarOptionsLocal()}
      initialMonth={initialMonth}
    />
  );
}
