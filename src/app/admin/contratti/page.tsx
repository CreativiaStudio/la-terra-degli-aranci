import { listPdfsInR2 } from "@/lib/r2";
import { getPendingContractsLocal, getStore } from "@/lib/localDb";
import { getQuotesFast } from "@/lib/dataHelper";
import { isContractVaultEmpty, syncSignedContractsToVault } from "@/lib/contractVault";
import { isoToItalian } from "@/lib/dateInput";
import QuickContractPanel from "./QuickContractPanel";
import PendingContractsList from "./PendingContractsList";
import ContrattiClientList, { type SignedContractItem } from "./ContrattiClientList";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/** Quote vista da questa pagina, con i campi opzionali usati per la mappatura. */
interface ContractQuote {
  id: string;
  status?: string;
  data_firma?: string;
  signed_at?: string;
  tipo_evento?: string;
  data_evento?: string;
  created_at?: string;
  totale_calcolato?: number;
  prezzo?: number;
  totale?: number;
  formula_opzione?: string | null;
  tipo_esclusiva?: string | null;
  spazi_riservati?: string[] | null;
  clients?: Record<string, unknown> | null;
}

/** Estrae 'YYYY-MM-DD' da un valore ISO, '' se non valido. */
function toIsoDate(value: unknown): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value ?? "").trim());
  return match ? match[1] : "";
}

/** Etichetta formula: Esclusiva / Sala Tufo / Sala Bianca. */
function formulaLabel(quote: ContractQuote): string {
  const raw = String(quote.formula_opzione ?? "").toLowerCase().trim();
  const tipo = String(quote.tipo_esclusiva ?? "").toLowerCase().trim();

  if (raw === "esclusiva" || tipo === "esclusiva" || tipo === "exclusive") return "Esclusiva";
  if (raw.includes("tufo") || raw.includes("promesse")) return "Sala Tufo";
  if (raw.includes("bianca")) return "Sala Bianca";

  const spazi = Array.isArray(quote.spazi_riservati) ? quote.spazi_riservati : [];
  if (spazi.some((s) => /tufo|promesse/i.test(String(s)))) return "Sala Tufo";
  if (spazi.length > 0) return "Sala Bianca";

  return "—";
}

/** Formatta un timestamp ISO in 'gg/mm/aaaa HH:mm' (timezone italiana). */
function formatFirmaLabel(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  try {
    const day = date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/Rome",
    });
    const time = date.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Rome",
    });
    return `${day} ${time}`;
  } catch {
    return date.toLocaleString("it-IT");
  }
}

export default async function ContrattiDashboard() {
  // Warm-up dello store locale (garantisce che esista anche su runtime serverless).
  const store = getStore();
  const pendingContracts = getPendingContractsLocal();

  // Solo la prima volta (vault vuoto) esportiamo i contratti firmati già presenti
  // in data_store.json: blindatura multi-posizione senza scritture ripetute.
  if (isContractVaultEmpty()) {
    try {
      await syncSignedContractsToVault();
    } catch (err: any) {
      console.warn("Sync iniziale Contract Vault non riuscito:", err?.message || err);
    }
  }

  let weddingPdfs: any[] = [];
  let eventiPdfs: any[] = [];
  let quotes: any[] = [];
  let error: string | null = null;

  try {
    const [wedding, eventi, allQuotes] = await Promise.all([
      listPdfsInR2("contratti/wedding/"),
      listPdfsInR2("contratti/eventi/"),
      getQuotesFast(),
    ]);
    weddingPdfs = Array.isArray(wedding) ? wedding : [];
    eventiPdfs = Array.isArray(eventi) ? eventi : [];
    quotes = Array.isArray(allQuotes) ? allQuotes : [];
  } catch (err: any) {
    console.warn("R2 Cloud Storage non raggiungibile o offline fallback:", err?.message || err);
    error = null;
  }

  // Chiavi dei contratti già firmati/finalizzati (`signed_contracts` +
  // `final_contracts`), normalizzate lowercase/trim, incluso il prefisso a 8
  // caratteri (numero preventivo) usato nel resto dell'ecosistema.
  const signedRecords = [
    ...(store.signed_contracts ?? []),
    ...(store.final_contracts ?? []),
  ];

  const signedQuoteIds = new Set<string>();
  for (const contract of signedRecords) {
    if (!contract) continue;
    for (const value of [contract.quote_id, contract.preventivo, contract.quoteId]) {
      if (!value) continue;
      const key = String(value).trim().toLowerCase();
      if (!key) continue;
      signedQuoteIds.add(key);
      signedQuoteIds.add(key.slice(0, 8));
    }
  }

  /**
   * Un preventivo compare tra i contratti firmati se il suo id (o il suo
   * prefisso a 8 caratteri) coincide con una chiave firmata. Il confronto
   * prefisso è bidirezionale e richiede che ENTRAMBE le stringhe abbiano almeno
   * 8 caratteri, per non generare falsi positivi tra id brevi che condividono
   * lo stesso inizio (es. 'quote-de…').
   */
  const isSignedByRecord = (quoteId: string): boolean => {
    const id = String(quoteId || "").trim().toLowerCase();
    if (!id) return false;
    if (signedQuoteIds.has(id)) return true;
    return signedRecords.some((sc) => {
      if (!sc) return false;
      const key = String(sc.quote_id || sc.preventivo || sc.quoteId || "")
        .trim()
        .toLowerCase();
      if (!key || key.length < 8 || id.length < 8) return false;
      return id.startsWith(key) || key.startsWith(id);
    });
  };

  /** Record `signed_contracts`/`final_contracts` collegato a una quote (match per id/prefisso). */
  const findSignedRecord = (quoteId: string): any => {
    const id = String(quoteId || "").trim().toLowerCase();
    if (!id) return null;
    const exact = signedRecords.find(
      (sc) =>
        sc &&
        String(sc.quote_id || sc.preventivo || sc.quoteId || "")
          .trim()
          .toLowerCase() === id
    );
    if (exact) return exact;
    return (
      signedRecords.find((sc) => {
        if (!sc) return false;
        const key = String(sc.quote_id || sc.preventivo || sc.quoteId || "")
          .trim()
          .toLowerCase();
        if (!key || key.length < 8 || id.length < 8) return false;
        return id.startsWith(key) || key.startsWith(id);
      }) || null
    );
  };

  const items: SignedContractItem[] = [];
  const knownPdfUrls = new Set<string>();
  const coveredQuoteIds = new Set<string>();

  // 1) Contratti firmati a partire dalle quote (fonte primaria).
  for (const q of quotes as ContractQuote[]) {
    if (!q || !q.id) continue;

    const idLower = String(q.id).toLowerCase();
    const isSigned =
      q.status === "firmato" ||
      Boolean(q.data_firma) ||
      Boolean(q.signed_at) ||
      isSignedByRecord(idLower);
    if (!isSigned) continue;

    const signedRecord = findSignedRecord(q.id);
    const client = q.clients || {};
    const primary = [client.nome, client.cognome].filter(Boolean).join(" ").trim();
    const partner = client.sposera_nome ? ` & ${client.sposera_nome}` : "";
    const nomeSposi = `${primary}${partner}`.trim() || "Cliente TDA";

    const pdfUrl = signedRecord?.pdf_url || `/api/pdf/${String(q.id).slice(0, 8)}`;
    if (signedRecord?.pdf_url) knownPdfUrls.add(String(signedRecord.pdf_url));
    coveredQuoteIds.add(idLower);

    const dataEvento = toIsoDate(q.data_evento);
    const dataFirma =
      q.data_firma ||
      signedRecord?.firmato_il ||
      signedRecord?.signed_at ||
      q.created_at ||
      "";

    items.push({
      id: String(q.id),
      quoteId: String(q.id),
      codice: `TDA-${String(q.id).slice(0, 8).toUpperCase()}`,
      tipoEvento: q.tipo_evento === "wedding" ? "wedding" : "eventi",
      nomeSposi,
      dataEvento,
      dataEventoLabel: isoToItalian(dataEvento) || dataEvento || "—",
      dataFirma,
      dataFirmaLabel: formatFirmaLabel(dataFirma),
      prezzo: Number(q.totale_calcolato ?? q.prezzo ?? q.totale ?? 0),
      formula: formulaLabel(q),
      pdfUrl,
      eventPageUrl: `/admin/eventi/${q.id}`,
    });
  }

  // 2) Contratti firmati presenti solo in `signed_contracts` (quote non in store).
  for (const sc of signedRecords) {
    if (!sc) continue;
    const key = String(sc.quote_id || sc.preventivo || sc.quoteId || "")
      .trim()
      .toLowerCase();
    if (!key) continue;

    const alreadyCovered = [...coveredQuoteIds].some(
      (id) =>
        id === key ||
        (id.length >= 8 && key.length >= 8 && (id.startsWith(key) || key.startsWith(id)))
    );
    if (alreadyCovered) continue;

    const client = sc.datiCliente || {};
    const nomeSposi =
      [client.nome, client.cognome].filter(Boolean).join(" ").trim() || "Cliente TDA";
    const pdfUrl = sc.pdf_url || `/api/pdf/${key.slice(0, 8)}`;
    if (sc.pdf_url) knownPdfUrls.add(String(sc.pdf_url));

    const dataEvento = toIsoDate(client.data_evento || sc.data_evento);
    const dataFirma = sc.firmato_il || sc.signed_at || sc.created_at || "";

    items.push({
      id: key,
      quoteId: String(sc.quote_id || sc.preventivo || sc.quoteId),
      codice: `TDA-${key.slice(0, 8).toUpperCase()}`,
      tipoEvento: sc.tipoContratto === "wedding" ? "wedding" : "eventi",
      nomeSposi,
      dataEvento,
      dataEventoLabel: isoToItalian(dataEvento) || dataEvento || "—",
      dataFirma,
      dataFirmaLabel: formatFirmaLabel(dataFirma),
      prezzo: Number(sc.prezzo || 0),
      formula: "—",
      pdfUrl,
      eventPageUrl: `/admin/eventi/${key}`,
    });
  }

  // Nomi/parole chiave dei contratti firmati, per riconoscere i PDF R2 collegati.
  const signedNameTokens = new Set<string>();
  for (const item of items) {
    String(item.nomeSposi)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .forEach((token) => {
        if (token.length >= 3) signedNameTokens.add(token);
      });
  }

  const isPdfLinked = (pdf: any): boolean => {
    if (!pdf?.key) return false;
    if (pdf.url && knownPdfUrls.has(String(pdf.url))) return true;
    const keyNorm = String(pdf.key).toLowerCase().replace(/[^a-z0-9]+/g, "");
    for (const token of signedNameTokens) {
      if (keyNorm.includes(token)) return true;
    }
    return false;
  };

  // 3) PDF orfani su R2 (nessun quote_id collegato): retrocompatibilità.
  const addOrphanPdfs = (pdfs: any[], tipo: "wedding" | "eventi") => {
    for (const pdf of pdfs) {
      if (!pdf?.key) continue;
      if (isPdfLinked(pdf)) continue;

      const base = String(pdf.key).replace(`contratti/${tipo}/`, "").replace(/\.pdf$/i, "");
      const parts = base.split("_");
      const display = (parts.length > 1 ? parts.slice(1).join(" ") : base).replace(/-/g, " ").trim();
      const dataFirma =
        pdf.lastModified instanceof Date
          ? pdf.lastModified.toISOString()
          : pdf.lastModified
            ? new Date(pdf.lastModified).toISOString()
            : "";

      items.push({
        id: `r2:${pdf.key}`,
        quoteId: "",
        codice: `R2-${base.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`,
        tipoEvento: tipo,
        nomeSposi: display || "Contratto archiviato",
        dataEvento: "",
        dataEventoLabel: "—",
        dataFirma,
        dataFirmaLabel: formatFirmaLabel(dataFirma),
        prezzo: 0,
        formula: "PDF archiviato",
        pdfUrl: String(pdf.url || ""),
        eventPageUrl: "",
        isOrphan: true,
      });
    }
  };

  addOrphanPdfs(eventiPdfs, "eventi");
  addOrphanPdfs(weddingPdfs, "wedding");

  const byFirma = (a: SignedContractItem, b: SignedContractItem) =>
    String(b.dataFirma || "").localeCompare(String(a.dataFirma || ""));
  const weddingContracts = items.filter((i) => i.tipoEvento === "wedding").sort(byFirma);
  const eventiContracts = items.filter((i) => i.tipoEvento === "eventi").sort(byFirma);

  return (
    <div className="container">
      <Suspense fallback={null}>
        <QuickContractPanel />
      </Suspense>

      <PendingContractsList initialContracts={pendingContracts} />

      <div className="premium-card">
        <header style={{ marginBottom: "2rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
          <h1 style={{ margin: 0, textAlign: "left" }}>Archivio Contratti Firmati</h1>
        </header>

        {error && <p style={{ color: "var(--error)", padding: "1rem", background: "#fee", borderRadius: "8px" }}>{error}</p>}

        <ContrattiClientList eventiContracts={eventiContracts} weddingContracts={weddingContracts} />
      </div>
    </div>
  );
}
