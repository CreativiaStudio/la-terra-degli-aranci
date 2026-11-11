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
    { id: 1, title: "Slide 1", imageUrl: "/presentazioni/tda-2026-en/slide_01.png" },
    { id: 2, title: "Slide 2", imageUrl: "/presentazioni/tda-2026-en/slide_02.png" },
    { id: 3, title: "Slide 3", imageUrl: "/presentazioni/tda-2026-en/slide_03.png" },
    { id: 4, title: "Slide 4", imageUrl: "/presentazioni/tda-2026-en/slide_04.png" },
    { id: 5, title: "Slide 5", imageUrl: "/presentazioni/tda-2026-en/slide_05.png" },
    { id: 6, title: "Slide 6", imageUrl: "/presentazioni/tda-2026-en/slide_06.png" },
    { id: 7, title: "Slide 7", imageUrl: "/presentazioni/tda-2026-en/slide_07.png" },
    { id: 8, title: "Slide 8", imageUrl: "/presentazioni/tda-2026-en/slide_08.png" },
    { id: 9, title: "Slide 9", imageUrl: "/presentazioni/tda-2026-en/slide_09.png" },
    { id: 10, title: "Slide 10", imageUrl: "/presentazioni/tda-2026-en/slide_10.png" },
    { id: 11, title: "Slide 11", imageUrl: "/presentazioni/tda-2026-en/slide_11.png" },
    { id: 12, title: "Slide 12", imageUrl: "/presentazioni/tda-2026-en/slide_12.png" },
    { id: 13, title: "Slide 13", imageUrl: "/presentazioni/tda-2026-en/slide_13.png" },
    { id: 14, title: "Slide 14", imageUrl: "/presentazioni/tda-2026-en/slide_14.png" },
    { id: 15, title: "Slide 15", imageUrl: "/presentazioni/tda-2026-en/slide_15.png" },
    { id: 16, title: "Slide 16", imageUrl: "/presentazioni/tda-2026-en/slide_16.png" },
    { id: 17, title: "Slide 17", imageUrl: "/presentazioni/tda-2026-en/slide_17.png" },
    { id: 18, title: "Slide 18", imageUrl: "/presentazioni/tda-2026-en/slide_18.png" },
    { id: 19, title: "Slide 19", imageUrl: "/presentazioni/tda-2026-en/slide_19.png" }
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
  coverImage: "/presentazioni/wedding-it/slide_01.png",
  totalSlides: 19,
  createdAt: "2026-01-01T00:00:00.000Z",
  slides: [
    { id: 1, title: "Slide 1", imageUrl: "/presentazioni/wedding-it/slide_01.png" },
    { id: 2, title: "Slide 2", imageUrl: "/presentazioni/wedding-it/slide_02.png" },
    { id: 3, title: "Slide 3", imageUrl: "/presentazioni/wedding-it/slide_03.png" },
    { id: 4, title: "Slide 4", imageUrl: "/presentazioni/wedding-it/slide_04.png" },
    { id: 5, title: "Slide 5", imageUrl: "/presentazioni/wedding-it/slide_05.png" },
    { id: 6, title: "Slide 6", imageUrl: "/presentazioni/wedding-it/slide_06.png" },
    { id: 7, title: "Slide 7", imageUrl: "/presentazioni/wedding-it/slide_07.png" },
    { id: 8, title: "Slide 8", imageUrl: "/presentazioni/wedding-it/slide_08.png" },
    { id: 9, title: "Slide 9", imageUrl: "/presentazioni/wedding-it/slide_09.png" },
    { id: 10, title: "Slide 10", imageUrl: "/presentazioni/wedding-it/slide_10.png" },
    { id: 11, title: "Slide 11", imageUrl: "/presentazioni/wedding-it/slide_11.png" },
    { id: 12, title: "Slide 12", imageUrl: "/presentazioni/wedding-it/slide_12.png" },
    { id: 13, title: "Slide 13", imageUrl: "/presentazioni/wedding-it/slide_13.png" },
    { id: 14, title: "Slide 14", imageUrl: "/presentazioni/wedding-it/slide_14.png" },
    { id: 15, title: "Slide 15", imageUrl: "/presentazioni/wedding-it/slide_15.png" },
    { id: 16, title: "Slide 16", imageUrl: "/presentazioni/wedding-it/slide_16.png" },
    { id: 17, title: "Slide 17", imageUrl: "/presentazioni/wedding-it/slide_17.png" },
    { id: 18, title: "Slide 18", imageUrl: "/presentazioni/wedding-it/slide_18.png" },
    { id: 19, title: "Slide 19", imageUrl: "/presentazioni/wedding-it/slide_19.png" }
  ],
};

const presentationAziendale: Presentation = {
  slug: "aziendale",
  title: "Presentazione Corporate & Meeting",
  subtitle: "Eventi aziendali, cene di gala ed esperienze esclusive immersi nel verde",
  description:
    "Presentazione dedicata ad aziende e professionisti: spazi versatili, dotazioni tecniche, sale per meeting e ricevimenti aziendali con somministrazione d'eccellenza.",
  badge: "Corporate • Aziende",
  category: "Corporate",
  coverImage: "/presentazioni/aziendale/slide_01.png",
  totalSlides: 25,
  createdAt: "2026-01-01T00:00:00.000Z",
  slides: [
    { id: 1, title: "Slide 1", imageUrl: "/presentazioni/aziendale/slide_01.png" },
    { id: 2, title: "Slide 2", imageUrl: "/presentazioni/aziendale/slide_02.png" },
    { id: 3, title: "Slide 3", imageUrl: "/presentazioni/aziendale/slide_03.png" },
    { id: 4, title: "Slide 4", imageUrl: "/presentazioni/aziendale/slide_04.png" },
    { id: 5, title: "Slide 5", imageUrl: "/presentazioni/aziendale/slide_05.png" },
    { id: 6, title: "Slide 6", imageUrl: "/presentazioni/aziendale/slide_06.png" },
    { id: 7, title: "Slide 7", imageUrl: "/presentazioni/aziendale/slide_07.png" },
    { id: 8, title: "Slide 8", imageUrl: "/presentazioni/aziendale/slide_08.png" },
    { id: 9, title: "Slide 9", imageUrl: "/presentazioni/aziendale/slide_09.png" },
    { id: 10, title: "Slide 10", imageUrl: "/presentazioni/aziendale/slide_10.png" },
    { id: 11, title: "Slide 11", imageUrl: "/presentazioni/aziendale/slide_11.png" },
    { id: 12, title: "Slide 12", imageUrl: "/presentazioni/aziendale/slide_12.png" },
    { id: 13, title: "Slide 13", imageUrl: "/presentazioni/aziendale/slide_13.png" },
    { id: 14, title: "Slide 14", imageUrl: "/presentazioni/aziendale/slide_14.png" },
    { id: 15, title: "Slide 15", imageUrl: "/presentazioni/aziendale/slide_15.png" },
    { id: 16, title: "Slide 16", imageUrl: "/presentazioni/aziendale/slide_16.png" },
    { id: 17, title: "Slide 17", imageUrl: "/presentazioni/aziendale/slide_17.png" },
    { id: 18, title: "Slide 18", imageUrl: "/presentazioni/aziendale/slide_18.png" },
    { id: 19, title: "Slide 19", imageUrl: "/presentazioni/aziendale/slide_19.png" },
    { id: 20, title: "Slide 20", imageUrl: "/presentazioni/aziendale/slide_20.png" },
    { id: 21, title: "Slide 21", imageUrl: "/presentazioni/aziendale/slide_21.png" },
    { id: 22, title: "Slide 22", imageUrl: "/presentazioni/aziendale/slide_22.png" },
    { id: 23, title: "Slide 23", imageUrl: "/presentazioni/aziendale/slide_23.png" },
    { id: 24, title: "Slide 24", imageUrl: "/presentazioni/aziendale/slide_24.png" },
    { id: 25, title: "Slide 25", imageUrl: "/presentazioni/aziendale/slide_25.png" }
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
  coverImage: "/presentazioni/love-tales/slide_01.png",
  totalSlides: 98,
  createdAt: "2026-01-01T00:00:00.000Z",
  slides: [
    { id: 1, title: "Pagina 1", imageUrl: "/presentazioni/love-tales/slide_01.png" },
    { id: 2, title: "Pagina 2", imageUrl: "/presentazioni/love-tales/slide_02.png" },
    { id: 3, title: "Pagina 3", imageUrl: "/presentazioni/love-tales/slide_03.png" },
    { id: 4, title: "Pagina 4", imageUrl: "/presentazioni/love-tales/slide_04.png" },
    { id: 5, title: "Pagina 5", imageUrl: "/presentazioni/love-tales/slide_05.png" },
    { id: 6, title: "Pagina 6", imageUrl: "/presentazioni/love-tales/slide_06.png" },
    { id: 7, title: "Pagina 7", imageUrl: "/presentazioni/love-tales/slide_07.png" },
    { id: 8, title: "Pagina 8", imageUrl: "/presentazioni/love-tales/slide_08.png" },
    { id: 9, title: "Pagina 9", imageUrl: "/presentazioni/love-tales/slide_09.png" },
    { id: 10, title: "Pagina 10", imageUrl: "/presentazioni/love-tales/slide_10.png" },
    { id: 11, title: "Pagina 11", imageUrl: "/presentazioni/love-tales/slide_11.png" },
    { id: 12, title: "Pagina 12", imageUrl: "/presentazioni/love-tales/slide_12.png" },
    { id: 13, title: "Pagina 13", imageUrl: "/presentazioni/love-tales/slide_13.png" },
    { id: 14, title: "Pagina 14", imageUrl: "/presentazioni/love-tales/slide_14.png" },
    { id: 15, title: "Pagina 15", imageUrl: "/presentazioni/love-tales/slide_15.png" },
    { id: 16, title: "Pagina 16", imageUrl: "/presentazioni/love-tales/slide_16.png" },
    { id: 17, title: "Pagina 17", imageUrl: "/presentazioni/love-tales/slide_17.png" },
    { id: 18, title: "Pagina 18", imageUrl: "/presentazioni/love-tales/slide_18.png" },
    { id: 19, title: "Pagina 19", imageUrl: "/presentazioni/love-tales/slide_19.png" },
    { id: 20, title: "Pagina 20", imageUrl: "/presentazioni/love-tales/slide_20.png" },
    { id: 21, title: "Pagina 21", imageUrl: "/presentazioni/love-tales/slide_21.png" },
    { id: 22, title: "Pagina 22", imageUrl: "/presentazioni/love-tales/slide_22.png" },
    { id: 23, title: "Pagina 23", imageUrl: "/presentazioni/love-tales/slide_23.png" },
    { id: 24, title: "Pagina 24", imageUrl: "/presentazioni/love-tales/slide_24.png" },
    { id: 25, title: "Pagina 25", imageUrl: "/presentazioni/love-tales/slide_25.png" },
    { id: 26, title: "Pagina 26", imageUrl: "/presentazioni/love-tales/slide_26.png" },
    { id: 27, title: "Pagina 27", imageUrl: "/presentazioni/love-tales/slide_27.png" },
    { id: 28, title: "Pagina 28", imageUrl: "/presentazioni/love-tales/slide_28.png" },
    { id: 29, title: "Pagina 29", imageUrl: "/presentazioni/love-tales/slide_29.png" },
    { id: 30, title: "Pagina 30", imageUrl: "/presentazioni/love-tales/slide_30.png" },
    { id: 31, title: "Pagina 31", imageUrl: "/presentazioni/love-tales/slide_31.png" },
    { id: 32, title: "Pagina 32", imageUrl: "/presentazioni/love-tales/slide_32.png" },
    { id: 33, title: "Pagina 33", imageUrl: "/presentazioni/love-tales/slide_33.png" },
    { id: 34, title: "Pagina 34", imageUrl: "/presentazioni/love-tales/slide_34.png" },
    { id: 35, title: "Pagina 35", imageUrl: "/presentazioni/love-tales/slide_35.png" },
    { id: 36, title: "Pagina 36", imageUrl: "/presentazioni/love-tales/slide_36.png" },
    { id: 37, title: "Pagina 37", imageUrl: "/presentazioni/love-tales/slide_37.png" },
    { id: 38, title: "Pagina 38", imageUrl: "/presentazioni/love-tales/slide_38.png" },
    { id: 39, title: "Pagina 39", imageUrl: "/presentazioni/love-tales/slide_39.png" },
    { id: 40, title: "Pagina 40", imageUrl: "/presentazioni/love-tales/slide_40.png" },
    { id: 41, title: "Pagina 41", imageUrl: "/presentazioni/love-tales/slide_41.png" },
    { id: 42, title: "Pagina 42", imageUrl: "/presentazioni/love-tales/slide_42.png" },
    { id: 43, title: "Pagina 43", imageUrl: "/presentazioni/love-tales/slide_43.png" },
    { id: 44, title: "Pagina 44", imageUrl: "/presentazioni/love-tales/slide_44.png" },
    { id: 45, title: "Pagina 45", imageUrl: "/presentazioni/love-tales/slide_45.png" },
    { id: 46, title: "Pagina 46", imageUrl: "/presentazioni/love-tales/slide_46.png" },
    { id: 47, title: "Pagina 47", imageUrl: "/presentazioni/love-tales/slide_47.png" },
    { id: 48, title: "Pagina 48", imageUrl: "/presentazioni/love-tales/slide_48.png" },
    { id: 49, title: "Pagina 49", imageUrl: "/presentazioni/love-tales/slide_49.png" },
    { id: 50, title: "Pagina 50", imageUrl: "/presentazioni/love-tales/slide_50.png" },
    { id: 51, title: "Pagina 51", imageUrl: "/presentazioni/love-tales/slide_51.png" },
    { id: 52, title: "Pagina 52", imageUrl: "/presentazioni/love-tales/slide_52.png" },
    { id: 53, title: "Pagina 53", imageUrl: "/presentazioni/love-tales/slide_53.png" },
    { id: 54, title: "Pagina 54", imageUrl: "/presentazioni/love-tales/slide_54.png" },
    { id: 55, title: "Pagina 55", imageUrl: "/presentazioni/love-tales/slide_55.png" },
    { id: 56, title: "Pagina 56", imageUrl: "/presentazioni/love-tales/slide_56.png" },
    { id: 57, title: "Pagina 57", imageUrl: "/presentazioni/love-tales/slide_57.png" },
    { id: 58, title: "Pagina 58", imageUrl: "/presentazioni/love-tales/slide_58.png" },
    { id: 59, title: "Pagina 59", imageUrl: "/presentazioni/love-tales/slide_59.png" },
    { id: 60, title: "Pagina 60", imageUrl: "/presentazioni/love-tales/slide_60.png" },
    { id: 61, title: "Pagina 61", imageUrl: "/presentazioni/love-tales/slide_61.png" },
    { id: 62, title: "Pagina 62", imageUrl: "/presentazioni/love-tales/slide_62.png" },
    { id: 63, title: "Pagina 63", imageUrl: "/presentazioni/love-tales/slide_63.png" },
    { id: 64, title: "Pagina 64", imageUrl: "/presentazioni/love-tales/slide_64.png" },
    { id: 65, title: "Pagina 65", imageUrl: "/presentazioni/love-tales/slide_65.png" },
    { id: 66, title: "Pagina 66", imageUrl: "/presentazioni/love-tales/slide_66.png" },
    { id: 67, title: "Pagina 67", imageUrl: "/presentazioni/love-tales/slide_67.png" },
    { id: 68, title: "Pagina 68", imageUrl: "/presentazioni/love-tales/slide_68.png" },
    { id: 69, title: "Pagina 69", imageUrl: "/presentazioni/love-tales/slide_69.png" },
    { id: 70, title: "Pagina 70", imageUrl: "/presentazioni/love-tales/slide_70.png" },
    { id: 71, title: "Pagina 71", imageUrl: "/presentazioni/love-tales/slide_71.png" },
    { id: 72, title: "Pagina 72", imageUrl: "/presentazioni/love-tales/slide_72.png" },
    { id: 73, title: "Pagina 73", imageUrl: "/presentazioni/love-tales/slide_73.png" },
    { id: 74, title: "Pagina 74", imageUrl: "/presentazioni/love-tales/slide_74.png" },
    { id: 75, title: "Pagina 75", imageUrl: "/presentazioni/love-tales/slide_75.png" },
    { id: 76, title: "Pagina 76", imageUrl: "/presentazioni/love-tales/slide_76.png" },
    { id: 77, title: "Pagina 77", imageUrl: "/presentazioni/love-tales/slide_77.png" },
    { id: 78, title: "Pagina 78", imageUrl: "/presentazioni/love-tales/slide_78.png" },
    { id: 79, title: "Pagina 79", imageUrl: "/presentazioni/love-tales/slide_79.png" },
    { id: 80, title: "Pagina 80", imageUrl: "/presentazioni/love-tales/slide_80.png" },
    { id: 81, title: "Pagina 81", imageUrl: "/presentazioni/love-tales/slide_81.png" },
    { id: 82, title: "Pagina 82", imageUrl: "/presentazioni/love-tales/slide_82.png" },
    { id: 83, title: "Pagina 83", imageUrl: "/presentazioni/love-tales/slide_83.png" },
    { id: 84, title: "Pagina 84", imageUrl: "/presentazioni/love-tales/slide_84.png" },
    { id: 85, title: "Pagina 85", imageUrl: "/presentazioni/love-tales/slide_85.png" },
    { id: 86, title: "Pagina 86", imageUrl: "/presentazioni/love-tales/slide_86.png" },
    { id: 87, title: "Pagina 87", imageUrl: "/presentazioni/love-tales/slide_87.png" },
    { id: 88, title: "Pagina 88", imageUrl: "/presentazioni/love-tales/slide_88.png" },
    { id: 89, title: "Pagina 89", imageUrl: "/presentazioni/love-tales/slide_89.png" },
    { id: 90, title: "Pagina 90", imageUrl: "/presentazioni/love-tales/slide_90.png" },
    { id: 91, title: "Pagina 91", imageUrl: "/presentazioni/love-tales/slide_91.png" },
    { id: 92, title: "Pagina 92", imageUrl: "/presentazioni/love-tales/slide_92.png" },
    { id: 93, title: "Pagina 93", imageUrl: "/presentazioni/love-tales/slide_93.png" },
    { id: 94, title: "Pagina 94", imageUrl: "/presentazioni/love-tales/slide_94.png" },
    { id: 95, title: "Pagina 95", imageUrl: "/presentazioni/love-tales/slide_95.png" },
    { id: 96, title: "Pagina 96", imageUrl: "/presentazioni/love-tales/slide_96.png" },
    { id: 97, title: "Pagina 97", imageUrl: "/presentazioni/love-tales/slide_97.png" },
    { id: 98, title: "Pagina 98", imageUrl: "/presentazioni/love-tales/slide_98.png" }
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
