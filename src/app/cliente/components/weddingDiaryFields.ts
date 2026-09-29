/**
 * Wedding Diary — Scheda campi ufficiale
 * ---------------------------------------------------------------
 * Fonte di verità unica dei campi estratti dal form JetFormBuilder
 * del sito WordPress ufficiale di La Terra degli Aranci.
 *
 * NB: il valore salvato (`value`) è SEMPRE la stringa italiana canonica
 * del JetFormBuilder, così i dati restano confrontabili con il legacy
 * anche quando l'interfaccia viene visualizzata in inglese.
 * La label inglese (`en`) è usata solo a livello di visualizzazione.
 */

export type WeddingDiaryFieldType = "radio" | "checkbox" | "text" | "date";

export interface WeddingDiaryOption {
  /** Valore canonico memorizzato (stringa italiana ufficiale). */
  value: string;
  /** Label di visualizzazione in inglese (fallback: `value`). */
  en?: string;
}

export interface WeddingDiaryField {
  /** Nome campo come da JetFormBuilder (case-sensitive). */
  name: string;
  type: WeddingDiaryFieldType;
  labelIt: string;
  labelEn: string;
  /** Suggerimento breve opzionale, mostrato sotto la label. */
  helperIt?: string;
  helperEn?: string;
  /** Placeholder per i campi testuali. */
  placeholderIt?: string;
  placeholderEn?: string;
  /** Opzioni per radio / checkbox. */
  options?: WeddingDiaryOption[];
}

export interface WeddingDiarySection {
  id: string;
  icon: string;
  titleIt: string;
  titleEn: string;
  subtitleIt?: string;
  subtitleEn?: string;
  fields: WeddingDiaryField[];
}

/** Helper compatto per dichiarare un'opzione (value canonico + label EN). */
const o = (value: string, en: string): WeddingDiaryOption => ({ value, en });

export const WEDDING_DIARY_SECTIONS: WeddingDiarySection[] = [
  {
    id: "giorno",
    icon: "📅",
    titleIt: "Il Vostro Giorno",
    titleEn: "Your Special Day",
    subtitleIt: "Data e momento in cui tutto comincia.",
    subtitleEn: "The date and the moment when everything begins.",
    fields: [
      {
        name: "inizio_evento",
        type: "radio",
        labelIt: "Quando inizierà il vostro evento?",
        labelEn: "When will your event begin?",
        options: [o("Mattina", "Morning"), o("Pomeriggio", "Afternoon")],
      },
      {
        name: "la_nostra_data_perfetta",
        type: "date",
        labelIt: "La nostra data perfetta",
        labelEn: "Our perfect date",
        helperIt: "La data che sognate per il vostro matrimonio.",
        helperEn: "The date you dream of for your wedding.",
      },
    ],
  },
  {
    id: "inviti_rito",
    icon: "💍",
    titleIt: "Partecipazioni & Rito",
    titleEn: "Stationery & Ceremony",
    subtitleIt: "Come annuncerete l'evento e come lo celebrerete.",
    subtitleEn: "How you will announce the event and how you will celebrate it.",
    fields: [
      {
        name: "partecipazioni_e_inviti",
        type: "radio",
        labelIt: "Partecipazioni e inviti",
        labelEn: "Stationery & Invitations",
        options: [
          o("Classiche ed eleganti", "Classic and elegant"),
          o("Moderne e minimal", "Modern and minimal"),
          o("Rustiche e artigianali", "Rustic and artisanal"),
          o("Con elementi botanici", "With botanical elements"),
          o("Coordinate con il tema dell'evento", "Coordinated with the event theme"),
          o("Con illustrazioni personalizzate", "With custom illustrations"),
          o("Digitali o stampate su carta naturale", "Digital or printed on natural paper"),
        ],
      },
      {
        name: "rito_religioso",
        type: "radio",
        labelIt: "Rito religioso",
        labelEn: "Religious ceremony",
        options: [o("Cattolico", "Catholic"), o("Evangelico", "Evangelical"), o("Ortodosso", "Orthodox")],
      },
      {
        name: "rito_civile",
        type: "radio",
        labelIt: "Rito civile",
        labelEn: "Civil ceremony",
        options: [
          o("Presso la municipalità", "At the town hall"),
          o("Al Maschio Angioino - Sala della Loggia", "At Maschio Angioino - Sala della Loggia"),
        ],
      },
      {
        name: "rito_simbolico",
        type: "checkbox",
        labelIt: "Rito simbolico",
        labelEn: "Symbolic ceremony",
        options: [o("In villa", "At the villa")],
      },
      {
        name: "musica_e_atmosfera_del_rito_simbolico",
        type: "checkbox",
        labelIt: "Musica e atmosfera del rito simbolico",
        labelEn: "Music & atmosphere of the symbolic ceremony",
        options: [
          o("Musica: Filodiffusione o in acustico", "Music: background or acoustic"),
          o("Canzone per l'ingresso della sposa", "Song for the bride's entrance"),
        ],
      },
      {
        name: "canzone_ingresso_sposa",
        type: "text",
        labelIt: "Canzone per l'ingresso della sposa",
        labelEn: "Song for the bride's entrance",
        placeholderIt: "Titolo e artista…",
        placeholderEn: "Title and artist…",
      },
    ],
  },
  {
    id: "preparativi",
    icon: "👰",
    titleIt: "I Preparativi",
    titleEn: "Getting Ready",
    subtitleIt: "Dove e come vivrete l'attesa del gran momento.",
    subtitleEn: "Where and how you will live the wait for the big moment.",
    fields: [
      {
        name: "ci_prepareremo",
        type: "radio",
        labelIt: "Ci prepareremo…",
        labelEn: "We will get ready…",
        options: [
          o("In location (solo per la sposa)", "At the venue (bride only)"),
          o("In un luogo speciale per noi", "In a place that is special to us"),
          o("Separati, ognuno con la propria famiglia", "Separately, each with their own family"),
          o("Insieme, per vivere ogni momento", "Together, to live every moment"),
        ],
      },
      {
        name: "abito_della_sposa",
        type: "radio",
        labelIt: "Abito della sposa",
        labelEn: "The bride's dress",
        options: [
          o("Romantico", "Romantic"),
          o("Essenziale", "Essential"),
          o("Boho", "Boho"),
          o("Principesco", "Princess-like"),
          o("Da cambiare nel corso della giornata", "To be changed during the day"),
        ],
      },
      {
        name: "abito_dello_sposo",
        type: "radio",
        labelIt: "Abito dello sposo",
        labelEn: "The groom's outfit",
        options: [
          o("Classico", "Classic"),
          o("Spezzato", "Mix & match"),
          o("Moderno", "Modern"),
          o("Originale", "Original"),
        ],
      },
    ],
  },
  {
    id: "stile_sapori",
    icon: "🎨",
    titleIt: "Stile & Sapori",
    titleEn: "Style & Flavours",
    subtitleIt: "L'anima estetica e gastronomica della vostra giornata.",
    subtitleEn: "The aesthetic and gastronomic soul of your day.",
    fields: [
      {
        name: "Stile_evento",
        type: "radio",
        labelIt: "Stile dell'evento",
        labelEn: "Event style",
        options: [
          o("Classico ed elegante", "Classic and elegant"),
          o("Country con materiali naturali", "Country with natural materials"),
          o("Boho chic con ispirazioni hippie", "Boho chic with hippie inspirations"),
          o("Caleidoscopio di colori", "Kaleidoscope of colours"),
        ],
      },
      {
        name: "sapori_equilibri",
        type: "checkbox",
        labelIt: "Sapori ed equilibri",
        labelEn: "Flavours & balance",
        helperIt: "Potete scegliere più di una formula.",
        helperEn: "You can choose more than one option.",
        options: [
          o("Aperitivo finger food a isole tematiche", "Finger food aperitivo with themed islands"),
          o("Antipasto tradizionale napoletano a buffet", "Traditional Neapolitan buffet starter"),
          o("Angoli show-cooking e specialità tipiche", "Show-cooking corners and local specialities"),
          o("3 portate servite al tavolo", "3 courses served at the table"),
          o("4 portate servite al tavolo", "4 courses served at the table"),
          o("Aperiwedding", "Aperiwedding"),
        ],
      },
    ],
  },
  {
    id: "musica",
    icon: "🎵",
    titleIt: "La Musica che Vi Rappresenta",
    titleEn: "The Music That Represents You",
    subtitleIt: "La colonna sonora dei momenti indimenticabili.",
    subtitleEn: "The soundtrack of your unforgettable moments.",
    fields: [
      {
        name: "Note_che_ci_rappresentano",
        type: "radio",
        labelIt: "Le note che ci rappresentano",
        labelEn: "The notes that represent us",
        options: [o("Musica live", "Live music"), o("Filodiffusione", "Background music"), o("DJ set", "DJ set")],
      },
      {
        name: "brano_ingresso_villa",
        type: "text",
        labelIt: "Brano per il vostro ingresso in villa",
        labelEn: "Song for your entrance at the villa",
        placeholderIt: "Titolo e artista…",
        placeholderEn: "Title and artist…",
      },
      {
        name: "brano_ingresso_pranzo_cena",
        type: "text",
        labelIt: "Brano per l'ingresso al pranzo/cena",
        labelEn: "Song for the entrance to lunch/dinner",
        placeholderIt: "Titolo e artista…",
        placeholderEn: "Title and artist…",
      },
      {
        name: "brano_ingresso_torta",
        type: "text",
        labelIt: "Brano per l'ingresso della torta",
        labelEn: "Song for the cake entrance",
        placeholderIt: "Titolo e artista…",
        placeholderEn: "Title and artist…",
      },
      {
        name: "canzone_primo_ballo",
        type: "text",
        labelIt: "Canzone del primo ballo",
        labelEn: "First dance song",
        placeholderIt: "Titolo e artista…",
        placeholderEn: "Title and artist…",
      },
    ],
  },
  {
    id: "su_misura",
    icon: "🎁",
    titleIt: "Su Misura & Accoglienza",
    titleEn: "Tailor-Made & Hospitality",
    subtitleIt: "Tutti i dettagli che rendono la giornata vostra.",
    subtitleEn: "All the details that make the day truly yours.",
    fields: [
      {
        name: "matrimonio_su_misura",
        type: "checkbox",
        labelIt: "Il vostro matrimonio su misura",
        labelEn: "Your tailor-made wedding",
        helperIt: "Selezionate tutti i servizi che desiderate.",
        helperEn: "Select all the services you would like.",
        options: [
          o("Partecipazioni/invito digitale e/o web-site", "Stationery / digital invite and/or website"),
          o("Parcheggio", "Parking"),
          o("Preparazione sposa in loco", "On-site bridal preparation"),
          o("Bridal assistant", "Bridal assistant"),
          o("Angolo confort: ballerine, infradito e/o salvatacchi", "Comfort corner: flats, flip-flops and/or heel protectors"),
          o("Rito in villa", "Ceremony at the villa"),
          o("Aperitivo con Ape car", "Aperitivo with Ape car"),
          o("Celebrante", "Officiant"),
          o("Wedding bag", "Wedding bag"),
          o("Angolo guestbook", "Guestbook corner"),
          o("Caricaturista / Ritrattista", "Caricaturist / portrait artist"),
          o("Cena in giardino", "Dinner in the garden"),
          o("Stampa personalizzata di menù / cavalieri / tableau", "Custom printing of menus / place cards / seating chart"),
          o("Segnaposto / Cadeau", "Place markers / Favors"),
          o("Artisti dell'artigianato, live performer", "Artisan artists, live performers"),
          o("Service luci personalizzate", "Custom lighting setup"),
          o("Matrimonio eco-sostenibile", "Eco-sustainable wedding"),
          o("Animazione bambini / Baby-sitter", "Kids entertainment / Babysitter"),
          o("Pet sitter", "Pet sitter"),
          o("Fuochi freddi e stelline", "Cold fireworks and sparklers"),
          o("Bomboniere personalizzate", "Custom wedding favors"),
          o("After party", "After party"),
        ],
      },
      {
        name: "accogliere_accompagnare",
        type: "checkbox",
        labelIt: "Accogliere e accompagnare gli ospiti",
        labelEn: "Welcoming and looking after your guests",
        options: [
          o("Auto d'epoca o Vespa per gli sposi", "Vintage car or Vespa for the newlyweds"),
          o("Transfer per gli ospiti", "Guest transfer"),
          o("Servizio navetta", "Shuttle service"),
          o("Pernottamento in albergo convenzionato", "Overnight stay in a partner hotel"),
          o("Organizzazione logistica arrivi/partenze", "Arrival/departure logistics management"),
          o("Supporto multilingua per ospiti stranieri", "Multilingual support for international guests"),
          o("Ape Car con bar itinerante", "Ape Car with a roaming bar"),
        ],
      },
      {
        name: "prima_dopo_matrimonio",
        type: "checkbox",
        labelIt: "Prima e dopo il matrimonio",
        labelEn: "Before and after the wedding",
        options: [
          o("Tour in barca nel Golfo di Napoli", "Boat tour in the Gulf of Naples"),
          o("Giro in Vespa sulla Costiera Amalfitana", "Vespa ride along the Amalfi Coast"),
          o("Visita guidata al centro storico di Napoli", "Guided tour of Naples' historic centre"),
          o("Food tour tra mercati e street food", "Food tour among markets and street food"),
          o("Brunch o picnic del giorno dopo", "Day-after brunch or picnic"),
          o("Passeggiata serale con musica live", "Evening stroll with live music"),
          o("Visita a Pompei o Ercolano", "Visit to Pompeii or Herculaneum"),
        ],
      },
    ],
  },
  {
    id: "gran_finale",
    icon: "🍰",
    titleIt: "Il Gran Finale",
    titleEn: "The Grand Finale",
    subtitleIt: "Torta, ringraziamenti e viaggio di nozze.",
    subtitleEn: "Cake, thank-yous and honeymoon.",
    fields: [
      {
        name: "dolce_finale",
        type: "checkbox",
        labelIt: "Il dolce finale",
        labelEn: "The final sweet",
        options: [
          o("Classica, in panna, a tre piani decorata con fiori freschi", "Classic, cream-filled, three tiers decorated with fresh flowers"),
          o("Naked cake con frutta e dettagli naturali", "Naked cake with fruit and natural details"),
          o("Moderna decorata con pasta di zucchero", "Modern, decorated with fondant"),
          o("Monoporzione per ogni ospite", "Individual portion for each guest"),
          o("Taglio torta con musica dedicata (avviene sempre)", "Cake cutting with dedicated music (always included)"),
          o("Fontana di cioccolato", "Chocolate fountain"),
          o("Angolo graffette o zeppoline", "Graffette or zeppoline corner"),
          o("Corner gelato artigianale", "Artisanal ice cream corner"),
          o("Sweet table con dolci napoletani", "Sweet table with Neapolitan pastries"),
        ],
      },
      {
        name: "pensiero_ringraziamento",
        type: "radio",
        labelIt: "Pensiero di ringraziamento",
        labelEn: "Thank-you gift",
        options: [
          o("Artigianale o handmade", "Artisanal or handmade"),
          o("Gastronomica (olio, miele, confetture...)", "Gourmet (oil, honey, jams...)"),
          o("Botanica (piantine, semi...)", "Botanical (seedlings, seeds...)"),
          o("Solidale con valore sociale", "Charitable with social value"),
          o("Personalizzata con nomi o simboli", "Personalised with names or symbols"),
          o("Coordinata alla palette dell'evento", "Coordinated with the event palette"),
          o("Con packaging sostenibile", "With sustainable packaging"),
          o("Cadeau testimoni personalizzati", "Personalised witnesses' gifts"),
        ],
      },
      {
        name: "viaggio_di_nozze",
        type: "checkbox",
        labelIt: "Viaggio di nozze",
        labelEn: "Honeymoon",
        options: [
          o("Una meta culturale", "A cultural destination"),
          o("Un paradiso tropicale", "A tropical paradise"),
          o("Un tour tra più città", "A multi-city tour"),
          o("Un'esperienza avventurosa", "An adventurous experience"),
          o("Un viaggio all'insegna del relax", "A purely relaxing trip"),
          o("Con amici/famiglia (mini-luna di miele)", "With friends/family (mini honeymoon)"),
          o("Un viaggio solidale o responsabile", "A responsible or volunteer trip"),
        ],
      },
    ],
  },
];

/** Elenco piatto dei campi (ordine ufficiale JetFormBuilder). */
export const WEDDING_DIARY_FIELDS: WeddingDiaryField[] = WEDDING_DIARY_SECTIONS.flatMap(
  (section) => section.fields
);

export const WEDDING_DIARY_FIELD_COUNT = WEDDING_DIARY_FIELDS.length;

/** Un campo è considerato compilato se ha un valore non vuoto. */
export function isDiaryFieldFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.filter((v) => `${v}`.trim().length > 0).length > 0;
  return true;
}

/**
 * Percentuale di completamento del Wedding Diary (0-100),
 * calcolata sui campi chiave ufficiali compilati.
 */
export function computeDiaryProgress(answers: Record<string, any> | null | undefined): number {
  if (!answers) return 0;
  const filled = WEDDING_DIARY_FIELDS.filter((field) => isDiaryFieldFilled(answers[field.name])).length;
  if (WEDDING_DIARY_FIELD_COUNT === 0) return 0;
  return Math.round((filled / WEDDING_DIARY_FIELD_COUNT) * 100);
}
