import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { ContractPdfTemplate } from "@/lib/pdf/ContractPdfTemplate";
import { uploadPdfToR2, uploadJsonToR2 } from "@/lib/r2";
import { getServiceSupabase } from "@/lib/supabase";
import { updateQuoteStatusLocalByPrefix, saveSignedContractLocal, freezeInstallmentsLocalByPrefix, getFinalContractByQuoteLocal, getAllQuotesLocal } from "@/lib/localDb";
import { generateSignature } from "@/lib/crypto";
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

    // ------------------------------------------------------------------
    // SICUREZZA ENDPOINT (S1 + S2) — PRIMA di qualsiasi effetto collaterale
    // ------------------------------------------------------------------
    const preventivo = String(body.preventivo || "");
    const allQuotes = getAllQuotesLocal();
    const matchingQuote = preventivo
      ? allQuotes.find(q => String(q.id || "").toLowerCase().startsWith(preventivo.toLowerCase()))
      : undefined;

    // S1: un contratto definitivo (Fase 2) è già stato formalizzato per questo
    // preventivo. Rigenerare il PDF Fase 1 lo sovrascriverebbe: blocchiamo.
    if (preventivo && getFinalContractByQuoteLocal(preventivo)) {
      return NextResponse.json(
        { success: false, error: "Contratto definitivo già formalizzato per questo evento" },
        { status: 409 }
      );
    }

    // S2: firma HMAC del link. Con transizione morbida per le bozze preesistenti
    // già aperte nel browser (prive di `sig`), ammesse solo se il prezzo coincide
    // con quello del preventivo salvato in localDb.
    const expectedSig = generateSignature(String(body.prezzo ?? ""), preventivo);
    const providedSig = typeof body.sig === "string" ? body.sig : "";

    if (providedSig) {
      if (providedSig !== expectedSig) {
        return NextResponse.json(
          { success: false, error: "Firma di sicurezza non valida o manomessa" },
          { status: 403 }
        );
      }
    } else {
      const bodyPrice = Number(body.prezzo);
      const quotePrice = matchingQuote
        ? Number(matchingQuote.prezzo ?? matchingQuote.totale ?? matchingQuote.totale_calcolato)
        : NaN;
      const priceMatches =
        matchingQuote != null &&
        Number.isFinite(bodyPrice) &&
        Number.isFinite(quotePrice) &&
        Math.abs(quotePrice - bodyPrice) < 0.005;

      if (!priceMatches) {
        return NextResponse.json(
          { success: false, error: "Firma di sicurezza non valida o manomessa" },
          { status: 403 }
        );
      }
      console.warn(
        "[generate-pdf] Firma `sig` assente: completamento consentito per bozza preesistente con prezzo coincidente.",
        { preventivo, prezzo: bodyPrice }
      );
    }

    // Art. 2-bis: recupera dal preventivo locale i metadati di concessione
    // (tipo_esclusiva, spazi_riservati, turno) se non già presenti nel body.
    if (!body.datiCliente) body.datiCliente = {};
    if (matchingQuote) {
      if (body.datiCliente.tipo_esclusiva == null) {
        body.datiCliente.tipo_esclusiva = matchingQuote.tipo_esclusiva;
      }
      if (body.datiCliente.spazi_riservati == null) {
        body.datiCliente.spazi_riservati =
          matchingQuote.spazi_riservati ?? matchingQuote.spazi_selezionati;
      }
      if (body.datiCliente.turno == null) {
        body.datiCliente.turno = matchingQuote.turno ?? matchingQuote.turno_evento;
      }
    }

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

    // Carica direttamente su Cloudflare R2.
    // In produzione (Vercel) un disallineamento della chiave segreta R2 provoca
    // `SignatureDoesNotMatch`: l'upload NON deve far fallire l'intera API.
    // In tal caso usiamo un URL di fallback e proseguiamo comunque con firma,
    // salvataggio locale e aggiornamento stato (il contratto deve salvarsi sempre).
    let fileUrl = "";
    try {
      fileUrl = await uploadPdfToR2(pdfBuffer, fileName);
    } catch (r2Err: any) {
      console.error("[generate-pdf] Errore upload R2:", r2Err?.message || r2Err);
      // Fallback: URL pubblico deterministico sul bucket R2 (fileUrl di emergenza)
      fileUrl = `https://pub-ace85c0d97114c1a980199bf8afb379b.r2.dev/${fileName}`;
    }

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
