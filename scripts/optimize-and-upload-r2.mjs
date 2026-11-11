import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------------------------------------------------------- */
/* Configurazione                                                              */
/* -------------------------------------------------------------------------- */

// Carica variabili d'ambiente da .env.local se presente
const envLocalPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath);
}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || 'la-terra-degli-aranci';

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error('❌ Errore: Credenziali R2 mancanti in .env.local');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://' + accountId + '.r2.cloudflarestorage.com',
  credentials: { accessKeyId, secretAccessKey }
});

const FOLDERS = ['tda-2026-en', 'wedding-it', 'aziendale', 'love-tales'];
const PRESENTAZIONI_DIR = path.resolve(__dirname, '..', 'public', 'presentazioni');
const CONCURRENCY = 4;
const WEBP_QUALITY = 85;
const WEBP_EFFORT = 6;

/* -------------------------------------------------------------------------- */
/* Utility                                                                     */
/* -------------------------------------------------------------------------- */

const toMB = (bytes) => bytes / (1024 * 1024);
const fmtMB = (bytes) => toMB(bytes).toFixed(2) + ' MB';
const fmtPct = (part, total) => (total > 0 ? ((part / total) * 100).toFixed(1) + '%' : '0.0%');

/**
 * Estrae l'indice numerico dal nome file (slide_01.png -> 1).
 * I file senza numero finiscono in coda, ordinati alfabeticamente.
 */
function slideIndex(fileName) {
  const match = fileName.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function compareSlides(a, b) {
  const diff = slideIndex(a) - slideIndex(b);
  return diff !== 0 ? diff : a.localeCompare(b);
}

/**
 * Pool di concorrenza senza dipendenze esterne: N worker consumano
 * la stessa coda finché non ci sono più elementi.
 */
async function runPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) {
        return;
      }
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return results;
}

/* -------------------------------------------------------------------------- */
/* Elaborazione singola slide                                                  */
/* -------------------------------------------------------------------------- */

async function processSlide({ folder, filePath, fileName, index, total }) {
  const start = Date.now();
  const chattyName = `${folder}/${fileName}`;

  try {
    const pngBuffer = await fs.promises.readFile(filePath);
    const pngBytes = pngBuffer.length;

    const webpBuffer = await sharp(pngBuffer)
      .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
      .toBuffer();

    const webpBytes = webpBuffer.length;
    const key =
      'presentazioni/' +
      folder +
      '/' +
      path.basename(filePath, path.extname(filePath)) +
      '.webp';

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: webpBuffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable'
      })
    );

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const saved = pngBytes - webpBytes;
    const savedPct = fmtPct(saved, pngBytes);

    console.log(
      `✅ [${index + 1}/${total}] ${chattyName} → ${key} | ` +
        `${fmtMB(pngBytes)} → ${fmtMB(webpBytes)} (-${savedPct}) | ${elapsed}s`
    );

    return {
      ok: true,
      folder,
      key,
      fileName,
      pngBytes,
      webpBytes
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ [${index + 1}/${total}] ${chattyName} | ${message}`);

    return {
      ok: false,
      folder,
      fileName,
      pngBytes: 0,
      webpBytes: 0,
      error: message
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Esecuzione                                                                  */
/* -------------------------------------------------------------------------- */

async function main() {
  const startedAt = Date.now();

  console.log('🚀 Ottimizzazione slide presentazioni → WebP + upload su Cloudflare R2');
  console.log(`   Bucket:        ${bucketName}`);
  console.log(`   Endpoint:      https://${accountId}.r2.cloudflarestorage.com`);
  console.log(`   Sorgente:      ${PRESENTAZIONI_DIR}`);
  console.log(`   Concorrenza:   ${CONCURRENCY}`);
  console.log(`   Qualità WebP:  ${WEBP_QUALITY} (effort ${WEBP_EFFORT})`);
  console.log('');

  const perFolder = [];
  const allResults = [];
  const missingFolders = [];

  for (const folder of FOLDERS) {
    const folderPath = path.join(PRESENTAZIONI_DIR, folder);

    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
      console.warn(`⚠️  Cartella non trovata, saltata: ${folderPath}`);
      missingFolders.push(folder);
      perFolder.push({
        folder,
        status: 'missing',
        files: 0,
        pngBytes: 0,
        webpBytes: 0,
        errors: 0
      });
      continue;
    }

    const files = fs
      .readdirSync(folderPath)
      .filter((name) => name.toLowerCase().endsWith('.png'))
      .sort(compareSlides);

    if (files.length === 0) {
      console.warn(`⚠️  Nessun PNG trovato in: ${folderPath}`);
      perFolder.push({
        folder,
        status: 'empty',
        files: 0,
        pngBytes: 0,
        webpBytes: 0,
        errors: 0
      });
      continue;
    }

    console.log(`📁 ${folder} — ${files.length} slide PNG`);
    console.log('');

    const results = await runPool(
      files,
      (fileName, index) =>
        processSlide({
          folder,
          fileName,
          filePath: path.join(folderPath, fileName),
          index,
          total: files.length
        }),
      CONCURRENCY
    );

    const folderOk = results.filter((r) => r.ok);
    const folderErrors = results.filter((r) => !r.ok);
    const pngBytes = folderOk.reduce((sum, r) => sum + r.pngBytes, 0);
    const webpBytes = folderOk.reduce((sum, r) => sum + r.webpBytes, 0);

    perFolder.push({
      folder,
      status: 'done',
      files: folderOk.length,
      pngBytes,
      webpBytes,
      errors: folderErrors.length
    });

    allResults.push(...results);

    console.log('');
    console.log(
      `   Riepilogo ${folder}: ${folderOk.length}/${files.length} caricate | ` +
        `${fmtMB(pngBytes)} → ${fmtMB(webpBytes)} | ` +
        `risparmio ${fmtPct(pngBytes - webpBytes, pngBytes)} | errori: ${folderErrors.length}`
    );
    console.log('');
  }

  const successful = allResults.filter((r) => r.ok);
  const failed = allResults.filter((r) => !r.ok);

  const totalPngBytes = successful.reduce((sum, r) => sum + r.pngBytes, 0);
  const totalWebpBytes = successful.reduce((sum, r) => sum + r.webpBytes, 0);
  const totalSavedBytes = totalPngBytes - totalWebpBytes;
  const elapsedTotal = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log('══════════════════════════════════════════════════════════════════');
  console.log('📊 REPORT FINALE');
  console.log('══════════════════════════════════════════════════════════════════');

  console.log('');
  console.log('Per cartella:');
  for (const row of perFolder) {
    if (row.status === 'missing') {
      console.log(`  • ${row.folder.padEnd(14)} cartella non trovata`);
      continue;
    }
    if (row.status === 'empty') {
      console.log(`  • ${row.folder.padEnd(14)} nessun PNG`);
      continue;
    }
    console.log(
      `  • ${row.folder.padEnd(14)} ${String(row.files).padStart(3)} slide | ` +
        `${fmtMB(row.pngBytes).padStart(9)} PNG → ${fmtMB(row.webpBytes).padStart(9)} WebP | ` +
        `-${fmtPct(row.pngBytes - row.webpBytes, row.pngBytes)} | errori: ${row.errors}`
    );
  }

  console.log('');
  console.log('Totali:');
  console.log(`  • File convertiti e caricati: ${successful.length}`);
  console.log(`  • File in errore:             ${failed.length}`);
  console.log(`  • Peso PNG originali:         ${fmtMB(totalPngBytes)}`);
  console.log(`  • Peso WebP finali:           ${fmtMB(totalWebpBytes)}`);
  console.log(
    `  • Spazio risparmiato:         ${fmtMB(totalSavedBytes)} (${fmtPct(totalSavedBytes, totalPngBytes)})`
  );
  console.log(`  • Tempo totale:               ${elapsedTotal}s`);

  if (missingFolders.length > 0) {
    console.log('');
    console.log(`  ⚠️  Cartelle mancanti: ${missingFolders.join(', ')}`);
  }

  if (failed.length > 0) {
    console.log('');
    console.log('❌ Slide non elaborate:');
    for (const row of failed) {
      console.log(`  • ${row.folder}/${row.fileName} → ${row.error}`);
    }
    console.log('');
    console.log('⚠️  Completato con errori.');
    process.exitCode = 1;
    return;
  }

  console.log('');
  console.log(`✅ Completato: ${successful.length} slide WebP pubblicate su R2.`);
}

main().catch((error) => {
  console.error('');
  console.error('💥 Errore fatale non gestito:');
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
