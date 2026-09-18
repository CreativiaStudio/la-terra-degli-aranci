import React, { useState } from 'react';
import { SectionHeading } from '../common/SectionHeading';
import { DeckledCard } from '../common/DeckledCard';
import { weddingData } from '../../data/weddingData';
import { copyIbanToClipboard, playSoftChime, formatIban } from '../../utils/ibanUtils';
import { invitiApi } from '../../services/invitiApi';
import { useWeddingTheme } from '../../theme/WeddingThemeContext';
import { Gift, Copy, Check, Building, Heart, Send } from 'lucide-react';

const GIFT_ICONS = [
  { id: 'heart', emoji: '🤍', label: 'Amore' },
  { id: 'toast', emoji: '🥂', label: 'Brindisi' },
  { id: 'sparkles', emoji: '✨', label: 'Magia' },
  { id: 'bouquet', emoji: '💐', label: 'Fiori' },
  { id: 'dove', emoji: '🕊️', label: 'Armonia' },
  { id: 'gift', emoji: '🎁', label: 'Dono' },
];

interface GiftSectionProps {
  onNotify?: (text: string) => void;
}

export const GiftSection: React.FC<GiftSectionProps> = ({ onNotify }) => {
  const { isWinter } = useWeddingTheme();
  const [copied, setCopied] = useState<boolean>(false);
  const [causaleCopied, setCausaleCopied] = useState<boolean>(false);

  const handleCopyIban = async () => {
    const success = await copyIbanToClipboard(weddingData.regalo.iban);
    if (success) {
      setCopied(true);
      playSoftChime();
      if (onNotify) onNotify('IBAN copiato negli appunti — Grazie di cuore! 🎁');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCopyCausale = async () => {
    const success = await copyIbanToClipboard(weddingData.regalo.causaleConsigliata);
    if (success) {
      setCausaleCopied(true);
      if (onNotify) onNotify('Causale suggerita copiata negli appunti!');
      setTimeout(() => setCausaleCopied(false), 3000);
    }
  };

  return (
    <section id="regalo" className="py-12 md:py-16 px-4 max-w-3xl mx-auto">
      <SectionHeading
        subtitle="Il Nostro Sogno"
        title="Regalo di Nozze"
        description={weddingData.regalo.messaggio}
      />

      <DeckledCard variant="gold-border" className="space-y-6 text-center">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-inner ${
            isWinter ? 'bg-wedding-burgundy/10 text-wedding-burgundy' : 'bg-gold-accent/20 text-gold-dark'
          }`}
        >
          <Gift className="w-7 h-7" />
        </div>

        {/* Intestatari & Bank */}
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">
            Beneficiari del Bonifico
          </p>
          <h4 className="font-serif text-xl md:text-2xl text-wedding-charcoal font-semibold">
            {weddingData.regalo.intestatari}
          </h4>
          <p className="text-xs text-toile-slate flex items-center justify-center gap-1.5">
            <Building className="w-3.5 h-3.5" />
            <span>{weddingData.regalo.banca}</span>
          </p>
        </div>

        {/* IBAN Code Box */}
        <div className="p-4 md:p-6 rounded-2xl bg-white/90 border border-gold-accent/40 shadow-inner max-w-lg mx-auto space-y-3">
          <span className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold block">
            Codice IBAN
          </span>

          <div className="font-mono text-sm sm:text-lg md:text-xl font-bold text-wedding-charcoal tracking-wider select-all break-all">
            {formatIban(weddingData.regalo.iban)}
          </div>

          <div className="pt-2">
            <button
              onClick={handleCopyIban}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-md ${
                copied
                  ? 'bg-green-700 text-white shadow-green-900/20'
                  : `bg-cta-bg text-cta-text hover:bg-cta-hover hover:text-cta-hover-text ${
                      isWinter ? 'border border-gold-foil/55 shadow-[0_8px_20px_-8px_rgba(107,18,32,0.5)]' : ''
                    }`
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>✓ IBAN Copiato negli appunti!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gold-foil" />
                  <span>Copia Codice IBAN</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Causale Helper */}
        <div className="pt-3 border-t border-amalfi-border max-w-md mx-auto text-left">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium block">
                Causale Consigliata:
              </span>
              <p className="text-xs text-gray-700 font-mono mt-0.5">
                {weddingData.regalo.causaleConsigliata}
              </p>
            </div>
            <button
              onClick={handleCopyCausale}
              className="text-xs text-gold-dark hover:text-gold-accent p-1.5 shrink-0 flex items-center gap-1 font-medium"
              title="Copia Causale"
            >
              {causaleCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{causaleCopied ? 'Copiata' : 'Copia'}</span>
            </button>
          </div>
        </div>

        {/* Avviso Bonifico Effettuato Form */}
        {/* Avviso Bonifico & Messaggio Privato Sposi */}
        <div className="mt-8 pt-6 border-t border-gold-accent/20 max-w-lg mx-auto text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gold-accent/15 text-gold-dark mb-2">
            <Heart className="w-5 h-5 fill-gold-dark/20" />
          </div>
          <h5 className="font-serif text-lg md:text-xl text-wedding-charcoal font-semibold mb-1">
            Un Messaggio per gli Sposi
          </h5>
          <p className="text-xs text-gray-500 font-light mb-5 max-w-sm mx-auto leading-relaxed">
            Scrivi una dedica d'affetto per Francesca & Ferdinando e avvisali del bonifico. Il messaggio sarà custodito privatamente nella loro area riservata.
          </p>

          <WireTransferNoticeForm onNotify={onNotify} />
        </div>
      </DeckledCard>
    </section>
  );
};

const WireTransferNoticeForm: React.FC<{ onNotify?: (text: string) => void }> = ({ onNotify }) => {
  const { isWinter } = useWeddingTheme();
  const [nome, setNome] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('🤍');
  const [messaggio, setMessaggio] = useState('');
  const [confermato, setConfermato] = useState(false);
  const [inviato, setInviato] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !confermato) return;

    const fullMessage = selectedIcon
      ? (messaggio.trim() ? `${selectedIcon} ${messaggio.trim()}` : `${selectedIcon} Un pensiero speciale per voi`)
      : (messaggio.trim() || '');

    // Save to local storage for couple admin
    try {
      const existing = JSON.parse(localStorage.getItem('tda_wire_transfers') || '[]');
      existing.unshift({
        id: `wire_${Date.now()}`,
        nome: nome.trim(),
        messaggio: fullMessage,
        data: new Date().toISOString(),
      });
      localStorage.setItem('tda_wire_transfers', JSON.stringify(existing));
    } catch (_err: unknown) {}

    // Notify WordPress REST API
    const slug = invitiApi.getCurrentSlug();
    invitiApi.notifyBonifico(slug, {
      nome: nome.trim(),
      messaggio: fullMessage || undefined,
    }).catch((err: unknown) => console.warn('Sync Bonifico API:', err));

    setInviato(true);
    if (onNotify) onNotify('Grazie di cuore! Il tuo messaggio è stato inviato privatamente agli sposi 🤍');
  };

  if (inviato) {
    return (
      <div className="p-6 rounded-2xl bg-amalfi-card border border-gold-accent/40 text-wedding-charcoal text-center space-y-2.5 shadow-sm animate-fadeIn">
        <div className="text-3xl animate-bounce">{selectedIcon || '🤍'}</div>
        <p className="font-serif font-semibold text-lg text-wedding-charcoal">
          Grazie di cuore!
        </p>
        <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
          Il tuo messaggio d'affetto e l'avviso di bonifico sono stati recapitati privatamente a Francesca & Ferdinando.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <label htmlFor="wire-name" className="block text-[11px] uppercase tracking-wider text-gray-600 font-semibold mb-1">
          Il tuo Nome / Famiglia *
        </label>
        <input
          id="wire-name"
          type="text"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
          placeholder="Es. Mario & Elena Rossi"
          className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-gold-accent/40 focus:outline-none focus:border-gold-accent shadow-xs placeholder:text-gray-400"
        />
      </div>

      {/* Scelta icona augurio */}
      <div>
        <span className="block text-[11px] uppercase tracking-wider text-gray-600 font-semibold mb-2">
          Scegli un simbolo per il tuo augurio
        </span>
        <div className="grid grid-cols-6 gap-2">
          {GIFT_ICONS.map(item => {
            const isSelected = selectedIcon === item.emoji;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIcon(isSelected ? '' : item.emoji)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gold-accent/20 border-gold-accent ring-2 ring-gold-accent/40 shadow-xs scale-105'
                    : 'bg-white/80 border-gray-200 hover:border-gold-accent/40 hover:bg-white'
                }`}
                title={item.label}
              >
                <span className="text-xl leading-none">{item.emoji}</span>
                <span className="text-[9px] text-gray-500 font-medium mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messaggio privato */}
      <div>
        <label htmlFor="wire-message" className="block text-[11px] uppercase tracking-wider text-gray-600 font-semibold mb-1">
          Un messaggio d'affetto per gli sposi (privato)
        </label>
        <textarea
          id="wire-message"
          value={messaggio}
          onChange={e => setMessaggio(e.target.value)}
          rows={3}
          placeholder="Es. Con affetto e immensa gioia per il vostro giorno..."
          className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-gold-accent/40 focus:outline-none focus:border-gold-accent resize-none placeholder:text-gray-400"
        />
      </div>

      {/* Checkbox conferma bonifico */}
      <label className="flex items-start gap-2.5 text-xs text-wedding-charcoal font-medium cursor-pointer p-3 rounded-xl bg-white/70 border border-gold-accent/20 hover:bg-white transition-colors">
        <input
          type="checkbox"
          checked={confermato}
          onChange={e => setConfermato(e.target.checked)}
          required
          className="mt-0.5 rounded border-gold-accent text-gold-dark focus:ring-gold-accent w-4 h-4 shrink-0"
        />
        <span className="leading-snug">
          Abbiamo effettuato il bonifico con questi dati bancari
        </span>
      </label>

      {/* Tasto Invio */}
      <div className="pt-2 text-center">
        <button
          type="submit"
          disabled={!confermato || !nome.trim()}
          className={`inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-semibold uppercase tracking-wider shadow-md hover:shadow-lg cursor-pointer ${
            isWinter
              ? 'cta-primary'
              : 'bg-gold-dark text-white hover:bg-gold-accent'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Invia Messaggio agli Sposi {selectedIcon || '🤍'}</span>
        </button>
      </div>
    </form>
  );
};
