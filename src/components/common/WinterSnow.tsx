import React, { useMemo } from 'react';
import { useWeddingTheme } from '../../theme/WeddingThemeContext';

interface Snowflake {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
  glyph: boolean;
  glyphChar?: string;
}

interface Stardust {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  opacity: number;
}

/** PRNG deterministico: fiocchi stabili tra i render (nessun layout shift). */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Nevicata discreta ed elegante per la V2 (data 07/12/2026 come seed).
 * Nella V3 "Royal Midnight Winter Gala" diventa un mix di fiocchi
 * cristallini ghiaccio a caduta lenta e micro-polvere di stelle dorata
 * (stardust twinkle) che fluttua con opacità morbida.
 * Overlay puramente decorativo: non intercetta i click e rispetta
 * `prefers-reduced-motion` (via CSS).
 */
export const WinterSnow: React.FC = () => {
  const { isV3 } = useWeddingTheme();

  const flakes = useMemo<Snowflake[]>(() => {
    const rand = mulberry32(20261207);
    // 28 fiocchi: perfetto equilibrio (circa 7-8 fiocchi visibili alla volta a schermo)
    return Array.from({ length: 28 }, (_, i) => {
      const isGlyph = i % 3 !== 0; // 2 su 3 sono cristalli, 1 su 3 è polvere di stelle
      const glyphChar = i % 2 === 0 ? '❄' : i % 3 === 0 ? '❅' : '❆';
      return {
        id: i,
        left: rand() * 94 + 3,
        size: isGlyph ? 10 + rand() * 6 : 3.5 + rand() * 2.5,
        // V3: caduta più lenta e sospesa (notte magica)
        duration: isV3 ? 13 + rand() * 9 : 10 + rand() * 7,
        delay: -rand() * 18,
        drift: (rand() - 0.5) * 75,
        opacity: isGlyph ? 0.45 + rand() * 0.22 : 0.35 + rand() * 0.25,
        glyph: isGlyph,
        glyphChar,
      };
    });
  }, [isV3]);

  // V3 — Micro-polvere di stelle dorata (seed distinto, deterministico)
  const stardust = useMemo<Stardust[]>(() => {
    if (!isV3) return [];
    const rand = mulberry32(20261208);
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: rand() * 96 + 2,
      top: rand() * 92 + 2,
      size: 2 + rand() * 2.6,
      duration: 6.5 + rand() * 6,
      delay: -rand() * 12,
      driftX: (rand() - 0.5) * 30,
      driftY: -18 - rand() * 26,
      opacity: 0.3 + rand() * 0.35,
    }));
  }, [isV3]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[70] overflow-hidden select-none"
      aria-hidden="true"
      data-testid="winter-snow"
    >
      {flakes.map(f => (
        <span
          key={f.id}
          className="winter-snowflake"
          style={
            {
              '--snow-left': `${f.left}%`,
              '--snow-duration': `${f.duration}s`,
              '--snow-delay': `${f.delay}s`,
              '--snow-drift': `${f.drift}px`,
              '--snow-opacity': f.opacity,
              left: `${f.left}%`,
              opacity: f.opacity,
            } as React.CSSProperties
          }
        >
          {f.glyph ? (
            <span
              style={{
                fontSize: `${f.size}px`,
                // V3: cristalli di ghiaccio cristallino con bagliore zaffiro
                color: isV3 ? '#E0F2FE' : '#ffffff',
                filter: isV3
                  ? 'drop-shadow(0 0 3px rgba(148, 180, 220, 0.55))'
                  : 'drop-shadow(0 1px 2px rgba(90, 20, 30, 0.25))',
                display: 'inline-block',
              }}
            >
              {f.glyphChar}
            </span>
          ) : (
            <span
              className="winter-snow-dot"
              style={{
                width: `${f.size}px`,
                height: `${f.size}px`,
                backgroundColor: isV3 ? '#EAF6FF' : '#ffffff',
                opacity: 0.8,
              }}
            />
          )}
        </span>
      ))}

      {/* V3 — Stardust dorata fluttuante (twinkle morbido) */}
      {stardust.map(s => (
        <span
          key={`star-${s.id}`}
          className="midnight-stardust"
          style={
            {
              '--star-left': `${s.left}%`,
              '--star-duration': `${s.duration}s`,
              '--star-delay': `${s.delay}s`,
              '--star-drift-x': `${s.driftX}px`,
              '--star-drift-y': `${s.driftY}px`,
              '--star-opacity': s.opacity,
              left: `${s.left}%`,
              top: `${s.top}%`,
              opacity: s.opacity,
            } as React.CSSProperties
          }
        >
          <span
            className="midnight-stardust-dot"
            style={{ width: `${s.size}px`, height: `${s.size}px` }}
          />
        </span>
      ))}
    </div>
  );
};

export default WinterSnow;
