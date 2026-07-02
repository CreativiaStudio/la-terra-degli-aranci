"use client";

import { useState } from "react";
import { acceptQuote } from "../actions";

export default function AcceptQuoteButton({ quoteId }: { quoteId: string }) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!confirm("Confermi di voler accettare questa proposta?")) return;
    
    setLoading(true);
    const res = await acceptQuote(quoteId);
    
    if (!res.success) {
      alert("Si è verificato un errore. Riprova più tardi.");
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleAccept} 
      disabled={loading}
      style={{
        padding: "1rem 2rem",
        background: "var(--primary-color)",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "1.1rem",
        fontWeight: "bold",
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: "0 4px 15px rgba(229, 140, 44, 0.4)",
        transition: "transform 0.2s"
      }}
    >
      {loading ? "Elaborazione..." : "Sì, Accetto la Proposta ✓"}
    </button>
  );
}
