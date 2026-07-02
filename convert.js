const sharp = require('sharp');
const fs = require('fs');

async function convert() {
  try {
    await sharp('./public/TDA_SIMBOLO_2024-03.webp')
      .png()
      .toFile('./public/tda-simbolo.png');
    console.log("Convertito con successo");
  } catch(e) {
    console.error("Errore:", e);
  }
}

convert();
