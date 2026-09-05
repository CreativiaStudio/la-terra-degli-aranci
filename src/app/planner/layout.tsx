"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignora errore
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f7f5",
        color: "#2c2a27",
        fontFamily: "'Outfit', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Header Planner */}
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e7e2d9",
          padding: "1.1rem 2.2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <img
            src="/tda-simbolo.png"
            alt="La Terra degli Aranci"
            style={{ height: "46px", width: "auto", objectFit: "contain" }}
          />
          <div>
            <div
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "#8b5cf6",
                fontWeight: 700,
              }}
            >
              REGIA EVENTI & SUBENTRO -6 MESI
            </div>
            <h1
              style={{
                fontSize: "1.25rem",
                margin: 0,
                color: "#1e1b18",
                fontFamily: "Georgia, 'Playfair Display', serif",
                fontWeight: 600,
              }}
            >
              Wedding & Event Planner TDA
            </h1>
          </div>
        </div>

        {/* Info Planner & Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#f3e8ff",
              border: "1px solid #d8b4fe",
              color: "#6b21a8",
              padding: "0.4rem 0.9rem",
              borderRadius: "20px",
              fontSize: "0.82rem",
              fontWeight: 600,
            }}
          >
            <span>💍</span>
            <span>Finestra Operativa -6 Mesi Attiva</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              background: "#f5f2eb",
              padding: "0.35rem 0.8rem",
              borderRadius: "20px",
              fontSize: "0.85rem",
              color: "#44403c",
            }}
          >
            <span style={{ fontSize: "1rem" }}>👩‍💼</span>
            <span style={{ fontWeight: 600 }}>Elena (Planner TDA)</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              minHeight: "44px",
              padding: "0 1.1rem",
              borderRadius: "10px",
              border: "1px solid #d6cebf",
              background: "#ffffff",
              color: "#57534e",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {loggingOut ? "Disconnessione..." : "Esci ⏻"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", maxWidth: "1400px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {children}
      </main>

      <footer
        style={{
          textAlign: "center",
          padding: "1.2rem",
          color: "#a8a29e",
          fontSize: "0.8rem",
          borderTop: "1px solid #eae5db",
          background: "#ffffff",
        }}
      >
        La Terra degli Aranci • Dashboard Operativa Wedding & Event Planner • Vomero, Napoli
      </footer>
    </div>
  );
}
