"use client";

import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";

interface CalendarioClientProps {
  quotes: any[];
  signedPdfs: any[];
}

// Eventi dimostrativi integrati per la simulazione completa
const INITIAL_DEMO_EVENTS = [
  {
    id: "demo-mario-elena",
    title: "Matrimonio Mario Pepe & Elena",
    clientName: "Mario Pepe & Elena",
    tipo: "wedding", // wedding, privato, visita
    status: "firmato", // firmato, opzione, visita
    data: "2027-06-12",
    ora: "11:30",
    turno: "pranzo",
    invitati: 120,
    importo: 15330,
    sala: "esclusiva_villa", // esclusiva_villa, sala_bianca, sala_tufo
    note: "Rito Simbolico in Giardino delle Promesse + Banchetto in Sala Bianca & After Party in Sala Tufo."
  },
  {
    id: "demo-giuseppe-maria",
    title: "Matrimonio Giuseppe & Maria",
    clientName: "Giuseppe Rossi & Maria",
    tipo: "wedding",
    status: "firmato",
    data: "2027-09-18",
    ora: "12:00",
    turno: "pranzo",
    invitati: 150,
    importo: 18500,
    sala: "esclusiva_villa",
    note: "Contratto firmato. Acconto caparra €5.550 versato."
  },
  {
    id: "demo-battesimo-luca",
    title: "Battesimo Luca Esposito",
    clientName: "Antonio Esposito",
    tipo: "privato",
    status: "firmato",
    data: "2027-05-20",
    ora: "16:00",
    turno: "cena",
    invitati: 65,
    importo: 4800,
    sala: "sala_tufo",
    note: "Festa in semi-esclusiva in Sala Tufo e giardino antistante."
  },
  {
    id: "demo-visita-1",
    title: "Visita Accoglienza Sposi (Segreteria)",
    clientName: "Coppia De Luca & Russo",
    tipo: "visita",
    status: "visita",
    data: "2027-01-15",
    ora: "11:00",
    turno: "mattina",
    invitati: 2,
    importo: 0,
    sala: "giardino_agrumeto",
    note: "Prima visita guidata con la segreteria (Project Builder su Tablet)."
  },
  {
    id: "demo-visita-2",
    title: "Incontro Chiusura Ufficio (Roberto)",
    clientName: "Coppia Ferrara & Capri",
    tipo: "visita",
    status: "visita",
    data: "2027-01-22",
    ora: "16:30",
    turno: "pomeriggio",
    invitati: 2,
    importo: 0,
    sala: "ufficio_roberto",
    note: "Chiusura preventivo e firma QR code con Roberto Sola."
  }
];

export default function CalendarioClient({ quotes, signedPdfs }: CalendarioClientProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2027, 0, 1)); // Gennaio 2027
  const [activeFilter, setActiveFilter] = useState<string>("tutti"); // tutti, wedding, privato, visita, esclusiva
  const [eventsList, setEventsList] = useState<any[]>(() => {
    // Convert quotes into event objects
    const realEvents = quotes.map(q => ({
      id: q.id,
      title: `${q.tipo_evento === 'privato' ? 'Evento Privato' : 'Matrimonio'} ${q.clients?.nome || ''} ${q.clients?.cognome || ''}`,
      clientName: `${q.clients?.nome || 'Cliente'} ${q.clients?.cognome || ''}`,
      tipo: q.tipo_evento || 'wedding',
      status: q.status || 'opzione',
      data: q.data_evento || '2027-01-20',
      ora: '12:00',
      turno: 'pranzo',
      invitati: q.numero_ospiti || 100,
      importo: Number(q.totale_calcolato || 15000),
      sala: q.tipo_evento === 'privato' ? 'sala_tufo' : 'esclusiva_villa',
      note: "Preventivo inserito nell'Ecosistema TDA."
    }));
    return [...INITIAL_DEMO_EVENTS, ...realEvents];
  });

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any | null>(null);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Calculate statistics
  const totalWeddings = eventsList.filter(e => e.tipo === 'wedding' && e.status === 'firmato').length;
  const totalPrivate = eventsList.filter(e => e.tipo === 'privato' && e.status === 'firmato').length;
  const totalVisits = eventsList.filter(e => e.tipo === 'visita').length;
  const totalExclusives = eventsList.filter(e => e.sala === 'esclusiva_villa').length;

  const getEventsForDay = (day: Date) => {
    return eventsList.filter(e => {
      if (!e.data) return false;
      try {
        const d = parseISO(e.data);
        if (!isSameDay(d, day)) return false;

        if (activeFilter === 'wedding') return e.tipo === 'wedding';
        if (activeFilter === 'privato') return e.tipo === 'privato';
        if (activeFilter === 'visita') return e.tipo === 'visita';
        if (activeFilter === 'esclusiva') return e.sala === 'esclusiva_villa';
        return true;
      } catch (err) {
        return false;
      }
    });
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleOpenEdit = (evt: any) => {
    setSelectedEvent(evt);
    setEditForm({ ...evt });
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    setEventsList(prev => prev.map(e => e.id === editForm.id ? editForm : e));
    setSelectedEvent(null);
    setEditForm(null);
  };

  return (
    <div style={{ maxWidth: "1250px", margin: "0 auto", fontFamily: "'Outfit', system-ui, sans-serif", color: "#2c2a27" }}>
      
      {/* Header Sezione */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ textTransform: "uppercase", letterSpacing: "2.5px", fontSize: "0.78rem", color: "#e58c2c", fontWeight: 800 }}>
            DISPONIBILITÀ LOCATION & AGENDA DIREZIONALE
          </span>
          <h1 style={{ margin: "0.2rem 0 0 0", color: "#1e1b18", fontSize: "2.2rem", fontFamily: "Georgia, serif", fontWeight: 600 }}>
            📅 Calendario Villa, Eventi & Visite
          </h1>
          <p style={{ margin: "0.2rem 0 0 0", color: "#78716c", fontSize: "0.95rem" }}>
            Gestione occupazione sale in esclusiva, contratti firmati e visite accoglienza in tempo reale.
          </p>
        </div>

        {/* Controlli Mese */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "#ffffff", padding: "0.6rem 1.2rem", borderRadius: "14px", border: "1px solid #e8e2d9", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <button type="button" onClick={handlePrevMonth} style={{ background: "#f5f0e8", border: "none", borderRadius: "8px", padding: "0.4rem 0.8rem", fontSize: "1rem", cursor: "pointer", fontWeight: "bold" }}>⬅️</button>
          <strong style={{ fontSize: "1.15rem", color: "#1e1b18", textTransform: "capitalize", minWidth: "170px", textAlign: "center", fontFamily: "Georgia, serif" }}>
            {format(currentMonth, 'MMMM yyyy', { locale: it })}
          </strong>
          <button type="button" onClick={handleNextMonth} style={{ background: "#f5f0e8", border: "none", borderRadius: "8px", padding: "0.4rem 0.8rem", fontSize: "1rem", cursor: "pointer", fontWeight: "bold" }}>➡️</button>
        </div>
      </div>

      {/* TOP KPI COUNTERS (I 4 PILASTRI RICHIESTI DA ROBERTO) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        
        <div style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", border: "1px solid #fed7aa", padding: "1.1rem 1.25rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(229,140,44,0.08)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#c2410c", textTransform: "uppercase", letterSpacing: "1px" }}>
            💍 MATRIMONI FIRMATI
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1e1b18", margin: "0.2rem 0" }}>
            {totalWeddings}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#78716c" }}>Contratti d'esclusiva confermati</span>
        </div>

        <div style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)", border: "1px solid #ddd6fe", padding: "1.1rem 1.25rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(139,92,246,0.08)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6d28d9", textTransform: "uppercase", letterSpacing: "1px" }}>
            🎉 EVENTI PRIVATI
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1e1b18", margin: "0.2rem 0" }}>
            {totalPrivate}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#78716c" }}>Comunioni, Battesimi e Feste</span>
        </div>

        <div style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", border: "1px solid #bae6fd", padding: "1.1rem 1.25rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(2,132,199,0.08)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0369a1", textTransform: "uppercase", letterSpacing: "1px" }}>
            🕒 VISITE ACCOGLIENZA
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1e1b18", margin: "0.2rem 0" }}>
            {totalVisits}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#78716c" }}>Slot segreteria & Roberto</span>
        </div>

        <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #bbf7d0", padding: "1.1rem 1.25rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(22,163,74,0.08)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: "1px" }}>
            👑 ESCLUSIVA VILLA
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1e1b18", margin: "0.2rem 0" }}>
            {totalExclusives}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#78716c" }}>Struttura interamente bloccata</span>
        </div>

      </div>

      {/* BARRA FILTRI RAPIDI PER CATEGORIA (1-CLICK SWITCH) */}
      <div style={{ background: "#ffffff", padding: "1rem 1.25rem", borderRadius: "16px", border: "1px solid #e8e2d9", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", boxShadow: "0 4px 14px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1e1b18", textTransform: "uppercase", letterSpacing: "1px" }}>
            Filtra Visualizzazione:
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveFilter("tutti")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: activeFilter === "tutti" ? "2px solid #1e1b18" : "1px solid #e2d7c7",
              background: activeFilter === "tutti" ? "#1e1b18" : "#fdfbf7",
              color: activeFilter === "tutti" ? "#ffffff" : "#544e45",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            🌐 Tutti gli Eventi & Visite
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("wedding")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: activeFilter === "wedding" ? "2px solid #e58c2c" : "1px solid #e2d7c7",
              background: activeFilter === "wedding" ? "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)" : "#fdfbf7",
              color: activeFilter === "wedding" ? "#ffffff" : "#544e45",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            💍 Solo Matrimoni ({totalWeddings})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("privato")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: activeFilter === "privato" ? "2px solid #8b5cf6" : "1px solid #e2d7c7",
              background: activeFilter === "privato" ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" : "#fdfbf7",
              color: activeFilter === "privato" ? "#ffffff" : "#544e45",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            🎉 Solo Eventi Privati ({totalPrivate})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("visita")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: activeFilter === "visita" ? "2px solid #0284c7" : "1px solid #bae6fd",
              background: activeFilter === "visita" ? "#0284c7" : "#f0f9ff",
              color: activeFilter === "visita" ? "#ffffff" : "#0369a1",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            🕒 Solo Appuntamenti Visita ({totalVisits})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("esclusiva")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: activeFilter === "esclusiva" ? "2px solid #16a34a" : "1px solid #bbf7d0",
              background: activeFilter === "esclusiva" ? "#16a34a" : "#f0fdf4",
              color: activeFilter === "esclusiva" ? "#ffffff" : "#15803d",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            👑 Solo Esclusiva Villa ({totalExclusives})
          </button>
        </div>
      </div>

      {/* GRID CALENDARIO MENSILE AD ALTA DEFINIZIONE */}
      <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e8e2d9", padding: "1.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px" }}>
          
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(dayName => (
            <div key={dayName} style={{ padding: "0.8rem", fontWeight: 800, color: "#8c857b", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "1px", textAlign: "center" }}>
              {dayName}
            </div>
          ))}

          {days.map(day => {
            const dayEvents = getEventsForDay(day);
            const hasEvent = dayEvents.length > 0;
            const hasWedding = dayEvents.some(e => e.tipo === 'wedding');
            const hasPrivate = dayEvents.some(e => e.tipo === 'privato');
            const hasVisitOnly = hasEvent && dayEvents.every(e => e.tipo === 'visita');

            return (
              <div 
                key={day.toISOString()} 
                style={{
                  minHeight: "125px",
                  background: hasWedding ? '#fff7ed' : hasPrivate ? '#f5f3ff' : hasVisitOnly ? '#f0f9ff' : '#ffffff',
                  borderRadius: "14px",
                  border: hasWedding ? "2px solid #e58c2c" : hasPrivate ? "2px solid #8b5cf6" : hasVisitOnly ? "2px dashed #0284c7" : "1px solid #eee8df",
                  padding: "0.6rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease-out",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 800, color: "#1e1b18", fontSize: "1rem" }}>
                    {format(day, 'd')}
                  </span>
                  {hasEvent && (
                    <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#78716c", background: "#ffffff", padding: "0.15rem 0.4rem", borderRadius: "10px", border: "1px solid #e2d7c7" }}>
                      {dayEvents.length} {dayEvents.length === 1 ? 'voce' : 'voci'}
                    </span>
                  )}
                </div>

                {hasEvent ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {dayEvents.map(evt => {
                      const isWedding = evt.tipo === 'wedding';
                      const isPrivato = evt.tipo === 'privato';
                      const isVisita = evt.tipo === 'visita';

                      return (
                        <div 
                          key={evt.id}
                          onClick={() => handleOpenEdit(evt)}
                          style={{
                            background: isWedding
                              ? 'linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)'
                              : isPrivato
                              ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
                              : '#f0f9ff',
                            color: isVisita ? '#0369a1' : '#ffffff',
                            border: isVisita ? '1.5px dashed #0284c7' : 'none',
                            padding: "0.45rem 0.6rem",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: isVisita ? 'none' : '0 2px 6px rgba(0,0,0,0.12)',
                            transition: "all 0.2s",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>{isWedding ? '💍 Matrimonio' : isPrivato ? '🎉 Evento Privato' : `🕒 ${evt.ora} Visita`}</span>
                            <span style={{ fontSize: "0.62rem", opacity: 0.9 }}>
                              {evt.sala === 'esclusiva_villa' ? '👑 Villa' : evt.sala === 'sala_tufo' ? '🏛️ Tufo' : '🏛️ Bianca'}
                            </span>
                          </div>
                          <div style={{ fontWeight: 800, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {evt.clientName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span style={{ fontSize: "0.72rem", color: "#a8a29e", textAlign: "center", marginTop: "auto" }}>
                    Libera
                  </span>
                )}
              </div>
            );
          })}

        </div>
      </div>

      {/* MODALE DETTAGLIO & MODIFICA APPUNTAMENTO/EVENTO (PER LA DIREZIONE) */}
      {selectedEvent && editForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1.5rem"
        }}>
          <div style={{
            background: "#ffffff",
            width: "100%",
            maxWidth: "650px",
            borderRadius: "24px",
            border: "1px solid #e8e2d9",
            padding: "2rem",
            boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            position: "relative"
          }}>
            
            <button
              type="button"
              onClick={() => { setSelectedEvent(null); setEditForm(null); }}
              style={{
                position: "absolute",
                top: "1.5rem",
                right: "1.5rem",
                background: "#f5f0e8",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "1rem"
              }}
            >
              ✕
            </button>

            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 800 }}>
              GESTIONE DIREZIONALE EVENTO & APPUNTAMENTO
            </span>
            <h2 style={{ margin: "0.3rem 0 1rem 0", color: "#1e1b18", fontSize: "1.6rem", fontFamily: "Georgia, serif" }}>
              {selectedEvent.title}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              
              {/* Riga 1: Data Evento & Orario (Per lo Spostamento Al Volo) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#78716c", display: "block", marginBottom: "0.4rem" }}>
                    Data Evento / Appuntamento:
                  </label>
                  <input
                    type="date"
                    value={editForm.data || ''}
                    onChange={(e) => setEditForm({ ...editForm, data: e.target.value })}
                    style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #e58c2c", background: "#fff7ed", color: "#1e1b18", fontWeight: 700, outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#78716c", display: "block", marginBottom: "0.4rem" }}>
                    Ora / Turno:
                  </label>
                  <input
                    type="text"
                    value={editForm.ora || ''}
                    onChange={(e) => setEditForm({ ...editForm, ora: e.target.value })}
                    style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #e2d7c7", background: "#fdfbf7", color: "#1e1b18", fontWeight: 600, outline: "none" }}
                  />
                </div>
              </div>

              {/* Riga 2: Tipologia & Assegnazione Sale */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#78716c", display: "block", marginBottom: "0.4rem" }}>
                    Tipologia Evento:
                  </label>
                  <select
                    value={editForm.tipo || 'wedding'}
                    onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })}
                    style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #e2d7c7", background: "#fdfbf7", color: "#1e1b18", fontWeight: 600, outline: "none" }}
                  >
                    <option value="wedding">💍 Matrimonio</option>
                    <option value="privato">🎉 Evento Privato (Battesimo/Comunione/Festa)</option>
                    <option value="visita">🕒 Visita Accoglienza Segreteria</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#78716c", display: "block", marginBottom: "0.4rem" }}>
                    Occupazione Sale & Esclusività:
                  </label>
                  <select
                    value={editForm.sala || 'esclusiva_villa'}
                    onChange={(e) => setEditForm({ ...editForm, sala: e.target.value })}
                    style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #e2d7c7", background: "#fdfbf7", color: "#1e1b18", fontWeight: 600, outline: "none" }}
                  >
                    <option value="esclusiva_villa">👑 Esclusiva Intera Villa (6.000 mq)</option>
                    <option value="sala_bianca">🏛️ Sala Bianca (Fino a 200 Pax)</option>
                    <option value="sala_tufo">🏛️ Sala Tufo (Fino a 80 Pax / After Party)</option>
                  </select>
                </div>
              </div>

              {/* Riga 3: Note & Istruzioni Roberto */}
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#78716c", display: "block", marginBottom: "0.4rem" }}>
                  Note Direzionali per lo Staff / Motivo Spostamento:
                </label>
                <textarea
                  value={editForm.note || ''}
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1px solid #e2d7c7", background: "#fffefb", color: "#2c2a27", fontSize: "0.88rem", minHeight: "80px" }}
                />
              </div>

              {/* Pulsante Salvataggio */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => { setSelectedEvent(null); setEditForm(null); }}
                  style={{ padding: "0.8rem 1.2rem", background: "#f5f0e8", border: "none", borderRadius: "12px", fontWeight: 700, color: "#78716c", cursor: "pointer" }}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  style={{ padding: "0.8rem 1.6rem", background: "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)", border: "none", borderRadius: "12px", fontWeight: 800, color: "#ffffff", cursor: "pointer", boxShadow: "0 4px 14px rgba(229,140,44,0.3)" }}
                >
                  💾 Salva Modifiche Evento
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
