"use client";

import React, { useState } from "react";
import { saveWeddingDiaryAction } from "../actions";

interface WeddingDiaryProps {
  clientId: string;
  quoteId?: string;
  initialData?: any;
  lang?: "it" | "en";
  isReadOnly?: boolean;
}

export default function WeddingDiaryForm({ clientId, quoteId, initialData, lang = "it", isReadOnly = false }: WeddingDiaryProps) {
  const isEng = lang === "en";

  const [palette, setPalette] = useState(initialData?.palette || "Terracotta & Citrus (Caldi Agrumi)");
  const [style, setStyle] = useState(initialData?.style || "Country Chic & Naturale");
  const [preferredSpaces, setPreferredSpaces] = useState<string[]>(initialData?.preferred_spaces || ["Giardino degli Aranci", "Sala Bianca"]);
  const [dietaryNotes, setDietaryNotes] = useState(initialData?.dietary_notes || "");
  const [musicPreferences, setMusicPreferences] = useState(initialData?.music_preferences || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const palettes = [
    { id: "Terracotta & Citrus (Caldi Agrumi)", title: "Terracotta & Citrus", desc: "Agrumi di Sicilia, arancio caldo, foglia d'olivo", bg: "#f97316" },
    { id: "Avorio Classico & Oro", title: "Ivory & Gold Elegance", desc: "Toni candidi, bianco avorio e finiture dorate", bg: "#eab308" },
    { id: "Botanic Green & Eucalyptus", title: "Botanic Green", desc: "Verde salvia, eucalipto e bosco naturale", bg: "#16a34a" },
    { id: "Sunset Blush & Rose", title: "Sunset Rose", desc: "Rosa cipria, tramonto napoletano e toni caldi", bg: "#ec4899" }
  ];

  const styles = [
    "Country Chic & Naturale",
    "Elegante & Formale Classic",
    "Modern Minimalist & Sophisticated",
    "Boho Glam & Lights Garden"
  ];

  const spacesOptions = [
    "Giardino degli Aranci (Cocktail & Aperitivi)",
    "Sala Bianca (Pranzo/Cena Panoramica)",
    "Sala Tufo (After Party & Disco)",
    "Boschetto Panoramico (Rito Simbolico)"
  ];

  const toggleSpace = (space: string) => {
    if (preferredSpaces.includes(space)) {
      setPreferredSpaces(preferredSpaces.filter(s => s !== space));
    } else {
      setPreferredSpaces([...preferredSpaces, space]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await saveWeddingDiaryAction({
      client_id: clientId,
      quote_id: quoteId,
      palette,
      style,
      preferred_spaces: preferredSpaces,
      dietary_notes: dietaryNotes,
      music_preferences: musicPreferences,
      notes
    });

    setSaving(false);
    if (res.success) {
      setMessage({
        type: "success",
        text: isEng
          ? "✨ Your Wedding Diary preferences have been sent to Roberto & La Terra degli Aranci team!"
          : "✨ Le vostre preferenze sono state inviate direttamente a Roberto Sola e allo staff de La Terra degli Aranci!"
      });
    } else {
      setMessage({
        type: "error",
        text: isEng ? "Unable to save preferences. Please try again." : "Errore durante il salvataggio. Riprova."
      });
    }
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "18px", padding: "2.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #eee7de" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700 }}>
            {isReadOnly 
              ? (isEng ? "MEMORY CAPSULE" : "CAPSULA DEL TEMPO") 
              : (isEng ? "PREFERENCES & ORGANIZATION" : "PREFERENZE & ORGANIZZAZIONE")}
          </span>
          <h2 style={{ fontSize: "1.65rem", color: "#1e1b18", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            📖 {isReadOnly ? (isEng ? "Your Wedding Diary Archive" : "Archivio del tuo Wedding Diary") : (isEng ? "Your Wedding Diary" : "Il tuo Wedding Diary")}
          </h2>
        </div>
        {!isReadOnly && (
          <div style={{ background: "#f0fdf4", color: "#166534", padding: "0.5rem 1rem", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600 }}>
            {isEng ? "Live Sync with Staff" : "Sincronizzato con lo Staff"}
          </div>
        )}
      </div>

      <p style={{ color: "#6a6764", fontSize: "0.95rem", marginBottom: "2rem", lineHeight: 1.6 }}>
        {isReadOnly 
          ? (isEng ? "Relive the choices and details that made your special day unique." : "Rivivi le scelte e i dettagli che hanno reso unico il vostro giorno speciale a La Terra degli Aranci.")
          : (isEng
              ? "Use this space to share your preferences on colors, styles, menu, and music. Roberto and the staff will use these notes to design your perfect event."
              : "Usa questo spazio per annotare le tue preferenze su colori, stile, menu e musica. Roberto e lo staff useranno queste note per progettare l'evento perfetto.")}
      </p>

      {message && (
        <div style={{
          padding: "1rem 1.2rem",
          borderRadius: "10px",
          marginBottom: "1.5rem",
          background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
          color: message.type === "success" ? "#166534" : "#991b1b",
          border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          fontWeight: 500,
          fontSize: "0.95rem"
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        <div>
          <label style={{ fontSize: "1.05rem", fontWeight: 600, color: "#1e1b18", display: "block", marginBottom: "0.8rem" }}>
            🎨 {isEng ? "Favorite Color Palette" : "Palette Colori & Atmosfera"}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {palettes.map((p) => {
              const isSelected = palette === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => !isReadOnly && setPalette(p.id)}
                  style={{
                    padding: "1.2rem",
                    borderRadius: "12px",
                    border: `2px solid ${isSelected ? "#e58c2c" : "#e5e0d8"}`,
                    background: isSelected ? "#fffaf4" : "#ffffff",
                    cursor: isReadOnly ? "default" : "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: p.bg }}></div>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1e1b18" }}>{p.title}</span>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#777", margin: 0 }}>{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ fontSize: "1.05rem", fontWeight: 600, color: "#1e1b18", display: "block", marginBottom: "0.8rem" }}>
            ✨ {isEng ? "Event Style & Mood" : "Stile dell'Evento & Concept"}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.8rem" }}>
            {styles.map((s) => {
              const isSelected = style === s;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => setStyle(s)}
                  style={{
                    padding: "0.8rem 1rem",
                    borderRadius: "10px",
                    border: `1px solid ${isSelected ? "#e58c2c" : "#ded7cd"}`,
                    background: isSelected ? "#e58c2c" : "#faf8f5",
                    color: isSelected ? "#ffffff" : "#333",
                    fontWeight: isSelected ? 600 : 400,
                    cursor: isReadOnly ? "default" : "pointer",
                    textAlign: "center",
                    fontSize: "0.9rem"
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ fontSize: "1.05rem", fontWeight: 600, color: "#1e1b18", display: "block", marginBottom: "0.8rem" }}>
            🏛️ {isEng ? "Preferred Villa Spaces" : "Ambienti della Villa Preferiti"}
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {spacesOptions.map((space) => {
              const isChecked = preferredSpaces.includes(space);
              return (
                <label
                  key={space}
                  onClick={() => toggleSpace(space)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    padding: "0.85rem 1.2rem",
                    borderRadius: "10px",
                    background: isChecked ? "#fcf6ed" : "#faf9f7",
                    border: `1px solid ${isChecked ? "#f5d0a6" : "#eee8df"}`,
                    cursor: isReadOnly ? "default" : "pointer",
                    fontSize: "0.92rem",
                    color: "#2c2a27"
                  }}
                >
                  <input type="checkbox" disabled={isReadOnly} checked={isChecked} onChange={() => {}} style={{ accentColor: "#e58c2c", width: "18px", height: "18px" }} />
                  <span>{space}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ fontSize: "1.05rem", fontWeight: 600, color: "#1e1b18", display: "block", marginBottom: "0.5rem" }}>
            🥗 {isEng ? "Dietary Requirements & Celiac Guests" : "Intolleranze Alimentari, Celiaci & Menu Speciali"}
          </label>
          <textarea
            disabled={isReadOnly}
            rows={3}
            value={dietaryNotes}
            onChange={(e) => setDietaryNotes(e.target.value)}
            placeholder={isEng ? "e.g. 2 Celiacs (table 4), 1 Vegetarian..." : "Es. 3 Celiaci (tavolo parenti), 2 Vegetariani, 1 allergia a frutta a guscio..."}
            style={{ width: "100%", padding: "0.85rem", borderRadius: "8px", border: "1px solid #ded7cd", fontFamily: "inherit", fontSize: "0.95rem", background: isReadOnly ? "#f9f9f9" : "#fff" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "1.05rem", fontWeight: 600, color: "#1e1b18", display: "block", marginBottom: "0.5rem" }}>
            🎵 {isEng ? "Music & Key Moments" : "Musica, DJ Set & Canzoni dei Momenti Clou"}
          </label>
          <textarea
            disabled={isReadOnly}
            rows={3}
            value={musicPreferences}
            onChange={(e) => setMusicPreferences(e.target.value)}
            placeholder={isEng ? "First dance song, cake cutting song, music genres..." : "Canzone ingresso sposi, brano taglio torta, generi preferiti per after party in Sala Tufo..."}
            style={{ width: "100%", padding: "0.85rem", borderRadius: "8px", border: "1px solid #ded7cd", fontFamily: "inherit", fontSize: "0.95rem", background: isReadOnly ? "#f9f9f9" : "#fff" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "1.05rem", fontWeight: 600, color: "#1e1b18", display: "block", marginBottom: "0.5rem" }}>
            💬 {isEng ? "Special Requests for Roberto & Location Team" : "Note o Desideri Particolari per Roberto Sola & il Team"}
          </label>
          <textarea
            disabled={isReadOnly}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isEng ? "Any extra details or custom requests..." : "Es. Desideriamo organizzare un piccolo benvenuto per ospiti che arrivano in anticipo dall'Inghilterra..."}
            style={{ width: "100%", padding: "0.85rem", borderRadius: "8px", border: "1px solid #ded7cd", fontFamily: "inherit", fontSize: "0.95rem", background: isReadOnly ? "#f9f9f9" : "#fff" }}
          />
        </div>

        {/* Pulsante Salva */}
        {!isReadOnly && (
          <button
            type="submit"
            disabled={saving}
            style={{
              background: "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
              color: "#ffffff",
              padding: "1rem 2rem",
              fontSize: "1.05rem",
              fontWeight: 600,
              borderRadius: "12px",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 6px 18px rgba(229,140,44,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.8rem"
            }}
          >
            {saving ? (isEng ? "Saving..." : "Salvataggio in corso...") : (isEng ? "💾 Save Preferences to Wedding Diary" : "💾 Salva nel Wedding Diary")}
          </button>
        )}

      </form>
    </div>
  );
}
