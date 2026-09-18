import React from 'react';
import { MapPin, Navigation, Calendar, Sparkles } from 'lucide-react';
import { weddingData } from '../../data/weddingData';
import { getGoogleCalendarUrl, downloadIcsFile } from '../../utils/calendarUtils';

interface EventCardsProps {
  onNotify?: (text: string) => void;
}

export const EventCards: React.FC<EventCardsProps> = ({ onNotify }) => {
  const mapsUrl = weddingData.location.mapsUrl;
  const wazeUrl = weddingData.location.wazeUrl;

  const handleCalendar = (type: 'google' | 'apple') => {
    if (type === 'google') {
      window.open(getGoogleCalendarUrl(), '_blank');
      onNotify?.('Apertura Google Calendar...');
    } else {
      downloadIcsFile();
      onNotify?.('Download Save the Date (.ics) avviato');
    }
  };

  return (
    <section id="cerimonia" className="py-14 md:py-20 px-4 max-w-5xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12">
        <span className="font-script text-3xl md:text-4xl text-gold-accent block mb-1">
          I Momenti della Giornata
        </span>
        <h2 className="font-serif text-3xl md:text-4xl text-wedding-charcoal uppercase tracking-wider font-light">
          Cerimonia & Ricevimento
        </h2>
        <div className="w-16 h-[1px] bg-gold-accent/60 mx-auto mt-3" />
      </div>

      {/* Two Column Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
        {/* Card 1: La Cerimonia */}
        <div className="relative bg-amalfi-card amalfi-paper rounded-2xl p-7 md:p-9 shadow-lg border border-gold-accent/30 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group">
          {/* Top Decorative Border */}
          <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-gold-accent/60 to-transparent" />

          <div>
            {/* Icon & Time */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gold-champagne/40 border border-gold-accent/40 flex items-center justify-center text-gold-dark shadow-sm">
                <Sparkles className="w-5 h-5 text-gold-accent" />
              </div>
              <span className="font-serif text-xl md:text-2xl text-gold-dark font-medium tracking-wide">
                Ore 15:00
              </span>
            </div>

            {/* Title */}
            <h3 className="font-serif text-2xl md:text-3xl text-wedding-charcoal font-normal mb-2">
              Il Rito Nuziale
            </h3>
            <p className="font-script text-xl text-gold-accent mb-4">
              La promessa d'amore eterno
            </p>

            {/* Location & Address */}
            <div className="space-y-1.5 text-sm text-gray-600 mb-6 font-light">
              <p className="font-medium text-gray-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gold-accent shrink-0" />
                <span>{weddingData.location.nome} — Giardino delle Promesse</span>
              </p>
              <p className="pl-5 text-xs text-gray-500">
                {weddingData.location.indirizzo}
              </p>
              <p className="pl-5 text-xs text-toile-slate italic pt-1">
                Lunedì 7 Dicembre 2026 • Si raccomanda la puntualità (arrivo ore 14:45)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gold-accent/20 flex flex-wrap gap-2.5">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-cta-bg text-cta-text hover:bg-cta-hover hover:text-cta-hover-text transition-all text-xs font-medium tracking-wider uppercase shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Come arrivare</span>
            </a>
            <button
              onClick={() => handleCalendar('google')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full border border-gold-accent/50 text-gold-dark hover:bg-gold-champagne/30 transition-all text-xs font-medium tracking-wider shadow-sm"
              title="Aggiungi a Google Calendar"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendario</span>
            </button>
          </div>
        </div>

        {/* Card 2: Il Ricevimento */}
        <div className="relative bg-amalfi-card amalfi-paper rounded-2xl p-7 md:p-9 shadow-lg border border-gold-accent/30 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group">
          {/* Top Decorative Border */}
          <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-gold-accent/60 to-transparent" />

          <div>
            {/* Icon & Time */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gold-champagne/40 border border-gold-accent/40 flex items-center justify-center text-gold-dark shadow-sm">
                <span className="font-serif text-lg text-gold-dark">🥂</span>
              </div>
              <span className="font-serif text-xl md:text-2xl text-gold-dark font-medium tracking-wide">
                A seguire • Ore 16:30
              </span>
            </div>

            {/* Title */}
            <h3 className="font-serif text-2xl md:text-3xl text-wedding-charcoal font-normal mb-2">
              Il Ricevimento & Festa
            </h3>
            <p className="font-script text-xl text-gold-accent mb-4">
              Brindisi, sapori & festeggiamenti
            </p>

            {/* Location & Address */}
            <div className="space-y-1.5 text-sm text-gray-600 mb-6 font-light">
              <p className="font-medium text-gray-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gold-accent shrink-0" />
                <span>{weddingData.location.nome} — Agrumeto & Grandi Sale</span>
              </p>
              <p className="pl-5 text-xs text-gray-500">
                {weddingData.location.indirizzo}
              </p>
              <p className="pl-5 text-xs text-toile-slate italic pt-1">
                Aperitivo negli agrumeti, cena di gala nella Sala Bianca e dj set
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gold-accent/20 flex flex-wrap gap-2.5">
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-cta-bg text-cta-text hover:bg-cta-hover hover:text-cta-hover-text transition-all text-xs font-medium tracking-wider uppercase shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Apri su Waze</span>
            </a>
            <a
              href="#location"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full border border-gold-accent/50 text-gold-dark hover:bg-gold-champagne/30 transition-all text-xs font-medium tracking-wider shadow-sm"
            >
              <span>Parcheggio & Info</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventCards;
