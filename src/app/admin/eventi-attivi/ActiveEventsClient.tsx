"use client";

import React, { useState } from "react";

// Tipi fittizi per la demo
type ClientEvent = {
  id: string;
  names: string;
  date: string;
  unread: number;
  status: string;
  type: "wedding" | "event";
};

const MOCK_WEDDINGS: ClientEvent[] = [
  { id: "w1", names: "Mario & Elena", date: "15 Settembre 2027", unread: 2, status: "Definizione Menù", type: "wedding" },
  { id: "w2", names: "Luca & Giulia", date: "22 Ottobre 2027", unread: 0, status: "In Attesa Acconto 2", type: "wedding" },
  { id: "w3", names: "Alessandro & Martina", date: "05 Maggio 2028", unread: 1, status: "Nuovo Contratto", type: "wedding" },
];

const MOCK_EVENTS: ClientEvent[] = [
  { id: "e1", names: "Festa 18° Sofia", date: "10 Dicembre 2026", unread: 1, status: "Acconto Pagato", type: "event" },
  { id: "e2", names: "Battesimo Leonardo", date: "05 Gennaio 2027", unread: 0, status: "Definizione Menù", type: "event" },
];

const MOCK_MESSAGES: Record<string, { sender: "client" | "admin", text: string, time: string }[]> = {
  w1: [
    { sender: "client", text: "Ciao Roberto! Volevamo chiederti se era possibile aggiungere il caciocavallo impiccato al menù base.", time: "10:30" },
    { sender: "admin", text: "Ciao ragazzi! Certamente, ve lo aggiungo subito al preventivo aggiornato. Vi costa 8€ a persona in più.", time: "10:45" },
    { sender: "client", text: "Perfetto! E per la musica in Sala Tufo fino a che ora possiamo arrivare?", time: "11:02" },
    { sender: "client", text: "Ah, dimenticavo: abbiamo 3 vegani confermati.", time: "11:03" }
  ],
  e1: [
    { sender: "client", text: "Buongiorno, per la festa di Sofia i ragazzi vorrebbero la postazione DJ vicino al bar. È fattibile?", time: "Ieri 16:20" },
    { sender: "client", text: "Attendo info grazie!", time: "Ieri 18:00" }
  ]
};

export default function ActiveEventsClient() {
  const [activeTab, setActiveTab] = useState<"wedding" | "event">("wedding");
  const [selectedClient, setSelectedClient] = useState<ClientEvent | null>(null);
  
  // Chat state
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState("");

  const currentList = activeTab === "wedding" ? MOCK_WEDDINGS : MOCK_EVENTS;
  const currentMessages = selectedClient ? (messages[selectedClient.id] || []) : [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedClient) return;

    const updatedMessages = {
      ...messages,
      [selectedClient.id]: [
        ...currentMessages,
        { sender: "admin" as const, text: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]
    };

    setMessages(updatedMessages);
    setNewMessage("");

    // Reset unread count fittizio
    const list = activeTab === "wedding" ? MOCK_WEDDINGS : MOCK_EVENTS;
    const client = list.find(c => c.id === selectedClient.id);
    if (client) client.unread = 0;
  };

  return (
    <div style={{ height: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}>
      
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", color: "#e58c2c", fontWeight: "bold" }}>
          GESTIONE OPERATIVA
        </span>
        <h1 style={{ margin: "0.3rem 0 0 0", color: "#514d48", fontSize: "2.2rem", fontFamily: "serif" }}>
          🚀 Eventi Attivi & Conciergerie
        </h1>
      </div>

      <div className="premium-card" style={{ display: "flex", flex: 1, overflow: "hidden", background: "#ffffff", borderRadius: "16px", border: "1px solid #eae2d6" }}>
        
        {/* LEFT PANE: LISTA EVENTI */}
        <div style={{ width: "350px", borderRight: "1px solid #eae2d6", display: "flex", flexDirection: "column", background: "#fcfbfa" }}>
          
          {/* Tabs Navigazione */}
          <div style={{ display: "flex", borderBottom: "1px solid #eae2d6" }}>
            <button
              onClick={() => { setActiveTab("wedding"); setSelectedClient(null); }}
              style={{
                flex: 1,
                padding: "1rem",
                background: activeTab === "wedding" ? "#ffffff" : "transparent",
                border: "none",
                borderBottom: activeTab === "wedding" ? "3px solid #e58c2c" : "3px solid transparent",
                fontWeight: activeTab === "wedding" ? "bold" : "normal",
                color: activeTab === "wedding" ? "#1e1b18" : "#888",
                cursor: "pointer",
                fontSize: "0.95rem"
              }}
            >
              💍 Wedding Attivi
            </button>
            <button
              onClick={() => { setActiveTab("event"); setSelectedClient(null); }}
              style={{
                flex: 1,
                padding: "1rem",
                background: activeTab === "event" ? "#ffffff" : "transparent",
                border: "none",
                borderBottom: activeTab === "event" ? "3px solid #e58c2c" : "3px solid transparent",
                fontWeight: activeTab === "event" ? "bold" : "normal",
                color: activeTab === "event" ? "#1e1b18" : "#888",
                cursor: "pointer",
                fontSize: "0.95rem"
              }}
            >
              🎉 Eventi Privati
            </button>
          </div>

          {/* Lista Clienti */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
            {currentList.map(client => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                style={{
                  padding: "1rem",
                  background: selectedClient?.id === client.id ? "#fff7ed" : "#ffffff",
                  border: selectedClient?.id === client.id ? "1px solid #fed7aa" : "1px solid #eae2d6",
                  borderRadius: "12px",
                  marginBottom: "0.8rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: selectedClient?.id === client.id ? "0 4px 12px rgba(229,140,44,0.1)" : "none"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#1e1b18" }}>
                    {client.names}
                  </h3>
                  {client.unread > 0 && (
                    <span style={{ background: "#dc2626", color: "white", fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "10px", fontWeight: "bold" }}>
                      {client.unread}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.4rem" }}>
                  📅 {client.date}
                </div>
                <div style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: "#f0eee9", borderRadius: "4px", display: "inline-block", color: "#555" }}>
                  {client.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANE: CHAT & DETTAGLI */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#ffffff" }}>
          {selectedClient ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: "1.2rem 2rem", borderBottom: "1px solid #eae2d6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ margin: 0, color: "#1e1b18", fontSize: "1.4rem" }}>{selectedClient.names}</h2>
                  <span style={{ fontSize: "0.85rem", color: "#888" }}>Evento: {selectedClient.date}</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button style={{ padding: "0.5rem 1rem", background: "#f0eee9", border: "1px solid #ccc", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                    📑 Invia Preventivo
                  </button>
                  <button style={{ padding: "0.5rem 1rem", background: "#f0eee9", border: "1px solid #ccc", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                    📖 Vedi Wedding Diary
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, padding: "2rem", overflowY: "auto", background: "#faf7f2", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {currentMessages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#888", marginTop: "2rem" }}>Nessun messaggio in questa conversazione.</div>
                ) : (
                  currentMessages.map((msg, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: msg.sender === "admin" ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "70%",
                        padding: "1rem 1.2rem",
                        borderRadius: "16px",
                        background: msg.sender === "admin" ? "#1e1b18" : "#ffffff",
                        color: msg.sender === "admin" ? "#ffffff" : "#1e1b18",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                        border: msg.sender === "admin" ? "none" : "1px solid #eae2d6",
                        borderBottomRightRadius: msg.sender === "admin" ? "4px" : "16px",
                        borderBottomLeftRadius: msg.sender === "client" ? "4px" : "16px",
                      }}>
                        {msg.sender === "client" && (
                          <div style={{ fontSize: "0.75rem", color: "#e58c2c", fontWeight: "bold", marginBottom: "0.3rem" }}>
                            {selectedClient.names}
                          </div>
                        )}
                        <div style={{ fontSize: "0.95rem", lineHeight: 1.5 }}>
                          {msg.text}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: msg.sender === "admin" ? "#aaa" : "#888", textAlign: "right", marginTop: "0.5rem" }}>
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <div style={{ padding: "1.5rem 2rem", borderTop: "1px solid #eae2d6", background: "#ffffff" }}>
                <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "1rem" }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Scrivi un messaggio a Roberto Sola..."
                    style={{ flex: 1, padding: "1rem 1.5rem", borderRadius: "30px", border: "1px solid #ccc", fontSize: "1rem", outline: "none" }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    style={{
                      background: newMessage.trim() ? "#e58c2c" : "#ccc",
                      color: "white",
                      border: "none",
                      borderRadius: "30px",
                      padding: "0 2rem",
                      fontWeight: "bold",
                      cursor: newMessage.trim() ? "pointer" : "not-allowed",
                      transition: "background 0.3s"
                    }}
                  >
                    Invia ↗
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#888", background: "#faf7f2" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>💬</div>
              <h3 style={{ margin: 0, color: "#1e1b18" }}>Il Salotto Digitale</h3>
              <p>Seleziona una conversazione dalla lista per iniziare a chattare.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
