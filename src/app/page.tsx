import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  const portalCards = [
    {
      title: "Amministrazione Direzionale",
      badge: "Roberto & Rosaria",
      badgeColor: "#e58c2c",
      icon: "🏛️",
      href: "/admin",
      desc: "Panoramica eventi, controllo cassa, split fiscale 60/40, acconti, catalogo servizi e approvazione blog WordPress.",
      cta: "Accedi ad Admin →",
    },
    {
      title: "Tablet Segreteria Parco",
      badge: "Staff Accoglienza",
      badgeColor: "#1e3a2f",
      icon: "📱",
      href: "/segreteria",
      desc: "Tour location touch iPad per parco e sale, verifica disponibilità date e scheda visita lead live. Rigorosamente senza dati finanziari.",
      cta: "Avvia Tour Tablet →",
    },
    {
      title: "Wedding & Event Planner",
      badge: "Subentro -6 Mesi",
      badgeColor: "#8b5cf6",
      icon: "💍",
      href: "/planner",
      desc: "Gestione operativa per matrimoni e feste: countdown dinamico, scalette orarie, intolleranze e Dossier 360° sposi pre-popolato dall'AI.",
      cta: "Apri Area Planner →",
    },
    {
      title: "Portale Riservato Clienti",
      badge: "Sposi • Privati • Club",
      badgeColor: "#ec4899",
      icon: "👰",
      href: "/cliente?mode=wedding&id=demo1",
      desc: "Esperienza dinamica per matrimoni attivi (Wedding Diary, acconti), eventi privati snelli e Club Storico villa con ticketing.",
      cta: "Entra nel Portale →",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fcfbf9", color: "#2c2a27", fontFamily: "'Outfit', sans-serif" }}>
      <Navbar />

      {/* Hero Section */}
      <section
        style={{
          padding: "4rem 2rem 3rem 2rem",
          maxWidth: "1100px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: "0.78rem",
            textTransform: "uppercase",
            letterSpacing: "3px",
            color: "#e58c2c",
            fontWeight: 700,
            display: "inline-block",
            marginBottom: "0.8rem",
            background: "#fff7ed",
            padding: "4px 14px",
            borderRadius: "20px",
            border: "1px solid rgba(229,140,44,0.3)",
          }}
        >
          ECOSISTEMA GESTIONALE UNIFICATO
        </span>

        <h1
          style={{
            fontSize: "2.8rem",
            fontFamily: "Georgia, 'Playfair Display', serif",
            color: "#1e1b18",
            margin: "0 0 1rem 0",
            lineHeight: 1.2,
          }}
        >
          La Terra degli Aranci
        </h1>

        <p
          style={{
            fontSize: "1.15rem",
            color: "#6b7280",
            maxWidth: "700px",
            margin: "0 auto 2.5rem auto",
            lineHeight: 1.6,
          }}
        >
          Piattaforma digitale integrata per la direzione, l&apos;accoglienza tablet nel parco, la regia wedding planner e l&apos;esperienza immersiva degli ospiti e degli sposi.
        </p>

        {/* Banner Accesso Rapido Demo */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e1b18 0%, #2a2520 100%)",
            color: "#ffffff",
            padding: "1.8rem 2.2rem",
            borderRadius: "16px",
            maxWidth: "780px",
            margin: "0 auto 3.5rem auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.2rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          }}
        >
          <div style={{ textAlign: "left", flex: 1, minWidth: "260px" }}>
            <div style={{ color: "#e58c2c", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700 }}>
              TEST RAPIDO & COLLAUDO
            </div>
            <strong style={{ fontSize: "1.2rem", display: "block", marginTop: "2px" }}>
              6 Credenziali Operative Predefinite
            </strong>
            <small style={{ color: "#a8a29e", display: "block", marginTop: "4px" }}>
              Admin, Segreteria tablet, Planner -6 mesi, Wedding, Privato e Storico disponibili con 1-click.
            </small>
          </div>

          <Link
            href="/login"
            style={{
              padding: "0.8rem 1.6rem",
              borderRadius: "10px",
              background: "linear-gradient(90deg, #e58c2c 0%, #d47b1e 100%)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.95rem",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(229,140,44,0.4)",
            }}
          >
            Vai al Login Rapido 1-Click →
          </Link>
        </div>

        {/* Griglia 4 Portali */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
            textAlign: "left",
          }}
        >
          {portalCards.map((portal) => (
            <div
              key={portal.title}
              style={{
                background: "#ffffff",
                border: "1px solid #e7e2d9",
                borderRadius: "16px",
                padding: "2rem",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "2rem" }}>{portal.icon}</span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: `${portal.badgeColor}15`,
                      color: portal.badgeColor,
                      border: `1px solid ${portal.badgeColor}33`,
                    }}
                  >
                    {portal.badge}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "Georgia, 'Playfair Display', serif",
                    fontSize: "1.35rem",
                    margin: "0 0 0.6rem 0",
                    color: "#1e1b18",
                  }}
                >
                  {portal.title}
                </h3>

                <p style={{ color: "#57534e", fontSize: "0.92rem", lineHeight: 1.55, margin: "0 0 1.5rem 0" }}>
                  {portal.desc}
                </p>
              </div>

              <Link
                href={portal.href}
                style={{
                  display: "inline-block",
                  padding: "0.7rem 1rem",
                  borderRadius: "8px",
                  background: "#f8f6f2",
                  color: "#1e1b18",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  textDecoration: "none",
                  border: "1px solid #e0d8cb",
                  textAlign: "center",
                  transition: "background 0.2s",
                }}
              >
                {portal.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Sezione Contratti Pubblici Firma Digitale */}
        <div
          style={{
            marginTop: "3rem",
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e7e2d9",
            padding: "1.5rem 2rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <strong style={{ fontSize: "1rem", color: "#1e1b18" }}>
              Moduli Pubblici Firma Digitale Contratti
            </strong>
            <div style={{ color: "#78716c", fontSize: "0.85rem" }}>
              Link diretti protetti da token crittografico univoco inviati ai clienti per la firma digitale.
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.8rem" }}>
            <Link
              href="/contratti/wedding"
              style={{
                padding: "0.55rem 1.1rem",
                borderRadius: "8px",
                border: "1px solid #d6cebf",
                background: "#ffffff",
                color: "#44403c",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Modulo Wedding
            </Link>
            <Link
              href="/contratti/eventi"
              style={{
                padding: "0.55rem 1.1rem",
                borderRadius: "8px",
                border: "1px solid #d6cebf",
                background: "#ffffff",
                color: "#44403c",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Modulo Eventi
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
