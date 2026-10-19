"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { sendMagicLinkAction, verifyAccessAction } from "./actions";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token");

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [devCodePreview, setDevCodePreview] = useState<string | null>(null);

  // Auto-login se presente parametro token nell'URL
  useEffect(() => {
    if (initialToken) {
      startTransition(async () => {
        setSuccessMessage("Verifica del Magic Link in corso...");
        const res = await verifyAccessAction(initialToken);
        if (res.success && res.redirectUrl) {
          router.push(res.redirectUrl);
        } else {
          setErrorMessage(res.error || "Il link di accesso non è valido o è scaduto.");
        }
      });
    }
  }, [initialToken, router]);

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setDevCodePreview(null);

    startTransition(async () => {
      const res = await sendMagicLinkAction(email);
      if (res.success) {
        setSuccessMessage(res.message || "Link inviato con successo!");
        if (res.otpCodePreview) {
          setDevCodePreview(res.otpCodePreview);
        }
        setStep("otp");
      } else {
        setErrorMessage(res.error || "Errore durante l'invio del link.");
      }
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    startTransition(async () => {
      const res = await verifyAccessAction(otpCode, email);
      if (res.success && res.redirectUrl) {
        router.push(res.redirectUrl);
      } else {
        setErrorMessage(res.error || "Codice errato o scaduto.");
      }
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem 1rem",
        background: "linear-gradient(135deg, #1e1b18 0%, #2b2723 50%, #1e1b18 100%)",
        fontFamily: "'Outfit', sans-serif",
        color: "#fff",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#ffffff",
          color: "#1e1b18",
          borderRadius: "24px",
          padding: "2.5rem 2.2rem",
          boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span
            style={{
              textTransform: "uppercase",
              letterSpacing: "3px",
              fontSize: "0.78rem",
              color: "#e58c2c",
              fontWeight: 800,
            }}
          >
            LA TERRA DEGLI ARANCI
          </span>
          <h1
            style={{
              margin: "0.4rem 0 0.5rem 0",
              fontSize: "1.9rem",
              fontFamily: "serif",
              color: "#1e1b18",
            }}
          >
            Area Riservata Sposi &amp; Club
          </h1>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
            Accesso sicuro senza password: entra con un click tramite Magic Link o codice OTP.
          </p>
        </div>

        {/* Feedback Alert */}
        {errorMessage && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              color: "#991b1b",
              padding: "0.8rem 1rem",
              borderRadius: "12px",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              background: "#dcfce7",
              border: "1px solid #86efac",
              color: "#166534",
              padding: "0.8rem 1rem",
              borderRadius: "12px",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
            }}
          >
            ✓ {successMessage}
          </div>
        )}

        {/* STEP 1: INSERIMENTO EMAIL */}
        {step === "email" && (
          <form onSubmit={handleSendEmail}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: "0.5rem",
                }}
              >
                La tua Email di contatto:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="es. sposi@email.it"
                style={{
                  width: "100%",
                  padding: "0.85rem 1rem",
                  borderRadius: "12px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "1rem",
                  color: "#1e293b",
                  outline: "none",
                  transition: "border 0.2s ease",
                }}
              />
              <small style={{ color: "#94a3b8", display: "block", marginTop: "0.4rem" }}>
                Inserisci l&apos;email usata durante la visita o per il preventivo.
              </small>
            </div>

            <button
              type="submit"
              disabled={isPending}
              style={{
                width: "100%",
                padding: "0.95rem",
                borderRadius: "14px",
                border: "none",
                background: "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "1rem",
                cursor: isPending ? "wait" : "pointer",
                boxShadow: "0 6px 20px rgba(229,140,44,0.35)",
              }}
            >
              {isPending ? "Invio in corso..." : "✉️ Invia Link di Accesso Diretto"}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFICA CODICE OTP O LINK */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#334155",
                  }}
                >
                  Codice OTP a 6 Cifre:
                </label>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ea580c",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cambia Email
                </button>
              </div>

              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                style={{
                  width: "100%",
                  padding: "0.85rem 1rem",
                  borderRadius: "12px",
                  border: "2px solid #ea580c",
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  letterSpacing: "8px",
                  textAlign: "center",
                  color: "#1e293b",
                  outline: "none",
                }}
              />

              {devCodePreview && (
                <div
                  style={{
                    marginTop: "0.8rem",
                    padding: "0.6rem 0.8rem",
                    background: "#f0fdf4",
                    border: "1px dashed #86efac",
                    borderRadius: "10px",
                    fontSize: "0.8rem",
                    color: "#166534",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>Codice di prova: <strong>{devCodePreview}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(devCodePreview)}
                    style={{
                      background: "#166534",
                      color: "#fff",
                      border: "none",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    Inserisci
                  </button>
                </div>
              )}

              <small style={{ color: "#64748b", display: "block", marginTop: "0.6rem", textAlign: "center" }}>
                Puoi inserire il codice qui sopra oppure cliccare direttamente sul link presente nell&apos;email ricevuta.
              </small>
            </div>

            <button
              type="submit"
              disabled={isPending}
              style={{
                width: "100%",
                padding: "0.95rem",
                borderRadius: "14px",
                border: "none",
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "1rem",
                cursor: isPending ? "wait" : "pointer",
                boxShadow: "0 6px 20px rgba(22,163,74,0.3)",
              }}
            >
              {isPending ? "Verifica in corso..." : "✓ Accedi all'Area Riservata"}
            </button>
          </form>
        )}

        {/* Demo Fast Access Pills */}
        <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "0.8rem", textAlign: "center" }}>
            Oppure accedi direttamente a una modalità demo:
          </span>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Link href="/cliente?id=client-demo-firmato" style={{ textDecoration: "none" }}>
              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "0.55rem 0.6rem",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#1e293b",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                💍 Contratto Firmato
              </button>
            </Link>

            <Link href="/cliente?id=client-demo-pre-firma" style={{ textDecoration: "none" }}>
              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "0.55rem 0.6rem",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#1e293b",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ⏳ In Attesa Firma
              </button>
            </Link>

            <Link href="/cliente?id=client-demo4&mode=storico" style={{ textDecoration: "none" }}>
              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "0.55rem 0.6rem",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#1e293b",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                🏛️ Ospiti Storici
              </button>
            </Link>

            <Link href="/cliente?id=client-demo-privato&mode=privato" style={{ textDecoration: "none" }}>
              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "0.55rem 0.6rem",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#1e293b",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                🎉 Festa Privata
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
