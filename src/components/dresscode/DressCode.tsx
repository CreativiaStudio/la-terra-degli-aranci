import React from 'react';
import { SectionHeading } from '../common/SectionHeading';
import { DeckledCard } from '../common/DeckledCard';
import { weddingData } from '../../data/weddingData';
import { Sparkles } from 'lucide-react';

export const DressCode: React.FC = () => {

  return (
    <section id="dresscode" className="py-12 md:py-16 px-4 max-w-4xl mx-auto">
      <SectionHeading
        subtitle="Stile & Atmosfera"
        title="Dress Code"
        description={weddingData.dressCode.descrizione}
      />

      <DeckledCard variant="light" className="space-y-8">
        <div className="text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold-champagne/30 border border-gold-accent/40 text-gold-dark text-xs font-semibold uppercase tracking-widest mb-2">
            {weddingData.dressCode.titolo}
          </span>
          <p className="text-xs md:text-sm text-gray-600 font-light max-w-xl mx-auto mt-2">
            Ispirata ai colori caldi e regali dell'inverno napoletano e ai toni Toile de Jouy.
          </p>
        </div>

        {/* Interactive Color Palette Swatches */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {weddingData.dressCode.palette.map(color => (
            <div
              key={color.hex}
              className="flex flex-col items-center p-3 rounded-xl bg-white/80 border border-amalfi-border shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
            >
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-full shadow-inner border border-white/60 mb-2"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-xs font-semibold text-wedding-charcoal text-center leading-tight">
                {color.nome}
              </span>
              <span className="font-mono text-[10px] text-gray-400 mt-1 uppercase">
                {color.hex}
              </span>
              <p className="text-[10px] text-gray-500 text-center mt-1 font-light leading-tight">
                {color.nota}
              </p>
            </div>
          ))}
        </div>

        {/* Bon Ton Note */}
        <div className="p-4 rounded-xl bg-toile-light/40 border border-toile-blue/20 flex items-center justify-center gap-2 text-center text-xs md:text-sm text-toile-deep font-medium">
          <Sparkles className="w-4 h-4 text-gold-accent shrink-0" />
          <span>{weddingData.dressCode.notaBonton}</span>
        </div>
      </DeckledCard>
    </section>
  );
};
