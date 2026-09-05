"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SegreteriaLayout({
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
      // Ignora errore e procedi
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f6f2",
        color: "#2c2a27",
        fontFamily: "'Outfit', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Header iPad */}
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5dfd5",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
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
                color: "#e58c2c",
                fontWeight: 700,
              }}
            >
              TABLET TOUR LOCATION & ACCOGLIENZA
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
              La Terra degli Aranci
            </h1>
          </div>
        </div>

        {/* Badge di Sicurezza & Controlli Operatore */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#e8f5e9",
              border: "1px solid #c8e6c9",
              color: "#1b5e20",
              padding: "0.45rem 0.9rem",
              borderRadius: "20px",
              fontSize: "0.82rem",
              fontWeight: 600,
            }}
          >
            <span>🔒</span>
            <span>Modalità Tour Ospiti • Zero Dati Finanziari</span>
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
            <span style={{ fontSize: "1rem" }}>📱</span>
            <span style={{ fontWeight: 600 }}>Staff Accoglienza</span>
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

      {/* Main Container */}
      <main style={{ flex: 1, padding: "1.8rem 2rem", maxWidth: "1400px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
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
        La Terra degli Aranci • Postazione Tablet Accoglienza Ospiti • Piazzetta Santo Stefano 7, Napoli (Vomero)
      </footer>
    </div>
  );
}
