"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatEuro } from "@/lib/contractPayments";
import { recordPaymentAction } from "./paymentActions";

/* ------------------------------------------------------------------ */
/* Tipi condivisi con il Server Component                              */
/* ------------------------------------------------------------------ */

export type CassaTab = "incassi" | "scadenze" | "societa";

export interface CassaRateRow {
  key: string;
  label: string;
  importo_cents: number;
  scadenza: string | null;
  coperto_cents: number;
  stato: string;
  in_ritardo: boolean;
}

export interface CassaItemRow {
  id: string | number;
  descrizione: string;
  quantita: number;
  prezzo_unitario: number;
  totale_cents: number;
  splitKey: string;
  splitLabel: string;
  spettanza_ss_cents: number;
  spettanza_iovino_cents: number;
}

export interface CassaEventoRow {
  id: string;
  codice: string;
  sposi: string;
  telefono?: string;
  tipo_evento: string;
  data_evento: string | null;
  turno: string;
  formula: string;
  ospiti: number;
  stage: string;
  stageLabel: string;
  badgeColor: string;
  is_demo?: boolean;
  concordato_cents: number;
  incassato_cents: number;
  residuo_cents: number;
  spettanza: { santo_stefano: number; iovino: number };
  incassato_per: { santo_stefano: number; iovino: number };
  residuo_per: { santo_stefano: number; iovino: number };
  conguaglio: { da: string; a: string; importo_cents: number } | null;
  rate: CassaRateRow[];
  items: CassaItemRow[];
  extra_quote?: {
    totale: number;
    totale_santo_stefano: number;
    totale_iovino: number;
    items_count: number;
  } | null;
}

export interface CassaPaymentRow {
  id: string;
  quote_id: string;
  data_incasso: string;
  importo_cents: number;
  metodo: string;
  incassato_da: string;
  natura?: "ufficiale" | "extra";
  riferimento?: string;
  note?: string;
  stato: "valido" | "annullato";
  annullato_motivo?: string;
  registrato_da: string;
  created_at: string;
  eventoLabel: string;
}

export interface CassaCompanySummary {
  santo_stefano: { spettanza_cents: number; incassato_cents: number; residuo_cents: number };
  iovino: { spettanza_cents: number; incassato_cents: number; residuo_cents: number };
  conguaglio: { da: string; a: string; importo_cents: number } | null;
  eccedenza_cents: number;
}

export interface CassaEventOption {
  id: string;
  label: string;
  data_evento: string | null;
  is_demo?: boolean;
}

interface CassaClientProps {
  initialTab: CassaTab;
  eventi: CassaEventoRow[];
  payments: CassaPaymentRow[];
  summary: CassaCompanySummary;
  eventOptions: CassaEventOption[];
}

/* ------------------------------------------------------------------ */
/* Costanti di presentazione                                           */
/* ------------------------------------------------------------------ */

const TABS: Array<{ id: CassaTab; label: string; icon: string }> = [
  { id: "incassi", label: "Registro Incassi", icon: "💰" },
  { id: "scadenze", label: "Scadenze & Rate", icon: "📅" },
  { id: "societa", label: "Ripartizione Società", icon: "🏛️" },
];

const COMPANY_LABELS: Record<string, string> = {
  santo_stefano: "Santo Stefano S.r.l.",
  iovino: "Iovino Banqueting S.r.l.",
};

const METHOD_LABELS: Record<string, string> = {
  bonifico: "Bonifico",
  contanti: "Contanti",
  assegno: "Assegno",
  pos: "POS",
  altro: "Altro",
};

type Metodo = "bonifico" | "contanti" | "assegno" | "pos" | "altro";
type Company = "santo_stefano" | "iovino";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Etichetta leggibile della regola di ripartizione di una riga servizio. */
function splitBadgeLabel(splitKey: string, splitLabel: string): string {
  const key = String(splitKey || "").toLowerCase().trim();
  const label = String(splitLabel || "").toLowerCase().trim();
  if (key === "ss100" || label.includes("100% santo stefano") || label.includes("100 santo stefano")) {
    return "100% Santo Stefano";
  }
  if (key === "i100" || label.includes("100% iovino")) return "100% Iovino";
  if (key === "ss50" || label.includes("50 santo stefano")) return "€50 Santo Stefano / resto Iovino";
  if (key === "ss25" || key === "ss25cap" || label.includes("25 santo stefano")) return "€25 Santo Stefano / resto Iovino";
  if (key === "ss100fixed" || key === "angle" || key === "angoli" || label.includes("€100")) {
    return "€100 Santo Stefano / resto Iovino";
  }
  if (key === "after" || key === "after_party") return "After Party 40% SS / 60% Iovino";
  if (key === "40_60" || key === "ric_40_60" || label.includes("40%") || label.includes("60%")) {
    return "40% SS / 60% Iovino";
  }
  if (!key) return "40% SS / 60% Iovino";
  return splitLabel || "Ripartizione da definire";
}

/** Colore del badge in base alla regola di ripartizione. */
function splitBadgeColors(splitKey: string): { background: string; color: string; border: string } {
  const key = String(splitKey || "").toLowerCase().trim();
  if (key === "ss100" || key === "ss100fixed" || key === "ss50" || key === "ss25") {
    return { background: "#fff7ed", color: "#c2410c", border: "#fed7aa" };
  }
  if (key === "i100") return { background: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
  return { background: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" };
}

/** Etichetta del turno in italiano, con iniziale maiuscola. */
function turnoLabelIt(turno: string): string {
  const value = String(turno || "").toLowerCase();
  if (value.includes("pranzo")) return "Pranzo";
  if (value.includes("cena")) return "Cena";
  return "Turno da definire";
}

export default function CassaClient({ initialTab, eventi, payments, summary, eventOptions }: CassaClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<CassaTab>(initialTab);

  const selectTab = (next: CassaTab) => {
    setTab(next);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/admin/cassa?tab=${next}`);
    }
  };

  /* ---------------------- Ripartizione per Evento ----------------------- */
  const [societaView, setSocietaView] = useState<"evento" | "globale">(eventi.length > 0 ? "evento" : "globale");
  const [selectedEventId, setSelectedEventId] = useState<string>(eventi[0]?.id || "");
  const [societaQuery, setSocietaQuery] = useState("");
  const [filterYear, setFilterYear] = useState<"all" | "2027" | "2026" | "2025">("all");
  const [filterType, setFilterType] = useState<"all" | "wedding" | "eventi">("all");
  const [filterWithPayments, setFilterWithPayments] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  const isOfficialPayment = (p: CassaPaymentRow) => p.natura === "ufficiale" || (!p.natura && p.metodo !== "contanti");
  const isExtraPayment = (p: CassaPaymentRow) => p.natura === "extra" || (!p.natura && p.metodo === "contanti");

  const filteredEventi = useMemo(() => {
    const needle = societaQuery.trim().toLowerCase();
    return eventi.filter((ev) => {
      if (filterYear !== "all") {
        if (!ev.data_evento || !ev.data_evento.startsWith(filterYear)) return false;
      }
      if (filterType !== "all") {
        if (ev.tipo_evento !== filterType) return false;
      }
      if (filterWithPayments) {
        const hasPay = payments.some((p) => p.quote_id === ev.id && p.stato === "valido");
        if (!hasPay) return false;
      }
      if (!needle) return true;
      const haystack = [
        ev.sposi,
        ev.codice,
        ev.data_evento || "",
        formatDate(ev.data_evento),
        ev.formula,
        ev.stageLabel,
      ].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [eventi, societaQuery, filterYear, filterType, filterWithPayments, payments]);

  const selectedEvent = useMemo(
    () => eventi.find((ev) => ev.id === selectedEventId) || filteredEventi[0] || eventi[0] || null,
    [eventi, filteredEventi, selectedEventId]
  );

  const currentEventIndex = useMemo(() => {
    return filteredEventi.findIndex((e) => e.id === selectedEvent?.id);
  }, [filteredEventi, selectedEvent]);

  const prevEvent = currentEventIndex > 0 ? filteredEventi[currentEventIndex - 1] : null;
  const nextEvent =
    currentEventIndex >= 0 && currentEventIndex < filteredEventi.length - 1
      ? filteredEventi[currentEventIndex + 1]
      : null;

  const eventoPayments = useMemo(
    () =>
      payments
        .filter((p) => p.quote_id === selectedEvent?.id && p.stato !== "annullato")
        .sort((a, b) => String(b.data_incasso).localeCompare(String(a.data_incasso))),
    [payments, selectedEvent]
  );

  const eventoItemsTotali = useMemo(() => {
    const items = selectedEvent?.items || [];
    return {
      ss: items.reduce((sum, it) => sum + it.spettanza_ss_cents, 0),
      iovino: items.reduce((sum, it) => sum + it.spettanza_iovino_cents, 0),
      lordo: items.reduce((sum, it) => sum + it.totale_cents, 0),
    };
  }, [selectedEvent]);

  // Calcolo analitico completo dell'evento (Ufficiale + Extra + Conguaglio Netto)
  const ripartizioneEvento = useMemo(() => {
    if (!selectedEvent) return null;

    const eventPays = payments.filter((p) => p.quote_id === selectedEvent.id && p.stato === "valido");

    // 1. Incassi UFFICIALI (bonifico, pos, assegno)
    const ssOffInc = eventPays
      .filter((p) => p.incassato_da === "santo_stefano" && isOfficialPayment(p))
      .reduce((sum, p) => sum + p.importo_cents, 0);
    const iovOffInc = eventPays
      .filter((p) => p.incassato_da === "iovino" && isOfficialPayment(p))
      .reduce((sum, p) => sum + p.importo_cents, 0);
    const totOffInc = ssOffInc + iovOffInc;

    // 2. Incassi EXTRA (contanti / natura extra)
    const ssExtInc = eventPays
      .filter((p) => p.incassato_da === "santo_stefano" && isExtraPayment(p))
      .reduce((sum, p) => sum + p.importo_cents, 0);
    const iovExtInc = eventPays
      .filter((p) => p.incassato_da === "iovino" && isExtraPayment(p))
      .reduce((sum, p) => sum + p.importo_cents, 0);
    const totExtInc = ssExtInc + iovExtInc;

    // 3. Spettanza UFFICIALE (contrattuale)
    const ssOffSp = selectedEvent.spettanza.santo_stefano;
    const iovOffSp = selectedEvent.spettanza.iovino;
    const totOffSp = ssOffSp + iovOffSp;

    const ssOffRes = Math.max(0, ssOffSp - ssOffInc);
    const iovOffRes = Math.max(0, iovOffSp - iovOffInc);
    const totOffRes = Math.max(0, totOffSp - totOffInc);

    // 4. Spettanza EXTRA (da extra_quote se definito o default dai contanti registrati)
    const eq = selectedEvent.extra_quote;
    const eqSS = eq?.totale_santo_stefano ? Math.round(eq.totale_santo_stefano * 100) : 0;
    const eqIov = eq?.totale_iovino ? Math.round(eq.totale_iovino * 100) : 0;
    const eqTot = eq?.totale ? Math.round(eq.totale * 100) : 0;

    const ssExtSp = Math.max(eqSS, ssExtInc);
    const iovExtSp = Math.max(eqIov, iovExtInc);
    const totExtSp = Math.max(eqTot, ssExtSp + iovExtSp);

    const ssExtRes = Math.max(0, ssExtSp - ssExtInc);
    const iovExtRes = Math.max(0, iovExtSp - iovExtInc);
    const totExtRes = Math.max(0, totExtSp - totExtInc);

    // 5. Totali COMBINATI (Ufficiale + Extra)
    const ssTotSp = ssOffSp + ssExtSp;
    const iovTotSp = iovOffSp + iovExtSp;
    const totGlobaleSp = totOffSp + totExtSp;

    const ssTotInc = ssOffInc + ssExtInc;
    const iovTotInc = iovOffInc + iovExtInc;
    const totGlobaleInc = totOffInc + totExtInc;

    const ssTotRes = ssOffRes + ssExtRes;
    const iovTotRes = iovOffRes + iovExtRes;
    const totGlobaleRes = totOffRes + totExtRes;

    // 6. Conguagli
    const deltaOffSS = ssOffInc - ssOffSp;
    const conguaglioUfficiale =
      deltaOffSS > 0
        ? { da: "santo_stefano" as const, a: "iovino" as const, importo_cents: deltaOffSS }
        : deltaOffSS < 0
        ? { da: "iovino" as const, a: "santo_stefano" as const, importo_cents: Math.abs(deltaOffSS) }
        : null;

    const deltaExtSS = ssExtInc - ssExtSp;
    const conguaglioExtra =
      deltaExtSS > 0
        ? { da: "santo_stefano" as const, a: "iovino" as const, importo_cents: deltaExtSS }
        : deltaExtSS < 0
        ? { da: "iovino" as const, a: "santo_stefano" as const, importo_cents: Math.abs(deltaExtSS) }
        : null;

    const deltaNettoSS = ssTotInc - ssTotSp;
    const conguaglioNetto =
      deltaNettoSS > 0
        ? { da: "santo_stefano" as const, a: "iovino" as const, importo_cents: deltaNettoSS }
        : deltaNettoSS < 0
        ? { da: "iovino" as const, a: "santo_stefano" as const, importo_cents: Math.abs(deltaNettoSS) }
        : null;

    return {
      ssOffSp, iovOffSp, totOffSp,
      ssOffInc, iovOffInc, totOffInc,
      ssOffRes, iovOffRes, totOffRes,
      ssExtSp, iovExtSp, totExtSp,
      ssExtInc, iovExtInc, totExtInc,
      ssExtRes, iovExtRes, totExtRes,
      ssTotSp, iovTotSp, totGlobaleSp,
      ssTotInc, iovTotInc, totGlobaleInc,
      ssTotRes, iovTotRes, totGlobaleRes,
      conguaglioUfficiale,
      conguaglioExtra,
      conguaglioNetto,
      hasExtraQuote: Boolean(eq && eq.items_count > 0),
      extraQuoteItemsCount: eq?.items_count || 0,
    };
  }, [selectedEvent, payments]);

  // Calcolo analitico globale (tutti gli eventi dell'azienda)
  const ripartizioneGlobale = useMemo(() => {
    const validPays = payments.filter((p) => p.stato === "valido");

    let ssOffSp = 0;
    let iovOffSp = 0;
    for (const ev of eventi) {
      ssOffSp += ev.spettanza.santo_stefano;
      iovOffSp += ev.spettanza.iovino;
    }
    const totOffSp = ssOffSp + iovOffSp;

    const ssOffInc = validPays
      .filter((p) => p.incassato_da === "santo_stefano" && isOfficialPayment(p))
      .reduce((sum, p) => sum + p.importo_cents, 0);
    const iovOffInc = validPays
      .filter((p) => p.incassato_da === "iovino" && isOfficialPayment(p))
      .reduce((sum, p) => sum + p.importo_cents, 0);
    const totOffInc = ssOffInc + iovOffInc;

    const ssOffRes = Math.max(0, ssOffSp - ssOffInc);
    const iovOffRes = Math.max(0, iovOffSp - iovOffInc);
    const totOffRes = Math.max(0, totOffSp - totOffInc);

    let ssExtSp = 0;
    let iovExtSp = 0;
    for (const ev of eventi) {
      const eq = ev.extra_quote;
      const eqSS = eq?.totale_santo_stefano ? Math.round(eq.totale_santo_stefano * 100) : 0;
      const eqIov = eq?.totale_iovino ? Math.round(eq.totale_iovino * 100) : 0;
      ssExtSp += eqSS;
      iovExtSp += eqIov;
    }

    const ssExtInc = validPays
      .filter((p) => p.incassato_da === "santo_stefano" && isExtraPayment(p))
      .reduce((sum, p) => sum + p.importo_cents, 0);
    const iovExtInc = validPays
      .filter((p) => p.incassato_da === "iovino" && isExtraPayment(p))
      .reduce((sum, p) => sum + p.importo_cents, 0);
    const totExtInc = ssExtInc + iovExtInc;

    ssExtSp = Math.max(ssExtSp, ssExtInc);
    iovExtSp = Math.max(iovExtSp, iovExtInc);
    const totExtSp = ssExtSp + iovExtSp;

    const ssExtRes = Math.max(0, ssExtSp - ssExtInc);
    const iovExtRes = Math.max(0, iovExtSp - iovExtInc);
    const totExtRes = Math.max(0, totExtSp - totExtInc);

    const ssTotSp = ssOffSp + ssExtSp;
    const iovTotSp = iovOffSp + iovExtSp;
    const totGlobaleSp = totOffSp + totExtSp;

    const ssTotInc = ssOffInc + ssExtInc;
    const iovTotInc = iovOffInc + iovExtInc;
    const totGlobaleInc = totOffInc + totExtInc;

    const ssTotRes = ssOffRes + ssExtRes;
    const iovTotRes = iovOffRes + iovExtRes;
    const totGlobaleRes = totOffRes + totExtRes;

    const deltaOffSS = ssOffInc - ssOffSp;
    const conguaglioUfficiale =
      deltaOffSS > 0
        ? { da: "santo_stefano" as const, a: "iovino" as const, importo_cents: deltaOffSS }
        : deltaOffSS < 0
        ? { da: "iovino" as const, a: "santo_stefano" as const, importo_cents: Math.abs(deltaOffSS) }
        : null;

    const deltaExtSS = ssExtInc - ssExtSp;
    const conguaglioExtra =
      deltaExtSS > 0
        ? { da: "santo_stefano" as const, a: "iovino" as const, importo_cents: deltaExtSS }
        : deltaExtSS < 0
        ? { da: "iovino" as const, a: "santo_stefano" as const, importo_cents: Math.abs(deltaExtSS) }
        : null;

    const deltaNettoSS = ssTotInc - ssTotSp;
    const conguaglioNetto =
      deltaNettoSS > 0
        ? { da: "santo_stefano" as const, a: "iovino" as const, importo_cents: deltaNettoSS }
        : deltaNettoSS < 0
        ? { da: "iovino" as const, a: "santo_stefano" as const, importo_cents: Math.abs(deltaNettoSS) }
        : null;

    return {
      ssOffSp, iovOffSp, totOffSp,
      ssOffInc, iovOffInc, totOffInc,
      ssOffRes, iovOffRes, totOffRes,
      ssExtSp, iovExtSp, totExtSp,
      ssExtInc, iovExtInc, totExtInc,
      ssExtRes, iovExtRes, totExtRes,
      ssTotSp, iovTotSp, totGlobaleSp,
      ssTotInc, iovTotInc, totGlobaleInc,
      ssTotRes, iovTotRes, totGlobaleRes,
      conguaglioUfficiale,
      conguaglioExtra,
      conguaglioNetto,
    };
  }, [eventi, payments]);

  const selectEvento = (id: string) => {
    setSelectedEventId(id);
    setSocietaView("evento");
    setIsSearchFocused(false);
  };

  /* -------------------------- Registro Incassi -------------------------- */
  const [incassiQuery, setIncassiQuery] = useState("");
  const [incassoOpen, setIncassoOpen] = useState(false);

  const filteredPayments = useMemo(() => {
    const needle = incassiQuery.trim().toLowerCase();
    if (!needle) return payments;
    return payments.filter((p) => {
      const haystack = [
        p.eventoLabel,
        p.data_incasso,
        formatDate(p.data_incasso),
        p.metodo,
        METHOD_LABELS[p.metodo] || "",
        COMPANY_LABELS[p.incassato_da] || "",
        p.riferimento || "",
        p.note || "",
        p.registrato_da || ""
      ].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [payments, incassiQuery]);
  const [incQuoteId, setIncQuoteId] = useState(eventOptions[0]?.id || "");
  const [incData, setIncData] = useState(todayIso());
  const [incImporto, setIncImporto] = useState("");
  const [incMetodo, setIncMetodo] = useState<Metodo>("bonifico");
  const [incCompany, setIncCompany] = useState<Company>("santo_stefano");
  const [incNatura, setIncNatura] = useState<"ufficiale" | "extra">("ufficiale");
  const [incRegistrato, setIncRegistrato] = useState("Roberto Sola");
  const [incRif, setIncRif] = useState("");
  const [incNote, setIncNote] = useState("");
  const [incError, setIncError] = useState("");
  const [incPending, startIncasso] = useTransition();
  const [sollecitoTarget, setSollecitoTarget] = useState<{
    sposi: string;
    telefono: string;
    rataLabel: string;
    scadenza: string;
    residuo: number;
  } | null>(null);
  const [sollecitoTesto, setSollecitoTesto] = useState("");

  const openSollecito = (evento: any, rata: any) => {
    const rawTel = String(evento.telefono || "").replace(/[^0-9]/g, "");
    const tel = rawTel || "393331234567";
    const residuo = Math.max(0, rata.importo_cents - rata.coperto_cents);
    const nome = evento.sposi ? evento.sposi.split(" ")[0] : "Gentile Cliente";
    const msg = `Ciao ${nome}, sono Roberto de La Terra degli Aranci. Ti contatto con discrezione in merito alla rata di ${rata.label} (${formatEuro(residuo / 100)}) con scadenza ${formatDate(rata.scadenza)}. Quando hai modo, ci possiamo sentire per verificare l'accredito? Un caro saluto, Roberto Sola`;
    setSollecitoTarget({
      sposi: evento.sposi,
      telefono: tel,
      rataLabel: rata.label,
      scadenza: rata.scadenza,
      residuo,
    });
    setSollecitoTesto(msg);
  };

  const openIncasso = () => {
    setIncError("");
    setIncData(todayIso());
    setIncImporto("");
    setIncMetodo("bonifico");
    setIncCompany("santo_stefano");
    setIncNatura("ufficiale");
    setIncRegistrato("Roberto Sola");
    setIncRif("");
    setIncNote("");
    setIncQuoteId(eventOptions[0]?.id || "");
    setIncassoOpen(true);
  };

  const handleRecordIncasso = (e: React.FormEvent) => {
    e.preventDefault();
    setIncError("");
    if (!incQuoteId) {
      setIncError("Seleziona l'evento da incassare.");
      return;
    }
    const importo = Number(String(incImporto).replace(",", "."));
    if (!Number.isFinite(importo) || importo <= 0) {
      setIncError("Inserisci un importo valido (maggiore di zero).");
      return;
    }
    startIncasso(async () => {
      const res = await recordPaymentAction({
        quote_id: incQuoteId,
        data_incasso: incData,
        importo_cents: Math.round(importo * 100),
        metodo: incMetodo,
        incassato_da: incCompany,
        natura: incNatura,
        riferimento: incRif.trim() || undefined,
        note: incNote.trim() || undefined,
        registrato_da: incRegistrato.trim() || "admin",
      });
      if (res.success) {
        setIncassoOpen(false);
        router.refresh();
      } else {
        setIncError(res.error || "Impossibile registrare l'incasso.");
      }
    });
  };

  /* ----------------------------- Scadenze ------------------------------ */
  const scadenze = useMemo(() => {
    const list: Array<{ evento: CassaEventoRow; rata: CassaRateRow }> = [];
    for (const ev of eventi) {
      for (const rata of ev.rate) {
        if (rata.stato !== "saldata") list.push({ evento: ev, rata });
      }
    }
    list.sort((a, b) => String(a.rata.scadenza || "9999-12-31").localeCompare(String(b.rata.scadenza || "9999-12-31")));
    return list;
  }, [eventi]);

  const totaleRitardi = scadenze.filter((s) => s.rata.in_ritardo).reduce((sum, s) => sum + s.rata.importo_cents - s.rata.coperto_cents, 0);

  /* ----------------------------- Società ------------------------------- */
  const handleExportCsv = () => {
    const header = [
      "Evento",
      "Data",
      "Formula",
      "Stato",
      "Concordato",
      "Spettanza SS",
      "Spettanza Iovino",
      "Incassato SS",
      "Incassato Iovino",
      "Residuo SS",
      "Residuo Iovino",
    ];
    const lines = [header];
    for (const ev of eventi) {
      lines.push([
        ev.sposi,
        ev.data_evento || "",
        ev.formula,
        ev.stageLabel,
        (ev.concordato_cents / 100).toFixed(2),
        (ev.spettanza.santo_stefano / 100).toFixed(2),
        (ev.spettanza.iovino / 100).toFixed(2),
        (ev.incassato_per.santo_stefano / 100).toFixed(2),
        (ev.incassato_per.iovino / 100).toFixed(2),
        (ev.residuo_per.santo_stefano / 100).toFixed(2),
        (ev.residuo_per.iovino / 100).toFixed(2),
      ]);
    }
    const csv = lines
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ripartizione-societaria-tda-${todayIso()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cardStyle: React.CSSProperties = { padding: "1.6rem", borderRadius: "16px", border: "1px solid #eee7de", background: "#fff" };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", fontFamily: "'Outfit', sans-serif" }}>
      {/* Intestazione */}
      <div style={{ marginBottom: "1.5rem" }}>
        <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", color: "#e58c2c", fontWeight: "bold" }}>
          PILASTRO CASSA UNIFICATO
        </span>
        <h1 style={{ margin: "0.3rem 0 0 0", color: "#514d48", fontSize: "2.2rem", fontFamily: "serif" }}>
          💶 Cassa Unificata TDA
        </h1>
        <p style={{ margin: 0, color: "#777" }}>
          Registro incassi reali, scadenze rate contrattuali e ripartizione analitica Santo Stefano / Iovino per singolo evento e globale.
        </p>
      </div>

      {/* Tab Nav */}
      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.8rem", flexWrap: "wrap", borderBottom: "1px solid #eae2d6", paddingBottom: "1rem" }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTab(t.id)}
              style={{
                padding: "0.7rem 1.3rem",
                borderRadius: "12px",
                border: active ? "none" : "1px solid #eee7de",
                background: active ? "linear-gradient(135deg, #1e1b18 0%, #3a342e 100%)" : "#ffffff",
                color: active ? "#ffffff" : "#6a6764",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {/* ------------------------------- INCASSI ------------------------------- */}
      {tab === "incassi" && (
        <div className="premium-card" style={{ padding: "1.5rem", overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ margin: 0, color: "#1e1b18", fontSize: "1.3rem" }}>💰 Registro Cronologico Incassi Reali</h2>
              <small style={{ color: "#8a847c" }}>
                {payments.length} movimenti registrati · {payments.filter((p) => p.stato === "valido").length} validi
                {incassiQuery && ` (filtrati: ${filteredPayments.length})`}
              </small>
            </div>
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="search"
                value={incassiQuery}
                onChange={(e) => setIncassiQuery(e.target.value)}
                placeholder="🔍 Filtra per Data o Sposi..."
                style={{
                  padding: "0.6rem 0.9rem",
                  borderRadius: "10px",
                  border: "1px solid #dcd7cf",
                  fontSize: "0.88rem",
                  minWidth: "260px",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={openIncasso}
                style={{
                  padding: "0.7rem 1.3rem",
                  background: "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(229,140,44,0.3)",
                }}
              >
                + Registra Incasso
              </button>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e8e2d9", color: "#78716c", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "0.75rem 0.6rem" }}>Data</th>
                <th style={{ padding: "0.75rem 0.6rem" }}>Evento</th>
                <th style={{ padding: "0.75rem 0.6rem", textAlign: "right" }}>Importo</th>
                <th style={{ padding: "0.75rem 0.6rem" }}>Metodo</th>
                <th style={{ padding: "0.75rem 0.6rem" }}>Incassato da</th>
                <th style={{ padding: "0.75rem 0.6rem" }}>Note</th>
                <th style={{ padding: "0.75rem 0.6rem" }}>Stato</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "#94a3b8" }}>
                    {incassiQuery ? `Nessun incasso trovato per "${incassiQuery}".` : "Nessun incasso registrato. Usa “+ Registra Incasso” per iniziare."}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const annullato = p.stato === "annullato";
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f0eee9", opacity: annullato ? 0.55 : 1 }}>
                      <td style={{ padding: "0.8rem 0.6rem", whiteSpace: "nowrap" }}>{formatDate(p.data_incasso)}</td>
                      <td style={{ padding: "0.8rem 0.6rem" }}>
                        <a href={`/admin/eventi/${p.quote_id}`} style={{ color: "#1e1b18", fontWeight: 700, textDecoration: "none" }}>
                          {p.eventoLabel}
                        </a>
                      </td>
                      <td style={{ padding: "0.8rem 0.6rem", textAlign: "right", fontWeight: 700, color: annullato ? "#9a9a9a" : "#16a34a", whiteSpace: "nowrap" }}>
                        {formatEuro(p.importo_cents / 100)}
                      </td>
                      <td style={{ padding: "0.8rem 0.6rem" }}>
                        <div>{METHOD_LABELS[p.metodo] || p.metodo}</div>
                        <span style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.45rem",
                          borderRadius: "6px",
                          background: p.natura === "extra" ? "#fef3c7" : "#dbeafe",
                          color: p.natura === "extra" ? "#92400e" : "#1d4ed8",
                          display: "inline-block",
                          marginTop: "0.2rem"
                        }}>
                          {p.natura === "extra" ? "Extra" : "Ufficiale"}
                        </span>
                      </td>
                      <td style={{ padding: "0.8rem 0.6rem", fontSize: "0.82rem" }}>{COMPANY_LABELS[p.incassato_da] || p.incassato_da}</td>
                      <td style={{ padding: "0.8rem 0.6rem", fontSize: "0.8rem", color: "#78716c", maxWidth: "220px" }}>
                        {p.riferimento ? <span style={{ display: "block" }}>Rif: {p.riferimento}</span> : null}
                        {p.note ? <span style={{ display: "block" }}>{p.note}</span> : null}
                        {!p.riferimento && !p.note ? "—" : null}
                      </td>
                      <td style={{ padding: "0.8rem 0.6rem" }}>
                        {annullato ? (
                          <span title={p.annullato_motivo} style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "999px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
                            Annullato
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "999px", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
                            Valido
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------------------ SCADENZE ------------------------------ */}
      {tab === "scadenze" && (
        <div className="premium-card" style={{ padding: "1.5rem", overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ margin: 0, color: "#1e1b18", fontSize: "1.3rem" }}>📅 Rate Contrattuali Aperte</h2>
              <small style={{ color: "#8a847c" }}>Contratti confermati o in firma · {scadenze.length} rate ancora da incassare</small>
            </div>
            {totaleRitardi > 0 && (
              <span style={{ padding: "0.5rem 0.9rem", borderRadius: "10px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", fontWeight: 700, fontSize: "0.85rem" }}>
                ⚠️ {formatEuro(totaleRitardi / 100)} in ritardo
              </span>
            )}
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e8e2d9", color: "#78716c", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "0.75rem 0.6rem" }}>Evento</th>
                <th style={{ padding: "0.75rem 0.6rem" }}>Data Evento</th>
                <th style={{ padding: "0.75rem 0.6rem" }}>Rata</th>
                <th style={{ padding: "0.75rem 0.6rem" }}>Scadenza</th>
                <th style={{ padding: "0.75rem 0.6rem", textAlign: "right" }}>Importo</th>
                <th style={{ padding: "0.75rem 0.6rem", textAlign: "right" }}>Residuo Rata</th>
                <th style={{ padding: "0.75rem 0.6rem" }}>Stato</th>
              </tr>
            </thead>
            <tbody>
              {scadenze.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "#94a3b8" }}>
                    Nessuna rata aperta: tutti i contratti confermati risultano saldati.
                  </td>
                </tr>
              ) : (
                scadenze.map(({ evento, rata }, idx) => {
                  const residuo = Math.max(0, rata.importo_cents - rata.coperto_cents);
                  return (
                    <tr
                      key={`${evento.id}-${rata.key}-${idx}`}
                      onClick={() => openSollecito(evento, rata)} title="Clicca per inviare sollecito WhatsApp"
                      style={{
                        borderBottom: "1px solid #f0eee9",
                        cursor: "pointer",
                        background: rata.in_ritardo ? "#fef2f2" : "transparent",
                        color: rata.in_ritardo ? "#991b1b" : "inherit",
                      }}
                    >
                      <td style={{ padding: "0.85rem 0.6rem", fontWeight: 700 }}>{evento.sposi}</td>
                      <td style={{ padding: "0.85rem 0.6rem", whiteSpace: "nowrap" }}>{formatDate(evento.data_evento)}</td>
                      <td style={{ padding: "0.85rem 0.6rem" }}>{rata.label}</td>
                      <td style={{ padding: "0.85rem 0.6rem", fontWeight: rata.in_ritardo ? 800 : 500, whiteSpace: "nowrap" }}>
                        {formatDate(rata.scadenza)}
                      </td>
                      <td style={{ padding: "0.85rem 0.6rem", textAlign: "right", whiteSpace: "nowrap" }}>{formatEuro(rata.importo_cents / 100)}</td>
                      <td style={{ padding: "0.85rem 0.6rem", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{formatEuro(residuo / 100)}</td>
                      <td style={{ padding: "0.85rem 0.6rem", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {rata.in_ritardo ? (
                            <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.5rem", borderRadius: "999px", background: "#fee2e2", color: "#b91c1c" }}>
                              Scaduta
                            </span>
                          ) : rata.stato === "parziale" ? (
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "999px", background: "#fff7ed", color: "#c2410c" }}>
                              Parziale
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "999px", background: "#f0fdf4", color: "#15803d" }}>
                              In scadenza
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSollecito(evento, rata);
                            }}
                            title="Invia sollecito WhatsApp con testo modificabile"
                            style={{
                              background: "#25D366",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "0.25rem 0.6rem",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              boxShadow: "0 2px 4px rgba(37,211,102,0.25)",
                            }}
                          >
                            💬 WhatsApp
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------------------ SOCIETÀ ------------------------------- */}
      {tab === "societa" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Barra di selezione & ricerca evento */}
          <div style={{ ...cardStyle, padding: "1.3rem 1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ margin: 0, color: "#1e1b18", fontSize: "1.3rem" }}>🏛️ Ripartizione Società</h2>
                <small style={{ color: "#8a847c" }}>Analizza la ripartizione economica evento per evento o in prospetto globale.</small>
              </div>
              <div style={{ display: "inline-flex", background: "#f3efe9", borderRadius: "999px", padding: "0.25rem", gap: "0.25rem" }}>
                {([
                  { id: "evento", label: "🎯 Dettaglio Singolo Evento" },
                  { id: "globale", label: "📊 Prospetto Globale (Tutti gli Eventi)" },
                ] as const).map((mode) => {
                  const active = societaView === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setSocietaView(mode.id)}
                      style={{
                        border: "none",
                        borderRadius: "999px",
                        padding: "0.55rem 1rem",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        background: active ? "linear-gradient(135deg, #1e1b18 0%, #3a342e 100%)" : "transparent",
                        color: active ? "#fff" : "#6a6764",
                      }}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {societaView === "evento" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {/* Riga 1: Ricerca testuale con Clear + Select dropdown + Tasti Precedente/Successivo */}
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ position: "relative", flex: "1 1 300px" }}>
                    <input
                      type="search"
                      value={societaQuery}
                      onChange={(e) => setSocietaQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      placeholder="🔍 Cerca per nome sposi, codice o data (es. Marco Esposito, 18/09/2027)..."
                      aria-label="Cerca evento"
                      style={{
                        width: "100%",
                        padding: "0.8rem 2.4rem 0.8rem 1rem",
                        borderRadius: "10px",
                        border: "1.5px solid #d4c8b8",
                        fontSize: "0.92rem",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                    />
                    {societaQuery && (
                      <button
                        type="button"
                        onClick={() => setSocietaQuery("")}
                        style={{
                          position: "absolute",
                          right: "0.8rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "transparent",
                          border: "none",
                          fontSize: "1rem",
                          cursor: "pointer",
                          color: "#94a3b8",
                        }}
                        title="Cancella ricerca"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown per selezione rapida istantanea */}
                  <div style={{ flex: "1 1 280px" }}>
                    <select
                      value={selectedEvent?.id || ""}
                      onChange={(e) => selectEvento(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.8rem 1rem",
                        borderRadius: "10px",
                        border: "1.5px solid #d4c8b8",
                        fontSize: "0.92rem",
                        fontWeight: 600,
                        background: "#fcfbf9",
                        color: "#1e1b18",
                        cursor: "pointer",
                      }}
                      aria-label="Seleziona evento dal menu a tendina"
                    >
                      {filteredEventi.length === 0 ? (
                        <option value="">Nessun evento corrispondente ai filtri</option>
                      ) : (
                        filteredEventi.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.is_demo ? "🎭 DEMO · " : ev.tipo_evento === "wedding" ? "💍 " : "🎉 "}
                            {formatDate(ev.data_evento)} — {ev.sposi} ({formatEuro(ev.concordato_cents / 100)})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Tasti di navigazione rapida Precedente / Successivo */}
                  <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                    <button
                      type="button"
                      disabled={!prevEvent}
                      onClick={() => prevEvent && selectEvento(prevEvent.id)}
                      style={{
                        padding: "0.75rem 0.9rem",
                        borderRadius: "10px",
                        border: "1px solid #d4c8b8",
                        background: prevEvent ? "#fff" : "#f1efec",
                        color: prevEvent ? "#1e1b18" : "#a8a29e",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        cursor: prevEvent ? "pointer" : "not-allowed",
                        whiteSpace: "nowrap",
                      }}
                      title={prevEvent ? `Vai a ${prevEvent.sposi}` : "Nessun evento precedente"}
                    >
                      ◀ Prec
                    </button>
                    <button
                      type="button"
                      disabled={!nextEvent}
                      onClick={() => nextEvent && selectEvento(nextEvent.id)}
                      style={{
                        padding: "0.75rem 0.9rem",
                        borderRadius: "10px",
                        border: "1px solid #d4c8b8",
                        background: nextEvent ? "#fff" : "#f1efec",
                        color: nextEvent ? "#1e1b18" : "#a8a29e",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        cursor: nextEvent ? "pointer" : "not-allowed",
                        whiteSpace: "nowrap",
                      }}
                      title={nextEvent ? `Vai a ${nextEvent.sposi}` : "Nessun evento successivo"}
                    >
                      Succ ▶
                    </button>
                  </div>
                </div>

                {/* Riga 2: Filtri Rapidi Anno, Tipo e Incassi */}
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#8a847c", marginRight: "0.2rem" }}>
                    Filtra:
                  </span>
                  {[
                    { id: "all", label: `Tutti (${eventi.length})` },
                    { id: "2027", label: `2027 (${eventi.filter((e) => e.data_evento?.startsWith("2027")).length})` },
                    { id: "2026", label: `2026 (${eventi.filter((e) => e.data_evento?.startsWith("2026")).length})` },
                    { id: "2025", label: `2025 (${eventi.filter((e) => e.data_evento?.startsWith("2025")).length})` },
                  ].map((chip) => {
                    const active = filterYear === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setFilterYear(chip.id as any)}
                        style={{
                          border: active ? "1.5px solid #e58c2c" : "1px solid #e0ddd9",
                          background: active ? "#fff7ed" : "#fff",
                          color: active ? "#c2410c" : "#6a6764",
                          borderRadius: "999px",
                          padding: "0.3rem 0.75rem",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {chip.label}
                      </button>
                    );
                  })}

                  <span style={{ width: "1px", height: "16px", background: "#e0ddd9", margin: "0 0.2rem" }} />

                  {[
                    { id: "all", label: "Tutti i tipi" },
                    { id: "wedding", label: `💍 Matrimoni (${eventi.filter((e) => e.tipo_evento === "wedding").length})` },
                    { id: "eventi", label: `🎉 Privati (${eventi.filter((e) => e.tipo_evento !== "wedding").length})` },
                  ].map((chip) => {
                    const active = filterType === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setFilterType(chip.id as any)}
                        style={{
                          border: active ? "1.5px solid #2563eb" : "1px solid #e0ddd9",
                          background: active ? "#eff6ff" : "#fff",
                          color: active ? "#1d4ed8" : "#6a6764",
                          borderRadius: "999px",
                          padding: "0.3rem 0.75rem",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {chip.label}
                      </button>
                    );
                  })}

                  <span style={{ width: "1px", height: "16px", background: "#e0ddd9", margin: "0 0.2rem" }} />

                  <button
                    type="button"
                    onClick={() => setFilterWithPayments((v) => !v)}
                    style={{
                      border: filterWithPayments ? "1.5px solid #16a34a" : "1px solid #e0ddd9",
                      background: filterWithPayments ? "#f0fdf4" : "#fff",
                      color: filterWithPayments ? "#15803d" : "#6a6764",
                      borderRadius: "999px",
                      padding: "0.3rem 0.75rem",
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    💰 Solo con incassi ({eventi.filter((e) => payments.some((p) => p.quote_id === e.id && p.stato === "valido")).length})
                  </button>
                </div>

                {/* Riga 3: Pill carousel con evidenziazione chiara */}
                <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", padding: "0.5rem 0 0.2rem 0" }}>
                  {filteredEventi.length === 0 ? (
                    <span style={{ color: "#94a3b8", fontSize: "0.85rem", padding: "0.4rem 0" }}>
                      Nessun evento trovato con i filtri attuali.
                    </span>
                  ) : (
                    filteredEventi.map((ev) => {
                      const active = selectedEvent?.id === ev.id;
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => selectEvento(ev.id)}
                          style={{
                            whiteSpace: "nowrap",
                            borderRadius: "999px",
                            border: active ? "2px solid #e58c2c" : "1px solid #e0ddd9",
                            background: active ? "#fff7ed" : "#fff",
                            color: active ? "#c2410c" : "#514d48",
                            fontWeight: active ? 800 : 600,
                            fontSize: "0.82rem",
                            padding: "0.45rem 0.85rem",
                            cursor: "pointer",
                            boxShadow: active ? "0 2px 8px rgba(229,140,44,0.25)" : "none",
                          }}
                        >
                          {active ? "✓ " : ""}
                          {ev.is_demo ? "🎭 DEMO · " : ev.tipo_evento === "wedding" ? "💍 " : "🎉 "}
                          {ev.sposi} · {formatDate(ev.data_evento)}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {societaView === "evento" && selectedEvent && ripartizioneEvento && (
            <>
              {/* Testata evento */}
              <div style={{ ...cardStyle, borderLeft: "6px solid #e58c2c" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800, color: "#c2410c" }}>
                      {selectedEvent.tipo_evento === "wedding" ? "MATRIMONIO" : "EVENTO PRIVATO"}
                    </span>
                    <h2 style={{ margin: "0.3rem 0", color: "#1e1b18", fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span>{selectedEvent.tipo_evento === "wedding" ? "💍" : "🎉"} {selectedEvent.sposi} — {selectedEvent.codice}</span>
                      {selectedEvent.is_demo && (
                        <span
                          style={{
                            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                            color: "#92400e",
                            border: "1px solid #f59e0b",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            padding: "0.2rem 0.6rem",
                            borderRadius: "999px",
                            letterSpacing: "0.5px",
                          }}
                        >
                          🎭 DEMO (Con Quota Extra)
                        </span>
                      )}
                    </h2>
                    <div style={{ color: "#6a6764", fontSize: "0.9rem" }}>
                      📅 {formatDate(selectedEvent.data_evento)} · {selectedEvent.turno.toLowerCase().includes("cena") ? "🌙" : "☀️"}{" "}
                      {turnoLabelIt(selectedEvent.turno)} · 🏛️ {selectedEvent.formula} · 👥 {selectedEvent.ospiti} ospiti
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.5rem", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          padding: "0.2rem 0.6rem",
                          borderRadius: "999px",
                          background: selectedEvent.badgeColor ? `${selectedEvent.badgeColor}22` : "#f0eee9",
                          color: selectedEvent.badgeColor || "#514d48",
                          border: `1px solid ${selectedEvent.badgeColor || "#e0ddd9"}`,
                        }}
                      >
                        {selectedEvent.stageLabel}
                      </span>
                      {selectedEvent.extra_quote && (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            padding: "0.2rem 0.6rem",
                            borderRadius: "999px",
                            background: "#fef3c7",
                            color: "#92400e",
                            border: "1px solid #fde68a",
                          }}
                        >
                          🌿 Preventivo Extra Attivo ({selectedEvent.extra_quote.items_count} voci)
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                    <a
                      href={`/admin/preventivi/${selectedEvent.id}/extra`}
                      style={{
                        padding: "0.7rem 1.1rem",
                        borderRadius: "10px",
                        background: "#fff",
                        color: "#92400e",
                        border: "1.5px solid #f59e0b",
                        fontWeight: 700,
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      🌿 Preventivo Parallelo Extra ➔
                    </a>
                    <a
                      href={`/admin/eventi/${selectedEvent.id}`}
                      style={{
                        padding: "0.7rem 1.1rem",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
                        color: "#fff",
                        fontWeight: 700,
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Scheda Regia 360° ➔
                    </a>
                  </div>
                </div>
              </div>

              {/* BARRA SINTETICA A 3 GRANDI INDICATORI ECONOMICI (UFFICIALE vs EXTRA vs TOTALE) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {/* 1. Totale Ufficiale */}
                <div style={{ ...cardStyle, borderLeft: "6px solid #2563eb", background: "#f8fafc" }}>
                  <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, color: "#2563eb" }}>
                    🏛️ 1. PARTE UFFICIALE (FATTURATA)
                  </span>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1e293b", margin: "0.3rem 0 0.8rem" }}>
                    {formatEuro(ripartizioneEvento.totOffSp / 100)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.85rem" }}>
                    <div>
                      <small style={{ color: "#64748b", display: "block" }}>Incassato Ufficiale</small>
                      <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneEvento.totOffInc / 100)}</strong>
                    </div>
                    <div>
                      <small style={{ color: "#64748b", display: "block" }}>Residuo Ufficiale</small>
                      <strong style={{ color: ripartizioneEvento.totOffRes > 0 ? "#2563eb" : "#16a34a" }}>
                        {formatEuro(ripartizioneEvento.totOffRes / 100)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. Totale Extra */}
                <div style={{ ...cardStyle, borderLeft: "6px solid #d97706", background: "#fffbeb" }}>
                  <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, color: "#d97706" }}>
                    🌿 2. PARTE &quot;EXTRA&quot; (CONTANTI & FORNITORI)
                  </span>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#78350f", margin: "0.3rem 0 0.8rem" }}>
                    {formatEuro(ripartizioneEvento.totExtSp / 100)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.85rem" }}>
                    <div>
                      <small style={{ color: "#92400e", display: "block" }}>Incassato Contanti</small>
                      <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneEvento.totExtInc / 100)}</strong>
                    </div>
                    <div>
                      <small style={{ color: "#92400e", display: "block" }}>Residuo Extra</small>
                      <strong style={{ color: ripartizioneEvento.totExtRes > 0 ? "#d97706" : "#16a34a" }}>
                        {formatEuro(ripartizioneEvento.totExtRes / 100)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 3. Totale Generale Evento */}
                <div style={{ ...cardStyle, borderLeft: "6px solid #e58c2c", background: "#faf8f5" }}>
                  <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, color: "#c2410c" }}>
                    💎 3. TOTALE GENERALE EVENTO
                  </span>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1e1b18", margin: "0.3rem 0 0.8rem" }}>
                    {formatEuro(ripartizioneEvento.totGlobaleSp / 100)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.85rem" }}>
                    <div>
                      <small style={{ color: "#78716c", display: "block" }}>Incassato Reale Totale</small>
                      <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneEvento.totGlobaleInc / 100)}</strong>
                    </div>
                    <div>
                      <small style={{ color: "#78716c", display: "block" }}>Residuo Complessivo</small>
                      <strong style={{ color: ripartizioneEvento.totGlobaleRes > 0 ? "#dc2626" : "#16a34a" }}>
                        {formatEuro(ripartizioneEvento.totGlobaleRes / 100)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD DETTAGLIATE DI RIPARTIZIONE SOCIETARIA (SANTO STEFANO vs IOVINO) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
                {/* SANTO STEFANO S.R.L. */}
                <div style={{ ...cardStyle, borderLeft: "6px solid #ea580c" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div>
                      <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, color: "#c2410c" }}>
                        STRUTTURA & VILLA (IVA 22%)
                      </span>
                      <h3 style={{ margin: "0.2rem 0", color: "#1e1b18", fontSize: "1.3rem" }}>
                        Santo Stefano S.r.l. <small style={{ fontSize: "0.8rem", color: "#8a847c" }}>(Roberto)</small>
                      </h3>
                    </div>
                    <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#c2410c" }}>
                      {formatEuro(ripartizioneEvento.ssTotSp / 100)}
                    </span>
                  </div>

                  {/* Sezione A: Quota Ufficiale Santo Stefano */}
                  <div style={{ padding: "0.85rem", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#2563eb", marginBottom: "0.4rem" }}>
                      <span>🏛️ Quota Ufficiale (Fitto & Servizi Fatturati)</span>
                      <span>{formatEuro(ripartizioneEvento.ssOffSp / 100)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
                      <div>
                        <span style={{ color: "#64748b" }}>Incassato Bonifico/POS:</span>{" "}
                        <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneEvento.ssOffInc / 100)}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b" }}>Residuo Ufficiale:</span>{" "}
                        <strong style={{ color: ripartizioneEvento.ssOffRes > 0 ? "#2563eb" : "#16a34a" }}>
                          {formatEuro(ripartizioneEvento.ssOffRes / 100)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Sezione B: Quota Extra Santo Stefano */}
                  <div style={{ padding: "0.85rem", borderRadius: "10px", background: "#fffbeb", border: "1px solid #fde68a", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#92400e", marginBottom: "0.4rem" }}>
                      <span>🌿 Quota &quot;Extra&quot; (Contanti & Allestimenti)</span>
                      <span>{formatEuro(ripartizioneEvento.ssExtSp / 100)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
                      <div>
                        <span style={{ color: "#92400e" }}>Incassato Contanti:</span>{" "}
                        <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneEvento.ssExtInc / 100)}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#92400e" }}>Residuo Extra:</span>{" "}
                        <strong style={{ color: ripartizioneEvento.ssExtRes > 0 ? "#d97706" : "#16a34a" }}>
                          {formatEuro(ripartizioneEvento.ssExtRes / 100)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Riepilogo Totale Santo Stefano */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #f0eee9", paddingTop: "0.6rem", fontSize: "0.9rem" }}>
                    <span style={{ fontWeight: 800, color: "#1e1b18" }}>Totale Spettanza Santo Stefano:</span>
                    <strong style={{ fontSize: "1.1rem", color: "#1e1b18" }}>{formatEuro(ripartizioneEvento.ssTotSp / 100)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#6a6764", marginTop: "0.2rem" }}>
                    <span>Incassato Reale Totale: <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneEvento.ssTotInc / 100)}</strong></span>
                    <span>Residuo Totale: <strong style={{ color: ripartizioneEvento.ssTotRes > 0 ? "#c2410c" : "#16a34a" }}>{formatEuro(ripartizioneEvento.ssTotRes / 100)}</strong></span>
                  </div>
                </div>

                {/* IOVINO BANQUETING S.R.L. */}
                <div style={{ ...cardStyle, borderLeft: "6px solid #16a34a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div>
                      <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, color: "#15803d" }}>
                        SOMMINISTRAZIONE (IVA 10%)
                      </span>
                      <h3 style={{ margin: "0.2rem 0", color: "#1e1b18", fontSize: "1.3rem" }}>
                        Iovino Banqueting S.r.l. <small style={{ fontSize: "0.8rem", color: "#8a847c" }}>(Rosaria)</small>
                      </h3>
                    </div>
                    <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#15803d" }}>
                      {formatEuro(ripartizioneEvento.iovTotSp / 100)}
                    </span>
                  </div>

                  {/* Sezione A: Quota Ufficiale Iovino */}
                  <div style={{ padding: "0.85rem", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#2563eb", marginBottom: "0.4rem" }}>
                      <span>🏛️ Quota Ufficiale (Ristorazione & Somministrazione)</span>
                      <span>{formatEuro(ripartizioneEvento.iovOffSp / 100)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
                      <div>
                        <span style={{ color: "#64748b" }}>Incassato Bonifico/POS:</span>{" "}
                        <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneEvento.iovOffInc / 100)}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b" }}>Residuo Ufficiale:</span>{" "}
                        <strong style={{ color: ripartizioneEvento.iovOffRes > 0 ? "#2563eb" : "#16a34a" }}>
                          {formatEuro(ripartizioneEvento.iovOffRes / 100)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Sezione B: Quota Extra Iovino */}
                  <div style={{ padding: "0.85rem", borderRadius: "10px", background: "#fffbeb", border: "1px solid #fde68a", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#92400e", marginBottom: "0.4rem" }}>
                      <span>🌿 Quota &quot;Extra&quot; (Contanti & Banqueting Extra)</span>
                      <span>{formatEuro(ripartizioneEvento.iovExtSp / 100)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
                      <div>
                        <span style={{ color: "#92400e" }}>Incassato Contanti:</span>{" "}
                        <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneEvento.iovExtInc / 100)}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#92400e" }}>Residuo Extra:</span>{" "}
                        <strong style={{ color: ripartizioneEvento.iovExtRes > 0 ? "#d97706" : "#16a34a" }}>
                          {formatEuro(ripartizioneEvento.iovExtRes / 100)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Riepilogo Totale Iovino */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #f0eee9", paddingTop: "0.6rem", fontSize: "0.9rem" }}>
                    <span style={{ fontWeight: 800, color: "#1e1b18" }}>Totale Spettanza Iovino Banqueting:</span>
                    <strong style={{ fontSize: "1.1rem", color: "#1e1b18" }}>{formatEuro(ripartizioneEvento.iovTotSp / 100)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#6a6764", marginTop: "0.2rem" }}>
                    <span>Incassato Reale Totale: <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneEvento.iovTotInc / 100)}</strong></span>
                    <span>Residuo Totale: <strong style={{ color: ripartizioneEvento.iovTotRes > 0 ? "#15803d" : "#16a34a" }}>{formatEuro(ripartizioneEvento.iovTotRes / 100)}</strong></span>
                  </div>
                </div>
              </div>

              {/* CONGUAGLIO A 3 LIVELLI (UFFICIALE, EXTRA E SALDO NETTO FINALE) */}
              <div style={{ ...cardStyle, background: "linear-gradient(135deg, #1e1b18 0%, #3a342e 100%)", color: "#fff", border: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.12)", paddingBottom: "0.8rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 800 }}>
                      QUADRO CONGUAGLI INTER-SOCIETARI QUESTO EVENTO
                    </span>
                    <h3 style={{ margin: "0.3rem 0 0 0", fontSize: "1.25rem", color: "#fff" }}>
                      Allineamento Contabile tra Roberto Sola e Rosaria Iovino
                    </h3>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.72rem", color: "#a59d93", textTransform: "uppercase", display: "block" }}>Saldo Netto Finale</span>
                    <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#e58c2c" }}>
                      {ripartizioneEvento.conguaglioNetto ? formatEuro(ripartizioneEvento.conguaglioNetto.importo_cents / 100) : formatEuro(0)}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
                  {/* Conguaglio Ufficiale */}
                  <div style={{ padding: "0.9rem", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", color: "#93c5fd", fontWeight: 800, display: "block" }}>
                      🏛️ 1. Conguaglio Canale Ufficiale
                    </span>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: "0.3rem 0" }}>
                      {ripartizioneEvento.conguaglioUfficiale
                        ? `${COMPANY_LABELS[ripartizioneEvento.conguaglioUfficiale.da]} → ${COMPANY_LABELS[ripartizioneEvento.conguaglioUfficiale.a]}`
                        : "Incassi ufficiali allineati"}
                    </div>
                    <small style={{ color: "#94a3b8" }}>
                      {ripartizioneEvento.conguaglioUfficiale
                        ? `Bonifico bancario dovuto: ${formatEuro(ripartizioneEvento.conguaglioUfficiale.importo_cents / 100)}`
                        : "Nessun bonifico inter-societario necessario"}
                    </small>
                  </div>

                  {/* Conguaglio Extra */}
                  <div style={{ padding: "0.9rem", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", color: "#fcd34d", fontWeight: 800, display: "block" }}>
                      🌿 2. Conguaglio Canale Extra
                    </span>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: "0.3rem 0" }}>
                      {ripartizioneEvento.conguaglioExtra
                        ? `${COMPANY_LABELS[ripartizioneEvento.conguaglioExtra.da]} → ${COMPANY_LABELS[ripartizioneEvento.conguaglioExtra.a]}`
                        : "Incassi contanti allineati"}
                    </div>
                    <small style={{ color: "#94a3b8" }}>
                      {ripartizioneEvento.conguaglioExtra
                        ? `Compensazione contanti: ${formatEuro(ripartizioneEvento.conguaglioExtra.importo_cents / 100)}`
                        : "Cassa contanti pareggiata"}
                    </small>
                  </div>

                  {/* Risoluzione Netta */}
                  <div style={{ padding: "0.9rem", borderRadius: "10px", background: "rgba(229,140,44,0.12)", border: "1px solid rgba(229,140,44,0.3)" }}>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", color: "#f6c177", fontWeight: 800, display: "block" }}>
                      ⚖️ 3. Risoluzione Netta Combinata
                    </span>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: "0.3rem 0" }}>
                      {ripartizioneEvento.conguaglioNetto
                        ? `${COMPANY_LABELS[ripartizioneEvento.conguaglioNetto.da]} versa a ${COMPANY_LABELS[ripartizioneEvento.conguaglioNetto.a]}`
                        : "Conti perfettamente pareggiati"}
                    </div>
                    <small style={{ color: "#f6c177" }}>
                      {ripartizioneEvento.conguaglioNetto
                        ? `Importo netto a saldo: ${formatEuro(ripartizioneEvento.conguaglioNetto.importo_cents / 100)}`
                        : "Nessun passaggio economico dovuto"}
                    </small>
                  </div>
                </div>
              </div>

              {/* Rendicontazione di Chiusura Cassa a 4 Totalizzatori (Call Direzione 23/10) */}
              {(() => {
                const eventPayments = payments.filter((p) => p.quote_id === selectedEvent.id && p.stato === "valido");
                const isOfficial = (p: CassaPaymentRow) => p.natura === "ufficiale" || (!p.natura && p.metodo !== "contanti");
                const isExtra = (p: CassaPaymentRow) => p.natura === "extra" || (!p.natura && p.metodo === "contanti");

                const ssOfficial = eventPayments
                  .filter((p) => p.incassato_da === "santo_stefano" && isOfficial(p))
                  .reduce((sum, p) => sum + p.importo_cents, 0);
                const iovinoOfficial = eventPayments
                  .filter((p) => p.incassato_da === "iovino" && isOfficial(p))
                  .reduce((sum, p) => sum + p.importo_cents, 0);
                const ssCash = eventPayments
                  .filter((p) => p.incassato_da === "santo_stefano" && isExtra(p))
                  .reduce((sum, p) => sum + p.importo_cents, 0);
                const iovinoCash = eventPayments
                  .filter((p) => p.incassato_da === "iovino" && isExtra(p))
                  .reduce((sum, p) => sum + p.importo_cents, 0);
                const total4 = ssOfficial + iovinoOfficial + ssCash + iovinoCash;

                return (
                  <div style={{ ...cardStyle, border: "1.5px solid #d4c8b8", background: "#fdfbf7" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800, color: "#8a847c" }}>
                          RENDICONTAZIONE DI CHIUSURA CASSA
                        </span>
                        <h3 style={{ margin: "0.2rem 0 0 0", color: "#1e1b18", fontSize: "1.2rem" }}>
                          🎯 Quadro a 4 Totalizzatori Evento
                        </h3>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.75rem", color: "#8a847c", textTransform: "uppercase", fontWeight: 700 }}>Totale Incassato Reale</span>
                        <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1e1b18" }}>{formatEuro(total4 / 100)}</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                      <div style={{ padding: "0.9rem", borderRadius: "10px", background: "#fff", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 800, color: "#2563eb" }}>
                          1. Quota Ufficiale Santo Stefano S.r.l.
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0.5rem" }}>
                          Fattura Location (Bonifico / POS / Assegno)
                        </div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b" }}>
                          {formatEuro(ssOfficial / 100)}
                        </div>
                      </div>

                      <div style={{ padding: "0.9rem", borderRadius: "10px", background: "#fff", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 800, color: "#7c3aed" }}>
                          2. Quota Ufficiale Iovino Banqueting S.r.l.
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0.5rem" }}>
                          Fattura Banqueting (Bonifico / POS / Assegno)
                        </div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b" }}>
                          {formatEuro(iovinoOfficial / 100)}
                        </div>
                      </div>

                      <div style={{ padding: "0.9rem", borderRadius: "10px", background: "#fff", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 800, color: "#d97706" }}>
                          3. Quota Contanti Santo Stefano S.r.l.
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0.5rem" }}>
                          Extra Location / Fornitori contanti
                        </div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b" }}>
                          {formatEuro(ssCash / 100)}
                        </div>
                      </div>

                      <div style={{ padding: "0.9rem", borderRadius: "10px", background: "#fff", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 800, color: "#059669" }}>
                          4. Quota Contanti Iovino Banqueting S.r.l.
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0.5rem" }}>
                          Extra Banqueting / Fornitori contanti
                        </div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b" }}>
                          {formatEuro(iovinoCash / 100)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Tabella analitica servizi */}
              <div style={{ ...cardStyle, padding: "1.4rem 1.5rem", overflowX: "auto" }}>
                <h3 style={{ margin: "0 0 1rem 0", color: "#1e1b18", fontSize: "1.15rem" }}>🧾 Servizi dell’evento e ripartizione riga per riga</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "900px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e8e2d9", color: "#78716c", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                      <th style={{ padding: "0.7rem 0.6rem" }}>Servizio / Voce di Spesa</th>
                      <th style={{ padding: "0.7rem 0.6rem", textAlign: "right" }}>Q.tà</th>
                      <th style={{ padding: "0.7rem 0.6rem", textAlign: "right" }}>Prezzo Unit.</th>
                      <th style={{ padding: "0.7rem 0.6rem", textAlign: "right" }}>Totale Lordo</th>
                      <th style={{ padding: "0.7rem 0.6rem" }}>Regola Ripartizione</th>
                      <th style={{ padding: "0.7rem 0.6rem", textAlign: "right" }}>Spettanza TDA (Roberto)</th>
                      <th style={{ padding: "0.7rem 0.6rem", textAlign: "right" }}>Spettanza Iovino (Rosaria)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEvent.items.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                          Nessuna voce di spesa registrata su questo evento.
                        </td>
                      </tr>
                    ) : (
                      selectedEvent.items.map((it, idx) => {
                        const colors = splitBadgeColors(it.splitKey);
                        return (
                          <tr key={`${it.id}-${idx}`} style={{ borderBottom: "1px solid #f0eee9" }}>
                            <td style={{ padding: "0.7rem 0.6rem", fontWeight: 600, color: "#1e1b18" }}>{it.descrizione}</td>
                            <td style={{ padding: "0.7rem 0.6rem", textAlign: "right", whiteSpace: "nowrap" }}>{it.quantita}</td>
                            <td style={{ padding: "0.7rem 0.6rem", textAlign: "right", whiteSpace: "nowrap" }}>{formatEuro(it.prezzo_unitario)}</td>
                            <td style={{ padding: "0.7rem 0.6rem", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{formatEuro(it.totale_cents / 100)}</td>
                            <td style={{ padding: "0.7rem 0.6rem" }}>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  padding: "0.2rem 0.5rem",
                                  borderRadius: "999px",
                                  background: colors.background,
                                  color: colors.color,
                                  border: `1px solid ${colors.border}`,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {splitBadgeLabel(it.splitKey, it.splitLabel)}
                              </span>
                            </td>
                            <td style={{ padding: "0.7rem 0.6rem", textAlign: "right", fontWeight: 700, color: "#c2410c", whiteSpace: "nowrap" }}>{formatEuro(it.spettanza_ss_cents / 100)}</td>
                            <td style={{ padding: "0.7rem 0.6rem", textAlign: "right", fontWeight: 700, color: "#15803d", whiteSpace: "nowrap" }}>{formatEuro(it.spettanza_iovino_cents / 100)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid #e8e2d9", background: "#faf8f5" }}>
                      <td colSpan={3} style={{ padding: "0.8rem 0.6rem", fontWeight: 800, color: "#1e1b18" }}>Totale voci</td>
                      <td style={{ padding: "0.8rem 0.6rem", textAlign: "right", fontWeight: 800, whiteSpace: "nowrap" }}>{formatEuro(eventoItemsTotali.lordo / 100)}</td>
                      <td style={{ padding: "0.8rem 0.6rem" }} />
                      <td style={{ padding: "0.8rem 0.6rem", textAlign: "right", fontWeight: 800, color: "#c2410c", whiteSpace: "nowrap" }}>{formatEuro(eventoItemsTotali.ss / 100)}</td>
                      <td style={{ padding: "0.8rem 0.6rem", textAlign: "right", fontWeight: 800, color: "#15803d", whiteSpace: "nowrap" }}>{formatEuro(eventoItemsTotali.iovino / 100)}</td>
                    </tr>
                  </tfoot>
                </table>
                <small style={{ display: "block", marginTop: "0.6rem", color: "#8a847c" }}>
                  Il totale delle spettanze riga per riga può differire di pochi centesimi dalla spettanza complessiva per arrotondamenti e sconti contrattuali.
                </small>
              </div>

              {/* Incassi reali evento */}
              <div style={{ ...cardStyle, padding: "1.4rem 1.5rem", overflowX: "auto" }}>
                <h3 style={{ margin: "0 0 1rem 0", color: "#1e1b18", fontSize: "1.15rem" }}>💰 Incassi Reali registrati su questo evento</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "640px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e8e2d9", color: "#78716c", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                      <th style={{ padding: "0.7rem 0.6rem" }}>Data</th>
                      <th style={{ padding: "0.7rem 0.6rem", textAlign: "right" }}>Importo</th>
                      <th style={{ padding: "0.7rem 0.6rem" }}>Metodo</th>
                      <th style={{ padding: "0.7rem 0.6rem" }}>Incassato da</th>
                      <th style={{ padding: "0.7rem 0.6rem" }}>Riferimento / Quietanza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventoPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                          Nessun incasso reale registrato su questo evento.
                        </td>
                      </tr>
                    ) : (
                      eventoPayments.map((p) => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #f0eee9" }}>
                          <td style={{ padding: "0.7rem 0.6rem", whiteSpace: "nowrap" }}>{formatDate(p.data_incasso)}</td>
                          <td style={{ padding: "0.7rem 0.6rem", textAlign: "right", fontWeight: 700, color: "#16a34a", whiteSpace: "nowrap" }}>{formatEuro(p.importo_cents / 100)}</td>
                          <td style={{ padding: "0.7rem 0.6rem" }}>
                            <div>{METHOD_LABELS[p.metodo] || p.metodo}</div>
                            <span style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "0.15rem 0.45rem",
                              borderRadius: "6px",
                              background: p.natura === "extra" ? "#fef3c7" : "#dbeafe",
                              color: p.natura === "extra" ? "#92400e" : "#1d4ed8",
                              display: "inline-block",
                              marginTop: "0.2rem"
                            }}>
                              {p.natura === "extra" ? "Extra" : "Ufficiale"}
                            </span>
                          </td>
                          <td style={{ padding: "0.7rem 0.6rem", fontSize: "0.82rem" }}>{COMPANY_LABELS[p.incassato_da] || p.incassato_da}</td>
                          <td style={{ padding: "0.7rem 0.6rem", fontSize: "0.8rem", color: "#78716c" }}>
                            {p.riferimento ? `Rif: ${p.riferimento}` : ""}
                            {p.riferimento && p.note ? " · " : ""}
                            {p.note || ""}
                            {!p.riferimento && !p.note ? "—" : ""}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {societaView === "evento" && !selectedEvent && (
            <div style={{ ...cardStyle, padding: "2.5rem", textAlign: "center", color: "#94a3b8" }}>
              Nessun evento disponibile: registra un contratto confermato per vedere la ripartizione analitica.
            </div>
          )}

          {societaView === "globale" && ripartizioneGlobale && (
            <>
              {/* BARRA SINTETICA A 3 GRANDI INDICATORI ECONOMICI AZIENDALI */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {/* 1. Totale Ufficiale Aziendale */}
                <div style={{ ...cardStyle, borderLeft: "6px solid #2563eb", background: "#f8fafc" }}>
                  <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, color: "#2563eb" }}>
                    🏛️ 1. TOTALE UFFICIALE AZIENDALE (FATTURATO)
                  </span>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1e293b", margin: "0.3rem 0 0.8rem" }}>
                    {formatEuro(ripartizioneGlobale.totOffSp / 100)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.85rem" }}>
                    <div>
                      <small style={{ color: "#64748b", display: "block" }}>Incassato Ufficiale</small>
                      <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneGlobale.totOffInc / 100)}</strong>
                    </div>
                    <div>
                      <small style={{ color: "#64748b", display: "block" }}>Residuo Ufficiale</small>
                      <strong style={{ color: ripartizioneGlobale.totOffRes > 0 ? "#2563eb" : "#16a34a" }}>
                        {formatEuro(ripartizioneGlobale.totOffRes / 100)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. Totale Extra Aziendale */}
                <div style={{ ...cardStyle, borderLeft: "6px solid #d97706", background: "#fffbeb" }}>
                  <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, color: "#d97706" }}>
                    🌿 2. TOTALE &quot;EXTRA&quot; AZIENDALE (CONTANTI)
                  </span>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#78350f", margin: "0.3rem 0 0.8rem" }}>
                    {formatEuro(ripartizioneGlobale.totExtSp / 100)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.85rem" }}>
                    <div>
                      <small style={{ color: "#92400e", display: "block" }}>Incassato Contanti</small>
                      <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneGlobale.totExtInc / 100)}</strong>
                    </div>
                    <div>
                      <small style={{ color: "#92400e", display: "block" }}>Residuo Extra</small>
                      <strong style={{ color: ripartizioneGlobale.totExtRes > 0 ? "#d97706" : "#16a34a" }}>
                        {formatEuro(ripartizioneGlobale.totExtRes / 100)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 3. Totale Generale Aziendale */}
                <div style={{ ...cardStyle, borderLeft: "6px solid #e58c2c", background: "#faf8f5" }}>
                  <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, color: "#c2410c" }}>
                    💎 3. VOLUME D&apos;AFFARI CONSOLIDATO
                  </span>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1e1b18", margin: "0.3rem 0 0.8rem" }}>
                    {formatEuro(ripartizioneGlobale.totGlobaleSp / 100)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.85rem" }}>
                    <div>
                      <small style={{ color: "#78716c", display: "block" }}>Incassi Totali Reali</small>
                      <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneGlobale.totGlobaleInc / 100)}</strong>
                    </div>
                    <div>
                      <small style={{ color: "#78716c", display: "block" }}>Residuo Globale</small>
                      <strong style={{ color: ripartizioneGlobale.totGlobaleRes > 0 ? "#dc2626" : "#16a34a" }}>
                        {formatEuro(ripartizioneGlobale.totGlobaleRes / 100)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD DETTAGLIATE GLOBALI (SANTO STEFANO vs IOVINO) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
                {/* SANTO STEFANO S.R.L. */}
                <div style={{ ...cardStyle, borderLeft: "6px solid #ea580c" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div>
                      <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, color: "#c2410c" }}>
                        QUOTA STRUTTURA & VILLA (IVA 22%)
                      </span>
                      <h3 style={{ margin: "0.2rem 0", color: "#1e1b18", fontSize: "1.3rem" }}>
                        Santo Stefano S.r.l. <small style={{ fontSize: "0.8rem", color: "#8a847c" }}>(Roberto Sola)</small>
                      </h3>
                    </div>
                    <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#c2410c" }}>
                      {formatEuro(ripartizioneGlobale.ssTotSp / 100)}
                    </span>
                  </div>

                  {/* Sezione A: Quota Ufficiale Santo Stefano */}
                  <div style={{ padding: "0.85rem", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#2563eb", marginBottom: "0.4rem" }}>
                      <span>🏛️ Quota Ufficiale Complessiva</span>
                      <span>{formatEuro(ripartizioneGlobale.ssOffSp / 100)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
                      <div>
                        <span style={{ color: "#64748b" }}>Incassato Bonifico/POS:</span>{" "}
                        <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneGlobale.ssOffInc / 100)}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b" }}>Residuo Ufficiale:</span>{" "}
                        <strong style={{ color: ripartizioneGlobale.ssOffRes > 0 ? "#2563eb" : "#16a34a" }}>
                          {formatEuro(ripartizioneGlobale.ssOffRes / 100)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Sezione B: Quota Extra Santo Stefano */}
                  <div style={{ padding: "0.85rem", borderRadius: "10px", background: "#fffbeb", border: "1px solid #fde68a", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#92400e", marginBottom: "0.4rem" }}>
                      <span>🌿 Quota &quot;Extra&quot; Complessiva (Contanti)</span>
                      <span>{formatEuro(ripartizioneGlobale.ssExtSp / 100)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
                      <div>
                        <span style={{ color: "#92400e" }}>Incassato Contanti:</span>{" "}
                        <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneGlobale.ssExtInc / 100)}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#92400e" }}>Residuo Extra:</span>{" "}
                        <strong style={{ color: ripartizioneGlobale.ssExtRes > 0 ? "#d97706" : "#16a34a" }}>
                          {formatEuro(ripartizioneGlobale.ssExtRes / 100)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Riepilogo Totale Santo Stefano */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #f0eee9", paddingTop: "0.6rem", fontSize: "0.9rem" }}>
                    <span style={{ fontWeight: 800, color: "#1e1b18" }}>Totale Spettanza Santo Stefano:</span>
                    <strong style={{ fontSize: "1.1rem", color: "#1e1b18" }}>{formatEuro(ripartizioneGlobale.ssTotSp / 100)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#6a6764", marginTop: "0.2rem" }}>
                    <span>Incassato Reale Totale: <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneGlobale.ssTotInc / 100)}</strong></span>
                    <span>Residuo Totale: <strong style={{ color: ripartizioneGlobale.ssTotRes > 0 ? "#c2410c" : "#16a34a" }}>{formatEuro(ripartizioneGlobale.ssTotRes / 100)}</strong></span>
                  </div>
                </div>

                {/* IOVINO BANQUETING S.R.L. */}
                <div style={{ ...cardStyle, borderLeft: "6px solid #16a34a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div>
                      <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, color: "#15803d" }}>
                        QUOTA SOMMINISTRAZIONE (IVA 10%)
                      </span>
                      <h3 style={{ margin: "0.2rem 0", color: "#1e1b18", fontSize: "1.3rem" }}>
                        Iovino Banqueting S.r.l. <small style={{ fontSize: "0.8rem", color: "#8a847c" }}>(Rosaria Iovino)</small>
                      </h3>
                    </div>
                    <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#15803d" }}>
                      {formatEuro(ripartizioneGlobale.iovTotSp / 100)}
                    </span>
                  </div>

                  {/* Sezione A: Quota Ufficiale Iovino */}
                  <div style={{ padding: "0.85rem", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#2563eb", marginBottom: "0.4rem" }}>
                      <span>🏛️ Quota Ufficiale Complessiva</span>
                      <span>{formatEuro(ripartizioneGlobale.iovOffSp / 100)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
                      <div>
                        <span style={{ color: "#64748b" }}>Incassato Bonifico/POS:</span>{" "}
                        <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneGlobale.iovOffInc / 100)}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b" }}>Residuo Ufficiale:</span>{" "}
                        <strong style={{ color: ripartizioneGlobale.iovOffRes > 0 ? "#2563eb" : "#16a34a" }}>
                          {formatEuro(ripartizioneGlobale.iovOffRes / 100)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Sezione B: Quota Extra Iovino */}
                  <div style={{ padding: "0.85rem", borderRadius: "10px", background: "#fffbeb", border: "1px solid #fde68a", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#92400e", marginBottom: "0.4rem" }}>
                      <span>🌿 Quota &quot;Extra&quot; Complessiva (Contanti)</span>
                      <span>{formatEuro(ripartizioneGlobale.iovExtSp / 100)}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
                      <div>
                        <span style={{ color: "#92400e" }}>Incassato Contanti:</span>{" "}
                        <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneGlobale.iovExtInc / 100)}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#92400e" }}>Residuo Extra:</span>{" "}
                        <strong style={{ color: ripartizioneGlobale.iovExtRes > 0 ? "#d97706" : "#16a34a" }}>
                          {formatEuro(ripartizioneGlobale.iovExtRes / 100)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Riepilogo Totale Iovino */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #f0eee9", paddingTop: "0.6rem", fontSize: "0.9rem" }}>
                    <span style={{ fontWeight: 800, color: "#1e1b18" }}>Totale Spettanza Iovino Banqueting:</span>
                    <strong style={{ fontSize: "1.1rem", color: "#1e1b18" }}>{formatEuro(ripartizioneGlobale.iovTotSp / 100)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#6a6764", marginTop: "0.2rem" }}>
                    <span>Incassato Reale Totale: <strong style={{ color: "#16a34a" }}>{formatEuro(ripartizioneGlobale.iovTotInc / 100)}</strong></span>
                    <span>Residuo Totale: <strong style={{ color: ripartizioneGlobale.iovTotRes > 0 ? "#15803d" : "#16a34a" }}>{formatEuro(ripartizioneGlobale.iovTotRes / 100)}</strong></span>
                  </div>
                </div>
              </div>

              {/* CONGUAGLIO GLOBALE A 3 LIVELLI */}
              <div style={{ ...cardStyle, background: "linear-gradient(135deg, #1e1b18 0%, #3a342e 100%)", color: "#fff", border: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.12)", paddingBottom: "0.8rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 800 }}>
                      CONGUAGLIO INTER-SOCIETARIO AZIENDALE CONSOLIDATO
                    </span>
                    <h3 style={{ margin: "0.3rem 0 0 0", fontSize: "1.35rem", color: "#fff" }}>
                      Compensazione Economica Complessiva tra Roberto Sola e Rosaria Iovino
                    </h3>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.72rem", color: "#a59d93", textTransform: "uppercase", display: "block" }}>Saldo Netto Globale</span>
                    <span style={{ fontSize: "1.9rem", fontWeight: 800, color: "#e58c2c" }}>
                      {ripartizioneGlobale.conguaglioNetto ? formatEuro(ripartizioneGlobale.conguaglioNetto.importo_cents / 100) : formatEuro(0)}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
                  {/* Conguaglio Ufficiale Globale */}
                  <div style={{ padding: "0.9rem", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", color: "#93c5fd", fontWeight: 800, display: "block" }}>
                      🏛️ 1. Bonifici Ufficiali tra Società
                    </span>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: "0.3rem 0" }}>
                      {ripartizioneGlobale.conguaglioUfficiale
                        ? `${COMPANY_LABELS[ripartizioneGlobale.conguaglioUfficiale.da]} → ${COMPANY_LABELS[ripartizioneGlobale.conguaglioUfficiale.a]}`
                        : "Incassi ufficiali allineati alle spettanze"}
                    </div>
                    <small style={{ color: "#94a3b8" }}>
                      {ripartizioneGlobale.conguaglioUfficiale
                        ? `Bonifico inter-societario dovuto: ${formatEuro(ripartizioneGlobale.conguaglioUfficiale.importo_cents / 100)}`
                        : "Nessun bonifico dovuto tra i conti societari"}
                    </small>
                  </div>

                  {/* Conguaglio Extra Globale */}
                  <div style={{ padding: "0.9rem", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", color: "#fcd34d", fontWeight: 800, display: "block" }}>
                      🌿 2. Cassa Extra (Contanti)
                    </span>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: "0.3rem 0" }}>
                      {ripartizioneGlobale.conguaglioExtra
                        ? `${COMPANY_LABELS[ripartizioneGlobale.conguaglioExtra.da]} → ${COMPANY_LABELS[ripartizioneGlobale.conguaglioExtra.a]}`
                        : "Cassa contanti pareggiata"}
                    </div>
                    <small style={{ color: "#94a3b8" }}>
                      {ripartizioneGlobale.conguaglioExtra
                        ? `Compensazione contanti dovuta: ${formatEuro(ripartizioneGlobale.conguaglioExtra.importo_cents / 100)}`
                        : "Incassi contanti allineati"}
                    </small>
                  </div>

                  {/* Saldo Netto Globale */}
                  <div style={{ padding: "0.9rem", borderRadius: "10px", background: "rgba(229,140,44,0.12)", border: "1px solid rgba(229,140,44,0.3)" }}>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", color: "#f6c177", fontWeight: 800, display: "block" }}>
                      ⚖️ 3. Risoluzione Netta Complessiva
                    </span>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: "0.3rem 0" }}>
                      {ripartizioneGlobale.conguaglioNetto
                        ? `${COMPANY_LABELS[ripartizioneGlobale.conguaglioNetto.da]} versa a ${COMPANY_LABELS[ripartizioneGlobale.conguaglioNetto.a]}`
                        : "Conti aziendali perfettamente bilanciati"}
                    </div>
                    <small style={{ color: "#f6c177" }}>
                      {ripartizioneGlobale.conguaglioNetto
                        ? `Saldo netto complessivo: ${formatEuro(ripartizioneGlobale.conguaglioNetto.importo_cents / 100)}`
                        : "Nessun passaggio economico netto dovuto"}
                    </small>
                  </div>
                </div>
              </div>

              {/* Rendicontazione Globale a 4 Totalizzatori */}
              {(() => {
                const validPayments = payments.filter((p) => p.stato === "valido");
                const isOfficial = (p: CassaPaymentRow) => p.natura === "ufficiale" || (!p.natura && p.metodo !== "contanti");
                const isExtra = (p: CassaPaymentRow) => p.natura === "extra" || (!p.natura && p.metodo === "contanti");

                const ssOfficial = validPayments
                  .filter((p) => p.incassato_da === "santo_stefano" && isOfficial(p))
                  .reduce((sum, p) => sum + p.importo_cents, 0);
                const iovinoOfficial = validPayments
                  .filter((p) => p.incassato_da === "iovino" && isOfficial(p))
                  .reduce((sum, p) => sum + p.importo_cents, 0);
                const ssCash = validPayments
                  .filter((p) => p.incassato_da === "santo_stefano" && isExtra(p))
                  .reduce((sum, p) => sum + p.importo_cents, 0);
                const iovinoCash = validPayments
                  .filter((p) => p.incassato_da === "iovino" && isExtra(p))
                  .reduce((sum, p) => sum + p.importo_cents, 0);
                const total4 = ssOfficial + iovinoOfficial + ssCash + iovinoCash;

                return (
                  <div style={{ ...cardStyle, border: "1.5px solid #d4c8b8", background: "#fdfbf7" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800, color: "#8a847c" }}>
                          RENDICONTAZIONE GLOBALE AZIENDALE
                        </span>
                        <h3 style={{ margin: "0.2rem 0 0 0", color: "#1e1b18", fontSize: "1.2rem" }}>
                          🎯 Quadro Generale a 4 Totalizzatori
                        </h3>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.75rem", color: "#8a847c", textTransform: "uppercase", fontWeight: 700 }}>Totale Incassi Reali Validati</span>
                        <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1e1b18" }}>{formatEuro(total4 / 100)}</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                      <div style={{ padding: "0.9rem", borderRadius: "10px", background: "#fff", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 800, color: "#2563eb" }}>
                          1. Quota Ufficiale Santo Stefano S.r.l.
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0.5rem" }}>
                          Fatturato Ufficiale Location (Tracciato)
                        </div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b" }}>
                          {formatEuro(ssOfficial / 100)}
                        </div>
                      </div>

                      <div style={{ padding: "0.9rem", borderRadius: "10px", background: "#fff", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 800, color: "#7c3aed" }}>
                          2. Quota Ufficiale Iovino Banqueting S.r.l.
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0.5rem" }}>
                          Fatturato Ufficiale Banqueting (Tracciato)
                        </div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b" }}>
                          {formatEuro(iovinoOfficial / 100)}
                        </div>
                      </div>

                      <div style={{ padding: "0.9rem", borderRadius: "10px", background: "#fff", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 800, color: "#d97706" }}>
                          3. Quota Contanti Santo Stefano S.r.l.
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0.5rem" }}>
                          Extra Location / Fornitori contanti
                        </div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b" }}>
                          {formatEuro(ssCash / 100)}
                        </div>
                      </div>

                      <div style={{ padding: "0.9rem", borderRadius: "10px", background: "#fff", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 800, color: "#059669" }}>
                          4. Quota Contanti Iovino Banqueting S.r.l.
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0.5rem" }}>
                          Extra Banqueting / Fornitori contanti
                        </div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b" }}>
                          {formatEuro(iovinoCash / 100)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  style={{ padding: "0.7rem 1.3rem", background: "#ffffff", color: "#1e1b18", border: "1px solid #e8e2d9", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}
                >
                  ⬇️ Esporta Report CSV
                </button>
              </div>
            </>
          )}
        </div>
      )}



      {/* MODALE SOLLECITO WHATSAPP RATA SCADUTA */}
      {sollecitoTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
            padding: "1.5rem",
          }}
          onClick={() => setSollecitoTarget(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "560px",
              padding: "2rem",
              boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
              border: "1px solid #e2e8f0",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSollecitoTarget(null)}
              style={{
                position: "absolute",
                top: "1.2rem",
                right: "1.2rem",
                background: "#f1f5f9",
                border: "none",
                fontSize: "1.2rem",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                cursor: "pointer",
                fontWeight: "bold",
                color: "#64748b",
              }}
            >
              ✕
            </button>

            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "#16a34a", fontWeight: 800, display: "block" }}>
              💬 SOLLECITO CORTESE WHATSAPP
            </span>
            <h2 style={{ margin: "0.2rem 0 1rem", color: "#1e1b18", fontSize: "1.4rem", fontFamily: "serif" }}>
              {sollecitoTarget.sposi}
            </h2>

            <div style={{ background: "#f8fafc", padding: "0.9rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1.2rem", fontSize: "0.88rem", color: "#475569" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <span><strong>Rata:</strong> {sollecitoTarget.rataLabel}</span>
                <span><strong>Scadenza:</strong> {formatDate(sollecitoTarget.scadenza)}</span>
              </div>
              <div>
                <strong>Residuo da incassare:</strong>{" "}
                <span style={{ color: "#b91c1c", fontWeight: 800, fontSize: "1.05rem" }}>{formatEuro(sollecitoTarget.residuo / 100)}</span>
              </div>
            </div>

            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#514d48", marginBottom: "0.4rem" }}>
              Messaggio WhatsApp (modificabile prima dell'invio):
            </label>
            <textarea
              rows={5}
              value={sollecitoTesto}
              onChange={(e) => setSollecitoTesto(e.target.value)}
              style={{
                width: "100%",
                padding: "0.85rem",
                borderRadius: "8px",
                border: "1.5px solid #cbd5e1",
                fontSize: "0.92rem",
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
                outline: "none",
                lineHeight: "1.4",
              }}
            />

            <div style={{ display: "flex", gap: "0.8rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => setSollecitoTarget(null)}
                style={{
                  flex: 1,
                  padding: "0.85rem",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  background: "#fff",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  const rawTel = String(sollecitoTarget.telefono || "").replace(/[^0-9]/g, "");
                  const tel = rawTel || "393341544314";
                  const finalTel = tel.startsWith("39") ? tel : "39" + tel;
                  const url = `https://wa.me/${finalTel}?text=${encodeURIComponent(sollecitoTesto)}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                  setSollecitoTarget(null);
                }}
                style={{
                  flex: 2,
                  padding: "0.85rem",
                  borderRadius: "10px",
                  border: "none",
                  background: "#25D366",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 14px rgba(37,211,102,0.4)",
                }}
              >
                💬 Apri WhatsApp e Invia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE REGISTRA INCASSO */}
      {incassoOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "2rem",
          }}
        >
          <div style={{ background: "#fff", width: "100%", maxWidth: "620px", borderRadius: "16px", boxShadow: "0 20px 50px rgba(0,0,0,0.3)", padding: "2.2rem", position: "relative" }}>
            <button
              type="button"
              onClick={() => setIncassoOpen(false)}
              style={{ position: "absolute", top: "1.2rem", right: "1.2rem", background: "#f0eee9", border: "none", fontSize: "1.1rem", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", fontWeight: "bold" }}
            >
              ✕
            </button>

            <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700 }}>
              REGISTRA INCASSO
            </span>
            <h2 style={{ margin: "0.3rem 0 1.4rem 0", color: "#514d48", fontSize: "1.5rem", fontFamily: "serif" }}>
              Nuovo movimento di cassa
            </h2>

            <form onSubmit={handleRecordIncasso} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                Evento
                <select
                  value={incQuoteId}
                  onChange={(e) => setIncQuoteId(e.target.value)}
                  required
                  style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", background: "#fff" }}
                >
                  <option value="">— Seleziona evento —</option>
                  {eventOptions.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.label}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                  Data incasso
                  <input type="date" value={incData} onChange={(e) => setIncData(e.target.value)} required style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem" }} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                  Importo (€)
                  <input type="text" inputMode="decimal" placeholder="es. 1500,00" value={incImporto} onChange={(e) => setIncImporto(e.target.value)} required style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem" }} />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                  Metodo
                  <select value={incMetodo} onChange={(e) => setIncMetodo(e.target.value as Metodo)} style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", background: "#fff" }}>
                    <option value="bonifico">Bonifico</option>
                    <option value="contanti">Contanti</option>
                    <option value="assegno">Assegno</option>
                    <option value="pos">POS</option>
                    <option value="altro">Altro</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                  Incassato da
                  <select value={incCompany} onChange={(e) => setIncCompany(e.target.value as Company)} style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", background: "#fff" }}>
                    <option value="santo_stefano">Santo Stefano S.r.l.</option>
                    <option value="iovino">Iovino Banqueting S.r.l.</option>
                  </select>
                </label>
              </div>

              {/* Natura Incasso: Ufficiale vs Cassa Extra Fornitori */}
              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600, background: "#f8fafc", padding: "0.8rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span>Natura Incasso *</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#64748b" }}>(Fiscale vs Extra)</span>
                </span>
                <select
                  value={incNatura}
                  onChange={(e) => setIncNatura(e.target.value as "ufficiale" | "extra")}
                  style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.95rem", background: "#fff", fontWeight: 700, color: incNatura === "extra" ? "#92400e" : "#1e40af" }}
                >
                  <option value="ufficiale">Contratto Ufficiale (A scomputo preventivo / Ricevuta Fiscale)</option>
                  <option value="extra">Servizi Extra / Cassa Fornitori (Fuori contratto)</option>
                </select>
                <small style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>
                  {incNatura === "ufficiale"
                    ? "✓ Scomputa direttamente dal saldo preventivo e dalle rate concordate (anche per pagamenti in contanti)."
                    : "✓ Incasso accreditato nella cassa extra per fornitori e servizi non a contratto."}
                </small>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                  Riferimento (CRO / n. assegno)
                  <input type="text" value={incRif} onChange={(e) => setIncRif(e.target.value)} style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem" }} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                  Registrato da
                  <input type="text" value={incRegistrato} onChange={(e) => setIncRegistrato(e.target.value)} style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem" }} />
                </label>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                Note
                <textarea value={incNote} onChange={(e) => setIncNote(e.target.value)} rows={2} style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", resize: "vertical" }} />
              </label>

              {incError && (
                <div style={{ color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "0.6rem 0.8rem", fontSize: "0.85rem", fontWeight: 600 }}>
                  {incError}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.4rem" }}>
                <button type="button" onClick={() => setIncassoOpen(false)} disabled={incPending} style={{ flex: 1, padding: "0.85rem", borderRadius: "10px", border: "1px solid #ddd", background: "#fff", color: "#555", fontWeight: 600, cursor: incPending ? "not-allowed" : "pointer" }}>
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={incPending}
                  style={{ flex: 2, padding: "0.85rem", borderRadius: "10px", border: "none", background: incPending ? "#d6c3ac" : "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)", color: "#fff", fontWeight: 700, cursor: incPending ? "not-allowed" : "pointer" }}
                >
                  {incPending ? "Registrazione..." : "✓ Registra Incasso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
