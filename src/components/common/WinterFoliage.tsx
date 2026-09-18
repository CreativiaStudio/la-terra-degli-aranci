import React from 'react';

interface PineSprigCornerProps {
  className?: string;
  /** Colore delle bacche dorate (champagne invernale di default) */
  berryColor?: string;
}

/**
 * Rametto d'abete invernale con bacche dorate: dettaglio di foliage
 * usato per la busta V2 (angoli della scena di unboxing).
 */
export const PineSprigCorner: React.FC<PineSprigCornerProps> = ({
  className = '',
  berryColor = '#C9A24B',
}) => {
  return (
    <svg
      viewBox="0 0 140 140"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Ramo principale */}
      <path
        d="M4 136 C 42 120 72 90 94 46"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Aghi di pino */}
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <path d="M20 127 L 6 118" />
        <path d="M22 125 L 14 110" />
        <path d="M36 118 L 24 106" />
        <path d="M38 116 L 34 100" />
        <path d="M52 106 L 42 92" />
        <path d="M55 103 L 54 86" />
        <path d="M67 92 L 60 76" />
        <path d="M71 88 L 73 71" />
        <path d="M82 74 L 78 57" />
        <path d="M86 69 L 91 53" />
        <path d="M92 56 L 92 38" />
        <path d="M94 50 L 103 36" />
        <path d="M97 42 L 110 36" />
        <path d="M98 38 L 112 27" />
      </g>
      {/* Bacche dorate */}
      <g fill={berryColor}>
        <circle cx="26" cy="112" r="2.6" />
        <circle cx="46" cy="95" r="2.3" />
        <circle cx="68" cy="72" r="2.6" />
        <circle cx="90" cy="46" r="2.2" />
      </g>
    </svg>
  );
};

export default PineSprigCorner;

interface ConstellationSprayProps {
  className?: string;
  /** Colore delle stelle e dei fili di congiunzione (oro zecchino di default) */
  starColor?: string;
}

/**
 * V3 — Costellazione dorata con stelle a 4 punte: dettaglio celeste
 * per la busta "Royal Midnight Winter Gala" (angoli della scena di unboxing).
 */
export const ConstellationSpray: React.FC<ConstellationSprayProps> = ({
  className = '',
  starColor = '#D4AF37',
}) => {
  return (
    <svg
      viewBox="0 0 140 140"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Fili sottili di congiunzione celeste */}
      <g stroke={starColor} strokeWidth="0.7" strokeLinecap="round" opacity="0.45">
        <path d="M22 118 L 48 92 L 74 98 L 96 62 L 118 34" />
        <path d="M48 92 L 38 60" />
        <path d="M96 62 L 70 44" />
      </g>
      {/* Stelle a 4 punte (sparkle) */}
      <g fill={starColor}>
        <path d="M22 108 Q 22 118 32 118 Q 22 118 22 128 Q 22 118 12 118 Q 22 118 22 108 Z" opacity="0.95" />
        <path d="M48 82 Q 48 92 57 92 Q 48 92 48 102 Q 48 92 39 92 Q 48 92 48 82 Z" opacity="0.85" />
        <path d="M96 52 Q 96 62 105 62 Q 96 62 96 72 Q 96 62 87 62 Q 96 62 96 52 Z" opacity="0.9" />
        <path d="M118 25 Q 118 34 126 34 Q 118 34 118 43 Q 118 34 110 34 Q 118 34 118 25 Z" opacity="0.95" />
        <path d="M70 35 Q 70 44 78 44 Q 70 44 70 53 Q 70 44 62 44 Q 70 44 70 35 Z" opacity="0.7" />
      </g>
      {/* Micro-stelle puntiformi */}
      <g fill={starColor}>
        <circle cx="38" cy="60" r="1.8" opacity="0.8" />
        <circle cx="74" cy="98" r="2" opacity="0.75" />
        <circle cx="58" cy="122" r="1.4" opacity="0.6" />
        <circle cx="104" cy="88" r="1.5" opacity="0.65" />
        <circle cx="126" cy="64" r="1.3" opacity="0.6" />
        <circle cx="16" cy="84" r="1.2" opacity="0.55" />
      </g>
    </svg>
  );
};
