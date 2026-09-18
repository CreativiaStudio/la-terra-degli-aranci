import { LoveWallPost } from '../types/lovewall';

export const initialLoveWallPosts: LoveWallPost[] = [
  {
    id: "post_seed_1",
    author: "Elena & Marco (Testimoni)",
    message: "Francesca e Ferdinando, vedervi insieme è pura ispirazione. Non vediamo l'ora di brindare con voi nella magia de La Terra degli Aranci!",
    iconEmoji: "🥂",
    createdAt: "2026-08-20T10:30:00.000Z",
    status: "approved",
    pinned: true,
    likesCount: 12,
  },
  {
    id: "post_seed_2",
    author: "Zia Carmela e Famiglia",
    message: "Tantissimi auguri di cuore ai nostri sposi meravigliosi. Che il vostro cammino insieme sia sempre illuminato da questa gioia immensa.",
    iconEmoji: "💍",
    createdAt: "2026-08-22T14:15:00.000Z",
    status: "approved",
    pinned: false,
    likesCount: 8,
  },
  {
    id: "post_seed_3",
    author: "Gli amici del Gruppo Storico",
    message: "Ferdi e Franci, preparatevi perché il 7 Dicembre la Sala Tufo tremerà! Siamo prontissimi per il DJ Set!",
    iconEmoji: "✨",
    createdAt: "2026-08-25T18:45:00.000Z",
    status: "approved",
    pinned: false,
    likesCount: 15,
  },
];
