import React, { useState, useEffect } from 'react';
import { calculateCountdown, padZero, TimeRemaining } from '../../utils/countdown';
import { weddingData } from '../../data/weddingData';
import { useWeddingTheme } from '../../theme/WeddingThemeContext';
import { Sparkles } from 'lucide-react';

export const Countdown: React.FC = () => {
  const { isV3 } = useWeddingTheme();
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    calculateCountdown(weddingData.dataOra.targetTimestampMs)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateCountdown(weddingData.dataOra.targetTimestampMs));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (timeLeft.isFinished) {
    return (
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-gold-champagne/30 via-white to-gold-champagne/30 border border-gold-accent/50 text-center shadow-lg max-w-xl mx-auto my-8">
        <Sparkles className="w-8 h-8 text-gold-dark mx-auto mb-2 animate-bounce" />
        <h3 className="font-serif text-2xl md:text-3xl text-wedding-charcoal uppercase tracking-wider">
          Oggi Sposi! ✨
        </h3>
        <p className="text-sm text-gray-600 mt-2 font-light">
          Francesca & Ferdinando si uniscono oggi in matrimonio a La Terra degli Aranci.
        </p>
      </div>
    );
  }

  const timeUnits = [
    { label: 'Giorni', value: padZero(timeLeft.days) },
    { label: 'Ore', value: padZero(timeLeft.hours) },
    { label: 'Minuti', value: padZero(timeLeft.minutes) },
    { label: 'Secondi', value: padZero(timeLeft.seconds) },
  ];

  return (
    <div className="my-8 md:my-12 max-w-xl mx-auto px-4">
      <div className="text-center mb-4">
        <span className={`text-xs uppercase tracking-[0.25em] font-medium ${isV3 ? 'text-gold-foil/80' : 'text-gray-500'}`}>
          Conto alla rovescia per il grande giorno
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {timeUnits.map(unit => (
          <div
            key={unit.label}
            className={`flex flex-col items-center justify-center p-3 md:p-5 rounded-xl border shadow-md transition-transform hover:-translate-y-1 ${
              isV3
                ? 'bg-[#0D1A30]/85 backdrop-blur-sm border-gold-accent/50 shadow-[0_10px_28px_-10px_rgba(2,6,14,0.65),0_0_16px_-6px_rgba(212,175,55,0.4)]'
                : 'bg-white/80 backdrop-blur-sm border-gold-accent/30'
            }`}
          >
            <span
              className={`font-serif text-2xl md:text-4xl font-semibold tracking-wider ${
                isV3 ? 'gold-mirror-text' : 'text-wedding-charcoal'
              }`}
            >
              {unit.value}
            </span>
            <span
              className={`text-[10px] md:text-xs uppercase tracking-wider mt-1 font-medium ${
                isV3 ? 'text-gold-champagne/90' : 'text-toile-slate'
              }`}
            >
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
