"use client";

import React, { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  sender: "staff" | "client" | "ai";
  text: string;
  timestamp: string;
  read: boolean;
}

interface ConciergeProps {
  lang?: "it" | "en";
  clientName?: string;
  clientId?: string;
  daysLeft?: number | null;
  isHistorical?: boolean;
}

export default function Concierge({
  lang = "it",
  clientName = "Sposi",
  clientId = "demo-client",
  daysLeft,
  isHistorical = false
}: ConciergeProps) {
  const isEng = lang === "en";
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Determinazione Fase AI (>180 giorni o non specificato) vs Planner (<180 giorni) vs Storico
  const isAiPhase = !isHistorical && (daysLeft == null || daysLeft > 180);

  // Messaggio iniziale dinamico in base alla fase
  const getInitialMessages = (): Message[] => {
    if (isHistorical) {
      return [
        {
          id: "m-hist-1",
          sender: "staff",
          text: isEng
            ? `Welcome back to the TDA Club Lounge! 🏛️ Use this concierge chat to ask for info on upcoming public galas, claim your member discounts, or plan a new experience in our citrus grove.`
            : `Benvenuti nel Salotto Riservato del Club TDA! 🏛️ Usate questa chat per richiedere informazioni sugli eventi in programma, riscattare i vostri coupon riservati o prenotare una nuova esperienza nell'agrumeto.`,
          timestamp: "10:00",
          read: true
        }
      ];
    }

    if (isAiPhase) {
      return [
        {
          id: "m-ai-1",
          sender: "ai",
          text: isEng
            ? `Welcome to your Digital Lounge! I am your TDA Virtual Assistant 🤖. In this first phase, I am here to collect all your preferences, inspiration photos, dietary notes, and music choices. When you reach 6 months before your event, your dedicated Event Planner will step in with a complete 360° profile already prepared!`
            : `Benvenuti nel vostro Salotto Digitale! Sono l'Assistente Virtuale TDA 🤖. In questa prima fase raccolgo tutte le vostre preferenze, foto di ispirazione, celiaci e gusti musicali. A 6 mesi dal gran giorno subentrerà la vostra Event Planner dedicata con il quadro completo già pronto!`,
          timestamp: "10:00",
          read: true
        },
        {
          id: "m-ai-2",
          sender: "client",
          text: isEng
            ? "Hi! We'd love to share some flower style ideas for the ceremony in the citrus grove."
            : "Ciao! Vorremmo condividere qualche idea per l'allestimento floreale nel giardino degli aranci.",
          timestamp: "10:15",
          read: true
        },
        {
          id: "m-ai-3",
          sender: "ai",
          text: isEng
            ? "Wonderful! I've logged this in your Wedding Diary under preferred spaces. Feel free to attach images anytime! 🌸"
            : "Magnifico! Ho annotato la preferenza nel vostro Wedding Diary. Potete anche allegare immagini o foto di Pinterest qui in chat in qualsiasi momento! 🌸",
          timestamp: "10:16",
          read: true
        }
      ];
    }

    // Fase 2: < 180 giorni (Event Planner Umano)
    return [
      {
        id: "m-planner-1",
        sender: "staff",
        text: isEng
          ? `Hello ${clientName}! I am Roberto Sola along with your dedicated Event Planner 👰‍♀️. We have reviewed all the preferences, dietary notes, and inspirations collected by our AI assistant during Phase 1. We are now managing your event live!`
          : `Benvenuti ${clientName}! Sono Roberto Sola insieme alla vostra Event Planner dedicata 👰‍♀️. Abbiamo esaminato tutte le note, gli allergeni e le preferenze raccolte dall'IA nei mesi scorsi. Da oggi coordiniamo direttamente ogni dettaglio per il vostro evento in villa!`,
        timestamp: "09:30",
        read: true
      }
    ];
  };

  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [preferenceAlert, setPreferenceAlert] = useState<string | null>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    const userText = newMessage.trim();
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "client",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          clientId,
          clientName,
          daysLeft,
          history: messages.slice(-6).map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      const data = await res.json();
      if (data.text) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: isAiPhase ? "ai" : "staff",
            text: data.text,
            timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: true
          }
        ]);

        if (data.preferencesLogged && data.preferencesLogged.length > 0) {
          setPreferenceAlert(`✨ Preferenze annotate nel Wedding Diary: ${data.preferencesLogged.join(", ")}`);
          setTimeout(() => setPreferenceAlert(null), 5000);
        }
      }
    } catch (err) {
      console.error("Errore chiamata live ai-concierge:", err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: isEng
            ? "Thank you for reaching out! We are at your full disposal. Feel free to contact Roberto Sola directly."
            : "Grazie per il vostro messaggio! A La Terra degli Aranci siamo a vostra completa disposizione per ogni dettaglio sartoriale. Potete contattare anche direttamente Roberto Sola in masseria.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", background: "#ffffff", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #eee7de", overflow: "hidden" }}>
      
      {/* Banner Informativo sulla Fase Corrente */}
      {isHistorical ? (
        <div style={{ background: "#fcf6ed", borderBottom: "1px solid #f5d0a6", padding: "0.8rem 1.5rem", fontSize: "0.85rem", color: "#c2410c", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.1rem" }}>🎟️</span>
          <span>
            {isEng 
              ? "CLUB TDA MEMBER LOUNGE: Contact our concierge for exclusive event previews, ticket bookings, and special requests." 
              : "MEMBRO CLUB ECOSISTEMA TDA: Utilizza questo salotto per info su prevendite riservate, sconti ticket e nuovi eventi in villa."}
          </span>
        </div>
      ) : isAiPhase ? (
        <div style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", borderBottom: "1px solid #fed7aa", padding: "0.8rem 1.5rem", fontSize: "0.85rem", color: "#c2410c", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.1rem" }}>🤖</span>
          <span>
            {isEng 
              ? "PHASE 1 - AI CONCIERGE ACTIVE (>6 MONTHS): Our AI gathers your preferences and ideas. At 6 months before your event, your human Event Planner takes over with a full 360° profile ready!" 
              : "FASE 1 - AI CONCIERGE ATTIVO (>6 MESI): L'Intelligenza Artificiale raccoglie idee e preferenze. A 6 mesi dal gran giorno subentrerà la tua Event Planner con la scheda 360° già pronta!"}
          </span>
        </div>
      ) : (
        <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", borderBottom: "1px solid #bbf7d0", padding: "0.8rem 1.5rem", fontSize: "0.85rem", color: "#166534", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.1rem" }}>👰‍♀️</span>
          <span>
            {isEng 
              ? "PHASE 2 - HUMAN EVENT PLANNER IN CHARGE (<6 MONTHS): Your dedicated planner is now coordinating your event with all preferences collected during Phase 1!" 
              : "FASE 2 - EVENT PLANNER DEDICATO IN CARICO (<6 MESI): La tua Event Planner coordina direttamente il tuo evento basandosi su tutte le preferenze raccolte!"}
          </span>
        </div>
      )}

      {/* Chat Header */}
      <div style={{ padding: "1.2rem 2rem", background: "#fdfbf7", borderBottom: "1px solid #eee7de", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ position: "relative" }}>
            <div style={{ 
              width: "50px", 
              height: "50px", 
              borderRadius: "50%", 
              background: isAiPhase ? "linear-gradient(135deg, #e58c2c 0%, #ea580c 100%)" : "#1e1b18", 
              color: "#fff", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontSize: "1.3rem", 
              fontWeight: 700 
            }}>
              {isHistorical ? "🏛️" : isAiPhase ? "🤖" : "👰‍♀️"}
            </div>
            <div style={{ position: "absolute", bottom: 2, right: 2, width: "12px", height: "12px", background: "#10b981", borderRadius: "50%", border: "2px solid #fdfbf7" }}></div>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#1e1b18", fontWeight: 600 }}>
              {isHistorical ? "Club TDA Concierge" : isAiPhase ? "TDA Concierge AI" : "Roberto Sola & Event Planner"}
            </h3>
            <span style={{ fontSize: "0.82rem", color: "#6a6764" }}>
              {isHistorical 
                ? "Assistenza & Prevendite Esclusive" 
                : isAiPhase 
                  ? "Assistente Virtuale • Raccolta Preferenze" 
                  : "Regia Evento & Coordinamento Staff"}
            </span>
          </div>
        </div>

        <div style={{ 
          fontSize: "0.78rem", 
          textTransform: "uppercase", 
          letterSpacing: "1px", 
          color: isAiPhase ? "#c2410c" : "#166534", 
          background: isAiPhase ? "#fff7ed" : "#f0fdf4", 
          border: `1px solid ${isAiPhase ? "#ffedd5" : "#bbf7d0"}`,
          padding: "0.4rem 0.8rem", 
          borderRadius: "20px", 
          fontWeight: 700 
        }}>
          {isHistorical ? "Club VIP" : isAiPhase ? "Fase 1: AI Assistant" : "Fase 2: Planner Umano"}
        </div>
      </div>

      {/* Messaggi */}
      <div style={{ flex: 1, padding: "2rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem", background: "#faf8f5" }}>
        <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: "#a39f9b", background: "#eee7de", padding: "0.2rem 0.8rem", borderRadius: "12px" }}>
            {isEng ? "Your conversation is private and synced with location management" : "Conversazione privata sincronizzata con il CRM direzionale"}
          </span>
        </div>

        {messages.map((msg) => {
          const isClient = msg.sender === "client";
          const isAi = msg.sender === "ai";
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: !isClient ? "flex-start" : "flex-end" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", maxWidth: "80%" }}>
                {!isClient && (
                  <div style={{ 
                    width: "32px", 
                    height: "32px", 
                    borderRadius: "50%", 
                    background: isAi ? "#ea580c" : "#1e1b18", 
                    color: "#fff", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: "0.9rem", 
                    fontWeight: 700, 
                    flexShrink: 0 
                  }}>
                    {isAi ? "🤖" : "👰‍♀️"}
                  </div>
                )}
                <div style={{ 
                  background: isClient ? "#1e1b18" : (isAi ? "#fff7ed" : "#ffffff"), 
                  color: isClient ? "#ffffff" : "#1e1b18", 
                  padding: "1rem 1.2rem", 
                  borderRadius: "18px", 
                  borderBottomLeftRadius: !isClient ? "4px" : "18px",
                  borderBottomRightRadius: isClient ? "4px" : "18px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  border: isClient ? "none" : (isAi ? "1px solid #fed7aa" : "1px solid #eee7de"),
                  fontSize: "0.95rem",
                  lineHeight: 1.5
                }}>
                  {msg.text}
                </div>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#a39f9b", marginTop: "0.3rem", padding: !isClient ? "0 2.8rem" : "0 0.5rem" }}>
                {msg.timestamp} {msg.sender === "client" && (msg.read ? "✓✓" : "✓")}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#ea580c", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700 }}>
              🤖
            </div>
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", padding: "0.8rem 1.2rem", borderRadius: "18px", color: "#c2410c", fontSize: "0.9rem" }}>
              L&apos;AI Concierge sta consultando la guida ufficiale di Roberto... 🍊
            </div>
          </div>
        )}

        <div ref={endOfMessagesRef} />
      </div>

      {/* Notifica Preferenze Annotate */}
      {preferenceAlert && (
        <div style={{ background: "#ecfdf5", borderTop: "1px solid #a7f3d0", borderBottom: "1px solid #a7f3d0", padding: "0.6rem 2rem", fontSize: "0.85rem", color: "#065f46", fontWeight: 600 }}>
          {preferenceAlert}
        </div>
      )}

      {/* Input Area */}
      <div style={{ padding: "1.5rem 2rem", background: "#ffffff", borderTop: "1px solid #eee7de" }}>
        <form onSubmit={handleSend} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button type="button" title="Allega Foto Ispirazione" style={{ background: "#fdfbf7", border: "1px solid #eee7de", borderRadius: "50%", width: "45px", height: "45px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6a6764", fontSize: "1.2rem", transition: "all 0.2s" }}>
            📎
          </button>
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isAiPhase ? (isEng ? "Share a preference or question with AI Concierge..." : "Condividi un'idea o preferenza con l'AI Concierge...") : (isEng ? "Write a message to your Event Planner..." : "Scrivi un messaggio alla tua Event Planner...")}
            style={{ flex: 1, padding: "1rem 1.5rem", borderRadius: "24px", border: "1px solid #eee7de", background: "#fdfbf7", fontSize: "0.95rem", outline: "none" }}
          />
          <button type="submit" disabled={!newMessage.trim()} style={{ background: newMessage.trim() ? "#e58c2c" : "#e2d7c7", color: "#ffffff", border: "none", borderRadius: "24px", padding: "0 2rem", height: "48px", fontWeight: 600, cursor: newMessage.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
            {isEng ? "Send" : "Invia"}
          </button>
        </form>
      </div>

    </div>
  );
}
