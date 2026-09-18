import React, { useState, useEffect } from 'react';
import { SectionHeading } from '../common/SectionHeading';
import { DeckledCard } from '../common/DeckledCard';
import { DietaryOption, PartyType, RsvpSubmission, ChildGuest } from '../../types/rsvp';
import { saveRsvp, getMyRsvp } from '../../utils/storage';
import { invitiApi } from '../../services/invitiApi';
import { weddingData } from '../../data/weddingData';
import { useWeddingTheme } from '../../theme/WeddingThemeContext';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Plus, Trash2, Heart, Music, Utensils, Sparkles, Edit3 } from 'lucide-react';

interface RsvpSectionProps {
  onNotify?: (text: string) => void;
}

const dietaryOptionsList: { id: DietaryOption; label: string }[] = [
  { id: 'celiachia', label: 'Celiachia / Senza Glutine' },
  { id: 'lattosio', label: 'Intolleranza al Lattosio' },
  { id: 'vegetariano', label: 'Vegetariano' },
  { id: 'vegano', label: 'Vegano' },
  { id: 'crostacei', label: 'Allergia Crostacei / Molluschi' },
  { id: 'frutta_secca', label: 'Frutta a guscio' },
  { id: 'personalizzato', label: 'Altre note per lo Chef' },
];

const partyOptionsList: {
  id: PartyType;
  emoji: string;
  title: string;
  subtitle: string;
}[] = [
  { id: 'singolo', emoji: '👤', title: 'Parteciperò da solo/a', subtitle: '1 Persona' },
  { id: 'coppia', emoji: '👥', title: 'In Coppia', subtitle: '2 Adulti' },
  { id: 'famiglia', emoji: '👨‍👩‍👧‍👦', title: 'In Famiglia / Gruppo', subtitle: 'Più componenti' },
];

export const RsvpSection: React.FC<RsvpSectionProps> = ({ onNotify }) => {
  const { isWinter, isV3 } = useWeddingTheme();
  const [attending, setAttending] = useState<boolean | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [partyType, setPartyType] = useState<PartyType>('singolo');
  const [plusOneName, setPlusOneName] = useState<string>('');
  const [companions, setCompanions] = useState<string[]>(['']);
  const [childrenList, setChildrenList] = useState<ChildGuest[]>([{ name: '', age: 5 }]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryOption[]>([]);
  const [dietaryCustomNotes, setDietaryCustomNotes] = useState<string>('');
  const [djSongRequest, setDjSongRequest] = useState<string>('');
  const [personalMessage, setPersonalMessage] = useState<string>('');

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const namedCompanions = companions.map(c => c.trim()).filter(c => c.length > 0);
  const namedChildren = childrenList.filter(c => c.name.trim() !== '');
  const adultsCount =
    partyType === 'coppia' ? 2 : partyType === 'famiglia' ? 1 + namedCompanions.length : 1;
  const childrenCount = partyType === 'famiglia' ? namedChildren.length : 0;
  const partyTotal = adultsCount + childrenCount;

  useEffect(() => {
    const existing = getMyRsvp();
    if (existing) {
      setAttending(existing.attending);
      setFullName(existing.fullName);
      setPhone(existing.phone);
      setEmail(existing.email || '');
      setPartyType(existing.partyType || (existing.hasPlusOne ? 'coppia' : 'singolo'));
      setPlusOneName(existing.plusOneName || '');
      setCompanions(
        existing.companions && existing.companions.length > 0 ? existing.companions : ['']
      );
      setChildrenList(existing.childrenList && existing.childrenList.length > 0 ? existing.childrenList : [{ name: '', age: 5 }]);
      setDietaryRestrictions(existing.dietaryRestrictions || []);
      setDietaryCustomNotes(existing.dietaryCustomNotes || '');
      setDjSongRequest(existing.djSongRequest || '');
      setPersonalMessage(existing.personalMessage || '');
      setSubmitted(true);
    }
  }, []);

  const toggleDietary = (opt: DietaryOption) => {
    setDietaryRestrictions(prev =>
      prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt]
    );
  };

  const handleAddChild = () => {
    setChildrenList(prev => [...prev, { name: '', age: 5 }]);
  };

  const handleRemoveChild = (index: number) => {
    setChildrenList(prev => prev.filter((_, i) => i !== index));
  };

  const handleChildChange = (index: number, field: keyof ChildGuest, value: string | number) => {
    setChildrenList(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddCompanion = () => {
    setCompanions(prev => [...prev, '']);
  };

  const handleRemoveCompanion = (index: number) => {
    setCompanions(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [''];
    });
  };

  const handleCompanionChange = (index: number, value: string) => {
    setCompanions(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (attending === null) {
      errs.attending = 'Seleziona se sarai presente o assente.';
    }
    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = 'Inserisci il tuo nome e cognome completo.';
    }
    if (!phone.trim() || phone.trim().length < 6) {
      errs.phone = 'Inserisci un recapito telefonico valido.';
    }
    if (attending === true) {
      if (partyType === 'coppia' && plusOneName.trim().length < 2) {
        errs.plusOneName = "Inserisci il nome e cognome del tuo partner / accompagnatore.";
      }
      if (partyType === 'famiglia') {
        if (companions.some(c => c.trim().length > 0 && c.trim().length < 2)) {
          errs.companions = 'Inserisci nome e cognome di ogni accompagnatore adulto.';
        } else if (namedCompanions.length === 0 && namedChildren.length === 0) {
          errs.partyComposition =
            'Aggiungi almeno un accompagnatore adulto o un bambino, oppure seleziona "Parteciperò da solo/a".';
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const isAttending = attending === true;
    const finalPartyType: PartyType = isAttending ? partyType : 'singolo';
    const finalAdultsCount = isAttending ? adultsCount : 0;
    const finalCompanions = isAttending
      ? finalPartyType === 'coppia'
        ? [plusOneName.trim()]
        : finalPartyType === 'famiglia'
        ? namedCompanions
        : []
      : [];
    const finalChildren =
      isAttending && finalPartyType === 'famiglia' ? namedChildren : [];
    const finalChildrenCount = finalChildren.length;

    const submission: RsvpSubmission = {
      id: `rsvp_${Date.now()}`,
      submittedAt: new Date().toISOString(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      attending: isAttending,
      partyType: finalPartyType,
      adultsCount: finalAdultsCount,
      companions: finalCompanions,
      hasPlusOne: finalCompanions.length > 0,
      plusOneName: finalCompanions.length > 0 ? finalCompanions[0] : undefined,
      hasChildren: finalChildrenCount > 0,
      childrenCount: finalChildrenCount,
      childrenList: finalChildren,
      dietaryRestrictions: isAttending ? dietaryRestrictions : [],
      dietaryCustomNotes: isAttending && dietaryRestrictions.includes('personalizzato') ? dietaryCustomNotes.trim() : undefined,
      djSongRequest: isAttending ? djSongRequest.trim() : undefined,
      personalMessage: personalMessage.trim() || undefined,
    };

    saveRsvp(submission);
    setSubmitted(true);

    // Save to real WordPress REST API & Couple CRM
    const slug = invitiApi.getCurrentSlug();
    invitiApi.submitRsvp(slug, {
      nome: fullName.trim(),
      telefono: phone.trim(),
      email: email.trim(),
      presenza: isAttending ? 'confermato' : 'declinato',
      tipologia_nucleo: finalPartyType,
      accompagnatori: finalCompanions,
      num_adulti: finalAdultsCount,
      num_bambini: finalChildrenCount,
      eta_bambini: finalChildren.map(c => `${c.name.trim()} (${c.age} anni)`).join(', '),
      intolleranze: dietaryRestrictions,
      note_chef: dietaryCustomNotes.trim(),
      canzone_dj: djSongRequest.trim(),
      messaggio_auguri: personalMessage.trim(),
    }).catch(err => console.warn('Sync REST API:', err));

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
        colors: isV3
          ? ['#D4AF37', '#E6CA65', '#2C4E8A', '#F8F9FA']
          : isWinter
          ? ['#C9A24B', '#8C1D2F', '#1E3B2E', '#FDFAF4']
          : ['#C5A059', '#5C82A6', '#FAF7F2'],
        disableForReducedMotion: true,
      });
    } catch (err) {}

    if (onNotify) {
      onNotify(
        attending
          ? 'Grazie! La tua presenza è stata confermata con successo! 🥂'
          : 'Grazie per avercelo comunicato. Vi terremo nel cuore! 💌'
      );
    }
  };

  if (submitted) {
    return (
      <section id="rsvp" className="py-12 md:py-16 px-4 max-w-3xl mx-auto">
        <SectionHeading
          subtitle="Conferma Ricevuta"
          title="Grazie di Cuore!"
        />
        <DeckledCard variant="gold-border" className="text-center space-y-6">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              isWinter ? 'bg-wedding-burgundy/10 text-wedding-burgundy' : 'bg-gold-accent/20 text-gold-dark'
            }`}
          >
            <Heart className="w-8 h-8 fill-current" />
          </div>

          <h3 className="font-serif text-2xl md:text-3xl text-wedding-charcoal">
            {fullName}, abbiamo salvato la tua risposta!
          </h3>

          <p className="text-sm md:text-base text-gray-600 font-light max-w-lg mx-auto leading-relaxed">
            {attending ? (
              <>
                Non vediamo l'ora di festeggiare insieme a te il <strong>7 Dicembre 2026</strong> a <strong>La Terra degli Aranci</strong>!
              </>
            ) : (
              <>
                Ci dispiace che non potrai essere fisicamente con noi, ma sappiamo che sarai presente con il cuore. Grazie per avercelo comunicato!
              </>
            )}
          </p>

          {attending && (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold-champagne/40 border border-gold-accent/50 text-gold-dark text-xs sm:text-sm font-medium">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                ✨ Nucleo registrato: {partyTotal} {partyTotal === 1 ? 'Ospite' : 'Ospiti'} ({adultsCount}{' '}
                {adultsCount === 1 ? 'Adulto' : 'Adulti'}
                {childrenCount > 0 && `, ${childrenCount} ${childrenCount === 1 ? 'Bambino' : 'Bambini'}`})
              </span>
            </div>
          )}

          <div className="pt-4 border-t border-amalfi-border">
            <button
              onClick={() => setSubmitted(false)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gold-accent/50 text-wedding-charcoal text-xs font-medium uppercase tracking-wider hover:bg-gold-champagne/20 transition-all"
            >
              <Edit3 className="w-4 h-4 text-gold-dark" />
              <span>Modifica Risposta</span>
            </button>
          </div>
        </DeckledCard>
      </section>
    );
  }

  return (
    <section id="rsvp" className="py-12 md:py-16 px-4 max-w-3xl mx-auto">
      <SectionHeading
        subtitle="Conferma di Presenza"
        title="RSVP"
        description={weddingData.dataOra.messaggioSollecito}
      />

      <DeckledCard variant="gold-border">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Attendance Toggle */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold text-center mb-4">
              Sarai dei nostri il 7 Dicembre 2026? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAttending(true)}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border text-sm font-medium transition-all ${
                  attending === true
                    ? isWinter
                      ? 'border-wedding-burgundy bg-wedding-burgundy/10 text-wedding-burgundy shadow-md ring-2 ring-wedding-burgundy/30'
                      : 'border-gold-accent bg-gold-champagne/30 text-wedding-charcoal shadow-md ring-2 ring-gold-accent/40'
                    : 'border-gray-200 bg-white/70 text-gray-600 hover:bg-gold-champagne/10'
                }`}
              >
                <CheckCircle2
                  className={`w-5 h-5 ${
                    attending === true
                      ? isWinter
                        ? 'text-wedding-burgundy'
                        : 'text-gold-dark'
                      : 'text-gray-400'
                  }`}
                />
                <span>Con grandissima gioia sarò presente! 🥂</span>
              </button>

              <button
                type="button"
                onClick={() => setAttending(false)}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border text-sm font-medium transition-all ${
                  attending === false
                    ? 'border-wedding-burgundy bg-wedding-burgundy/10 text-wedding-burgundy shadow-md ring-2 ring-wedding-burgundy/30'
                    : 'border-gray-200 bg-white/70 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <XCircle className={`w-5 h-5 ${attending === false ? 'text-wedding-burgundy' : 'text-gray-400'}`} />
                <span>Purtroppo non potrò esserci 💌</span>
              </button>
            </div>
            {errors.attending && <p className="text-xs text-red-600 mt-2 text-center">{errors.attending}</p>}
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-600 font-medium mb-1">
                Nome e Cognome *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="es. Mario Rossi"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white/90 focus:outline-none focus:border-gold-accent text-sm"
              />
              {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-600 font-medium mb-1">
                Telefono / WhatsApp *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="es. +39 333 1234567"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white/90 focus:outline-none focus:border-gold-accent text-sm"
              />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-gray-600 font-medium mb-1">
                Email (opzionale per promemoria)
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="es. mario.rossi@email.it"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white/90 focus:outline-none focus:border-gold-accent text-sm"
              />
            </div>
          </div>

          {/* Attending Sub-Sections */}
          {attending === true && (
            <div className="space-y-6 pt-4 border-t border-amalfi-border">
              {/* Composizione del Nucleo — Singolo / Coppia / Famiglia */}
              <div className="p-4 sm:p-5 rounded-2xl bg-paper-gradient border border-gold-accent/40 shadow-deckled">
                <div className="text-center mb-4">
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-wedding-charcoal">
                    Come parteciperai all'evento?
                  </h4>
                  <p className="text-xs text-gray-500 font-light mt-1">
                    Gli sposi sapranno così esattamente quanti componenti formano il tuo nucleo.
                  </p>
                </div>

                <div
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  role="radiogroup"
                  aria-label="Come parteciperai all'evento?"
                >
                  {partyOptionsList.map(opt => {
                    const isSelected = partyType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setPartyType(opt.id)}
                        className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                          isSelected
                            ? isWinter
                              ? 'border-wedding-burgundy bg-wedding-burgundy/10 shadow-md ring-2 ring-wedding-burgundy/25'
                              : 'border-gold-accent bg-gold-champagne/30 shadow-md ring-2 ring-gold-accent/30'
                            : 'border-amalfi-border bg-white/80 hover:border-gold-accent/60 hover:bg-gold-champagne/10'
                        }`}
                      >
                        <span aria-hidden="true" className="text-2xl leading-none">
                          {opt.emoji}
                        </span>
                        <span
                          className={`text-xs sm:text-sm font-semibold leading-tight ${
                            isSelected ? 'text-wedding-charcoal' : 'text-gray-600'
                          }`}
                        >
                          {opt.title}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-wider font-medium ${
                            isSelected ? 'text-gold-dark' : 'text-gray-400'
                          }`}
                        >
                          {opt.subtitle}
                        </span>
                        {isSelected && (
                          <span className="absolute top-2 right-2">
                            <CheckCircle2 className="w-4 h-4 text-gold-dark" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Coppia — Partner / Accompagnatore */}
                {partyType === 'coppia' && (
                  <div className="mt-4 pt-4 border-t border-gold-accent/25">
                    <label className="block text-xs uppercase tracking-wider text-gray-600 font-medium mb-1">
                      Nome e Cognome del tuo Partner / Accompagnatore *
                    </label>
                    <input
                      type="text"
                      value={plusOneName}
                      onChange={e => setPlusOneName(e.target.value)}
                      placeholder="es. Laura Bianchi"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-gold-accent text-sm"
                    />
                    {errors.plusOneName && <p className="text-xs text-red-600 mt-1">{errors.plusOneName}</p>}
                  </div>
                )}

                {/* Famiglia / Gruppo — Adulti + Bambini */}
                {partyType === 'famiglia' && (
                  <div className="mt-4 pt-4 border-t border-gold-accent/25 space-y-5">
                    <div>
                      <h5 className="text-xs uppercase tracking-wider text-gray-600 font-semibold mb-2">
                        👥 Adulti al seguito
                      </h5>
                      <div className="space-y-2.5">
                        {companions.map((companion, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={companion}
                              onChange={e => handleCompanionChange(idx, e.target.value)}
                              placeholder={`Nome e Cognome Adulto ${idx + 1}`}
                              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-gold-accent"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveCompanion(idx)}
                              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                              title="Elimina accompagnatore"
                              aria-label="Elimina accompagnatore"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Elimina</span>
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCompanion}
                        className="inline-flex items-center gap-1.5 text-xs text-gold-dark font-medium hover:underline pt-2.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Aggiungi un altro adulto</span>
                      </button>
                      {errors.companions && <p className="text-xs text-red-600 mt-1">{errors.companions}</p>}
                    </div>

                    <div>
                      <h5 className="text-xs uppercase tracking-wider text-gray-600 font-semibold mb-2">
                        👶 Bambini (per il menù dedicato)
                      </h5>
                      <div className="space-y-2.5">
                        {childrenList.map((child, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={child.name}
                              onChange={e => handleChildChange(idx, 'name', e.target.value)}
                              placeholder={`Nome Bambino ${idx + 1}`}
                              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-gold-accent"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="17"
                                value={child.age}
                                onChange={e => handleChildChange(idx, 'age', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-2 rounded-lg border border-gray-300 bg-white text-sm text-center"
                                aria-label={`Età Bambino ${idx + 1}`}
                              />
                              <span className="text-xs text-gray-500">anni</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveChild(idx)}
                              className="p-2 text-red-500 hover:text-red-700"
                              title="Elimina bambino"
                              aria-label="Elimina bambino"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddChild}
                        className="inline-flex items-center gap-1.5 text-xs text-gold-dark font-medium hover:underline pt-2.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Aggiungi altro bambino</span>
                      </button>
                    </div>

                    {errors.partyComposition && (
                      <p className="text-xs text-red-600">{errors.partyComposition}</p>
                    )}
                  </div>
                )}

                {/* Badge riassuntivo in tempo reale */}
                <div
                  className={`mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border text-xs sm:text-sm font-medium ${
                    isWinter
                      ? 'bg-wedding-burgundy/5 border-wedding-burgundy/30 text-wedding-burgundy'
                      : 'bg-gold-champagne/30 border-gold-accent/40 text-gold-dark'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>
                    ✨ Totale nucleo: {partyTotal} {partyTotal === 1 ? 'Ospite' : 'Ospiti'} ({adultsCount}{' '}
                    {adultsCount === 1 ? 'Adulto' : 'Adulti'}
                    {partyType === 'famiglia' &&
                      `, ${childrenCount} ${childrenCount === 1 ? 'Bambino' : 'Bambini'}`}
                    )
                  </span>
                </div>
              </div>

              {/* Dietary Requirements */}
              <div className="p-4 rounded-xl bg-white/60 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Utensils className="w-4 h-4 text-gold-accent" />
                  <h4 className="text-sm font-semibold text-wedding-charcoal">
                    Esigenze Alimentari & Allergie
                  </h4>
                </div>

                <div className="flex flex-wrap gap-2">
                  {dietaryOptionsList.map(opt => {
                    const isSelected = dietaryRestrictions.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleDietary(opt.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-toile-blue text-white border-toile-blue shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-toile-blue/50'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {dietaryRestrictions.includes('personalizzato') && (
                  <div className="mt-3">
                    <textarea
                      rows={2}
                      value={dietaryCustomNotes}
                      onChange={e => setDietaryCustomNotes(e.target.value)}
                      placeholder="Indica qui eventuali allergie specifiche o note per lo chef de La Terra degli Aranci..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-gold-accent"
                    />
                  </div>
                )}
              </div>

              {/* DJ Song Request */}
              <div className="p-4 rounded-xl bg-white/60 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Music className="w-4 h-4 text-gold-accent" />
                  <h4 className="text-sm font-semibold text-wedding-charcoal">
                    DJ Set — Sala Tufo Party
                  </h4>
                </div>
                <p className="text-xs text-gray-500 font-light mb-3">
                  Qual è la canzone che vorresti assolutamente ballare durante l'after party?
                </p>
                <input
                  type="text"
                  value={djSongRequest}
                  onChange={e => setDjSongRequest(e.target.value)}
                  placeholder="es. Canzone preferita - Artista"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-gold-accent text-sm"
                />
              </div>
            </div>
          )}

          {/* Personal Message for Couple */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-600 font-medium mb-1">
              Un messaggio speciale per Francesca e Ferdinando
            </label>
            <textarea
              rows={3}
              value={personalMessage}
              onChange={e => setPersonalMessage(e.target.value)}
              placeholder="Scrivi qui i tuoi auguri personali o un ricordo speciale..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white/90 focus:outline-none focus:border-gold-accent text-sm"
            />
          </div>

          {/* Submit Button */}
          <div className="text-center pt-2">
            <button
              type="submit"
              className="cta-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-medium text-sm uppercase tracking-widest shadow-luxury transition-all cursor-pointer"
            >
              <span>Invia Conferma RSVP</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </form>
      </DeckledCard>
    </section>
  );
};
