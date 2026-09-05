"use client";

import React from "react";

interface PaymentScheduleProps {
  totalAmount?: number;
  importoCaparra?: number;
  importoSecondoAcconto?: number;
  isSigned?: boolean;
  lang?: "it" | "en";
}

export default function PaymentSchedule({ totalAmount = 15200, importoCaparra, importoSecondoAcconto, isSigned = true, lang = "it" }: PaymentScheduleProps) {
  const isEng = lang === "en";

  // Disciplinare TDA: 1° acconto fisso €1.500 (Santo Stefano S.r.l.), 2° acconto €3.000 a -6 mesi (Iovino Banquetting S.r.l.), Saldo finale a 10-15gg.
  const hasFrozenInstallments = importoCaparra != null && importoSecondoAcconto != null;
  const caparra = hasFrozenInstallments ? importoCaparra! : Math.min(1500, totalAmount);
  const secondoAcconto = hasFrozenInstallments
    ? importoSecondoAcconto!
    : Math.min(3000, Math.max(0, totalAmount - caparra));
  const saldo = Math.max(0, totalAmount - caparra - secondoAcconto);

  const payments = [
    {
      step: isEng ? "1. First Deposit (€1,500 Fixed)" : "1. Caparra / 1° Acconto (€1.500 Fisso)",
      amount: caparra,
      dueDate: isEng ? "Upon Contract Signing" : "Alla firma del contratto (Santo Stefano S.r.l.)",
      status: isSigned ? "paid" : "pending",
      desc: isEng
        ? "Confirmation deposit to hold the date and secure villa exclusivity."
        : "Versamento di conferma per il blocco irrevocabile della data ed esclusiva villa."
    },
    {
      step: isEng ? "2. Second Deposit (€3,000 Flat)" : "2. Secondo Acconto (€3.000 Forfettario)",
      amount: secondoAcconto,
      dueDate: isEng ? "6 Months Before Event" : "6 Mesi prima dell'evento (Iovino Banquetting S.r.l.)",
      status: "upcoming",
      desc: isEng
        ? "Intermediate deposit for culinary logistics, menu planning, and banqueting coordination."
        : "Versamento intermedio per approvvigionamenti e pianificazione operativa cucina e banqueting."
    },
    {
      step: isEng ? "3. Final Balance (Residual Split)" : "3. Saldo Finale (Quota Residua)",
      amount: saldo,
      dueDate: isEng ? "10-15 Days Before Event" : "10-15 Giorni prima dell'evento",
      status: "upcoming",
      desc: isEng
        ? "Final settlement based on confirmed guest count (min 70 adults) and agreed extra services."
        : "Saldo calcolato sul numero definitivo di ospiti (bloccato a -10gg) e servizi extra con ripartizione 60/40."
    }
  ];

  return (
    <div style={{ background: "#ffffff", borderRadius: "18px", padding: "2.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #eee7de" }}>
      <div style={{ marginBottom: "2rem" }}>
        <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700 }}>
          {isEng ? "PAYMENT PLAN & DEPOSITS" : "PIANO ACCONTI & SCADENZE"}
        </span>
        <h2 style={{ fontSize: "1.8rem", color: "#1e1b18", marginTop: "0.3rem" }}>
          💶 {isEng ? "Deposits & Invoices Schedule" : "Scadenzario Acconti & Ricevute"}
        </h2>
        <p style={{ color: "#6a6764", fontSize: "0.95rem", marginTop: "0.4rem" }}>
          {isEng
            ? "Clear overview of your payments, upcoming deadlines, and downloadable receipts."
            : "Trasparenza completa sulle scadenze dei pagamenti, acconti versati e relative ricevute fiscali."}
        </p>
      </div>

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
              background: p.status === "paid" ? "#f0fdf4" : "#faf8f5",
              border: `1px solid ${p.status === "paid" ? "#bbf7d0" : "#eee8df"}`,
              flexWrap: "wrap",
              gap: "1rem"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.3rem" }}>
                <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1e1b18" }}>{p.step}</span>
                <span style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.7rem",
                  borderRadius: "20px",
                  background: p.status === "paid" ? "#166534" : "#92400e",
                  color: "#ffffff",
                  textTransform: "uppercase"
                }}>
                  {p.status === "paid" ? (isEng ? "Paid & Verified" : "Ricevuto & Verificato") : (isEng ? "Upcoming" : "Da Inviare")}
                </span>
              </div>
              <p style={{ fontSize: "0.88rem", color: "#666", margin: 0 }}>{p.desc}</p>
              <small style={{ color: "#888", display: "block", marginTop: "0.3rem" }}>📅 {isEng ? "Due:" : "Scadenza:"} {p.dueDate}</small>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "1.4rem", fontWeight: 700, color: p.status === "paid" ? "#166534" : "#e58c2c" }}>
                € {p.amount.toLocaleString("it-IT")}
              </span>
              {p.status === "paid" && (
                <button
                  type="button"
                  onClick={() => alert(isEng ? "Receipt download available in your dashboard." : "Ricevuta acconto pronta per il download.")}
                  style={{
                    display: "block",
                    marginTop: "0.4rem",
                    background: "none",
                    border: "none",
                    color: "#166534",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  📄 {isEng ? "Download Receipt" : "Scarica Ricevuta"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
