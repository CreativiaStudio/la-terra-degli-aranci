"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatEuro } from "@/lib/contractPayments";
import { splitGross, euroToCents } from "@/lib/eventLedger";
import type {
  Payment,
  PaymentMethod,
  Company,
  EventLedger,
  QuoteChange,
} from "@/lib/eventLedger";
import type { Quote, ServiceTicket } from "@/lib/localDb";
import { getTurnoTime, checkVenueConflict } from "@/lib/eventStage";
import type { EventStageInfo } from "@/lib/eventStage";
import {
  WEDDING_DIARY_SECTIONS,
  computeDiaryProgress,
  isDiaryFieldFilled,
} from "@/app/cliente/components/weddingDiaryFields";
import { recordPaymentAction, cancelPaymentAction } from "@/app/admin/cassa/paymentActions";
import { rescheduleEventAction, updateServiceTicketStatusAction } from "./actions";

/* ------------------------------------------------------------------ */
/* Props & costanti                                                    */
/* ------------------------------------------------------------------ */

interface EventRegiaClientProps {
  quote: Quote;
  payments: Payment[];
  changes: QuoteChange[];
  tickets: ServiceTicket[];
  diary: Record<string, any> | null;
  ledger: EventLedger;
  stage: EventStageInfo;
  today: string;
  conflictQuotes: Array<Partial<Quote>>;
  contractPdfUrl: string | null;
  isSigned: boolean;
  hasPendingOption: boolean;
  initialTab: TabKey;
}

type TabKey = "panoramica" | "servizi" | "ticket" | "cassa" | "diario" | "ospiti";

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "panoramica", label: "Panoramica", icon: "📋" },
  { key: "servizi", label: "Servizi", icon: "🍽️" },
  { key: "ticket", label: "Richieste Sposi", icon: "🎫" },
  { key: "cassa", label: "Cassa", icon: "💶" },
  { key: "diario", label: "Diario", icon: "📖" },
  { key: "ospiti", label: "Ospiti", icon: "👥" },
];

const TICKET_STATUS_META: Record<
  ServiceTicket["status"],
  { label: string; bg: string; color: string }
> = {
  nuovo: { label: "Nuovo", bg: "#e0e7ff", color: "#3730a3" },
  in_valutazione: { label: "In valutazione", bg: "#fef9c3", color: "#854d0e" },
  approvato: { label: "Approvato", bg: "#dcfce7", color: "#166534" },
  rifiutato: { label: "Rifiutato", bg: "#fee2e2", color: "#b91c1c" },
};

const METODO_LABELS: Record<string, string> = {
  bonifico: "Bonifico",
  contanti: "Contanti",
  assegno: "Assegno",
  pos: "Carta / POS",
  altro: "Altro",
};

const COMPANY_LABELS: Record<string, string> = {
  santo_stefano: "Santo Stefano S.r.l.",
  iovino: "Iovino Banqueting S.r.l.",
};

/* ------------------------------------------------------------------ */
/* Helper puri                                                         */
/* ------------------------------------------------------------------ */

function formatDate(iso?: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "—";
}

function itemGrossCents(item: any): number {
  const direct = Number(item?.totale);
  if (Number.isFinite(direct) && direct !== 0) return euroToCents(direct);
  const unit = Number(item?.prezzo_unitario ?? item?.prezzoUnitario ?? 0);
  const qty = Number(item?.quantita ?? 1);
  return euroToCents((Number.isFinite(unit) ? unit : 0) * (Number.isFinite(qty) ? qty : 1));
}

function formulaLabel(quote: Quote): string {
  const raw = String(
    (quote as any).formula_opzione ?? (quote as any).tipo_esclusiva ?? ""
  ).toLowerCase();
  if (raw === "esclusiva") return "Esclusiva";
  if (raw === "sala_tufo" || raw.includes("tufo")) return "Sala Tufo";
  if (raw === "sala_bianca" || raw.includes("bianca")) return "Sala Bianca";
  if (raw === "semi_esclusiva") return "Semi-Esclusiva";
  return raw ? raw : "—";
}

function digitsOnly(value: unknown): string {
  return String(value ?? "").replace(/[^\d+]/g, "");
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function EventRegiaClient({
  quote,
  payments,
  changes,
  tickets,
  diary,
  ledger,
  stage,
  today,
  conflictQuotes,
  contractPdfUrl,
  isSigned,
  hasPendingOption,
  initialTab,
}: EventRegiaClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [saving, setSaving] = useState(false);

  const selectTab = (key: TabKey) => {
    setTab(key);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", key);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const pendingTickets = tickets.filter(
    (t) => t.status === "nuovo" || t.status === "in_valutazione"
  );
  const pendingTicketsCount = pendingTickets.length;

  const client = (quote as any).clients ?? {};
  const items: any[] = Array.isArray(quote.items) ? (quote.items as any[]) : [];
  const turno = getTurnoTime(String((quote as any).turno ?? ""));

  const canoneCents = useMemo(() => {
    if (quote.canone_cents != null) return Number(quote.canone_cents);
    if (quote.canone != null) return euroToCents(quote.canone);
    if (items.length === 0) {
      return euroToCents(quote.prezzo ?? quote.totale ?? quote.totale_calcolato ?? 0);
    }
    return 0;
  }, [quote, items.length]);

  const bozzaCents = euroToCents(quote.totale_calcolato ?? 0);

  const validPayments = payments.filter((p) => p && p.stato !== "annullato");
  const displayPayments = [...payments].sort((a, b) =>
    String(b.data_incasso).localeCompare(String(a.data_incasso))
  );

  const guests = {
    adulti: Number((quote as any).ospiti_adulti ?? (quote as any).numero_ospiti ?? 0) || 0,
    bambini: Number((quote as any).ospiti_bambini ?? 0) || 0,
    celiaci: Number((quote as any).ospiti_celiaci ?? 0) || 0,
    veg: Number((quote as any).ospiti_vegani ?? (quote as any).ospiti_vegetariani ?? 0) || 0,
    intolleranze: Number((quote as any).ospiti_intolleranze ?? 0) || 0,
    staff: Number((quote as any).ospiti_staff ?? 0) || 0,
  };

  /* ----------------------------- Incasso ---------------------------- */
  const [payOpen, setPayOpen] = useState(false);
  const [payError, setPayError] = useState("");
  const [payForm, setPayForm] = useState<{
    importo: string;
    data: string;
    metodo: PaymentMethod;
    incassato_da: Company;
    riferimento: string;
    note: string;
  }>({
    importo: "",
    data: today,
    metodo: "bonifico",
    incassato_da: "santo_stefano",
    riferimento: "",
    note: "",
  });

  const cashOverLimit =
    payForm.metodo === "contanti" && Number(payForm.importo.replace(",", ".")) > 4999;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payForm.importo.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      setPayError("Inserisci un importo valido.");
      return;
    }
    if (payForm.metodo === "contanti" && amount > 4999) {
      setPayError("Limite di legge: gli incassi in contanti non possono superare € 4.999.");
      return;
    }
    setSaving(true);
    setPayError("");
    const res = await recordPaymentAction({
      quote_id: String(quote.id),
      data_incasso: payForm.data,
      importo_cents: Math.round(amount * 100),
      metodo: payForm.metodo,
      incassato_da: payForm.incassato_da,
      riferimento: payForm.riferimento || undefined,
      note: payForm.note || undefined,
    });
    setSaving(false);
    if (!res.success) {
      setPayError(res.error || "Errore durante la registrazione.");
      return;
    }
    setPayOpen(false);
    setPayForm({ importo: "", data: today, metodo: "bonifico", incassato_da: "santo_stefano", riferimento: "", note: "" });
    router.refresh();
  };

  /* --------------------------- Annulla pagamento -------------------- */
  const [cancelTarget, setCancelTarget] = useState<Payment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  const handleCancelPayment = async () => {
    if (!cancelTarget) return;
    if (cancelReason.trim().length < 3) {
      setCancelError("Motivo obbligatorio (minimo 3 caratteri).");
      return;
    }
    setSaving(true);
    setCancelError("");
    const res = await cancelPaymentAction(cancelTarget.id, cancelReason.trim());
    setSaving(false);
    if (!res.success) {
      setCancelError(res.error || "Errore durante l'annullamento.");
      return;
    }
    setCancelTarget(null);
    setCancelReason("");
    router.refresh();
  };

  /* ----------------------------- Sposta data ------------------------ */
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveError, setMoveError] = useState("");
  const [moveForm, setMoveForm] = useState<{
    data: string;
    turno: "pranzo" | "cena";
    formula: "esclusiva" | "sala_bianca" | "sala_tufo";
  }>({
    data: String((quote as any).data_evento ?? "").slice(0, 10) || today,
    turno: String((quote as any).turno ?? "") === "cena" ? "cena" : "pranzo",
    formula: "esclusiva",
  });

  const moveConflict = useMemo(
    () =>
      checkVenueConflict(moveForm.data, moveForm.turno, moveForm.formula, conflictQuotes, String(quote.id)),
    [moveForm, conflictQuotes, quote.id]
  );

  const handleReschedule = async () => {
    setSaving(true);
    setMoveError("");
    const res = await rescheduleEventAction({
      quoteId: String(quote.id),
      data_evento: moveForm.data,
      turno: moveForm.turno,
      formula: moveForm.formula,
    });
    setSaving(false);
    if (!res.success) {
      setMoveError(res.error || "Errore durante lo spostamento.");
      return;
    }
    setMoveOpen(false);
    router.refresh();
  };

  /* --------------------------- Stampa cucina ------------------------ */
  const printKitchenSheet = () => {
    const rows = [
      ["Adulti", guests.adulti],
      ["Bambini", guests.bambini],
      ["Celiaci", guests.celiaci],
      ["Vegani / Vegetariani", guests.veg],
      ["Intolleranze specifiche", guests.intolleranze],
      ["Staff / Fornitori", guests.staff],
    ]
      .map(
        ([label, value]) =>
          `<tr><td style="padding:6px 12px;border-bottom:1px solid #ddd">${label}</td><td style="padding:6px 12px;border-bottom:1px solid #ddd;text-align:right;font-weight:700">${value}</td></tr>`
      )
      .join("");

    const note = String((quote as any).note_ospiti ?? (quote as any).note_visita_segreteria ?? "");
    const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Scheda Cucina Iovino — ${client.nome ?? ""} ${
      client.cognome ?? ""
    }</title></head>
      <body style="font-family:Arial,sans-serif;padding:32px;color:#222">
        <h1 style="margin:0 0 4px 0">Scheda Cucina — Iovino Banqueting</h1>
        <p style="margin:0 0 20px 0;color:#666">La Terra degli Aranci — ${client.nome ?? ""} ${
          client.cognome ?? ""
        } • ${formatDate((quote as any).data_evento)} • Turno ${turno.label} ${turno.time}</p>
        <table style="border-collapse:collapse;width:100%;max-width:420px">${rows}</table>
        ${note ? `<h3 style="margin-top:24px">Note alimentari / dettagli</h3><p style="white-space:pre-wrap">${note}</p>` : ""}
        <p style="margin-top:32px;color:#999;font-size:12px">Documento generato senza prezzi — solo informazioni operative di cucina.</p>
      </body></html>`;

    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  const prossima = ledger.prossima_scadenza;

  return (
    <div style={{ maxWidth: "1250px", margin: "0 auto", fontFamily: "'Outfit', sans-serif", color: "#2c2a27" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/admin/eventi" style={{ color: "#6a6764", textDecoration: "none", fontWeight: 600 }}>
          ← Tutti gli Eventi
        </Link>
      </div>

      {/* -------------------------- Testata fissa ---------------------- */}
      <header
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #fffbf5 100%)",
          borderRadius: "16px",
          border: "1px solid #efe7db",
          boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
          padding: "1.8rem 2rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.75rem", color: "#e58c2c", fontWeight: 800 }}>
              Scheda Regia 360° • TDA-{String(quote.id ?? "").slice(0, 8).toUpperCase()}
            </span>
            <h1 style={{ margin: "0.3rem 0 0.4rem", fontFamily: "serif", fontSize: "2rem", color: "#1e1b18" }}>
              {client.nome ?? "Cliente"} {client.cognome ?? ""}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center", color: "#6a6764", fontSize: "0.95rem" }}>
              <span>📅 {formatDate((quote as any).data_evento)}</span>
              <span>•</span>
              <span>{turno.isPranzo ? "☀️" : "🌙"} {turno.label} {turno.time}</span>
              <span>•</span>
              <span>🏛️ {formulaLabel(quote)}</span>
              <span>•</span>
              <span>👥 {guests.adulti} ospiti stimati</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
            <span
              style={{
                background: stage.badgeColor,
                color: "#fff",
                padding: "0.5rem 1.1rem",
                borderRadius: "999px",
                fontWeight: 700,
                fontSize: "0.85rem",
                boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
              }}
              title={stage.descrizione}
            >
              {stage.label}
            </span>
            {isSigned && (
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#16a34a" }}>✍️ Contratto firmato</span>
            )}
            {hasPendingOption && (
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#d97706" }}>⏳ Opzione / Allegato in attesa</span>
            )}
          </div>
        </div>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginTop: "1.6rem" }}>
          <Kpi label="Concordato" value={formatEuro(ledger.concordato_cents / 100)} accent="#1e1b18" />
          <Kpi label="Incassato Reale" value={formatEuro(ledger.incassato_cents / 100)} accent="#16a34a" />
          <Kpi label="Residuo" value={formatEuro(ledger.residuo_cents / 100)} accent="#e58c2c" />
          <Kpi
            label="Prossima Scadenza"
            value={prossima ? `${prossima.label} al ${formatDate(prossima.scadenza)}` : "Nessuna scadenza"}
            accent="#2563eb"
            small
          />
        </div>

        {/* Azioni rapide */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "1.4rem" }}>
          <ActionButton primary onClick={() => { setPayError(""); setPayOpen(true); }}>
            + Registra Incasso
          </ActionButton>
          {digitsOnly(client.telefono) ? (
            <a
              href={`https://wa.me/${digitsOnly(client.telefono).replace(/^\+/, "")}?text=${encodeURIComponent(
                `Ciao ${client.nome ?? ""}, ti scriviamo da La Terra degli Aranci riguardo al vostro evento.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={actionLinkStyle}
            >
              💬 WhatsApp Sposi
            </a>
          ) : (
            <span style={{ ...actionLinkStyle, opacity: 0.5, cursor: "not-allowed" }}>💬 WhatsApp Sposi</span>
          )}
          {contractPdfUrl ? (
            <a href={contractPdfUrl} target="_blank" rel="noopener noreferrer" style={actionLinkStyle}>
              📄 Contratto PDF
            </a>
          ) : (
            <span style={{ ...actionLinkStyle, opacity: 0.5, cursor: "not-allowed" }} title="Nessun PDF firmato disponibile">
              📄 Contratto PDF
            </span>
          )}
          <ActionButton onClick={() => { setMoveError(""); setMoveOpen(true); }}>📅 Sposta Data</ActionButton>
        </div>

        {ledger.avvisi.length > 0 && (
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {ledger.avvisi.map((a) => (
              <span key={a} style={{ background: "#fff7ed", border: "1px solid #f5c98a", color: "#9a5b12", padding: "0.25rem 0.7rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700 }}>
                ⚠️ {a}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* ------------------------------- Tabs --------------------------- */}
      <nav style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.4rem" }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          const label =
            t.key === "ticket" && pendingTicketsCount > 0
              ? `${t.label} (${pendingTicketsCount})`
              : t.label;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => selectTab(t.key)}
              style={{
                border: active ? "1px solid #e58c2c" : "1px solid #e6e1d8",
                background: active ? "#e58c2c" : "#fff",
                color: active ? "#fff" : "#514d48",
                padding: "0.6rem 1.1rem",
                borderRadius: "999px",
                cursor: "pointer",
                fontWeight: active ? 700 : 500,
                fontSize: "0.92rem",
                fontFamily: "inherit",
              }}
            >
              {t.icon} {label}
            </button>
          );
        })}
      </nav>

      <main style={{ paddingBottom: "3rem" }}>
        {tab === "panoramica" && <PanoramicaTab quote={quote} client={client} changes={changes} payments={validPayments} />}
        {tab === "servizi" && (
          <ServiziTab
            quote={quote}
            items={items}
            canoneCents={canoneCents}
            ledger={ledger}
            bozzaCents={bozzaCents}
            pendingTicketsCount={pendingTicketsCount}
            onGoToTickets={() => selectTab("ticket")}
          />
        )}
        {tab === "ticket" && (
          <TicketTab tickets={tickets} quoteId={String(quote.id ?? "")} onChanged={() => router.refresh()} />
        )}
        {tab === "cassa" && (
          <CassaTab
            ledger={ledger}
            payments={displayPayments}
            onRegister={() => { setPayError(""); setPayOpen(true); }}
            onCancel={(p) => { setCancelError(""); setCancelReason(""); setCancelTarget(p); }}
          />
        )}
        {tab === "diario" && <DiarioTab diary={diary} />}
        {tab === "ospiti" && <OspitiTab guests={guests} quote={quote} onPrint={printKitchenSheet} />}
      </main>

      {/* ------------------------------ Modali -------------------------- */}
      {payOpen && (
        <Modal title="+ Registra Incasso" onClose={() => setPayOpen(false)}>
          <form onSubmit={handleRecordPayment} style={{ display: "grid", gap: "0.9rem" }}>
            <Field label="Importo (€)">
              <input
                type="text"
                inputMode="decimal"
                value={payForm.importo}
                onChange={(e) => setPayForm({ ...payForm, importo: e.target.value })}
                placeholder="es. 1500,00"
                required
                style={inputStyle}
              />
            </Field>
            <Field label="Data incasso">
              <input type="date" value={payForm.data} max={today} onChange={(e) => setPayForm({ ...payForm, data: e.target.value })} required style={inputStyle} />
            </Field>
            <Field label="Metodo">
              <select value={payForm.metodo} onChange={(e) => setPayForm({ ...payForm, metodo: e.target.value as PaymentMethod })} style={inputStyle}>
                <option value="bonifico">Bonifico</option>
                <option value="contanti">Contanti</option>
                <option value="assegno">Assegno</option>
                <option value="pos">Carta / POS</option>
                <option value="altro">Altro</option>
              </select>
            </Field>
            <Field label="Incassato da">
              <select value={payForm.incassato_da} onChange={(e) => setPayForm({ ...payForm, incassato_da: e.target.value as Company })} style={inputStyle}>
                <option value="santo_stefano">Santo Stefano S.r.l.</option>
                <option value="iovino">Iovino Banqueting S.r.l.</option>
              </select>
            </Field>
            <Field label="Riferimento / CRO (opzionale)">
              <input type="text" value={payForm.riferimento} onChange={(e) => setPayForm({ ...payForm, riferimento: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Note (opzionale)">
              <textarea value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            </Field>

            {cashOverLimit && (
              <div style={{ background: "#fff7ed", border: "1px solid #f5c98a", color: "#9a5b12", padding: "0.7rem 0.9rem", borderRadius: "8px", fontSize: "0.85rem" }}>
                ⚠️ Attenzione, limite di legge: gli incassi in contanti non possono superare <strong>€ 4.999</strong>.
              </div>
            )}
            {payError && <div style={{ color: "#d93838", fontSize: "0.85rem" }}>{payError}</div>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.4rem" }}>
              <ActionButton type="button" onClick={() => setPayOpen(false)}>Annulla</ActionButton>
              <ActionButton primary type="submit" disabled={saving}>{saving ? "Salvataggio…" : "Registra Incasso"}</ActionButton>
            </div>
          </form>
        </Modal>
      )}

      {cancelTarget && (
        <Modal title="Annulla Incasso" onClose={() => setCancelTarget(null)}>
          <p style={{ color: "#6a6764", fontSize: "0.92rem" }}>
            Stai annullando un incasso di <strong>{formatEuro(cancelTarget.importo_cents / 100)}</strong> del{" "}
            {formatDate(cancelTarget.data_incasso)}. L&apos;operazione è tracciata (soft delete).
          </p>
          <Field label="Motivo dell'annullamento (obbligatorio)">
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </Field>
          {cancelError && <div style={{ color: "#d93838", fontSize: "0.85rem", marginTop: "0.4rem" }}>{cancelError}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1rem" }}>
            <ActionButton type="button" onClick={() => setCancelTarget(null)}>Indietro</ActionButton>
            <ActionButton primary type="button" disabled={saving} onClick={handleCancelPayment}>{saving ? "Annullamento…" : "Conferma Annullamento"}</ActionButton>
          </div>
        </Modal>
      )}

      {moveOpen && (
        <Modal title="📅 Sposta Data Evento" onClose={() => setMoveOpen(false)}>
          <div style={{ display: "grid", gap: "0.9rem" }}>
            <Field label="Nuova data">
              <input type="date" value={moveForm.data} onChange={(e) => setMoveForm({ ...moveForm, data: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Turno">
              <select value={moveForm.turno} onChange={(e) => setMoveForm({ ...moveForm, turno: e.target.value as "pranzo" | "cena" })} style={inputStyle}>
                <option value="pranzo">☀️ Pranzo (12:30)</option>
                <option value="cena">🌙 Cena (19:30)</option>
              </select>
            </Field>
            <Field label="Formula">
              <select
                value={moveForm.formula}
                onChange={(e) => setMoveForm({ ...moveForm, formula: e.target.value as "esclusiva" | "sala_bianca" | "sala_tufo" })}
                style={inputStyle}
              >
                <option value="esclusiva">Esclusiva (intero turno)</option>
                <option value="sala_bianca">Semi — Sala Bianca</option>
                <option value="sala_tufo">Semi — Sala Tufo</option>
              </select>
            </Field>

            {moveConflict.hasConflict ? (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.8rem 1rem", borderRadius: "8px", fontSize: "0.88rem" }}>
                🚫 {moveConflict.reason}
              </div>
            ) : (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", padding: "0.8rem 1rem", borderRadius: "8px", fontSize: "0.88rem" }}>
                ✅ Turno disponibile: nessun conflitto rilevato.
              </div>
            )}
            {moveError && <div style={{ color: "#d93838", fontSize: "0.85rem" }}>{moveError}</div>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
              <ActionButton type="button" onClick={() => setMoveOpen(false)}>Annulla</ActionButton>
              <ActionButton primary type="button" disabled={saving || moveConflict.hasConflict} onClick={handleReschedule}>
                {saving ? "Spostamento…" : "Conferma Spostamento"}
              </ActionButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* UI atoms                                                            */
/* ------------------------------------------------------------------ */

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.8rem",
  border: "1px solid #e0ddd9",
  borderRadius: "8px",
  fontFamily: "inherit",
  fontSize: "0.95rem",
  background: "#faf9f7",
  color: "#2c2a27",
};

const actionLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.6rem 1rem",
  borderRadius: "8px",
  border: "1px solid #e6e1d8",
  background: "#fff",
  color: "#514d48",
  fontWeight: 600,
  fontSize: "0.9rem",
  textDecoration: "none",
  cursor: "pointer",
};

function ActionButton({
  children,
  onClick,
  primary,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.6rem 1.1rem",
        borderRadius: "8px",
        border: primary ? "1px solid #e58c2c" : "1px solid #e6e1d8",
        background: primary ? "linear-gradient(90deg, #e58c2c 0%, #d47b1e 100%)" : "#fff",
        color: primary ? "#fff" : "#514d48",
        fontWeight: 700,
        fontSize: "0.9rem",
        fontFamily: "inherit",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Kpi({ label, value, accent, small }: { label: string; value: string; accent: string; small?: boolean }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #efe7db", borderRadius: "12px", padding: "1rem 1.1rem" }}>
      <span style={{ display: "block", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "#9a948c", fontWeight: 800 }}>{label}</span>
      <span style={{ display: "block", marginTop: "0.35rem", color: accent, fontWeight: 800, fontSize: small ? "1.05rem" : "1.4rem", lineHeight: 1.2 }}>{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", fontWeight: 600, color: "#514d48" }}>
      {label}
      {children}
    </label>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(20,18,16,0.55)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: "16px", padding: "1.8rem", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#1e1b18" }}>{title}</h3>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", fontSize: "1.1rem", cursor: "pointer", color: "#9a948c" }} aria-label="Chiudi">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #efe7db", borderRadius: "14px", padding: "1.5rem", marginBottom: "1.2rem" }}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "1.05rem", color: "#1e1b18" }}>
        {icon ? `${icon} ` : ""}
        {title}
      </h3>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "0.45rem 0", borderBottom: "1px solid #f4f0ea" }}>
      <span style={{ color: "#8a847c", fontSize: "0.88rem" }}>{label}</span>
      <span style={{ color: "#2c2a27", fontWeight: 600, fontSize: "0.9rem", textAlign: "right" }}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab: Panoramica                                                     */
/* ------------------------------------------------------------------ */

function PanoramicaTab({ quote, client, changes, payments }: { quote: Quote; client: any; changes: QuoteChange[]; payments: Payment[] }) {
  const spazi = Array.isArray((quote as any).spazi_riservati) ? (quote as any).spazi_riservati : [];
  const noteVisita = String((quote as any).note_visita_segreteria ?? "");

  const timeline = [
    ...changes.map((c: any) => ({
      at: c.confirmed_at || c.created_at,
      text: c.status === "confermato" ? "Allegato B confermato" : "Allegato B in attesa di firma",
      tone: c.status === "confermato" ? "#16a34a" : "#d97706",
    })),
    ...payments.map((p) => ({
      at: p.data_incasso,
      text: `Incasso ${formatEuro(p.importo_cents / 100)} — ${METODO_LABELS[p.metodo] ?? p.metodo}`,
      tone: "#2563eb",
    })),
  ].sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.2rem" }}>
      <Panel title="Anagrafica Clienti" icon="👤">
        <InfoRow label="Nome e cognome" value={`${client.nome ?? "—"} ${client.cognome ?? ""}`} />
        <InfoRow label="Email" value={client.email || "—"} />
        <InfoRow label="Telefono" value={client.telefono || "—"} />
        <InfoRow label="Codice fiscale / P.IVA" value={(quote as any).codice_fiscale || client.codice_fiscale || (quote as any).partita_iva || "—"} />
        <InfoRow label="Partner / Sposa" value={[client.sposera_nome, client.sposera_cognome].filter(Boolean).join(" ") || "—"} />
      </Panel>

      <Panel title="Spazi Villa Riservati" icon="🏛️">
        {spazi.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {spazi.map((s: string) => (
              <span key={s} style={{ background: "#f6f2ec", border: "1px solid #e6ded1", borderRadius: "999px", padding: "0.35rem 0.8rem", fontSize: "0.85rem", fontWeight: 600 }}>
                🌿 {s}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ color: "#9a948c", margin: 0 }}>Nessuno spazio specifico riservato (formula esclusiva o da definire).</p>
        )}
        {noteVisita && (
          <div style={{ marginTop: "1rem" }}>
            <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "1px", color: "#9a948c", fontWeight: 800 }}>Note visita tablet segreteria</span>
            <p style={{ margin: "0.3rem 0 0", whiteSpace: "pre-wrap", color: "#514d48", fontSize: "0.9rem" }}>{noteVisita}</p>
          </div>
        )}
      </Panel>

      <Panel title="Registro Attività" icon="🕓">
        {timeline.length > 0 ? (
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.7rem" }}>
            {timeline.slice(0, 12).map((entry, i) => (
              <li key={i} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: entry.tone, marginTop: "0.45rem", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{entry.text}</div>
                  <div style={{ fontSize: "0.78rem", color: "#9a948c" }}>{formatDate(entry.at)}</div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p style={{ color: "#9a948c", margin: 0 }}>Nessuna attività registrata.</p>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab: Servizi                                                        */
/* ------------------------------------------------------------------ */

function ServiziTab({
  quote,
  items,
  canoneCents,
  ledger,
  bozzaCents,
  pendingTicketsCount,
  onGoToTickets,
}: {
  quote: Quote;
  items: any[];
  canoneCents: number;
  ledger: EventLedger;
  bozzaCents: number;
  pendingTicketsCount: number;
  onGoToTickets: () => void;
}) {
  const scontoCents =
    (quote as any).sconto_cents != null
      ? Number((quote as any).sconto_cents)
      : euroToCents((quote as any).sconto_fisso);
  const quoteId = String(quote.id ?? "");

  return (
    <div>
      {pendingTicketsCount > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.8rem",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#eef2ff",
            border: "1px solid #c7d2fe",
            borderRadius: "12px",
            padding: "0.9rem 1.1rem",
            marginBottom: "1.2rem",
          }}
        >
          <span style={{ color: "#3730a3", fontWeight: 700, fontSize: "0.9rem" }}>
            🎫 {pendingTicketsCount} richiesta{pendingTicketsCount > 1 ? "e" : ""} di servizi in attesa
            da parte degli sposi
          </span>
          <ActionButton primary onClick={onGoToTickets}>
            Vai alle Richieste
          </ActionButton>
        </div>
      )}

      <Panel title="Panoramica Servizi Contrattualizzati" icon="🍽️">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#9a948c", textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.5px" }}>
              <th style={{ padding: "0.5rem" }}>Servizio</th>
              <th style={{ padding: "0.5rem", textAlign: "right" }}>Qtà</th>
              <th style={{ padding: "0.5rem", textAlign: "right" }}>Prezzo</th>
              <th style={{ padding: "0.5rem", textAlign: "right" }}>Totale</th>
              <th style={{ padding: "0.5rem" }}>Split</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: "#fdf8f1", fontWeight: 700 }}>
              <td style={{ padding: "0.6rem" }}>🏛️ Canone Fitto Villa — 100% Tenuta Santo Stefano S.r.l.</td>
              <td style={{ padding: "0.6rem", textAlign: "right" }}>1</td>
              <td style={{ padding: "0.6rem", textAlign: "right" }}>{formatEuro(canoneCents / 100)}</td>
              <td style={{ padding: "0.6rem", textAlign: "right" }}>{formatEuro(canoneCents / 100)}</td>
              <td style={{ padding: "0.6rem" }}><span style={{ ...splitPill, background: "#eef2ff", color: "#3730a3" }}>SS 100%</span></td>
            </tr>
            {items.map((item, i) => {
              const gross = itemGrossCents(item);
              const split = splitGross(gross, item.splitKey ?? item.split_key, item.splitLabel ?? item.split_label);
              const qty = Number(item.quantita ?? 1) || 0;
              const unit = Number(item.prezzo_unitario ?? item.prezzoUnitario ?? 0) || 0;
              return (
                <tr key={item.id ?? i} style={{ borderTop: "1px solid #f4f0ea" }}>
                  <td style={{ padding: "0.6rem" }}>{item.nome ?? item.descrizione ?? item.titoloBase ?? "Servizio"}</td>
                  <td style={{ padding: "0.6rem", textAlign: "right" }}>{qty}</td>
                  <td style={{ padding: "0.6rem", textAlign: "right" }}>{formatEuro(unit)}</td>
                  <td style={{ padding: "0.6rem", textAlign: "right", fontWeight: 600 }}>{formatEuro(gross / 100)}</td>
                  <td style={{ padding: "0.6rem" }}>
                    <span style={{ ...splitPill, background: "#f6f2ec", color: "#6a6764" }} title={`SS ${formatEuro(split.santo_stefano / 100)} • Iovino ${formatEuro(split.iovino / 100)}`}>
                      {item.splitLabel || item.splitKey || "40/60"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "0.9rem", color: "#9a948c", textAlign: "center" }}>Nessun servizio aggiuntivo in elenco.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.2rem" }}>
        <Panel title="Totali" icon="🧾">
          <InfoRow label="Totale firmato (Concordato)" value={formatEuro(ledger.concordato_cents / 100)} />
          <InfoRow label="In attesa di firma (Allegati B)" value={formatEuro(ledger.in_attesa_firma_delta_cents / 100)} />
          <InfoRow label="Bozza" value={formatEuro(bozzaCents / 100)} />
          <InfoRow label="Sconto applicato" value={formatEuro(scontoCents / 100)} />
        </Panel>

        <Panel title="Gestione Listino & Allegati" icon="🛠️">
          <p style={{ color: "#6a6764", fontSize: "0.88rem", marginTop: 0 }}>
            Modifica i servizi contrattualizzati, applica sconti o genera l&apos;Allegato B con firma digitale.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            <Link href={`/admin/preventivi/${quoteId}/modifica-servizi`} style={actionLinkStyle}>
              ➕ Aggiungi Servizio dal Listino
            </Link>
            <Link href={`/admin/preventivi/${quoteId}/modifica-servizi`} style={actionLinkStyle}>
              📄 Genera Allegato B
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}

const splitPill: React.CSSProperties = {
  display: "inline-block",
  padding: "0.2rem 0.6rem",
  borderRadius: "999px",
  fontSize: "0.75rem",
  fontWeight: 700,
};

/* ------------------------------------------------------------------ */
/* Tab: Ticket / Richieste Sposi                                       */
/* ------------------------------------------------------------------ */

function TicketTab({
  tickets,
  quoteId,
  onChanged,
}: {
  tickets: ServiceTicket[];
  quoteId: string;
  onChanged: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [rejectTarget, setRejectTarget] = useState<ServiceTicket | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const applyStatus = async (
    ticket: ServiceTicket,
    status: ServiceTicket["status"],
    noteDirezione?: string
  ) => {
    setBusyId(ticket.id);
    setError("");
    const res = await updateServiceTicketStatusAction({
      ticketId: ticket.id,
      status,
      noteDirezione,
      quoteId,
    });
    setBusyId(null);
    if (!res.success) {
      setError(res.error || "Errore durante l'aggiornamento della richiesta.");
      return;
    }
    setRejectTarget(null);
    setRejectNote("");
    onChanged();
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (rejectNote.trim().length < 3) {
      setError("Inserisci una motivazione (minimo 3 caratteri).");
      return;
    }
    await applyStatus(rejectTarget, "rifiutato", rejectNote.trim());
  };

  const busy = busyId !== null;

  return (
    <div>
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#b91c1c",
            padding: "0.7rem 1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
            fontSize: "0.88rem",
          }}
        >
          {error}
        </div>
      )}

      {tickets.length === 0 && (
        <Panel title="Richieste Sposi" icon="🎫">
          <p style={{ color: "#9a948c", margin: 0 }}>
            Nessuna richiesta di servizi inviata dalla coppia.
          </p>
        </Panel>
      )}

      {tickets.map((ticket) => {
        const meta =
          TICKET_STATUS_META[ticket.status] ??
          { label: ticket.status, bg: "#f3f4f6", color: "#4b5563" };
        const isPending = ticket.status === "nuovo" || ticket.status === "in_valutazione";
        const rowBusy = busyId === ticket.id;
        const servizi = Array.isArray(ticket.servizi) ? ticket.servizi : [];

        return (
          <Panel
            key={ticket.id}
            title={`Richiesta del ${formatDate(ticket.created_at)}`}
            icon="🎫"
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.8rem",
                marginBottom: "1rem",
              }}
            >
              <span
                style={{
                  background: meta.bg,
                  color: meta.color,
                  padding: "0.3rem 0.8rem",
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                }}
              >
                {meta.label}
              </span>
              <span style={{ color: "#9a948c", fontSize: "0.78rem" }}>ID {ticket.id}</span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      color: "#9a948c",
                      textTransform: "uppercase",
                      fontSize: "0.72rem",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <th style={{ padding: "0.5rem" }}>Servizio</th>
                    <th style={{ padding: "0.5rem", textAlign: "right" }}>Qtà</th>
                    <th style={{ padding: "0.5rem", textAlign: "right" }}>Prezzo</th>
                    <th style={{ padding: "0.5rem" }}>Azione</th>
                  </tr>
                </thead>
                <tbody>
                  {servizi.map((item, i) => {
                    const qty = Number(item.quantita ?? 1) || 0;
                    const unit = Number(item.prezzo_unitario ?? 0) || 0;
                    const azione =
                      item.azione === "rimozione"
                        ? { label: "Rimozione", bg: "#fee2e2", color: "#b91c1c" }
                        : item.azione === "variazione"
                          ? { label: "Variazione", bg: "#fef9c3", color: "#854d0e" }
                          : { label: "Aggiunta", bg: "#dcfce7", color: "#166534" };
                    return (
                      <tr key={item.id ?? i} style={{ borderTop: "1px solid #f4f0ea" }}>
                        <td style={{ padding: "0.6rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                            {item.immagine ? (
                              <img
                                src={item.immagine}
                                alt={item.nome || "Servizio richiesto"}
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                  border: "1px solid #efe7db",
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "8px",
                                  background: "#f6f2ec",
                                  border: "1px solid #efe7db",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "1.2rem",
                                  flexShrink: 0,
                                }}
                              >
                                🍽️
                              </span>
                            )}
                            <span style={{ fontWeight: 600 }}>
                              {item.nome || "Servizio"}
                              {item.categoria ? (
                                <span style={{ display: "block", color: "#9a948c", fontSize: "0.75rem", fontWeight: 500 }}>
                                  {item.categoria}
                                </span>
                              ) : null}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "0.6rem", textAlign: "right" }}>{qty}</td>
                        <td style={{ padding: "0.6rem", textAlign: "right", fontWeight: 600 }}>
                          {unit > 0 ? formatEuro(unit) : "—"}
                        </td>
                        <td style={{ padding: "0.6rem" }}>
                          <span
                            style={{
                              background: azione.bg,
                              color: azione.color,
                              padding: "0.2rem 0.6rem",
                              borderRadius: "999px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                            }}
                          >
                            {azione.label}
                          </span>
                          {item.note ? (
                            <span style={{ display: "block", color: "#8a847c", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                              {item.note}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                  {servizi.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: "0.9rem", color: "#9a948c", textAlign: "center" }}>
                        Nessun servizio specificato nella richiesta.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {ticket.note_sposi && (
              <div style={{ marginTop: "1rem" }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "#9a948c", fontWeight: 800 }}>
                  Note degli Sposi
                </span>
                <p style={{ margin: "0.3rem 0 0", whiteSpace: "pre-wrap", color: "#514d48", fontSize: "0.9rem" }}>
                  {ticket.note_sposi}
                </p>
              </div>
            )}

            {ticket.note_direzione && (
              <div
                style={{
                  marginTop: "0.9rem",
                  background: "#fdf8f1",
                  border: "1px solid #efe7db",
                  borderRadius: "8px",
                  padding: "0.7rem 0.9rem",
                }}
              >
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "#9a948c", fontWeight: 800 }}>
                  Nota della Direzione
                </span>
                <p style={{ margin: "0.3rem 0 0", whiteSpace: "pre-wrap", color: "#514d48", fontSize: "0.9rem" }}>
                  {ticket.note_direzione}
                </p>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "1.2rem" }}>
              <Link
                href={`/admin/preventivi/${quoteId}/modifica-servizi?ticketId=${ticket.id}`}
                style={{
                  ...actionLinkStyle,
                  border: "1px solid #e58c2c",
                  background: "linear-gradient(90deg, #e58c2c 0%, #d47b1e 100%)",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                ⚡ Approva &amp; Genera Allegato B
              </Link>
              {ticket.status === "nuovo" && (
                <ActionButton disabled={busy} onClick={() => applyStatus(ticket, "in_valutazione")}>
                  🕓 {rowBusy ? "Salvataggio…" : "Segna In Valutazione"}
                </ActionButton>
              )}
              {isPending && (
                <ActionButton
                  disabled={busy}
                  onClick={() => {
                    setError("");
                    setRejectNote("");
                    setRejectTarget(ticket);
                  }}
                >
                  🚫 Rifiuta / Non Accoglibile
                </ActionButton>
              )}
            </div>
          </Panel>
        );
      })}

      {rejectTarget && (
        <Modal title="Rifiuta Richiesta Servizi" onClose={() => setRejectTarget(null)}>
          <p style={{ color: "#6a6764", fontSize: "0.92rem" }}>
            La richiesta verrà marcata come <strong>rifiutata</strong> e la motivazione sarà visibile
            alla coppia.
          </p>
          <Field label="Motivazione del rifiuto (obbligatoria)">
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>
          {error && <div style={{ color: "#d93838", fontSize: "0.85rem", marginTop: "0.4rem" }}>{error}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1rem" }}>
            <ActionButton type="button" onClick={() => setRejectTarget(null)}>
              Annulla
            </ActionButton>
            <ActionButton primary type="button" disabled={busy} onClick={handleReject}>
              {busy ? "Salvataggio…" : "Conferma Rifiuto"}
            </ActionButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab: Cassa                                                          */
/* ------------------------------------------------------------------ */

function CassaTab({
  ledger,
  payments,
  onRegister,
  onCancel,
}: {
  ledger: EventLedger;
  payments: Payment[];
  onRegister: () => void;
  onCancel: (p: Payment) => void;
}) {
  const conguaglio = ledger.conguaglio;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1fr) minmax(360px, 1.3fr)", gap: "1.2rem" }}>
      {/* Piano contrattuale */}
      <Panel title="Piano Contrattuale (Rate Teoriche)" icon="📆">
        {ledger.rate.length > 0 ? (
          ledger.rate.map((r) => (
            <div key={r.key} style={{ border: "1px solid #f0ece5", borderRadius: "10px", padding: "0.9rem 1rem", marginBottom: "0.7rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "0.95rem" }}>{r.label}</strong>
                <StagePill stato={r.stato} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem", fontSize: "0.85rem", color: "#6a6764" }}>
                <span>Scadenza: {formatDate(r.scadenza)}</span>
                <span>
                  Coperto: {formatEuro(r.coperto_cents / 100)} / {formatEuro(r.importo_cents / 100)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: "#9a948c" }}>Nessuna rata definita (importo a zero).</p>
        )}
      </Panel>

      {/* Registro incassi */}
      <Panel title="Registro Incassi Reali" icon="💳">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.6rem" }}>
          <ActionButton primary onClick={onRegister}>+ Registra Incasso</ActionButton>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#9a948c", textTransform: "uppercase", fontSize: "0.7rem" }}>
                <th style={{ padding: "0.45rem" }}>Data</th>
                <th style={{ padding: "0.45rem", textAlign: "right" }}>Importo</th>
                <th style={{ padding: "0.45rem" }}>Metodo</th>
                <th style={{ padding: "0.45rem" }}>Ricevuto da</th>
                <th style={{ padding: "0.45rem" }}>Note</th>
                <th style={{ padding: "0.45rem" }} />
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const cancelled = p.stato === "annullato";
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid #f4f0ea", opacity: cancelled ? 0.55 : 1 }}>
                    <td style={{ padding: "0.5rem" }}>{formatDate(p.data_incasso)}</td>
                    <td style={{ padding: "0.5rem", textAlign: "right", fontWeight: 700, textDecoration: cancelled ? "line-through" : "none" }}>
                      {formatEuro(p.importo_cents / 100)}
                    </td>
                    <td style={{ padding: "0.5rem" }}>{METODO_LABELS[p.metodo] ?? p.metodo}</td>
                    <td style={{ padding: "0.5rem" }}>{COMPANY_LABELS[p.incassato_da] ?? p.incassato_da}</td>
                    <td style={{ padding: "0.5rem", color: "#8a847c" }}>{cancelled ? `Annullato: ${p.annullato_motivo ?? ""}` : p.note || p.riferimento || "—"}</td>
                    <td style={{ padding: "0.5rem", textAlign: "right" }}>
                      {!cancelled && (
                        <button
                          type="button"
                          onClick={() => onCancel(p)}
                          style={{ background: "transparent", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: "6px", padding: "0.25rem 0.6rem", cursor: "pointer", fontSize: "0.78rem" }}
                        >
                          Annulla
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "1rem", textAlign: "center", color: "#9a948c" }}>Nessun incasso registrato.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Ripartizione fiscale & societaria */}
        <div style={{ marginTop: "1.5rem", borderTop: "1px solid #f4f0ea", paddingTop: "1.2rem" }}>
          <h4 style={{ margin: "0 0 0.8rem", fontSize: "0.95rem" }}>Ripartizione Fiscale & Societaria</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <CompanyCard
              name="Tenuta Santo Stefano S.r.l."
              spettanza={ledger.spettanza.santo_stefano}
              incassato={ledger.incassato_per.santo_stefano}
              residuo={ledger.residuo_per.santo_stefano}
              color="#2563eb"
            />
            <CompanyCard
              name="Iovino Banqueting S.r.l."
              spettanza={ledger.spettanza.iovino}
              incassato={ledger.incassato_per.iovino}
              residuo={ledger.residuo_per.iovino}
              color="#7c3aed"
            />
          </div>
          <div
            style={{
              marginTop: "1rem",
              padding: "0.8rem 1rem",
              borderRadius: "10px",
              background: conguaglio ? "#fff7ed" : "#f0fdf4",
              border: `1px solid ${conguaglio ? "#f5c98a" : "#86efac"}`,
              color: conguaglio ? "#9a5b12" : "#166534",
              fontWeight: 700,
              fontSize: "0.88rem",
            }}
          >
            {conguaglio
              ? `🔁 Conguaglio Inter-Societario: ${COMPANY_LABELS[conguaglio.da]} deve trasferire ${formatEuro(
                  conguaglio.importo_cents / 100
                )} a ${COMPANY_LABELS[conguaglio.a]}.`
              : "✅ Nessun conguaglio inter-societario necessario."}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function StagePill({ stato }: { stato: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    saldata: { label: "Saldata", bg: "#dcfce7", color: "#166534" },
    parziale: { label: "Parziale", bg: "#fef9c3", color: "#854d0e" },
    da_pagare: { label: "Da pagare", bg: "#e0e7ff", color: "#3730a3" },
    scaduta: { label: "Scaduta", bg: "#fee2e2", color: "#b91c1c" },
  };
  const s = map[stato] ?? { label: stato, bg: "#f3f4f6", color: "#4b5563" };
  return <span style={{ background: s.bg, color: s.color, padding: "0.2rem 0.65rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 800 }}>{s.label}</span>;
}

function CompanyCard({
  name,
  spettanza,
  incassato,
  residuo,
  color,
}: {
  name: string;
  spettanza: number;
  incassato: number;
  residuo: number;
  color: string;
}) {
  return (
    <div style={{ border: `1px solid ${color}22`, borderLeft: `4px solid ${color}`, borderRadius: "10px", padding: "0.9rem 1rem", background: "#fff" }}>
      <strong style={{ fontSize: "0.85rem", color }}>{name}</strong>
      <div style={{ marginTop: "0.5rem" }}>
        <InfoRow label="Spettanza" value={formatEuro(spettanza / 100)} />
        <InfoRow label="Incassato fisicamente" value={formatEuro(incassato / 100)} />
        <InfoRow label="Residuo" value={formatEuro(residuo / 100)} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab: Diario                                                         */
/* ------------------------------------------------------------------ */

function DiarioTab({ diary }: { diary: Record<string, any> | null }) {
  const answers: Record<string, any> = (diary?.answers && typeof diary.answers === "object" ? diary.answers : {}) as Record<string, any>;
  const progress = computeDiaryProgress(answers);

  return (
    <div>
      <Panel title="Wedding Diary — Preferenze Sposi (sola lettura)" icon="📖">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ flex: 1, height: 10, background: "#f0ece5", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg,#e58c2c,#d47b1e)" }} />
          </div>
          <strong style={{ color: "#e58c2c" }}>{progress}% compilato</strong>
        </div>
        {!diary && <p style={{ color: "#9a948c", marginBottom: 0, marginTop: "1rem" }}>Nessun Wedding Diary compilato dagli sposi.</p>}
      </Panel>

      {WEDDING_DIARY_SECTIONS.map((section) => {
        const filled = section.fields.filter((f) => isDiaryFieldFilled(answers[f.name])).length;
        const pct = section.fields.length ? Math.round((filled / section.fields.length) * 100) : 0;
        return (
          <Panel key={section.id} title={section.titleIt} icon={section.icon}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.6rem" }}>
              <span style={{ background: pct === 100 ? "#dcfce7" : pct > 0 ? "#fef9c3" : "#f3f4f6", color: pct === 100 ? "#166534" : pct > 0 ? "#854d0e" : "#6b7280", padding: "0.2rem 0.7rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800 }}>
                {pct}%
              </span>
            </div>
            {section.fields.map((field) => {
              const value = answers[field.name];
              const rendered = Array.isArray(value) ? value.join(", ") : value;
              return <InfoRow key={field.name} label={field.labelIt} value={rendered ? String(rendered) : "—"} />;
            })}
          </Panel>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab: Ospiti                                                         */
/* ------------------------------------------------------------------ */

function OspitiTab({
  guests,
  quote,
  onPrint,
}: {
  guests: { adulti: number; bambini: number; celiaci: number; veg: number; intolleranze: number; staff: number };
  quote: Quote;
  onPrint: () => void;
}) {
  const counters = [
    { label: "Adulti", value: guests.adulti, icon: "🧑" },
    { label: "Bambini", value: guests.bambini, icon: "🧒" },
    { label: "Celiaci", value: guests.celiaci, icon: "🌾" },
    { label: "Vegani / Vegetariani", value: guests.veg, icon: "🥗" },
    { label: "Intolleranze specifiche", value: guests.intolleranze, icon: "⚠️" },
    { label: "Staff / Fornitori", value: guests.staff, icon: "🧑‍🍳" },
  ];
  const note = String((quote as any).note_ospiti ?? (quote as any).note_visita_segreteria ?? "");

  return (
    <div>
      <Panel title="Contatori Cucina Iovino" icon="👥">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.9rem" }}>
          {counters.map((c) => (
            <div key={c.label} style={{ background: "#fdfbf7", border: "1px solid #efe7db", borderRadius: "12px", padding: "1rem", textAlign: "center" }}>
              <span style={{ fontSize: "1.5rem" }}>{c.icon}</span>
              <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#1e1b18" }}>{c.value}</div>
              <div style={{ fontSize: "0.78rem", color: "#8a847c", fontWeight: 600 }}>{c.label}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Elenco Dettagliato & Note Alimentari" icon="📝">
        {note ? (
          <p style={{ whiteSpace: "pre-wrap", margin: 0, color: "#514d48", fontSize: "0.9rem" }}>{note}</p>
        ) : (
          <p style={{ color: "#9a948c", margin: 0 }}>Nessuna nota alimentare registrata. La lista definitiva va consegnata entro 10 giorni dall&apos;evento.</p>
        )}
        <div style={{ marginTop: "1.2rem" }}>
          <ActionButton primary onClick={onPrint}>🖨️ Stampa Scheda Cucina per Iovino</ActionButton>
        </div>
      </Panel>
    </div>
  );
}
