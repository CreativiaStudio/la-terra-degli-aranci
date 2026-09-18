import React from 'react';
import { Calendar, Download } from 'lucide-react';
import { getGoogleCalendarUrl, downloadIcsFile } from '../../utils/calendarUtils';
import { weddingData } from '../../data/weddingData';
import { useWeddingTheme } from '../../theme/WeddingThemeContext';

interface SaveTheDateProps {
  onNotify?: (text: string) => void;
}

export const SaveTheDate: React.FC<SaveTheDateProps> = ({ onNotify }) => {
  const { isWinter, isV3 } = useWeddingTheme();

  const handleGoogleCalendar = () => {
    const url = getGoogleCalendarUrl(weddingData);
    window.open(url, '_blank', 'noopener,noreferrer');
    if (onNotify) onNotify('Apertura Google Calendar in corso...');
  };

  const handleAppleIcs = () => {
    downloadIcsFile(weddingData);
    if (onNotify) onNotify('File iCalendar (.ics) scaricato per Apple / Outlook!');
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 my-6">
      {/* Google Calendar Button */}
      <button
        onClick={handleGoogleCalendar}
        className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-full shadow-sm transition-all text-xs md:text-sm font-medium tracking-wider uppercase group ${
          isV3
            ? 'bg-[#0D1A30] border border-gold-accent/60 text-gold-foil hover:bg-[#12233D] hover:border-gold-foil hover:shadow-[0_0_18px_-4px_rgba(212,175,55,0.5)]'
            : isWinter
            ? 'bg-white border border-wedding-burgundy/40 text-wedding-burgundy hover:bg-wedding-burgundy/10 hover:border-wedding-burgundy'
            : 'bg-white border border-gold-accent/40 text-wedding-charcoal hover:bg-gold-champagne/20 hover:border-gold-accent'
        }`}
      >
        <Calendar className={`w-4 h-4 group-hover:scale-110 transition-transform ${isV3 ? 'text-gold-foil' : 'text-gold-dark'}`} />
        <span>Aggiungi a Google Calendar</span>
      </button>

      {/* Apple Calendar .ics Download Button */}
      <button
        onClick={handleAppleIcs}
        className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-cta-bg text-cta-text shadow-md hover:bg-cta-hover hover:text-cta-hover-text transition-all text-xs md:text-sm font-medium tracking-wider uppercase group"
      >
        <Download className={`w-4 h-4 group-hover:-translate-y-0.5 transition-transform ${isV3 ? 'text-[#0B172B]' : 'text-gold-foil'}`} />
        <span>Salva su Apple / iCal (.ics)</span>
      </button>
    </div>
  );
};
