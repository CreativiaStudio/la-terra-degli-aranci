import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const PRESENTATIONS = [
  {
    fileName: "og-presentazioni.jpg",
    badge: "PRESENTAZIONI UFFICIALI",
    title: "La Terra degli Aranci",
    subtitle: "Wedding 2026 • Corporate &amp; Meeting • Love Tales",
  },
  {
    fileName: "og-wedding-it.jpg",
    badge: "PRESENTAZIONE NOZZE 2026",
    title: "Nozze a La Terra degli Aranci",
    subtitle: "Un giardino di emozioni tra Posillipo e il Vomero",
  },
  {
    fileName: "og-tda-2026-en.jpg",
    badge: "WEDDING PRESENTATION 2026",
    title: "La Terra degli Aranci",
    subtitle: "An enchanted place overlooking the Gulf of Naples",
  },
  {
    fileName: "og-aziendale.jpg",
    badge: "CORPORATE &amp; MEETING",
    title: "Eventi Aziendali &amp; Gala",
    subtitle: "Meeting esclusivi ed esperienze immerse nel verde botanico",
  },
  {
    fileName: "og-love-tales.jpg",
    badge: "ALBUM DIGITALE • REPORTAGE",
    title: "Love Tales • Gallery",
    subtitle: "Storie di nozze, momenti autentici e ricordi in tenuta",
  },
];

async function createAllCards() {
  const width = 1200;
  const height = 630;

  const logoBuf = await sharp(path.join(rootDir, "public", "tda-simbolo.png"))
    .resize(250, 250, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  for (const item of PRESENTATIONS) {
    const svgOverlay = Buffer.from(`
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Cornice dorata elegante -->
        <rect x="30" y="30" width="1140" height="570" rx="20" fill="none" stroke="#C5A059" stroke-width="1.8" opacity="0.4" />
        <rect x="42" y="42" width="1116" height="546" rx="14" fill="none" stroke="#C5A059" stroke-width="0.8" opacity="0.2" />

        <!-- Badge Categoria -->
        <rect x="420" y="365" width="360" height="36" rx="18" fill="#C5A059" fill-opacity="0.18" stroke="#C5A059" stroke-width="1.2" />
        <text x="600" y="388" font-family="'Georgia', serif" font-size="12" font-weight="bold" fill="#8C6A28" text-anchor="middle" letter-spacing="3">${item.badge}</text>

        <!-- Titolo Principale -->
        <text x="600" y="455" font-family="'Georgia', serif" font-size="44" font-weight="normal" fill="#242220" text-anchor="middle" letter-spacing="-0.5">${item.title}</text>

        <!-- Payoff -->
        <text x="600" y="495" font-family="sans-serif" font-size="14" font-weight="600" fill="#8C6A28" text-anchor="middle" letter-spacing="4">UN GIARDINO DI EMOZIONI • NAPOLI</text>

        <!-- Dettaglio Subtitle -->
        <text x="600" y="542" font-family="sans-serif" font-size="15" fill="#66625B" text-anchor="middle" letter-spacing="0.5">${item.subtitle}</text>
      </svg>
    `);

    const card = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: "#EFEAE1",
      },
    })
      .composite([
        {
          input: logoBuf,
          top: 95,
          left: Math.round((width - 250) / 2),
        },
        {
          input: svgOverlay,
          top: 0,
          left: 0,
        },
      ])
      .jpeg({ quality: 92 })
      .toBuffer();

    const outPath = path.join(rootDir, "public", item.fileName);
    fs.writeFileSync(outPath, card);
    console.log(`✅ ${item.fileName} creato (${(card.length / 1024).toFixed(1)} KB)`);
  }
}

createAllCards().catch(console.error);
