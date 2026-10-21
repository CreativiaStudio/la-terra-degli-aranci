"use client";

import React, { useState } from "react";
import WeddingDiaryForm from "@/app/cliente/components/WeddingDiaryForm";
import { computeDiaryProgress } from "@/app/cliente/components/weddingDiaryFields";

interface DiarioClientViewProps {
  client: any;
  quote?: any;
  initialDiary?: any;
}

export default function DiarioClientView({
  client,
  quote,
  initialDiary,
}: DiarioClientViewProps) {
  const [progress, setProgress] = useState<number>(() =>
    computeDiaryProgress(initialDiary?.answers)
  );

  const clientName = client?.nome ? `${client.nome} ${client.cognome || ""}`.trim() : "Sposi";
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/openday/diario?id=${client.id}`
    : `https://ecosistema.laterradegliaranci.it/openday/diario?id=${client.id}`;

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Ecco il nostro Wedding Diary a La Terra degli Aranci: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #FAF8F5 0%, #F6F1E9 100%)",
        color: "#2B2B2B",
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        paddingBottom: "5rem",
      }}
    >
      {/* Sticky Top Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #E8E2D8",
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          padding: "0.75rem 1rem",
        }}
      >
        <div
          style={{
            maxWidth: "768px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          {/* Logo & Names */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <img
              src="/logo-simbolo.png"
              alt="Logo TDA"
              style={{ width: "38px", height: "38px", objectFit: "contain" }}
            />
            <div>
              <div
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#2D5A27",
                  fontWeight: 700,
                }}
              >
                Wedding Diary • Livello 1
              </div>
              <div style={{ fontSize: "0.98rem", fontWeight: 700, color: "#2B2B2B" }}>
                {clientName}
              </div>
            </div>
          </div>

          {/* Progress Pill & WhatsApp Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.7rem",
                borderRadius: "999px",
                background: progress >= 80 ? "#E8F5E9" : "#FFF3E0",
                color: progress >= 80 ? "#2D5A27" : "#E58C2C",
                fontSize: "0.82rem",
                fontWeight: 700,
              }}
            >
              <span>{progress}%</span>
            </div>

            <button
              onClick={handleShareWhatsApp}
              title="Salva e Invia Link su WhatsApp"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                background: "#25D366",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "0.45rem 0.8rem",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(37, 211, 102, 0.3)",
              }}
            >
              <span>📲</span>
              <span style={{ display: "inline-block" }}>Salva su WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div
          style={{
            maxWidth: "768px",
            margin: "0.5rem auto 0 auto",
            height: "4px",
            background: "#E8E2D8",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #E58C2C 0%, #2D5A27 100%)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main
        style={{
          maxWidth: "768px",
          margin: "1.2rem auto",
          padding: "0 1rem",
        }}
      >
        {/* Welcome Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #FFF9F2 0%, #F5ECE0 100%)",
            border: "1px solid #F0DFCC",
            borderLeft: "4px solid #E58C2C",
            borderRadius: "16px",
            padding: "1.2rem 1.4rem",
            marginBottom: "1.5rem",
            boxShadow: "0 4px 16px rgba(229, 140, 44, 0.08)",
          }}
        >
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>🌿</span>
            <div>
              <h2
                style={{
                  margin: "0 0 0.3rem 0",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "#9A5A10",
                }}
              >
                Benvenuti nel Parco di La Terra degli Aranci
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.88rem",
                  color: "#514D48",
                  lineHeight: 1.55,
                }}
              >
                Mentre visitate le nostre sale e l'agrumeto secolare, esprimete qui i vostri desideri su rito, sapori, allestimenti e musica. Le vostre preferenze verranno salvate e condivise con la Direzione de La Terra degli Aranci, potrete sempre modificarle nella vostra Area.
              </p>
            </div>
          </div>
        </div>

        {/* Wedding Diary Form */}
        <WeddingDiaryForm
          clientId={client.id}
          quoteId={quote?.id}
          initialData={initialDiary}
          lang="it"
          isReadOnly={false}
          onProgressChange={setProgress}
        />
      </main>

      {/* Fixed Bottom Bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid #E8E2D8",
          padding: "0.65rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          fontSize: "0.82rem",
          color: "#514D48",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.04)",
          zIndex: 90,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ color: "#2D5A27", fontSize: "0.9rem" }}>🟢</span>
          <span>Salvataggio continuo attivo</span>
        </span>
        <span>•</span>
        <span style={{ color: "#8E8880" }}>
          La Terra degli Aranci
        </span>
      </div>
    </div>
  );
}
