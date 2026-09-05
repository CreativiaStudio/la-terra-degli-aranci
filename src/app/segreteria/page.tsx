"use client";

import React, { useState } from "react";
import { saveLeadVisitSheet } from "./actions";

interface VenueSpace {
  id: string;
  name: string;
  moment: string;
  image: string;
  description: string;
  highlights: string[];
}

const VENUE_SPACES: VenueSpace[] = [
  {
    id: "agrumeto",
    name: "L'Agrumeto Storico",
    moment: "Accoglienza & Gran Buffet di Benvenuto",
    image: "/media/project-builder/agrumeto_hero.jpg",
    description:
      "Oasi botanica centenaria immersa nel profumo delle zagare e degli aranci secolari di Napoli, con isole gastronomiche dal vivo.",
    highlights: ["Isole live cooking", "Cocktail bar floreale", "Ombra naturale e brezza del Vomero"],
  },
  {
    id: "giardino_promesse",
    name: "Il Giardino delle Promesse",
    moment: "Rito Civile & Cerimonia Simbolica",
    image: "/media/project-builder/giardino_promesse_hero.jpg",
    description:
      "Spazio romantico all'aperto affacciato sul panorama verde della collina, con passerella in corteccia e arco botanico.",
    highlights: ["Allestimento rito all'americana", "Acustica naturale avvolgente", "Accesso dedicato agli sposi"],
  },
  {
    id: "sala_tufo",
    name: "La Sala Tufo",
    moment: "Banchetto & Cena di Gala",
    image: "/media/project-builder/sala_tufo_hero.jpg",
    description:
      "Le storiche pareti in tufo napoletano a vista custodiscono l'atmosfera più intima ed elegante per il pranzo o la cena seduta.",
    highlights: ["Mise en place sartoriale", "Climatizzazione e acustica ideali", "Capienza fino a 200 ospiti"],
  },
  {
    id: "sala_bianca",
    name: "La Sala Bianca",
    moment: "Ricevimento Panoramico & Luce Naturale",
    image: "/media/project-builder/sala_bianca_hero.jpg",
    description:
      "Ampie vetrate continue che affacciano sul parco, pavimento in cotto chiaro e design luminoso contemporaneo.",
    highlights: ["Luminosità diffusa tutto l'anno", "Vista continua sul parco", "Adattabile a qualsiasi palette"],
  },
  {
    id: "taglio_torta",
    name: "La Terrazza del Taglio Torta",
    moment: "Il Momento Clou Sotto le Stelle",
    image: "/media/project-builder/taglio_torta_hero.jpg",
    description:
      "La terrazza panoramica all'imbrunire, con scenografia di luci architetturali, fontane luminose fredde e gran buffet dolci.",
    highlights: ["Illuminazione da fiaba", "Fontane piriche fredde", "Buffet di dolci e torte d'autore"],
  },
  {
    id: "after_party",
    name: "L'After Party & Lounge",
    moment: "Musica, DJ Set & Dopocena",
    image: "/media/project-builder/after_party_hero.jpg",
    description:
      "Area dopocena per ballare fino a tarda notte con open bar, lounge esterna e l'iconico carretto delle graffette calde.",
    highlights: ["Open bar premium", "Postazione DJ & sound design", "Graffette calde all'arancio"],
  },
];

const GUEST_PILLS = [50, 80, 100, 120, 150, 180, 200, 250];

const EXTRA_SERVICES = [
  "Rito Civile / Simbolico in Villa",
  "Open Bar Illimitato Dopocena",
  "Spettacolo Fontane Luminose Fredde",
  "Musica dal Vivo per Gran Buffet",
  "DJ Set & Impianto Audio Dopocena",
  "Animazione Professionale Bimbi con Area Dedicata",
  "Angolo Sigari, Distillati & Cioccolato",
  "Show Cooking Graffette Calde all'Arancio",
  "Carretto Gelato Artigianale Napoletano",
  "Illuminazione Architetturale Catene Vintage",
];

export default function SegreteriaPage() {
  const [activeTab, setActiveTab] = useState<"tour" | "calendario" | "scheda">("tour");

  // Stato Scheda Visita Lead
  const [leadForm, setLeadForm] = useState({
    nome: "",
    cognome: "",
    telefono: "",
    email: "",
    canaleProvenienza: "Passaparola",
    tipoEvento: "wedding",
    dataEvento: "2027-06-19",
    turno: "cena",
    numeroOspiti: 120,
    spaziSelezionati: ["agrumeto", "sala_tufo", "taglio_torta"] as string[],
    stileMood: "Botanico Chic & Lucine Calde",
    serviziInteresse: ["Rito Civile / Simbolico in Villa", "Open Bar Illimitato Dopocena"] as string[],
    note: "",
  });

  // Stato Calendario Interattivo
  const [selectedYear, setSelectedYear] = useState(2027);
  const [selectedMonth, setSelectedMonth] = useState(6); // Giugno
  const [calendarDate, setCalendarDate] = useState("2027-06-19");
  const [calendarShift, setCalendarShift] = useState<"pranzo" | "cena">("cena");

  // Stato Invio
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string; leadId?: string } | null>(null);

  const toggleSpaceSelection = (spaceId: string) => {
    setLeadForm((prev) => {
      const exists = prev.spaziSelezionati.includes(spaceId);
      const nextSpaces = exists
        ? prev.spaziSelezionati.filter((id) => id !== spaceId)
        : [...prev.spaziSelezionati, spaceId];
      return { ...prev, spaziSelezionati: nextSpaces };
    });
  };

  const toggleServiceSelection = (service: string) => {
    setLeadForm((prev) => {
      const exists = prev.serviziInteresse.includes(service);
      const next = exists
        ? prev.serviziInteresse.filter((s) => s !== service)
        : [...prev.serviziInteresse, service];
      return { ...prev, serviziInteresse: next };
    });
  };

  const handleApplyDateFromCalendar = (dateStr: string, shift: "pranzo" | "cena") => {
    setCalendarDate(dateStr);
    setCalendarShift(shift);
    setLeadForm((prev) => ({
      ...prev,
      dataEvento: dateStr,
      turno: shift,
    }));
    setActiveTab("scheda");
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.nome.trim() || !leadForm.telefono.trim()) {
      alert("Inserisci almeno il Nome e il Telefono della coppia/cliente.");
      return;
    }

    setSaving(true);
    setSaveResult(null);

    const res = await saveLeadVisitSheet({
      nome: leadForm.nome,
      cognome: leadForm.cognome,
      telefono: leadForm.telefono,
      email: leadForm.email,
      canaleProvenienza: leadForm.canaleProvenienza,
      tipoEvento: leadForm.tipoEvento,
      dataEvento: leadForm.dataEvento,
      numeroOspiti: leadForm.numeroOspiti,
      spaziSelezionati: leadForm.spaziSelezionati,
      stileMood: leadForm.stileMood,
      serviziInteresse: leadForm.serviziInteresse,
      note: leadForm.note,
    });

    setSaving(false);
    setSaveResult(res);

    if (res.success) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleResetForm = () => {
    setLeadForm({
      nome: "",
      cognome: "",
      telefono: "",
      email: "",
      canaleProvenienza: "Passaparola",
      tipoEvento: "wedding",
      dataEvento: "2027-06-19",
      turno: "cena",
      numeroOspiti: 120,
      spaziSelezionati: ["agrumeto", "sala_tufo", "taglio_torta"],
      stileMood: "Botanico Chic & Lucine Calde",
      serviziInteresse: ["Rito Civile / Simbolico in Villa", "Open Bar Illimitato Dopocena"],
      note: "",
    });
    setSaveResult(null);
  };

  return (
    <div>
      {/* Navigation Tabs Touch iPad */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          background: "#ffffff",
          padding: "0.5rem",
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          marginBottom: "2rem",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("tour")}
          style={{
            flex: 1,
            minHeight: "52px",
            borderRadius: "12px",
            border: "none",
            background: activeTab === "tour" ? "#1e3a2f" : "transparent",
            color: activeTab === "tour" ? "#ffffff" : "#44403c",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.6rem",
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>🌿</span>
          <span>Tour Location & Sale ({leadForm.spaziSelezionati.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("calendario")}
          style={{
            flex: 1,
            minHeight: "52px",
            borderRadius: "12px",
            border: "none",
            background: activeTab === "calendario" ? "#1e3a2f" : "transparent",
            color: activeTab === "calendario" ? "#ffffff" : "#44403c",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.6rem",
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>📅</span>
          <span>Calendario Date Villa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("scheda")}
          style={{
            flex: 1,
            minHeight: "52px",
            borderRadius: "12px",
            border: "none",
            background: activeTab === "scheda" ? "#e58c2c" : "transparent",
            color: activeTab === "scheda" ? "#ffffff" : "#44403c",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.6rem",
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>📝</span>
          <span>Scheda Visita Lead Live</span>
        </button>
      </div>

      {/* Banner Successo Salvataggio */}
      {saveResult && (
        <div
          style={{
            background: saveResult.success ? "#e8f5e9" : "#ffebee",
            border: `1px solid ${saveResult.success ? "#a5d6a7" : "#ef9a9a"}`,
            borderRadius: "14px",
            padding: "1.5rem 2rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "2rem" }}>{saveResult.success ? "🎉" : "⚠️"}</span>
            <div>
              <h3
                style={{
                  margin: "0 0 0.3rem 0",
                  color: saveResult.success ? "#1b5e20" : "#b71c1c",
                  fontSize: "1.15rem",
                }}
              >
                {saveResult.success ? "Scheda Visita Inviata con Successo!" : "Errore Invio"}
              </h3>
              <p style={{ margin: 0, color: "#374151", fontSize: "0.95rem" }}>
                {saveResult.message}
              </p>
              {saveResult.leadId && (
                <small style={{ color: "#6b7280", display: "block", marginTop: "0.2rem" }}>
                  Identificativo Bozza: <code>{saveResult.leadId}</code> (visibile a Roberto in /admin/preventivi)
                </small>
              )}
            </div>
          </div>
          {saveResult.success && (
            <button
              type="button"
              onClick={handleResetForm}
              style={{
                minHeight: "48px",
                padding: "0 1.5rem",
                borderRadius: "10px",
                border: "none",
                background: "#1b5e20",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              + Nuova Visita Lead
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEZIONE 1: TOUR LOCATION & SALE */}
      {/* ========================================================================= */}
      {activeTab === "tour" && (
        <div>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2
              style={{
                fontFamily: "Georgia, 'Playfair Display', serif",
                fontSize: "1.8rem",
                margin: "0 0 0.4rem 0",
                color: "#1e1b18",
              }}
            >
              Tour Panoramico della Tenuta
            </h2>
            <p style={{ color: "#57534e", fontSize: "1rem", margin: 0 }}>
              Accompagna gli ospiti alla scoperta degli ambienti autentici de La Terra degli Aranci e seleziona gli spazi preferiti per la Scheda Visita.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {VENUE_SPACES.map((space) => {
              const isSelected = leadForm.spaziSelezionati.includes(space.id);
              return (
                <div
                  key={space.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: isSelected
                      ? "0 8px 24px rgba(229,140,44,0.25)"
                      : "0 4px 14px rgba(0,0,0,0.06)",
                    border: isSelected ? "2px solid #e58c2c" : "1px solid #e5dfd5",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                >
                  {/* Foto Ambiente */}
                  <div style={{ position: "relative", height: "230px", width: "100%" }}>
                    <img
                      src={space.image}
                      alt={space.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        background: "rgba(30, 27, 24, 0.85)",
                        backdropFilter: "blur(6px)",
                        color: "#fcfbf9",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        border: "1px solid rgba(229,140,44,0.4)",
                      }}
                    >
                      {space.moment}
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          background: "#e58c2c",
                          color: "#ffffff",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        ✓ Selezionato per il Lead
                      </div>
                    )}
                  </div>

                  {/* Dettagli Spazio */}
                  <div style={{ padding: "1.4rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    <h3
                      style={{
                        fontFamily: "Georgia, 'Playfair Display', serif",
                        fontSize: "1.35rem",
                        margin: "0 0 0.5rem 0",
                        color: "#1e1b18",
                      }}
                    >
                      {space.name}
                    </h3>
                    <p style={{ color: "#57534e", fontSize: "0.92rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                      {space.description}
                    </p>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.2rem" }}>
                      {space.highlights.map((hl, i) => (
                        <span
                          key={i}
                          style={{
                            background: "#f5f2eb",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            color: "#44403c",
                          }}
                        >
                          ✦ {hl}
                        </span>
                      ))}
                    </div>

                    <div style={{ marginTop: "auto" }}>
                      <button
                        type="button"
                        onClick={() => toggleSpaceSelection(space.id)}
                        style={{
                          width: "100%",
                          minHeight: "48px",
                          borderRadius: "10px",
                          border: isSelected ? "1px solid #e58c2c" : "1px solid #d6cebf",
                          background: isSelected ? "#fff7ed" : "#ffffff",
                          color: isSelected ? "#e58c2c" : "#44403c",
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                        }}
                      >
                        {isSelected ? "✓ Spazio Inserito nel Tour" : "+ Includi nella Visita"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Touch Bar Scorciatoia per Scheda */}
          <div
            style={{
              marginTop: "2.5rem",
              background: "#ffffff",
              padding: "1.2rem 1.8rem",
              borderRadius: "14px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <strong style={{ fontSize: "1rem", color: "#1e1b18" }}>
                Spazi Selezionati nel Tour: {leadForm.spaziSelezionati.length} ambienti
              </strong>
              <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                Passa alla compilazione rapida della scheda per registrare le preferenze della coppia.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("scheda")}
              style={{
                minHeight: "48px",
                padding: "0 1.8rem",
                borderRadius: "10px",
                border: "none",
                background: "#e58c2c",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              Compila Scheda Visita →
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEZIONE 2: CALENDARIO DATE VILLA */}
      {/* ========================================================================= */}
      {activeTab === "calendario" && (
        <div style={{ background: "#ffffff", borderRadius: "18px", padding: "2rem", boxShadow: "0 4px 14px rgba(0,0,0,0.05)" }}>
          <div style={{ marginBottom: "1.8rem" }}>
            <h2
              style={{
                fontFamily: "Georgia, 'Playfair Display', serif",
                fontSize: "1.8rem",
                margin: "0 0 0.4rem 0",
                color: "#1e1b18",
              }}
            >
              Disponibilità Date Villa (Zero Cifre)
            </h2>
            <p style={{ color: "#57534e", fontSize: "0.95rem", margin: 0 }}>
              Verifica in tempo reale con gli ospiti le date libere, opzionate o confermate per ricevimenti di nozze ed eventi privati.
            </p>
          </div>

          {/* Selettori Anno e Mese */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[2026, 2027, 2028].map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  style={{
                    minHeight: "44px",
                    padding: "0 1.2rem",
                    borderRadius: "8px",
                    border: "none",
                    background: selectedYear === year ? "#1e3a2f" : "#f3efe9",
                    color: selectedYear === year ? "#ffffff" : "#44403c",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  {year}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto" }}>
              {["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"].map((mName, idx) => (
                <button
                  key={mName}
                  type="button"
                  onClick={() => setSelectedMonth(idx + 1)}
                  style={{
                    minHeight: "44px",
                    padding: "0 0.8rem",
                    borderRadius: "8px",
                    border: "none",
                    background: selectedMonth === idx + 1 ? "#e58c2c" : "#f3efe9",
                    color: selectedMonth === idx + 1 ? "#ffffff" : "#44403c",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {mName}
                </button>
              ))}
            </div>
          </div>

          {/* Legenda */}
          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", padding: "0.8rem 1rem", background: "#f8f6f2", borderRadius: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }} />
              <strong>Data Libera</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b" }} />
              <strong>Opzionata (Trattativa)</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }} />
              <strong>Confermata (Occupata)</strong>
            </div>
          </div>

          {/* Griglia Date Esempio Mese */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "0.6rem",
              marginBottom: "2rem",
            }}
          >
            {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
              <div key={d} style={{ textAlign: "center", fontWeight: 700, color: "#78716c", padding: "0.5rem" }}>
                {d}
              </div>
            ))}

            {Array.from({ length: 30 }).map((_, i) => {
              const dayNum = i + 1;
              const dateIso = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isSelectedDate = calendarDate === dateIso;
              // Simulazione di stato date
              const isBusy = dayNum === 12 || dayNum === 26;
              const isOptioned = dayNum === 5 || dayNum === 19;
              const isFree = !isBusy && !isOptioned;

              const bgColor = isBusy ? "#fee2e2" : isOptioned ? "#fef3c7" : "#ecfdf5";
              const dotColor = isBusy ? "#ef4444" : isOptioned ? "#f59e0b" : "#10b981";

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => {
                    setCalendarDate(dateIso);
                  }}
                  style={{
                    minHeight: "74px",
                    background: isSelectedDate ? "#1e3a2f" : bgColor,
                    color: isSelectedDate ? "#ffffff" : "#1e1b18",
                    border: isSelectedDate ? "2px solid #e58c2c" : "1px solid rgba(0,0,0,0.06)",
                    borderRadius: "10px",
                    padding: "0.4rem",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{dayNum}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: isSelectedDate ? "#e58c2c" : dotColor }} />
                    <span style={{ fontSize: "0.68rem", fontWeight: 600 }}>
                      {isBusy ? "Occupato" : isOptioned ? "Opzione" : "Libero"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dettaglio Data Selezionata & Selezione Turno */}
          <div
            style={{
              background: "#fbf9f5",
              border: "1px solid #e5dfd5",
              borderRadius: "14px",
              padding: "1.5rem",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1.2rem",
            }}
          >
            <div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Data Selezionata:</div>
              <strong style={{ fontSize: "1.2rem", color: "#1e1b18" }}>
                {calendarDate} ({calendarShift === "pranzo" ? "Turno Pranzo 11:30 - 18:30" : "Turno Cena 18:30 - 01:30"})
              </strong>
            </div>

            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button
                type="button"
                onClick={() => setCalendarShift("pranzo")}
                style={{
                  minHeight: "46px",
                  padding: "0 1.2rem",
                  borderRadius: "8px",
                  border: calendarShift === "pranzo" ? "2px solid #e58c2c" : "1px solid #d6cebf",
                  background: calendarShift === "pranzo" ? "#fff7ed" : "#ffffff",
                  color: calendarShift === "pranzo" ? "#e58c2c" : "#44403c",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                ☀️ Pranzo (11:30 - 18:30)
              </button>
              <button
                type="button"
                onClick={() => setCalendarShift("cena")}
                style={{
                  minHeight: "46px",
                  padding: "0 1.2rem",
                  borderRadius: "8px",
                  border: calendarShift === "cena" ? "2px solid #e58c2c" : "1px solid #d6cebf",
                  background: calendarShift === "cena" ? "#fff7ed" : "#ffffff",
                  color: calendarShift === "cena" ? "#e58c2c" : "#44403c",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                🌙 Cena (18:30 - 01:30)
              </button>

              <button
                type="button"
                onClick={() => handleApplyDateFromCalendar(calendarDate, calendarShift)}
                style={{
                  minHeight: "46px",
                  padding: "0 1.5rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "#1e3a2f",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                📅 Usa questa data nella Scheda →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEZIONE 3: SCHEDA VISITA LEAD LIVE */}
      {/* ========================================================================= */}
      {activeTab === "scheda" && (
        <div style={{ background: "#ffffff", borderRadius: "18px", padding: "2rem", boxShadow: "0 4px 14px rgba(0,0,0,0.05)" }}>
          <div style={{ marginBottom: "2rem", borderBottom: "1px solid #f0eae1", paddingBottom: "1.2rem" }}>
            <h2
              style={{
                fontFamily: "Georgia, 'Playfair Display', serif",
                fontSize: "1.8rem",
                margin: "0 0 0.4rem 0",
                color: "#1e1b18",
              }}
            >
              Scheda Visita Lead Live (Tablet Tour)
            </h2>
            <p style={{ color: "#57534e", fontSize: "0.95rem", margin: 0 }}>
              Compila le informazioni raccolte durante la passeggiata con gli sposi o festeggiati. I dati saranno trasmessi direttamente a Roberto e Rosaria per la valorizzazione del preventivo.
            </p>
          </div>

          <form onSubmit={handleSaveLead}>
            {/* Blocco 1: Anagrafica Ospiti */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#1e3a2f", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>👤</span>
                <span>Anagrafica Coppia / Referente</span>
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#44403c", marginBottom: "0.4rem" }}>
                    Nome Sposo/a o Referente *
                  </label>
                  <input
                    type="text"
                    required
                    value={leadForm.nome}
                    onChange={(e) => setLeadForm({ ...leadForm, nome: e.target.value })}
                    placeholder="es. Marco / Francesca"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      height: "48px",
                      padding: "0 1rem",
                      borderRadius: "10px",
                      border: "1px solid #d6cebf",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#44403c", marginBottom: "0.4rem" }}>
                    Cognome o Nome Partner *
                  </label>
                  <input
                    type="text"
                    required
                    value={leadForm.cognome}
                    onChange={(e) => setLeadForm({ ...leadForm, cognome: e.target.value })}
                    placeholder="es. & Sofia / Esposito"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      height: "48px",
                      padding: "0 1rem",
                      borderRadius: "10px",
                      border: "1px solid #d6cebf",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#44403c", marginBottom: "0.4rem" }}>
                    Cellulare WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={leadForm.telefono}
                    onChange={(e) => setLeadForm({ ...leadForm, telefono: e.target.value })}
                    placeholder="es. 333 1234567"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      height: "48px",
                      padding: "0 1rem",
                      borderRadius: "10px",
                      border: "1px solid #d6cebf",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#44403c", marginBottom: "0.4rem" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="sposi@email.it"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      height: "48px",
                      padding: "0 1rem",
                      borderRadius: "10px",
                      border: "1px solid #d6cebf",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Blocco 2: Parametri Ricevimento */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#1e3a2f", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🎉</span>
                <span>Dettagli e Tipologia Evento</span>
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.2rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#44403c", marginBottom: "0.4rem" }}>
                    Tipologia Evento
                  </label>
                  <select
                    value={leadForm.tipoEvento}
                    onChange={(e) => setLeadForm({ ...leadForm, tipoEvento: e.target.value })}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      height: "48px",
                      padding: "0 1rem",
                      borderRadius: "10px",
                      border: "1px solid #d6cebf",
                      fontSize: "0.95rem",
                      background: "#ffffff",
                    }}
                  >
                    <option value="wedding">Matrimonio / Wedding</option>
                    <option value="eventi">Evento Privato (Festa / Compleanno / Laurea)</option>
                    <option value="comunione">Comunione / Battesimo</option>
                    <option value="aziendale">Evento Aziendale / Gala Corporate</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#44403c", marginBottom: "0.4rem" }}>
                    Data Desiderata
                  </label>
                  <input
                    type="date"
                    value={leadForm.dataEvento}
                    onChange={(e) => setLeadForm({ ...leadForm, dataEvento: e.target.value })}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      height: "48px",
                      padding: "0 1rem",
                      borderRadius: "10px",
                      border: "1px solid #d6cebf",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#44403c", marginBottom: "0.4rem" }}>
                    Turno Ricevimento
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setLeadForm({ ...leadForm, turno: "pranzo" })}
                      style={{
                        flex: 1,
                        height: "48px",
                        borderRadius: "8px",
                        border: leadForm.turno === "pranzo" ? "2px solid #e58c2c" : "1px solid #d6cebf",
                        background: leadForm.turno === "pranzo" ? "#fff7ed" : "#ffffff",
                        color: leadForm.turno === "pranzo" ? "#e58c2c" : "#44403c",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      ☀️ Pranzo
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeadForm({ ...leadForm, turno: "cena" })}
                      style={{
                        flex: 1,
                        height: "48px",
                        borderRadius: "8px",
                        border: leadForm.turno === "cena" ? "2px solid #e58c2c" : "1px solid #d6cebf",
                        background: leadForm.turno === "cena" ? "#fff7ed" : "#ffffff",
                        color: leadForm.turno === "cena" ? "#e58c2c" : "#44403c",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      🌙 Cena
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#44403c", marginBottom: "0.4rem" }}>
                    Canale di Provenienza
                  </label>
                  <select
                    value={leadForm.canaleProvenienza}
                    onChange={(e) => setLeadForm({ ...leadForm, canaleProvenienza: e.target.value })}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      height: "48px",
                      padding: "0 1rem",
                      borderRadius: "10px",
                      border: "1px solid #d6cebf",
                      fontSize: "0.95rem",
                      background: "#ffffff",
                    }}
                  >
                    <option value="Passaparola">Passaparola / Amici</option>
                    <option value="Instagram">Instagram / Social</option>
                    <option value="Google">Google / Sito Web</option>
                    <option value="Fiera">Fiera del Matrimonio</option>
                    <option value="Ospite Passato">È già stato ospite in villa</option>
                  </select>
                </div>
              </div>

              {/* Numero Ospiti Pillole */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#44403c", marginBottom: "0.5rem" }}>
                  Numero Ospiti Stimato: <strong>{leadForm.numeroOspiti} invitati</strong>
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {GUEST_PILLS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setLeadForm({ ...leadForm, numeroOspiti: num })}
                      style={{
                        minHeight: "44px",
                        padding: "0 1.1rem",
                        borderRadius: "8px",
                        border: leadForm.numeroOspiti === num ? "2px solid #e58c2c" : "1px solid #d6cebf",
                        background: leadForm.numeroOspiti === num ? "#e58c2c" : "#ffffff",
                        color: leadForm.numeroOspiti === num ? "#ffffff" : "#44403c",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        cursor: "pointer",
                      }}
                    >
                      {num} ospiti
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Blocco 3: Spazi e Mood */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#1e3a2f", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🌿</span>
                <span>Spazi Selezionati durante il Tour</span>
              </h3>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1.2rem" }}>
                {VENUE_SPACES.map((space) => {
                  const isChecked = leadForm.spaziSelezionati.includes(space.id);
                  return (
                    <button
                      key={space.id}
                      type="button"
                      onClick={() => toggleSpaceSelection(space.id)}
                      style={{
                        minHeight: "44px",
                        padding: "0 1rem",
                        borderRadius: "20px",
                        border: isChecked ? "2px solid #1e3a2f" : "1px solid #d6cebf",
                        background: isChecked ? "#1e3a2f" : "#ffffff",
                        color: isChecked ? "#ffffff" : "#44403c",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <span>{isChecked ? "✓" : "+"}</span>
                      <span>{space.name}</span>
                    </button>
                  );
                })}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#44403c", marginBottom: "0.4rem" }}>
                  Stile & Mood Desiderato
                </label>
                <input
                  type="text"
                  value={leadForm.stileMood}
                  onChange={(e) => setLeadForm({ ...leadForm, stileMood: e.target.value })}
                  placeholder="es. Botanico Chic, Romantico Lusso, Minimal Contemporaneo, Lucine Calde..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    height: "48px",
                    padding: "0 1rem",
                    borderRadius: "10px",
                    border: "1px solid #d6cebf",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
            </div>

            {/* Blocco 4: Servizi Extra di Interesse (Zero Prezzi) */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#1e3a2f", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>✨</span>
                <span>Servizi ed Esperienze di Interesse (Rigorosamente Senza Prezzi)</span>
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "0.6rem",
                }}
              >
                {EXTRA_SERVICES.map((srv) => {
                  const isChecked = leadForm.serviziInteresse.includes(srv);
                  return (
                    <div
                      key={srv}
                      onClick={() => toggleServiceSelection(srv)}
                      style={{
                        padding: "0.8rem 1rem",
                        borderRadius: "10px",
                        border: isChecked ? "1px solid #e58c2c" : "1px solid #e5dfd5",
                        background: isChecked ? "#fffaf4" : "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        style={{ width: "18px", height: "18px", accentColor: "#e58c2c" }}
                      />
                      <span style={{ fontSize: "0.88rem", fontWeight: isChecked ? 700 : 500, color: "#1e1b18" }}>
                        {srv}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Blocco 5: Note Colloquio Tour */}
            <div style={{ marginBottom: "2.5rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#44403c", marginBottom: "0.4rem" }}>
                Note di Segreteria & Desideri Speciali della Coppia
              </label>
              <textarea
                rows={4}
                value={leadForm.note}
                onChange={(e) => setLeadForm({ ...leadForm, note: e.target.value })}
                placeholder="Annota impressioni, preferenze su allestimenti, richieste specifiche sui menu o dettagli emersi durante la passeggiata nel parco..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "0.8rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid #d6cebf",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Pulsante Invio Scheda a Roberto */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 2,
                  minHeight: "56px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(90deg, #e58c2c 0%, #d47b1e 100%)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  cursor: saving ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 16px rgba(229,140,44,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.6rem",
                }}
              >
                {saving ? "Invio Scheda in corso... ⏳" : "✉️ Invia Scheda a Roberto (Crea Bozza Preventivo)"}
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                style={{
                  flex: 1,
                  minHeight: "56px",
                  borderRadius: "12px",
                  border: "1px solid #d6cebf",
                  background: "#ffffff",
                  color: "#57534e",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                Reset Campi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
