"use client";

import React, { useState } from "react";

const PHASES_SHOWCASE = [
  {
    id: "agrumeto",
    name: "L'Agrumeto Storico",
    tagline: "Accoglienza & Gran Buffet di Benvenuto",
    image: "https://laterradegliaranci.it/wp-content/uploads/2024/07/sala-terradegliaranci.jpg",
    description: "Un'oasi verde immersa tra profumi di agrumi napoletani e piante secolari, ideale per accogliere i vostri ospiti con finger food caldi, crudi di mare e cocktail sartoriali.",
    highlights: ["Isole gastronomiche live", "Cocktail bar floreale", "Musica jazz dal vivo", "Atmosfera botanica esclusiva"]
  },
  {
    id: "rito",
    name: "Il Rito Simbolico",
    tagline: "La Promessa immersa nella Natura",
    image: "https://laterradegliaranci.it/wp-content/uploads/2025/01/73dc0729e7c1e25df7e0fb1625acd89f.jpg",
    description: "Scambiatevi le promesse sotto archi botanici su misura, con passerella in corteccia e sedute eleganti per gli ospiti in uno scenario fiabesco tra cielo e collina.",
    highlights: ["Arco floreale personalizzato", "Accompagnamento arpa & violino", "Libretti cerimonia coordinati", "Celebrante bilingue"]
  },
  {
    id: "sala_tufo",
    name: "La Sala Tufo",
    tagline: "Eleganza senza Tempo & Alta Cucina",
    image: "https://laterradegliaranci.it/wp-content/uploads/2025/01/c42f8af69b00ef4678797b3b0241ac2e.jpg",
    description: "Caratterizzata da antiche pareti in tufo napoletano a vista, lampadari scenografici e mise en place ricercate per il momento conviviale curato dai nostri chef.",
    highlights: ["Mise en place sartoriale", "Menu servito a 5 stelle", "Climatizzazione perfetta", "Acustica calibrata"]
  },
  {
    id: "torta",
    name: "Il Taglio della Torta",
    tagline: "Scenografie di Luci & Fontana di Emozioni",
    image: "https://laterradegliaranci.it/wp-content/uploads/2024/07/sala-terradegliaranci.jpg",
    description: "Il momento culminante sotto il cielo stellato del Vomero, circondati da giochi di luce architetturali, fontane fredde e la Wedding Cake creata dai maestri pasticceri.",
    highlights: ["Wedding Cake monumentale", "Fontane luminose fredde", "Buffet di dolci e piccola pasticceria", "Brindisi con champagne"]
  },
  {
    id: "after_party",
    name: "After Party & Dopocena",
    tagline: "Open Bar & DJ Set fino a Notte Fonda",
    image: "https://laterradegliaranci.it/wp-content/uploads/2025/01/73dc0729e7c1e25df7e0fb1625acd89f.jpg",
    description: "La festa continua con bartender dedicati, postazione DJ set, effetti luce disco e corner gastronomici di mezzanotte (panini gourmet, graffette calde).",
    highlights: ["Open Bar illimitato", "DJ Set & Sax live", "Graffette calde all'arancio", "Privé lounge all'aperto"]
  }
];

export default function ProjectBuilderClientePage() {
  const [activePhase, setActivePhase] = useState(PHASES_SHOWCASE[0]);

  return (
    <div style={{ minHeight: "100vh", background: "#1e1b18", color: "#ffffff", fontFamily: "'Outfit', sans-serif" }}>
      {/* Header Schermo Sposi */}
      <header style={{ padding: "1.8rem 3rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #332f2b", background: "rgba(30, 27, 24, 0.95)" }}>
        <div>
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "3px", color: "#e58c2c", fontWeight: 800 }}>
            ESPERIENZA LIVE • LA TERRA DEGLI ARANCI
          </span>
          <h1 style={{ margin: "0.2rem 0 0 0", fontFamily: "Georgia, serif", fontSize: "2rem", color: "#ffffff" }}>
            Il Vostro Matrimonio su Misura
          </h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ background: "#2a2622", padding: "0.5rem 1rem", borderRadius: "12px", border: "1px solid #443e38", fontSize: "0.85rem", color: "#ded7cd" }}>
            ?? Schermo Accoglienza Sposi
          </span>
        </div>
      </header>

      {/* Navigatore Fasi a Schermo Intero */}
      <div style={{ display: "flex", gap: "0.8rem", padding: "1.2rem 3rem", background: "#181513", overflowX: "auto", borderBottom: "1px solid #2a2622" }}>
        {PHASES_SHOWCASE.map((phase) => {
          const isSelected = activePhase.id === phase.id;
          return (
            <button
              key={phase.id}
              onClick={() => setActivePhase(phase)}
              style={{
                padding: "0.7rem 1.4rem",
                borderRadius: "14px",
                background: isSelected ? "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)" : "#24201c",
                color: "#ffffff",
                border: isSelected ? "none" : "1px solid #3a342e",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: isSelected ? "0 6px 18px rgba(229,140,44,0.3)" : "none",
                transition: "all 0.2s ease"
              }}
            >
              {phase.name}
            </button>
          );
        })}
      </div>

      {/* Hero Showcase della Fase Selezionata */}
      <main style={{ padding: "3rem", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "3rem", alignItems: "center" }}>
          
          {/* Foto HD Grande Patinata */}
          <div style={{ borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", border: "1px solid #3a342e", height: "550px", position: "relative" }}>
            <img
              src={activePhase.image}
              alt={activePhase.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2rem", background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}>
              <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 800 }}>
                {activePhase.tagline}
              </span>
              <h2 style={{ margin: "0.3rem 0 0 0", fontSize: "2.2rem", fontFamily: "Georgia, serif" }}>
                {activePhase.name}
              </h2>
            </div>
          </div>

          {/* Dettagli & Punti Chiave */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
            <div>
              <span style={{ textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontSize: "0.85rem", fontWeight: 800 }}>
                L'ATMOSFERA ESCLUSIVA
              </span>
              <h2 style={{ fontSize: "2.5rem", fontFamily: "Georgia, serif", margin: "0.4rem 0 1rem 0", lineHeight: 1.2 }}>
                {activePhase.tagline}
              </h2>
              <p style={{ color: "#c2bcba", fontSize: "1.15rem", lineHeight: 1.6, margin: 0 }}>
                {activePhase.description}
              </p>
            </div>

            <div style={{ background: "#24201c", padding: "1.8rem", borderRadius: "20px", border: "1px solid #3a342e" }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "#e58c2c" }}>
                ? Punti Salienti della Fase
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {activePhase.highlights.map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ color: "#e58c2c", fontSize: "1.2rem" }}>?</span>
                    <span style={{ fontSize: "0.95rem", color: "#ded7cd" }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "1rem 1.5rem", background: "rgba(229,140,44,0.1)", border: "1px solid rgba(229,140,44,0.3)", borderRadius: "16px", display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "1.8rem" }}>??</span>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#fbd38d" }}>
                Tutti gli spazi sono riservati <strong>in esclusiva assoluta</strong> per un unico matrimonio al giorno.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
