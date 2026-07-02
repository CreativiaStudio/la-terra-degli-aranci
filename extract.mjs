import { exportImages } from 'pdf-export-images';

async function run() {
  try {
    const images = await exportImages(String.raw`C:\Users\mario\Downloads\Cappuccio_Contratto_Firmato.pdf`, './extracted-signatures');
    console.log(`Estratte ${images.length} immagini!`);
  } catch (e) {
    console.error(e);
  }
}

run();
