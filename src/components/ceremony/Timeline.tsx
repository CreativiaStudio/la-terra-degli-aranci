import React, { useEffect, useRef, useState } from 'react';
import { SectionHeading } from '../common/SectionHeading';
import { DeckledCard } from '../common/DeckledCard';
import { weddingData } from '../../data/weddingData';
import {
  Heart,
  Sparkles,
  HeartHandshake,
  Wine,
  Utensils,
  Cake,
  Music,
  MapPin,
  Navigation,
  Calendar,
} from 'lucide-react';
import { getGoogleCalendarUrl, downloadIcsFile } from '../../utils/calendarUtils';
import { useWeddingTheme } from '../../theme/WeddingThemeContext';

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-5 h-5 text-gold-accent" />,
  HeartHandshake: <HeartHandshake className="w-5 h-5 text-gold-accent" />,
  Wine: <Wine className="w-5 h-5 text-gold-accent" />,
  Utensils: <Utensils className="w-5 h-5 text-gold-accent" />,
  Cake: <Cake className="w-5 h-5 text-gold-accent" />,
  Music: <Music className="w-5 h-5 text-gold-accent" />,
};

interface TimelineProps {
  onNotify?: (text: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ onNotify }) => {
  const { isWinter, isV3 } = useWeddingTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const start = windowHeight * 0.75;
      const total = rect.height;

      const current = start - rect.top;
      const progress = Math.max(0, Math.min(1, current / total));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <section id="timeline" className="py-14 md:py-20 px-4 max-w-5xl mx-auto relative">
      <SectionHeading
        subtitle="Il Programma delle Nozze"
        title="La Nostra Giornata"
        description="I momenti più preziosi che scandiranno la nostra festa d'amore a La Terra degli Aranci."
      />

      {/* Central Timeline Container */}
      <div ref={containerRef} className="relative mt-12 md:mt-16 pb-8">
        {/* Central Dashed Vertical Progression Line (Centered on Desktop and Mobile) */}
        <div
          className={`absolute top-4 bottom-8 left-1/2 -translate-x-1/2 w-[2px] border-l-2 border-dashed pointer-events-none z-0 ${
            isV3 ? 'border-gold-accent/50' : isWinter ? 'border-wedding-burgundy/40' : 'border-gold-accent/40'
          }`}
        />

        {/* Animated Golden Heart Marker tracking page scroll down the center line */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full text-white flex items-center justify-center transition-all duration-150 pointer-events-none z-0 ${
            isV3
              ? 'bg-gradient-to-br from-[#E6CA65] via-[#D4AF37] to-[#A88220] ring-2 ring-gold-champagne/70 shadow-[0_0_20px_rgba(212,175,55,0.8)]'
              : isWinter
              ? 'bg-gradient-to-br from-[#9E2436] via-[#7A1828] to-[#4A0D18] ring-2 ring-gold-accent/70 shadow-[0_0_18px_rgba(223,190,121,0.7)]'
              : 'bg-gradient-to-br from-[#dfbe79] via-gold-accent to-gold-dark shadow-[0_0_16px_rgba(197,160,89,0.85)]'
          }`}
          style={{
            top: `${Math.max(1, Math.min(97, scrollProgress * 98))}%`,
          }}
          title="Momento attuale"
        >
          <Heart
            className={`w-4 h-4 drop-shadow-sm animate-pulse ${
              isV3
                ? 'fill-[#0B172B] text-[#0B172B]'
                : isWinter
                ? 'fill-gold-champagne text-gold-champagne'
                : 'fill-white text-white'
            }`}
          />
        </div>

        {/* Timeline Stages */}
        <div className="space-y-12 md:space-y-16">
          {weddingData.timeline.map((stage, index) => {
            const isEven = index % 2 === 0;

            return (
              <div
                key={stage.ora}
                className="relative flex flex-col md:flex-row items-center group"
              >
                {/* Central Node Circle (Always in the middle: left-1/2) */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 -top-3 md:top-6 w-11 h-11 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 z-20 ${
                    isV3
                      ? 'bg-[#F8F9FA] border-2 border-gold-accent/80 ring-2 ring-gold-foil/40 group-hover:bg-gold-champagne/40'
                      : isWinter
                      ? 'bg-[#FFF9EE] border-2 border-wedding-burgundy/70 ring-2 ring-gold-accent/35 group-hover:bg-gold-champagne/30'
                      : 'bg-white border-2 border-gold-accent group-hover:bg-gold-champagne/25'
                  }`}
                >
                  {iconMap[stage.iconName] || <Sparkles className="w-5 h-5 text-gold-accent" />}
                </div>

                {/* Event Card Box (Alternating Left/Right on Desktop, Centered on Mobile) */}
                <div
                  className={`w-full max-w-sm sm:max-w-md md:max-w-none pt-9 md:pt-0 relative z-10 ${
                    isEven
                      ? 'md:w-[calc(50%-2.5rem)] md:mr-auto'
                      : 'md:w-[calc(50%-2.5rem)] md:ml-auto'
                  }`}
                >
                  <DeckledCard
                    variant="gold-border"
                    className="p-5 sm:p-6 md:p-7 hover:shadow-luxury transition-all duration-300 relative z-10 bg-amalfi-card group-hover:border-gold-accent/60"
                  >
                    {/* Header: Time Badge & Tag */}
                    <div
                      className={`flex flex-wrap items-center gap-2 mb-3 ${
                        isEven ? 'justify-center md:justify-start' : 'justify-center md:justify-start'
                      }`}
                    >
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase ${
                          isV3
                            ? 'bg-[#0D1A30] border border-gold-accent/55 text-gold-foil shadow-[0_0_12px_-4px_rgba(212,175,55,0.5)]'
                            : isWinter
                            ? 'bg-wedding-burgundy/10 border border-wedding-burgundy/35 text-wedding-burgundy'
                            : 'bg-toile-light/80 border border-toile-blue/30 text-toile-deep'
                        }`}
                      >
                        Ore {stage.ora}
                      </span>
                      {stage.badge && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-gold-champagne/30 border border-gold-accent/40 text-gold-dark text-[11px] font-medium tracking-wide">
                          {stage.badge}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-serif text-xl sm:text-2xl text-wedding-charcoal font-semibold tracking-wide text-center md:text-left mb-1.5">
                      {stage.titolo}
                    </h3>

                    {/* Location Subtitle */}
                    <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-toile-slate font-medium mb-3">
                      <MapPin className="w-3.5 h-3.5 text-gold-accent shrink-0" />
                      <span>{stage.luogo}</span>
                    </div>

                    {/* Description Text (Clean, No Photos) */}
                    <p className="text-xs sm:text-sm text-gray-600 font-light leading-relaxed text-center md:text-left">
                      {stage.descrizione}
                    </p>

                    {/* Action buttons on Stage 1 / Rito */}
                    {index === 0 && (
                      <div
                        className={`mt-4 pt-3 border-t flex flex-wrap justify-center md:justify-start gap-2 ${
                          isV3 ? 'border-gold-accent/30' : isWinter ? 'border-wedding-burgundy/20' : 'border-gold-accent/20'
                        }`}
                      >
                        <a
                          href={weddingData.location.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cta-bg text-cta-text hover:bg-cta-hover hover:text-cta-hover-text transition-colors text-[11px] font-medium uppercase tracking-wider shadow-sm"
                        >
                          <Navigation className={`w-3 h-3 ${isV3 ? 'text-[#0B172B]' : isWinter ? 'text-gold-champagne' : 'text-blue-300'}`} />
                          <span>Mappa</span>
                        </a>
                        <button
                          onClick={() => handleCalendar('google')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors text-[11px] font-medium shadow-sm ${
                            isV3
                              ? 'border-gold-accent/60 text-gold-dark hover:bg-gold-champagne/40'
                              : isWinter
                              ? 'border-wedding-burgundy/40 text-wedding-burgundy hover:bg-wedding-burgundy/10'
                              : 'border-gold-accent/50 text-gold-dark hover:bg-gold-champagne/30'
                          }`}
                          title="Aggiungi a Google Calendar"
                        >
                          <Calendar className="w-3 h-3 text-gold-accent" />
                          <span>Salva Data</span>
                        </button>
                      </div>
                    )}
                  </DeckledCard>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Timeline;

