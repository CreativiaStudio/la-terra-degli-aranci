import React from 'react';
import { useWeddingTheme } from '../../theme/WeddingThemeContext';

interface DeckledCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'gold-border' | 'toile';
  withOrnaments?: boolean;
}

export const DeckledCard: React.FC<DeckledCardProps> = ({
  children,
  className = '',
  variant = 'light',
  withOrnaments = true,
}) => {
  const { isWinter, isV3 } = useWeddingTheme();

  const borderClasses =
    variant === 'gold-border'
      ? isV3
        ? 'border border-gold-accent/55 shadow-luxury ring-1 ring-gold-foil/40'
        : isWinter
        ? 'border border-wedding-burgundy/40 shadow-luxury ring-1 ring-gold-accent/30'
        : 'border border-gold-accent/40 shadow-luxury'
      : variant === 'toile'
      ? 'border border-toile-blue/25 shadow-deckled bg-toile-light/30'
      : isV3
      ? 'border border-gold-accent/35 shadow-deckled'
      : isWinter
      ? 'border border-wedding-burgundy/20 shadow-deckled'
      : 'border border-amalfi-border/80 shadow-deckled';

  return (
    <div
      className={`amalfi-paper deckled-border rounded-xl md:rounded-2xl p-6 md:p-10 relative overflow-hidden transition-all duration-300 ${borderClasses} ${className}`}
    >
      {withOrnaments && (isV3 ? (
        <>
          {/* V3 — Top-Left Gala Star (oro zecchino & zaffiro) */}
          <div className="absolute top-2 left-2 text-gold-accent/30 pointer-events-none select-none">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="currentColor" aria-hidden="true">
              <path d="M18 5 Q 18 18 31 18 Q 18 18 18 31 Q 18 18 5 18 Q 18 18 18 5 Z" />
              <circle cx="18" cy="18" r="1.6" fill="#94B4DC" />
            </svg>
          </div>
          {/* V3 — Bottom-Right Gala Star */}
          <div className="absolute bottom-2 right-2 text-toile-blue/30 pointer-events-none select-none rotate-180">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="currentColor" aria-hidden="true">
              <path d="M18 5 Q 18 18 31 18 Q 18 18 18 31 Q 18 18 5 18 Q 18 18 18 5 Z" />
              <circle cx="18" cy="18" r="1.6" fill="#D4AF37" />
            </svg>
          </div>
        </>
      ) : isWinter ? (
        <>
          {/* V2 — Top-Left Frost Snowflake */}
          <div className="absolute top-2 left-2 text-wedding-burgundy/15 pointer-events-none select-none">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M18 4v28M6 11l24 14M30 11L6 25" />
              <path d="M18 8l-3-3M18 8l3-3M18 28l-3 3M18 28l3 3M9.5 13.2l-3.7-1M9.5 13.2l-1-3.7M26.5 22.8l3.7 1M26.5 22.8l1 3.7M26.5 13.2l3.7-1M26.5 13.2l1-3.7M9.5 22.8l-3.7 1M9.5 22.8l-1 3.7" />
              <circle cx="18" cy="18" r="2.2" fill="currentColor" stroke="none" />
            </svg>
          </div>
          {/* V2 — Bottom-Right Pine Snowflake */}
          <div className="absolute bottom-2 right-2 text-toile-blue/20 pointer-events-none select-none rotate-180">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M18 4v28M6 11l24 14M30 11L6 25" />
              <path d="M18 8l-3-3M18 8l3-3M18 28l-3 3M18 28l3 3M9.5 13.2l-3.7-1M9.5 13.2l-1-3.7M26.5 22.8l3.7 1M26.5 22.8l1 3.7M26.5 13.2l3.7-1M26.5 13.2l1-3.7M9.5 22.8l-3.7 1M9.5 22.8l-1 3.7" />
              <circle cx="18" cy="18" r="2.2" fill="currentColor" stroke="none" />
            </svg>
          </div>
        </>
      ) : (
        <>
          {/* Top-Left Botanical Flourish */}
          <div className="absolute top-2 left-2 text-toile-blue/20 pointer-events-none select-none">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="currentColor">
              <path d="M4,4 Q18,6 18,18 Q6,18 4,4 Z M8,8 Q14,9 14,14 Q9,14 8,8 Z" opacity="0.6"/>
              <circle cx="18" cy="6" r="1.5" />
              <circle cx="6" cy="18" r="1.5" />
            </svg>
          </div>
          {/* Bottom-Right Botanical Flourish */}
          <div className="absolute bottom-2 right-2 text-toile-blue/20 pointer-events-none select-none rotate-180">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="currentColor">
              <path d="M4,4 Q18,6 18,18 Q6,18 4,4 Z M8,8 Q14,9 14,14 Q9,14 8,8 Z" opacity="0.6"/>
              <circle cx="18" cy="6" r="1.5" />
              <circle cx="6" cy="18" r="1.5" />
            </svg>
          </div>
        </>
      ))}
      {children}
    </div>
  );
};

export default DeckledCard;
