import React from "react";

interface StatsProps {
  preventiviInviati: number;
  preventiviInAttesa: number;
  contrattiInviati: number;
  contrattiInAttesa: number;
}

export default function StatsOverview({ preventiviInviati, preventiviInAttesa, contrattiInviati, contrattiInAttesa }: StatsProps) {
  const cardStyle = {
    background: "#ffffff",
    padding: "1.5rem",
    borderRadius: "14px",
    border: "1px solid #e0ddd9",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.4rem"
  };

  const numberStyle = {
    fontSize: "2.2rem",
    fontWeight: "bold",
    color: "#514d48",
    margin: "0.2rem 0"
  };

  const labelStyle = {
    fontSize: "0.85rem",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    color: "#888",
    fontWeight: "600"
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.2rem", marginBottom: "2rem" }}>
      
      {/* 1. Preventivi Inviati */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={labelStyle}>Preventivi Inviati</span>
          <span style={{ fontSize: "1.4rem" }}>📩</span>
        </div>
        <div style={{ ...numberStyle, color: "#e58c2c" }}>
          {preventiviInviati}
        </div>
        <small style={{ color: "#777", fontSize: "0.8rem" }}>Totale proposte generate</small>
      </div>

      {/* 2. Preventivi in Attesa */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={labelStyle}>Preventivi in Attesa</span>
          <span style={{ fontSize: "1.4rem" }}>⏳</span>
        </div>
        <div style={{ ...numberStyle, color: "#856404" }}>
          {preventiviInAttesa}
        </div>
        <small style={{ color: "#777", fontSize: "0.8rem" }}>In attesa di risposta cliente</small>
      </div>

      {/* 3. Contratti Inviati */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={labelStyle}>Contratti Inviati</span>
          <span style={{ fontSize: "1.4rem" }}>📄</span>
        </div>
        <div style={{ ...numberStyle, color: "#1c4f82" }}>
          {contrattiInviati}
        </div>
        <small style={{ color: "#777", fontSize: "0.8rem" }}>Link contratti generati</small>
      </div>

      {/* 4. Contratti in Attesa */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={labelStyle}>Contratti in Attesa</span>
          <span style={{ fontSize: "1.4rem" }}>⏳</span>
        </div>
        <div style={{ ...numberStyle, color: "#e58c2c" }}>
          {contrattiInAttesa}
        </div>
        <small style={{ color: "#777", fontSize: "0.8rem" }}>In attesa di firma sposi</small>
      </div>

    </div>
  );
}
