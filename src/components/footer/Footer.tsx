import React, { useState } from 'react';
import { weddingData } from '../../data/weddingData';
import { WaxSeal } from '../unboxing/WaxSeal';
import { useWeddingTheme } from '../../theme/WeddingThemeContext';
import { Lock, ArrowUp } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
}

/** Monogramma dorato impresso sul sigillo V2. */
const WINTER_WAX_GOLD: [number, number, number] = [201, 162, 75];

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  const { isWinter } = useWeddingTheme();
  const [monogramClicks, setMonogramClicks] = useState<number>(0);

  const handleMonogramClick = () => {
    const next = monogramClicks + 1;
    setMonogramClicks(next);
    if (next >= 5) {
      setMonogramClicks(0);
      onOpenAdmin();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="py-12 md:py-16 px-4 bg-amalfi-dark/70 border-t border-amalfi-border text-center text-wedding-charcoal mt-16 relative">
      {isWinter && (
        <div className="absolute top-0 inset-x-0 h-[3px] winter-hairline pointer-events-none" />
      )}
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Interactive Wax Seal Monogram (5 Clicks unlock Spouse Admin) */}
        <div className="flex justify-center pb-1">
          <div title="Sigillo Ufficiale F & F (5 click per Area Sposi)">
            <WaxSeal
              size="md"
              showPrompt={false}
              animate={false}
              idPrefix="footer"
              onClick={handleMonogramClick}
              color={isWinter ? WINTER_WAX_GOLD : undefined}
              waxFilter={isWinter ? 'saturate(1.25) brightness(1.08)' : undefined}
            />
          </div>
        </div>

        {/* Intimate Names Heading */}
        <div>
          <h3 className="font-serif text-2xl md:text-3xl font-light tracking-wide uppercase text-wedding-charcoal">
            Francesca & Ferdinando
          </h3>
          <p className="font-script text-xl md:text-2xl text-gold-accent mt-0.5">
            {weddingData.sposi.claim}
          </p>
        </div>

        {/* Date and Venue Signature */}
        <p className="text-xs sm:text-sm text-gray-600 font-light">
          {weddingData.dataOra.dataFormattata} • {weddingData.location.nome}
        </p>

        {/* Official TdA Brand Badge */}
        <div className="pt-2 flex flex-col items-center justify-center">
          <img
            src="./images/tda_logo.webp"
            alt="Logo Ufficiale La Terra degli Aranci"
            className="h-10 md:h-12 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
            loading="lazy"
          />
          <span className="font-serif text-[10px] md:text-xs uppercase tracking-[0.2em] text-toile-slate font-medium mt-1">
            Location Ufficiale • Piazzetta Santo Stefano, Napoli
          </span>
        </div>

        {/* Quick Links & Couple Portal Trigger */}
        <div className="flex items-center justify-center gap-4 pt-4 text-xs">
          <button
            onClick={onOpenAdmin}
            className="text-gray-400 hover:text-gold-dark transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-gold-accent" />
            <span>Pannello Sposi</span>
          </button>

          <span className="text-gray-300">•</span>

          <button
            onClick={scrollToTop}
            className="text-gray-400 hover:text-wedding-charcoal transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5 text-toile-slate" />
            <span>Torna su</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
