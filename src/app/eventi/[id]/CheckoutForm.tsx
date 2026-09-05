"use client";

import React, { useState } from "react";
import Link from "next/link";
import { submitTicketOrder } from "../actions";
import { TicketOrder } from "@/lib/localDb";

interface CheckoutFormProps {
  evento: {
    id: string;
    titolo: string;
    prezzo: number;
    data: string;
  };
}

export default function CheckoutForm({ evento }: CheckoutFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tickets, setTickets] = useState(2);
  const [nome, setNome] = useState("Roberto");
  const [cognome, setCognome] = useState("Sola");
  const [email, setEmail] = useState("sposi.club@laterradegliaranci.it");
  const [processing, setProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<TicketOrder | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const totale = tickets * evento.prezzo;

  const handleProcessPayment = async () => {
    if (!email.trim()) {
      setErrorMessage("Inserisci un'email valida per ricevere i biglietti.");
      return;
    }

    setProcessing(true);
    setErrorMessage("");

    try {
      const res = await submitTicketOrder({
        evento_id: evento.id,
        evento_titolo: evento.titolo,
        data_evento: evento.data,
        cliente_nome: `${nome.trim()} ${cognome.trim()}`.trim() || "Ospite Club TDA",
        cliente_email: email.trim(),
        numero_biglietti: tickets,
        prezzo_unitario: evento.prezzo,
        totale,
        sconto_club_applicato: true,
      });

      if (res.success && res.order) {
        setConfirmedOrder(res.order);
        setStep(3);
      } else {
        setErrorMessage(res.error || "Errore durante il completamento dell'ordine.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Errore di rete imprevisto. Riprova.");
    } finally {
      setProcessing(false);
    }
  };

  if (step === 3 && confirmedOrder) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0" }}>
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "#f0fdf4",
            color: "#166534",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5rem",
            margin: "0 auto 1.5rem",
          }}
        >
          ✓
        </div>
        <h3 style={{ fontSize: "1.8rem", color: "#1e1b18", marginBottom: "0.5rem" }}>
          Biglietti Confermati & Registrati!
        </h3>
        <p style={{ color: "#6a6764", fontSize: "1.05rem", marginBottom: "1.8rem" }}>
          Ordine <strong>#{confirmedOrder.id}</strong> salvato nel sistema. Riceverai la conferma su <em>{confirmedOrder.cliente_email}</em>.
        </p>

        {/* Biglietto Digitale Ufficiale TDA */}
        <div
          style={{
            background: "#ffffff",
            border: "2px dashed #e58c2c",
            borderRadius: "18px",
            padding: "2rem",
            maxWidth: "360px",
            margin: "0 auto",
            position: "relative",
            boxShadow: "0 10px 30px rgba(229,140,44,0.12)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                color: "#e58c2c",
                fontWeight: 800,
              }}
            >
              ⭐ PASS INGRESSO CLUB TDA
            </span>
            <span style={{ fontSize: "0.75rem", background: "#f0fdf4", color: "#166534", padding: "0.2rem 0.6rem", borderRadius: "10px", fontWeight: 700 }}>
              Tariffa Soci -20%
            </span>
          </div>

          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1e1b18", marginBottom: "0.4rem" }}>
            {confirmedOrder.evento_titolo}
          </div>
          <div style={{ fontSize: "0.9rem", color: "#6a6764", marginBottom: "1rem" }}>
            📅 {confirmedOrder.data_evento} • {confirmedOrder.numero_biglietti} {confirmedOrder.numero_biglietti > 1 ? "Ospiti" : "Ospite"}
          </div>

          <div style={{ background: "#f8fafc", padding: "0.8rem", borderRadius: "10px", marginBottom: "1.2rem", fontSize: "0.85rem", color: "#334155" }}>
            <div>Intestatario: <strong>{confirmedOrder.cliente_nome}</strong></div>
            <div>Totale Transazione: <strong>€ {confirmedOrder.totale.toFixed(2)}</strong></div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>
              Token Univoco: <code>{confirmedOrder.qr_pass_token}</code>
            </div>
          </div>

          {/* QR Code Pass Grafico */}
          <div
            style={{
              width: "160px",
              height: "160px",
              margin: "0 auto",
              background: "#1e1b18",
              padding: "12px",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              color: "#fff",
              position: "relative",
            }}
          >
            <div style={{ fontSize: "2.5rem" }}>📱</div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", marginTop: "4px" }}>
              PASS VALIDO
            </span>
            <small style={{ fontSize: "0.65rem", color: "#cbd5e1" }}>
              {confirmedOrder.id.toUpperCase()}
            </small>
          </div>
        </div>

        <Link href="/cliente?mode=storico&id=demo4">
          <button
            style={{
              marginTop: "2.5rem",
              background: "linear-gradient(135deg, #1e1b18 0%, #3a342e 100%)",
              color: "#ffffff",
              border: "none",
              padding: "0.85rem 2.2rem",
              borderRadius: "12px",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
            }}
          >
            ← Torna al Salotto Club TDA
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {errorMessage && (
        <div style={{ background: "#fee2e2", border: "1px solid #f87171", color: "#991b1b", padding: "0.8rem 1rem", borderRadius: "10px", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* 1. Selezione Biglietti */}
      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#1e1b18", marginBottom: "1rem" }}>
          1. Seleziona i Biglietti (Tariffa Riservata Club)
        </h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fdfbf7", padding: "1.5rem", borderRadius: "14px", border: "1px solid #eee8df" }}>
          <div>
            <div style={{ fontWeight: 600, color: "#1e1b18", fontSize: "1.05rem" }}>Ingresso VIP Club TDA</div>
            <div style={{ color: "#e58c2c", fontWeight: 700, fontSize: "0.95rem" }}>
              € {evento.prezzo.toFixed(2)} / persona
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              type="button"
              onClick={() => setTickets(Math.max(1, tickets - 1))}
              style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid #ccc", background: "#fff", cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              -
            </button>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, width: "20px", textAlign: "center" }}>{tickets}</span>
            <button
              type="button"
              onClick={() => setTickets(tickets + 1)}
              style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "#e58c2c", color: "#fff", cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* 2. Dettagli Personali */}
      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#1e1b18", marginBottom: "1rem" }}>
          2. Dati Intestatario Pass
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <input
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            style={{ padding: "0.9rem 1rem", borderRadius: "10px", border: "1px solid #ddd", fontSize: "0.95rem", width: "100%" }}
          />
          <input
            type="text"
            placeholder="Cognome"
            value={cognome}
            onChange={(e) => setCognome(e.target.value)}
            style={{ padding: "0.9rem 1rem", borderRadius: "10px", border: "1px solid #ddd", fontSize: "0.95rem", width: "100%" }}
          />
          <input
            type="email"
            placeholder="Email per invio pass"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ gridColumn: "span 2", padding: "0.9rem 1rem", borderRadius: "10px", border: "1px solid #ddd", fontSize: "0.95rem", width: "100%" }}
          />
        </div>
      </div>

      {/* 3. Riepilogo & Checkout */}
      <div style={{ marginBottom: "2rem", background: "#f8fafc", padding: "1.5rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ color: "#64748b" }}>Totale ({tickets} biglietti a €{evento.prezzo}):</span>
          <strong style={{ fontSize: "1.3rem", color: "#ea580c" }}>€ {totale.toFixed(2)}</strong>
        </div>
        <small style={{ color: "#16a34a", fontWeight: 600, display: "block", marginBottom: "1.2rem" }}>
          ⭐ Tariffa Prevendita Prioritaria 48h Attiva
        </small>

        <button
          type="button"
          onClick={handleProcessPayment}
          disabled={processing}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "12px",
            border: "none",
            background: processing ? "#94a3b8" : "linear-gradient(135deg, #1e1b18 0%, #3a342e 100%)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1.05rem",
            cursor: processing ? "not-allowed" : "pointer",
            boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
          }}
        >
          {processing ? "Elaborazione Registrazione Ordine..." : `Conferma & Acquista Pass (€ ${totale.toFixed(2)})`}
        </button>
      </div>
    </div>
  );
}
