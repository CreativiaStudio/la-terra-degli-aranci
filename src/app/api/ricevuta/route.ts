import { NextRequest, NextResponse } from "next/server";
import React from "react";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { renderToStream } from "@react-pdf/renderer";
import * as QRCode from "qrcode";
import { ReceiptPdfTemplate } from "@/lib/pdf/ReceiptPdfTemplate";
import { getQuoteLocal, getAllQuotesLocal } from "@/lib/localDb";
import { isoToItalian } from "@/lib/dateInput";

export const dynamic = "force-dynamic";

/**
 * Endpoint di download della Quietanza di Pagamento / Ricevuta Acconto.
 *
 * GET /api/ricevuta?quoteId=<id>&step=<1|2|3>&importo=<numero>
 */

const DEMO_ID = "demo-firmato";

// Dati demo degli sposi con contratto firmato (usati quando il preventivo non è trovato).
const DEMO = {
  clientName: "Marco Rossi & Sofia Esposito",
  eventType: "Matrimonio",
  eventDate: "2027-06-18",
  total: 15200,
  caparra: 1500,
  secondo: 3000,
};

/** Formatta una data ISO (o già italiana) in formato italiano "gg/mm/aaaa". */
function toItalianDate(value: any): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  const iso = raw.slice(0, 10);
  return isoToItalian(iso) || raw;
}

/** Formatta la data odierna in italiano, in modo deterministico (nessuno shift di timezone). */
function formatTodayItalian(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${now.getFullYear()}`;
}

/** Legge un'immagine statica e la converte in data URI (o null se assente illeggibile). */
function getBase64Image(filePath: string): string | null {
  try {
    const bitmap = fs.readFileSync(filePath);
    const base64 = Buffer.from(bitmap).toString("base64");
    const ext = path.extname(filePath).substring(1);
    return `data:image/${ext};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const quoteId = (searchParams.get("quoteId") || DEMO_ID).trim() || DEMO_ID;
    const stepRaw = Number(searchParams.get("step") || "1");
    const step = [1, 2, 3].includes(stepRaw) ? stepRaw : 1;

    const importoRaw = searchParams.get("importo");
    const parsedImporto = importoRaw != null ? Number(importoRaw) : NaN;
    const hasCustomImporto = Number.isFinite(parsedImporto) && parsedImporto > 0;

    // ---------------------------------------------------------------
    // Recupero del preventivo: exact match, poi per prefisso, poi demo.
    // ---------------------------------------------------------------
    let quote: any = null;
    if (quoteId !== DEMO_ID) {
      quote = getQuoteLocal(quoteId);
      if (!quote) {
        const prefix = quoteId.toLowerCase();
        quote = getAllQuotesLocal().find((q) => String(q.id || "").toLowerCase().startsWith(prefix)) || null;
      }
    }

    const isDemo = !quote;
    const clientName = quote?.clients?.nome
      ? `${quote.clients.nome} ${quote.clients.cognome || ""}`.trim()
      : DEMO.clientName;

    const tipoEventoRaw = String(quote?.tipo_evento || "").toLowerCase();
    const eventType = isDemo ? DEMO.eventType : tipoEventoRaw === "eventi" ? "Evento Privato" : "Matrimonio";

    const eventDateIso = String(quote?.data_evento || DEMO.eventDate).slice(0, 10);
    const eventDate = toItalianDate(quote?.data_evento || DEMO.eventDate) || toItalianDate(DEMO.eventDate);

    const totalAgreedRaw = Number(
      quote?.totale_calcolato ?? quote?.prezzo ?? quote?.totale ?? (isDemo ? DEMO.total : 0)
    );
    const totalAgreed = Number.isFinite(totalAgreedRaw) && totalAgreedRaw > 0 ? totalAgreedRaw : DEMO.total;

    const caparra = Number(
      quote?.importo_caparra ?? (isDemo ? DEMO.caparra : Math.min(1500, totalAgreed))
    ) || 0;
    const secondo = Number(
      quote?.importo_secondo_acconto ?? (isDemo ? DEMO.secondo : Math.min(3000, Math.max(0, totalAgreed - caparra)))
    ) || 0;
    const saldo = Math.max(0, totalAgreed - caparra - secondo);

    // ---------------------------------------------------------------
    // Importo quietanzato in base allo step.
    // ---------------------------------------------------------------
    const stepDefaultAmount = step === 1 ? caparra : step === 2 ? secondo : saldo;
    const amount = hasCustomImporto ? parsedImporto : stepDefaultAmount;

    const totalPaid = step === 1 ? amount : step === 2 ? caparra + amount : totalAgreed;
    const residual = Math.max(0, totalAgreed - totalPaid);

    const description =
      step === 1
        ? "Caparra confirmatoria / 1° Acconto per il blocco irrevocabile della data e location La Terra degli Aranci"
        : step === 2
          ? "2° Acconto per il blocco irrevocabile della data e location La Terra degli Aranci"
          : "Saldo finale per il ricevimento presso la location La Terra degli Aranci";

    const issuingCompany =
      step === 1 ? "Tenuta Santo Stefano S.r.l." : "Iovino Banqueting S.r.l.";

    const eventYearMatch = /^(\d{4})/.exec(eventDateIso);
    const eventYear = eventYearMatch ? eventYearMatch[1] : String(new Date().getFullYear());
    const receiptNumber = `REC-${eventYear}-${String(step).padStart(3, "0")}`;

    // Hash univoco di verifica (deterministico rispetto a preventivo/step/importo).
    const verificationHash = crypto
      .createHash("sha256")
      .update(`${quoteId}|${step}|${amount}|${eventDateIso}`)
      .digest("hex")
      .slice(0, 20)
      .toUpperCase();
    const passToken = crypto
      .createHash("sha256")
      .update(`PASS|${verificationHash}|TDA`)
      .digest("hex")
      .slice(0, 12)
      .toUpperCase();

    // QR pass token opzionale: se la libreria fallisce, il PDF include comunque l'hash.
    let qrDataUrl: string | null = null;
    try {
      const verifyUrl = `https://laterradegliaranci.it/verifica/ricevuta?rif=${encodeURIComponent(
        receiptNumber
      )}&hash=${verificationHash}`;
      qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 160 });
    } catch (qrErr) {
      console.warn("[ricevuta] QR generation failed:", qrErr);
      qrDataUrl = null;
    }

    const logoPath = getBase64Image(path.join(process.cwd(), "public", "tda-simbolo.png"));
    const logoRightPath = getBase64Image(path.join(process.cwd(), "public", "logo-testo.png"));

    const stream = await renderToStream(
      React.createElement(ReceiptPdfTemplate, {
        receiptNumber,
        emissionDate: formatTodayItalian(),
        clientName,
        eventType,
        eventDate,
        step,
        description,
        issuingCompany,
        amount,
        paymentMethod: "Bonifico Bancario / Ricevuto",
        status: "REGOLARMENTE SALDATO & QUIETANZATO",
        totalAgreed,
        totalPaid,
        residual,
        verificationHash,
        passToken,
        qrDataUrl,
        logoPath,
        logoRightPath,
      })
    );

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    const safeRef = quoteId.slice(0, 8).replace(/[^a-zA-Z0-9-]/g, "") || "demo";

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Ricevuta_Acconto_TDA_${safeRef}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("[ricevuta] Errore generazione PDF:", error);
    return new NextResponse("Errore durante la generazione della ricevuta: " + (error?.message || "errore"), {
      status: 500,
    });
  }
}
