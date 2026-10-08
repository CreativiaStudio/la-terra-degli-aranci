import Link from "next/link";
import { getStore } from "@/lib/localDb";
import { getQuotesFast } from "@/lib/dataHelper";
import { computeEventLedger } from "@/lib/eventLedger";
import { deriveEventStage } from "@/lib/eventStage";
import ClienteDettaglioClient from "./ClienteDettaglioClient";
import type {
  ClienteDetail,
  ClienteEsperienzaRow,
  ClienteMetrics,
  ClienteRicevimentoRow,
} from "./ClienteDettaglioClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Estrae la parte data 'YYYY-MM-DD' da un valore ISO/italiano. */
function onlyDate(value: unknown): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value ?? ""));
  return match ? match[1] : "";
}

/** Solo le cifre di un telefono, per un matching robusto tra formati diversi. */
function digitsOnly(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

/** Etichetta leggibile della formula di concessione. */
function formulaLabel(quote: any): string {
  const raw = String(quote?.formula_opzione || quote?.tipo_esclusiva || "").toLowerCase();
  if (raw.includes("tufo")) return "Sala Tufo";
  if (raw.includes("esclusiva") && !raw.includes("semi")) return "Esclusiva";
  if (raw) return "Sala Bianca";
  return "—";
}

/** Un contratto è "firmato" se la quote lo dichiara o esiste un record firmato. */
function matchesSignedContract(record: any, quote: any): boolean {
  const qid = String(record?.quote_id || record?.preventivo || record?.quoteId || "").toLowerCase();
  if (!qid) return false;
  const id = String(quote?.id || "").toLowerCase();
  if (!id) return false;
  return qid === id || id.startsWith(qid) || qid.startsWith(id) || qid.startsWith(id.slice(0, 8));
}

/** Costruisce il link al contratto precompilato per una quote esistente. */
function buildContractUrl(client: any, quote: any): string {
  const params = new URLSearchParams();
  const nome = [client?.nome, client?.cognome].filter(Boolean).join(" ").trim();
  if (nome) params.set("nome", nome);
  if (client?.telefono) params.set("telefono", String(client.telefono));
  if (client?.email) params.set("email", String(client.email));

  const data = onlyDate(quote?.data_evento);
  if (data) params.set("data", data);
  if (quote?.turno) params.set("turno", quote.turno === "cena" ? "cena" : "pranzo");

  const tipoEsclusiva = String(quote?.tipo_esclusiva || "").toLowerCase();
  if (tipoEsclusiva === "esclusiva") params.set("tipo_esclusiva", "esclusiva");
  else if (tipoEsclusiva) params.set("tipo_esclusiva", "semi_esclusiva");

  const spazi = Array.isArray(quote?.spazi_riservati) ? quote.spazi_riservati : [];
  const tufo = spazi.some((s: unknown) => /tufo|promesse/i.test(String(s)));
  const formula = String(quote?.formula_opzione || "").toLowerCase();
  if (formula === "sala_bianca" || formula === "sala_tufo") params.set("formula", formula);
  else if (tipoEsclusiva !== "esclusiva" && tufo) params.set("formula", "sala_tufo");

  const query = params.toString();
  return query ? `/admin/contratti?${query}` : "/admin/contratti";
}

export default async function ClienteDettaglioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = getStore();

  // Unione delle quote: store locale + fallback Supabase (come la rubrica Club TDA).
  const quotesFromFast = await getQuotesFast();
  const quoteMap = new Map<string, any>();
  for (const q of store.quotes || []) {
    if (q && q.id) quoteMap.set(String(q.id), q);
  }
  for (const q of quotesFromFast || []) {
    if (q && q.id && !quoteMap.has(String(q.id))) quoteMap.set(String(q.id), q);
  }
  const quotes: any[] = [...quoteMap.values()];

  // Anagrafica di riferimento: store locale + snapshot presenti nelle quote.
  const clientMap = new Map<string, any>();
  for (const c of store.clients || []) {
    if (c && c.id) clientMap.set(String(c.id), c);
  }
  for (const q of quotes) {
    const cid = String(q?.client_id || q?.clients?.id || "").trim();
    if (cid && !clientMap.has(cid) && q?.clients) clientMap.set(cid, q.clients);
  }
  const clients: any[] = [...clientMap.values()];
  const search = String(id || "").trim().toLowerCase();

  // 1. Cliente in anagrafica, altrimenti dallo snapshot presente nelle quote.
  let client =
    clients.find((c: any) => c && String(c.id || "").toLowerCase() === search) || null;

  if (!client) {
    const snapshotQuote =
      quotes.find((q: any) => q && String(q.client_id || "").toLowerCase() === search) ||
      quotes.find((q: any) => q && q.clients && String(q.clients.id || "").toLowerCase() === search) ||
      quotes.find((q: any) => q && String(q.id || "").toLowerCase() === search);
    client = snapshotQuote?.clients || null;
  }

  if (!client) {
    return (
      <div
        style={{
          maxWidth: "720px",
          margin: "5rem auto",
          textAlign: "center",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <span
          style={{
            textTransform: "uppercase",
            letterSpacing: "2px",
            fontSize: "0.8rem",
            color: "#e58c2c",
            fontWeight: "bold",
          }}
        >
          Club TDA
        </span>
        <h1 style={{ margin: "0.4rem 0 0.6rem 0", color: "#1e1b18", fontFamily: "serif" }}>
          Cliente non trovato
        </h1>
        <p style={{ color: "#777", marginBottom: "2rem" }}>
          Il contatto richiesto non è presente nella rubrica Club TDA.
        </p>
        <Link
          href="/admin/clienti"
          style={{
            display: "inline-block",
            padding: "0.85rem 1.6rem",
            background: "#1e1b18",
            color: "#f6c177",
            borderRadius: "10px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          ← Torna a Club TDA
        </Link>
      </div>
    );
  }

  const clientId = String(client.id || id);
  const email = String(client.email || "").trim().toLowerCase();
  const phone = digitsOnly(client.telefono);
  const today = new Date().toISOString().slice(0, 10);

  // 2. Indici in memoria per pagamenti e variazioni.
  const paymentsByQuote = new Map<string, any[]>();
  for (const p of store.payments || []) {
    const key = String(p?.quote_id || "").toLowerCase();
    if (!key) continue;
    const list = paymentsByQuote.get(key);
    if (list) list.push(p);
    else paymentsByQuote.set(key, [p]);
  }

  const changesByQuote = new Map<string, any[]>();
  for (const c of store.quote_changes || []) {
    const key = String(c?.quote_id || c?.quoteId || "").toLowerCase();
    if (!key) continue;
    const list = changesByQuote.get(key);
    if (list) list.push(c);
    else changesByQuote.set(key, [c]);
  }

  const signedContracts = (store.signed_contracts || []).filter(Boolean);

  // 3. Quote collegate: per client_id oppure per match email/telefono.
  const isLinkedQuote = (q: any): boolean => {
    const cid = String(q?.client_id || "");
    if (clientId && cid === clientId) return true;

    const c = q?.clients || clients.find((cc: any) => cc && String(cc.id || "") === cid);
    if (!c) return false;
    if (email && String(c.email || "").trim().toLowerCase() === email) return true;
    if (phone && digitsOnly(c.telefono) === phone) return true;
    return false;
  };

  const linkedQuotes = quotes.filter(isLinkedQuote);

  const ricevimenti: ClienteRicevimentoRow[] = [];
  let ltvRicevimenti = 0;
  let incassatoReale = 0;
  let hasWedding = false;
  let hasPrivato = false;
  let hasPast = false;
  let earliestEvent = "";

  for (const q of linkedQuotes) {
    const qid = String(q.id || "").toLowerCase();
    const payments = paymentsByQuote.get(qid) || [];
    const changes = changesByQuote.get(qid) || [];
    const confirmed = changes.filter((c: any) => c?.status === "confermato");
    const pending = changes.filter((c: any) => c?.status === "pending");

    const isSigned =
      q.status === "firmato" ||
      Boolean(q.data_firma) ||
      Boolean(q.signed_at) ||
      signedContracts.some((record: any) => matchesSignedContract(record, q));

    const ledger = computeEventLedger(q, payments, confirmed, pending, today);
    ltvRicevimenti += ledger.concordato_cents / 100;
    incassatoReale += ledger.incassato_cents / 100;

    const data = onlyDate(q.data_evento);
    if (data && data < today) hasPast = true;
    if (q.tipo_evento === "wedding") hasWedding = true;
    else hasPrivato = true;

    const created = onlyDate(q.created_at) || data;
    if (created && (!earliestEvent || created < earliestEvent)) earliestEvent = created;

    const stage = deriveEventStage(q, { today, isSigned });

    ricevimenti.push({
      id: String(q.id || ""),
      tipoEvento: q.tipo_evento === "wedding" ? "wedding" : "eventi",
      titolo: q.tipo_evento === "wedding" ? "Matrimonio" : "Ricevimento Privato",
      data: data || null,
      turno: q.turno === "cena" ? "cena" : q.turno === "pranzo" ? "pranzo" : "",
      formula: formulaLabel(q),
      spazi: Array.isArray(q.spazi_riservati) ? q.spazi_riservati.map((s: unknown) => String(s)) : [],
      codiceTda: String(q.id || "").slice(0, 8).toUpperCase(),
      stage: stage.stage,
      stageLabel: stage.label,
      badgeColor: stage.badgeColor,
      concordato: ledger.concordato_cents / 100,
      incassato: ledger.incassato_cents / 100,
      isSigned,
      contractUrl: buildContractUrl(client, q),
    });
  }

  ricevimenti.sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")));

  // 4. Esperienze location (storico personale, concorre al LTV).
  const experiencesRaw: any[] = Array.isArray(client.esperienze_location)
    ? client.esperienze_location
    : [];

  const esperienze: ClienteEsperienzaRow[] = experiencesRaw
    .map((e: any) => ({
      id: String(e?.id || ""),
      titolo: String(e?.titolo || ""),
      data: onlyDate(e?.data),
      coperti: Number(e?.coperti) || 0,
      totale_speso: Number(e?.totale_speso) || 0,
      note: e?.note ? String(e.note) : "",
      created_at: onlyDate(e?.created_at),
    }))
    .sort((a, b) => String(b.data).localeCompare(String(a.data)));

  const ltvEsperienze = esperienze.reduce((sum, e) => sum + e.totale_speso, 0);

  // 5. Cliente dal = primo tra data evento, registrazione e prima esperienza.
  const createdFromClient = onlyDate(client.created_at);
  const firstExperience = [...esperienze]
    .map((e) => e.data)
    .filter(Boolean)
    .sort()[0];
  const clienteDal =
    [earliestEvent, createdFromClient, firstExperience].filter(Boolean).sort()[0] || "";

  // 6. Badge fidelizzazione (coerenti con la rubrica Club TDA).
  const eventiCount = ricevimenti.length;
  const isClub = hasPast || eventiCount > 1 || esperienze.length > 0;
  const tags: string[] = [];
  if (isClub) tags.push("VIP Club TDA");
  if (hasWedding) tags.push("Sposi");
  if (hasPrivato) tags.push("Privato");

  const cliente: ClienteDetail = {
    id: clientId,
    nome: String(client.nome || ""),
    cognome: String(client.cognome || ""),
    coniuge: [client.sposera_nome, client.sposera_cognome].filter(Boolean).join(" ").trim(),
    email: String(client.email || ""),
    telefono: String(client.telefono || ""),
    citta: String(client.citta_di_residenza || client.citta || ""),
    provenienza: String(client.provenienza || ""),
    codiceFiscale: String(client.codice_fiscale || ""),
    tipoCliente: client.tipo_cliente === "azienda" ? "azienda" : "privato",
    ragioneSociale: String(client.ragione_sociale || ""),
    partitaIva: String(client.partita_iva || ""),
    sdi: String(client.sdi || ""),
    pec: String(client.pec || ""),
    tags,
    isClub,
    createdAt: String(client.created_at || ""),
    memoria: {
      note_roberto: String(client.note_roberto || ""),
      intolleranze: String(client.intolleranze || ""),
      cibi_preferiti: String(client.cibi_preferiti || ""),
      vini_preferiti: String(client.vini_preferiti || ""),
      spazi_del_cuore: String(client.spazi_del_cuore || ""),
      anniversario: String(client.anniversario || ""),
    },
  };

  const metrics: ClienteMetrics = {
    ltvTotale: ltvRicevimenti + ltvEsperienze,
    ltvRicevimenti,
    ltvEsperienze,
    incassatoReale,
    ricevimentiCount: ricevimenti.length,
    eventiLocationCount: esperienze.length,
    clienteDal,
  };

  return (
    <ClienteDettaglioClient
      cliente={cliente}
      ricevimenti={ricevimenti}
      esperienze={esperienze}
      metrics={metrics}
      today={today}
    />
  );
}
