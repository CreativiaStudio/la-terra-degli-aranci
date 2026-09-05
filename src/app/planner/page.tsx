"use client";

import React, { useState } from "react";

interface PlannerEvent {
  id: string;
  coppia: string;
  tipo: "wedding" | "privato";
  dataEvento: string;
  ospiti: number;
  spazi: string[];
  rito: string;
  statoAi: boolean;
  telefono: string;
  email: string;
  dossier: {
    palette: { nome: string; colori: string[] };
    stile: string;
    intolleranze: { celiaci: number; vegetariani: number; allergieNote: string };
    cronoprogramma: { ora: string; momento: string; luogo: string; note: string }[];
    musica: { rito: string; ingresso: string; balloSposi: string; torta: string; dj: string };
    fornitori: { ruolo: string; nome: string; telefono: string }[];
    notePlanner: string;
  };
}

const INITIAL_EVENTS: PlannerEvent[] = [
  {
    id: "evt-1",
    coppia: "Marco & Sofia",
    tipo: "wedding",
    dataEvento: "2027-06-19",
    ospiti: 120,
    spazi: ["L'Agrumeto Storico", "La Sala Tufo", "Terrazza Taglio Torta"],
    rito: "Cerimonia Civile nel Giardino delle Promesse",
    statoAi: true,
    telefono: "+39 333 9876543",
    email: "sposi.ai@laterradegliaranci.it",
    dossier: {
      palette: {
        nome: "Agrumi & Lamina d'Oro",
        colori: ["#e58c2c", "#1e3a2f", "#fef3c7", "#ffffff"],
      },
      stile: "Botanico Chic con illuminazione a catene vintage e mise en place in lino naturale",
      intolleranze: {
        celiaci: 4,
        vegetariani: 6,
        allergieNote: "2 ospiti allergici ai crostacei, 1 intollerante al lattosio severo (preparazione cucina dedicata Iovino Banqueting)",
      },
      cronoprogramma: [
        { ora: "17:30", momento: "Arrivo Ospiti & Welcome Drink", luogo: "Agrumeto Storico", note: "Cocktail floreali all'arancio e finger food caldi" },
        { ora: "18:30", momento: "Rito Civile Panoramico", luogo: "Giardino delle Promesse", note: "Arco botanico e archi di violino acustico dal vivo" },
        { ora: "20:00", momento: "Banchetto Placè", luogo: "Sala Tufo", note: "Cena di gala Iovino Banqueting con 2 primi e 1 secondo d'autore" },
        { ora: "22:30", momento: "Taglio della Torta Sotto le Stelle", luogo: "Terrazza Panoramica", note: "Fontane luminose fredde e gran buffet di dolci" },
        { ora: "23:00", momento: "After Party & DJ Set", luogo: "Lounge Agrumeto", note: "Open bar premium e carretto graffette calde all'arancio" },
      ],
      musica: {
        rito: "Pachelbel - Canone in D (Archi)",
        ingresso: "Coldplay - Viva La Vida",
        balloSposi: "Ed Sheeran - Perfect Symphony",
        torta: "Ennio Morricone - Gabriel's Oboe",
        dj: "Deep House / Revival '90 per dopocena",
      },
      fornitori: [
        { ruolo: "Floral Designer", nome: "Fiori & Zagare Napoli", telefono: "338 1122334" },
        { ruolo: "Fotografo", nome: "Studio Fotografico d'Autore", telefono: "339 4455667" },
        { ruolo: "Musicisti Rito", nome: "Quartetto d'Archi Partenope", telefono: "331 7788990" },
        { ruolo: "DJ Set & Service", nome: "TDA Sound Experience", telefono: "335 9900112" },
      ],
      notePlanner:
        "La sposa tiene particolarmente all'atmosfera a lume di candela per il taglio torta. Verificare la disponibilità del carretto graffette prima delle ore 23:00.",
    },
  },
  {
    id: "evt-2",
    coppia: "Roberto Sola & Partner",
    tipo: "wedding",
    dataEvento: "2026-10-15",
    ospiti: 150,
    spazi: ["Tenuta in Esclusiva Totale"],
    rito: "Rito Simbolico al Tramonto",
    statoAi: true,
    telefono: "+39 335 1234567",
    email: "roberto@laterradegliaranci.it",
    dossier: {
      palette: {
        nome: "Verde Bosco & Terracotta",
        colori: ["#1e3a2f", "#c5a059", "#b45309", "#f8f6f0"],
      },
      stile: "Luxury Mediterranean Gala con allestimento sartoriale e cantina vini campani riserva",
      intolleranze: {
        celiaci: 2,
        vegetariani: 8,
        allergieNote: "Tutti i finger food del buffet di benvenuto senza glutine su richiesta",
      },
      cronoprogramma: [
        { ora: "18:00", momento: "Accoglienza Ospiti", luogo: "Agrumeto", note: "Aperitivo con bollicine e ostriche live" },
        { ora: "19:00", momento: "Cerimonia Simbolica", luogo: "Giardino delle Promesse", note: "Musica jazz soft" },
        { ora: "20:30", momento: "Cena di Gala", luogo: "Sala Tufo & Sala Bianca collegate", note: "Menu 4 portate stellato" },
        { ora: "23:00", momento: "Taglio Torta & Fuochi Freddi", luogo: "Terrazza Belvedere", note: "Spettacolo pirotecnico a tempo di musica" },
      ],
      musica: {
        rito: "Ennio Morricone Medley",
        ingresso: "Stevie Wonder - For Once In My Life",
        balloSposi: "Frank Sinatra - The Way You Look Tonight",
        torta: "Andrea Bocelli - Con Te Partirò",
        dj: "Live Sax & DJ Set",
      },
      fornitori: [
        { ruolo: "Floral Designer", nome: "Garden Luxury Design", telefono: "340 1234567" },
        { ruolo: "Service Luci", nome: "Glow & Sound TDA", telefono: "348 7654321" },
      ],
      notePlanner: "Controllo rigoroso tempi di servizio tra cucina Iovino e momenti musicali.",
    },
  },
  {
    id: "evt-3",
    coppia: "Mario Pepe & Elena",
    tipo: "wedding",
    dataEvento: "2026-11-20",
    ospiti: 130,
    spazi: ["Agrumeto", "Sala Bianca", "Terrazza"],
    rito: "Rito Civile Ufficiale",
    statoAi: true,
    telefono: "+39 331 4455667",
    email: "mario.elena@email.it",
    dossier: {
      palette: {
        nome: "Bianco Puro & Oro Spazzolato",
        colori: ["#ffffff", "#d4af37", "#a1a1aa", "#18181b"],
      },
      stile: "Modern Luxury Glamour",
      intolleranze: {
        celiaci: 3,
        vegetariani: 4,
        allergieNote: "1 celiaco severo con piatto sigillato",
      },
      cronoprogramma: [
        { ora: "12:00", momento: "Aperitivo di Benvenuto", luogo: "Agrumeto", note: "Finger food biologici" },
        { ora: "13:30", momento: "Pranzo Nuziale", luogo: "Sala Bianca", note: "Luce naturale diffusa" },
        { ora: "17:00", momento: "Taglio Torta", luogo: "Terrazza", note: "Buffet dolci e distillati" },
      ],
      musica: {
        rito: "Violoncello Solo",
        ingresso: "U2 - Beautiful Day",
        balloSposi: "John Legend - All of Me",
        torta: "Coldplay - A Sky Full of Stars",
        dj: "Commerciale & Latino Dopocena",
      },
      fornitori: [
        { ruolo: "Fotografo", nome: "Emotion Wedding Photo", telefono: "329 1122334" },
      ],
      notePlanner: "Confermare orario arrivo del celebrante civile del Comune di Napoli per le 11:45.",
    },
  },
  {
    id: "evt-4",
    coppia: "Famiglia Sola (Festa Privata)",
    tipo: "privato",
    dataEvento: "2026-09-28",
    ospiti: 85,
    spazi: ["Agrumeto", "Lounge Bar"],
    rito: "Nessun rito (Compleanno & Anniversario)",
    statoAi: false,
    telefono: "+39 338 9988776",
    email: "festa.sola@email.it",
    dossier: {
      palette: {
        nome: "Sunset Glow & Tangerine",
        colori: ["#e58c2c", "#f59e0b", "#1f2937", "#f3f4f6"],
      },
      stile: "Festa Dinamica ad Isole Gastronomiche & Cocktail Bar",
      intolleranze: {
        celiaci: 1,
        vegetariani: 5,
        allergieNote: "Nessuna allergia severa segnalata",
      },
      cronoprogramma: [
        { ora: "20:00", momento: "Accoglienza & Cocktail di Benvenuto", luogo: "Agrumeto", note: "Musica lounge con DJ set" },
        { ora: "21:00", momento: "Isole Gastronomiche Live", luogo: "Agrumeto", note: "Pizze fritte, primi caldi e fritti della tradizione" },
        { ora: "23:00", momento: "Brindisi & Torta Scenografica", luogo: "Terrazza", note: "Spettacolo luci" },
      ],
      musica: {
        rito: "N/A",
        ingresso: "Dua Lipa - Levitating",
        balloSposi: "N/A",
        torta: "Queen - Don't Stop Me Now",
        dj: "Dance 80/90/2000",
      },
      fornitori: [
        { ruolo: "DJ", nome: "DJ Resident TDA", telefono: "333 5544332" },
      ],
      notePlanner: "Configurare l'open bar fin dalle ore 20:30 per accompagnare il buffet a isole.",
    },
  },
];

export default function PlannerPage() {
  const [events, setEvents] = useState<PlannerEvent[]>(INITIAL_EVENTS);
  const [activeFilter, setActiveFilter] = useState<"tutti" | "meno6mesi" | "wedding" | "privato">("tutti");
  const [selectedEventForDossier, setSelectedEventForDossier] = useState<PlannerEvent | null>(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [notesSavedBanner, setNotesSavedBanner] = useState(false);

  // Calcolo giorni all'evento
  const getDaysLeft = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const openDossier = (evt: PlannerEvent) => {
    setSelectedEventForDossier(evt);
    setEditingNotes(evt.dossier.notePlanner);
    setNotesSavedBanner(false);
  };

  const saveNotes = () => {
    if (!selectedEventForDossier) return;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEventForDossier.id
          ? { ...e, dossier: { ...e.dossier, notePlanner: editingNotes } }
          : e
      )
    );
    setSelectedEventForDossier((prev) =>
      prev ? { ...prev, dossier: { ...prev.dossier, notePlanner: editingNotes } } : null
    );
    setNotesSavedBanner(true);
    setTimeout(() => setNotesSavedBanner(false), 3000);
  };

  const filteredEvents = events.filter((evt) => {
    const days = getDaysLeft(evt.dataEvento);
    if (activeFilter === "meno6mesi") return days <= 180 && evt.tipo === "wedding";
    if (activeFilter === "wedding") return evt.tipo === "wedding";
    if (activeFilter === "privato") return evt.tipo === "privato";
    return true;
  });

  const activeUnder6MonthsCount = events.filter(
    (e) => getDaysLeft(e.dataEvento) <= 180 && e.tipo === "wedding"
  ).length;

  return (
    <div>
      {/* Intestazione Sezione */}
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: "Georgia, 'Playfair Display', serif",
            fontSize: "2rem",
            margin: "0 0 0.5rem 0",
            color: "#1e1b18",
          }}
        >
          Panoramica Eventi & Dossier 360° Sposi
        </h2>
        <p style={{ color: "#57534e", fontSize: "1rem", margin: 0 }}>
          Coordinamento operativo a <strong>-6 mesi dall&apos;evento</strong>: consulta il dossier già alimentato silenziosamente dall&apos;AI Concierge durante i primi mesi e gestisci la regia con la coppia.
        </p>
      </div>

      {/* KPI Bar Planner */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.2rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "1.4rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            border: "1px solid #e7e2d9",
          }}
        >
          <div style={{ color: "#78716c", fontSize: "0.85rem", fontWeight: 600 }}>
            EVENTI ASSEGNATI
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#1e1b18", margin: "0.3rem 0" }}>
            {events.length}
          </div>
          <small style={{ color: "#059669", fontWeight: 600 }}>Matrimoni & Feste TDA</small>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "1.4rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            border: "2px solid #8b5cf6",
          }}
        >
          <div style={{ color: "#8b5cf6", fontSize: "0.85rem", fontWeight: 700 }}>
            FINESTRA -6 MESI ATTIVA
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#6b21a8", margin: "0.3rem 0" }}>
            {activeUnder6MonthsCount}
          </div>
          <small style={{ color: "#6b21a8", fontWeight: 600 }}>Subentro Priorità Alta</small>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "1.4rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            border: "1px solid #e7e2d9",
          }}
        >
          <div style={{ color: "#78716c", fontSize: "0.85rem", fontWeight: 600 }}>
            PROSSIMI 45 GIORNI
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#e58c2c", margin: "0.3rem 0" }}>
            {events.filter((e) => getDaysLeft(e.dataEvento) <= 45).length}
          </div>
          <small style={{ color: "#b45309", fontWeight: 600 }}>Regia Finale & Scalette</small>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "1.4rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            border: "1px solid #e7e2d9",
          }}
        >
          <div style={{ color: "#78716c", fontSize: "0.85rem", fontWeight: 600 }}>
            DOSSIER AI PRE-POPOLATI
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#10b981", margin: "0.3rem 0" }}>
            {events.filter((e) => e.statoAi).length}
          </div>
          <small style={{ color: "#047857", fontWeight: 600 }}>Zero Domande Duplicate</small>
        </div>
      </div>

      {/* Filtri Rapidi */}
      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { key: "tutti", label: "Tutti gli Eventi" },
          { key: "meno6mesi", label: "⏳ Matrimoni a -6 Mesi" },
          { key: "wedding", label: "👰 Tutti i Matrimoni" },
          { key: "privato", label: "🎉 Feste ed Eventi Privati" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActiveFilter(f.key as any)}
            style={{
              minHeight: "44px",
              padding: "0 1.2rem",
              borderRadius: "10px",
              border: activeFilter === f.key ? "none" : "1px solid #d6cebf",
              background: activeFilter === f.key ? "#1e3a2f" : "#ffffff",
              color: activeFilter === f.key ? "#ffffff" : "#44403c",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Elenco Card Eventi */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", marginBottom: "3rem" }}>
        {filteredEvents.map((evt) => {
          const daysLeft = getDaysLeft(evt.dataEvento);
          const isPriority = daysLeft <= 180;
          return (
            <div
              key={evt.id}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "1.5rem 2rem",
                boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                border: isPriority ? "2px solid #e58c2c" : "1px solid #e7e2d9",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1.5rem",
              }}
            >
              <div style={{ flex: 2, minWidth: "280px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: evt.tipo === "wedding" ? "#fdf2f8" : "#ecfdf5",
                      color: evt.tipo === "wedding" ? "#db2777" : "#059669",
                      border: `1px solid ${evt.tipo === "wedding" ? "#fbcfe8" : "#a7f3d0"}`,
                    }}
                  >
                    {evt.tipo === "wedding" ? "MATRIMONIO" : "EVENTO PRIVATO"}
                  </span>

                  {evt.statoAi && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      🤖 Dossier AI Pre-Compilato
                    </span>
                  )}
                </div>

                <h3
                  style={{
                    fontFamily: "Georgia, 'Playfair Display', serif",
                    fontSize: "1.5rem",
                    margin: "0 0 0.4rem 0",
                    color: "#1e1b18",
                  }}
                >
                  {evt.coppia}
                </h3>

                <div style={{ color: "#57534e", fontSize: "0.92rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                  <span>📅 Data: <strong>{evt.dataEvento}</strong></span>
                  <span>👥 Ospiti: <strong>{evt.ospiti} presunti</strong></span>
                  <span>📍 Spazi: <strong>{evt.spazi.join(", ")}</strong></span>
                </div>
              </div>

              {/* Countdown Badge */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isPriority ? "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)" : "#f8f6f2",
                  border: isPriority ? "1px solid #fbd38d" : "1px solid #e7e2d9",
                  padding: "0.8rem 1.4rem",
                  borderRadius: "12px",
                  minWidth: "120px",
                }}
              >
                <span
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 800,
                    color: isPriority ? "#e58c2c" : "#57534e",
                    lineHeight: 1,
                  }}
                >
                  {daysLeft}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: isPriority ? "#b45309" : "#78716c",
                    marginTop: "4px",
                  }}
                >
                  Giorni Rimasti
                </span>
              </div>

              {/* Pulsante Apri Dossier */}
              <div>
                <button
                  type="button"
                  onClick={() => openDossier(evt)}
                  style={{
                    minHeight: "48px",
                    padding: "0 1.6rem",
                    borderRadius: "10px",
                    border: "none",
                    background: "#1e3a2f",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    boxShadow: "0 3px 10px rgba(30,58,47,0.2)",
                  }}
                >
                  <span>📋</span>
                  <span>Apri Dossier 360°</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL / DRAWER: DOSSIER 360° SPOSI */}
      {/* ========================================================================= */}
      {selectedEventForDossier && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 200,
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "960px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header Modale */}
            <div
              style={{
                padding: "1.5rem 2rem",
                borderBottom: "1px solid #e7e2d9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                background: "#faf8f5",
                borderTopLeftRadius: "20px",
                borderTopRightRadius: "20px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", color: "#8b5cf6", fontWeight: 700 }}>
                    DOSSIER 360° REGIA EVENTO
                  </span>
                  <span style={{ fontSize: "0.75rem", background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                    🤖 Dati Alimentati dall&apos;AI Concierge
                  </span>
                </div>
                <h2
                  style={{
                    fontFamily: "Georgia, 'Playfair Display', serif",
                    fontSize: "1.8rem",
                    margin: "0 0 0.3rem 0",
                    color: "#1e1b18",
                  }}
                >
                  {selectedEventForDossier.coppia}
                </h2>
                <div style={{ color: "#57534e", fontSize: "0.9rem" }}>
                  Data: <strong>{selectedEventForDossier.dataEvento}</strong> • Rito: <strong>{selectedEventForDossier.rito}</strong>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <a
                  href={`https://wa.me/${selectedEventForDossier.telefono.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    minHeight: "44px",
                    padding: "0 1.2rem",
                    borderRadius: "10px",
                    border: "none",
                    background: "#25d366",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    textDecoration: "none",
                  }}
                >
                  <span>💬</span>
                  <span>WhatsApp Sposi</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedEventForDossier(null)}
                  style={{
                    minHeight: "44px",
                    width: "44px",
                    borderRadius: "50%",
                    border: "1px solid #d6cebf",
                    background: "#ffffff",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenuto Modale */}
            <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Sezione 1: Palette Colori & Stile */}
              <div>
                <h3 style={{ fontSize: "1.15rem", color: "#1e3a2f", margin: "0 0 0.8rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>🎨</span>
                  <span>Palette Cromatica & Allestimenti Concordati</span>
                </h3>
                <div style={{ background: "#fbf9f5", padding: "1.2rem", borderRadius: "12px", border: "1px solid #e7e2d9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.8rem" }}>
                    <strong>{selectedEventForDossier.dossier.palette.nome}:</strong>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {selectedEventForDossier.dossier.palette.colori.map((c, i) => (
                        <div
                          key={i}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: c,
                            border: "2px solid #ffffff",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                          }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                  <p style={{ margin: 0, color: "#44403c", fontSize: "0.95rem" }}>
                    {selectedEventForDossier.dossier.stile}
                  </p>
                </div>
              </div>

              {/* Sezione 2: Intolleranze & Celiaci */}
              <div>
                <h3 style={{ fontSize: "1.15rem", color: "#b91c1c", margin: "0 0 0.8rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>🥗</span>
                  <span>Allergie, Intolleranze & Regime Celiaci (Iovino Banqueting)</span>
                </h3>
                <div style={{ background: "#fef2f2", padding: "1.2rem", borderRadius: "12px", border: "1px solid #fecaca" }}>
                  <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.6rem" }}>
                    <div style={{ color: "#991b1b", fontWeight: 700, fontSize: "0.95rem" }}>
                      🌾 Celiaci Certificati: <strong>{selectedEventForDossier.dossier.intolleranze.celiaci} ospiti</strong>
                    </div>
                    <div style={{ color: "#991b1b", fontWeight: 700, fontSize: "0.95rem" }}>
                      🥦 Vegetariani / Vegani: <strong>{selectedEventForDossier.dossier.intolleranze.vegetariani} ospiti</strong>
                    </div>
                  </div>
                  <div style={{ color: "#7f1d1d", fontSize: "0.92rem", lineHeight: 1.5 }}>
                    <strong>Note Operative Cucina:</strong> {selectedEventForDossier.dossier.intolleranze.allergieNote}
                  </div>
                </div>
              </div>

              {/* Sezione 3: Cronoprogramma & Regia Oraria */}
              <div>
                <h3 style={{ fontSize: "1.15rem", color: "#1e3a2f", margin: "0 0 0.8rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>⏰</span>
                  <span>Cronoprogramma & Scaletta della Giornata</span>
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {selectedEventForDossier.dossier.cronoprogramma.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        padding: "0.9rem 1.2rem",
                        background: "#fbf9f5",
                        borderRadius: "10px",
                        border: "1px solid #e7e2d9",
                      }}
                    >
                      <span
                        style={{
                          background: "#e58c2c",
                          color: "#ffffff",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          minWidth: "52px",
                          textAlign: "center",
                        }}
                      >
                        {c.ora}
                      </span>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: "0.95rem", color: "#1e1b18" }}>{c.momento}</strong>
                        <div style={{ fontSize: "0.85rem", color: "#57534e" }}>
                          Spazio: <em>{c.luogo}</em> • {c.note}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sezione 4: Musica & Playlist */}
              <div>
                <h3 style={{ fontSize: "1.15rem", color: "#1e3a2f", margin: "0 0 0.8rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>🎵</span>
                  <span>Scelte Musicali & Momenti Chiave</span>
                </h3>
                <div style={{ background: "#fbf9f5", padding: "1.2rem", borderRadius: "12px", border: "1px solid #e7e2d9", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.8rem" }}>
                  <div>
                    <small style={{ color: "#78716c", display: "block" }}>Musica Rito:</small>
                    <strong style={{ fontSize: "0.9rem" }}>{selectedEventForDossier.dossier.musica.rito}</strong>
                  </div>
                  <div>
                    <small style={{ color: "#78716c", display: "block" }}>Ingresso Sala:</small>
                    <strong style={{ fontSize: "0.9rem" }}>{selectedEventForDossier.dossier.musica.ingresso}</strong>
                  </div>
                  <div>
                    <small style={{ color: "#78716c", display: "block" }}>Primo Ballo Sposi:</small>
                    <strong style={{ fontSize: "0.9rem" }}>{selectedEventForDossier.dossier.musica.balloSposi}</strong>
                  </div>
                  <div>
                    <small style={{ color: "#78716c", display: "block" }}>Taglio Torta:</small>
                    <strong style={{ fontSize: "0.9rem" }}>{selectedEventForDossier.dossier.musica.torta}</strong>
                  </div>
                </div>
              </div>

              {/* Sezione 5: Fornitori Coinvolti */}
              <div>
                <h3 style={{ fontSize: "1.15rem", color: "#1e3a2f", margin: "0 0 0.8rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>💐</span>
                  <span>Fornitori Esterni & Contatti</span>
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.8rem" }}>
                  {selectedEventForDossier.dossier.fornitori.map((f, i) => (
                    <div key={i} style={{ padding: "0.8rem 1rem", background: "#fbf9f5", borderRadius: "10px", border: "1px solid #e7e2d9" }}>
                      <div style={{ fontSize: "0.78rem", color: "#e58c2c", fontWeight: 700, textTransform: "uppercase" }}>
                        {f.ruolo}
                      </div>
                      <strong style={{ fontSize: "0.92rem", color: "#1e1b18", display: "block" }}>{f.nome}</strong>
                      <small style={{ color: "#57534e" }}>Tel: {f.telefono}</small>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sezione 6: Note Operative Planner (Modificabili) */}
              <div>
                <h3 style={{ fontSize: "1.15rem", color: "#8b5cf6", margin: "0 0 0.8rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>📝</span>
                  <span>Note di Regia Elena (Wedding Planner)</span>
                </h3>
                <textarea
                  rows={4}
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Inserisci note operative, verifiche da compiere o accordi presi durante la call di coordinamento a -6 mesi..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "0.8rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid #d6cebf",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                    marginBottom: "0.8rem",
                  }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <button
                    type="button"
                    onClick={saveNotes}
                    style={{
                      minHeight: "44px",
                      padding: "0 1.4rem",
                      borderRadius: "8px",
                      border: "none",
                      background: "#8b5cf6",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                    }}
                  >
                    Salva Note Dossier
                  </button>
                  {notesSavedBanner && (
                    <span style={{ color: "#059669", fontWeight: 600, fontSize: "0.85rem" }}>
                      ✓ Note salvate con successo!
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Modale */}
            <div
              style={{
                padding: "1.2rem 2rem",
                borderTop: "1px solid #e7e2d9",
                background: "#faf8f5",
                borderBottomLeftRadius: "20px",
                borderBottomRightRadius: "20px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
              }}
            >
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  minHeight: "44px",
                  padding: "0 1.2rem",
                  borderRadius: "8px",
                  border: "1px solid #d6cebf",
                  background: "#ffffff",
                  color: "#44403c",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                📄 Stampa Foglio Regia Staff
              </button>
              <button
                type="button"
                onClick={() => setSelectedEventForDossier(null)}
                style={{
                  minHeight: "44px",
                  padding: "0 1.5rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "#1e1b18",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Chiudi Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
