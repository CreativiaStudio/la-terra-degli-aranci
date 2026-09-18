import React from 'react';
import { SectionHeading } from '../common/SectionHeading';
import { DeckledCard } from '../common/DeckledCard';
import { weddingData } from '../../data/weddingData';
import { useWeddingTheme } from '../../theme/WeddingThemeContext';
import { MapPin, Navigation, Car, ExternalLink } from 'lucide-react';

export const VenueMap: React.FC = () => {
  const { isWinter } = useWeddingTheme();

  return (
    <section id="location" className="py-12 md:py-16 px-4 max-w-4xl mx-auto">
      {/* Section Header with Official TdA Badge */}
      <div className="flex flex-col items-center mb-4">
        <img
          src="./images/tda_logo.webp"
          alt="Logo Ufficiale La Terra degli Aranci"
          className="h-14 md:h-16 w-auto object-contain mb-3 drop-shadow-sm"
          loading="lazy"
        />
      </div>

      <SectionHeading
        subtitle="La Cornice dei Nostri Sogni"
        title="La Terra degli Aranci"
        description="Un'oasi verde incastonata tra le colline del Vomero e di Posillipo con vista sul Golfo di Napoli."
      />

      {/* Logistical Details & Navigation Card */}
      <DeckledCard variant="gold-border" className="space-y-6 mt-8">
        {/* Address Banner */}
        <div className="text-center pb-4 border-b border-amalfi-border">
          <div className="inline-flex items-center gap-2 text-gold-dark font-medium text-sm md:text-base">
            <MapPin className="w-5 h-5 text-gold-accent shrink-0" />
            <span>{weddingData.location.indirizzo} — {weddingData.location.capCitta}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-light">
            {weddingData.location.puntiRiferimento}
          </p>
        </div>

        {/* 1-Click Navigation App Deep Links */}
        {/* 1-Click Navigation App Deep Link */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">
            Avvia il Navigatore GPS
          </p>
          <div className="flex justify-center">
            <a
              href={weddingData.location.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white border transition-all text-xs font-semibold uppercase tracking-wider shadow-sm hover:shadow-md cursor-pointer ${
                isWinter
                  ? 'border-wedding-burgundy/40 text-wedding-burgundy hover:border-wedding-burgundy hover:bg-wedding-burgundy/10'
                  : 'border-gold-accent/50 text-wedding-charcoal hover:border-gold-accent hover:bg-gold-champagne/15'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isWinter ? 'text-gold-dark' : 'text-blue-600'}`} />
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </a>
          </div>
        </div>

        {/* Parking Logistics Info */}
        <div className="pt-4 border-t border-amalfi-border max-w-lg mx-auto">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-toile-light/40 border border-toile-blue/20 text-left">
            <div className="p-2 rounded-full bg-toile-blue/20 text-toile-deep shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif text-lg font-semibold text-wedding-charcoal">
                Parcheggio Custodito
              </h4>
              <p className="text-xs text-gray-600 font-light mt-1 leading-relaxed">
                {weddingData.location.parcheggio}. Servizio accoglienza all'ingresso della villa.
              </p>
            </div>
          </div>
        </div>
      </DeckledCard>
    </section>
  );
};
