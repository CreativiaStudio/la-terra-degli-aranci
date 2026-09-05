"use client";

import React from "react";
import Link from "next/link";

interface UpcomingEventsProps {
  lang?: "it" | "en";
}

export default function UpcomingEvents({ lang = "it" }: UpcomingEventsProps) {
  const isEng = lang === "en";

  const publicEvents = [
    {
      id: "ev-1",
      titolo: isEng ? "Valentine's Day Dinner under the Stars" : "Cena Romantica di San Valentino sotto le Stelle",
      data: isEng ? "February 14, 2027" : "14 Febbraio 2027",
      image: "https://www.laterradegliaranci.it/wp-content/uploads/2024/07/sala-terradegliaranci.jpg",
      descrizione: isEng 
        ? "An exclusive 5-course gourmet dinner in the Winter Garden. Exclusive 20% discount and 48h early bird access for Ecosystem Club Members." 
        : "Una cena gourmet esclusiva di 5 portate nel Giardino d'Inverno. Sconto del 20% ed accesso in prevendita 48h prima riservato ai membri del Club Ecosistema.",
      prezzoPubblico: "€ 120 / pax",
      prezzoClub: "€ 95 / pax",
      scontoBadge: "-20% CLUB TDA",
      prevenditaActive: true
    },
    {
      id: "ev-2",
      titolo: isEng ? "Spring Awakening & Jazz Concert" : "Risveglio di Primavera & Concerto Jazz",
      data: isEng ? "April 20, 2027" : "20 Aprile 2027",
      image: "https://www.laterradegliaranci.it/wp-content/uploads/2024/11/terra-degli-aranci-location.webp",
      descrizione: isEng 
        ? "A relaxing evening in the citrus grove with live jazz music, botanical cocktails, and finger food." 
        : "Una serata rilassante nell'agrumeto con musica jazz dal vivo, cocktail botanici e degustazione finger food.",
      prezzoPubblico: "€ 65 / pax",
      prezzoClub: "€ 50 / pax",
      scontoBadge: "-23% CLUB TDA",
      prevenditaActive: true
    },
    {
      id: "ev-3",
      titolo: isEng ? "Traditional Easter Lunch in the Winter Garden" : "Gran Pranzo di Pasqua Tradizionale & Agrumi in Fiore",
      data: isEng ? "March 28, 2027" : "28 Marzo 2027",
      image: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=800&auto=format&fit=crop",
      descrizione: isEng
        ? "The great Neapolitan Easter tradition reinterpreted by Iovino Banqueting in our centuries-old park."
        : "La grande tradizione pasquale partenopea con menù degustazione d'autore Iovino Banqueting nel parco secolare.",
      prezzoPubblico: "€ 110 / pax",
      prezzoClub: "€ 85 / pax",
      scontoBadge: "-22% CLUB TDA",
      prevenditaActive: true
    }
  ];

  return (
    <div style={{ background: "#ffffff", borderRadius: "20px", padding: "2.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #eee7de" }}>
      
      {/* Banner Vantaggio Club Ecosistema */}
      <div style={{ 
        background: "linear-gradient(135deg, #1e1b18 0%, #3a342e 100%)", 
        color: "#ffffff", 
        padding: "1.5rem 2rem", 
        borderRadius: "16px", 
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "2rem" }}>🎟️</span>
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700, display: "block" }}>
              VANTAGGIO ESCLUSIVO CLIENTE STORICO
            </span>
            <h3 style={{ margin: "0.2rem 0 0 0", fontSize: "1.2rem", fontWeight: 600, color: "#ffffff" }}>
              {isEng ? "TDA Ecosystem VIP Club Member" : "Membro del Club Ecosistema La Terra degli Aranci"}
            </h3>
          </div>
        </div>
        <div style={{ background: "rgba(229, 140, 44, 0.2)", border: "1px solid #e58c2c", padding: "0.5rem 1.2rem", borderRadius: "20px", fontSize: "0.85rem", color: "#f5d0a6", fontWeight: 700 }}>
          ⭐ {isEng ? "48h Priority Booking & Discounts" : "Prevendita 48h & Sconti Riservati"}
        </div>
      </div>

      <div style={{ marginBottom: "2.5rem" }}>
        <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700 }}>
          {isEng ? "EXCLUSIVE CLUB EVENTS" : "EVENTI IN PROGRAMMA IN LOCATION"}
        </span>
        <h2 style={{ fontSize: "1.8rem", color: "#1e1b18", marginTop: "0.3rem" }}>
          🥂 {isEng ? "Upcoming Public Events & Galas" : "Prossimi Eventi Aperti, Cene Spettacolo & Gala"}
        </h2>
        <p style={{ color: "#6a6764", fontSize: "1rem", marginTop: "0.4rem", lineHeight: 1.6 }}>
          {isEng
            ? "In as a member of our ecosystem, you enjoy priority access and exclusive pricing to all public events hosted at the villa."
            : "In quanto cliente dell'Ecosistema La Terra degli Aranci, hai diritto alla prevendita prioritaria ed alle tariffe convenzionate per tutti gli eventi pubblici organizzati in location."}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {publicEvents.map((ev) => (
          <div key={ev.id} style={{ 
            display: "flex", 
            background: "#fdfbf7", 
            borderRadius: "16px", 
            overflow: "hidden", 
            border: "1px solid #eee8df",
            flexDirection: "row",
            flexWrap: "wrap"
          }}>
            {/* Immagine */}
            <div style={{ 
              flex: "1 1 300px", 
              minHeight: "220px", 
              backgroundImage: `url('${ev.image}')`, 
              backgroundSize: "cover", 
              backgroundPosition: "center",
              position: "relative"
            }}>
              <span style={{
                position: "absolute",
                top: "1rem",
                left: "1rem",
                background: "#c2410c",
                color: "#ffffff",
                fontSize: "0.75rem",
                fontWeight: 800,
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
              }}>
                {ev.scontoBadge}
              </span>
            </div>
            
            {/* Contenuto */}
            <div style={{ flex: "2 1 400px", padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.8rem" }}>
                  <span style={{ display: "inline-block", background: "#e58c2c", color: "#ffffff", fontSize: "0.75rem", fontWeight: 700, padding: "0.3rem 0.8rem", borderRadius: "20px", textTransform: "uppercase" }}>
                    📅 {ev.data}
                  </span>
                  {ev.prevenditaActive && (
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.25rem 0.7rem", borderRadius: "14px" }}>
                      ⭐ Prevendita Club Attiva
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: "1.4rem", color: "#1e1b18", fontWeight: 600, margin: "0 0 0.6rem 0" }}>
                  {ev.titolo}
                </h3>
                <p style={{ color: "#6a6764", fontSize: "0.95rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                  {ev.descrizione}
                </p>
                
                <div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
                  <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#e58c2c" }}>
                    {ev.prezzoClub}
                  </span>
                  <span style={{ fontSize: "0.9rem", color: "#a39f9b", textDecoration: "line-through" }}>
                    {ev.prezzoPubblico}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 700 }}>
                    (Riservato Club Ecosistema)
                  </span>
                </div>
              </div>
              
              <div style={{ marginTop: "1.5rem" }}>
                <Link href={`/eventi/${ev.id}`}>
                  <button
                    style={{
                      background: "linear-gradient(135deg, #1e1b18 0%, #3a342e 100%)",
                      color: "#ffffff",
                      border: "none",
                      padding: "0.85rem 2rem",
                      borderRadius: "12px",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.6rem"
                    }}
                  >
                    🎟️ {isEng ? "Book with Club Discount" : "Riserva Ticket con Sconto Club"}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
