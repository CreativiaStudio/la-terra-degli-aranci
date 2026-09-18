import { describe, it, expect } from 'vitest';
import { getGoogleCalendarUrl, generateIcsContent } from '../src/utils/calendarUtils';
import { weddingData } from '../src/data/weddingData';

describe('Save The Date & Calendar Synchronization', () => {
  it('generates valid Google Calendar URL with encoded parameters', () => {
    const url = getGoogleCalendarUrl(weddingData);

    expect(url).toContain('https://calendar.google.com/calendar/render');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('dates=20261207T140000Z/20261207T230000Z');
    expect(url).toContain('Matrimonio');
    expect(url).toContain('Francesca');
    expect(url).toContain('Ferdinando');
    expect(url).toContain('La%20Terra%20degli%20Aranci');
  });

  it('generates valid RFC 5545 iCalendar (.ics) content', () => {
    const ics = generateIcsContent(weddingData);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART:20261207T140000Z');
    expect(ics).toContain('DTEND:20261207T230000Z');
    expect(ics).toContain('SUMMARY:Matrimonio Francesca Annunziata & Ferdinando Paragliola');
    expect(ics).toContain('LOCATION:La Terra degli Aranci, Piazzetta Santo Stefano n. 7, 80127 Napoli (NA)');
    expect(ics).toContain('GEO:40.8398;14.2215');
    expect(ics).toContain('STATUS:CONFIRMED');

    // 3 VALARM triggers (-7 days, -1 day, -2 hours)
    expect(ics).toContain('TRIGGER:-P7D');
    expect(ics).toContain('TRIGGER:-P1D');
    expect(ics).toContain('TRIGGER:-PT2H');

    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });
});
