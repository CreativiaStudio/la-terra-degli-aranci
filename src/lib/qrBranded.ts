import QRCode from "qrcode";
import { TDA_LOGO_BASE64 } from "./tdaLogoBase64";

const QR_COLORS = {
  dark: "#1E1D1B",
  light: "#FFFFFF",
};

/**
 * Genera un QR Code PNG ad alta risoluzione (default 1200x1200) con il logotipo
 * ufficiale La Terra degli Aranci centrato in un badge con bordo oro.
 * Importa sharp dinamicamente in try/catch per non bloccare il modulo su runtime serverless.
 */
export async function generateBrandedQrPng(url: string, size: number = 1200): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: size,
    color: QR_COLORS,
  });

  try {
    const sharpMod = await import("sharp");
    const sharp = sharpMod.default;
    const logoBuffer = Buffer.from(TDA_LOGO_BASE64, "base64");

    const badgeSize = Math.round(size * 0.23);
    const logoInnerSize = Math.round(badgeSize * 0.76);
    const radius = Math.round(badgeSize * 0.22);

    const resizedLogo = await sharp(logoBuffer)
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

    return await sharp(qrBuffer)
      .composite([
        { input: badgeSvg, gravity: "center" },
        { input: resizedLogo, gravity: "center" },
      ])
      .png()
      .toBuffer();
  } catch (err) {
    console.warn("[qrBranded] Fallback QR PNG puro senza sharp:", err);
    return qrBuffer;
  }
}

/**
 * Genera un QR Code SVG vettoriale 100% puro JS (zero sharp, zero filesystem)
 * con il logotipo ufficiale La Terra degli Aranci al centro.
 */
export async function generateBrandedQrSvg(url: string): Promise<string> {
  const rawSvg = await QRCode.toString(url, {
    errorCorrectionLevel: "H",
    margin: 2,
    type: "svg",
    color: QR_COLORS,
  });

  const vbMatch = rawSvg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  const vbSize = vbMatch ? parseFloat(vbMatch[1]) : 45;

  const badgeSize = vbSize * 0.23;
  const badgePos = (vbSize - badgeSize) / 2;
  const radius = badgeSize * 0.22;
  const logoSize = badgeSize * 0.76;
  const logoPos = (vbSize - logoSize) / 2;

  const overlay = `
  <rect x="${badgePos.toFixed(2)}" y="${badgePos.toFixed(2)}" width="${badgeSize.toFixed(2)}" height="${badgeSize.toFixed(2)}" rx="${radius.toFixed(2)}" fill="#FFFFFF" stroke="#C5A059" stroke-width="${(vbSize * 0.004).toFixed(3)}" />
  <image x="${logoPos.toFixed(2)}" y="${logoPos.toFixed(2)}" width="${logoSize.toFixed(2)}" height="${logoSize.toFixed(2)}" href="data:image/png;base64,${TDA_LOGO_BASE64}" preserveAspectRatio="xMidYMid meet" />
</svg>`;

  return rawSvg.replace("</svg>", overlay);
}
