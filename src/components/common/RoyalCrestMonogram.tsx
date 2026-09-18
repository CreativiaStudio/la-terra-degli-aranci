import React, { useId } from 'react';

interface RoyalCrestMonogramProps {
  className?: string;
  size?: number | string;
  variant?: 'gold' | 'monochrome' | 'wax' | 'subtle';
  showZagare?: boolean;
  showOranges?: boolean;
  withDropShadow?: boolean;
}

export const RoyalCrestMonogram: React.FC<RoyalCrestMonogramProps> = ({
  className = 'w-24 h-24 md:w-32 md:h-32',
  size,
  variant = 'gold',
  showZagare = true,
  showOranges = true,
  withDropShadow = true,
}) => {
  const uniqueId = useId().replace(/:/g, '_');
  const goldGradId = `royalGoldGrad_${uniqueId}`;
  const goldLightGradId = `royalGoldLight_${uniqueId}`;
  const leafGradId = `royalLeafGrad_${uniqueId}`;
  const shadowFilterId = `crestShadow_${uniqueId}`;

  const isMonochrome = variant === 'monochrome';
  const isWax = variant === 'wax';
  const isSubtle = variant === 'subtle';

  const strokeColor = isMonochrome
    ? 'currentColor'
    : isWax
    ? '#DFBE79'
    : isSubtle
    ? '#C5A059'
    : `url(#${goldGradId})`;

  const fillColor = isMonochrome
    ? 'currentColor'
    : isWax
    ? '#DFBE79'
    : isSubtle
    ? '#9A783E'
    : `url(#${goldGradId})`;

  const leafFillColor = isMonochrome
    ? 'currentColor'
    : isWax
    ? '#DFBE79'
    : `url(#${leafGradId})`;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`inline-block select-none overflow-visible ${withDropShadow ? 'filter drop-shadow-sm' : ''} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Monogramma Araldico Nozze F & F"
    >
      <defs>
        <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFBE79" />
          <stop offset="30%" stopColor="#F5E6BE" />
          <stop offset="55%" stopColor="#C5A059" />
          <stop offset="85%" stopColor="#9A783E" />
          <stop offset="100%" stopColor="#73541E" />
        </linearGradient>

        <linearGradient id={goldLightGradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C5A059" />
          <stop offset="50%" stopColor="#FAF7F2" />
          <stop offset="100%" stopColor="#DFBE79" />
        </linearGradient>

        <linearGradient id={leafGradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9A783E" />
          <stop offset="45%" stopColor="#C5A059" />
          <stop offset="100%" stopColor="#DFBE79" />
        </linearGradient>

        {withDropShadow && (
          <filter id={shadowFilterId} x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#1F2937" floodOpacity="0.25" />
          </filter>
        )}
      </defs>

      {/* Outer Heraldic Royal Arch & Laurel / Orange Wreath */}
      <g filter={withDropShadow ? `url(#${shadowFilterId})` : undefined}>
        {/* Left Botanical Branch */}
        <path
          d="M 44,152 C 22,120 20,72 52,38 C 48,52 46,70 56,88 C 47,104 44,124 54,144"
          stroke={strokeColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right Botanical Branch */}
        <path
          d="M 156,152 C 178,120 180,72 148,38 C 152,52 154,70 144,88 C 153,104 156,124 146,144"
          stroke={strokeColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Bottom Tied Heraldic Ribbon & Swashes */}
        <g stroke={strokeColor} strokeWidth="1.4" strokeLinecap="round" fill="none">
          <path d="M 88,168 C 96,162 104,162 112,168 C 104,175 96,175 88,168 Z" fill={fillColor} />
          <path d="M 92,168 Q 78,188 66,183" />
          <path d="M 108,168 Q 122,188 134,183" />
          <circle cx="100" cy="168" r="2" fill={fillColor} />
        </g>

        {/* Delicate Orange Foliage Leaves (Left Side) */}
        <g fill={leafFillColor}>
          <path d="M 38,136 Q 24,132 30,123 Q 39,129 38,136 Z" />
          <path d="M 28,108 Q 15,103 23,94 Q 32,100 28,108 Z" />
          <path d="M 28,78 Q 17,70 27,62 Q 34,71 28,78 Z" />
          <path d="M 40,50 Q 32,38 45,34 Q 48,45 40,50 Z" />
          <path d="M 52,148 Q 42,152 45,142 Q 52,142 52,148 Z" />
        </g>

        {/* Delicate Orange Foliage Leaves (Right Side) */}
        <g fill={leafFillColor}>
          <path d="M 162,136 Q 176,132 170,123 Q 161,129 162,136 Z" />
          <path d="M 172,108 Q 185,103 177,94 Q 168,100 172,108 Z" />
          <path d="M 172,78 Q 183,70 173,62 Q 166,71 172,78 Z" />
          <path d="M 160,50 Q 168,38 155,34 Q 152,45 160,50 Z" />
          <path d="M 148,148 Q 158,152 155,142 Q 148,142 148,148 Z" />
        </g>

        {/* Citrus Oranges Accents (La Terra degli Aranci Signature) */}
        {showOranges && (
          <g>
            <circle cx="26" cy="88" r="4.2" fill={isMonochrome ? 'currentColor' : '#E58C2C'} stroke={strokeColor} strokeWidth="0.8" />
            <circle cx="174" cy="88" r="4.2" fill={isMonochrome ? 'currentColor' : '#E58C2C'} stroke={strokeColor} strokeWidth="0.8" />
            <circle cx="34" cy="120" r="3.6" fill={isMonochrome ? 'currentColor' : '#E58C2C'} stroke={strokeColor} strokeWidth="0.8" />
            <circle cx="166" cy="120" r="3.6" fill={isMonochrome ? 'currentColor' : '#E58C2C'} stroke={strokeColor} strokeWidth="0.8" />
          </g>
        )}

        {/* Crown Zagara 5-Petal Blossom at Crest Top */}
        {showZagare && (
          <g transform="translate(100, 25)">
            <ellipse cx="0" cy="-7" rx="2.5" ry="5" fill={isMonochrome ? 'currentColor' : '#FCFBF7'} stroke={strokeColor} strokeWidth="0.8" />
            <ellipse cx="6.5" cy="-2.5" rx="5" ry="2.5" fill={isMonochrome ? 'currentColor' : '#FCFBF7'} stroke={strokeColor} strokeWidth="0.8" />
            <ellipse cx="4.5" cy="5.5" rx="4.5" ry="2.5" transform="rotate(35 4.5 5.5)" fill={isMonochrome ? 'currentColor' : '#FCFBF7'} stroke={strokeColor} strokeWidth="0.8" />
            <ellipse cx="-4.5" cy="5.5" rx="4.5" ry="2.5" transform="rotate(-35 -4.5 5.5)" fill={isMonochrome ? 'currentColor' : '#FCFBF7'} stroke={strokeColor} strokeWidth="0.8" />
            <ellipse cx="-6.5" cy="-2.5" rx="5" ry="2.5" fill={isMonochrome ? 'currentColor' : '#FCFBF7'} stroke={strokeColor} strokeWidth="0.8" />
            {/* Center Pistil Gold Orb */}
            <circle cx="0" cy="0" r="3" fill={fillColor} />
          </g>
        )}

        {/* Intertwined Calligraphic "F & F" Monogram Matrix */}
        <g fill={fillColor}>
          {/* Left "F" (Francesca) */}
          <path
            d="M 74,66 C 74,58 82,54 94,54 C 105,54 112,58 114,63 C 114,65 112,67 109,67 C 107,67 104,65 100,62 C 95,59 89,59 85,61 C 81,63 80,68 80,74 L 80,94 L 102,94 C 105,94 106,96 106,98 C 106,100 105,102 102,102 L 80,102 L 80,138 C 80,147 85,150 93,150 C 97,150 99,152 99,154 C 99,156 95,158 89,158 C 76,158 72,149 72,137 L 72,74 C 72,70 73,67 74,66 Z"
          />

          {/* Central Script Ampersand "&" Intaglio */}
          <path
            d="M 98,103 C 103,96 99,91 94,94 C 90,97 93,103 97,108 C 91,116 99,124 105,119 C 109,114 104,108 98,103 Z"
            opacity="0.9"
          />

          {/* Right "F" (Ferdinando) - Harmoniously Intertwined */}
          <path
            d="M 106,74 C 106,66 114,62 126,62 C 137,62 144,66 146,71 C 146,73 144,75 141,75 C 139,75 136,73 132,70 C 127,67 121,67 117,69 C 113,71 112,76 112,82 L 112,102 L 134,102 C 137,102 138,104 138,106 C 138,108 137,110 134,110 L 112,110 L 112,146 C 112,155 117,158 125,158 C 129,158 131,160 131,162 C 131,164 127,166 121,166 C 108,166 104,157 104,145 L 104,82 C 104,78 105,75 106,74 Z"
          />

          {/* Micro Star Flare Specular Highlight */}
          <path
            d="M 100,52 Q 100,56 104,56 Q 100,56 100,60 Q 100,56 96,56 Q 100,56 100,52 Z"
            fill={isMonochrome ? 'currentColor' : `url(#${goldLightGradId})`}
          />
        </g>
      </g>
    </svg>
  );
};
