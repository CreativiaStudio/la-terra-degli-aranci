"use client";

import React, { useEffect, useState } from "react";
import WeddingDiaryForm from "@/app/cliente/components/WeddingDiaryForm";
import { computeDiaryProgress } from "@/app/cliente/components/weddingDiaryFields";
import { syncPartnerSessionCookieAction } from "../actions";

interface DiarioClientViewProps {
  client: any;
  quote?: any;
  initialDiary?: any;
  shareToken?: string;
  shouldSetPartnerCookie?: boolean;
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12.031 2C6.496 2 2 6.502 2 12.046c0 1.942.548 3.75 1.503 5.289L2 22l4.821-1.464c1.472.871 3.203 1.365 5.21 1.365 5.535 0 10.031-4.502 10.031-10.046C22.062 6.502 17.566 2 12.031 2zm5.836 14.199c-.244.688-1.42 1.32-1.956 1.385-.506.06-1.157.087-3.738-.98-3.298-1.362-5.419-4.733-5.586-4.954-.161-.22-1.332-1.777-1.332-3.389 0-1.611.839-2.404 1.139-2.732.298-.328.653-.41.87-.41.218 0 .436.002.628.012.203.01.475-.078.744.567.275.66.938 2.298 1.021 2.467.083.169.138.368.028.59-.11.222-.165.36-.328.555-.164.195-.345.437-.493.587-.164.164-.336.344-.145.671.192.327.854 1.408 1.833 2.279 1.258 1.121 2.319 1.469 2.646 1.632.328.164.519.137.71-.082.192-.22.82-1.009 1.039-1.357.219-.348.437-.29.738-.179.3.11 1.905.899 2.233 1.063.328.164.546.246.628.383.082.136.082.793-.162 1.481z"/>
    </svg>
  );
}

export default function DiarioClientView({
  client,
  quote,
  initialDiary,
  shareToken,
  shouldSetPartnerCookie = false,
}: DiarioClientViewProps) {
  const [progress, setProgress] = useState<number>(() =>
    computeDiaryProgress(initialDiary?.answers)
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (shouldSetPartnerCookie && client?.id && shareToken) {
      void syncPartnerSessionCookieAction(client.id, shareToken);
    }
  }, [shouldSetPartnerCookie, client?.id, shareToken]);

  const clientName = client?.nome ? `${client.nome} ${client.cognome || ""}`.trim() : "Sposi";
  const shareParam = shareToken ? `&share=${encodeURIComponent(shareToken)}` : "";
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/openday/diario?id=${client.id}${shareParam}`
    : `https://ecosistema.laterradegliaranci.it/openday/diario?id=${client.id}${shareParam}`;

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Amore, ho aperto il nostro Wedding Diary a La Terra degli Aranci! 🌿\nPossiamo compilarlo insieme dai nostri due telefoni: tocca qui per aprirlo 👉 ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback manuale
    }
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
              title="Condividi con il partner su WhatsApp"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "#25D366",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "0.45rem 0.85rem",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(37, 211, 102, 0.3)",
              }}
            >
              <WhatsAppIcon size={16} />
              <span style={{ display: "inline-block" }}>Condividi con il partner</span>
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

        {/* Partner Sharing & Dual Device Collaboration Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #C8E6C9",
            borderLeft: "4px solid #25D366",
            borderRadius: "16px",
            padding: "1.2rem 1.3rem",
            marginBottom: "1.5rem",
            boxShadow: "0 4px 16px rgba(37, 211, 102, 0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "1.2rem" }}>📱</span>
                <span style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#2E7D32", fontWeight: 800 }}>
                  Compilazione Insieme da 2 Telefoni
                </span>
              </div>
              <h3 style={{ margin: "0 0 0.35rem 0", fontSize: "1.05rem", fontWeight: 700, color: "#1B5E20" }}>
                Condividi questo diario con il tuo partner
              </h3>
              <p style={{ margin: 0, fontSize: "0.86rem", color: "#4A4641", lineHeight: 1.55 }}>
                Potete compilare lo stesso form contemporaneamente da due smartphone differenti: <strong>l’account resta unico</strong> e le risposte si sincronizzano all’istante in tempo reale tra di voi e con la Direzione!
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: "0 0 auto", minWidth: "210px" }}>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                style={{
                  background: "#25D366",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "0.65rem 1rem",
                  fontSize: "0.86rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: "0 3px 10px rgba(37, 211, 102, 0.3)",
                }}
              >
                <WhatsAppIcon size={18} />
                <span>Invia su WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  background: copied ? "#E8F5E9" : "#F6F4EE",
                  color: copied ? "#2E7D32" : "#514D48",
                  border: `1px solid ${copied ? "#A5D6A7" : "#E2DDD5"}`,
                  borderRadius: "12px",
                  padding: "0.5rem 0.9rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                }}
              >
                <span>{copied ? "✓ Link Copiato!" : "📋 Copia Link Diretto"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Wedding Diary Form */}
        <WeddingDiaryForm
          clientId={client.id}
          quoteId={quote?.id}
          initialData={initialDiary}
          shareToken={shareToken}
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
          La Terra degli Aranci • Un Giardino di Emozioni
        </span>
      </div>
    </div>
  );
}
