"use client";

import React, { useState, useEffect, useCallback } from "react";
import ClientDocuments from "./components/ClientDocuments";
import WeddingDiaryForm from "./components/WeddingDiaryForm";
import PrivateEventDossier from "./components/PrivateEventDossier";
import { computeDiaryProgress } from "./components/weddingDiaryFields";
import PaymentSchedule from "./components/PaymentSchedule";
import UpcomingEvents from "./components/UpcomingEvents";
import VenueGuide from "./components/VenueGuide";
import Concierge from "./components/Concierge";
import GuestManager from "./components/GuestManager";
import { isWithinEditableWindow } from "@/lib/eventWindow";

interface ClientPortalWrapperProps {
  quote: any;
  clientQuotes?: any[];
  experiences?: any[];
  initialDiary?: any;
  signedPdf?: any;
  contractUrl?: string;
  serviceChangesHistory?: any[];
  initialLang?: "it" | "en";
  mode?: "wedding" | "privato" | "storico";
}

export default function ClientPortalWrapper({
  quote,
  clientQuotes = [],
  experiences = [],
  initialDiary,
  signedPdf,
  contractUrl,
  serviceChangesHistory = [],
  initialLang = "it",
  mode = "wedding"
}: ClientPortalWrapperProps) {
  const [lang, setLang] = useState<"it" | "en">(initialLang);

  const eventDateStr = quote?.data_evento || "2027-06-18";
  // Calcolo se l'evento è storico (post-evento)
  const isHistorical = mode === "storico" || new Date(eventDateStr).getTime() < new Date().getTime();
  const isPrivato = mode === "privato" || quote?.tipo_evento === "eventi";

  // L'Area Riservata operativa si sblocca SOLO dopo la firma digitale del contratto.
  // Gli eventi storici restano sempre accessibili (capsula del tempo / Club TDA).
  const isContractSigned = quote?.status === "firmato";
  const isAreaLocked = !isContractSigned && !isHistorical;

  const [activeTab, setActiveTab] = useState<"documenti" | "diary" | "acconti" | "guida" | "eventi-club" | "concierge" | "tavoli">(
    isHistorical ? "eventi-club" : "documenti"
  );
  const [activeCategory, setActiveCategory] = useState<"admin" | "organizzazione" | "ecosistema">("organizzazione");

  const isEng = lang === "en";
  const clientName = quote?.clients?.nome ? `${quote.clients.nome} ${quote.clients.cognome || ''}` : "Sposi";

  // Percentuale di completamento del Wedding Diary (inizializzata dai dati server,
  // poi aggiornata in tempo reale dal form tramite callback).
  const [diaryProgress, setDiaryProgress] = useState<number>(() =>
    computeDiaryProgress(initialDiary?.answers)
  );
  const handleDiaryProgress = useCallback((pct: number) => {
    setDiaryProgress((prev) => (prev === pct ? prev : pct));
  }, []);

  const isWedding = mode === "wedding" || quote?.tipo_evento === "wedding";
  // Il reminder del Wedding Diary è mostrato anche agli sposi in opzione
  // (pre-firma): il Diary è già attivo e va compilato prima della visita.
  const showDiaryBanner = isWedding && !isHistorical && activeTab !== "diary" && diaryProgress < 80;

  // I servizi si possono modificare solo su un contratto firmato, non storico, e fino a 10gg dall'evento
  const canEditServices = quote?.status === "firmato" && !isHistorical && !isAreaLocked && isWithinEditableWindow(quote?.data_evento);

  // Calcolo giorni mancanti all'evento
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (eventDateStr) {
      const target = new Date(eventDateStr).getTime();
      const now = new Date().getTime();
      const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      setDaysLeft(diff > 0 ? diff : 0);
    }
  }, [eventDateStr]);

  // Avviso riutilizzabile per le sezioni operative bloccate in attesa di firma.
  const lockedSectionNotice = (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start",
        background: "#fff8ee",
        border: "1px solid #f3d9b4",
        borderLeft: "4px solid #e58c2c",
        borderRadius: "16px",
        padding: "1.4rem 1.6rem",
        boxShadow: "0 8px 24px rgba(229,140,44,0.08)",
      }}
    >
      <span style={{ fontSize: "1.6rem", lineHeight: 1 }} aria-hidden="true">🔒</span>
      <div>
        <h3 style={{ margin: "0 0 0.4rem 0", color: "#9a5a10", fontSize: "1.05rem" }}>
          {isEng ? "Section locked until contract signature" : "Sezione bloccata in attesa di firma"}
        </h3>
        <p style={{ margin: 0, color: "#5a4a35", fontSize: "0.95rem", lineHeight: 1.6 }}>
          {isEng
            ? "This section will be editable directly by you as soon as the contract is signed. In the meantime, preliminary preferences can be noted by our office during your visit to the venue."
            : "Questa sezione sarà modificabile direttamente da voi non appena il contratto sarà firmato. Nel frattempo, le preferenze preliminari possono essere annotate dalla nostra segreteria durante la visita in villa."}
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #fbf9f5 0%, #f6f1e9 100%)", color: "#2c2a27", fontFamily: "'Outfit', sans-serif" }}>
      
      {/* Top Header Bar */}
      <header style={{
        background: "#ffffff",
        borderBottom: "1px solid #eae2d6",
        padding: "1.2rem 2.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Logo Ufficiale La Terra degli Aranci */}
          <img 
            src="/tda-simbolo.png" 
            alt="La Terra degli Aranci Logo" 
            style={{ height: "46px", width: "auto", objectFit: "contain" }} 
          />
          <div>
            <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700, display: "block" }}>
              ECOSISTEMA
            </span>
            <h1 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 600, color: "#1e1b18", fontFamily: "serif" }}>
              La Terra degli Aranci
            </h1>
          </div>
        </div>

        {/* Controls: Language Switcher & Exit */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", background: "#f3ede3", padding: "3px", borderRadius: "20px", border: "1px solid #e2d7c7" }}>
            <button
              type="button"
              onClick={() => setLang("it")}
              style={{
                padding: "0.4rem 0.9rem",
                borderRadius: "16px",
                border: "none",
                fontSize: "0.82rem",
                fontWeight: 600,
                background: lang === "it" ? "#ffffff" : "transparent",
                color: lang === "it" ? "#e58c2c" : "#666",
                cursor: "pointer",
                boxShadow: lang === "it" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s"
              }}
            >
              🇮🇹 Italiano
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              style={{
                padding: "0.4rem 0.9rem",
                borderRadius: "16px",
                border: "none",
                fontSize: "0.82rem",
                fontWeight: 600,
                background: lang === "en" ? "#ffffff" : "transparent",
                color: lang === "en" ? "#e58c2c" : "#666",
                cursor: "pointer",
                boxShadow: lang === "en" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s"
              }}
            >
              🇬🇧 English
            </button>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } catch {}
              window.location.href = "/login";
            }}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "10px",
              border: "1px solid #dcd3c5",
              background: "#ffffff",
              color: "#666",
              fontSize: "0.85rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {isEng ? "Exit Portal ⏻" : "Esci dall'Area ⏻"}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* Welcome Hero Banner */}
        <div style={{
          background: "linear-gradient(135deg, #1e1b18 0%, #3a342e 100%)",
          color: "#ffffff",
          borderRadius: "22px",
          padding: "3rem 3rem",
          marginBottom: "2.5rem",
          boxShadow: "0 15px 35px rgba(0,0,0,0.12)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "relative", zIndex: 2, maxWidth: "700px" }}>
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "3px", color: "#e58c2c", fontWeight: 700, display: "block", marginBottom: "0.6rem" }}>
              {isHistorical 
                ? (isEng ? "EXCLUSIVE VIP CLUB TDA" : "CLUB ESCLUSIVO LA TERRA DEGLI ARANCI")
                : isPrivato
                ? (isEng ? "PRIVATE EVENT PORTAL" : "PORTALE EVENTO PRIVATO")
                : (isEng ? "WELCOME TO YOUR WEDDING JOURNEY" : "BENVENUTI A LA TERRA DEGLI ARANCI")}
            </span>
            <h2 style={{ fontSize: "2.5rem", fontFamily: "serif", fontWeight: 400, margin: "0 0 0.8rem 0", color: "#ffffff", lineHeight: 1.2 }}>
              {isEng ? `Hello, ${clientName}` : `Benvenuti, ${clientName}`}
            </h2>
            <p style={{ color: "#d2ccc4", fontSize: "1.1rem", lineHeight: 1.6, margin: 0 }}>
              {isHistorical
                ? (isEng 
                    ? "Welcome to the Exclusive Ecosystem Club. Access priority 48h booking and 20% discounts for seasonal galas and dinners, or revisit your historical moments."
                    : "Benvenuti nel Club Esclusivo La Terra degli Aranci. Accedete con prelazione 48h e tariffe convenzionate (-20%) per tutti i concerti e le cene di gala in tenuta, e consultate il vostro archivio dei ricordi.")
                : isPrivato
                ? (isEng
                    ? "Welcome to your personal space. Organize your private party, banquet formula, and timing with our event team."
                    : "Benvenuti nel vostro spazio riservato. Qui potete consultare gli accordi, gestire i dettagli della festa, la formula food & beverage ed il cronoprogramma con Roberto Sola ed il nostro staff.")
                : (isEng
                    ? "Here is your personal space where you can view your proposal, sign agreements, share your wedding diary preferences, and stay in direct contact with our team."
                    : "Questo è il vostro spazio riservato. Qui potete consultare la proposta economica, gestire la firma del contratto, compilare il vostro Wedding Diary ed organizzare ogni dettaglio con Roberto Sola ed il nostro staff.")}
            </p>
          </div>

          {/* Countdown Badge */}
          {daysLeft !== null && daysLeft > 0 && !isHistorical && (
            <div style={{
              position: "absolute",
              right: "3rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(229, 140, 44, 0.15)",
              border: "1px solid rgba(229, 140, 44, 0.4)",
              backdropFilter: "blur(10px)",
              borderRadius: "18px",
              padding: "1.5rem 2rem",
              textAlign: "center",
              minWidth: "180px"
            }}>
              <span style={{ fontSize: "2.8rem", fontWeight: 700, color: "#e58c2c", lineHeight: 1, display: "block" }}>
                {daysLeft}
              </span>
              <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "#e5dcd0", marginTop: "0.3rem", display: "block" }}>
                {isEng
                  ? (isPrivato ? "Days to your Event" : "Days to your Big Day")
                  : (isPrivato ? "Giorni alla Tua Festa" : "Giorni al Gran Giorno")}
              </span>
              <small style={{ fontSize: "0.75rem", color: "#a59d93", display: "block", marginTop: "0.4rem" }}>
                📅 {new Date(eventDateStr).toLocaleDateString(isEng ? "en-US" : "it-IT", { day: "numeric", month: "long", year: "numeric" })}
              </small>
            </div>
          )}
        </div>

        {/* Banner Bloccante: Area Riservata in attesa della firma digitale */}
        {isAreaLocked && (
          <div
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)",
              border: "2px solid #f97316",
              borderRadius: "20px",
              padding: "2.2rem 2.5rem",
              marginBottom: "2rem",
              boxShadow: "0 12px 30px rgba(249, 115, 22, 0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.7rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "1.8rem", lineHeight: 1 }} aria-hidden="true">🔒</span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  padding: "0.35rem 0.85rem",
                  borderRadius: "20px",
                  background: "#c2410c",
                  color: "#ffffff",
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                }}
              >
                {isEng ? "Private Area Pending Signature" : "Area Riservata in Attesa di Firma"}
              </span>
            </div>

            <h3 style={{ fontSize: "1.55rem", color: "#1e1b18", margin: "0 0 0.6rem 0", fontWeight: 600 }}>
              {isEng
                ? "Date Reserved — Awaiting Digital Signature"
                : "Data Opzionata — In Attesa di Firma Digitale"}
            </h3>

            <p style={{ color: "#4a3c31", fontSize: "1rem", lineHeight: 1.65, margin: "0 0 1.5rem 0", maxWidth: "760px" }}>
              {isEng
                ? "Welcome to La Terra degli Aranci! Your date is currently held as an option. The Wedding Diary is already active: tell us your tastes, the spaces you love and your ideas even before the visit or the signature. Only after the contract is signed will the strictly accounting and operational sections unlock (final table plan and payment schedule)."
                : "Benvenuti a La Terra degli Aranci! La vostra data è attualmente bloccata in opzione. Il Wedding Diary è già attivo e accessibile: raccontateci i vostri gusti, gli spazi che amate e le vostre idee già prima della visita o della firma contrattuale. Solo dopo la firma si sbloccheranno le sezioni strettamente contabili e operative (disposizione definitiva dei tavoli e piano acconti)."}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", alignItems: "center" }}>
              <a
                href={contractUrl || "#"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.7rem",
                  background: "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
                  color: "#ffffff",
                  padding: "1.05rem 2rem",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "1.02rem",
                  textDecoration: "none",
                  boxShadow: "0 8px 20px rgba(229,140,44,0.4)",
                }}
              >
                {isEng
                  ? "✍️ Sign the Contract"
                  : "✍️ Firma il Contratto"}
              </a>

              <button
                type="button"
                onClick={() => { setActiveCategory("organizzazione"); setActiveTab("diary"); }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.7rem",
                  background: "#ffffff",
                  color: "#b8761f",
                  padding: "1.05rem 2rem",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "1.02rem",
                  border: "2px solid #e58c2c",
                  cursor: "pointer",
                  boxShadow: "0 8px 20px rgba(229,140,44,0.15)",
                  fontFamily: "inherit",
                }}
              >
                📖 {isEng ? "Fill in the Wedding Diary (Preferences)" : "Compila il Wedding Diary (Preferenze)"}
              </button>
            </div>
          </div>
        )}

        {/* Reminder Banner: Wedding Diary incompleto (< 80%) */}
        {showDiaryBanner && (
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              flexWrap: "wrap",
              background: "linear-gradient(135deg, #fff8ee 0%, #fdf1e0 100%)",
              border: "1px solid #f3d9b4",
              borderLeft: "4px solid #e58c2c",
              borderRadius: "16px",
              padding: "1.15rem 1.4rem",
              marginBottom: "1.75rem",
              boxShadow: "0 8px 24px rgba(229,140,44,0.08)",
            }}
          >
            <span style={{ fontSize: "1.6rem", lineHeight: 1 }} aria-hidden="true">📖</span>

            <div style={{ flex: "1 1 320px", minWidth: "260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "2px", color: "#b8761f", fontWeight: 700 }}>
                  {isEng ? "WEDDING DIARY" : "WEDDING DIARY"}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#9a5a10",
                    background: "#fdeacd",
                    border: "1px solid #f3d9b4",
                    borderRadius: "999px",
                    padding: "0.1rem 0.55rem",
                  }}
                >
                  {diaryProgress}%
                </span>
              </div>
              <p style={{ margin: 0, color: "#5a4a35", fontSize: "0.95rem", lineHeight: 1.55 }}>
                {isEng
                  ? "Complete your Wedding Diary: it will help our Wedding Planner six months before the event to craft the perfect direction of your wedding."
                  : "Completa il vostro Wedding Diary: aiuterà la nostra Wedding Planner a -6 mesi a preparare la regia perfetta del matrimonio."}
              </p>

              {/* Barra di avanzamento sobria */}
              <div style={{ height: "5px", background: "#f0e0c8", borderRadius: "999px", overflow: "hidden", marginTop: "0.65rem", maxWidth: "420px" }}>
                <div
                  style={{
                    width: `${diaryProgress}%`,
                    height: "100%",
                    borderRadius: "999px",
                    background: "linear-gradient(90deg, #f0b46a, #e58c2c)",
                    transition: "width 0.45s ease",
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setActiveCategory("organizzazione"); setActiveTab("diary"); }}
              style={{
                padding: "0.72rem 1.3rem",
                borderRadius: "999px",
                border: "none",
                background: "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.88rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 6px 16px rgba(229,140,44,0.28)",
              }}
            >
              {isEng ? "Complete the Diary →" : "Completa il Diary →"}
            </button>
          </div>
        )}

        {/* Navigazione */}
        {(() => {
          const showTwoLevelMenu = !isHistorical && quote?.status === "firmato";

          return (
            <>
              {/* Livello 1: Categorie (Solo per eventi attivi firmati) */}
              {showTwoLevelMenu && (
                <div style={{
                  display: "flex",
                  gap: "1.5rem",
                  marginBottom: "1rem",
                  borderBottom: "1px solid #eae2d6",
                  paddingBottom: "1rem",
                  overflowX: "auto",
                  scrollbarWidth: "none"
                }}>
                  <button
                    onClick={() => { setActiveCategory("admin"); setActiveTab("documenti"); }}
                    style={{
                      background: "none", border: "none", fontSize: "1.05rem", fontWeight: 700, cursor: "pointer",
                      color: activeCategory === "admin" ? "#1e1b18" : "#a39f9b",
                      borderBottom: activeCategory === "admin" ? "2px solid #1e1b18" : "2px solid transparent",
                      paddingBottom: "0.5rem"
                    }}
                  >
                    📁 {isEng ? "Administration" : "Amministrazione"}
                  </button>
                  <button
                    onClick={() => { setActiveCategory("organizzazione"); setActiveTab("diary"); }}
                    style={{
                      background: "none", border: "none", fontSize: "1.05rem", fontWeight: 700, cursor: "pointer",
                      color: activeCategory === "organizzazione" ? "#1e1b18" : "#a39f9b",
                      borderBottom: activeCategory === "organizzazione" ? "2px solid #1e1b18" : "2px solid transparent",
                      paddingBottom: "0.5rem"
                    }}
                  >
                    📋 {isEng ? "Event Organization" : "Organizzazione Evento"}
                  </button>
                  <button
                    onClick={() => { setActiveCategory("ecosistema"); setActiveTab("guida"); }}
                    style={{
                      background: "none", border: "none", fontSize: "1.05rem", fontWeight: 700, cursor: "pointer",
                      color: activeCategory === "ecosistema" ? "#1e1b18" : "#a39f9b",
                      borderBottom: activeCategory === "ecosistema" ? "2px solid #1e1b18" : "2px solid transparent",
                      paddingBottom: "0.5rem"
                    }}
                  >
                    🌿 {isEng ? "Aranci Ecosystem" : "Ecosistema Aranci"}
                  </button>
                </div>
              )}

              {/* Livello 2: Tab Specifici */}
              <div 
                className="tab-nav"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.8rem",
                  marginBottom: "2rem",
                  borderBottom: showTwoLevelMenu ? "none" : "2px solid #eae2d6",
                  paddingBottom: showTwoLevelMenu ? "0" : "1.2rem",
                }}
              >
                <style>{`
                  .tab-nav button {
                    white-space: nowrap !important;
                    flex-shrink: 0 !important;
                  }
                `}</style>

                {/* --- AMMINISTRAZIONE --- */}
                {(!showTwoLevelMenu || activeCategory === "admin") && (
                  <button
                    onClick={() => setActiveTab("documenti")}
                    style={{
                      padding: "0.8rem 1.4rem", borderRadius: "12px", border: "none", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
                      background: activeTab === "documenti" ? "#1e1b18" : (showTwoLevelMenu ? "#fdfbf7" : "transparent"),
                      color: activeTab === "documenti" ? "#ffffff" : "#6a6764", transition: "all 0.2s"
                    }}
                  >
                    📋 {isHistorical ? (isEng ? "Historical Archive" : "Archivio Storico") : (isEng ? "Contract & Proposal" : "Preventivo & Contratto")}
                  </button>
                )}

                {(!showTwoLevelMenu || activeCategory === "admin") && quote?.status === "firmato" && !isHistorical && (
                  <button
                    onClick={() => setActiveTab("acconti")}
                    style={{
                      padding: "0.8rem 1.4rem", borderRadius: "12px", border: "none", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
                      background: activeTab === "acconti" ? "#1e1b18" : (showTwoLevelMenu ? "#fdfbf7" : "transparent"),
                      color: activeTab === "acconti" ? "#ffffff" : "#6a6764", transition: "all 0.2s"
                    }}
                  >
                    💰 {isEng ? "Payment Schedule" : "Piano Acconti"}
                  </button>
                )}


                {/* --- ORGANIZZAZIONE EVENTO / WEDDING DIARY --- */}
                {(!showTwoLevelMenu || activeCategory === "organizzazione") && !isHistorical && (isWedding || quote?.status === "firmato" || isAreaLocked) && (
                  <button
                    onClick={() => setActiveTab("diary")}
                    style={{
                      padding: "0.8rem 1.4rem", borderRadius: "12px",
                      border: activeTab === "diary" ? "none" : (isWedding && diaryProgress < 80 ? "1px solid #e58c2c" : "none"),
                      fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
                      background: activeTab === "diary" ? "#e58c2c" : (showTwoLevelMenu ? "#fdfbf7" : "transparent"),
                      color: activeTab === "diary" ? "#ffffff" : (isWedding && diaryProgress < 80 ? "#b8761f" : "#6a6764"),
                      transition: "all 0.2s",
                      display: "flex", alignItems: "center", gap: "0.45rem"
                    }}
                  >
                    <span>📖</span>
                    <span>{isWedding ? (isEng ? "Wedding Diary" : "Wedding Diary (Preferenze)") : (isEng ? "Event Dossier" : "Dossier Evento Privato")}</span>
                    {isWedding && diaryProgress < 80 && (
                      <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.5rem", borderRadius: "999px", background: activeTab === "diary" ? "rgba(255,255,255,0.25)" : "#fdeacd", color: activeTab === "diary" ? "#ffffff" : "#9a5a10", fontWeight: 700 }}>
                        {diaryProgress}%
                      </span>
                    )}
                  </button>
                )}

                {(!showTwoLevelMenu || activeCategory === "organizzazione") && !isHistorical && quote?.tipo_evento === "wedding" && (quote?.status === "firmato" || isAreaLocked) && (
                  <button
                    onClick={() => setActiveTab("tavoli")}
                    style={{
                      padding: "0.8rem 1.4rem", borderRadius: "12px", border: "none", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
                      background: activeTab === "tavoli" ? "#166534" : (showTwoLevelMenu ? "#fdfbf7" : "transparent"),
                      color: activeTab === "tavoli" ? "#ffffff" : "#6a6764", transition: "all 0.2s"
                    }}
                  >
                    🪑 {isEng ? "Guests & Tables" : "Invitati & Tavoli"}
                  </button>
                )}

                {/* --- ECOSISTEMA ARANCI / GLOBALI --- */}
                {(!showTwoLevelMenu || activeCategory === "ecosistema" || activeCategory === "organizzazione") && !isHistorical && (
                  <button
                    onClick={() => setActiveTab("concierge")}
                    style={{
                      padding: "0.8rem 1.4rem", borderRadius: "12px", border: "none", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
                      background: activeTab === "concierge" ? "#1e1b18" : (showTwoLevelMenu ? "#fdfbf7" : "transparent"),
                      color: activeTab === "concierge" ? "#ffffff" : "#6a6764", transition: "all 0.2s",
                      display: activeCategory === "ecosistema" ? "none" : "block" // Nascondo in ecosistema se lo mostro in organizzazione per non duplicare
                    }}
                  >
                    🤵‍♂️ {isEng ? "Digital Concierge" : "Il Salotto Digitale"}
                  </button>
                )}

                {(!showTwoLevelMenu || activeCategory === "ecosistema") && (
                  <button
                    onClick={() => setActiveTab("guida")}
                    style={{
                      padding: "0.8rem 1.4rem", borderRadius: "12px", border: "none", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
                      background: activeTab === "guida" ? "#1e1b18" : (showTwoLevelMenu ? "#fdfbf7" : "transparent"),
                      color: activeTab === "guida" ? "#ffffff" : "#6a6764", transition: "all 0.2s"
                    }}
                  >
                    ℹ️ {isEng ? "Venue Guide & Info" : "Guida Location & Ospiti"}
                  </button>
                )}

                {/* --- STORICI EXTRA --- */}
                {isHistorical && (
                  <>
                    <button
                      onClick={() => setActiveTab("eventi-club")}
                      style={{
                        padding: "0.8rem 1.4rem", borderRadius: "12px", border: "none", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
                        background: activeTab === "eventi-club" ? "#166534" : "transparent", color: activeTab === "eventi-club" ? "#ffffff" : "#6a6764", transition: "all 0.2s"
                      }}
                    >
                      🥂 {isEng ? "Upcoming Club Events" : "Eventi in Programma"}
                    </button>
                    {quote?.tipo_evento === "wedding" && (
                      <button
                        onClick={() => setActiveTab("diary")}
                        style={{
                          padding: "0.8rem 1.4rem", borderRadius: "12px", border: "none", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
                          background: activeTab === "diary" ? "#e58c2c" : "transparent", color: activeTab === "diary" ? "#ffffff" : "#6a6764", transition: "all 0.2s"
                        }}
                      >
                        🕰️ {isEng ? "Your Memory Capsule" : "La Vostra Capsula del Tempo"}
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab("concierge")}
                      style={{
                        padding: "0.8rem 1.4rem", borderRadius: "12px", border: "none", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
                        background: activeTab === "concierge" ? "#1e1b18" : "transparent", color: activeTab === "concierge" ? "#ffffff" : "#6a6764", transition: "all 0.2s"
                      }}
                    >
                      🤵‍♂️ {isEng ? "Digital Concierge" : "Il Salotto Digitale"}
                    </button>
                  </>
                )}
              </div>
            </>
          );
        })()}

        {/* Tab Content Display */}
        {activeTab === "documenti" && (
          <ClientDocuments
            quote={quote}
            clientQuotes={clientQuotes}
            experiences={experiences}
            signedPdf={signedPdf}
            contractUrl={contractUrl}
            lang={lang}
            isHistoricalDashboard={isHistorical}
            canEditServices={canEditServices}
            isAreaLocked={isAreaLocked}
            serviceChangesHistory={serviceChangesHistory}
          />
        )}

        {activeTab === "diary" && isWedding && (
          <>
            {isAreaLocked && (
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                  background: "linear-gradient(135deg, #fff8ee 0%, #fdf1e0 100%)",
                  border: "1px solid #f3d9b4",
                  borderLeft: "4px solid #e58c2c",
                  borderRadius: "16px",
                  padding: "1.4rem 1.6rem",
                  marginBottom: "1.5rem",
                  boxShadow: "0 8px 24px rgba(229,140,44,0.1)",
                }}
              >
                <span style={{ fontSize: "1.7rem", lineHeight: 1 }} aria-hidden="true">🌟</span>
                <div>
                  <h3 style={{ margin: "0 0 0.4rem 0", color: "#9a5a10", fontSize: "1.08rem" }}>
                    {isEng
                      ? "Pre-Visit & Pre-Signature Wedding Diary"
                      : "Wedding Diary Pre-Visita & Pre-Firma"}
                  </h3>
                  <p style={{ margin: 0, color: "#5a4a35", fontSize: "0.95rem", lineHeight: 1.65 }}>
                    {isEng
                      ? "Express your wishes, style and ideas for your event here. Your notes are shared in real time with our office and Roberto Sola, so we can welcome you at our best and build the perfect proposal for you."
                      : "Esprimete qui i vostri desideri, lo stile e le idee per il vostro evento. Le vostre indicazioni saranno trasmesse in tempo reale alla nostra segreteria e a Roberto Sola per accogliervi al meglio e costruire la proposta perfetta per voi."}
                  </p>
                </div>
              </div>
            )}
            <WeddingDiaryForm
              clientId={quote?.client_id || ""}
              quoteId={quote?.id}
              initialData={initialDiary}
              lang={lang}
              isReadOnly={isHistorical}
              onProgressChange={handleDiaryProgress}
            />
          </>
        )}

        {activeTab === "diary" && !isWedding && (
          <PrivateEventDossier
            clientId={quote?.client_id || ""}
            quoteId={quote?.id}
            initialData={initialDiary}
            lang={lang}
            isReadOnly={isHistorical}
          />
        )}

        {activeTab === "eventi-club" && (
          <UpcomingEvents lang={lang} />
        )}

        {activeTab === "concierge" && (
          <Concierge
            lang={lang}
            clientName={clientName}
            clientId={quote?.client_id || "demo-client"}
            daysLeft={daysLeft}
            isHistorical={isHistorical}
          />
        )}

        {activeTab === "tavoli" && (
          isAreaLocked ? lockedSectionNotice : <GuestManager lang={lang} />
        )}

        {activeTab === "acconti" && (
          <PaymentSchedule
            totalAmount={quote?.totale_calcolato || 15200}
            importoCaparra={quote?.importo_caparra ?? undefined}
            importoSecondoAcconto={quote?.importo_secondo_acconto ?? undefined}
            isSigned={quote?.status === "firmato"}
            lang={lang}
            quoteId={quote?.id}
            clientName={clientName}
            eventDate={eventDateStr}
          />
        )}

        {activeTab === "guida" && (
          <VenueGuide lang={lang} onNavigateToConcierge={() => setActiveTab("concierge")} />
        )}

      </main>
    </div>
  );
}
