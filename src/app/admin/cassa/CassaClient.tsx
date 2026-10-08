"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatEuro } from "@/lib/contractPayments";
import SimulatoreClient from "@/app/admin/simulatore/SimulatoreClient";
import { recordPaymentAction } from "./paymentActions";

/* ------------------------------------------------------------------ */
/* Tipi condivisi con il Server Component                              */
/* ------------------------------------------------------------------ */

export type CassaTab = "incassi" | "scadenze" | "societa" | "simulatore";

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
  tipo_evento: string;
  data_evento: string | null;
  turno: string;
  formula: string;
  ospiti: number;
  stage: string;
  stageLabel: string;
  badgeColor: string;
  concordato_cents: number;
  incassato_cents: number;
  residuo_cents: number;
  spettanza: { santo_stefano: number; iovino: number };
  incassato_per: { santo_stefano: number; iovino: number };
  residuo_per: { santo_stefano: number; iovino: number };
  conguaglio: { da: string; a: string; importo_cents: number } | null;
  rate: CassaRateRow[];
  items: CassaItemRow[];
}

export interface CassaPaymentRow {
  id: string;
  quote_id: string;
  data_incasso: string;
  importo_cents: number;
  metodo: string;
  incassato_da: string;
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
  { id: "simulatore", label: "Simulazione Fiscale", icon: "🧮" },
];

const COMPANY_LABELS: Record<string, string> = {
  santo_stefano: "Tenuta Santo Stefano S.r.l. (Roberto)",
  iovino: "Iovino Banqueting S.r.l. (Rosaria)",
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

  const filteredEventi = useMemo(() => {
    const needle = societaQuery.trim().toLowerCase();
    if (!needle) return eventi;
    return eventi.filter((ev) => {
      const haystack = [ev.sposi, ev.codice, ev.data_evento || "", formatDate(ev.data_evento)].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [eventi, societaQuery]);

  const selectedEvent = useMemo(
    () => eventi.find((ev) => ev.id === selectedEventId) || filteredEventi[0] || eventi[0] || null,
    [eventi, filteredEventi, selectedEventId]
  );

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

  const selectEvento = (id: string) => {
    setSelectedEventId(id);
    setSocietaView("evento");
  };

  /* -------------------------- Registro Incassi -------------------------- */
  const [incassoOpen, setIncassoOpen] = useState(false);
  const [incQuoteId, setIncQuoteId] = useState(eventOptions[0]?.id || "");
  const [incData, setIncData] = useState(todayIso());
  const [incImporto, setIncImporto] = useState("");
  const [incMetodo, setIncMetodo] = useState<Metodo>("bonifico");
  const [incCompany, setIncCompany] = useState<Company>("santo_stefano");
  const [incRegistrato, setIncRegistrato] = useState("Roberto Sola");
  const [incRif, setIncRif] = useState("");
  const [incNote, setIncNote] = useState("");
  const [incError, setIncError] = useState("");
  const [incPending, startIncasso] = useTransition();

  const openIncasso = () => {
    setIncError("");
    setIncData(todayIso());
    setIncImporto("");
    setIncMetodo("bonifico");
    setIncCompany("santo_stefano");
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
          Registro incassi reali, rate contrattuali, ripartizione Santo Stefano / Iovino e simulatore fiscale in un unico cruscotto.
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
              </small>
            </div>
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

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e8e2d9", color: "#78716c", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "0.75rem 0.6rem" }}>Data</th>
                <th style={{ padding: "0.75rem 0.6rem" }}>Evento</th>
                <th style={{ padding: "0.75rem 0.6rem", textAlign: "right" }}>Importo</th>
                <th style={{ padding: "0.75rem 0.6rem" }}>Metodo</th>
                <th style={{ padding: "0.75rem 0.6rem" }}>Incassato da</th>
                <th style={{ padding: "0.75rem 0.6rem" }}>Registrato da</th>
                <th style={{ padding: "0.75rem 0.6rem" }}>Note</th>
                <th style={{ padding: "0.75rem 0.6rem" }}>Stato</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "2.5rem", textAlign: "center", color: "#94a3b8" }}>
                    Nessun incasso registrato. Usa “+ Registra Incasso” per iniziare.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
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
                      <td style={{ padding: "0.8rem 0.6rem" }}>{METHOD_LABELS[p.metodo] || p.metodo}</td>
                      <td style={{ padding: "0.8rem 0.6rem", fontSize: "0.82rem" }}>{COMPANY_LABELS[p.incassato_da] || p.incassato_da}</td>
                      <td style={{ padding: "0.8rem 0.6rem", fontSize: "0.82rem" }}>{p.registrato_da}</td>
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
                      onClick={() => router.push(`/admin/eventi/${evento.id}?tab=cassa`)}
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
                      <td style={{ padding: "0.85rem 0.6rem" }}>
                        {rata.in_ritardo ? (
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.5rem", borderRadius: "999px", background: "#fee2e2", color: "#b91c1c" }}>
                            Scaduta
                          </span>
                        ) : rata.stato === "parziale" ? (
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "999px", background: "#fff7ed", color: "#c2410c" }}>
                            Parziale
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "999px", background: "#eff6ff", color: "#1d4ed8" }}>
                            Da pagare
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
              <>
                <input
                  type="search"
                  value={societaQuery}
                  onChange={(e) => setSocietaQuery(e.target.value)}
                  placeholder="🔍 Cerca evento per Nome Sposi, Codice TDA o Data (es. Marco Esposito, 03/07/2027, TDA-0BA26A24)..."
                  aria-label="Cerca evento"
                  style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "10px", border: "1px solid #ddd", fontSize: "0.95rem", boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", padding: "0.8rem 0 0.2rem 0" }}>
                  {filteredEventi.length === 0 ? (
                    <span style={{ color: "#94a3b8", fontSize: "0.85rem", padding: "0.4rem 0" }}>
                      Nessun evento trovato per “{societaQuery}”.
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
                            border: active ? "1px solid #e58c2c" : "1px solid #e0ddd9",
                            background: active ? "#fff7ed" : "#fff",
                            color: active ? "#c2410c" : "#514d48",
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            padding: "0.5rem 0.9rem",
                            cursor: "pointer",
                          }}
                        >
                          {ev.tipo_evento === "wedding" ? "💍" : "🎉"} {ev.sposi} · {formatDate(ev.data_evento)}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {societaView === "evento" && selectedEvent && (
            <>
              {/* Testata evento */}
              <div style={{ ...cardStyle, borderLeft: "6px solid #e58c2c" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 800, color: "#c2410c" }}>
                      {selectedEvent.tipo_evento === "wedding" ? "MATRIMONIO" : "EVENTO"}
                    </span>
                    <h2 style={{ margin: "0.3rem 0", color: "#1e1b18", fontSize: "1.5rem" }}>
                      {selectedEvent.tipo_evento === "wedding" ? "💍" : "🎉"} {selectedEvent.sposi} — {selectedEvent.codice}
                    </h2>
                    <div style={{ color: "#6a6764", fontSize: "0.9rem" }}>
                      📅 {formatDate(selectedEvent.data_evento)} · {selectedEvent.turno.toLowerCase().includes("cena") ? "🌙" : "☀️"}{" "}
                      {turnoLabelIt(selectedEvent.turno)} · 🏛️ {selectedEvent.formula} · 👥 {selectedEvent.ospiti} ospiti
                    </div>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "0.5rem",
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
                  </div>
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

              {/* Card di riepilogo spettanza evento */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
                {(["santo_stefano", "iovino"] as const).map((company) => {
                  const isSs = company === "santo_stefano";
                  const spettanza = selectedEvent.spettanza[company];
                  const incassato = selectedEvent.incassato_per[company];
                  const residuo = selectedEvent.residuo_per[company];
                  return (
                    <div key={company} style={{ ...cardStyle, borderLeft: `6px solid ${isSs ? "#ea580c" : "#16a34a"}` }}>
                      <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, color: isSs ? "#c2410c" : "#15803d" }}>
                        {isSs ? "QUOTA STRUTTURA & VILLA (IVA 22%)" : "QUOTA SOMMINISTRAZIONE (IVA 10%)"}
                      </span>
                      <h3 style={{ margin: "0.35rem 0 1rem 0", color: "#1e1b18", fontSize: "1.25rem" }}>{COMPANY_LABELS[company]}</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.8rem" }}>
                        <div>
                          <small style={{ display: "block", color: "#8a847c" }}>Spettanza Evento</small>
                          <strong style={{ fontSize: "1.05rem", color: "#1e1b18" }}>{formatEuro(spettanza / 100)}</strong>
                        </div>
                        <div>
                          <small style={{ display: "block", color: "#8a847c" }}>Incassato Reale</small>
                          <strong style={{ fontSize: "1.05rem", color: isSs ? "#ea580c" : "#16a34a" }}>{formatEuro(incassato / 100)}</strong>
                        </div>
                        <div>
                          <small style={{ display: "block", color: "#8a847c" }}>Residuo</small>
                          <strong style={{ fontSize: "1.05rem", color: residuo > 0 ? "#0284c7" : "#16a34a" }}>{formatEuro(residuo / 100)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Conguaglio evento */}
              <div style={{ ...cardStyle, background: "linear-gradient(135deg, #1e1b18 0%, #3a342e 100%)", color: "#fff", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 800 }}>
                    CONGUAGLIO INTER-SOCIETARIO QUESTO EVENTO
                  </span>
                  <h3 style={{ margin: "0.4rem 0 0 0", fontSize: "1.35rem", color: "#fff" }}>
                    {selectedEvent.conguaglio
                      ? `${COMPANY_LABELS[selectedEvent.conguaglio.da]} → ${COMPANY_LABELS[selectedEvent.conguaglio.a]}`
                      : "Incassi allineati: nessun conguaglio dovuto su questo evento"}
                  </h3>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "2rem", fontWeight: 800, color: "#e58c2c" }}>
                    {selectedEvent.conguaglio ? formatEuro(selectedEvent.conguaglio.importo_cents / 100) : formatEuro(0)}
                  </span>
                  <small style={{ display: "block", color: "#a59d93" }}>
                    {selectedEvent.conguaglio
                      ? `Deve essere versato a ${COMPANY_LABELS[selectedEvent.conguaglio.a]}`
                      : "Importo di conguaglio"}
                  </small>
                </div>
              </div>

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
                          <td style={{ padding: "0.7rem 0.6rem" }}>{METHOD_LABELS[p.metodo] || p.metodo}</td>
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

          {societaView === "globale" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
                {(["santo_stefano", "iovino"] as const).map((company) => {
                  const data = summary[company];
                  const isSs = company === "santo_stefano";
                  return (
                    <div key={company} style={{ ...cardStyle, borderLeft: `6px solid ${isSs ? "#ea580c" : "#16a34a"}` }}>
                      <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, color: isSs ? "#c2410c" : "#15803d" }}>
                        {isSs ? "QUOTA STRUTTURA & VILLA (IVA 22%)" : "QUOTA SOMMINISTRAZIONE (IVA 10%)"}
                      </span>
                      <h3 style={{ margin: "0.35rem 0 1rem 0", color: "#1e1b18", fontSize: "1.25rem" }}>{COMPANY_LABELS[company]}</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.8rem" }}>
                        <div>
                          <small style={{ display: "block", color: "#8a847c" }}>Spettanza Totale</small>
                          <strong style={{ fontSize: "1.05rem", color: "#1e1b18" }}>{formatEuro(data.spettanza_cents / 100)}</strong>
                        </div>
                        <div>
                          <small style={{ display: "block", color: "#8a847c" }}>Incassato Reale</small>
                          <strong style={{ fontSize: "1.05rem", color: isSs ? "#ea580c" : "#16a34a" }}>{formatEuro(data.incassato_cents / 100)}</strong>
                        </div>
                        <div>
                          <small style={{ display: "block", color: "#8a847c" }}>Residuo</small>
                          <strong style={{ fontSize: "1.05rem", color: data.residuo_cents > 0 ? "#0284c7" : "#16a34a" }}>
                            {formatEuro(data.residuo_cents / 100)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Conguaglio globale */}
              <div style={{ ...cardStyle, background: "linear-gradient(135deg, #1e1b18 0%, #3a342e 100%)", color: "#fff", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 800 }}>
                    CONGUAGLIO INTER-SOCIETARIO COMPLESSIVO
                  </span>
                  <h3 style={{ margin: "0.4rem 0 0 0", fontSize: "1.4rem", color: "#fff" }}>
                    {summary.conguaglio
                      ? `${COMPANY_LABELS[summary.conguaglio.da]} → ${COMPANY_LABELS[summary.conguaglio.a]}`
                      : "Nessun conguaglio dovuto: incassi allineati alle spettanze"}
                  </h3>
                  {summary.eccedenza_cents > 0 && (
                    <small style={{ color: "#f6c177" }}>Eccedenza incassata rispetto al concordato: {formatEuro(summary.eccedenza_cents / 100)}</small>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "2rem", fontWeight: 800, color: "#e58c2c" }}>
                    {summary.conguaglio ? formatEuro(summary.conguaglio.importo_cents / 100) : formatEuro(0)}
                  </span>
                  <small style={{ display: "block", color: "#a59d93" }}>Importo di conguaglio tra Roberto e Rosaria</small>
                </div>
              </div>

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

      {/* ----------------------------- SIMULATORE ----------------------------- */}
      {tab === "simulatore" && (
        <div>
          <div className="premium-card" style={{ padding: "1.3rem 1.6rem", marginBottom: "1.5rem", borderLeft: "4px solid #e58c2c" }}>
            <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 800 }}>
              SIMULAZIONE FISCALE & PREVENTIVATORE
            </span>
            <h2 style={{ margin: "0.3rem 0 0 0", color: "#1e1b18", fontSize: "1.4rem" }}>
              🧮 Simulazione Fiscale & Preventivatore
            </h2>
            <p style={{ margin: "0.3rem 0 0 0", color: "#777", fontSize: "0.9rem" }}>
              Lo stesso motore ufficiale di preventivazione e split societario, integrato direttamente nel cruscotto di Cassa.
            </p>
          </div>
          <SimulatoreClient />
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
                    <option value="santo_stefano">Tenuta Santo Stefano S.r.l.</option>
                    <option value="iovino">Iovino Banqueting S.r.l.</option>
                  </select>
                </label>
              </div>

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
