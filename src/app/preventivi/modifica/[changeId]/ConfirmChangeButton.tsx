"use client";

import { useState } from "react";
import SignaturePad from "@/components/SignaturePad";
import { confirmQuoteChange } from "../actions";

export default function ConfirmChangeButton({ changeId, sig }: { changeId: string; sig: string }) {
  const [firma, setFirma] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!firma) {
      setError("Apponi la firma prima di confermare.");
      return;
    }
    setLoading(true);
    setLoadingStep(1);
    setError("");

    const t1 = setTimeout(() => setLoadingStep(2), 900);
    const t2 = setTimeout(() => setLoadingStep(3), 2200);

    const res = await confirmQuoteChange(changeId, sig, firma);
    clearTimeout(t1);
    clearTimeout(t2);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.error);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  if (success) {
    return (
      <div style={{ marginTop: "2rem", padding: "2rem", background: "#f3f8f2", color: "#2d5a27", borderRadius: "12px", textAlign: "center" }}>
        <h3 style={{ margin: "0 0 0.5rem 0" }}>Modifica confermata! 🎉</h3>
        <p style={{ margin: 0 }}>Il nuovo allegato è stato generato e il preventivo è stato aggiornato.</p>
        <a href="/cliente" style={{ display: "inline-block", marginTop: "1rem", color: "#2d5a27", fontWeight: 600 }}>
          Torna alla tua area riservata →
        </a>
      </div>
    );
  }

  const getLoadingText = () => {
    if (loadingStep === 1) return "✍️ Validazione firma crittografica...";
    if (loadingStep === 2) return "📄 Generazione allegato PDF in corso...";
    if (loadingStep === 3) return "🔒 Archiviazione digitale sicura...";
    return "⏳ Elaborazione in corso...";
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <SignaturePad label="Firma di Conferma" onEnd={setFirma} initialData={firma} />
      {error && <div style={{ color: "#d93838", marginTop: "0.8rem", fontWeight: 600 }}>{error}</div>}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={loading}
        style={{
          marginTop: "1.2rem",
          width: "100%",
          padding: "1.1rem",
          background: loading ? "#d17a22" : "#e58c2c",
          color: "#ffffff",
          border: "none",
          borderRadius: "10px",
          fontSize: "1.1rem",
          fontWeight: "bold",
          cursor: loading ? "wait" : "pointer",
          boxShadow: "0 6px 20px rgba(229, 140, 44, 0.4)",
          transition: "all 0.2s ease"
        }}
      >
        {loading ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", animation: "pulse 1.5s infinite" }}>
            {getLoadingText()}
          </span>
        ) : (
          "Confermo e Firmo la Modifica"
        )}
      </button>
    </div>
  );
}
