import { WeddingData } from '../types/wedding';
import { weddingData } from '../data/weddingData';

export function getGoogleCalendarUrl(data: WeddingData = weddingData): string {
  const title = encodeURIComponent(`Matrimonio ${data.sposi.sposa} & ${data.sposi.sposo}`);
  // 15:00 CET = 14:00 UTC
  const dates = '20261207T140000Z/20261207T230000Z';
  const details = encodeURIComponent(
    `Celebrazione delle nozze di ${data.sposi.sposa} e ${data.sposi.sposo} presso ${data.location.nome}, Napoli.\nRito nuziale alle ${data.dataOra.orarioCerimonia}, a seguire ricevimento, taglio torta e after party.\nParcheggio interno custodito disponibile (${data.location.parcheggio}).`
  );
  const location = encodeURIComponent(`${data.location.nome}, ${data.location.indirizzo}, ${data.location.capCitta}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

export function generateIcsContent(data: WeddingData = weddingData): string {
  const dtStamp = '20260828T120000Z';
  const dtStart = '20261207T140000Z';
  const dtEnd = '20261207T230000Z';
  const summary = `Matrimonio ${data.sposi.sposa} & ${data.sposi.sposo}`;
  const description = `Celebrazione delle nozze di ${data.sposi.sposa} e ${data.sposi.sposo} a ${data.location.nome}, Napoli.\nRito nuziale alle ${data.dataOra.orarioCerimonia}, a seguire ricevimento e after party.\n${data.location.parcheggio}.`;
  const location = `${data.location.nome}, ${data.location.indirizzo}, ${data.location.capCitta}`;
  const geo = `${data.location.coordinates.lat.toFixed(4)};${data.location.coordinates.lng.toFixed(4)}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//La Terra degli Aranci//Francesca e Ferdinando Wedding//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Matrimonio Francesca & Ferdinando',
    'X-WR-TIMEZONE:Europe/Rome',
    'BEGIN:VEVENT',
    'UID:wedding-francesca-ferdinando-20261207T150000@laterradegliaranci.it',
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    `GEO:${geo}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P7D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Promemoria: Matrimonio Francesca & Ferdinando tra 1 settimana',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Promemoria: Matrimonio Francesca & Ferdinando domani alle 15:00!',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Ci siamo! Il matrimonio di Francesca & Ferdinando inizia tra 2 ore a La Terra degli Aranci.',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcsFile(data: WeddingData = weddingData, filename = 'Francesca_Ferdinando_Nozze.ics'): void {
  const content = generateIcsContent(data);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
