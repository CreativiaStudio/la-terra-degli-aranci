export interface PresentationSlide {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  description?: string;
}

export interface Presentation {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  badge?: string;
  category?: string;
  coverImage: string;
  totalSlides: number;
  createdAt: string;
  slides: PresentationSlide[];
}

export const R2_PRESENTAZIONI_BASE_URL =
  'https://pub-ace85c0d97114c1a980199bf8afb379b.r2.dev/presentazioni';

function buildSlides(
  folder: string,
  count: number,
  titlePrefix: string = 'Slide'
): PresentationSlide[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const fileName = `slide_${String(id).padStart(2, '0')}.webp`;
    return {
      id,
      title: `${titlePrefix} ${id}`,
      imageUrl: `${R2_PRESENTAZIONI_BASE_URL}/${folder}/${fileName}`,
    };
  });
}

const presentation2026En: Presentation = {
  slug: "tda-presentation-2026-en",
  title: "Wedding Presentation 2026 (English)",
  subtitle: "An enchanted place overlooking the Gulf of Naples",
  description:
    "Official presentation in English: Venue & spaces, Giardino degli Agrumi, Giardino Mediterraneo, Sala Tufo, Sala Bianca, cuisine and bespoke wedding services.",
  badge: "Wedding • English",
  category: "Wedding",
  coverImage: `${R2_PRESENTAZIONI_BASE_URL}/tda-2026-en/slide_01.webp`,
  totalSlides: 19,
  createdAt: "2026-01-01T00:00:00.000Z",
  slides: buildSlides("tda-2026-en", 19),
};

const presentationWeddingIt: Presentation = {
  slug: "wedding-it",
  title: "Presentazione Nozze 2026 (Italiano)",
  subtitle: "Un giardino di emozioni tra Posillipo e il Vomero",
  description:
    "Presentazione ufficiale nozze in italiano: spazi interni ed esterni, i giardini botanici, le sale storiche, la cucina d'autore e i servizi personalizzati per il ricevimento.",
  badge: "Wedding • Italiano",
  category: "Wedding",
  coverImage: `${R2_PRESENTAZIONI_BASE_URL}/wedding-it/slide_01.webp`,
  totalSlides: 19,
  createdAt: "2026-01-01T00:00:00.000Z",
  slides: buildSlides("wedding-it", 19),
};

const presentationAziendale: Presentation = {
  slug: "aziendale",
  title: "Presentazione Corporate & Meeting",
  subtitle: "Eventi aziendali, cene di gala ed esperienze esclusive immersi nel verde",
  description:
    "Presentazione dedicata ad aziende e professionisti: spazi versatili, dotazioni tecniche, sale per meeting e ricevimenti aziendali con somministrazione d'eccellenza.",
  badge: "Corporate • Aziende",
  category: "Corporate",
  coverImage: `${R2_PRESENTAZIONI_BASE_URL}/aziendale/slide_01.webp`,
  totalSlides: 25,
  createdAt: "2026-01-01T00:00:00.000Z",
  slides: buildSlides("aziendale", 25),
};

const presentationLoveTales: Presentation = {
  slug: "love-tales",
  title: "Album Digitale: Love Tales",
  subtitle: "Storie di nozze, momenti autentici e reportage fotografici in villa",
  description:
    "Una raccolta fotografica emozionante con i momenti più belli vissuti dalle nostre coppie tra giardini secolari, tagli torta scenografici e feste sotto le stelle.",
  badge: "Love Tales • Gallery",
  category: "Gallery",
  coverImage: `${R2_PRESENTAZIONI_BASE_URL}/love-tales/slide_01.webp`,
  totalSlides: 98,
  createdAt: "2026-01-01T00:00:00.000Z",
  slides: buildSlides("love-tales", 98, "Pagina"),
};

const presentations: Presentation[] = [
  presentation2026En,
  presentationWeddingIt,
  presentationAziendale,
  presentationLoveTales,
];

export function getAllPresentations(): Presentation[] {
  return presentations;
}

export function getPresentationBySlug(slug: string): Presentation | undefined {
  return presentations.find((presentation) => presentation.slug === slug);
}

export function getDefaultPresentation(): Presentation {
  return presentation2026En;
}
