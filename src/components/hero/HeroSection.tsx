import React, { useState, useEffect, useRef } from 'react';
import { Countdown } from './Countdown';
import { SaveTheDate } from './SaveTheDate';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { weddingData } from '../../data/weddingData';
import { useWeddingTheme } from '../../theme/WeddingThemeContext';

interface HeroSectionProps {
  onNotify?: (text: string) => void;
}

const heroCouplePhotos = [
  {
    src: './images/sposi_1.jpg',
    alt: 'Francesca & Ferdinando — La Promessa',
    title: 'La Promessa',
  },
  {
    src: './images/sposi_3.jpg',
    alt: 'Francesca & Ferdinando — La Complicità',
    title: 'La Complicità',
  },
  {
    src: './images/sposi_2.jpg',
    alt: 'Francesca & Ferdinando — La Gioia',
    title: 'La Gioia',
  },
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onNotify }) => {
  const { isWinter, isV3 } = useWeddingTheme();
  const [currentPhoto, setCurrentPhoto] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const touchStartX = useRef<number | null>(null);

  // Auto-slide every 4.5 seconds
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentPhoto((prev) => (prev + 1) % heroCouplePhotos.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isHovered]);

  const handleNextPhoto = () => {
    setCurrentPhoto((prev) => (prev + 1) % heroCouplePhotos.length);
  };

  const handlePrevPhoto = () => {
    setCurrentPhoto((prev) => (prev - 1 + heroCouplePhotos.length) % heroCouplePhotos.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 40) {
      handleNextPhoto();
    } else if (diff < -40) {
      handlePrevPhoto();
    }
    touchStartX.current = null;
  };

  return (
    <div className="w-full">
      {/* ── HERO FULL-HEIGHT VIEW ── */}
      <section
        id="hero"
        className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 pt-6 pb-10 sm:py-14 md:py-20 overflow-hidden"
        style={{
          background: isV3
            ? 'radial-gradient(ellipse at 50% 115%, rgba(212, 175, 55, 0.14) 0%, transparent 52%), radial-gradient(ellipse at 18% 12%, rgba(44, 78, 138, 0.35) 0%, transparent 48%), radial-gradient(ellipse at 50% 30%, #12233D 0%, #0B172B 58%, #050B17 100%)'
            : isWinter
            ? 'radial-gradient(ellipse at 50% 118%, rgba(122, 24, 40, 0.16) 0%, transparent 55%), radial-gradient(ellipse at 50% 30%, #fffdf8 0%, #f6ead6 55%, #e6d1b3 100%)'
            : 'radial-gradient(ellipse at 50% 35%, #fffbf2 0%, #f6edd9 60%, #eadcc3 100%)',
        }}
      >
        {/* V2 — Festive winter hairline */}
        {isWinter && (
          <div className="absolute top-0 inset-x-0 h-[3px] winter-hairline pointer-events-none" />
        )}

        {/* V3 — Gold-leaf gala hairline */}
        {isV3 && (
          <div className="absolute top-0 inset-x-0 h-[3px] midnight-hairline pointer-events-none" />
        )}

        {/* V3 — Costellazioni dell'hero: stelle dorate sparse sulla notte */}
        {isV3 && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <span className="absolute top-[14%] left-[10%] text-gold-foil/50 text-xs animate-pulse">✦</span>
            <span className="absolute top-[22%] right-[12%] text-gold-champagne/45 text-[10px]">✦</span>
            <span className="absolute top-[38%] left-[6%] text-gold-accent/35 text-[9px]">✦</span>
            <span className="absolute top-[30%] right-[24%] text-gold-foil/40 text-[8px] animate-pulse">✦</span>
            <span className="absolute bottom-[26%] left-[16%] text-gold-champagne/40 text-[11px]">✦</span>
            <span className="absolute bottom-[32%] right-[8%] text-gold-foil/45 text-[10px] animate-pulse">✦</span>
            <span className="absolute top-[10%] left-[42%] text-gold-accent/30 text-[9px]">✦</span>
            <span className="absolute bottom-[16%] right-[34%] text-gold-champagne/30 text-[8px]">✦</span>
          </div>
        )}

        {/* Soft Background Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-amalfi-base/80 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-2 sm:space-y-3.5">
          {/* Eyebrow */}
          <p
            className={`font-serif italic text-xs sm:text-base md:text-xl tracking-[0.2em] uppercase font-light ${
              isV3 ? 'text-gold-foil' : isWinter ? 'text-wedding-burgundy' : 'text-gold-dark'
            }`}
          >
            {isV3 ? 'Una Notte di Gala sotto le Stelle' : 'Ci sposiamo!'}
          </p>

          {/* Delicate Floral Ornament Divider (V1) / Holly & Berries (V2) / Star & Sapphire (V3) */}
          <div className="flex items-center justify-center my-1 sm:my-2">
            {isV3 ? (
              <svg
                className="w-40 sm:w-64 h-5 sm:h-6 text-gold-accent"
                viewBox="0 0 240 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M8 12H98M142 12H232" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                {/* Stella a 4 punte oro zecchino */}
                <path d="M120 2 Q 120 12 130 12 Q 120 12 120 22 Q 120 12 110 12 Q 120 12 120 2 Z" fill="currentColor" />
                {/* Zaffiri laterali */}
                <circle cx="104" cy="12" r="2.2" fill="#94B4DC" opacity="0.9" />
                <circle cx="136" cy="12" r="2.2" fill="#94B4DC" opacity="0.9" />
                <circle cx="104" cy="11" r="0.7" fill="#F0E3B2" opacity="0.9" />
                <circle cx="136" cy="11" r="0.7" fill="#F0E3B2" opacity="0.9" />
              </svg>
            ) : isWinter ? (
              <svg
                className="w-40 sm:w-64 h-5 sm:h-6 text-gold-accent"
                viewBox="0 0 240 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M8 12H98M142 12H232" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                {/* Holly leaves in pine green */}
                <path d="M102 12 C 106 3, 116 4, 119 10 C 114 13, 107 14, 102 12 Z" fill="#1E3B2E" opacity="0.85" />
                <path d="M138 12 C 134 3, 124 4, 121 10 C 126 13, 133 14, 138 12 Z" fill="#1E3B2E" opacity="0.85" />
                {/* Ruby berries with warm highlight */}
                <circle cx="111" cy="9" r="3" fill="#8B1E2E" />
                <circle cx="120" cy="13.2" r="3.6" fill="#7A1828" />
                <circle cx="129" cy="9" r="3" fill="#8B1E2E" />
                <circle cx="110" cy="8" r="0.9" fill="#F1DDB2" opacity="0.85" />
                <circle cx="119" cy="12" r="1" fill="#F1DDB2" opacity="0.85" />
                <circle cx="128" cy="8" r="0.9" fill="#F1DDB2" opacity="0.85" />
              </svg>
            ) : (
              <svg
                className="w-40 sm:w-64 h-5 sm:h-6 text-gold-accent"
                viewBox="0 0 240 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 12H100M140 12H232"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
                <path
                  d="M120 18C113 13 110 10 110 7C110 4.5 112 2.5 114.5 2.5C116.5 2.5 118.5 3.5 120 6C121.5 3.5 123.5 2.5 125.5 2.5C128 2.5 130 4.5 130 7C130 10 127 13 120 18Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </div>

          {/* Monumental Script Names */}
          <div className="relative my-1 sm:my-2 select-none">
            {isWinter && (
              <div
                className="absolute -inset-x-6 -inset-y-8 sm:-inset-x-10 sm:-inset-y-12 -z-10 winter-halo pointer-events-none"
                aria-hidden="true"
              />
            )}
            {isV3 && (
              <div
                className="absolute -inset-x-6 -inset-y-8 sm:-inset-x-10 sm:-inset-y-12 -z-10 midnight-halo pointer-events-none"
                aria-hidden="true"
              />
            )}
            <h1
              className={`font-script text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-none tracking-normal ${
                isV3
                  ? 'gold-mirror-text midnight-name-shadow'
                  : isWinter
                  ? 'gold-foil-text winter-name-shadow'
                  : 'text-wedding-charcoal drop-shadow-sm'
              }`}
            >
              Francesca
            </h1>
            <div className="py-1 sm:py-2.5 flex items-center justify-center">
              <span
                className={`font-display italic font-semibold text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-none select-none ${
                  isV3
                    ? 'text-gold-accent midnight-name-shadow'
                    : isWinter
                    ? 'text-wedding-burgundy winter-name-shadow'
                    : 'text-gold-dark drop-shadow-sm'
                }`}
              >
                &amp;
              </span>
            </div>
            <h1
              className={`font-script text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-none tracking-normal ${
                isV3
                  ? 'gold-mirror-text midnight-name-shadow'
                  : isWinter
                  ? 'gold-foil-text winter-name-shadow'
                  : 'text-wedding-charcoal drop-shadow-sm'
              }`}
            >
              Ferdinando
            </h1>
          </div>

          {/* Date & Location */}
          <div className="pt-1">
            <p
              className={`font-serif text-xs sm:text-base md:text-lg tracking-[0.25em] sm:tracking-[0.3em] uppercase font-medium ${
                isV3 ? 'text-gold-champagne' : 'text-gray-700'
              }`}
            >
              {weddingData.dataOra.dataFormattata}
            </p>
            <p
              className={`font-serif text-[11px] sm:text-sm tracking-[0.2em] uppercase mt-0.5 sm:mt-1 ${
                isV3
                  ? 'text-gold-foil font-medium'
                  : isWinter
                  ? 'text-wedding-burgundy font-medium'
                  : 'text-gold-dark'
              }`}
            >
              La Terra degli Aranci • Napoli
            </p>
          </div>

          {/* Editorial Couple Portrait Slider in Deckled Frame */}
          <div
            className="pt-3 sm:pt-5 pb-1 max-w-[240px] sm:max-w-xs mx-auto select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={`relative p-2 sm:p-3 bg-white/90 rounded-2xl shadow-luxury border rotate-[-1deg] hover:rotate-0 transition-transform duration-500 ${
                isV3
                  ? 'border-gold-accent/70 ring-2 ring-gold-foil/40 shadow-[0_18px_50px_-12px_rgba(2,6,14,0.7)]'
                  : isWinter
                  ? 'border-wedding-burgundy/30 ring-1 ring-gold-accent/30'
                  : 'border-gold-accent/40'
              }`}
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-inner bg-amalfi-dark/10">
                {heroCouplePhotos.map((photo, idx) => (
                  <img
                    key={photo.src}
                    src={photo.src}
                    alt={photo.alt}
                    className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-700 ease-in-out ${
                      idx === currentPhoto ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                ))}

                {/* Left/Right Subtle Navigation Arrows */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevPhoto();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/35 hover:bg-black/70 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-sm transition-all duration-300 opacity-70 hover:opacity-100 cursor-pointer shadow"
                  aria-label="Foto precedente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextPhoto();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/35 hover:bg-black/70 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-sm transition-all duration-300 opacity-70 hover:opacity-100 cursor-pointer shadow"
                  aria-label="Foto successiva"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Bottom 3 Dots Indicator */}
                <div className="absolute bottom-2.5 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-auto">
                  {heroCouplePhotos.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhoto(idx);
                      }}
                      className={`transition-all duration-300 rounded-full cursor-pointer ${
                        idx === currentPhoto
                          ? 'w-5 h-1.5 bg-gold-accent shadow-sm'
                          : 'w-1.5 h-1.5 bg-white/70 hover:bg-white'
                      }`}
                      aria-label={`Vai alla foto ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              <p className="font-script text-xl sm:text-2xl text-wedding-charcoal pt-2 pb-0.5">
                Francesca &amp; Ferdinando
              </p>
            </div>
          </div>

          {/* Scroll Down Callout */}
          <div className="pt-3 sm:pt-6">
            <a
              href="#saludo"
              className={`inline-flex flex-col items-center gap-1 transition-colors group ${
                isV3 ? 'text-gold-foil hover:text-gold-champagne' : 'text-gold-dark hover:text-wedding-charcoal'
              }`}
            >
              <span className="font-serif text-[9px] sm:text-xs tracking-[0.3em] uppercase">
                Scorri per scoprire
              </span>
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce text-gold-accent group-hover:translate-y-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ── SECTION 1: SALUTO / BENVENUTO ── */}
      <section
        id="saludo"
        className="relative py-16 md:py-24 px-4 text-center"
        style={{
          background: isV3 ? '#F8F9FA' : isWinter ? '#f7efe1' : '#f8f2e6',
        }}
      >
        <div className="max-w-2xl mx-auto space-y-4">
          <span
            className={`font-serif italic text-sm tracking-[0.2em] uppercase ${
              isV3 ? 'text-gold-dark' : isWinter ? 'text-wedding-burgundy' : 'text-gold-dark'
            }`}
          >
            Il Nostro Invito
          </span>
          <h2
            className={`font-script text-4xl sm:text-5xl md:text-6xl ${
              isV3
                ? 'gold-foil-text'
                : isWinter
                ? 'gold-foil-text winter-name-shadow'
                : 'text-wedding-charcoal'
            }`}
          >
            Benvenuti nel Nostro Sogno
          </h2>
          <div className={`w-16 h-[1px] mx-auto my-2 ${isV3 ? 'bg-gold-accent/60' : isWinter ? 'bg-wedding-burgundy/50' : 'bg-gold-accent/50'}`} />
          <p className="font-serif italic text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed font-light pt-2">
            «Cari amici e familiari, abbiamo scelto La Terra degli Aranci per coronare il nostro amore tra i profumi degli agrumi in fiore e il panorama incantato del Golfo di Napoli. La vostra presenza è il dono più prezioso per rendere questo giorno indimenticabile.»
          </p>
          <span className="font-script text-2xl sm:text-3xl text-gold-dark block pt-2">
            Con tutto il nostro affetto, Francesca &amp; Ferdinando
          </span>
        </div>
      </section>

      {/* ── SECTION 2: COUNTDOWN ── */}
      <section
        id="countdown"
        className={`py-14 md:py-20 px-4 text-center border-y ${isV3 ? 'border-gold-accent/30' : 'border-gold-accent/20'}`}
        style={{
          background: isV3
            ? 'linear-gradient(180deg, #0B172B 0%, #070F1E 100%)'
            : isWinter
            ? 'linear-gradient(180deg, #f7efe1 0%, #efe0c9 100%)'
            : 'linear-gradient(180deg, #f8f2e6 0%, #f1e4d0 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <span className={`font-serif italic text-xs sm:text-sm tracking-[0.25em] uppercase ${isV3 ? 'text-gold-foil' : 'text-gold-dark'}`}>
            Il Conto alla Rovescia
          </span>
          <h3
            className={`font-serif text-2xl sm:text-3xl uppercase tracking-wider font-light ${
              isV3 ? 'text-gold-champagne' : 'text-wedding-charcoal'
            }`}
          >
            Verso il Nostro Sì
          </h3>

          <Countdown />

          <div className="pt-4">
            <SaveTheDate onNotify={onNotify} />
          </div>
        </div>
      </section>
    </div>
  );
};
