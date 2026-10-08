"use server";

import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { generateSignature } from "@/lib/crypto";
import { checkSlotAvailability, normalizeEventDate } from "@/lib/slotAvailability";
import { saveAdminQuickQuoteLocal, markQuickOptionConvertedLocal } from "@/lib/localDb";
import { saveContractToVault } from "@/lib/contractVault";
import { isoToItalian } from "@/lib/dateInput";
import { detectSemiFormula, SEMI_ESCLUSIVA_FORMULE } from "@/lib/contractMeta";

interface QuickContractInput {
  nome: string;
  cognome: string;
  telefono: string;
  email: string;
  partnerNome?: string;
  partnerCognome?: string;
  tipoEvento: "wedding" | "eventi";
  dataEvento: string;
  turno: "pranzo" | "cena";
  tipoEsclusiva: "esclusiva" | "semi_esclusiva";
  spaziRiservati?: string[];
  prezzo: number;
  note?: string;
  tipoCliente?: "privato" | "azienda";
  ragioneSociale?: string;
  partitaIva?: string;
  codiceFiscale?: string;
  sdi?: string;
  pec?: string;
  caparraPersonalizzata?: number;
  secondoAccontoPersonalizzato?: number;
  /** Id dell'opzione rapida da calendario che viene formalizzata con questo contratto. */
  opzioneDaConvertireId?: string;
}

/** Importi standard degli acconti TDA. */
const CAPARRA_STANDARD = 1500;
const SECONDO_ACCONTO_STANDARD = 3000;

function formatEuro(value: number): string {
  return new Intl.NumberFormat("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    Math.max(0, Math.round(value))
  );
}

function formatEventDate(value: string): string {
  const iso = normalizeEventDate(value);
  if (iso) return isoToItalian(iso) || iso;
  return String(value || "").trim();
}

function buildWhatsAppText(params: {
  nome: string;
  dataEvento: string;
  turno: string;
  tipoEsclusiva: string;
  spaziRiservati?: string[];
  prezzo: number;
  caparra: number;
  secondoAcconto: number;
  saldo: number;
  absoluteUrl: string;
}): string {
  const semiKey = detectSemiFormula(params.spaziRiservati);
  const formula =
    params.tipoEsclusiva === "esclusiva"
      ? "Esclusiva (intera giornata)"
      : semiKey
        ? `Semi-esclusiva · ${SEMI_ESCLUSIVA_FORMULE[semiKey].label} (turno ${params.turno})`
        : `Semi-esclusiva (turno ${params.turno})`;

  const righe = [
    `Ciao ${params.nome}, ecco il riepilogo del contratto presso La Terra degli Aranci:`,
    "",
    `📅 Data evento: ${params.dataEvento}`,
    `⏰ Turno: ${params.turno}`,
    `🏛️ Formula: ${formula}`,
  ];

  if (params.spaziRiservati && params.spaziRiservati.length > 0) {
    righe.push(`📍 Spazi riservati: ${params.spaziRiservati.join(", ")}`);
  }

  righe.push(
    `💶 Canone fitto location: € ${formatEuro(params.prezzo)} (100% Santo Stefano Srl)`,
    `🔒 Caparra confirmatoria (alla firma): € ${formatEuro(params.caparra)}`
  );

  if (params.secondoAcconto > 0) {
    righe.push(`📆 2° acconto (a -6 mesi dall'evento): € ${formatEuro(params.secondoAcconto)}`);
  }

  righe.push(
    `💳 Saldo (all'evento): € ${formatEuro(params.saldo)}`,
    "",
    "Firma il contratto digitale qui:",
    params.absoluteUrl
  );

  return righe.join("\n");
}

function getBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.APP_URL ||
    "https://ecosistema.laterradegliaranci.it";
  return String(configured).replace(/\/+$/, "");
}

/**
 * Crea in un click un preventivo formale + contratto digitale per un accordo diretto
 * preso in sede dall'admin (canale "accordo_diretto").
 *
 * Restituisce il link crittografato firmato, il QR code pronto per la stampa e il
 * testo WhatsApp da inviare alla coppia.
 */
export async function createQuickContract(data: QuickContractInput) {
  try {
    // 1. Verifica disponibilità di data/turno/spazi
    const availability = checkSlotAvailability(
      data.dataEvento,
      data.turno,
      data.tipoEsclusiva,
      data.spaziRiservati,
      data.opzioneDaConvertireId
    );

    if (!availability.available) {
      return {
        success: false as const,
        error: availability.conflictReason || "Slot non disponibile per la data selezionata.",
      };
    }

    const isAzienda = data.tipoCliente === "azienda";
    if (isAzienda && !String(data.ragioneSociale || "").trim()) {
      return { success: false as const, error: "Inserisci la Ragione Sociale dell'azienda." };
    }

    const prezzo = Number(data.prezzo) || 0;
    const prezzoStr = String(prezzo);

    // Acconti: valori personalizzati da Roberto oppure standard TDA.
    const caparra =
      typeof data.caparraPersonalizzata === "number" && Number.isFinite(data.caparraPersonalizzata)
        ? Math.max(0, data.caparraPersonalizzata)
        : Math.min(CAPARRA_STANDARD, prezzo);
    const secondoAcconto =
      typeof data.secondoAccontoPersonalizzato === "number" && Number.isFinite(data.secondoAccontoPersonalizzato)
        ? Math.max(0, data.secondoAccontoPersonalizzato)
        : data.tipoEvento === "wedding"
          ? Math.min(SECONDO_ACCONTO_STANDARD, Math.max(0, prezzo - caparra))
          : 0;

    if (caparra + secondoAcconto > prezzo) {
      return {
        success: false as const,
        error: "La somma di caparra e 2° acconto supera il prezzo concordato: correggi gli importi.",
      };
    }
    const saldo = Math.max(0, prezzo - caparra - secondoAcconto);

    // Opzione tecnica di 7 giorni: mantiene la data bloccata fino alla firma.
    const now = new Date();
    const scadenza = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const opzione = {
      attiva: true,
      tipo: data.tipoEsclusiva,
      data_inizio: now.toISOString(),
      scadenza: scadenza.toISOString(),
      turno: data.turno,
      spazi: data.spaziRiservati || [],
      canale: "accordo_diretto",
    };

    // Voce di contratto: Canone Fitto Struttura (split 100% Santo Stefano).
    const items = [
      {
        id: Date.now(),
        descrizione: "Canone Fitto Struttura",
        quantita: 1,
        prezzo_unitario: prezzo,
        splitKey: "ss100",
        totale: prezzo,
      },
    ];

    const normalizedDate = normalizeEventDate(data.dataEvento) || data.dataEvento;

    // 2. Cliente + preventivo formale
    const { quoteId, quote, client } = saveAdminQuickQuoteLocal({
      cliente: {
        nome: data.nome,
        cognome: data.cognome,
        email: data.email,
        telefono: data.telefono,
        partnerNome: data.partnerNome,
        partnerCognome: data.partnerCognome,
        codice_fiscale: data.codiceFiscale,
      },
      tipo_cliente: isAzienda ? "azienda" : "privato",
      ragione_sociale: data.ragioneSociale,
      partita_iva: data.partitaIva,
      sdi: data.sdi,
      pec: data.pec,
      tipo_evento: data.tipoEvento,
      data_evento: normalizedDate,
      turno: data.turno,
      tipo_esclusiva: data.tipoEsclusiva,
      spazi_riservati: data.spaziRiservati || [],
      canale_contratto: "accordo_diretto",
      source: "admin_rapido",
      fase_contratto: "accordo_diretto",
      prezzo,
      items,
      note: data.note,
      opzione,
      importo_caparra: caparra,
      importo_secondo_acconto: secondoAcconto,
    });

    // Se il contratto formalizza un'opzione rapida da calendario, la chiude collegandola al nuovo preventivo.
    if (data.opzioneDaConvertireId) {
      markQuickOptionConvertedLocal(data.opzioneDaConvertireId, quoteId);
      revalidatePath("/admin/calendario");
    }

    // Blindatura multi-posizione: snapshot atomico del contratto appena generato.
    saveContractToVault(quoteId, {
      quote,
      client,
      canale: "accordo_diretto",
      tipoEvento: data.tipoEvento,
      generated_at: new Date().toISOString(),
    }, "quick_action");

    // Invariante 2: il numero preventivo è il prefisso dell'id.
    const preventivo = quote.id.slice(0, 8);

    // Invariante 1: la firma del link è calcolata sui dati contrattuali.
    const sig = generateSignature(prezzoStr, preventivo);

    const url = `/contratti/${data.tipoEvento}?prezzo=${prezzoStr}&preventivo=${preventivo}&sig=${sig}`;
    const absoluteUrl = `${getBaseUrl()}${url}`;

    // 3. QR code come data URL base64
    const qrCodeDataUrl = await QRCode.toDataURL(absoluteUrl, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    // 4. Messaggio WhatsApp pronto per l'invio
    const whatsappText = buildWhatsAppText({
      nome: data.nome,
      dataEvento: formatEventDate(data.dataEvento),
      turno: data.turno,
      tipoEsclusiva: data.tipoEsclusiva,
      spaziRiservati: data.spaziRiservati,
      prezzo,
      caparra,
      secondoAcconto,
      saldo,
      absoluteUrl,
    });

    return {
      success: true as const,
      url,
      absoluteUrl,
      qrCodeDataUrl,
      preventivo,
      sig,
      whatsappText,
      caparra,
      secondoAcconto,
      saldo,
      quoteId,
    };
  } catch (error) {
    console.error("Errore createQuickContract:", error);
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Errore durante la creazione del contratto rapido.",
    };
  }
}
