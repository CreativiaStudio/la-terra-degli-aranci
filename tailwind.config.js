/** @type {import('tailwindcss').Config} */
// I colori della palette sono mappati su CSS variables (definite in src/index.css).
// V1 (estate/Amalfi) usa i valori :root originali; la V2 invernale ridefinisce
// le variabili sotto la classe `.theme-winter`, senza alterare la V1.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amalfi: {
          light: 'rgb(var(--tda-amalfi-light) / <alpha-value>)',
          base: 'rgb(var(--tda-amalfi-base) / <alpha-value>)',
          dark: 'rgb(var(--tda-amalfi-dark) / <alpha-value>)',
          shadow: 'rgb(var(--tda-amalfi-shadow) / <alpha-value>)',
          paper: 'rgb(var(--tda-amalfi-paper) / <alpha-value>)',
          card: 'rgb(var(--tda-amalfi-card) / <alpha-value>)',
          border: 'rgb(var(--tda-amalfi-border) / <alpha-value>)',
        },
        toile: {
          deep: 'rgb(var(--tda-toile-deep) / <alpha-value>)',
          slate: 'rgb(var(--tda-toile-slate) / <alpha-value>)',
          blue: 'rgb(var(--tda-toile-blue) / <alpha-value>)',
          porcelain: 'rgb(var(--tda-toile-porcelain) / <alpha-value>)',
          light: 'rgb(var(--tda-toile-light) / <alpha-value>)',
          wash: 'rgb(var(--tda-toile-wash) / <alpha-value>)',
        },
        gold: {
          foil: 'rgb(var(--tda-gold-foil) / <alpha-value>)',
          accent: 'rgb(var(--tda-gold-accent) / <alpha-value>)',
          dark: 'rgb(var(--tda-gold-dark) / <alpha-value>)',
          bronze: 'rgb(var(--tda-gold-bronze) / <alpha-value>)',
          champagne: 'rgb(var(--tda-gold-champagne) / <alpha-value>)',
        },
        wedding: {
          burgundy: 'rgb(var(--tda-wedding-burgundy) / <alpha-value>)',
          wax: 'rgb(var(--tda-wedding-wax) / <alpha-value>)',
          forest: 'rgb(var(--tda-wedding-forest) / <alpha-value>)',
          midnight: 'rgb(var(--tda-wedding-midnight) / <alpha-value>)',
          charcoal: 'rgb(var(--tda-wedding-charcoal) / <alpha-value>)',
        },
        // Call-to-action: V1 = charcoal/gold (identico all'originale),
        // V2 = velluto bordeaux con testo champagne e hover oro caldo.
        cta: {
          bg: 'rgb(var(--tda-cta-bg) / <alpha-value>)',
          text: 'rgb(var(--tda-cta-text) / <alpha-value>)',
          hover: 'rgb(var(--tda-cta-hover) / <alpha-value>)',
          hoverText: 'rgb(var(--tda-cta-hover-text) / <alpha-value>)',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        display: ['"Playfair Display"', 'serif'],
        script: ['"Pinyon Script"', '"Great Vibes"', 'cursive'],
        sans: ['"Montserrat"', 'sans-serif'],
      },
      boxShadow: {
        'deckled': '0 4px 20px -2px rgba(92, 130, 166, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.06)',
        'luxury': '0 20px 45px -15px rgba(27, 40, 56, 0.15), 0 0 0 1px rgba(197, 160, 89, 0.25)',
        'gold-glow': '0 0 25px rgba(197, 160, 89, 0.4)',
        'seal': '0 8px 24px rgba(122, 24, 40, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #DFBE79 0%, #C5A059 50%, #9A783E 100%)',
        'paper-gradient': 'linear-gradient(180deg, #FDFBF7 0%, #F7F3EB 100%)',
        'toile-gradient': 'linear-gradient(135deg, #E9EFF4 0%, #FAF7F2 100%)',
      }
    },
  },
  plugins: [],
};
