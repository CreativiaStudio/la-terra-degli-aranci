/**
 * Helper per la validazione e normalizzazione rigorosa dei numeri di telefono
 * per l'Ecosistema La Terra degli Aranci (formato standard internazionale E.164).
 */

export interface PhoneNormalizationResult {
  valid: boolean;
  raw: string;
  normalized: string; // es: '+393334604065'
  display: string;    // es: '+39 333 460 4065'
  error?: string;
}

export function normalizePhoneNumber(rawInput: string): PhoneNormalizationResult {
  const raw = (rawInput || '').trim();
  if (!raw) {
    return {
      valid: false,
      raw,
      normalized: '',
      display: '',
      error: 'Numero di telefono obbligatorio.',
    };
  }

  // Rimuovi spazi, trattini, punti, parentesi e barre
  let cleaned = raw.replace(/[\s\-\.\(\)\/]/g, '');

  // Gestione doppio zero internazionale: 0039 -> +39
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // Se non inizia con '+', analizziamo la lunghezza e il prefisso
  if (!cleaned.startsWith('+')) {
    // Se inizia con '39' e ha almeno 11-12 cifre, supponiamo sia il prefisso italiano senza '+'
    if (cleaned.startsWith('39') && cleaned.length >= 11) {
      cleaned = '+' + cleaned;
    } else {
      // Default: numero cellulare/fisso italiano (9-10 cifre che iniziano tipicamente per 3 o 0)
      cleaned = '+39' + cleaned;
    }
  }

  // Estrai solo le cifre dopo il '+' per verificare la consistenza
  const digitsOnly = cleaned.slice(1);
  if (!/^\d+$/.test(digitsOnly)) {
    return {
      valid: false,
      raw,
      normalized: '',
      display: '',
      error: 'Il numero di telefono contiene caratteri non validi.',
    };
  }

  // Un numero telefonico valido deve avere tra le 9 e le 15 cifre (standard ITU-T E.164)
  if (digitsOnly.length < 9 || digitsOnly.length > 15) {
    return {
      valid: false,
      raw,
      normalized: '',
      display: '',
      error: 'Numero di telefono non valido (lunghezza non conforme).',
    };
  }

  // Formattazione display italiana piacevole se è +39
  let display = cleaned;
  if (cleaned.startsWith('+39') && cleaned.length >= 12) {
    const nat = cleaned.slice(3);
    if (nat.length === 10) {
      display = `+39 ${nat.slice(0, 3)} ${nat.slice(3, 6)} ${nat.slice(6)}`;
    } else if (nat.length === 9) {
      display = `+39 ${nat.slice(0, 3)} ${nat.slice(3, 6)} ${nat.slice(6)}`;
    }
  }

  return {
    valid: true,
    raw,
    normalized: cleaned,
    display,
  };
}
