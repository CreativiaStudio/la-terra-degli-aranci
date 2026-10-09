import { getStore } from "@/lib/localDb";
import { getQuotesFast } from "@/lib/dataHelper";
import { computeEventLedger } from "@/lib/eventLedger";
import { deriveEventStage } from "@/lib/eventStage";
import ClientiClient, { type ClienteRow, type ClienteEventoRow } from "./ClientiClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Estrae la parte data 'YYYY-MM-DD' da un valore ISO/italiano. */
function onlyDate(value: unknown): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value ?? ""));
  return match ? match[1] : "";
}

/** Etichetta leggibile della formula di concessione. */
function formulaLabel(quote: any): string {
  const raw = String(quote?.formula_opzione || quote?.tipo_esclusiva || "").toLowerCase();
  if (raw.includes("tufo")) return "Sala Tufo";
  if (raw.includes("esclusiva") && !raw.includes("semi")) return "Esclusiva";
  if (raw) return "Sala Bianca";
  return "—";
}

/**
 * Deriva un titolo leggibile per l'evento partendo dal tipo e dalle descrizioni.
 * Il wedding è esplicito; per gli altri tipi analizziamo note/items/testo libero.
 */
function deriveEventTitle(quote: any): string {
  if (quote?.tipo_evento === "wedding") return "Matrimonio";

  const itemsText = Array.isArray(quote?.items)
    ? quote.items
        .map((it: any) =>
          typeof it === "string" ? it : `${it?.nome || ""} ${it?.titolo || ""} ${it?.descrizione || ""}`
        )
        .join(" ")
    : quote?.items
      ? JSON.stringify(quote.items)
      : "";

  const haystack = [
    quote?.note,
    quote?.notes,
    quote?.descrizione,
    quote?.titolo,
    quote?.tipo_evento,
    itemsText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (haystack.includes("battesimo")) return "Battesimo";
  if (haystack.includes("comunione")) return "Comunione";
  if (haystack.includes("compleanno") || haystack.includes("18")) return "Compleanno";
  if (haystack.includes("promessa")) return "Promessa";
  if (haystack.includes("laurea")) return "Laurea";
  if (haystack.includes("meeting") || haystack.includes("aziendal")) return "Aziendale";
  if (haystack.includes("anniversario")) return "Anniversario";
  return "Evento Privato";
}

/** Un contratto è "firmato" se la quote lo dichiara o esiste un record firmato. */
function matchesSignedContract(record: any, quote: any): boolean {
  const qid = String(record?.quote_id || record?.preventivo || record?.quoteId || "").toLowerCase();
  if (!qid) return false;
  const id = String(quote?.id || "").toLowerCase();
  if (!id) return false;
  return qid === id || id.startsWith(qid) || qid.startsWith(id) || qid.startsWith(id.slice(0, 8));
}

export default async function ClientiPage() {
  const [store, quotes] = await Promise.all([Promise.resolve(getStore()), getQuotesFast()]);
  const today = new Date().toISOString().slice(0, 10);

  /* Indici in memoria per pagamenti e variazioni (evita N letture del file). */
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

  /* Unione clienti: anagrafica locale + snapshot presenti nelle quote (Supabase). */
  const clientMap = new Map<string, any>();
  for (const c of store.clients || []) {
    if (c && c.id) clientMap.set(String(c.id), c);
  }
  for (const q of quotes) {
    const cid = String(q?.client_id || q?.clients?.id || "").trim();
    if (cid && !clientMap.has(cid) && q?.clients) clientMap.set(cid, q.clients);
  }

  /* Raggruppa le quote per client_id. */
  const quotesByClient = new Map<string, any[]>();
  for (const q of quotes) {
    const cid = String(q?.client_id || q?.clients?.id || "").trim();
    if (!cid) continue;
    const list = quotesByClient.get(cid);
    if (list) list.push(q);
    else quotesByClient.set(cid, [q]);
  }

  const signedContracts = (store.signed_contracts || []).filter(Boolean);
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
  const nowMs = new Date().getTime();

  const rows: ClienteRow[] = [];
  for (const [cid, client] of clientMap) {
    const cQuotes = quotesByClient.get(cid) || [];
    const nome = String(client?.nome || "").trim() || "Cliente";
    const cognome = String(client?.cognome || "").trim();
    const email = String(client?.email || "").trim();
    const telefono = String(client?.telefono || "").trim();

    let ltvCents = 0;
    let hasPast = false;
    let hasWedding = false;
    let hasPrivato = false;
    const eventi: ClienteEventoRow[] = [];

    for (const q of cQuotes) {
      const qid = String(q.id || "").toLowerCase();
      const payments = paymentsByQuote.get(qid) || [];
      const changes = changesByQuote.get(qid) || [];
      const confirmed = changes.filter((c) => c?.status === "confermato");
      const pending = changes.filter((c) => c?.status === "pending");

      const isSigned =
        q.status === "firmato" ||
        Boolean(q.data_firma) ||
        Boolean(q.signed_at) ||
        signedContracts.some((record: any) => matchesSignedContract(record, q));

      const ledger = computeEventLedger(q, payments, confirmed, pending, today);
      ltvCents += ledger.concordato_cents;

      const data = onlyDate(q.data_evento);
      if (data && data < today) hasPast = true;
      if (q.tipo_evento === "wedding") hasWedding = true;
      else hasPrivato = true;

      const stage = deriveEventStage(q, { today, isSigned });
      eventi.push({
        id: String(q.id || ""),
        titolo: deriveEventTitle(q),
        data: data || null,
        formula: formulaLabel(q),
        stage: stage.stage,
        stageLabel: stage.label,
        badgeColor: stage.badgeColor,
      });
    }

    eventi.sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")));

    const eventiCount = cQuotes.length;
    let isClub = hasPast || eventiCount > 1;

    // Etichette manuali del cliente (se presenti) hanno priorità sul fallback automatico.
    const manualTags = Array.isArray(client?.tags)
      ? client.tags.map((t: unknown) => String(t ?? "").trim()).filter(Boolean)
      : [];

    let tags: string[];
    if (manualTags.length > 0) {
      tags = manualTags;
      isClub = manualTags.includes("VIP Club TDA");
    } else {
      tags = [];
      if (isClub) tags.push("VIP Club TDA");
      if (hasWedding) tags.push("Sposi");
      if (hasPrivato) tags.push("Privato");

      const createdMs = Date.parse(String(client?.created_at || ""));
      if (Number.isFinite(createdMs) && nowMs - createdMs < sixtyDaysMs) tags.push("Nuovo");
    }

    rows.push({
      id: cid,
      nome,
      cognome,
      email,
      telefono,
      tags,
      isClub,
      eventiCount,
      ltvCents,
      eventi,
    });
  }

  rows.sort((a, b) => {
    if (b.eventiCount !== a.eventiCount) return b.eventiCount - a.eventiCount;
    if (b.ltvCents !== a.ltvCents) return b.ltvCents - a.ltvCents;
    return `${a.nome} ${a.cognome}`.localeCompare(`${b.nome} ${b.cognome}`);
  });

  return <ClientiClient clienti={rows} />;
}
