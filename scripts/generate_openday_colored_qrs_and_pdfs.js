const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const QRCode = require('qrcode');
const sharp = require('sharp');

const OUTPUT_DIRS = [
  path.join(__dirname, '..', 'public', 'openday', 'qr'),
  path.join(__dirname, '..', '..', 'OpenDay_Kit_Stampa'),
];

OUTPUT_DIRS.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// URL diretta e immediata dell'Ecosistema in produzione (zero intermediari, 100% funzionante)
const URL_TRACKED = 'https://ecosistema.laterradegliaranci.it/openday?src=qr';
const DISPLAY_URL = 'ecosistema.laterradegliaranci.it/openday';

// Carica il simbolo TDA originale per estrarre la maschera alpha
const rawLogoBuffer = fs.readFileSync(path.join(__dirname, '..', 'public', 'tda-simbolo.png'));

async function colorizeLogo(r, g, b) {
  const meta = await sharp(rawLogoBuffer).metadata();
  const alpha = await sharp(rawLogoBuffer).extractChannel('alpha').toBuffer();
  const solid = await sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 3,
      background: { r, g, b },
    },
  }).png().toBuffer();
  return sharp(solid).joinChannel(alpha).png().toBuffer();
}

async function buildQrWithCenteredLogo({ darkColor, lightColor, borderColor, logoBuffer }) {
  const QR_SIZE = 2400; // 300 DPI alta definizione
  const BADGE_SIZE = Math.round(QR_SIZE * 0.23); // ~552px
  const LOGO_SIZE = Math.round(BADGE_SIZE * 0.82); // ~452px

  // 1. QR code di base
  const rawQr = await QRCode.toBuffer(URL_TRACKED, {
    type: 'png',
    width: QR_SIZE,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: darkColor, light: lightColor },
  });

  // 2. Badge di sfondo
  const badgeSvg = `
    <svg width="${BADGE_SIZE}" height="${BADGE_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="${BADGE_SIZE - 6}" height="${BADGE_SIZE - 6}" rx="54" fill="${lightColor}" stroke="${borderColor}" stroke-width="8"/>
    </svg>
  `;
  const badgeBuffer = Buffer.from(badgeSvg);

  // 3. Ridimensiona il logo colorato
  const resizedLogo = await sharp(logoBuffer)
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // 4. Componi badge + logo
  const badgeComposite = await sharp(badgeBuffer)
    .composite([
      {
        input: resizedLogo,
        top: Math.round((BADGE_SIZE - LOGO_SIZE) / 2),
        left: Math.round((BADGE_SIZE - LOGO_SIZE) / 2),
      },
    ])
    .png()
    .toBuffer();

  // 5. Sovrapponi al centro del QR
  const centerPos = Math.round((QR_SIZE - BADGE_SIZE) / 2);
  const finalPng = await sharp(rawQr)
    .composite([
      {
        input: badgeComposite,
        top: centerPos,
        left: centerPos,
      },
    ])
    .png()
    .toBuffer();

  // 6. SVG vettoriale con logo embedded
  const rawSvg = await QRCode.toString(URL_TRACKED, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: darkColor, light: lightColor },
  });

  const logoBase64 = `data:image/png;base64,${resizedLogo.toString('base64')}`;
  const viewBoxMatch = rawSvg.match(/viewBox="0 0 (\d+) (\d+)"/);
  let finalSvg = rawSvg;
  if (viewBoxMatch) {
    const size = parseInt(viewBoxMatch[1], 10);
    const sBadgeSize = Math.round(size * 0.23);
    const sLogoSize = Math.round(sBadgeSize * 0.82);
    const sCenter = size / 2;
    const badgeX = sCenter - sBadgeSize / 2;
    const badgeY = sCenter - sBadgeSize / 2;
    const logoX = sCenter - sLogoSize / 2;
    const logoY = sCenter - sLogoSize / 2;

    const overlay = `
  <!-- Logo Centro Brandizzato TDA Colorato -->
  <rect x="${badgeX}" y="${badgeY}" width="${sBadgeSize}" height="${sBadgeSize}" rx="8" fill="${lightColor}" stroke="${borderColor}" stroke-width="1.8" />
  <image x="${logoX}" y="${logoY}" width="${sLogoSize}" height="${sLogoSize}" href="${logoBase64}" preserveAspectRatio="xMidYMid meet" />
</svg>`;
    finalSvg = rawSvg.replace('</svg>', overlay);
  }

  return { pngBuffer: finalPng, svgString: finalSvg };
}

function generateHtmlCard({ themeName, primaryColor, accentColor, bgLight, logoDataUri, qrDataUri }) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Cartoncino Segnaposto Tavolo Open Day (${themeName}) — La Terra degli Aranci</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap');
    
    @page {
      size: A5 portrait;
      margin: 0;
    }
    
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    
    body {
      margin: 0;
      padding: 0;
      background: #E8E2D8;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #2B2B2B;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    
    .card-container {
      width: 148mm;
      height: 210mm;
      background: ${bgLight};
      padding: 13mm 14mm 11mm 14mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      box-shadow: 0 16px 40px rgba(0,0,0,0.18);
      position: relative;
      border: 1px solid #E5DCCE;
    }
    
    .inner-border {
      position: absolute;
      top: 6mm;
      bottom: 6mm;
      left: 6mm;
      right: 6mm;
      border: 1.2px solid ${primaryColor};
      pointer-events: none;
      border-radius: 4px;
    }

    .corner-decor {
      position: absolute;
      width: 12mm;
      height: 12mm;
      border-color: ${accentColor};
      border-style: solid;
      pointer-events: none;
    }
    .top-left { top: 4mm; left: 4mm; border-width: 2px 0 0 2px; }
    .top-right { top: 4mm; right: 4mm; border-width: 2px 2px 0 0; }
    .bottom-left { bottom: 4mm; left: 4mm; border-width: 0 0 2px 2px; }
    .bottom-right { bottom: 4mm; right: 4mm; border-width: 0 2px 2px 0; }
    
    .header { margin-top: 2mm; z-index: 2; display: flex; flex-direction: column; align-items: center; }
    .logo-img { width: 22mm; height: 22mm; object-fit: contain; margin-bottom: 2mm; }
    .super-title { font-size: 8.8pt; letter-spacing: 0.22em; text-transform: uppercase; color: ${primaryColor}; font-weight: 700; margin-bottom: 2mm; }
    .title { font-family: 'Playfair Display', Georgia, serif; font-size: 22.5pt; font-weight: 700; color: #2B2B2B; line-height: 1.15; margin: 0 0 2mm 0; }
    .subtitle { font-size: 9.8pt; color: #514D48; max-width: 104mm; line-height: 1.45; margin: 0 auto; font-weight: 400; }
    
    .qr-frame {
      z-index: 2;
      background: #FFFFFF;
      padding: 4mm;
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(45,90,39,0.08);
      border: 1.2px solid #E8E2D8;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 2mm 0;
    }
    .qr-img { width: 58mm; height: 58mm; object-fit: contain; }
    .qr-url { font-size: 9pt; color: ${primaryColor}; font-weight: 700; margin-top: 2mm; letter-spacing: 0.05em; }
    
    .instructions {
      z-index: 2;
      margin-bottom: 2mm;
    }
    .action-pill {
      display: inline-block;
      background: linear-gradient(135deg, ${accentColor} 0%, #D47B1E 100%);
      color: #FFFFFF;
      font-size: 9.5pt;
      font-weight: 700;
      padding: 2.5mm 7mm;
      border-radius: 999px;
      margin-bottom: 2.5mm;
      letter-spacing: 0.03em;
      box-shadow: 0 4px 12px rgba(229,140,44,0.25);
    }
    .action-note {
      font-size: 8.8pt;
      color: #514D48;
      max-width: 98mm;
      line-height: 1.5;
      margin: 0 auto;
      font-weight: 400;
    }
    
    .footer {
      z-index: 2;
      border-top: 1px solid #E8E2D8;
      width: 105mm;
      padding-top: 2mm;
      margin-bottom: 1mm;
    }
    .footer-claim { font-size: 7.8pt; color: #8E8880; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; margin: 0; }
    
    @media print {
      body { background: none; }
      .card-container { box-shadow: none; border: none; }
    }
  </style>
</head>
<body>
  <div class="card-container">
    <div class="inner-border"></div>
    <div class="corner-decor top-left"></div>
    <div class="corner-decor top-right"></div>
    <div class="corner-decor bottom-left"></div>
    <div class="corner-decor bottom-right"></div>
    
    <div class="header">
      <img src="${logoDataUri}" alt="Logo La Terra degli Aranci" class="logo-img" />
      <div class="super-title">La Terra degli Aranci</div>
      <h1 class="title">Il Vostro Wedding Diary</h1>
      <p class="subtitle">Mentre passeggiate tra il parco secolare e le sale, componete i desideri del vostro giorno indimenticabile.</p>
    </div>
    
    <div class="qr-frame">
      <img src="${qrDataUri}" alt="QR Code Wedding Diary" class="qr-img" />
      <div class="qr-url">${DISPLAY_URL}</div>
    </div>
    
    <div class="instructions">
      <div class="action-pill">🌿 Inquadrate con la Fotocamera</div>
      <p class="action-note">Le vostre preferenze verranno salvate e condivise con la Direzione de La Terra degli Aranci, potrete sempre modificarle nella vostra Area.</p>
    </div>
    
    <div class="footer">
      <p class="footer-claim">Un Giardino di Emozioni nel Cuore di Napoli</p>
    </div>
  </div>
</body>
</html>`;
}

async function run() {
  console.log('🎨 Generazione varianti personalizzate richieste da Mario...');

  // 1. Logo Verde (#2D5A27 -> RGB 45, 90, 39)
  const greenLogoBuffer = await colorizeLogo(45, 90, 39);
  const greenLogoBase64 = `data:image/png;base64,${greenLogoBuffer.toString('base64')}`;

  // 2. Logo Arancione (#E58C2C -> RGB 229, 140, 44)
  const orangeLogoBuffer = await colorizeLogo(229, 140, 44);
  const orangeLogoBase64 = `data:image/png;base64,${orangeLogoBuffer.toString('base64')}`;

  // --- VARIANTE 1: VERDE BOTANICO CON LOGO CENTRALE VERDE ---
  const greenQr = await buildQrWithCenteredLogo({
    darkColor: '#2D5A27',
    lightColor: '#FAF8F5',
    borderColor: '#2D5A27',
    logoBuffer: greenLogoBuffer,
  });

  OUTPUT_DIRS.forEach(outDir => {
    fs.writeFileSync(path.join(outDir, 'QR_01_Botanico_Chic_VERDE_300DPI.png'), greenQr.pngBuffer);
    fs.writeFileSync(path.join(outDir, 'QR_01_Botanico_Chic_VERDE_Vettoriale.svg'), greenQr.svgString, 'utf8');
  });

  const greenHtml = generateHtmlCard({
    themeName: 'Verde Botanico',
    primaryColor: '#2D5A27',
    accentColor: '#E58C2C',
    bgLight: '#FAF8F5',
    logoDataUri: greenLogoBase64,
    qrDataUri: `data:image/png;base64,${greenQr.pngBuffer.toString('base64')}`,
  });

  const greenHtmlPath = path.join(OUTPUT_DIRS[1], 'Cartoncino_Tavolo_OpenDay_VERDE_A5.html');
  fs.writeFileSync(greenHtmlPath, greenHtml, 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIRS[0], 'Cartoncino_Tavolo_OpenDay_VERDE_A5.html'), greenHtml, 'utf8');
  console.log('✓ Variante VERDE completata con logo centrale verde.');

  // --- VARIANTE 2: ARANCIO HERITAGE CON LOGO CENTRALE ARANCIONE ---
  const orangeQr = await buildQrWithCenteredLogo({
    darkColor: '#E58C2C',
    lightColor: '#FAF8F5',
    borderColor: '#E58C2C',
    logoBuffer: orangeLogoBuffer,
  });

  OUTPUT_DIRS.forEach(outDir => {
    fs.writeFileSync(path.join(outDir, 'QR_03_Arancio_Heritage_ARANCIONE_300DPI.png'), orangeQr.pngBuffer);
    fs.writeFileSync(path.join(outDir, 'QR_03_Arancio_Heritage_ARANCIONE_Vettoriale.svg'), orangeQr.svgString, 'utf8');
  });

  const orangeHtml = generateHtmlCard({
    themeName: 'Arancio Heritage',
    primaryColor: '#E58C2C',
    accentColor: '#2D5A27',
    bgLight: '#FAF8F5',
    logoDataUri: orangeLogoBase64,
    qrDataUri: `data:image/png;base64,${orangeQr.pngBuffer.toString('base64')}`,
  });

  const orangeHtmlPath = path.join(OUTPUT_DIRS[1], 'Cartoncino_Tavolo_OpenDay_ARANCIONE_A5.html');
  fs.writeFileSync(orangeHtmlPath, orangeHtml, 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIRS[0], 'Cartoncino_Tavolo_OpenDay_ARANCIONE_A5.html'), orangeHtml, 'utf8');
  console.log('✓ Variante ARANCIONE completata con logo centrale arancione.');

  // --- COMPILAZIONE PDF NATIVI VIA CHROME / EDGE HEADLESS ---
  console.log('📄 Generazione PDF A5 ad alta fedeltà di stampa...');
  const browserExe = fs.existsSync('C:\\Program Files\\Google\Chrome\\Application\\chrome.exe')
    ? '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"'
    : '"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"';

  const greenPdfPath = path.join(OUTPUT_DIRS[1], 'Cartoncino_Tavolo_OpenDay_VERDE_A5.pdf');
  const orangePdfPath = path.join(OUTPUT_DIRS[1], 'Cartoncino_Tavolo_OpenDay_ARANCIONE_A5.pdf');

  try {
    execSync(
      `${browserExe} --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${greenPdfPath}" "file:///${greenHtmlPath.replace(/\\/g, '/')}"`
    );
    console.log('✓ PDF Verde generato:', greenPdfPath);

    execSync(
      `${browserExe} --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${orangePdfPath}" "file:///${orangeHtmlPath.replace(/\\/g, '/')}"`
    );
    console.log('✓ PDF Arancione generato:', orangePdfPath);

    // Copia anche in public
    fs.copyFileSync(greenPdfPath, path.join(OUTPUT_DIRS[0], 'Cartoncino_Tavolo_OpenDay_VERDE_A5.pdf'));
    fs.copyFileSync(orangePdfPath, path.join(OUTPUT_DIRS[0], 'Cartoncino_Tavolo_OpenDay_ARANCIONE_A5.pdf'));
  } catch (pdfErr) {
    console.warn('Avviso generazione PDF da Chrome/Edge:', pdfErr.message);
  }

  console.log('🎉 TUTTO PRONTO! Generati i due PDF A5 e tutti i file grafici aggiornati.');
}

run().catch(console.error);
