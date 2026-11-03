"use client";

import React, { useState } from "react";
import { sixMonthsBefore } from "@/lib/contractPayments";
import { SANTO_STEFANO_CORP, IOVINO_CORP } from "@/lib/fiscalCalculator";

interface PaymentScheduleProps {
  totalAmount?: number;
  importoCaparra?: number;
  importoSecondoAcconto?: number;
  isSigned?: boolean;
  lang?: "it" | "en";
  quoteId?: string;
  clientName?: string;
  eventDate?: string;
}

function formatDate(iso?: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "—";
}

function getDaysDiff(scadenzaIso?: string | null): number | null {
  if (!scadenzaIso) return null;
  const dScad = new Date(scadenzaIso).getTime();
  const dNow = new Date().setHours(0, 0, 0, 0);
  if (!Number.isFinite(dScad)) return null;
  return Math.ceil((dScad - dNow) / (1000 * 3600 * 24));
}

export default function PaymentSchedule({
  totalAmount = 15200,
  importoCaparra,
  importoSecondoAcconto,
  isSigned = true,
  lang = "it",
  quoteId,
  clientName,
  eventDate,
}: PaymentScheduleProps) {
  const isEng = lang === "en";
  const [copiedIban, setCopiedIban] = useState<string | null>(null);

  const handleCopyIban = (iban: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(iban.replace(/\s+/g, ""));
    }
    setCopiedIban(key);
    setTimeout(() => setCopiedIban(null), 2500);
  };

  const handleDownloadReceipt = (stepIndex: number, amount: number) => {
    const qId = quoteId || "demo-firmato";
    window.open(
      `/api/ricevuta?quoteId=${encodeURIComponent(qId)}&step=${stepIndex}&importo=${amount}`,
      "_blank"
    );
  };

  // Disciplinare TDA: 1° acconto fisso €1.500 (Santo Stefano S.r.l.), 2° acconto €3.000 a -6 mesi (Iovino Banqueting S.r.l.), Saldo finale a 10-15gg.
  const hasFrozenInstallments = importoCaparra != null && importoSecondoAcconto != null;
  const caparra = hasFrozenInstallments ? importoCaparra! : Math.min(1500, totalAmount);
  const secondoAcconto = hasFrozenInstallments
    ? importoSecondoAcconto!
    : Math.min(3000, Math.max(0, totalAmount - caparra));
  const saldo = Math.max(0, totalAmount - caparra - secondoAcconto);

  // Calcolo date reali
  const dataSecondoAcconto = eventDate ? sixMonthsBefore(eventDate) : null;
  const daysDiffSecondo = dataSecondoAcconto ? getDaysDiff(dataSecondoAcconto) : null;

  // Banner scadenza attiva per la coppia
  const isSecondoOverdue = daysDiffSecondo !== null && daysDiffSecondo < 0;
  const isSecondoUpcoming = daysDiffSecondo !== null && daysDiffSecondo >= 0 && daysDiffSecondo <= 30;

  const payments = [
    {
      step: isEng ? "1. First Deposit (€1,500 Fixed)" : "1. Caparra / 1° Acconto (€1.500 Fisso)",
      amount: caparra,
      dueDate: isEng ? "Upon Contract Signing" : "Alla firma del contratto",
      company: SANTO_STEFANO_CORP.ragioneSociale,
      iban: SANTO_STEFANO_CORP.iban,
      banca: SANTO_STEFANO_CORP.banca,
      ibanKey: "ss",
      status: isSigned ? "paid" : "pending",
      desc: isEng
        ? "Confirmation deposit to hold the date and secure villa exclusivity."
        : "Versamento di conferma per il blocco irrevocabile della data ed esclusiva villa.",
    },
    {
      step: isEng ? "2. Second Deposit (€3,000 Flat)" : "2. Secondo Acconto (€3.000 Forfettario)",
      amount: secondoAcconto,
      dueDate: dataSecondoAcconto
        ? `${isEng ? "Due on" : "Scadenza il"} ${formatDate(dataSecondoAcconto)} (-6 mesi)`
        : isEng
        ? "6 Months Before Event"
        : "6 Mesi prima dell'evento",
      company: IOVINO_CORP.ragioneSociale,
      iban: IOVINO_CORP.iban,
      banca: IOVINO_CORP.banca,
      ibanKey: "iovino",
      status: "upcoming",
      isOverdue: isSecondoOverdue,
      isUpcoming: isSecondoUpcoming,
      daysDiff: daysDiffSecondo,
      desc: isEng
        ? "Intermediate deposit for culinary logistics, menu planning, and banqueting coordination."
        : "Versamento intermedio per approvvigionamenti e pianificazione operativa cucina e banqueting.",
    },
    {
      step: isEng ? "3. Final Balance (Residual Split)" : "3. Saldo Finale (Quota Residua)",
      amount: saldo,
      dueDate: isEng ? "10-15 Days Before Event" : "10-15 Giorni prima dell'evento",
      company: "Ripartizione concordata (Santo Stefano S.r.l. / Iovino Banqueting S.r.l.)",
      iban: null,
      banca: null,
      ibanKey: null,
      status: "upcoming",
      desc: isEng
        ? "Final settlement based on confirmed guest count (min 70 adults) and agreed extra services."
        : "Saldo calcolato sul numero definitivo di ospiti (bloccato a -10gg) e servizi extra con ripartizione 60/40.",
    },
  ];

  return (
    <div style={{ background: "#ffffff", borderRadius: "18px", padding: "2.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #eee7de" }}>
      <div style={{ marginBottom: "2rem" }}>
        <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700 }}>
          {isEng ? "PAYMENT PLAN & DEPOSITS" : "PIANO ACCONTI & SCADENZE"}
        </span>
        <h2 style={{ fontSize: "1.8rem", color: "#1e1b18", marginTop: "0.3rem" }}>
          💶 {isEng ? "Deposits & Invoices Schedule" : "Scadenzario Acconti & Coordinate Bancarie"}
        </h2>
        <p style={{ color: "#6a6764", fontSize: "0.95rem", marginTop: "0.4rem" }}>
          {isEng
            ? "Clear overview of your payments, upcoming deadlines, official bank details, and downloadable receipts."
            : "Trasparenza completa sulle scadenze dei pagamenti, acconti versati, coordinate bancarie ufficiali e relative ricevute fiscali."}
        </p>
      </div>

      {/* Banner Avviso Scadenza Imminente / Superata */}
      {isSecondoOverdue && (
        <div
          style={{
            marginBottom: "1.8rem",
            padding: "1.2rem 1.4rem",
            borderRadius: "14px",
            background: "#fef2f2",
            border: "1.5px solid #fca5a5",
            color: "#991b1b",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            boxShadow: "0 4px 14px rgba(220, 38, 38, 0.08)",
          }}
        >
          <span style={{ fontSize: "1.8rem" }}>🚨</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
              {isEng ? "Second Deposit Overdue" : "Secondo Acconto: Scadenza Superata"}
            </div>
            <div style={{ fontSize: "0.9rem", marginTop: "0.2rem", color: "#b91c1c" }}>
              {isEng
                ? `The 2nd deposit of € 3,000 was due on ${formatDate(dataSecondoAcconto)}. Please proceed with the bank transfer to Iovino Banqueting S.r.l.`
                : `Il 2° Acconto di € 3.000 risultava in scadenza il ${formatDate(dataSecondoAcconto)} (${Math.abs(daysDiffSecondo!)} giorni fa). Vi invitiamo ad effettuare il bonifico sul conto dedicato Iovino Banqueting S.r.l. indicato di seguito.`}
            </div>
          </div>
        </div>
      )}

      {isSecondoUpcoming && !isSecondoOverdue && (
        <div
          style={{
            marginBottom: "1.8rem",
            padding: "1.2rem 1.4rem",
            borderRadius: "14px",
            background: "#fffbeb",
            border: "1.5px solid #fde68a",
            color: "#92400e",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            boxShadow: "0 4px 14px rgba(217, 119, 6, 0.08)",
          }}
        >
          <span style={{ fontSize: "1.8rem" }}>⏳</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
              {isEng
                ? `Second Deposit Due in ${daysDiffSecondo} Days`
                : `Promemoria: Secondo Acconto in Scadenza tra ${daysDiffSecondo} Giorni`}
            </div>
            <div style={{ fontSize: "0.9rem", marginTop: "0.2rem", color: "#b45309" }}>
              {isEng
                ? `The 2nd deposit of € 3,000 is due on ${formatDate(dataSecondoAcconto)}. You can find the official IBAN below for the bank transfer.`
                : `Il 2° Acconto di € 3.000 scade il ${formatDate(dataSecondoAcconto)} (a -6 mesi dall'evento). Di seguito trovate l'IBAN ufficiale per disporre il bonifico.`}
            </div>
          </div>
        </div>
      )}

      {/* Lista delle rate */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        {payments.map((p, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1.4rem",
              borderRadius: "14px",
              background: p.status === "paid" ? "#f0fdf4" : p.isOverdue ? "#fef2f2" : p.isUpcoming ? "#fffbeb" : "#faf8f5",
              border: `1px solid ${p.status === "paid" ? "#bbf7d0" : p.isOverdue ? "#fca5a5" : p.isUpcoming ? "#fde68a" : "#eee8df"}`,
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div style={{ flex: "1 1 360px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1e1b18" }}>{p.step}</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.25rem 0.7rem",
                    borderRadius: "20px",
                    background: p.status === "paid" ? "#166534" : p.isOverdue ? "#b91c1c" : p.isUpcoming ? "#c2410c" : "#475569",
                    color: "#ffffff",
                    textTransform: "uppercase",
                  }}
                >
                  {p.status === "paid"
                    ? isEng
                      ? "Paid & Verified"
                      : "Ricevuto & Verificato"
                    : p.isOverdue
                    ? isEng
                      ? `Overdue (${Math.abs(p.daysDiff!)}d)`
                      : `Scaduto (${Math.abs(p.daysDiff!)}gg fa)`
                    : p.isUpcoming
                    ? isEng
                      ? `Due in ${p.daysDiff}d`
                      : `In scadenza (${p.daysDiff}gg)`
                    : isEng
                    ? "Upcoming"
                    : "Da Inviare"}
                </span>
              </div>
              <p style={{ fontSize: "0.88rem", color: "#666", margin: "0 0 0.4rem 0" }}>{p.desc}</p>
              <div style={{ fontSize: "0.82rem", color: "#555" }}>
                🏛️ <strong>{isEng ? "Payee:" : "Beneficiario:"}</strong> {p.company}
              </div>
              <small style={{ color: "#888", display: "block", marginTop: "0.2rem" }}>
                📅 {isEng ? "Due:" : "Scadenza:"} <strong>{p.dueDate}</strong>
              </small>
            </div>

            <div style={{ textAlign: "right", minWidth: "180px" }}>
              <span style={{ fontSize: "1.4rem", fontWeight: 800, color: p.status === "paid" ? "#166534" : "#e58c2c" }}>
                € {p.amount.toLocaleString("it-IT")}
              </span>

              {p.status === "paid" && (
                <button
                  type="button"
                  onClick={() => handleDownloadReceipt(idx + 1, p.amount)}
                  style={{
                    display: "block",
                    marginTop: "0.4rem",
                    background: "none",
                    border: "none",
                    color: "#166534",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline",
                    marginLeft: "auto",
                  }}
                >
                  📄 {isEng ? "Download Receipt" : "Scarica Ricevuta Fiscale"}
                </button>
              )}

              {p.iban && p.status !== "paid" && (
                <div style={{ marginTop: "0.6rem" }}>
                  <button
                    type="button"
                    onClick={() => handleCopyIban(p.iban!, p.ibanKey!)}
                    style={{
                      background: copiedIban === p.ibanKey ? "#166534" : "#1e1b18",
                      color: "#fff",
                      border: "none",
                      padding: "0.45rem 0.85rem",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      transition: "background 0.2s ease",
                    }}
                  >
                    {copiedIban === p.ibanKey ? "✅ IBAN Copiato!" : "📋 Copia IBAN"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Schede Coordinate Bancarie Ufficiali */}
      <div style={{ marginTop: "2.4rem", borderTop: "1px solid #eee8df", paddingTop: "2rem" }}>
        <h3 style={{ fontSize: "1.2rem", color: "#1e1b18", marginBottom: "0.5rem" }}>
          🏦 {isEng ? "Official Bank Details for Transfers" : "Coordinate Bancarie Ufficiali per Bonifici"}
        </h3>
        <p style={{ fontSize: "0.85rem", color: "#6a6764", marginBottom: "1.2rem" }}>
          {isEng
            ? "To ensure correct accounting and compliance, please always include the event name and date in the payment description."
            : "Ai sensi del disciplinare di gestione, ogni acconto va intestato alla società di competenza indicando nella causale il nome degli sposi e la data evento."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.2rem" }}>
          {/* Santo Stefano S.r.l. */}
          <div style={{ padding: "1.2rem", borderRadius: "12px", background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
              <div>
                <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, color: "#2563eb" }}>
                  1° ACCONTO & FITTO LOCATION
                </span>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#1e293b", marginTop: "0.15rem" }}>
                  {SANTO_STEFANO_CORP.ragioneSociale}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyIban(SANTO_STEFANO_CORP.iban, "box_ss")}
                style={{
                  background: copiedIban === "box_ss" ? "#166534" : "#2563eb",
                  color: "#fff",
                  border: "none",
                  padding: "0.35rem 0.7rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {copiedIban === "box_ss" ? "✅ Copiato!" : "📋 Copia IBAN"}
              </button>
            </div>
            <div style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6 }}>
              <div><strong>Banca:</strong> {SANTO_STEFANO_CORP.banca}</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a", marginTop: "0.2rem", wordBreak: "break-all" }}>
                {SANTO_STEFANO_CORP.iban}
              </div>
              <div style={{ marginTop: "0.4rem", fontSize: "0.78rem", color: "#64748b" }}>
                <strong>Causale consigliata:</strong> 1° Acconto Caparra {clientName ? `— ${clientName}` : ""} {eventDate ? `(${formatDate(eventDate)})` : ""}
              </div>
            </div>
          </div>

          {/* Iovino Banqueting S.r.l. */}
          <div style={{ padding: "1.2rem", borderRadius: "12px", background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
              <div>
                <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, color: "#7c3aed" }}>
                  2° ACCONTO LOGISTICA & CUCINA
                </span>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#1e293b", marginTop: "0.15rem" }}>
                  {IOVINO_CORP.ragioneSociale}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyIban(IOVINO_CORP.iban, "box_iov")}
                style={{
                  background: copiedIban === "box_iov" ? "#166534" : "#7c3aed",
                  color: "#fff",
                  border: "none",
                  padding: "0.35rem 0.7rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {copiedIban === "box_iov" ? "✅ Copiato!" : "📋 Copia IBAN"}
              </button>
            </div>
            <div style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6 }}>
              <div><strong>Banca:</strong> {IOVINO_CORP.banca}</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a", marginTop: "0.2rem", wordBreak: "break-all" }}>
                {IOVINO_CORP.iban}
              </div>
              <div style={{ marginTop: "0.4rem", fontSize: "0.78rem", color: "#64748b" }}>
                <strong>Causale consigliata:</strong> 2° Acconto Banqueting {clientName ? `— ${clientName}` : ""} {eventDate ? `(${formatDate(eventDate)})` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
