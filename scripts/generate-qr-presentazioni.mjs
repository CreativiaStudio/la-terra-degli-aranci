import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..", "..");
const outDir = path.join(workspaceRoot, "Presentazioni_Kit_Stampa_QR");
const logoPath = path.resolve(__dirname, "..", "public", "tda-simbolo.png");

const ITEMS = [
  {
    id: "01_wedding_it",
    title: "Nozze 2026 (Italiano)",
    url: "https://ecosistema.laterradegliaranci.it/presentazioni/wedding-it?src=qr",
  },
  {
    id: "02_wedding_en",
    title: "Wedding 2026 (English)",
    url: "https://ecosistema.laterradegliaranci.it/presentazioni/tda-presentation-2026-en?src=qr",
  },
  {
    id: "03_aziendale",
    title: "Corporate & Meeting",
    url: "https://ecosistema.laterradegliaranci.it/presentazioni/aziendale?src=qr",
  },
  {
    id: "04_love_tales",
    title: "Album Love Tales",
    url: "https://ecosistema.laterradegliaranci.it/presentazioni/love-tales?src=qr",
  },
  {
    id: "00_hub_tutte_le_presentazioni",
    title: "Hub Tutte le Presentazioni",
    url: "https://ecosistema.laterradegliaranci.it/presentazioni?src=qr",
  },
];

const QR_OPTIONS = {
  errorCorrectionLevel: "H",
  margin: 2,
  color: {
    dark: "#1E1D1B",
    light: "#FFFFFF",
  },
};

const QR_SIZE = 1200;
const BADGE_SIZE = 276;
const BADGE_RX = 60;
const BADGE_STROKE = 4;
const LOGO_SIZE = 210;
const GOLD = "#C5A059";

async function loadLogo() {
  return sharp(logoPath).trim().png().toBuffer();
}

async function brandedQrPng(url, width, logo) {
  const scale = width / QR_SIZE;
  const badgeSize = Math.round(BADGE_SIZE * scale);
  const logoSize = Math.round(LOGO_SIZE * scale);
  const stroke = BADGE_STROKE * scale;
  const inset = stroke / 2;

  const qrBuf = await QRCode.toBuffer(url, {
    ...QR_OPTIONS,
    width,
  });

  const badgeSvg = Buffer.from(`
    <svg width="${badgeSize}" height="${badgeSize}" viewBox="0 0 ${badgeSize} ${badgeSize}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${inset}" y="${inset}" width="${badgeSize - stroke}" height="${badgeSize - stroke}" rx="${BADGE_RX * scale}" ry="${BADGE_RX * scale}" fill="#FFFFFF" stroke="${GOLD}" stroke-width="${stroke}" />
    </svg>
  `);

  const logoBuf = await sharp(logo)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const badgeOffset = Math.round((width - badgeSize) / 2);
  const logoOffset = Math.round((width - logoSize) / 2);

  return sharp(qrBuf)
    .composite([
      { input: badgeSvg, left: badgeOffset, top: badgeOffset },
      { input: logoBuf, left: logoOffset, top: logoOffset },
    ])
    .png()
    .toBuffer();
}

async function brandedQrSvg(url, logo) {
  const svgString = await QRCode.toString(url, {
    ...QR_OPTIONS,
    type: "svg",
    width: QR_SIZE,
  });

  const viewBoxMatch = svgString.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!viewBoxMatch) {
    throw new Error("viewBox non trovato nell'SVG generato dal QR");
  }
  const vbSize = Number(viewBoxMatch[1]);
  const scale = vbSize / QR_SIZE;

  const badgeSize = BADGE_SIZE * scale;
  const stroke = BADGE_STROKE * scale;
  const inset = stroke / 2;
  const badgeX = (vbSize - badgeSize) / 2;
  const logoSize = LOGO_SIZE * scale;
  const logoX = (vbSize - logoSize) / 2;
  const logoB64 = logo.toString("base64");

  const overlay = `
  <rect x="${badgeX + inset}" y="${badgeX + inset}" width="${badgeSize - stroke}" height="${badgeSize - stroke}" rx="${BADGE_RX * scale}" ry="${BADGE_RX * scale}" fill="#FFFFFF" stroke="${GOLD}" stroke-width="${stroke}" />
  <image x="${logoX}" y="${logoX}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${logoB64}" />
`;

  return svgString.replace("</svg>", `${overlay}</svg>`);
}

async function run() {
  fs.mkdirSync(outDir, { recursive: true });

  const logo = await loadLogo();

  for (const item of ITEMS) {
    // 1. PNG Alta Risoluzione (1200x1200 px, pronto per stampa 300 DPI)
    const pngPath = path.join(outDir, `${item.id}.png`);
    const pngBuf = await brandedQrPng(item.url, QR_SIZE, logo);
    fs.writeFileSync(pngPath, pngBuf);

    // 2. SVG Vettoriale (scalabilità infinita per tipografia / InDesign / Canva)
    const svgString = await brandedQrSvg(item.url, logo);
    const svgPath = path.join(outDir, `${item.id}.svg`);
    fs.writeFileSync(svgPath, svgString, "utf8");

    console.log(`✅ Generati: ${item.id}.png + ${item.id}.svg -> ${item.url}`);
  }

  // 3. Scheda visiva riepilogativa con i 4 QR delle presentazioni specifiche
  const specificItems = ITEMS.filter((i) => !i.id.startsWith("00_"));
  const cardW = 1600;
  const cardH = 1900;
  const composites = [];

  for (let idx = 0; idx < specificItems.length; idx++) {
    const item = specificItems[idx];
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const boxX = 100 + col * 720;
    const boxY = 260 + row * 780;

    const qrBuf = await brandedQrPng(item.url, 520, logo);

    composites.push({
      input: qrBuf,
      left: boxX + 80,
      top: boxY + 40,
    });

    const labelSvg = Buffer.from(`
      <svg width="680" height="170" xmlns="http://www.w3.org/2000/svg">
        <text x="340" y="48" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="#242220" text-anchor="middle">${item.title.replace(/&/g, "&amp;")}</text>
        <text x="340" y="92" font-family="sans-serif" font-size="14" fill="#6E6A63" text-anchor="middle">${item.url}</text>
      </svg>
    `);

    composites.push({
      input: labelSvg,
      left: boxX,
      top: boxY + 580,
    });
  }

  const headerSvg = Buffer.from(`
    <svg width="${cardW}" height="${cardH}" xmlns="http://www.w3.org/2000/svg">
      <text x="800" y="110" font-family="Georgia, serif" font-size="48" font-weight="bold" fill="#242220" text-anchor="middle">La Terra degli Aranci — Kit QR Stampa Preventivi</text>
      <text x="800" y="165" font-family="sans-serif" font-size="24" fill="#8C6A28" text-anchor="middle">Inquadra per sfogliare la presentazione dedicata</text>
      <rect x="100" y="260" width="680" height="720" rx="24" fill="#FFFFFF" stroke="#C5A059" stroke-width="2" />
      <rect x="820" y="260" width="680" height="720" rx="24" fill="#FFFFFF" stroke="#C5A059" stroke-width="2" />
      <rect x="100" y="1040" width="680" height="720" rx="24" fill="#FFFFFF" stroke="#C5A059" stroke-width="2" />
      <rect x="820" y="1040" width="680" height="720" rx="24" fill="#FFFFFF" stroke="#C5A059" stroke-width="2" />
    </svg>
  `);

  const sheetBuf = await sharp({
    create: {
      width: cardW,
      height: cardH,
      channels: 4,
      background: "#EFEAE1",
    },
  })
    .composite([{ input: headerSvg, left: 0, top: 0 }, ...composites])
    .png()
    .toBuffer();

  const sheetPath = path.join(outDir, "SCHEDA_RIEPILOGO_4_QR.png");
  fs.writeFileSync(sheetPath, sheetBuf);
  console.log(`✅ Scheda riepilogativa creata: ${sheetPath}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
