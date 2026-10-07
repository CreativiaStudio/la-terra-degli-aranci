"use client";

import React from "react";
import type { UseFormRegister } from "react-hook-form";
import { PAYMENT_METHODS, formatEuro, formatItalianDate, paymentMethodLabel } from "@/lib/contractPayments";

interface ContractPaymentsSectionProps {
  lang: "it" | "en";
  register: UseFormRegister<any>;
  prezzoTotale: number;
  caparra: number;
  secondoAcconto: number;
  saldo: number;
  dataAnticipo: string;
  dataSecondoAcconto: string;
  dataSaldo: string;
}

const lockedInputStyle: React.CSSProperties = {
  background: "#f8f9fa",
  border: "1.5px solid #d1d5db",
  cursor: "not-allowed",
  color: "#374151",
  fontWeight: 600,
};

const amountBoxStyle: React.CSSProperties = {
  background: "#f8f9fa",
  border: "1.5px solid #d1d5db",
  borderRadius: "6px",
  padding: "0.55rem 0.75rem",
  fontWeight: 700,
  color: "#1e1b18",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.5rem",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e7ddcc",
  borderRadius: "10px",
  background: "#fffdfa",
  padding: "1rem 1.25rem",
  marginBottom: "1rem",
};

const hintStyle: React.CSSProperties = {
  color: "#6b7280",
  marginTop: "0.25rem",
  display: "block",
  fontSize: "0.8rem",
};

const blockTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  color: "#1e1b18",
  marginBottom: "0.75rem",
  fontSize: "0.98rem",
};

interface PayBlockProps {
  lang: "it" | "en";
  register: UseFormRegister<any>;
  title: string;
  amount: number;
  dateName: string;
  dateValue: string;
  dateNote: string;
  methodName: string;
}

function PayBlock({
  lang,
  register,
  title,
  amount,
  dateName,
  dateValue,
  dateNote,
  methodName,
}: PayBlockProps) {
  const isIt = lang === "it";
  return (
    <div style={cardStyle}>
      <div style={blockTitleStyle}>{title}</div>
      <div className="form-grid">
        <div className="form-group">
          <label>{isIt ? "Importo (concordato con la direzione)" : "Amount (agreed with management)"}</label>
          <div style={amountBoxStyle}>
            <span>{formatEuro(amount)}</span>
            <span aria-label="locked" title={isIt ? "Importo bloccato" : "Locked amount"}>🔒</span>
          </div>
        </div>

        <div className="form-group">
          <label>{isIt ? "Data di scadenza" : "Due date"}</label>
          <input type="date" readOnly {...register(dateName)} style={lockedInputStyle} />
          <small style={hintStyle}>
            📅 {formatItalianDate(dateValue) || "—"} · 🔒 {dateNote}
          </small>
        </div>

        <div className="form-group full">
          <label>{isIt ? "Metodo di pagamento *" : "Payment method *"}</label>
          <select {...register(methodName, { required: true })}>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {paymentMethodLabel(method, lang)}
              </option>
            ))}
          </select>
          <small style={hintStyle}>
            {isIt
              ? "Il metodo di pagamento è scelto liberamente dal Cliente."
              : "The payment method is freely chosen by the Client."}
          </small>
        </div>
      </div>
    </div>
  );
}

/**
 * Sezione "Dettagli Pagamenti" condivisa dai form di firma Wedding ed Eventi.
 * Importi e date sono bloccati (concordati con la direzione); il metodo di
 * pagamento è invece liberamente selezionabile dal Cliente.
 */
export default function ContractPaymentsSection({
  lang,
  register,
  prezzoTotale,
  caparra,
  secondoAcconto,
  saldo,
  dataAnticipo,
  dataSecondoAcconto,
  dataSaldo,
}: ContractPaymentsSectionProps) {
  const isIt = lang === "it";

  return (
    <div className="form-group full" style={{ marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
      {/* Campi nascosti: scorrono nel payload verso /api/generate-pdf */}
      <input type="hidden" {...register("prezzo_totale")} />
      <input type="hidden" {...register("importo_caparra")} />
      <input type="hidden" {...register("importo_secondo_acconto")} />
      <input type="hidden" {...register("importo_saldo")} />

      <h3 style={{ marginBottom: "0.25rem" }}>
        {isIt ? "Dettagli Pagamenti (Concordati con la direzione)" : "Payment Details (Agreed with management)"}
      </h3>
      <small style={{ color: "#8a6a2f", fontWeight: 600, display: "block", marginBottom: "1rem" }}>
        {isIt
          ? "Importi e scadenze concordati con la direzione de La Terra degli Aranci: il Cliente sceglie liberamente il metodo di pagamento."
          : "Amounts and due dates agreed with La Terra degli Aranci management: the Client freely chooses the payment method."}
      </small>

      {/* Card riassuntiva canone totale */}
      <div
        style={{
          background: "#fdf7ef",
          border: "1.5px solid #e58c2c",
          borderRadius: "10px",
          padding: "1rem 1.25rem",
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: "#7c5a22" }}>
            {isIt ? "Canone Totale Pattuito" : "Total Agreed Fee"}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#807261" }}>
            {isIt
              ? "Canone fitto struttura La Terra degli Aranci (100% Santo Stefano S.r.l.)"
              : "Venue rental fee La Terra degli Aranci (100% Santo Stefano S.r.l.)"}
          </div>
        </div>
        <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#1e1b18", whiteSpace: "nowrap" }}>
          {formatEuro(prezzoTotale)}
        </div>
      </div>

      <PayBlock
        lang={lang}
        register={register}
        title={
          isIt
            ? "1° Versamento — Caparra Confirmatoria (alla firma)"
            : "1st Payment — Earnest Money Deposit (upon signing)"
        }
        amount={caparra}
        dateName="data_anticipo"
        dateValue={dataAnticipo}
        dateNote={isIt ? "Alla firma del contratto" : "Upon signing the contract"}
        methodName="mezzo_anticipo"
      />

      {secondoAcconto > 0 && (
        <PayBlock
          lang={lang}
          register={register}
          title={
            isIt
              ? "2° Versamento — Secondo Acconto (a -6 mesi dall'evento)"
              : "2nd Payment — Second Deposit (6 months before the event)"
          }
          amount={secondoAcconto}
          dateName="data_secondo_acconto"
          dateValue={dataSecondoAcconto}
          dateNote={isIt ? "6 mesi prima dell'evento" : "6 months before the event"}
          methodName="mezzo_secondo_acconto"
        />
      )}

      <PayBlock
        lang={lang}
        register={register}
        title={
          isIt
            ? "3° Versamento — Saldo Canone (il giorno dell'evento)"
            : "3rd Payment — Balance (on the day of the event)"
        }
        amount={saldo}
        dateName="data_saldo"
        dateValue={dataSaldo}
        dateNote={isIt ? "Il giorno dell'evento" : "On the day of the event"}
        methodName="mezzo_saldo"
      />
    </div>
  );
}
