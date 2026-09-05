"use client";

import React, { useState } from "react";

interface Guest {
  id: string;
  name: string;
  role: string; // Parente, Amico, Testimone
  dietary: string; // Nessuna, Celiaco, Vegano, ecc.
  tableId: string | null;
}

interface Table {
  id: string;
  name: string;
  capacity: number;
}

interface GuestManagerProps {
  lang?: "it" | "en";
}

export default function GuestManager({ lang = "it" }: GuestManagerProps) {
  const isEng = lang === "en";

  // Mock Data
  const [guests, setGuests] = useState<Guest[]>([
    { id: "g1", name: "Mario Rossi", role: "Parente", dietary: "Nessuna", tableId: "t1" },
    { id: "g2", name: "Luigi Verdi", role: "Testimone", dietary: "Celiaco", tableId: "t1" },
    { id: "g3", name: "Anna Bianchi", role: "Amico", dietary: "Vegano", tableId: null },
    { id: "g4", name: "Giulia Neri", role: "Amico", dietary: "Nessuna", tableId: null },
    { id: "g5", name: "Marco Gialli", role: "Parente", dietary: "Allergia Frutta Secca", tableId: "t2" },
  ]);

  const tables: Table[] = [
    { id: "t1", name: "Tavolo Sposi", capacity: 6 },
    { id: "t2", name: "Tavolo Famiglia Sposa", capacity: 10 },
    { id: "t3", name: "Tavolo Amici (Università)", capacity: 8 },
  ];

  const unassignedGuests = guests.filter(g => g.tableId === null);

  const getGuestsForTable = (tableId: string) => {
    return guests.filter(g => g.tableId === tableId);
  };

  const getDietaryIssuesForTable = (tableId: string) => {
    return guests.filter(g => g.tableId === tableId && g.dietary !== "Nessuna").map(g => g.dietary);
  };

  const handleDragStart = (e: React.DragEvent, guestId: string) => {
    e.dataTransfer.setData("guestId", guestId);
  };

  const handleDrop = (e: React.DragEvent, tableId: string | null) => {
    e.preventDefault();
    const guestId = e.dataTransfer.getData("guestId");
    if (guestId) {
      setGuests(guests.map(g => g.id === guestId ? { ...g, tableId } : g));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div style={{ display: "flex", gap: "2rem", height: "calc(100vh - 120px)" }}>
      
      {/* Colonna Sinistra: Lista Ospiti */}
      <div style={{ flex: "1 1 350px", background: "#ffffff", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #eee7de", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #eee7de", background: "#fdfbf7" }}>
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#e58c2c", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
            {isEng ? "GUEST LIST" : "LISTA INVITATI"}
          </span>
          <h2 style={{ fontSize: "1.5rem", color: "#1e1b18", margin: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{guests.length} {isEng ? "Guests Total" : "Invitati Totali"}</span>
            <span style={{ fontSize: "1rem", background: "#e58c2c", color: "#fff", padding: "0.3rem 0.8rem", borderRadius: "20px" }}>
              {unassignedGuests.length} {isEng ? "to assign" : "da assegnare"}
            </span>
          </h2>
        </div>

        {/* Zona Non Assegnati (Drop Zone per rimuovere da tavolo) */}
        <div 
          onDrop={(e) => handleDrop(e, null)} 
          onDragOver={handleDragOver}
          style={{ flex: 1, padding: "1.5rem", overflowY: "auto", background: "#faf8f5" }}
        >
          <div style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#6a6764", fontWeight: 600 }}>
            {isEng ? "Unassigned Guests (Drag to Tables)" : "Invitati da sistemare (Trascina nei tavoli)"}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {unassignedGuests.map(guest => (
              <div 
                key={guest.id}
                draggable
                onDragStart={(e) => handleDragStart(e, guest.id)}
                style={{
                  background: "#fff",
                  padding: "1rem",
                  borderRadius: "12px",
                  border: "1px solid #eee7de",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
                  cursor: "grab",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "#1e1b18" }}>{guest.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "#6a6764" }}>{guest.role}</div>
                </div>
                {guest.dietary !== "Nessuna" && (
                  <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: 600 }}>
                    ⚠️ {guest.dietary}
                  </span>
                )}
              </div>
            ))}
            {unassignedGuests.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem", color: "#a39f9b", fontSize: "0.9rem", border: "2px dashed #e2d7c7", borderRadius: "12px" }}>
                {isEng ? "All guests have been assigned to a table!" : "Tutti gli invitati hanno un posto!"}
              </div>
            )}
          </div>
        </div>

        {/* Form Aggiunta Rapida */}
        <div style={{ padding: "1.5rem", background: "#fff", borderTop: "1px solid #eee7de" }}>
          <button style={{ width: "100%", background: "transparent", color: "#e58c2c", border: "1px solid #e58c2c", padding: "0.8rem", borderRadius: "10px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            + {isEng ? "Add Guest" : "Aggiungi Invitato"}
          </button>
        </div>
      </div>

      {/* Colonna Destra: Tavoli */}
      <div style={{ flex: "2 1 600px", background: "#ffffff", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #eee7de", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #eee7de", background: "#fdfbf7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#166534", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
              {isEng ? "TABLE LAYOUT" : "DISPOSIZIONE TAVOLI"}
            </span>
            <h2 style={{ fontSize: "1.5rem", color: "#1e1b18", margin: 0 }}>
              {isEng ? "Compose Your Tables" : "Componi la Sala"}
            </h2>
          </div>
          <button style={{ background: "#166534", color: "#fff", border: "none", padding: "0.6rem 1.2rem", borderRadius: "10px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>
            + {isEng ? "Add Table" : "Nuovo Tavolo"}
          </button>
        </div>

        <div style={{ flex: 1, padding: "2rem", overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem", alignContent: "start", background: "#faf8f5" }}>
          
          {tables.map(table => {
            const tableGuests = getGuestsForTable(table.id);
            const dietaryIssues = getDietaryIssuesForTable(table.id);
            const isFull = tableGuests.length >= table.capacity;

            return (
              <div 
                key={table.id}
                onDrop={(e) => handleDrop(e, table.id)} 
                onDragOver={handleDragOver}
                style={{ 
                  background: "#fff", 
                  borderRadius: "16px", 
                  border: `2px solid ${isFull ? "#166534" : "#eee7de"}`, 
                  boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {/* Header Tavolo */}
                <div style={{ padding: "1.2rem", borderBottom: "1px solid #eee7de", background: isFull ? "#f0fdf4" : "#fdfbf7", borderTopLeftRadius: "14px", borderTopRightRadius: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#1e1b18" }}>{table.name}</h3>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: isFull ? "#166534" : "#6a6764" }}>
                      {tableGuests.length} / {table.capacity}
                    </span>
                  </div>
                  {dietaryIssues.length > 0 && (
                    <div style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      ⚠️ {isEng ? "Dietary notices:" : "Attenzione:"} {dietaryIssues.join(", ")}
                    </div>
                  )}
                </div>

                {/* Lista Invitati nel Tavolo */}
                <div style={{ flex: 1, padding: "1rem", minHeight: "150px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {tableGuests.map(guest => (
                      <div 
                        key={guest.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, guest.id)}
                        style={{
                          background: "#faf8f5",
                          padding: "0.6rem 1rem",
                          borderRadius: "8px",
                          border: "1px solid #e2d7c7",
                          fontSize: "0.9rem",
                          color: "#1e1b18",
                          display: "flex",
                          justifyContent: "space-between",
                          cursor: "grab"
                        }}
                      >
                        <span>{guest.name}</span>
                        {guest.dietary !== "Nessuna" && (
                          <span title={guest.dietary} style={{ color: "#dc2626", fontWeight: 700 }}>!</span>
                        )}
                      </div>
                    ))}
                    {tableGuests.length === 0 && (
                      <div style={{ textAlign: "center", color: "#a39f9b", fontSize: "0.85rem", padding: "1rem 0" }}>
                        {isEng ? "Drop guests here" : "Trascina qui gli invitati"}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
}
