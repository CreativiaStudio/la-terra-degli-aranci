import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";

const QR_COLORS = {
  dark: "#1E1D1B",
  light: "#FFFFFF",
};

let cachedTrimmedLogoPng: Buffer | null = null;
let cachedTrimmedLogoBase64: string | null = null;

async function getTrimmedLogo(): Promise<{ buffer: Buffer; base64: string }> {
  if (cachedTrimmedLogoPng && cachedTrimmedLogoBase64) {
    return { buffer: cachedTrimmedLogoPng, base64: cachedTrimmedLogoBase64 };
  }

  const logoPath = path.join(process.cwd(), "public", "tda-simbolo.png");
  const raw = fs.readFileSync(logoPath);
  const trimmed = await sharp(raw).trim().png().toBuffer();
  cachedTrimmedLogoPng = trimmed;
  cachedTrimmedLogoBase64 = trimmed.toString("base64");

  return { buffer: trimmed, base64: cachedTrimmedLogoBase64 };
}

/**
 * Genera un QR Code PNG ad alta risoluzione (default 1200x1200) con il logotipo
 * ufficiale La Terra degli Aranci centrato in un badge con bordo oro.
 */
export async function generateBrandedQrPng(url: string, size: number = 1200): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: size,
    color: QR_COLORS,
  });

  const { buffer: logoTrimmed } = await getTrimmedLogo();
  const badgeSize = Math.round(size * 0.23);
  const logoInnerSize = Math.round(badgeSize * 0.76);
  const radius = Math.round(badgeSize * 0.22);

  const resizedLogo = await sharp(logoTrimmed)
    .resize(logoInnerSize, logoInnerSize, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  const badgeSvg = Buffer.from(`
    <svg width="${badgeSize}" height="${badgeSize}" viewBox="0 0 ${badgeSize} ${badgeSize}" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="${badgeSize - 4}" height="${badgeSize - 4}" rx="${radius}" fill="#FFFFFF" stroke="#C5A059" stroke-width="4" />
    </svg>
  `);

  return sharp(qrBuffer)
    .composite([
      { input: badgeSvg, gravity: "center" },
      { input: resizedLogo, gravity: "center" },
    ])
    .png()
    .toBuffer();
}

/**
 * Genera un QR Code SVG vettoriale con il logotipo ufficiale La Terra degli Aranci al centro.
 */
export async function generateBrandedQrSvg(url: string): Promise<string> {
  const rawSvg = await QRCode.toString(url, {
    errorCorrectionLevel: "H",
    margin: 2,
    type: "svg",
    color: QR_COLORS,
  });

  const { base64 } = await getTrimmedLogo();
  const vbMatch = rawSvg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  const vbSize = vbMatch ? parseFloat(vbMatch[1]) : 45;

  const badgeSize = vbSize * 0.23;
  const badgePos = (vbSize - badgeSize) / 2;
  const radius = badgeSize * 0.22;
  const logoSize = badgeSize * 0.76;
  const logoPos = (vbSize - logoSize) / 2;

  const overlay = `
  <rect x="${badgePos.toFixed(2)}" y="${badgePos.toFixed(2)}" width="${badgeSize.toFixed(2)}" height="${badgeSize.toFixed(2)}" rx="${radius.toFixed(2)}" fill="#FFFFFF" stroke="#C5A059" stroke-width="${(vbSize * 0.004).toFixed(3)}" />
  <image x="${logoPos.toFixed(2)}" y="${logoPos.toFixed(2)}" width="${logoSize.toFixed(2)}" height="${logoSize.toFixed(2)}" href="data:image/png;base64,${base64}" preserveAspectRatio="xMidYMid meet" />
</svg>`;

  return rawSvg.replace("</svg>", overlay);
}
