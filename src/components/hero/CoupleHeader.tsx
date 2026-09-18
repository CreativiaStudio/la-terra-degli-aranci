import React from 'react';
import { weddingData } from '../../data/weddingData';
import { RoyalCrestMonogram } from '../common/RoyalCrestMonogram';

export const CoupleHeader: React.FC = () => {
  return (
    <div className="text-center max-w-3xl mx-auto py-6 px-2 sm:px-4">
      {/* Top Royal Heraldic Crest */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="relative inline-flex items-center justify-center p-3 rounded-full bg-white/70 backdrop-blur-sm border border-gold-accent/40 shadow-sm hover:scale-105 transition-transform duration-500">
          <RoyalCrestMonogram
            variant="gold"
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
            showZagare={true}
            showOranges={true}
          />
        </div>
        <span className="font-serif text-[10px] sm:text-xs uppercase tracking-[0.25em] text-toile-slate mt-2 font-medium">
          Emblema Nuziale Ufficiale
        </span>
      </div>

      {/* Intimate Subtitle */}
      <span className="font-script text-2xl sm:text-3xl md:text-4xl text-gold-accent block mb-2 font-normal">
        Celebrazione del Matrimonio di
      </span>

      {/* Primary Intimate Luxury Names Heading */}
      <div className="my-3 space-y-1">
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-wedding-charcoal font-light tracking-wide uppercase leading-tight">
          Francesca
        </h1>
        <div className="flex items-center justify-center gap-3 sm:gap-4 my-1">
          <span className="h-[1px] w-12 sm:w-20 md:w-28 bg-gradient-to-r from-transparent via-gold-accent/50 to-gold-accent" />
          <span className="font-script text-3xl sm:text-4xl md:text-5xl text-gold-foil italic">&</span>
          <span className="h-[1px] w-12 sm:w-20 md:w-28 bg-gradient-to-l from-transparent via-gold-accent/50 to-gold-accent" />
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-wedding-charcoal font-light tracking-wide uppercase leading-tight">
          Ferdinando
        </h1>
      </div>

      {/* Date & Location Badges */}
      <div className="mt-4 mb-8">
        <p className="font-serif text-base sm:text-lg md:text-xl text-wedding-charcoal tracking-widest uppercase font-light">
          {weddingData.dataOra.dataFormattata} • {weddingData.dataOra.orarioCerimonia}
        </p>
        <p className="text-xs sm:text-sm text-toile-slate uppercase tracking-widest mt-1.5 font-medium flex items-center justify-center gap-2">
          <span>{weddingData.location.nome}</span>
          <span>•</span>
          <span>{weddingData.location.capCitta}</span>
        </p>
      </div>

      {/* Luxury Couple Hero Photo in Amalfi Deckled Paper Frame */}
      <div className="relative mx-auto max-w-lg md:max-w-xl my-8">
        <div className="amalfi-paper deckled-border rounded-2xl p-3 sm:p-5 md:p-6 shadow-luxury transform -rotate-1 hover:rotate-0 transition-transform duration-700 ease-out border border-gold-accent/30">
          {/* Inner Photo Frame with Subtle Gold Hairline */}
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-inner border border-gold-accent/40 bg-amalfi-dark">
            <img
              src="./images/coppia_hero.jpg"
              alt="Francesca & Ferdinando — Nell'agrumeto a La Terra degli Aranci"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover object-center transition-transform duration-1000 hover:scale-105"
            />
            {/* Warm Sunset Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-wedding-charcoal/50 via-transparent to-transparent pointer-events-none" />
            
            {/* Photo Bottom Tagline */}
            <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-4 flex items-center justify-between text-white drop-shadow-md">
              <span className="font-serif text-[10px] sm:text-xs md:text-sm tracking-widest uppercase font-light">
                Napoli • 7 Dicembre 2026
              </span>
              <span className="text-[10px] sm:text-xs bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/20 font-sans">
                La Terra degli Aranci
              </span>
            </div>
          </div>

          {/* Chic Polaroid Calligraphic Caption */}
          <div className="pt-4 pb-1 text-center">
            <h2 className="font-script text-2xl sm:text-3xl md:text-4xl text-wedding-charcoal font-normal tracking-wide">
              Francesca & Ferdinando
            </h2>
            <p className="font-serif text-xs sm:text-sm text-toile-slate tracking-widest uppercase mt-1">
              Insieme per sempre • Nell'Incanto dell'Agrumeto
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
