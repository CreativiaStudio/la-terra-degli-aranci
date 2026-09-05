import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { ContractPdfTemplate } from "@/lib/pdf/ContractPdfTemplate";
import { getQuotesFast } from "@/lib/dataHelper";
import { listPdfsInR2 } from "@/lib/r2";
import { getSignedContractLocal } from "@/lib/localDb";
import path from "path";
import fs from "fs";

const getBase64Image = (filePath: string) => {
  try {
    const bitmap = fs.readFileSync(filePath);
    const base64 = Buffer.from(bitmap).toString("base64");
    const ext = path.extname(filePath).substring(1);
    return `data:image/${ext};base64,${base64}`;
  } catch (err) {
    return null;
  }
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quotes = await getQuotesFast();
    
    // Cerca il preventivo corrispondente
    const matchingQuote = quotes.find(
      q => q.id.toLowerCase().startsWith(id.toLowerCase()) || q.client_id === id
    ) || quotes[0];

    const client = matchingQuote?.clients || { nome: "Cliente", cognome: "TDA" };
    const nomeRaw = (client.nome || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const cognomeRaw = (client.cognome || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    // Cerca se esiste già un PDF salvato su R2
    const signedPdfs = await Promise.all([
      listPdfsInR2("contratti/wedding/"),
      listPdfsInR2("contratti/eventi/")
    ]).then(([w, e]) => [...(w || []), ...(e || [])]).catch(() => []);

    const matchedPdf = signedPdfs.find(pdf => {
      const keyLower = pdf.key.toLowerCase().replace(/[^a-z0-9]/g, "");
      return (nomeRaw && keyLower.includes(nomeRaw)) || (cognomeRaw && keyLower.includes(cognomeRaw));
    });

    if (matchedPdf?.url) {
      return NextResponse.redirect(matchedPdf.url);
    }

    // Cerca se abbiamo il payload contrattuale completo memorizzato nel DB locale
    const savedContract = getSignedContractLocal(id);
    const contractData = savedContract?.datiCliente || {
      tipo_cliente: 'privato',
      nome: client.nome || 'Sposo',
      cognome: client.cognome || 'TDA',
      codice_fiscale: client.codice_fiscale || 'PPEMRA83L15F205G',
      email: client.email || 'sposi@laterradegliaranci.it',
      telefono: client.telefono || '+39 081 1234567',
      data_evento: matchingQuote.data_evento || '2027-06-18',
      citta_di_residenza: 'Napoli',
      indirizzo: 'Piazzetta Santo Stefano',
      numero_civico: '7',
      accetto: true,
      comunicazione_terzi: true,
      marketing: 'SI'
    };

    const logoSimboloPath = getBase64Image(path.join(process.cwd(), "public", "tda-simbolo.png"));
    const logoRightPath = getBase64Image(path.join(process.cwd(), "public", "logo-testo.png"));
    const firmaRobertoPath = getBase64Image(path.join(process.cwd(), "public", "firma-roberto.png"));
    const firmaRosariaPath = getBase64Image(path.join(process.cwd(), "public", "firma-rosaria.png"));

    const stream = await renderToStream(
      React.createElement(ContractPdfTemplate, {
        tipoContratto: savedContract?.tipoContratto || (matchingQuote.tipo_evento === 'eventi' ? 'eventi' : 'wedding'),
        lang: savedContract?.lingua || 'it',
        data: contractData,
        preventivo: matchingQuote.id ? matchingQuote.id.slice(0, 8) : 'demo',
        prezzo: savedContract?.prezzo || (matchingQuote.totale_calcolato || 15200).toString(),
        firmaContratto: savedContract?.firma_disegnata || '',
        firmaClausole: savedContract?.firma_disegnata_clausole || '',
        logoPath: logoSimboloPath,
        logoRightPath: logoRightPath,
        firmaRobertoPath: firmaRobertoPath,
        firmaRosariaPath: firmaRosariaPath
      })
    );

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="contratto_firmato_${client.cognome || 'tda'}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Errore streaming PDF:", error);
    return new NextResponse("Errore durante il caricamento del documento PDF: " + error.message, { status: 500 });
  }
}
