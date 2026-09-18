import React, { createContext, useContext, useMemo, useState } from 'react';

export type WeddingTheme = 'v1' | 'v2' | 'v3';

/**
 * Rileva la versione della partecipazione.
 *
 * La Versione Natalizia (V2 — bordeaux, oro, carta d'Amalfi, ceralacca bordeaux,
 * ghirlande e nevicata) è il DEFAULT ASSOLUTO, ufficialmente scelto dalla sposa:
 * con l'URL pulito https://www.laterradegliaranci.it/invito/francesca-e-ferdinando/
 * o in assenza di parametri, il tema attivo è SEMPRE 'v2'.
 *
 * Override tecnici (solo anteprime/debug, mai esposti agli invitati):
 * - V3 se il percorso URL contiene `/v3` oppure il query param `?v=3`
 * - V1 se il percorso URL contiene `/v1` oppure il query param `?v=1`
 */
export function detectWeddingTheme(): WeddingTheme {
  if (typeof window === 'undefined') return 'v2';
  try {
    const pathname = window.location.pathname || '';
    const search = window.location.search || '';
    const vParam = new URLSearchParams(search).get('v');
    if (pathname.includes('/v3') || vParam === '3') return 'v3';
    if (pathname.includes('/v1') || vParam === '1') return 'v1';
    return 'v2';
  } catch {
    return 'v2';
  }
}

interface WeddingThemeContextValue {
  theme: WeddingTheme;
  /** true solo per la V2 (Natale bordeaux). */
  isWinter: boolean;
  isV1: boolean;
  isV2: boolean;
  /** true solo per la V3 (Royal Midnight Winter Gala). */
  isV3: boolean;
  setTheme: (theme: WeddingTheme) => void;
}

const WeddingThemeContext = createContext<WeddingThemeContextValue>({
  // V2 Natale è la versione ufficiale: fallback coerente con detectWeddingTheme().
  theme: 'v2',
  isWinter: true,
  isV1: false,
  isV2: true,
  isV3: false,
  setTheme: () => {},
});

export const WeddingThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<WeddingTheme>(() => detectWeddingTheme());

  const setTheme = (newTheme: WeddingTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newTheme === 'v2') {
        // V2 Natale è il default assoluto: l'URL ufficiale resta pulito.
        url.searchParams.delete('v');
      } else {
        // V1 → ?v=1 · V3 → ?v=3 (solo override tecnici)
        url.searchParams.set('v', newTheme === 'v3' ? '3' : '1');
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  const value = useMemo<WeddingThemeContextValue>(
    () => ({
      theme,
      isWinter: theme === 'v2',
      isV1: theme === 'v1',
      isV2: theme === 'v2',
      isV3: theme === 'v3',
      setTheme,
    }),
    [theme]
  );

  return <WeddingThemeContext.Provider value={value}>{children}</WeddingThemeContext.Provider>;
};

export function useWeddingTheme(): WeddingThemeContextValue {
  return useContext(WeddingThemeContext);
}

/** Diciture dedicate all'atmosfera natalizia/invernale della V2. */
export const winterTexts = {
  heroEyebrow: "Matrimonio di Natale • Vigilia dell'Immacolata",
  heroInviteEyebrow: "Il Nostro Sogno di Natale",
  heroInviteTitle: 'Natale a La Terra degli Aranci',
  heroInviteMessage:
    "«Cari amici e familiari, abbiamo scelto La Terra degli Aranci per celebrare il nostro matrimonio nella sera più calda e magica dell'anno: la vigilia dell'Immacolata, all'inizio delle feste di Natale. Tra il profumo degli agrumi invernali, il calore del camino, le mille lucine dell'albero di Natale e i calici dorati con le persone che amiamo, la vostra presenza è il dono più prezioso.»",
  footerClaim: "Insieme per sempre • Magia di Natale",
  dressCodeNote:
    "Ispirata all'eleganza regale delle feste: velluto bordeaux, verde abete e bagliori d'oro zecchino.",
  simulatorLabel: "La Terra degli Aranci • Partecipazione di Natale (V2)",
  envelopeTagline: "Matrimonio di Natale • Vigilia dell'Immacolata",
} as const;

/** Diciture dedicate alla V3 — Royal Midnight Winter Gala (notte stellata & oro zecchino). */
export const midnightTexts = {
  heroEyebrow: 'Royal Midnight Winter Gala • Vigilia dell\u2019Immacolata',
  heroInviteEyebrow: 'La Nostra Notte di Gala',
  heroInviteTitle: 'Una Notte di Stelle a La Terra degli Aranci',
  footerClaim: 'Insieme per sempre • Notte di Gala',
  dressCodeNote:
    'Black tie sotto le stelle: blu notte, zaffiro, argento e bagliori d\u2019oro zecchino.',
  simulatorLabel: 'La Terra degli Aranci • Partecipazione Midnight Gala (V3)',
  envelopeTagline: 'Royal Midnight Winter Gala • Vigilia dell\u2019Immacolata',
} as const;

export default WeddingThemeContext;
