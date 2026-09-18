import { describe, it, expect } from 'vitest';
import { formatIban, isValidIban } from '../src/utils/ibanUtils';
import { weddingData } from '../src/data/weddingData';

describe('IBAN Formatting & Validation', () => {
  it('validates official wedding IBAN', () => {
    const iban = weddingData.regalo.iban;
    expect(iban).toBe('IT12F0347501605CC0012329275');
    expect(isValidIban(iban)).toBe(true);
  });

  it('formats IBAN with 4-character chunks', () => {
    const formatted = formatIban('IT12F0347501605CC0012329275');
    expect(formatted).toBe('IT12 F034 7501 605C C001 2329 275');
  });

  it('rejects invalid IBANs', () => {
    expect(isValidIban('INVALID123')).toBe(false);
    expect(isValidIban('DE12345678901234567890')).toBe(false);
  });
});
