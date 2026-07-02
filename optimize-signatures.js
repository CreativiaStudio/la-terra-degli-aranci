const sharp = require('sharp');
const path = require('path');

async function optimize(filename) {
  const inputPath = path.join(__dirname, 'public', filename);
  const outputPath = path.join(__dirname, 'public', 'opt-' + filename);
  
  await sharp(inputPath)
    .resize(800, null, { withoutEnlargement: true }) // scala a 800px max larghezza
    .grayscale() // bianco e nero
    .normalize() // espande il contrasto
    .threshold(200) // rimuove il rumore di fondo, tutto ciò che è sopra 200 diventa bianco puro
    .png({ quality: 100 }) // salva in PNG massima qualità
    .toFile(outputPath);
    
  console.log('Ottimizzata: ', filename);
}

async function run() {
  await optimize('firma-roberto.png');
  await optimize('firma-rosaria.png');
}

run();
