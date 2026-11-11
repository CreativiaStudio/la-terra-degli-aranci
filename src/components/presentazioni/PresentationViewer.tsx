"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Presentation } from "@/lib/presentazioni";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize,
  Share2,
  RotateCcw,
  MessageCircle,
  Check,
} from "lucide-react";

const WHATSAPP_URL =
  "https://wa.me/390817148768?text=Buongiorno%2C%20vorrei%20informazioni%20sulla%20presentazione%20La%20Terra%20degli%20Aranci";

export default function PresentationViewer({
  presentation,
}: {
  presentation: Presentation;
}) {
  const slides = presentation.slides;
  const totalSlides = slides.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === totalSlides - 1;

  const goToSlide = useCallback(
    (index: number) => {
      setCurrentIndex((prev) => {
        if (index < 0) return 0;
        if (index > totalSlides - 1) return totalSlides - 1;
        return index === prev ? prev : index;
      });
    },
    [totalSlides]
  );

  const goToNextSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const goToPrevSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const restartPresentation = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen();
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (typeof navigator === "undefined") return;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: presentation.title,
          text: presentation.subtitle,
          url: window.location.href,
        });
        return;
      } catch {
        // L'utente ha annullato la condivisione o la share API ha fallito:
        // si ripiega sulla copia del link.
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2200);
    } catch {
      // Clipboard API non disponibile o permesso negato: nessun feedback.
    }
  }, [presentation.title, presentation.subtitle]);

  const openWhatsApp = useCallback(() => {
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
  }, []);

  // Controlli da tastiera: frecce, spazio, invio, backspace, F.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "ArrowRight":
        case "Space":
        case "Enter":
          event.preventDefault();
          goToNextSlide();
          break;
        case "ArrowLeft":
        case "Backspace":
          event.preventDefault();
          goToPrevSlide();
          break;
        case "KeyF":
          event.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextSlide, goToPrevSlide, toggleFullscreen]);

  // Sincronizzazione stato fullscreen (es. uscita con ESC).
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Gesture mobile: swipe orizzontale con soglia > 40px.
  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) <= 40) return;

    if (deltaX < 0) {
      goToNextSlide(); // Swipe a sinistra -> slide successiva
    } else {
      goToPrevSlide(); // Swipe a destra -> slide precedente
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#0e1015] text-white flex flex-col justify-between overflow-hidden select-none z-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bar a segmenti stile Stories */}
      <div className="flex gap-1 px-3 pt-3 sm:px-5">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          const isPassed = index < currentIndex;

          return (
            <button
              key={slide.id}
              type="button"
              aria-label={`Vai alla slide ${index + 1}`}
              onClick={() => goToSlide(index)}
              className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                isActive
                  ? "bg-[#c5a059] shadow-[0_0_8px_rgba(197,160,89,0.8)]"
                  : isPassed
                    ? "bg-white/80"
                    : "bg-white/20"
              }`}
            />
          );
        })}
      </div>

      {/* Top bar discreta e semi-trasparente */}
      <div className="flex items-center justify-between gap-3 px-3 pt-2 sm:px-5">
        {/* Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] sm:text-sm font-medium tracking-wide truncate">
            La Terra degli Aranci
          </span>
          <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] bg-white/10 text-[#c5a059] rounded-full px-2 py-0.5">
            2026 EN
          </span>
        </div>

        {/* Contatore slide */}
        <div className="text-xs sm:text-sm text-white/60 tabular-nums">
          {currentIndex + 1} / {totalSlides}
        </div>

        {/* Azioni rapide */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={
              isFullscreen ? "Esci da schermo intero" : "Schermo intero"
            }
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 transition-colors"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label="Condividi presentazione"
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 transition-colors"
          >
            {linkCopied ? (
              <Check className="w-4 h-4 text-[#c5a059]" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contattaci su WhatsApp"
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Toast "Link copiato!" */}
      {linkCopied && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-[#c5a059] text-[#0e1015] text-xs sm:text-sm font-medium shadow-lg">
          Link copiato!
        </div>
      )}

      {/* Area slide centrale */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
        {/* Navigazione split screen 50/50 */}
        <button
          type="button"
          aria-label="Slide precedente"
          onClick={goToPrevSlide}
          disabled={currentIndex === 0}
          className="absolute inset-y-0 left-0 w-1/2 z-10 disabled:cursor-default"
        />
        <button
          type="button"
          aria-label="Slide successiva"
          onClick={goToNextSlide}
          disabled={isLastSlide}
          className="absolute inset-y-0 right-0 w-1/2 z-10 disabled:cursor-default"
        />

        {/* Freccia sinistra (desktop) */}
        <button
          type="button"
          aria-label="Slide precedente"
          onClick={goToPrevSlide}
          disabled={currentIndex === 0}
          className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 transition-colors backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Freccia destra (desktop) */}
        <button
          type="button"
          aria-label="Slide successiva"
          onClick={goToNextSlide}
          disabled={isLastSlide}
          className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 transition-colors backdrop-blur-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Box slide 16:9 */}
        <div className="border border-white/10 rounded-xl overflow-hidden shadow-2xl bg-black/60 aspect-video max-h-[85vh] max-w-[95vw] w-full flex items-center justify-center">
          <img
            key={currentSlide.id}
            src={currentSlide.imageUrl}
            alt={currentSlide.title}
            className="w-full h-full object-contain pointer-events-none transition-opacity duration-200"
          />
        </div>
      </div>

      {/* Box d'azione su slide finale */}
      {isLastSlide && (
        <div className="px-3 pb-4 sm:px-5">
          <div className="mx-auto max-w-2xl flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 rounded-2xl border border-[#c5a059]/40 bg-white/5 backdrop-blur-md px-4 py-3">
            <span className="text-xs sm:text-sm text-white/70 text-center sm:text-left">
              Grazie per aver seguito la presentazione
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={restartPresentation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 text-xs sm:text-sm hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Ricomincia dall&apos;inizio
              </button>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#c5a059] text-[#0e1015] text-xs sm:text-sm font-medium hover:bg-[#d4b06a] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Contattaci su WhatsApp
              </a>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 text-xs sm:text-sm hover:bg-white/10 transition-colors"
              >
                {linkCopied ? (
                  <Check className="w-3.5 h-3.5 text-[#c5a059]" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
                {linkCopied ? "Link copiato!" : "Copia link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
