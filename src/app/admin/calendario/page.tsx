import { getQuotesFast, getClientsFast } from "@/lib/dataHelper";
import { listPdfsInR2 } from "@/lib/r2";
import { getOpenDayAdminData } from "@/lib/openDayCloudSync";
import {
  getPendingContractsLocal,
  getQuickCalendarOptionsLocal,
  getStore,
  getGoogleCalendarAuthLocal,
} from "@/lib/localDb";
import { getOrSeedGCalEvents } from "@/lib/calendarSyncEngine";
import CalendarioClient, { type RegisteredClientOption } from "./CalendarioClient";

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
  searchParams?: Promise<{ month?: string; gcal_error?: string; gcal_connected?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const initialMonth = params?.month || undefined;

  let gcalBannerMessage: string | undefined = undefined;
  if (params?.gcal_connected === "1") {
    gcalBannerMessage =
      "✅ Connessione con Google Calendar (segreteriatda@gmail.com) stabilita con successo! Sincronizzazione attiva.";
  } else if (params?.gcal_error) {
    if (params.gcal_error === "missing_client_id" || params.gcal_error === "missing_credentials") {
      gcalBannerMessage =
        "ℹ️ In attesa dell'abilitazione credenziali Google OAuth da parte di Roberto (GOOGLE_CLIENT_ID e SECRET per segreteriatda@gmail.com). Il sistema opera regolarmente con il motore di matching ibrido e gli eventi locali salvati.";
    } else {
      gcalBannerMessage = `⚠️ Connessione Google Calendar non completata (${params.gcal_error}).`;
    }
  }
  // 1) Opzioni / contratti in attesa di firma (opzione 7 giorni).
  const pendingContracts = getPendingContractsLocal();

  // 2) Storico contratti firmati dal ciclo di vita reale.
  const store = getStore();
  const signedContracts = (store.signed_contracts || []).filter(Boolean);

  const [quotesRaw, signedPdfs, supabaseClients, openDayData] = await Promise.all([
    getQuotesFast(),
    Promise.all([
      listPdfsInR2("contratti/wedding/"),
      listPdfsInR2("contratti/eventi/")
    ]).then(([w, e]) => [...(w || []), ...(e || [])]).catch(() => []),
    getClientsFast().catch(() => []),
    getOpenDayAdminData().catch(() => ({ openDayClients: [] }))
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

  const gcalEvents = getOrSeedGCalEvents();
  const gcalAuth = getGoogleCalendarAuthLocal();

  const clientMap = new Map<string, RegisteredClientOption>();

  // 1. Supabase
  for (const sc of (supabaseClients as any[]) || []) {
    if (sc && sc.id) {
      clientMap.set(String(sc.id), {
        id: String(sc.id),
        nome: String(sc.nome || "").trim(),
        cognome: String(sc.cognome || "").trim(),
        partner: String(sc.sposera_nome || sc.partner || sc.partnerNome || "").trim() || undefined,
        email: String(sc.email || "").trim(),
        telefono: String(sc.telefono || "").trim(),
        provenienza: "Rubrica CRM",
        tags: Array.isArray(sc.tags) ? sc.tags : [],
        isDemo: Boolean(sc.is_demo),
      });
    }
  }

  // 2. Local store.clients
  for (const c of (store.clients as any[]) || []) {
    if (c && c.id) {
      const existing = clientMap.get(String(c.id));
      clientMap.set(String(c.id), {
        id: String(c.id),
        nome: String(c.nome || existing?.nome || "").trim(),
        cognome: String(c.cognome || existing?.cognome || "").trim(),
        partner: String(c.sposera_nome || c.partner || c.partnerNome || existing?.partner || "").trim() || undefined,
        email: String(c.email || existing?.email || "").trim(),
        telefono: String(c.telefono || existing?.telefono || "").trim(),
        provenienza: c.provenienza || existing?.provenienza || "Clienti",
        tags: Array.isArray(c.tags) ? c.tags : existing?.tags || [],
        isDemo: Boolean(c.is_demo || String(c.id).startsWith("client-demo-")),
      });
    }
  }

  // 3. Open Day
  for (const od of (openDayData as any)?.openDayClients || []) {
    if (od && od.id && !clientMap.has(od.id)) {
      clientMap.set(od.id, {
        id: od.id,
        nome: String(od.nome || "").trim(),
        cognome: String(od.cognome || "").trim(),
        email: String(od.email || "").trim(),
        telefono: String(od.telefono || "").trim(),
        provenienza: od.provenienza || "QR Code Open Day",
        tags: od.tags || ["Open Day"],
        isDemo: false,
      });
    }
  }

  // 4. Appointments
  for (const app of (store.appointments as any[]) || []) {
    if (app && app.id && !clientMap.has(app.id)) {
      clientMap.set(app.id, {
        id: app.id,
        nome: String(app.nome || "").trim(),
        cognome: String(app.cognome || "").trim(),
        partner: String(app.partnerNome || "").trim() || undefined,
        email: String(app.email || "").trim(),
        telefono: String(app.telefono || "").trim(),
        provenienza: "Appuntamento Visita",
        tags: ["Appuntamento"],
        isDemo: false,
      });
    }
  }

  // 5. Quotes clients
  for (const q of quotes) {
    const cid = String(q?.client_id || q?.clients?.id || "").trim();
    if (cid && !clientMap.has(cid) && q?.clients) {
      clientMap.set(cid, {
        id: cid,
        nome: String(q.clients.nome || "").trim(),
        cognome: String(q.clients.cognome || "").trim(),
        partner: String(q.clients.sposera_nome || q.clients.partner || "").trim() || undefined,
        email: String(q.clients.email || "").trim(),
        telefono: String(q.clients.telefono || "").trim(),
        provenienza: "Preventivo",
        tags: [],
        isDemo: Boolean(q.is_demo),
      });
    }
  }

  const registeredClients = Array.from(clientMap.values())
    .filter((c) => c.nome || c.cognome || c.telefono || c.email)
    .sort((a, b) => `${a.nome} ${a.cognome}`.localeCompare(`${b.nome} ${b.cognome}`));

  return (
    <CalendarioClient
      quotes={quotes}
      signedPdfs={signedPdfs}
      pendingContracts={pendingContracts}
      quickOptions={getQuickCalendarOptionsLocal()}
      initialMonth={initialMonth}
      gcalEvents={gcalEvents}
      gcalAuth={gcalAuth}
      initialBannerMessage={gcalBannerMessage}
      registeredClients={registeredClients}
    />
  );
}
