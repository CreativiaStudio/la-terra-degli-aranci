const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const sharp = require('sharp');

const OUTPUT_DIRS = [
  path.join(__dirname, '..', 'public', 'openday', 'qr'),
  path.join(__dirname, '..', '..', 'OpenDay_Kit_Stampa'),
];

OUTPUT_DIRS.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// URL con parametro di tracciamento univoco
const URL_PRIMARY = 'https://laterradegliaranci.it/openday?src=qr';
const URL_DIRECT = 'https://ecosistema.laterradegliaranci.it/openday?src=qr';

const VARIANTS = [
  {
    id: 'botanico',
    name: '01_Botanico_Chic',
    dark: '#2D5A27', // Verde Botanico Parco
    light: '#FAF8F5', // Bianco Sposa Caldo
    accent: '#E58C2C', // Arancio Caldo TDA
    desc: 'Verde Parco Botanico su sfondo Avorio Sposa (Consigliato per La Terra degli Aranci)',
  },
  {
    id: 'antracite',
    name: '02_Nobile_Antracite',
    dark: '#2B2B2B', // Carbone Antracite
    light: '#FFFFFF', // Bianco Puro
    accent: '#2D5A27',
    desc: 'Nobile Carbone su Bianco Puro (Massimo contrasto tipografico e rigore formale)',
  },
  {
    id: 'arancio',
    name: '03_Arancio_Heritage',
    dark: '#E58C2C', // Arancio Caldo TDA
    light: '#FAF8F5', // Bianco Sposa Caldo
    accent: '#2D5A27',
    desc: 'Arancio Caldo Solare su sfondo Avorio (Tono caldo e festoso)',
  },
];

// Carica il simbolo TDA
const logoPath = path.join(__dirname, '..', 'public', 'logo-simbolo.png');
if (!fs.existsSync(logoPath)) {
  console.error('File logo-simbolo.png non trovato in:', logoPath);
  process.exit(1);
}
const logoBuffer = fs.readFileSync(logoPath);
const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

async function generateAll() {
  console.log('🚀 Avvio generazione Kit QR Code con Logo Incastonato & Tracciamento...');

  const generatedCards = {};

  for (const variant of VARIANTS) {
    const QR_SIZE = 2400; // Alta definizione 300 DPI
    const BADGE_SIZE = Math.round(QR_SIZE * 0.23); // ~552px
    const LOGO_SIZE = Math.round(BADGE_SIZE * 0.82); // ~452px

    // 1. Genera il QR base senza logo
    const rawQrBuffer = await QRCode.toBuffer(URL_PRIMARY, {
      type: 'png',
      width: QR_SIZE,
      margin: 2,
      errorCorrectionLevel: 'H', // Tolleranza 30% per permettere il logo al centro
      color: {
        dark: variant.dark,
        light: variant.light,
      },
    });

    // 2. Prepara il badge di sfondo per il logo con angoli arrotondati e bordo colorato
    const badgeSvg = `
      <svg width="${BADGE_SIZE}" height="${BADGE_SIZE}" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="${BADGE_SIZE - 6}" height="${BADGE_SIZE - 6}" rx="54" fill="${variant.light}" stroke="${variant.accent}" stroke-width="8"/>
      </svg>
    `;
    const badgeBuffer = Buffer.from(badgeSvg);

    // 3. Ridimensiona il logo TDA
    const resizedLogoBuffer = await sharp(logoBuffer)
      .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // 4. Componi il badge con il logo al centro
    const badgeComposite = await sharp(badgeBuffer)
      .composite([
        {
          input: resizedLogoBuffer,
          top: Math.round((BADGE_SIZE - LOGO_SIZE) / 2),
          left: Math.round((BADGE_SIZE - LOGO_SIZE) / 2),
        },
      ])
      .png()
      .toBuffer();

    // 5. Incastona il badge al centro esatto del QR Code
    const centerPos = Math.round((QR_SIZE - BADGE_SIZE) / 2);
    const finalPngBuffer = await sharp(rawQrBuffer)
      .composite([
        {
          input: badgeComposite,
          top: centerPos,
          left: centerPos,
        },
      ])
      .png()
      .toBuffer();

    // 6. Genera anche la versione SVG vettoriale con logo embedded
    const rawSvg = await QRCode.toString(URL_PRIMARY, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: variant.dark,
        light: variant.light,
      },
    });

    const viewBoxMatch = rawSvg.match(/viewBox="0 0 (\d+) (\d+)"/);
    let brandedSvg = rawSvg;
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
  <!-- Logo Centro Brandizzato TDA -->
  <rect x="${badgeX}" y="${badgeY}" width="${sBadgeSize}" height="${sBadgeSize}" rx="8" fill="${variant.light}" stroke="${variant.accent}" stroke-width="1.8" />
  <image x="${logoX}" y="${logoY}" width="${sLogoSize}" height="${sLogoSize}" href="${logoBase64}" preserveAspectRatio="xMidYMid meet" />
</svg>`;
      brandedSvg = rawSvg.replace('</svg>', overlay);
    }

    // Salva i file nelle directory
    OUTPUT_DIRS.forEach(outDir => {
      fs.writeFileSync(path.join(outDir, `QR_${variant.name}_300DPI.png`), finalPngBuffer);
      fs.writeFileSync(path.join(outDir, `QR_${variant.name}_Vettoriale.svg`), brandedSvg, 'utf8');
    });

    generatedCards[variant.id] = `data:image/png;base64,${finalPngBuffer.toString('base64')}`;
    console.log(`✓ Variante [${variant.name}] con logo incastonato generata con successo.`);
  }

  // Genera anche la versione diretta di backup
  const directPng = await sharp(
    await QRCode.toBuffer(URL_DIRECT, {
      type: 'png',
      width: 2400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#2D5A27', light: '#FAF8F5' },
    })
  ).toBuffer();
  OUTPUT_DIRS.forEach(outDir => {
    fs.writeFileSync(path.join(outDir, 'QR_04_URL_Diretta_Ecosistema_300DPI.png'), directPng);
  });

  // 7. Genera Cartoncino A5 con immagini 100% EMBEDDED in Base64 (zero immagini rotte!)
  const htmlBotanico = generateStandalonePrintableCardHtml(
    logoBase64,
    generatedCards['botanico'],
    'laterradegliaranci.it/openday'
  );

  OUTPUT_DIRS.forEach(outDir => {
    fs.writeFileSync(path.join(outDir, 'Cartoncino_Tavolo_OpenDay_A5.html'), htmlBotanico, 'utf8');
  });

  console.log('🎉 Kit QR Code aggiornato con successo! Cartoncino A5 100% autonomo pronto.');
}

function generateStandalonePrintableCardHtml(logoDataUri, qrDataUri, displayUrl) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Cartoncino Segnaposto Tavolo Open Day — La Terra degli Aranci</title>
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
      background: #FAF8F5;
      padding: 14mm 14mm 12mm 14mm;
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
      border: 1.2px solid #2D5A27;
      pointer-events: none;
      border-radius: 4px;
    }

    .corner-decor {
      position: absolute;
      width: 12mm;
      height: 12mm;
      border-color: #E58C2C;
      border-style: solid;
      pointer-events: none;
    }
    .top-left { top: 4mm; left: 4mm; border-width: 2px 0 0 2px; }
    .top-right { top: 4mm; right: 4mm; border-width: 2px 2px 0 0; }
    .bottom-left { bottom: 4mm; left: 4mm; border-width: 0 0 2px 2px; }
    .bottom-right { bottom: 4mm; right: 4mm; border-width: 0 2px 2px 0; }
    
    .header { margin-top: 2mm; z-index: 2; display: flex; flex-direction: column; align-items: center; }
    .logo-img { width: 22mm; height: 22mm; object-fit: contain; margin-bottom: 2.5mm; }
    .super-title { font-size: 8.8pt; letter-spacing: 0.22em; text-transform: uppercase; color: #2D5A27; font-weight: 700; margin-bottom: 2mm; }
    .title { font-family: 'Playfair Display', Georgia, serif; font-size: 23pt; font-weight: 700; color: #2B2B2B; line-height: 1.15; margin: 0 0 2mm 0; }
    .subtitle { font-size: 10pt; color: #514D48; max-width: 102mm; line-height: 1.45; margin: 0 auto; font-weight: 400; }
    
    .qr-frame {
      z-index: 2;
      background: #FFFFFF;
      padding: 4.5mm;
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(45,90,39,0.08);
      border: 1.2px solid #E8E2D8;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 2mm 0;
    }
    .qr-img { width: 58mm; height: 58mm; object-fit: contain; }
    .qr-url { font-size: 9pt; color: #2D5A27; font-weight: 700; margin-top: 2mm; letter-spacing: 0.05em; }
    
    .instructions {
      z-index: 2;
      margin-bottom: 2mm;
    }
    .action-pill {
      display: inline-block;
      background: linear-gradient(135deg, #E58C2C 0%, #D47B1E 100%);
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
      <div class="qr-url">${displayUrl}</div>
    </div>
    
    <div class="instructions">
      <div class="action-pill">🌿 Inquadrate con la Fotocamera</div>
      <p class="action-note">Le vostre preferenze verranno salvate e condivise con la Direzione de La Terra degli Aranci, potrete sempre modificarle nella vostra Area.</p>
    </div>
    
    <div class="footer">
      <p class="footer-claim">Il Parco Botanico per Eventi tra Posillipo e il Vomero</p>
    </div>
  </div>
</body>
</html>`;
}

generateAll().catch(err => {
  console.error('Errore durante la generazione:', err);
  process.exit(1);
});
