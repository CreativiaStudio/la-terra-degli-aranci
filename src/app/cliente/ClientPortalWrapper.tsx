"use client";

import React, { useState, useEffect } from "react";
import ClientDocuments from "./components/ClientDocuments";
import WeddingDiaryForm from "./components/WeddingDiaryForm";
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

  const [activeTab, setActiveTab] = useState<"documenti" | "diary" | "acconti" | "guida" | "eventi-club" | "concierge" | "tavoli">(
    isHistorical ? "eventi-club" : "documenti"
  );
  const [activeCategory, setActiveCategory] = useState<"admin" | "organizzazione" | "ecosistema">("organizzazione");

  const isEng = lang === "en";
  const clientName = quote?.clients?.nome ? `${quote.clients.nome} ${quote.clients.cognome || ''}` : "Sposi";

  // I servizi si possono modificare solo su un contratto firmato o attivo, non storico, e fino a 10gg dall'evento
  const canEditServices = (quote?.status === "firmato" || quote?.status === "inviato" || quote?.status === "accettato" || !quote?.status) && !isHistorical && isWithinEditableWindow(quote?.data_evento);

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
                ? (isEng ? "WELCOME BACK TO" : "BENTORNATI A LA TERRA DEGLI ARANCI")
                : (isEng ? "WELCOME TO YOUR JOURNEY" : "BENVENUTI A LA TERRA DEGLI ARANCI")}
            </span>
            <h2 style={{ fontSize: "2.5rem", fontFamily: "serif", fontWeight: 400, margin: "0 0 0.8rem 0", color: "#ffffff", lineHeight: 1.2 }}>
              {isEng ? `Hello, ${clientName}` : `Benvenuti, ${clientName}`}
            </h2>
            <p style={{ color: "#d2ccc4", fontSize: "1.1rem", lineHeight: 1.6, margin: 0 }}>
              {isHistorical
                ? (isEng 
                    ? "Welcome to your historical archive. Here you can view past events and experiences."
                    : "Benvenuti nel vostro archivio storico. Qui potete rivedere i vostri eventi passati e i contratti conclusi con noi.")
                : (isEng
                    ? "Here is your personal space where you can view your proposal, sign agreements, share your wedding diary preferences, and stay in direct contact with our team."
                    : "Questo è il vostro spazio riservato. Qui potete consultare la proposta economica, gestire la firma del contratto, compilare il vostro Wedding Diary ed organizzare ogni dettaglio con Roberto Sola ed il nostro staff.")}
            </p>
          </div>

          {/* Countdown Badge */}
          {daysLeft !== null && daysLeft > 0 && (
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
                {isEng ? "Days to your Big Day" : "Giorni al Gran Giorno"}
              </span>
              <small style={{ fontSize: "0.75rem", color: "#a59d93", display: "block", marginTop: "0.4rem" }}>
                📅 {new Date(eventDateStr).toLocaleDateString(isEng ? "en-US" : "it-IT", { day: "numeric", month: "long", year: "numeric" })}
              </small>
            </div>
          )}
        </div>

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


                {/* --- ORGANIZZAZIONE EVENTO --- */}
                {(!showTwoLevelMenu || activeCategory === "organizzazione") && quote?.status === "firmato" && !isHistorical && (
                  <button
                    onClick={() => setActiveTab("diary")}
                    style={{
                      padding: "0.8rem 1.4rem", borderRadius: "12px", border: "none", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
                      background: activeTab === "diary" ? "#e58c2c" : (showTwoLevelMenu ? "#fdfbf7" : "transparent"),
                      color: activeTab === "diary" ? "#ffffff" : "#6a6764", transition: "all 0.2s"
                    }}
                  >
                    📖 {quote?.tipo_evento === "wedding" ? (isEng ? "Wedding Diary (Preferences)" : "Wedding Diary (Le Vostre Preferenze)") : (isEng ? "Event Preferences" : "Preferenze Evento")}
                  </button>
                )}

                {(!showTwoLevelMenu || activeCategory === "organizzazione") && quote?.status === "firmato" && !isHistorical && quote?.tipo_evento === "wedding" && (
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
            serviceChangesHistory={serviceChangesHistory}
          />
        )}

        {activeTab === "diary" && (
          <WeddingDiaryForm 
            clientId={quote?.client_id || ""} 
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
          <GuestManager lang={lang} />
        )}

        {activeTab === "acconti" && (
          <PaymentSchedule
            totalAmount={quote?.totale_calcolato || 15200}
            importoCaparra={quote?.importo_caparra ?? undefined}
            importoSecondoAcconto={quote?.importo_secondo_acconto ?? undefined}
            isSigned={quote?.status === "firmato"}
            lang={lang}
          />
        )}

        {activeTab === "guida" && (
          <VenueGuide lang={lang} onNavigateToConcierge={() => setActiveTab("concierge")} />
        )}

      </main>
    </div>
  );
}
