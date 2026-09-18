import React, { useState, useEffect } from 'react';
import { WaxSeal } from './WaxSeal';
import { PineSprigCorner, ConstellationSpray } from '../common/WinterFoliage';
import { useWeddingTheme } from '../../theme/WeddingThemeContext';
import confetti from 'canvas-confetti';

interface UnboxingEnvelopeProps {
  onOpenComplete: () => void;
  onOpenStart?: () => void;
}

/** Impressione dorata del monogramma sul sigillo V2 (oro champagne caldo, identità stabile per il canvas). */
const WINTER_WAX_COLOR: [number, number, number] = [223, 190, 121];
/** Base ceralacca V2: vira il rosso vivo verso un bordeaux/rubino profondo e artigianale. */
const WINTER_WAX_FILTER = 'hue-rotate(-16deg) saturate(0.85) brightness(0.68) contrast(1.25) sepia(0.12)';

/** V3 — Monogramma in rilievo oro zecchino brillante sul sigillo. */
const MIDNIGHT_WAX_COLOR: [number, number, number] = [230, 202, 101];
/** V3 — Base ceralacca: vira il carminio verso un blu navy/zaffiro intenso e glossy. */
const MIDNIGHT_WAX_FILTER =
  'hue-rotate(185deg) saturate(0.95) brightness(0.6) contrast(1.35) sepia(0.1)';

export const UnboxingEnvelope: React.FC<UnboxingEnvelopeProps> = ({ onOpenComplete, onOpenStart }) => {
  const { isWinter, isV3 } = useWeddingTheme();
  const [unboxingState, setUnboxingState] = useState<'sealed' | 'opening' | 'open'>('sealed');
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      // Scale virtual 1200x850 envelope to cover viewport responsively
      const sc = Math.max(window.innerWidth / 1100, window.innerHeight / 850);
      setScale(Math.max(0.55, sc));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOpen = () => {
    if (unboxingState !== 'sealed') return;
    setUnboxingState('opening');

    // Start music synchronously on user gesture (wax seal click/tap)
    try {
      onOpenStart?.();
      const playFn = (window as unknown as { playWeddingAudio?: () => Promise<boolean> }).playWeddingAudio;
      if (playFn) playFn();
    } catch (e) {
      console.warn('Audio autoplay gesture failed:', e);
    }

    try {
      confetti({
        particleCount: 55,
        spread: 85,
        origin: { y: 0.5 },
        colors: isV3
          ? ['#D4AF37', '#E6CA65', '#F0E3B2', '#2C4E8A', '#E0F2FE']
          : isWinter
          ? ['#C9A24B', '#F1DDB2', '#8C1D2F', '#1E3B2E', '#FDFAF4']
          : ['#C5A059', '#DFBE79', '#8C6B28', '#FAF7F2', '#B8243C'],
        disableForReducedMotion: true,
      });
    } catch (e) {}

    // After top flap folds up and envelope slides away (1100ms total)
    setTimeout(() => {
      setUnboxingState('open');
      onOpenComplete();
    }, 1100);
  };

  if (unboxingState === 'open') return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden ${
        isV3 ? 'bg-[#02060D]' : isWinter ? 'bg-[#180307]' : 'bg-[#e8dcc8]'
      } transition-opacity duration-1000 ${
        unboxingState === 'opening' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        transitionDelay: unboxingState === 'opening' ? '600ms' : '0ms',
      }}
    >
      {/* Top Subtle Brand Seal */}
      <div className="absolute top-6 inset-x-0 flex flex-col items-center justify-center pointer-events-none z-30">
        <img
          src="./images/tda_logo.webp"
          alt="Logo Ufficiale La Terra degli Aranci"
          className={`h-9 md:h-11 w-auto object-contain mb-1 ${
            isV3
              ? 'brightness-125 saturate-110 drop-shadow-[0_0_14px_rgba(212,175,55,0.6)]'
              : isWinter
              ? 'brightness-125 saturate-125 drop-shadow-[0_0_12px_rgba(201,162,75,0.55)]'
              : 'opacity-80 drop-shadow-sm'
          }`}
          loading="eager"
        />
        <span
          className={`font-serif text-[10px] md:text-xs uppercase tracking-[0.25em] ${
            isV3
              ? 'text-gold-foil opacity-95'
              : isWinter
              ? 'text-gold-champagne opacity-90'
              : 'text-toile-slate opacity-75'
          }`}
        >
          La Terra degli Aranci • Napoli
        </span>
      </div>
      {/* Background paper texture & warm ambient lighting (V2: velluto bordeaux regale, V3: notte reale stellata) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isV3
            ? 'radial-gradient(ellipse at 50% 42%, #12233D 0%, #0B172B 52%, #03070F 100%)'
            : isWinter
            ? 'radial-gradient(ellipse at 50% 42%, #5A0E1A 0%, #30050B 55%, #140205 100%)'
            : 'radial-gradient(ellipse at center, #f5ecd8 0%, #e5d5be 65%, #cbb79a 100%)',
        }}
      />

      {/* V3 — Volta celeste: micro-stelle dorate sparse sul fondo notte */}
      {isV3 && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <span className="absolute top-[18%] left-[12%] text-gold-foil/50 text-[10px]">✦</span>
          <span className="absolute top-[26%] right-[16%] text-gold-accent/40 text-xs">✦</span>
          <span className="absolute bottom-[22%] left-[20%] text-gold-champagne/35 text-[9px]">✦</span>
          <span className="absolute bottom-[30%] right-[10%] text-gold-foil/45 text-[11px]">✦</span>
          <span className="absolute top-[12%] left-[46%] text-gold-accent/30 text-[8px]">✦</span>
          <span className="absolute bottom-[14%] right-[38%] text-gold-champagne/30 text-[10px]">✦</span>
        </div>
      )}

      {/* 1200x850 Scaled Stage Centered in Screen */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
        style={{
          width: '1200px',
          height: '850px',
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
          perspective: '1900px',
          perspectiveOrigin: '50% 30%',
        }}
      >
        {/* Inside invitation letter card shadow & preview before flap opens */}
        <div
          className={`absolute inset-x-24 inset-y-16 bg-[#faf6ee] shadow-2xl rounded-xl ${
            isV3
              ? 'border-2 border-gold-accent/80 ring-4 ring-[#0B172B]/60'
              : isWinter
              ? 'border-2 border-gold-accent/70 ring-4 ring-[#3A0A12]/50'
              : 'border border-gold-accent/20'
          }`}
        />

        {/* V2 — Letter preview with gilded monogram, revealed while the flap opens */}
        {isWinter && (
          <div
            className="absolute inset-x-28 inset-y-20 rounded-lg border border-gold-foil/50 bg-gradient-to-br from-[#FDFAF3] to-[#F3E7D2] flex items-center justify-center pointer-events-none"
            style={{ boxShadow: '0 0 45px -8px rgba(223, 190, 121, 0.45), inset 0 0 0 1px rgba(223,190,121,0.25)' }}
          >
            <span className="font-script text-5xl md:text-6xl gold-foil-text">F &amp; F</span>
          </div>
        )}

        {/* V3 — Fodera interna: cielo notturno con costellazioni dorate e monogramma specchiato */}
        {isV3 && (
          <div
            className="absolute inset-x-28 inset-y-20 rounded-lg border border-gold-foil/60 flex items-center justify-center pointer-events-none overflow-hidden"
            style={{
              background:
                'radial-gradient(ellipse at 30% 20%, rgba(230,202,101,0.14) 0%, transparent 45%), radial-gradient(ellipse at 75% 80%, rgba(44,78,138,0.35) 0%, transparent 55%), linear-gradient(160deg, #0D1A30 0%, #0B172B 55%, #060D1A 100%)',
              boxShadow: '0 0 50px -8px rgba(212, 175, 55, 0.5), inset 0 0 0 1px rgba(230,202,101,0.3)',
            }}
          >
            {/* Costellazioni della fodera */}
            <ConstellationSpray className="absolute top-3 left-3 w-24 h-24 opacity-70" />
            <ConstellationSpray className="absolute bottom-3 right-3 w-24 h-24 rotate-180 opacity-70" />
            <span className="absolute top-[30%] right-[22%] text-gold-foil/50 text-xs">✦</span>
            <span className="absolute bottom-[28%] left-[24%] text-gold-champagne/40 text-[10px]">✦</span>
            <span className="font-script text-5xl md:text-6xl gold-mirror-text drop-shadow-[0_2px_6px_rgba(2,6,14,0.6)]">
              F &amp; F
            </span>
          </div>
        )}

        {/* V2 — Winter foliage sprigs framing the envelope */}
        {isWinter && (
          <>
            <PineSprigCorner className="absolute bottom-5 left-5 w-36 h-36 md:w-44 md:h-44 text-gold-accent/35 z-[25] pointer-events-none" />
            <PineSprigCorner className="absolute top-5 right-5 w-36 h-36 md:w-44 md:h-44 rotate-180 text-gold-accent/35 z-[25] pointer-events-none" />
          </>
        )}

        {/* V3 — Costellazioni dorate che incorniciano la busta */}
        {isV3 && (
          <>
            <ConstellationSpray className="absolute bottom-5 left-5 w-36 h-36 md:w-44 md:h-44 text-gold-accent/45 z-[25] pointer-events-none" />
            <ConstellationSpray className="absolute top-5 right-5 w-36 h-36 md:w-44 md:h-44 rotate-180 text-gold-accent/45 z-[25] pointer-events-none" />
          </>
        )}

        {/* Envelope Flap Left */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            clipPath: 'polygon(8% 0%, 50% 50%, 8% 100%)',
            background: isV3
              ? 'linear-gradient(135deg, #122A54 0%, #0D1A30 50%, #060D1A 100%)'
              : isWinter
              ? 'linear-gradient(135deg, #8B1E2E 0%, #7A1828 50%, #4A0D18 100%)'
              : 'linear-gradient(135deg, #f0e4cf 0%, #d8c7ad 100%)',
            filter: isV3
              ? 'drop-shadow(4px 2px 10px rgba(2,5,12,0.65)) drop-shadow(0 0 1.5px rgba(230,202,101,0.7))'
              : isWinter
              ? 'drop-shadow(4px 2px 10px rgba(15,2,5,0.55)) drop-shadow(0 0 1.5px rgba(223,190,121,0.6))'
              : 'drop-shadow(4px 2px 10px rgba(90,80,55,0.22))',
          }}
        />

        {/* Envelope Flap Right */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            clipPath: 'polygon(92% 0%, 50% 50%, 92% 100%)',
            background: isV3
              ? 'linear-gradient(225deg, #122A54 0%, #0D1A30 50%, #060D1A 100%)'
              : isWinter
              ? 'linear-gradient(225deg, #8B1E2E 0%, #7A1828 50%, #4A0D18 100%)'
              : 'linear-gradient(225deg, #f0e4cf 0%, #d8c7ad 100%)',
            filter: isV3
              ? 'drop-shadow(-4px 2px 10px rgba(2,5,12,0.65)) drop-shadow(0 0 1.5px rgba(230,202,101,0.7))'
              : isWinter
              ? 'drop-shadow(-4px 2px 10px rgba(15,2,5,0.55)) drop-shadow(0 0 1.5px rgba(223,190,121,0.6))'
              : 'drop-shadow(-4px 2px 10px rgba(90,80,55,0.22))',
          }}
        />

        {/* Envelope Flap Bottom */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            clipPath: 'polygon(8% 100%, 50% 44%, 92% 100%)',
            background: isV3
              ? 'linear-gradient(0deg, #060D1A 0%, #0D1A30 60%, #122A54 100%)'
              : isWinter
              ? 'linear-gradient(0deg, #3A0A12 0%, #7A1828 60%, #8B1E2E 100%)'
              : 'linear-gradient(0deg, #d8c7ad 0%, #ecddc6 100%)',
            filter: isV3
              ? 'drop-shadow(0 -5px 12px rgba(2,5,12,0.7)) drop-shadow(0 0 1.5px rgba(230,202,101,0.65))'
              : isWinter
              ? 'drop-shadow(0 -5px 12px rgba(15,2,5,0.6)) drop-shadow(0 0 1.5px rgba(223,190,121,0.55))'
              : 'drop-shadow(0 -5px 12px rgba(90,80,55,0.28))',
          }}
        />

        {/* Envelope Flap Top (Folds in 3D on click) */}
        <div
          className={`absolute inset-0 z-30 transition-all duration-1000 origin-[50%_0%] ${
            unboxingState === 'opening' ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            clipPath: 'polygon(8% 0%, 92% 0%, 50% 58%)',
            background: isV3
              ? 'linear-gradient(180deg, #16325C 0%, #0D1A30 50%, #060D1A 100%)'
              : isWinter
              ? 'linear-gradient(180deg, #9E2436 0%, #7A1828 50%, #4A0D18 100%)'
              : 'linear-gradient(180deg, #f9f1e1 0%, #eedfc8 60%, #decbb1 100%)',
            filter: isV3
              ? 'drop-shadow(0 7px 16px rgba(2,5,12,0.75)) drop-shadow(0 0 1.5px rgba(230,202,101,0.75))'
              : isWinter
              ? 'drop-shadow(0 7px 16px rgba(15,2,5,0.65)) drop-shadow(0 0 1.5px rgba(223,190,121,0.65))'
              : 'drop-shadow(0 7px 16px rgba(90,80,55,0.35))',
            transformOrigin: '50% 0%',
            transformStyle: 'preserve-3d',
            transform: unboxingState === 'opening' ? 'rotateX(165deg)' : 'rotateX(0deg)',
          }}
        />

        {/* Wax Seal at Exact Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
          <WaxSeal
            onClick={handleOpen}
            isBroken={unboxingState !== 'sealed'}
            color={isV3 ? MIDNIGHT_WAX_COLOR : isWinter ? WINTER_WAX_COLOR : undefined}
            waxFilter={isV3 ? MIDNIGHT_WAX_FILTER : isWinter ? WINTER_WAX_FILTER : undefined}
            luxe={isWinter || isV3}
          />
        </div>
      </div>
    </div>
  );
};

export default UnboxingEnvelope;
