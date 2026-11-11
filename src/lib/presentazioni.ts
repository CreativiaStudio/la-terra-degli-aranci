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

const presentation2026En: Presentation = {
  slug: "tda-presentation-2026-en",
  title: "Wedding Presentation 2026 (English)",
  subtitle: "An enchanted place overlooking the Gulf of Naples",
  description:
    "Official presentation in English: Venue & spaces, Giardino degli Agrumi, Giardino Mediterraneo, Sala Tufo, Sala Bianca, cuisine and bespoke wedding services.",
  badge: "Wedding • English",
  category: "Wedding",
  coverImage: "/presentazioni/tda-2026-en/slide_01.png",
  totalSlides: 19,
  createdAt: "2026-01-01T00:00:00.000Z",
  slides: [
    {
      id: 1,
      title: "Cover: Un Giardino di Emozioni - Presentation 2026",
      imageUrl: "/presentazioni/tda-2026-en/slide_01.png",
    },
    {
      id: 2,
      title: "Introduction: An enchanted place overlooking the Gulf of Naples",
      imageUrl: "/presentazioni/tda-2026-en/slide_02.png",
    },
    {
      id: 3,
      title: "The Venue and Spaces: Capacity, Gardens, Indoor Rooms, Citrus Grove",
      imageUrl: "/presentazioni/tda-2026-en/slide_03.png",
    },
    {
      id: 4,
      title: "Giardino degli Agrumi",
      imageUrl: "/presentazioni/tda-2026-en/slide_04.png",
    },
    {
      id: 5,
      title: "Giardino Mediterraneo",
      imageUrl: "/presentazioni/tda-2026-en/slide_05.png",
    },
    {
      id: 6,
      title: "Sala Tufo & Giardino d'Inverno",
      imageUrl: "/presentazioni/tda-2026-en/slide_06.png",
    },
    {
      id: 7,
      title: "Sala Bianca",
      imageUrl: "/presentazioni/tda-2026-en/slide_07.png",
    },
    {
      id: 8,
      title: "Organisational Details: Haute Cuisine & Gourmet Finger Food",
      imageUrl: "/presentazioni/tda-2026-en/slide_08.png",
    },
    {
      id: 9,
      title:
        "Food Proposals: Mandarancio, Cedro, Arancio, Pompelmo & Bespoke Services",
      imageUrl: "/presentazioni/tda-2026-en/slide_09.png",
    },
    {
      id: 10,
      title:
        "Service Offering: Cuisine, Decorations, Coordination, Music, Guest Accommodation",
      imageUrl: "/presentazioni/tda-2026-en/slide_10.png",
    },
    {
      id: 11,
      title:
        "Service Offering (Part 2): Ceremony, After Party, Garden Dinner, Tasting Corners",
      imageUrl: "/presentazioni/tda-2026-en/slide_11.png",
    },
    {
      id: 12,
      title: "What They Say About Us: Reviews & Testimonials",
      imageUrl: "/presentazioni/tda-2026-en/slide_12.png",
    },
    {
      id: 13,
      title: "Wedding Stories (Story 1)",
      imageUrl: "/presentazioni/tda-2026-en/slide_13.png",
    },
    {
      id: 14,
      title: "Wedding Stories (Story 2)",
      imageUrl: "/presentazioni/tda-2026-en/slide_14.png",
    },
    {
      id: 15,
      title: "Wedding Stories (Story 3)",
      imageUrl: "/presentazioni/tda-2026-en/slide_15.png",
    },
    {
      id: 16,
      title: "Wedding Stories (Story 4)",
      imageUrl: "/presentazioni/tda-2026-en/slide_16.png",
    },
    {
      id: 17,
      title: "Wedding Stories (Story 5)",
      imageUrl: "/presentazioni/tda-2026-en/slide_17.png",
    },
    {
      id: 18,
      title: "Wedding Stories (Story 6)",
      imageUrl: "/presentazioni/tda-2026-en/slide_18.png",
    },
    {
      id: 19,
      title: "Contact Us: Appointments, WhatsApp & Digital Album",
      imageUrl: "/presentazioni/tda-2026-en/slide_19.png",
    },
  ],
};

const presentationWeddingIt: Presentation = {
  slug: "wedding-it",
  title: "Presentazione Nozze 2026 (Italiano)",
  subtitle: "Un giardino di emozioni tra Posillipo e il Vomero",
  description:
    "Presentazione ufficiale nozze in italiano: spazi interni ed esterni, i giardini botanici, le sale storiche, la cucina d'autore e i servizi personalizzati per il ricevimento.",
  badge: "Wedding • Italiano",
  category: "Wedding",
  coverImage: "/presentazioni/tda-2026-en/slide_02.png",
  totalSlides: 19,
  createdAt: "2026-01-01T00:00:00.000Z",
  slides: [
    {
      id: 1,
      title: "Copertina: Un Giardino di Emozioni — Presentazione 2026",
      imageUrl: "/presentazioni/tda-2026-en/slide_01.png",
    },
    {
      id: 2,
      title: "Introduzione: Un giardino di emozioni tra Posillipo e il Vomero",
      imageUrl: "/presentazioni/tda-2026-en/slide_02.png",
    },
    {
      id: 3,
      title: "La Struttura e gli Spazi: Capienze, Giardini, Sale interne, Giardino degli Agrumi",
      imageUrl: "/presentazioni/tda-2026-en/slide_03.png",
    },
    {
      id: 4,
      title: "Giardino degli Agrumi",
      imageUrl: "/presentazioni/tda-2026-en/slide_04.png",
    },
    {
      id: 5,
      title: "Giardino Mediterraneo",
      imageUrl: "/presentazioni/tda-2026-en/slide_05.png",
    },
    {
      id: 6,
      title: "Sala Tufo e relativi giardini — Giardino d'Inverno",
      imageUrl: "/presentazioni/tda-2026-en/slide_06.png",
    },
    {
      id: 7,
      title: "Sala Bianca e relativi giardini",
      imageUrl: "/presentazioni/tda-2026-en/slide_07.png",
    },
    {
      id: 8,
      title: "Dettagli Organizzativi: Alta Cucina e Gourmet Finger Food",
      imageUrl: "/presentazioni/tda-2026-en/slide_08.png",
    },
    {
      id: 9,
      title:
        "Proposte Gastronomiche: Mandarancio, Cedro, Arancio, Pompelmo e servizi su misura",
      imageUrl: "/presentazioni/tda-2026-en/slide_09.png",
    },
    {
      id: 10,
      title:
        "Offerta di Servizio: Cucina, Allestimenti, Coordinamento, Musica, Pernottamento Ospiti",
      imageUrl: "/presentazioni/tda-2026-en/slide_10.png",
    },
    {
      id: 11,
      title:
        "Offerta di Servizio (parte 2): Cerimonia, After Party, Cena in Giardino, Tasting Corners",
      imageUrl: "/presentazioni/tda-2026-en/slide_11.png",
    },
    {
      id: 12,
      title: "Dicono di Noi: Recensioni e Testimonianze",
      imageUrl: "/presentazioni/tda-2026-en/slide_12.png",
    },
    {
      id: 13,
      title: "Storie di Nozze (Storia 1)",
      imageUrl: "/presentazioni/tda-2026-en/slide_13.png",
    },
    {
      id: 14,
      title: "Storie di Nozze (Storia 2)",
      imageUrl: "/presentazioni/tda-2026-en/slide_14.png",
    },
    {
      id: 15,
      title: "Storie di Nozze (Storia 3)",
      imageUrl: "/presentazioni/tda-2026-en/slide_15.png",
    },
    {
      id: 16,
      title: "Storie di Nozze (Storia 4)",
      imageUrl: "/presentazioni/tda-2026-en/slide_16.png",
    },
    {
      id: 17,
      title: "Storie di Nozze (Storia 5)",
      imageUrl: "/presentazioni/tda-2026-en/slide_17.png",
    },
    {
      id: 18,
      title: "Storie di Nozze (Storia 6)",
      imageUrl: "/presentazioni/tda-2026-en/slide_18.png",
    },
    {
      id: 19,
      title: "Contattaci: Appuntamenti, WhatsApp e Album Digitale",
      imageUrl: "/presentazioni/tda-2026-en/slide_19.png",
    },
  ],
};

const presentationAziendale: Presentation = {
  slug: "aziendale",
  title: "Presentazione Corporate & Meeting",
  subtitle:
    "Eventi aziendali, cene di gala ed esperienze esclusive immersi nel verde",
  description:
    "Presentazione dedicata ad aziende e professionisti: spazi versatili, dotazioni tecniche, sale per meeting e ricevimenti aziendali con somministrazione d'eccellenza.",
  badge: "Corporate • Aziende",
  category: "Corporate",
  coverImage: "/presentazioni/tda-2026-en/slide_06.png",
  totalSlides: 10,
  createdAt: "2026-01-01T00:00:00.000Z",
  slides: [
    {
      id: 1,
      title: "Copertina: Presentazione Corporate & Meeting",
      imageUrl: "/presentazioni/tda-2026-en/slide_01.png",
    },
    {
      id: 2,
      title: "Benvenuto: Eventi aziendali ed esperienze esclusive immersi nel verde",
      imageUrl: "/presentazioni/tda-2026-en/slide_02.png",
    },
    {
      id: 3,
      title: "Panoramica Spazi: Capienze, Giardini e Sale interne",
      imageUrl: "/presentazioni/tda-2026-en/slide_03.png",
    },
    {
      id: 4,
      title: "Giardino degli Agrumi: aperitivi e coffee break all'aperto",
      imageUrl: "/presentazioni/tda-2026-en/slide_04.png",
    },
    {
      id: 5,
      title: "Giardino Mediterraneo",
      imageUrl: "/presentazioni/tda-2026-en/slide_05.png",
    },
    {
      id: 6,
      title: "Sala Tufo e relativi giardini: meeting, cene di gala e premiazioni",
      imageUrl: "/presentazioni/tda-2026-en/slide_06.png",
    },
    {
      id: 7,
      title: "Sala Bianca e relativi giardini: ricevimenti aziendali esclusivi",
      imageUrl: "/presentazioni/tda-2026-en/slide_07.png",
    },
    {
      id: 8,
      title: "Gastronomia: Alta Cucina e Gourmet Finger Food in villa",
      imageUrl: "/presentazioni/tda-2026-en/slide_08.png",
    },
    {
      id: 9,
      title:
        "Servizi dedicati alle Aziende: Allestimenti, Coordinamento, Musica e Dotazioni Tecniche",
      imageUrl: "/presentazioni/tda-2026-en/slide_10.png",
    },
    {
      id: 10,
      title: "Contatti: richiedi il tuo preventivo aziendale",
      imageUrl: "/presentazioni/tda-2026-en/slide_19.png",
    },
  ],
};

const presentationLoveTales: Presentation = {
  slug: "love-tales",
  title: "Album Digitale: Love Tales",
  subtitle: "Storie di nozze, momenti autentici e reportage fotografici in villa",
  description:
    "Una raccolta fotografica emozionante con i momenti più belli vissuti dalle nostre coppie tra giardini secolari, tagli torta scenografici e feste sotto le stelle.",
  badge: "Love Tales • Gallery",
  category: "Gallery",
  coverImage: "/presentazioni/tda-2026-en/slide_13.png",
  totalSlides: 8,
  createdAt: "2026-01-01T00:00:00.000Z",
  slides: [
    {
      id: 1,
      title: "Copertina: Album Digitale — Love Tales",
      imageUrl: "/presentazioni/tda-2026-en/slide_01.png",
    },
    {
      id: 2,
      title: "Love Tale — Storia 1",
      imageUrl: "/presentazioni/tda-2026-en/slide_13.png",
    },
    {
      id: 3,
      title: "Love Tale — Storia 2",
      imageUrl: "/presentazioni/tda-2026-en/slide_14.png",
    },
    {
      id: 4,
      title: "Love Tale — Storia 3",
      imageUrl: "/presentazioni/tda-2026-en/slide_15.png",
    },
    {
      id: 5,
      title: "Love Tale — Storia 4",
      imageUrl: "/presentazioni/tda-2026-en/slide_16.png",
    },
    {
      id: 6,
      title: "Love Tale — Storia 5",
      imageUrl: "/presentazioni/tda-2026-en/slide_17.png",
    },
    {
      id: 7,
      title: "Love Tale — Storia 6",
      imageUrl: "/presentazioni/tda-2026-en/slide_18.png",
    },
    {
      id: 8,
      title: "Contattaci: racconta il tuo Love Tale",
      imageUrl: "/presentazioni/tda-2026-en/slide_19.png",
    },
  ],
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
