/**
 * Utility condivise per i contratti di firma (Wedding / Eventi):
 * - normalizzazione della data evento per l'input `datetime-local`
 * - calcolo degli importi (canone, caparra, 2° acconto, saldo) e della data 2° acconto
 * - formattazione italiana di importi e date + etichette turno e metodi di pagamento
 *
 * Il modulo è PURO (nessuna dipendenza server/client) così da poter essere importato
 * sia dai Server Component (page.tsx) sia dai Client Component (i form di firma).
 */

export type Turno = "pranzo" | "cena";
export type ContractKind = "wedding" | "eventi";

export const PAYMENT_METHODS = [
  "Bonifico Bancario",
  "Carta di Credito / Bancomat",
  "Assegno Circolare / Bancario",
  "Contanti (in sede nei limiti di legge)",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const PAYMENT_METHODS_EN: Record<string, string> = {
  "Bonifico Bancario": "Bank Transfer",
  "Carta di Credito / Bancomat": "Credit / Debit Card",
  "Assegno Circolare / Bancario": "Bank / Cashier's Check",
  "Contanti (in sede nei limiti di legge)": "Cash (on site, within legal limits)",
};

/** Normalizza il turno proveniente da qualsiasi forma del preventivo. */
export function resolveTurno(quote: any): Turno {
  const raw =
    quote?.turno ??
    quote?.turno_evento ??
    quote?.opzione?.turno ??
    "pranzo";
  return String(raw).toLowerCase() === "cena" ? "cena" : "pranzo";
}

/** Orario convenzionale associato al turno (usato per completare le date prive di orario). */
export function turnoTime(turno: Turno): string {
  return turno === "cena" ? "19:30" : "12:30";
}

/**
 * Converte un valore `data_evento` nel formato richiesto da `<input type="datetime-local">`.
 * - Se contiene già l'orario (ISO con "T"), lo mantiene (troncando ai minuti).
 * - Se è solo una data ("YYYY-MM-DD"), aggiunge l'orario convenzionale del turno.
 */
export function normalizeEventDateTime(value: any, turno: Turno = "pranzo"): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (raw.includes("T")) {
    const [datePart, timePart = ""] = raw.split("T");
    const cleanDate = datePart.slice(0, 10);
    const cleanTime = timePart.slice(0, 5);
    const time = /^\d{2}:\d{2}$/.test(cleanTime) ? cleanTime : turnoTime(turno);
    return cleanDate ? `${cleanDate}T${time}` : "";
  }

  const dateOnly = raw.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return "";
  return `${dateOnly}T${turnoTime(turno)}`;
}

/** Sottrae sei mesi a una data ISO, con clamp sull'ultimo giorno del mese di destinazione. */
export function sixMonthsBefore(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoDate || ""));
  if (!match) return "";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return "";

  let targetYear = year;
  let targetMonth = month - 6;
  while (targetMonth <= 0) {
    targetMonth += 12;
    targetYear -= 1;
  }

  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const targetDay = Math.min(day, lastDay);
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
}

/**
 * Estrae un anno a 4 cifre da un codice preventivo/sessione (es. "TDA-2027-089" -> 2027).
 * Restituisce `null` se non trova un anno plausibile.
 */
export function extractYearFromCode(code: string | null | undefined): number | null {
  const match = /(\d{4})/.exec(String(code ?? ""));
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) && year > 1900 ? year : null;
}

/**
 * Data evento di default quando il preventivo non è trovato o non ha una data.
 * Usa l'anno del codice preventivo se plausibile (>= anno corrente), altrimenti
 * l'anno successivo. In nessun caso produce date nel passato remoto (es. 1983).
 */
export function defaultEventDate(
  preventivo: string | null | undefined,
  todayIso: string
): string {
  const currentYear = Number(String(todayIso || "").slice(0, 4)) || new Date().getUTCFullYear();
  const codeYear = extractYearFromCode(preventivo);
  const year = codeYear && codeYear >= currentYear ? codeYear : currentYear + 1;
  return `${year}-06-15`;
}

export interface DerivedPaymentDates {
  dataAnticipo: string;
  dataSecondoAcconto: string;
  dataSaldo: string;
}

/**
 * RELAZIONE DETERMINISTICA tra le date economiche e la data evento:
 * - Anticipo/Caparra = data odierna (giorno della firma del contratto).
 * - Saldo Canone    = data dell'evento (stesso giorno, parte YYYY-MM-DD).
 * - 2° Acconto      = sei mesi prima della data dell'evento.
 * Non legge MAI da bozze locali o da campi diversi dalla data evento.
 */
export function derivePaymentDates(
  dataEventoIso: string,
  todayIso: string
): DerivedPaymentDates {
  const evento = String(dataEventoIso || "").slice(0, 10);
  const validEvento = /^\d{4}-\d{2}-\d{2}$/.test(evento) ? evento : "";
  return {
    dataAnticipo: todayIso,
    dataSecondoAcconto: validEvento ? sixMonthsBefore(validEvento) : "",
    dataSaldo: validEvento || todayIso,
  };
}

/**
 * Campi di bozza ammessi: SOLO dati anagrafici compilati dal Cliente e il metodo
 * di pagamento scelto. Mai date economiche, importi o data evento.
 */
export const DRAFT_ALLOWED_FIELDS = [
  "tipo_cliente",
  "nazione",
  "nome",
  "cognome",
  "ragione_sociale",
  "luogo_di_nascita",
  "data_di_nascita",
  "citta_di_residenza",
  "indirizzo",
  "numero_civico",
  "cap",
  "codice_fiscale",
  "partita_iva",
  "sdi",
  "telefono",
  "email",
  "pec",
  "sposera_nome",
  "sposera_cognome",
  "tipo_evento",
  "accetto",
  "comunicazione_terzi",
  "marketing",
  "mezzo_anticipo",
  "mezzo_secondo_acconto",
  "mezzo_saldo",
] as const;

/**
 * Ripulisce una bozza locale: rimuove QUALSIASI campo economico, importo,
 * data evento/anticipo/2° acconto/saldo. La bozza può contenere esclusivamente
 * dati anagrafici del Cliente e il metodo di pagamento scelto.
 */
export function sanitizeDraft(fields: any): Record<string, any> {
  const out: Record<string, any> = {};
  if (!fields || typeof fields !== "object") return out;
  for (const key of DRAFT_ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(fields, key) && fields[key] !== undefined) {
      out[key] = fields[key];
    }
  }
  return out;
}

export interface ContractFinancials {
  prezzoTotale: number;
  caparra: number;
  secondoAcconto: number;
  saldo: number;
  dataSecondoAcconto: string;
}

/**
 * Calcola il piano di pagamento concordato con la direzione.
 * Regole:
 * - Canone totale: parametro `prezzo` (se valido) altrimenti prezzo del preventivo.
 * - Caparra: `importo_caparra` del preventivo oppure €1.500, mai oltre il canone.
 * - 2° acconto: `importo_secondo_acconto` del preventivo oppure €3.000 (wedding) / €0 (eventi),
 *   sempre entro il residuo disponibile.
 * - Saldo: differenza residua.
 * - Data 2° acconto: 6 mesi prima dell'evento (solo se il 2° acconto è dovuto).
 */
export function computeContractFinancials(
  quote: any,
  prezzoParam: string | number | null | undefined,
  kind: ContractKind
): ContractFinancials {
  const paramNum = Number(prezzoParam);
  const quotePrice = Number(quote?.prezzo ?? quote?.totale ?? quote?.totale_calcolato);
  const prezzoTotale =
    Number.isFinite(paramNum) && paramNum > 0
      ? paramNum
      : Number.isFinite(quotePrice) && quotePrice > 0
        ? quotePrice
        : 0;

  const caparraRaw = Number(quote?.importo_caparra ?? 1500);
  const caparra = Math.max(
    0,
    Math.min(Number.isFinite(caparraRaw) ? caparraRaw : 0, prezzoTotale)
  );

  let secondoRaw: number;
  if (quote?.importo_secondo_acconto != null && Number.isFinite(Number(quote.importo_secondo_acconto))) {
    secondoRaw = Number(quote.importo_secondo_acconto);
  } else {
    secondoRaw = kind === "wedding" ? 3000 : 0;
  }

  const residuo = Math.max(0, prezzoTotale - caparra);
  const secondoAcconto = prezzoTotale > caparra ? Math.max(0, Math.min(secondoRaw, residuo)) : 0;
  const saldo = Math.max(0, prezzoTotale - caparra - secondoAcconto);

  const dataEventoIso = quote?.data_evento ? String(quote.data_evento).slice(0, 10) : "";
  const dataSecondoAcconto =
    secondoAcconto > 0 && dataEventoIso ? sixMonthsBefore(dataEventoIso) : "";

  return { prezzoTotale, caparra, secondoAcconto, saldo, dataSecondoAcconto };
}

/** Formattazione euro deterministica (immune a differenze di locale tra server e client). */
export function formatEuro(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const fixed = (Math.round(safe * 100) / 100).toFixed(2);
  const [integerPart, decimalPart] = fixed.split(".");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `€ ${grouped},${decimalPart}`;
}

const MESI_IT = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

/** Formatta una data ISO ("YYYY-MM-DD" o "YYYY-MM-DDTHH:mm") in italiano: "20 Dicembre 2026". */
export function formatItalianDate(value: any): string {
  const raw = String(value ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) return "";
  const day = Number(match[3]);
  const month = MESI_IT[Number(match[2]) - 1] ?? "";
  if (!month) return "";
  return `${day} ${month} ${match[1]}`;
}

/** Etichetta del turno con orario convenzionale, localizzata. */
export function turnoLabel(turno: string, lang: "it" | "en" = "it"): string {
  const isCena = String(turno).toLowerCase() === "cena";
  if (lang === "en") {
    return isCena ? "Dinner (7:30 PM)" : "Lunch (12:30 PM)";
  }
  return isCena ? "Cena (ore 19:30)" : "Pranzo (ore 12:30)";
}

/** Etichetta del metodo di pagamento, localizzata per il PDF. */
export function paymentMethodLabel(method: string | undefined | null, lang: "it" | "en" = "it"): string {
  const value = String(method || "Bonifico Bancario").trim() || "Bonifico Bancario";
  if (lang === "en") return PAYMENT_METHODS_EN[value] || value;
  return value;
}
