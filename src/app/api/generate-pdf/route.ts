import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { ContractPdfTemplate } from "@/lib/pdf/ContractPdfTemplate";
import { uploadPdfToR2, uploadJsonToR2 } from "@/lib/r2";
import { getServiceSupabase } from "@/lib/supabase";
import { updateQuoteStatusLocalByPrefix, saveSignedContractLocal, freezeInstallmentsLocalByPrefix } from "@/lib/localDb";
import path from "path";
import fs from "fs";

// Cache in memoria delle immagini statiche (evita I/O disco sincrono ad ogni PDF)
const imageBase64Cache = new Map<string, string | null>();

const getBase64Image = (filePath: string) => {
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
    console.error("Error reading image:", filePath, err);
    return null;
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // BACKUP IMMEDIATO IN BACKGROUND: Salviamo il payload grezzo su R2 senza bloccare la generazione PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const safeName = `${body.datiCliente?.nome || 'Anon'}-${body.datiCliente?.cognome || 'Anon'}`.replace(/\s+/g, '-');
    const folder = body.tipoContratto === 'wedding' ? 'wedding' : 'eventi';
    
    const jsonFileName = `contratti/backups/raw/${folder}/${timestamp}_${safeName}.json`;
    uploadJsonToR2(body, jsonFileName).catch(backupErr => {
      console.error("Errore salvataggio backup JSON:", backupErr);
    });
    
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

    // Salva l'anagrafica completa ed i dati contrattuali firmati nel DB locale
    saveSignedContractLocal({
      ...body,
      pdf_url: fileUrl,
      signed_at: new Date().toISOString()
    });

    // AGGIORNAMENTO STATO: Quando il contratto viene firmato, aggiorniamo lo stato del preventivo a 'firmato'
    if (body.preventivo) {
      try {
        const supabase = getServiceSupabase();
        await supabase
          .from('quotes')
          .update({ status: 'firmato' })
          .ilike('id', `${body.preventivo}%`);
      } catch (dbErr) {
        console.warn("Supabase update error:", dbErr);
      }
      updateQuoteStatusLocalByPrefix(body.preventivo, 'firmato');

      // Congelamento acconti ufficiale TDA:
      // 1° acconto fisso: €1.500 alla firma (Santo Stefano Srl)
      // 2° acconto forfettario: €3.000 a -6 mesi (Iovino Banquetting Srl)
      // Il saldo finale a 10-15 giorni prima dell'evento assorbe il residuo e le integrazioni extra.
      const totaleContratto = Number(body.prezzo) || 0;
      const caparra = Math.min(1500, totaleContratto);
      const secondoAcconto = Math.min(3000, Math.max(0, totaleContratto - caparra));
      try {
        const supabase = getServiceSupabase();
        await supabase
          .from('quotes')
          .update({ importo_caparra: caparra, importo_secondo_acconto: secondoAcconto })
          .ilike('id', `${body.preventivo}%`)
          .is('importo_caparra', null);
      } catch (dbErr) {
        console.warn("Supabase update error (congelamento rate):", dbErr);
      }
      freezeInstallmentsLocalByPrefix(body.preventivo, caparra, secondoAcconto);
    }

    return NextResponse.json({ 
      success: true, 
      message: "PDF generato e salvato con successo",
      url: fileUrl 
    });
  } catch (error: any) {
    console.error("ERRORE GENERALE:", error);
    return NextResponse.json({ success: false, error: "Errore interno durante la generazione del PDF", message: error.message, stack: error.stack }, { status: 500 });
  }
}
