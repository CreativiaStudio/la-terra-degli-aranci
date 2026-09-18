import React, { useState } from 'react';
import { Camera, Copy, Check, Instagram } from 'lucide-react';
import { SectionHeading } from '../common/SectionHeading';
import { DeckledCard } from '../common/DeckledCard';

interface HashtagSectionProps {
  onNotify?: (text: string) => void;
}

export const HashtagSection: React.FC<HashtagSectionProps> = ({ onNotify }) => {
  const [copied, setCopied] = useState(false);
  const hashtag = '#FrancescaEFerdinando2026';

  const handleCopy = () => {
    navigator.clipboard.writeText(hashtag).then(() => {
      setCopied(true);
      if (onNotify) onNotify('Hashtag copiato negli appunti! 📸');
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  return (
    <section id="hashtag" className="py-12 md:py-16 px-4 max-w-3xl mx-auto">
      <SectionHeading
        subtitle="I Nostri Ricordi"
        title="Hashtag Ufficiale"
        description="Condividete foto e video su Instagram e TikTok per raccogliere ogni momento speciale della nostra festa."
      />

      <DeckledCard className="text-center p-8 md:p-10 space-y-5">
        <div className="w-14 h-14 rounded-full bg-gold-champagne/40 border border-gold-accent/40 flex items-center justify-center text-gold-dark mx-auto shadow-sm">
          <Camera className="w-6 h-6 text-gold-accent" />
        </div>

        {/* Large Hashtag Typography */}
        <div className="py-2">
          <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-wedding-charcoal tracking-wide break-all">
            {hashtag}
          </h3>
        </div>

        <p className="text-xs md:text-sm text-gray-600 font-light max-w-md mx-auto leading-relaxed">
          Taggate le vostre storie e i vostri post per permetterci di rivivere le emozioni attraverso i vostri occhi!
        </p>

        {/* Actions */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-sm ${
              copied
                ? 'bg-green-700 text-white'
                : 'bg-cta-bg text-cta-text hover:bg-cta-hover hover:text-cta-hover-text'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-gold-foil" />}
            <span>{copied ? 'Hashtag Copiato!' : 'Copia Hashtag'}</span>
          </button>

          <a
            href={`https://www.instagram.com/explore/tags/${hashtag.replace('#', '')}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gold-accent/50 text-gold-dark hover:bg-gold-champagne/30 transition-all text-xs font-semibold uppercase tracking-wider"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-700" />
            <span>Vedi su Instagram</span>
          </a>
        </div>
      </DeckledCard>
    </section>
  );
};

export default HashtagSection;
