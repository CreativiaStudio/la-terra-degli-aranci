"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Presentation } from "@/lib/presentazioni";

interface PresentationViewerProps {
  presentation: Presentation;
}

const WHATSAPP_URL =
  "https://wa.me/390817148768?text=Buongiorno%2C%20vorrei%20informazioni%20sulla%20presentazione%20La%20Terra%20degli%20Aranci";

export default function PresentationViewer({ presentation }: PresentationViewerProps) {
  const slides = presentation.slides;
  const totalSlides = slides.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoverLeft, setHoverLeft] = useState(false);
  const [hoverRight, setHoverRight] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);

  const currentSlide = slides[currentIndex] || slides[0];

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Timer per auto-hide controlli dopo 3s di inattività del mouse
  const handleMouseMove = useCallback(() => {
    setControlsVisible(true);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [handleMouseMove]);

  // Controlli da tastiera
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Condivisione / Copia Link
  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: presentation.title,
          text: presentation.subtitle,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback a clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setToastMessage("Link copiato negli appunti!");
      setTimeout(() => setToastMessage(null), 2500);
    }
  }, [presentation.title, presentation.subtitle]);

  // Mobile Touch Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        goToNext(); // Swipe sinistra -> avanti
      } else {
        goToPrev(); // Swipe destra -> indietro
      }
    }
    touchStartX.current = null;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#18191b",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        userSelect: "none",
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Wrapper Slide Centrato 16:9 */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          maxWidth: "100vw",
          maxHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Immagine della slide Retina 2K */}
        <img
          key={currentSlide.id}
          src={currentSlide.imageUrl}
          alt={currentSlide.title || `Slide ${currentIndex + 1}`}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            aspectRatio: "16 / 9",
            boxShadow: "0 14px 40px rgba(0,0,0,0.6)",
            pointerEvents: "none",
            display: "block",
          }}
        />

        {/* ========================================================================= */}
        {/* LE DUE SEZIONI INVISIBILI 50/50 CON HOVER TRIGGER (MECCANISMO CANVA 1:1)   */}
        {/* ========================================================================= */}

        {/* Metà Sinistra (Slide Precedente) */}
        <div
          onClick={goToPrev}
          onMouseEnter={() => setHoverLeft(true)}
          onMouseLeave={() => setHoverLeft(false)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "50%",
            zIndex: 30,
            cursor: currentIndex > 0 ? "pointer" : "default",
          }}
          title={currentIndex > 0 ? "Slide precedente" : undefined}
        />

        {/* Metà Destra (Slide Successiva) */}
        <div
          onClick={goToNext}
          onMouseEnter={() => setHoverRight(true)}
          onMouseLeave={() => setHoverRight(false)}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "50%",
            zIndex: 30,
            cursor: currentIndex < totalSlides - 1 ? "pointer" : "default",
          }}
          title={currentIndex < totalSlides - 1 ? "Slide successiva" : undefined}
        />

        {/* Freccetta Sinistra (Canva Minimal Circolare) */}
        <div
          style={{
            position: "absolute",
            left: "24px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.72)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.15)",
            pointerEvents: "none",
            opacity: hoverLeft && currentIndex > 0 ? 1 : 0,
            transition: "opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s ease",
            zIndex: 35,
          }}
          aria-hidden="true"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>

        {/* Freccetta Destra (Canva Minimal Circolare) */}
        <div
          style={{
            position: "absolute",
            right: "24px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.72)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.15)",
            pointerEvents: "none",
            opacity: hoverRight && currentIndex < totalSlides - 1 ? 1 : 0,
            transition: "opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s ease",
            zIndex: 35,
          }}
          aria-hidden="true"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA CONTROLLI MINIMALE FLOATING A SCOMPARSA IN BASSO                    */}
      {/* ========================================================================= */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: "14px",
          backgroundColor: "rgba(24, 25, 27, 0.85)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "30px",
          padding: "6px 16px",
          color: "#ffffff",
          fontSize: "13px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
          opacity: controlsVisible ? 1 : 0,
          pointerEvents: controlsVisible ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      >
        {/* Torna alla panoramica */}
        <Link
          href="/presentazioni"
          style={{
            color: "#ffffff",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: 0.85,
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
          }}
          title="Torna all'elenco presentazioni"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Elenco</span>
        </Link>

        <span style={{ opacity: 0.25, userSelect: "none" }}>|</span>

        {/* Contatore Slide */}
        <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums", minWidth: "48px", textAlign: "center" }}>
          {currentIndex + 1} / {totalSlides}
        </span>

        <span style={{ opacity: 0.25, userSelect: "none" }}>|</span>

        {/* Schermo Intero */}
        <button
          type="button"
          onClick={toggleFullscreen}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            opacity: 0.85,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "2px",
          }}
          title={isFullscreen ? "Esci da schermo intero" : "Schermo intero (F)"}
        >
          {isFullscreen ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          )}
        </button>

        {/* Condividi */}
        <button
          type="button"
          onClick={handleShare}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            opacity: 0.85,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "2px",
          }}
          title="Condividi / Copia link"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>

        {/* WhatsApp */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#25D366",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            padding: "2px",
          }}
          title="Contattaci su WhatsApp"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </a>
      </div>

      {/* Toast Notifica */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#c5a059",
            color: "#0e1015",
            padding: "8px 18px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            zIndex: 10000,
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
