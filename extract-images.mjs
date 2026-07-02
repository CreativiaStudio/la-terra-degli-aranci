import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractImages(pdfPath, outDir) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  let imageCount = 0;

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const ops = await page.getOperatorList();
    
    for (let j = 0; j < ops.fnArray.length; j++) {
      if (ops.fnArray[j] === pdfjsLib.OPS.paintImageXObject) {
        const imgName = ops.argsArray[j][0];
        try {
          const img = await page.objs.get(imgName);
          if (img && img.data && img.width && img.height) {
            imageCount++;
            // Basic raw pixel dump logic (would need sharp to convert to PNG if it's raw RGB)
            console.log(`Trovata immagine ${imgName} su pagina ${i}: ${img.width}x${img.height}`);
          }
        } catch (e) {
          console.log(e.message);
        }
      }
    }
  }
}

extractImages(String.raw`C:\Users\mario\Downloads\Cappuccio_Contratto_Firmato.pdf`, './extracted').catch(console.error);
