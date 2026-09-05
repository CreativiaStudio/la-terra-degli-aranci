import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";
import { AddendumPdfTemplate } from "./AddendumPdfTemplate";
import { uploadPdfToR2 } from "@/lib/r2";

const imageBase64Cache = new Map<string, string | null>();

function getBase64Image(filePath: string) {
  if (imageBase64Cache.has(filePath)) {
    return imageBase64Cache.get(filePath)!;
  }
  try {
    const bitmap = fs.readFileSync(filePath);
    const base64 = Buffer.from(bitmap).toString("base64");
    const ext = path.extname(filePath).substring(1);
    const dataUri = `data:image/${ext};base64,${base64}`;
    imageBase64Cache.set(filePath, dataUri);
    return dataUri;
  } catch (err) {
    return null;
  }
}

interface GenerateAddendumParams {
  tipoContratto: 'wedding' | 'eventi';
  quoteRef: string;
  clientName: string;
  itemsBefore: any[];
  itemsAfter: any[];
  totaleBefore: number;
  totaleAfter: number;
  firmaDisegnata: string;
}

export async function generateAddendumPdf(params: GenerateAddendumParams): Promise<string> {
  const logoSimboloPath = getBase64Image(path.join(process.cwd(), "public", "tda-simbolo.png"));
  const logoRightPath = getBase64Image(path.join(process.cwd(), "public", "logo-testo.png"));

  const stream = await renderToStream(
    React.createElement(AddendumPdfTemplate, {
      quoteRef: params.quoteRef,
      clientName: params.clientName,
      itemsBefore: params.itemsBefore,
      itemsAfter: params.itemsAfter,
      totaleBefore: params.totaleBefore,
      totaleAfter: params.totaleAfter,
      firmaDisegnata: params.firmaDisegnata,
      logoPath: logoSimboloPath,
      logoRightPath: logoRightPath,
      signedAt: new Date().toISOString()
    })
  );

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  const pdfBuffer = Buffer.concat(chunks);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const safeName = (params.clientName || 'Cliente').replace(/\s+/g, '-');
  const folder = params.tipoContratto === 'wedding' ? 'wedding' : 'eventi';
  const fileName = `contratti/addenda/${folder}/${timestamp}_${safeName}.pdf`;

  return uploadPdfToR2(pdfBuffer, fileName);
}
