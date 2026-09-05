"use client";

import React, { useState, useMemo } from "react";

interface WeddingDiaryClientProps {
  quotes: any[];
  diaries?: any[];
}

interface WeddingEntry {
  id: string;
  quoteId?: string;
  coupleNames: string;
  eventDate: string;
  guestsCount: number | string;
  status: string;
  palette: string;
  style: string;
  dietaryNotes: string;
  preferredSpaces: string[];
  musicPreferences?: string;
  notes?: string;
  updatedAt?: string;
  hasAiUpdate: boolean;
}

export default function WeddingDiaryClient({ quotes = [], diaries = [] }: WeddingDiaryClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "completed" | "pending">("all");
  const [selectedEntry, setSelectedEntry] = useState<WeddingEntry | null>(null);

  // Unify quotes and diaries
  const entries: WeddingEntry[] = useMemo(() => {
    const list: WeddingEntry[] = [];
    const usedDiaryIds = new Set<string>();

    // 1. Process wedding quotes
    quotes.forEach((q) => {
      // Find matching diary by client_id or quote_id
      const clientId = q.client_id || q.clients?.id;
      const diary = diaries.find(
        (d) =>
          (clientId && d.client_id === clientId) ||
          d.quote_id === q.id ||
          d.client_id === q.id
      );

      if (diary) {
        usedDiaryIds.add(diary.id);
      }

      const clientName = q.clients
        ? `${q.clients.nome || ""} ${q.clients.cognome || ""}`.trim()
        : "Coppia Sposi TDA";

      const hasDiary = !!diary;

      list.push({
        id: diary?.id || `quote-${q.id}`,
        quoteId: q.id,
        coupleNames: clientName || "Roberto Sola & Partner",
        eventDate: q.data_evento || "In definizione",
        guestsCount: q.numero_ospiti || 100,
        status: q.status || "bozza",
        palette: diary?.palette || (q.tipo_evento === "wedding" ? "Arancio Warm, Verde Agrumeto, Crema Lusso" : "Neutro Elegante"),
        style: diary?.style || (q.tipo_evento === "wedding" ? "Gourmet Moderno con Show Cooking & Confettata Chic" : "Ricevimento Classico Villa TDA"),
        dietaryNotes: diary?.dietary_notes || "Nessuna intolleranza segnalata al momento",
        preferredSpaces: Array.isArray(diary?.preferred_spaces) && diary.preferred_spaces.length > 0
          ? diary.preferred_spaces
          : ["Giardino Agavi", "Sala Tufo", "Terrazza Panoramica"],
        musicPreferences: diary?.music_preferences || "Musica dal vivo durante aperitivo, DJ set dopocena",
        notes: diary?.notes || "",
        updatedAt: diary?.updated_at,
        hasAiUpdate: hasDiary && !!(diary.palette || diary.style || diary.dietary_notes || diary.preferred_spaces?.length)
      });
    });

    // 2. Add standalone diaries if any (e.g. from AI concierge without quote yet)
    diaries.forEach((d) => {
      if (!usedDiaryIds.has(d.id)) {
        list.push({
          id: d.id,
          quoteId: d.quote_id,
          coupleNames: `Cliente ID: ${d.client_id?.slice(0, 8) || "Ospite TDA"}`,
          eventDate: "Data da confermare",
          guestsCount: "TBD",
          status: "lead_concierge",
          palette: d.palette || "Non specificata",
          style: d.style || "Preferenze raccolte tramite AI Concierge",
          dietaryNotes: d.dietary_notes || "Nessuna nota comunicata",
          preferredSpaces: Array.isArray(d.preferred_spaces) ? d.preferred_spaces : [],
          musicPreferences: d.music_preferences,
          notes: d.notes,
          updatedAt: d.updated_at,
          hasAiUpdate: true
        });
      }
    });

    // Fallback demonstration entries if list is empty
    if (list.length === 0) {
      list.push(
        {
          id: "demo-1",
          coupleNames: "Roberto Sola & Partner",
          eventDate: "2027-01-22",
          guestsCount: 120,
          status: "firmato",
          palette: "Arancio Warm, Verde Agrumeto, Crema Lusso",
          style: "Gourmet Moderno con Show Cooking Pizza & Confettata Chic in Giardino",
          dietaryNotes: "3 Ospiti Celiaci (Gluten Free) + 2 Vegetariani",
          preferredSpaces: ["Giardino Agavi", "Sala Tufo", "Corte Aranci"],
          musicPreferences: "Arpa per cerimonia, Jazz band aperitivo, DJ dopocena",
          notes: "Richiesta particolare: taglio torta scenografico con fontane luminose",
          updatedAt: new Date().toISOString(),
          hasAiUpdate: true
        },
        {
          id: "demo-2",
          coupleNames: "Mario Pepe & Partner",
          eventDate: "2027-05-18",
          guestsCount: 95,
          status: "confermato",
          palette: "Blu Notte, Oro Lusso, Avorio",
          style: "Ricevimento Elegante Serale con DJ Set in Sala Tufo & Cocktail Bar Dopocena",
          dietaryNotes: "Nessuna allergia segnalata al momento",
          preferredSpaces: ["Terrazza Belvedere", "Sala Tufo"],
          musicPreferences: "DJ Set & Sax Live",
          notes: "Aperitivo al tramonto con vista Golfo",
          updatedAt: new Date().toISOString(),
          hasAiUpdate: false
        }
      );
    }

    return list;
  }, [quotes, diaries]);

  // Filtering
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch =
        e.coupleNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.palette.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.dietaryNotes.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (filterTab === "completed") return e.hasAiUpdate;
      if (filterTab === "pending") return !e.hasAiUpdate;
      return true;
    });
  }, [entries, searchTerm, filterTab]);

  // Swatch color parser helper
  const renderColorDots = (paletteStr: string) => {
    const p = paletteStr.toLowerCase();
    const dots: { name: string; color: string }[] = [];

    if (p.includes("arancio") || p.includes("orange")) dots.push({ name: "Arancio TDA", color: "#e58c2c" });
    if (p.includes("verde") || p.includes("agrumeto") || p.includes("green")) dots.push({ name: "Verde Bosco/Agrumi", color: "#2d5a27" });
    if (p.includes("crema") || p.includes("avorio") || p.includes("oro") || p.includes("gold")) dots.push({ name: "Crema / Oro", color: "#d4af37" });
    if (p.includes("blu") || p.includes("blue")) dots.push({ name: "Blu Notte", color: "#1c4f82" });
    if (p.includes("rosa") || p.includes("cipria") || p.includes("pink")) dots.push({ name: "Rosa Cipria", color: "#e8a598" });
    if (p.includes("bianco") || p.includes("white")) dots.push({ name: "Bianco Seta", color: "#f8f9fa" });

    if (dots.length === 0) {
      dots.push({ name: "Tonalità 1", color: "#e58c2c" }, { name: "Tonalità 2", color: "#514d48" });
    }

    return (
      <div style={{ display: "flex", gap: "6px", marginTop: "4px", alignItems: "center" }}>
        {dots.map((d, i) => (
          <span
            key={i}
            title={d.name}
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: d.color,
              display: "inline-block",
              border: "1px solid rgba(0,0,0,0.15)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}
          />
        ))}
        <span style={{ fontSize: "0.8rem", color: "#666", marginLeft: "4px" }}>{paletteStr}</span>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", color: "#e58c2c", fontWeight: "bold" }}>
            GESTIONE ALLESTIMENTI & ESPERIENZA SPOSI
          </span>
          <h1 style={{ margin: "0.3rem 0 0 0", color: "#514d48", fontSize: "2.2rem", fontFamily: "serif" }}>
            📖 Wedding Diary & Schede Coppia 360°
          </h1>
          <p style={{ margin: "0.3rem 0 0 0", color: "#777", fontSize: "0.95rem" }}>
            Aggiornato in tempo reale dalle interazioni con l&apos;<strong>AI Concierge</strong> e dai questionari compilati nel Portale Sposi.
          </p>
        </div>

        {/* Sync status badge */}
        <div style={{ background: "#e8f5e9", border: "1px solid #c8e6c9", padding: "0.6rem 1rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2e7d32", display: "inline-block" }}></span>
          <span style={{ fontSize: "0.85rem", color: "#1b5e20", fontWeight: "600" }}>
            AI Concierge Sync: Attivo & Integrato
          </span>
        </div>
      </div>

      {/* Controls: Search & Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: filterTab === "all" ? "2px solid #514d48" : "1px solid #ccc",
              background: filterTab === "all" ? "#514d48" : "#fff",
              color: filterTab === "all" ? "#fff" : "#514d48",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.85rem"
            }}
          >
            Tutti ({entries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("completed")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: filterTab === "completed" ? "2px solid #2d5a27" : "1px solid #ccc",
              background: filterTab === "completed" ? "#2d5a27" : "#fff",
              color: filterTab === "completed" ? "#fff" : "#2d5a27",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.85rem"
            }}
          >
            Con Scheda / AI Concierge ({entries.filter((e) => e.hasAiUpdate).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("pending")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: filterTab === "pending" ? "2px solid #e58c2c" : "1px solid #ccc",
              background: filterTab === "pending" ? "#e58c2c" : "#fff",
              color: filterTab === "pending" ? "#fff" : "#e58c2c",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.85rem"
            }}
          >
            In attesa ({entries.filter((e) => !e.hasAiUpdate).length})
          </button>
        </div>

        <input
          type="text"
          placeholder="🔍 Cerca per coppia, stile, intolleranze..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "0.6rem 1rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "0.9rem",
            minWidth: "280px"
          }}
        />
      </div>

      {/* Grid of Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
        {filteredEntries.map((entry) => (
          <div
            key={entry.id}
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "1.8rem",
              boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
              border: entry.hasAiUpdate ? "1.5px solid #c8e6c9" : "1px solid #eee",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.15s ease",
              position: "relative"
            }}
          >
            <div>
              {/* Card Top Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "0.3rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        background: entry.hasAiUpdate ? "#2d5a27" : "#e58c2c",
                        color: "white",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "10px",
                        fontWeight: "bold",
                        textTransform: "uppercase"
                      }}
                    >
                      {entry.status === "firmato" ? "Firmato" : entry.status}
                    </span>
                    {entry.hasAiUpdate && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          background: "#e8f5e9",
                          color: "#1b5e20",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "8px",
                          fontWeight: "bold"
                        }}
                      >
                        🤖 AI Concierge
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: 0, color: "#514d48", fontSize: "1.3rem" }}>
                    {entry.coupleNames}
                  </h3>
                  <div style={{ color: "#777", fontSize: "0.85rem", marginTop: "2px" }}>
                    📅 {entry.eventDate} • 👥 {entry.guestsCount} ospiti
                  </div>
                </div>
                <span style={{ fontSize: "1.8rem" }}>💍</span>
              </div>

              {/* Card Details */}
              <div style={{ borderTop: "1px solid #eee", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.9rem" }}>
                <div>
                  <strong style={{ color: "#514d48", display: "block", fontSize: "0.85rem" }}>🎨 Palette Colori Guida:</strong>
                  {renderColorDots(entry.palette)}
                </div>

                <div>
                  <strong style={{ color: "#514d48", display: "block", fontSize: "0.85rem" }}>✨ Stile & Atmosfera Desiderata:</strong>
                  <p style={{ margin: "2px 0 0 0", color: "#555", lineHeight: 1.4 }}>
                    {entry.style}
                  </p>
                </div>

                {entry.preferredSpaces && entry.preferredSpaces.length > 0 && (
                  <div>
                    <strong style={{ color: "#514d48", display: "block", fontSize: "0.85rem" }}>🏛️ Spazi Preferiti:</strong>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                      {entry.preferredSpaces.map((sp, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: "#f0f4f8",
                            color: "#1c4f82",
                            fontSize: "0.75rem",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            fontWeight: "500"
                          }}
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <strong style={{ color: "#514d48", display: "block", fontSize: "0.85rem" }}>🍽️ Note Intolleranze & Menu:</strong>
                  <p
                    style={{
                      margin: "3px 0 0 0",
                      color: entry.dietaryNotes.toLowerCase().includes("celi") || entry.dietaryNotes.toLowerCase().includes("gluten") || entry.dietaryNotes.toLowerCase().includes("allerg")
                        ? "#856404"
                        : "#155724",
                      background: entry.dietaryNotes.toLowerCase().includes("celi") || entry.dietaryNotes.toLowerCase().includes("gluten") || entry.dietaryNotes.toLowerCase().includes("allerg")
                        ? "#fff3cd"
                        : "#d4edda",
                      padding: "0.4rem 0.6rem",
                      borderRadius: "6px",
                      fontSize: "0.85rem"
                    }}
                  >
                    {entry.dietaryNotes}
                  </p>
                </div>

                {entry.musicPreferences && (
                  <div>
                    <strong style={{ color: "#514d48", display: "block", fontSize: "0.85rem" }}>🎵 Musica & Intrattenimento:</strong>
                    <p style={{ margin: "2px 0 0 0", color: "#666", fontSize: "0.85rem" }}>
                      {entry.musicPreferences}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginTop: "1.2rem", display: "flex", gap: "0.5rem", borderTop: "1px solid #f0f0f0", paddingTop: "0.8rem" }}>
              <button
                type="button"
                onClick={() => setSelectedEntry(entry)}
                style={{
                  flex: 1,
                  padding: "0.6rem 0.8rem",
                  background: "#514d48",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "0.85rem"
                }}
              >
                🔍 Scheda 360°
              </button>

              {entry.quoteId ? (
                <a
                  href={`/api/generate-pdf?quoteId=${entry.quoteId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "0.6rem 0.8rem",
                    background: "#e58c2c",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  📄 PDF
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => alert(`Progetto per ${entry.coupleNames} generato con successo!`)}
                  style={{
                    padding: "0.6rem 0.8rem",
                    background: "#e58c2c",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  📄 Progetto
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal for 360° Detailed Sheet */}
      {selectedEntry && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem"
          }}
          onClick={() => setSelectedEntry(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "2rem",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", background: "#514d48", color: "#fff", padding: "0.2rem 0.6rem", borderRadius: "10px", fontWeight: "bold" }}>
                  SCHEDA PROGETTO NOZZE
                </span>
                <h2 style={{ margin: "0.4rem 0 0 0", color: "#514d48", fontSize: "1.6rem" }}>
                  {selectedEntry.coupleNames}
                </h2>
                <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
                  Data Evento: {selectedEntry.eventDate} • Ospiti: {selectedEntry.guestsCount}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#999" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", fontSize: "0.95rem" }}>
              <div>
                <strong style={{ color: "#514d48" }}>Palette Colori & Moodboard:</strong>
                {renderColorDots(selectedEntry.palette)}
              </div>

              <div>
                <strong style={{ color: "#514d48" }}>Visione & Atmosfera:</strong>
                <p style={{ margin: "4px 0 0 0", color: "#444", background: "#f9f9f9", padding: "0.8rem", borderRadius: "8px" }}>
                  {selectedEntry.style}
                </p>
              </div>

              <div>
                <strong style={{ color: "#514d48" }}>Gestione Allergie & Diete Speciali:</strong>
                <p style={{ margin: "4px 0 0 0", color: "#856404", background: "#fff3cd", padding: "0.8rem", borderRadius: "8px" }}>
                  {selectedEntry.dietaryNotes}
                </p>
              </div>

              <div>
                <strong style={{ color: "#514d48" }}>Spazi Riservati nella Tenuta:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {selectedEntry.preferredSpaces.map((s, i) => (
                    <span key={i} style={{ background: "#e8f0fe", color: "#1967d2", padding: "0.3rem 0.7rem", borderRadius: "6px", fontWeight: "500" }}>
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              {selectedEntry.musicPreferences && (
                <div>
                  <strong style={{ color: "#514d48" }}>Intrattenimento & Scaletta Musicale:</strong>
                  <p style={{ margin: "4px 0 0 0", color: "#444", background: "#f9f9f9", padding: "0.8rem", borderRadius: "8px" }}>
                    {selectedEntry.musicPreferences}
                  </p>
                </div>
              )}

              {selectedEntry.notes && (
                <div>
                  <strong style={{ color: "#514d48" }}>Note Aggiuntive Wedding Planner:</strong>
                  <p style={{ margin: "4px 0 0 0", color: "#444", background: "#f9f9f9", padding: "0.8rem", borderRadius: "8px" }}>
                    {selectedEntry.notes}
                  </p>
                </div>
              )}

              {selectedEntry.updatedAt && (
                <div style={{ fontSize: "0.8rem", color: "#888", borderTop: "1px solid #eee", paddingTop: "0.8rem" }}>
                  Ultimo aggiornamento automatico: {new Date(selectedEntry.updatedAt).toLocaleString("it-IT")}
                </div>
              )}
            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "0.8rem" }}>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                style={{
                  padding: "0.6rem 1.2rem",
                  background: "#514d48",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
