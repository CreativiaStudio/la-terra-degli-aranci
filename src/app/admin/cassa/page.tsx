import { getQuotesFast } from "@/lib/dataHelper";
import { getAllPaymentsLocal, getStore } from "@/lib/localDb";
import { computeEventLedger, splitGross } from "@/lib/eventLedger";
import { deriveEventStage } from "@/lib/eventStage";
import CassaClient, {
  type CassaTab,
  type CassaEventoRow,
  type CassaItemRow,
  type CassaPaymentRow,
  type CassaCompanySummary,
  type CassaEventOption,
  type CassaRateRow,
} from "./CassaClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const CONFIRMED_STAGES = ["confermato", "in_regia", "svolto", "in_firma"];

/** Estrae la parte data 'YYYY-MM-DD'. */
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

function matchesSignedContract(record: any, quote: any): boolean {
  const qid = String(record?.quote_id || record?.preventivo || record?.quoteId || "").toLowerCase();
  if (!qid) return false;
  const id = String(quote?.id || "").toLowerCase();
  if (!id) return false;
  return qid === id || id.startsWith(qid) || qid.startsWith(id) || qid.startsWith(id.slice(0, 8));
}

/** Totale lordo di una riga servizio in centesimi (coerente con eventLedger). */
function itemGrossCents(item: any): number {
  const direct = Number(item?.totale);
  if (Number.isFinite(direct) && direct !== 0) return Math.round(direct * 100);
  const unitRaw = Number(item?.prezzo_unitario ?? item?.prezzoUnitario ?? 0);
  const unit = Number.isFinite(unitRaw) ? unitRaw : 0;
  const qtyRaw = Number(item?.quantita ?? 1);
  const qty = Number.isFinite(qtyRaw) ? qtyRaw : 1;
  return Math.round(unit * qty * 100);
}

/** Righe servizio di un evento con la relativa ripartizione Santo Stefano / Iovino. */
function buildEventItems(quote: any, quoteId: string): CassaItemRow[] {
  const rawItems: any[] = Array.isArray(quote?.items) ? quote.items : [];
  return rawItems.map((it, idx) => {
    const totale_cents = itemGrossCents(it);
    const splitKey = String(it?.splitKey ?? it?.split_key ?? "");
    const splitLabel = String(it?.splitLabel ?? it?.split_label ?? "");
    const split = splitGross(totale_cents, splitKey, splitLabel);
    const qtyRaw = Number(it?.quantita ?? 1);
    const quantita = Number.isFinite(qtyRaw) ? qtyRaw : 1;
    const unitRaw = Number(it?.prezzo_unitario ?? it?.prezzoUnitario ?? 0);
    return {
      id: it?.id ?? `${quoteId}-${idx}`,
      descrizione: String(it?.descrizione ?? "Voce di spesa"),
      quantita,
      prezzo_unitario: Number.isFinite(unitRaw) ? unitRaw : 0,
      totale_cents,
      splitKey,
      splitLabel,
      spettanza_ss_cents: split.santo_stefano,
      spettanza_iovino_cents: split.iovino,
    };
  });
}

export default async function CassaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tabRaw = String(params?.tab || "incassi");
  const validTabs: CassaTab[] = ["incassi", "scadenze", "societa", "simulatore"];
  const initialTab: CassaTab = (validTabs as string[]).includes(tabRaw) ? (tabRaw as CassaTab) : "incassi";

  const [quotes, payments] = await Promise.all([getQuotesFast(), Promise.resolve(getAllPaymentsLocal())]);
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  /* Indici in memoria */
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

  /* Costruzione eventi + opzioni per la modale incasso */
  const eventi: CassaEventoRow[] = [];
  const eventOptions: CassaEventOption[] = [];
  const quoteById = new Map<string, any>();

  for (const q of quotes) {
    const qid = String(q.id || "").toLowerCase();
    quoteById.set(qid, q);

    const isSigned =
      q.status === "firmato" ||
      Boolean(q.data_firma) ||
      Boolean(q.signed_at) ||
      signedContracts.some((record: any) => matchesSignedContract(record, q));

    const stage = deriveEventStage(q, { today, isSigned });
    const sposi =
      `${String(q.clients?.nome || "").trim()} ${String(q.clients?.cognome || "").trim()}`.trim() || "Cliente";
    const tipoLabel = q.tipo_evento === "wedding" ? "Matrimonio" : "Privato";
    const dataEvento = onlyDate(q.data_evento) || null;

    eventOptions.push({
      id: String(q.id || ""),
      label: `${sposi} · ${tipoLabel}${dataEvento ? ` · ${dataEvento}` : ""}`,
      data_evento: dataEvento,
    });

    const confirmed = CONFIRMED_STAGES.includes(stage.stage) || q.status === "accettato";
    if (!confirmed) continue;

    const paymentsForQuote = paymentsByQuote.get(qid) || [];
    const changes = changesByQuote.get(qid) || [];
    const confirmedChanges = changes.filter((c) => c?.status === "confermato");
    const pendingChanges = changes.filter((c) => c?.status === "pending");
    const ledger = computeEventLedger(q, paymentsForQuote, confirmedChanges, pendingChanges, today);

    const rate: CassaRateRow[] = ledger.rate.map((r) => ({
      key: r.key,
      label: r.label,
      importo_cents: r.importo_cents,
      scadenza: r.scadenza,
      coperto_cents: r.coperto_cents,
      stato: r.stato,
      in_ritardo: r.in_ritardo,
    }));

    const items = buildEventItems(q, String(q.id || ""));

    eventi.push({
      id: String(q.id || ""),
      codice: `TDA-${String(q.id || "").slice(0, 8).toUpperCase()}`,
      sposi,
      tipo_evento: q.tipo_evento || "eventi",
      data_evento: dataEvento,
      turno: String(q.turno || q.turno_evento || ""),
      formula: formulaLabel(q),
      ospiti: Number(q.numero_ospiti || 0),
      stage: stage.stage,
      stageLabel: stage.label,
      badgeColor: stage.badgeColor,
      concordato_cents: ledger.concordato_cents,
      incassato_cents: ledger.incassato_cents,
      residuo_cents: ledger.residuo_cents,
      spettanza: { ...ledger.spettanza },
      incassato_per: { ...ledger.incassato_per },
      residuo_per: { ...ledger.residuo_per },
      conguaglio: ledger.conguaglio
        ? { da: ledger.conguaglio.da, a: ledger.conguaglio.a, importo_cents: ledger.conguaglio.importo_cents }
        : null,
      rate,
      items,
    });
  }

  eventi.sort((a, b) => String(b.data_evento || "").localeCompare(String(a.data_evento || "")));
  eventOptions.sort((a, b) => String(b.data_evento || "").localeCompare(String(a.data_evento || "")));

  /* Righe incasso arricchite con l'evento di appartenenza */
  const paymentsRows: CassaPaymentRow[] = payments.map((p) => {
    const q = quoteById.get(String(p.quote_id || "").toLowerCase());
    const sposi = q
      ? `${String(q.clients?.nome || "").trim()} ${String(q.clients?.cognome || "").trim()}`.trim() || "Cliente"
      : `Evento ${String(p.quote_id || "").slice(0, 8).toUpperCase()}`;
    const dataEvento = q ? onlyDate(q.data_evento) : "";
    const tipoLabel = q?.tipo_evento === "wedding" ? "Matrimonio" : "Privato";
    return {
      id: p.id,
      quote_id: p.quote_id,
      data_incasso: p.data_incasso,
      importo_cents: p.importo_cents,
      metodo: p.metodo,
      incassato_da: p.incassato_da,
      riferimento: p.riferimento,
      note: p.note,
      stato: p.stato,
      annullato_motivo: p.annullato_motivo,
      registrato_da: p.registrato_da,
      created_at: p.created_at,
      eventoLabel: q ? `${sposi} (${tipoLabel}${dataEvento ? ` · ${dataEvento}` : ""})` : sposi,
    };
  });

  /* Ripartizione complessiva tra le due società */
  let spSS = 0;
  let spIov = 0;
  let incSS = 0;
  let incIov = 0;
  for (const e of eventi) {
    spSS += e.spettanza.santo_stefano;
    spIov += e.spettanza.iovino;
    incSS += e.incassato_per.santo_stefano;
    incIov += e.incassato_per.iovino;
  }

  const excessSS = incSS - spSS;
  const excessIov = incIov - spIov;
  let conguaglio: CassaCompanySummary["conguaglio"] = null;
  if (excessSS > 0 && excessSS >= excessIov) {
    conguaglio = { da: "santo_stefano", a: "iovino", importo_cents: excessSS };
  } else if (excessIov > 0) {
    conguaglio = { da: "iovino", a: "santo_stefano", importo_cents: excessIov };
  }

  const summary: CassaCompanySummary = {
    santo_stefano: { spettanza_cents: spSS, incassato_cents: incSS, residuo_cents: spSS - incSS },
    iovino: { spettanza_cents: spIov, incassato_cents: incIov, residuo_cents: spIov - incIov },
    conguaglio,
    eccedenza_cents: Math.max(0, incSS + incIov - (spSS + spIov)),
  };

  return (
    <CassaClient
      initialTab={initialTab}
      eventi={eventi}
      payments={paymentsRows}
      summary={summary}
      eventOptions={eventOptions}
    />
  );
}
