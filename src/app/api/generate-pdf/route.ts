import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { ContractPdfTemplate } from "@/lib/pdf/ContractPdfTemplate";
import { uploadPdfToR2, uploadJsonToR2 } from "@/lib/r2";
import path from "path";
import fs from "fs";

// Helper function to read image as base64
const getBase64Image = (filePath: string) => {
  try {
    const bitmap = fs.readFileSync(filePath);
    const base64 = Buffer.from(bitmap).toString("base64");
    const ext = path.extname(filePath).substring(1);
    return `data:image/${ext};base64,${base64}`;
  } catch (err) {
    console.error("Error reading image:", filePath, err);
    return null;
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // BACKUP IMMEDIATO: Salviamo il payload grezzo su R2 per evitare qualsiasi perdita dati
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const safeName = `${body.datiCliente?.nome || 'Anon'}-${body.datiCliente?.cognome || 'Anon'}`.replace(/\s+/g, '-');
    const folder = body.tipoContratto === 'wedding' ? 'wedding' : 'eventi';
    
    const jsonFileName = `contratti/backups/raw/${folder}/${timestamp}_${safeName}.json`;
    try {
      await uploadJsonToR2(body, jsonFileName);
    } catch (backupErr) {
      console.error("Errore salvataggio backup JSON:", backupErr);
      // Non blocchiamo il flusso se fallisce solo il backup, proseguiamo con il PDF
    }
    
    const logoSimboloPath = getBase64Image(path.join(process.cwd(), "public", "tda-simbolo.png"));
    const logoRightPath = getBase64Image(path.join(process.cwd(), "public", "logo-testo.png"));
    const firmaRobertoPath = getBase64Image(path.join(process.cwd(), "public", "firma-roberto.png"));
    const firmaRosariaPath = getBase64Image(path.join(process.cwd(), "public", "firma-rosaria.png"));
    
    // Genera il PDF stream in memoria
    const stream = await renderToStream(
      React.createElement(ContractPdfTemplate, {
        tipoContratto: body.tipoContratto,
        lang: body.lingua,
        data: body.datiCliente,
        preventivo: body.preventivo,
        prezzo: body.prezzo,
        firmaContratto: body.firma_disegnata,
        firmaClausole: body.firma_disegnata_clausole,
        logoPath: logoSimboloPath,
        logoRightPath: logoRightPath,
        firmaRobertoPath: firmaRobertoPath,
        firmaRosariaPath: firmaRosariaPath
      })
    );

    // Converti stream a buffer per rispondere con un file
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Genera il nome file in base alla data e al nome cliente
    const fileName = `contratti/${folder}/${timestamp}_${safeName}.pdf`;

    // Carica direttamente su Cloudflare R2
    const fileUrl = await uploadPdfToR2(pdfBuffer, fileName);

    // TODO: Invia Webhook a N8N per email/automazioni qui (se necessario)
    // await fetch("https://tuo-n8n.com/webhook/...", { method: "POST", body: JSON.stringify({ url: fileUrl, data: body }) });

    // Risponde con l'URL pubblico del file
    return NextResponse.json({ 
      success: true, 
      message: "PDF generato e salvato con successo",
      url: fileUrl 
    });
  } catch (error) {
    console.error("Errore generazione PDF:", error);
    return NextResponse.json({ error: "Errore interno durante la generazione del PDF", message: error.message, stack: error.stack }, { status: 500 });
  }
}
