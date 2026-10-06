/**
 * dateInput.ts
 * Helper per l'input e la conversione delle date in formato italiano (gg/mm/aaaa).
 *
 * INVARIANTE: la conversione ISO <-> italiano avviene SEMPRE tramite manipolazione
 * di stringhe. Mai `new Date()` per convertire, così da evitare qualsiasi timezone shift.
 */

/** Anno minimo di età accettato per un contraente (in anni). */
export const MIN_AGE_YEARS = 16;
/** Anno massimo di età accettato per un contraente (in anni). */
export const MAX_AGE_YEARS = 110;

/** Anno bisestile (regola gregoriana). */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Numero di giorni del mese (1-12) per l'anno indicato. */
export function daysInMonth(month: number, year: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

/**
 * Verifica che una terna giorno/mese/anno rappresenti una data reale ed esistente.
 * Esclude ad esempio 31/02, 29/02 in anni non bisestili, mese 13, giorno 0, ecc.
 */
export function isValidDateParts(day: number, month: number, year: number): boolean {
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return false;
  if (year < 1 || month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(month, year)) return false;
  return true;
}

/**
 * Maschera di input per le date italiane.
 * Rimuove i caratteri non numerici, taglia a 8 cifre e inserisce automaticamente
 * gli slash: "12031975" -> "12/03/1975".
 */
export function maskItalianDate(raw: string): string {
  const digits = String(raw ?? "").replace(/\D/g, "").slice(0, 8);
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length > 2) parts.push(digits.slice(2, 4));
  if (digits.length > 4) parts.push(digits.slice(4, 8));
  return parts.join("/");
}

/**
 * Valida una data in formato gg/mm/aaaa e la converte in ISO (yyyy-mm-dd).
 *
 * Controlli rigorosi:
 *  - formato esatto gg/mm/aaaa;
 *  - data reale ed esistente (esclude 31/02, 29/02 non bisestile, ecc.);
 *  - anno compreso tra (annoCorrente - 110) e (annoCorrente - 16) inclusi.
 *
 * Restituisce "yyyy-mm-dd" se valida, altrimenti `null`.
 */
export function italianToIso(v: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(v ?? "").trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (!isValidDateParts(day, month, year)) return null;

  const currentYear = new Date().getFullYear();
  if (year < currentYear - MAX_AGE_YEARS || year > currentYear - MIN_AGE_YEARS) return null;

  return `${match[3]}-${match[2]}-${match[1]}`;
}

/**
 * Converte una data ISO (yyyy-mm-dd) in formato italiano (gg/mm/aaaa).
 * La conversione è puramente testuale per evitare timezone shift.
 * Restituisce stringa vuota se il valore non è una data yyyy-mm-dd valida.
 */
export function isoToItalian(iso?: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? "").trim());
  if (!match) return "";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!isValidDateParts(day, month, year)) return "";

  return `${match[3]}/${match[2]}/${match[1]}`;
}
