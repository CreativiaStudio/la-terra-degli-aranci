import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, X, ChevronLeft, ChevronRight, Maximize2, Compass } from 'lucide-react';

export interface EstateSpace {
  id: string;
  titolo: string;
  sottotitolo: string;
  immagine: string;
  altText: string;
  didascaliaPoetica: string;
  dettagliSpazio: string;
  tag: string;
}

export const estateSpaces: EstateSpace[] = [
  {
    id: 'giardino_promesse',
    titolo: 'Il Giardino delle Promesse',
    sottotitolo: 'La Cornice del Rito Simbolico',
    immagine: './images/giardino_promesse.jpg',
    altText: 'Botti storiche con olive e ramoscelli nel giardino panoramico',
    didascaliaPoetica:
      'Dove il «Sì» si fa eterno tra gli ulivi secolari e il profumo di zagara, sospesi tra cielo e Golfo di Napoli.',
    dettagliSpazio:
      'Spazio panoramico en plein air con vista mozzafiato su Posillipo e Capri, allestito con sedute romantiche in ferro battuto.',
    tag: 'Cerimonia & Emozione',
  },
  {
    id: 'agrumeto_storico',
    titolo: "L'Agrumeto Storico",
    sottotitolo: 'Oasi Sensoriale di 6.000 mq',
    immagine: './images/agrumeto.jpg',
    altText: 'Crostini artigianali con formaggio e ciotola di miele agli agrumi',
    didascaliaPoetica:
      'Seimila metri quadri di agrumi in fiore, sentieri in pietra e delizie dell’antica tradizione partenopea.',
    dettagliSpazio:
      'Il cuore verde della tenuta: passeggiata nuziale tra limoni e arance biologiche con isole del gusto e finger food caldi.',
    tag: 'Natura & Aperitivo',
  },
  {
    id: 'sala_bianca',
    titolo: 'La Sala Bianca',
    sottotitolo: 'Luce Naturale ed Eleganza di Gala',
    immagine: './images/sala_bianca.jpg',
    altText: 'Mini montanare fritte con pomodoro, formaggio e basilico fresco',
    didascaliaPoetica:
      'Luce morbida, volte raffinate e cura sartoriale per accogliere il grande banchetto di nozze.',
    dettagliSpazio:
      'Salone monumentale climatizzato con ampie vetrate sul parco, servito dai maestri chef della cucina interna d’eccellenza.',
    tag: 'Banchetto Gourmet',
  },
  {
    id: 'taglio_torta',
    titolo: 'Il Taglio della Torta sotto le Stelle',
    sottotitolo: 'Incanto Notturno & Confettata',
    immagine: './images/taglio_torta.jpg',
    altText: 'Tavolo dei dolci e confettata artigianale illuminata da candele calde',
    didascaliaPoetica:
      'Cascate di luci calde, confettata d’autore e brindisi al tramonto nella magia della notte napoletana.',
    dettagliSpazio:
      'Scenografia serale con fontane scintillanti, buffet di alta pasticceria campana, distillati biologici e discoteca in Sala Tufo.',
    tag: 'Magia Notturna & Festa',
  },
];

export const EstateGallery: React.FC = () => {
  const [selectedSpaceIndex, setSelectedSpaceIndex] = useState<number | null>(null);

  const handleOpenLightbox = (index: number) => {
    setSelectedSpaceIndex(index);
  };

  const handleCloseLightbox = () => {
    setSelectedSpaceIndex(null);
  };

  const handleNext = useCallback(() => {
    if (selectedSpaceIndex !== null) {
      setSelectedSpaceIndex((selectedSpaceIndex + 1) % estateSpaces.length);
    }
  }, [selectedSpaceIndex]);

  const handlePrev = useCallback(() => {
    if (selectedSpaceIndex !== null) {
      setSelectedSpaceIndex(
        (selectedSpaceIndex - 1 + estateSpaces.length) % estateSpaces.length
      );
    }
  }, [selectedSpaceIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedSpaceIndex === null) return;
      if (e.key === 'Escape') handleCloseLightbox();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSpaceIndex, handleNext, handlePrev]);

  return (
    <div className="pt-8 pb-4">
      {/* Header of the Gallery */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-champagne/30 border border-gold-accent/40 text-gold-dark text-xs font-medium uppercase tracking-wider mb-2">
          <Compass className="w-3.5 h-3.5 text-gold-accent" />
          <span>Tour Virtuale della Tenuta</span>
        </div>
        <h3 className="font-serif text-2xl md:text-3xl text-wedding-charcoal font-semibold tracking-wide">
          Gli Ambienti di La Terra degli Aranci
        </h3>
        <p className="text-xs md:text-sm text-gray-600 font-light max-w-xl mx-auto mt-1">
          Un viaggio sensoriale attraverso i 4 scorci iconici dove celebreremo ogni capitolo del nostro sogno.
        </p>
      </div>

      {/* 4 Spaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {estateSpaces.map((space, index) => (
          <div
            key={space.id}
            onClick={() => handleOpenLightbox(index)}
            className="group cursor-pointer amalfi-paper deckled-border rounded-2xl overflow-hidden shadow-deckled hover:shadow-luxury border border-amalfi-border/80 transition-all duration-500 flex flex-col justify-between"
          >
            {/* Image Container with Deckled Frame */}
            <div className="relative aspect-[16/10] overflow-hidden bg-amalfi-dark">
              <img
                src={space.immagine}
                alt={space.altText}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-wedding-charcoal/60 via-transparent to-black/10 opacity-70 group-hover:opacity-50 transition-opacity" />

              {/* Tag Badge Top-Left */}
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] font-sans font-medium tracking-wide">
                  <Sparkles className="w-3 h-3 text-gold-foil" />
                  {space.tag}
                </span>
              </div>

              {/* Enlarge Trigger Icon Bottom-Right */}
              <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-gold-accent/40 flex items-center justify-center text-wedding-charcoal group-hover:bg-gold-accent group-hover:text-white transition-colors shadow-sm">
                <Maximize2 className="w-4 h-4" />
              </div>
            </div>

            {/* Content Details */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="font-serif text-[11px] tracking-widest uppercase text-gold-dark font-semibold block mb-1">
                  {space.sottotitolo}
                </span>
                <h4 className="font-serif text-xl md:text-2xl text-wedding-charcoal font-semibold">
                  {space.titolo}
                </h4>
                <p className="font-script text-base sm:text-lg text-toile-deep/80 my-2 leading-relaxed">
                  «{space.didascaliaPoetica}»
                </p>
              </div>

              <div className="pt-3 border-t border-amalfi-border/60 flex items-center justify-between text-xs text-gray-500 font-light">
                <span>{space.dettagliSpazio}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Modal Lightbox */}
      {selectedSpaceIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fadeIn"
          onClick={handleCloseLightbox}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-amalfi-card amalfi-paper rounded-2xl overflow-hidden shadow-2xl border border-gold-accent/40 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseLightbox}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-colors border border-white/20 cursor-pointer"
              aria-label="Chiudi galleria"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navigation Arrows */}
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-colors border border-white/20 cursor-pointer"
              aria-label="Spazio precedente"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-colors border border-white/20 cursor-pointer"
              aria-label="Spazio successivo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Lightbox Large Image */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black">
              <img
                src={estateSpaces[selectedSpaceIndex].immagine}
                alt={estateSpaces[selectedSpaceIndex].altText}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/30 text-white text-xs font-sans">
                  <Sparkles className="w-3.5 h-3.5 text-gold-foil" />
                  {estateSpaces[selectedSpaceIndex].tag}
                </span>
              </div>
            </div>

            {/* Lightbox Caption Information */}
            <div className="p-6 md:p-8 bg-amalfi-card flex-1 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-serif text-xs uppercase tracking-widest text-gold-dark font-semibold">
                    {estateSpaces[selectedSpaceIndex].sottotitolo}
                  </span>
                  <h3 className="font-serif text-2xl md:text-3xl text-wedding-charcoal font-semibold mt-0.5">
                    {estateSpaces[selectedSpaceIndex].titolo}
                  </h3>
                </div>
                <span className="text-xs font-serif text-toile-slate">
                  {selectedSpaceIndex + 1} di {estateSpaces.length}
                </span>
              </div>

              <p className="font-script text-xl md:text-2xl text-toile-deep my-3 leading-relaxed">
                «{estateSpaces[selectedSpaceIndex].didascaliaPoetica}»
              </p>

              <p className="text-xs sm:text-sm text-gray-700 font-light leading-relaxed border-t border-amalfi-border pt-3">
                {estateSpaces[selectedSpaceIndex].dettagliSpazio}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
