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
        padding: "1.2rem 2.5rem",
        background: "#e58c2c",
        color: "#ffffff",
        border: "none",
        borderRadius: "10px",
        fontSize: "1.2rem",
        fontWeight: "bold",
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: "0 6px 20px rgba(229, 140, 44, 0.4)",
        transition: "all 0.2s ease"
      }}
    >
      {loading ? "Elaborazione in corso..." : "Sì, Accetto la Proposta ✓"}
    </button>
  );
}
