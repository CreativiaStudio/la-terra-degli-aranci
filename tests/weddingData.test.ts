import { describe, it, expect } from 'vitest';
import { weddingData } from '../src/data/weddingData';

describe('Wedding Master Metadata Integrity', () => {
  it('contains exact couple names and monogram', () => {
    expect(weddingData.sposi.sposa).toBe('Francesca Annunziata');
    expect(weddingData.sposi.sposo).toBe('Ferdinando Paragliola');
    expect(weddingData.sposi.monogramma).toBe('F & F');
  });

  it('contains exact date, time, and target timestamp', () => {
    expect(weddingData.dataOra.dataFormattata).toContain('7 Dicembre 2026');
    expect(weddingData.dataOra.orarioCerimonia).toContain('15:00');
    expect(weddingData.dataOra.isoTimestamp).toBe('2026-12-07T15:00:00+01:00');
    expect(weddingData.dataOra.targetTimestampMs).toBe(1796652000000);
  });

  it('contains venue address, coordinates, and parking specifications', () => {
    expect(weddingData.location.nome).toBe('La Terra degli Aranci');
    expect(weddingData.location.indirizzo).toContain('Piazzetta Santo Stefano n. 7');
    expect(weddingData.location.capCitta).toContain('80127 Napoli');
    expect(weddingData.location.parcheggio).toContain('100 posti');
    expect(weddingData.location.coordinates.lat).toBeCloseTo(40.8398, 3);
    expect(weddingData.location.coordinates.lng).toBeCloseTo(14.2215, 3);
  });

  it('contains correct wedding gift IBAN and beneficiary', () => {
    expect(weddingData.regalo.iban).toBe('IT12F0347501605CC0012329275');
    expect(weddingData.regalo.intestatari).toBe('Francesca Annunziata');
  });

  it('contains couple moderation PIN 0712', () => {
    expect(weddingData.adminPin).toBe('0712');
  });
});
