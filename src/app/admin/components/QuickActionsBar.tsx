import React from "react";
import Link from "next/link";

export default function QuickActionsBar() {
  const btnStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.8rem 1.4rem",
    borderRadius: "10px",
    fontWeight: "bold" as const,
    fontSize: "0.95rem",
    textDecoration: "none",
    transition: "transform 0.2s, boxShadow 0.2s"
  };

  return (
    <div style={{
      background: "#ffffff",
      padding: "1.2rem 1.5rem",
      borderRadius: "14px",
      border: "1px solid #e0ddd9",
      marginBottom: "2rem",
      display: "flex",
      flexWrap: "wrap",
      gap: "1rem",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
    }}>
      <div style={{ fontWeight: "bold", color: "#514d48", fontSize: "1.05rem" }}>
        ⚡ Azioni Rapide Direzione:
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem" }}>
        {/* 1. Controllo Cassa & Eventi */}
        <Link href="/admin/eventi-cassa" style={{ ...btnStyle, background: "#1e1b18", color: "#f5efe6", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          <span>💰</span> Controllo Cassa & Eventi
        </Link>

        {/* 2. Simulatore Fiscale */}
        <Link href="/admin/simulatore" style={{ ...btnStyle, background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
          <span>🧮</span> Simulatore Fiscale
        </Link>

        {/* 3. Nuovo Preventivo */}
        <Link href="/admin/preventivi/nuovo" style={{ ...btnStyle, background: "#e58c2c", color: "white", boxShadow: "0 4px 12px rgba(229,140,44,0.3)" }}>
          <span>➕</span> Nuovo Preventivo
        </Link>

        {/* 4. Modello Contratto Diretto */}
        <Link href="/admin/contratti" style={{ ...btnStyle, background: "#f0eee9", color: "#514d48", border: "1px solid #ddd" }}>
          <span>📑</span> Modello Contratto Diretto
        </Link>
      </div>
    </div>
  );
}
