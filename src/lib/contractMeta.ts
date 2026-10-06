/**
 * contractMeta.ts
 * Testi ufficiali (IT/EN) e helper per la Formula di concessione della location (Art. 2-bis).
 */

export type TipoEsclusiva = "esclusiva" | "semi_esclusiva";
export type ContractLang = "it" | "en";

/** Formula di concessione in uso esclusivo (intera giornata). */
export const FORMULA_ESCLUSIVA_IT =
  "Il complesso 'La Terra degli Aranci' (giardini, sale e parco) è riservato in uso esclusivo al Cliente per l'intera giornata del [data]. Santo Stefano S.r.l. si impegna a non concedere ad altri, nella stessa giornata, alcuno spazio del complesso.";

export const FORMULA_ESCLUSIVA_EN =
  "The 'La Terra degli Aranci' complex (gardens, halls and park) is reserved for the exclusive use of the Client for the entire day of [data]. Santo Stefano S.r.l. undertakes not to grant any space within the complex to any other party on the same day.";

/** Formula di concessione in uso semi-esclusivo (turno + spazi definiti). */
export const FORMULA_SEMI_ESCLUSIVA_IT =
  "Sono riservati in uso esclusivo al Cliente, nel turno [pranzo/cena] del [data], i seguenti spazi: [spazi]. Il Cliente prende atto che le restanti aree potranno ospitare un altro evento, con percorsi e orari organizzati in modo da evitare interferenze. La formula non comprende l'uso degli spazi non indicati.";

export const FORMULA_SEMI_ESCLUSIVA_EN =
  "The following spaces are reserved for the exclusive use of the Client, during the [lunch/dinner] shift on [date]: [spaces]. The Client acknowledges that the remaining areas may host another event, with routes and times arranged so as to avoid interference. This formula does not include the use of the spaces not indicated.";

export const FORMULA_CONCESSIONE: Record<TipoEsclusiva, Record<ContractLang, string>> = {
  esclusiva: {
    it: FORMULA_ESCLUSIVA_IT,
    en: FORMULA_ESCLUSIVA_EN,
  },
  semi_esclusiva: {
    it: FORMULA_SEMI_ESCLUSIVA_IT,
    en: FORMULA_SEMI_ESCLUSIVA_EN,
  },
};

export interface FormulaPlaceholders {
  /** Data dell'evento, già formattata (es. "12/03/2027"). */
  data?: string;
  /** Turno dell'evento (es. "pranzo" o "cena"). */
  turno?: string;
  /** Spazi riservati: array oppure stringa già composta. */
  spazi?: string | string[];
}

/* ------------------------------------------------------------------ */
/* Formule commerciali ufficiali (call 2 Ottobre 2026)                  */
/* ------------------------------------------------------------------ */

/** Canone fisso della Semi-Esclusiva (entrambe le formule). */
export const SEMI_ESCLUSIVA_PREZZO = 7000;

/** Esclusiva Villa: tariffa base a persona (+ IVA). */
export const ESCLUSIVA_TARIFFA_100_PLUS = 130; // minimo 100 persone
export const ESCLUSIVA_TARIFFA_70_99 = 140; // gruppi da 70 a 99 persone

export type SemiFormulaKey = "sala_bianca" | "sala_tufo";

export interface SemiFormulaDef {
  key: SemiFormulaKey;
  label: string;
  /** Giardino di pertinenza, per descrizione. */
  giardino: string;
  /** Spazi riservati (devono restare disgiunti fra le due formule: servono al controllo conflitti). */
  spazi: string[];
}

export const SEMI_ESCLUSIVA_FORMULE: Record<SemiFormulaKey, SemiFormulaDef> = {
  sala_bianca: {
    key: "sala_bianca",
    label: "Sala Bianca e relativi giardini",
    giardino: "Giardino Mediterraneo / Agrumeto",
    spazi: ["Sala Bianca", "Giardino Mediterraneo (Agrumeto)"],
  },
  sala_tufo: {
    key: "sala_tufo",
    label: "Sala Tufo e relativi giardini",
    giardino: "Giardino delle Promesse",
    spazi: ["Sala Tufo", "Giardino delle Promesse"],
  },
};

/** Riconosce se uno spazio appartiene al lato Tufo (Sala Tufo / Giardino delle Promesse). */
export function isTufoSide(spazio: string): boolean {
  return /tufo|promesse/i.test(String(spazio));
}

/** Ricava la formula semi-esclusiva a partire dagli spazi riservati (se riconoscibile). */
export function detectSemiFormula(spazi?: string[] | null): SemiFormulaKey | "" {
  const list = (spazi || []).map((s) => String(s));
  if (list.length === 0) return "";
  const tufo = list.some(isTufoSide);
  const other = list.some((s) => !isTufoSide(s));
  if (tufo && !other) return "sala_tufo";
  if (other && !tufo) return "sala_bianca";
  return "";
}

/** Normalizza un tipo formula, con fallback conservativo su "semi_esclusiva". */
export function normalizeTipoEsclusiva(tipo?: string | null): TipoEsclusiva {
  const value = String(tipo ?? "").trim().toLowerCase().replace(/-/g, "_");
  return value === "esclusiva" ? "esclusiva" : "semi_esclusiva";
}

/** Restituisce il testo ufficiale (non formattato) della formula richiesta. */
export function getFormulaConcessione(
  tipo: TipoEsclusiva | string,
  lang: ContractLang = "it"
): string {
  const key = normalizeTipoEsclusiva(tipo);
  const dict = FORMULA_CONCESSIONE[key];
  return dict[lang] ?? dict.it;
}

/** Compone l'elenco spazi in una stringa leggibile. */
function normalizeSpazi(spazi?: string | string[]): string | undefined {
  if (spazi == null) return undefined;
  if (Array.isArray(spazi)) return spazi.map((s) => String(s).trim()).filter(Boolean).join(", ");
  return String(spazi);
}

/**
 * Sostituisce i segnaposto presenti in un template.
 * I segnaposto senza valore associato vengono lasciati invariati.
 */
export function applyPlaceholders(
  template: string,
  values: FormulaPlaceholders
): string {
  const data = values.data;
  const turno = values.turno;
  const spazi = normalizeSpazi(values.spazi);

  return template
    .replace(/\[data\]/gi, data != null ? String(data) : "[data]")
    .replace(/\[date\]/gi, data != null ? String(data) : "[date]")
    .replace(/\[turno\]/gi, turno != null ? String(turno) : "[turno]")
    .replace(/\[pranzo\/cena\]/gi, turno != null ? String(turno) : "[pranzo/cena]")
    .replace(/\[lunch\/dinner\]/gi, turno != null ? String(turno) : "[lunch/dinner]")
    .replace(/\[spazi\]/gi, spazi != null ? spazi : "[spazi]")
    .replace(/\[spaces\]/gi, spazi != null ? spazi : "[spaces]");
}

/**
 * Restituisce il testo ufficiale della formula con i segnaposto già valorizzati.
 */
export function formatFormulaConcessione(
  tipo: TipoEsclusiva | string,
  values: FormulaPlaceholders,
  lang: ContractLang = "it"
): string {
  return applyPlaceholders(getFormulaConcessione(tipo, lang), values);
}
