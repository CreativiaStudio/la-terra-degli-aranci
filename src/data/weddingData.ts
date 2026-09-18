import { WeddingData } from '../types/wedding';
import { timelineEvents } from './timelineData';

export const weddingData: WeddingData = {
  sposi: {
    sposa: "Francesca Annunziata",
    sposo: "Ferdinando Paragliola",
    monogramma: "F & F",
    claim: "Insieme per sempre",
  },
  dataOra: {
    dataFormattata: "Lunedì 7 Dicembre 2026",
    orarioCerimonia: "Ore 15:00",
    isoTimestamp: "2026-12-07T15:00:00+01:00",
    targetTimestampMs: 1796652000000,
    stagione: "Inverno / Atmosfera Pre-Natalizia & Fiori d'Inverno",
    scadenzaRsvp: "10 Novembre 2026",
    messaggioSollecito: "È gradita cortese conferma entro il 10 Novembre 2026 per consentire l'ottimale cura di ogni dettaglio culinario.",
  },
  location: {
    nome: "La Terra degli Aranci",
    indirizzo: "Piazzetta Santo Stefano n. 7",
    capCitta: "80127 Napoli (NA)",
    zona: "Tra le colline del Vomero e di Posillipo",
    puntiRiferimento: "Adiacente al Castello Liberty 'La Corte dei Leoni' e Villa Rachele",
    coordinates: {
      lat: 40.8398,
      lng: 14.2215,
    },
    parcheggio: "Oltre 100 posti auto coperti e custoditi interni e convenzionati di fronte alla villa",
    accessibilita: "Accesso facilitato senza barriere architettoniche per tutti gli ambienti",
    trasportiPubblici: "Metropolitana Linea 1 - Fermata Quattro Giornate (Vomero)",
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=Piazzetta+Santo+Stefano+7+Napoli",
    appleMapsUrl: "https://maps.apple.com/?daddr=Piazzetta+Santo+Stefano+7,+80127+Napoli",
    wazeUrl: "https://waze.com/ul?q=Piazzetta+Santo+Stefano+7+Napoli&navigate=yes",
  },
  timeline: timelineEvents,
  regalo: {
    intestatari: "Francesca Annunziata",
    iban: "IT12F0347501605CC0012329275",
    banca: "ING",
    causaleConsigliata: "Regalo Nozze Francesca e Ferdinando - [Nome e Cognome]",
    messaggio: "La vostra presenza è per noi il dono più prezioso e atteso. Se desiderate contribuire al nostro sogno di nozze e ai primi passi della nostra vita insieme, potete farlo tramite bonifico bancario.",
  },
  dressCode: {
    titolo: "Eleganza Invernale / Black Tie Optional",
    descrizione: "Un tocco di raffinata magia per una serata d'inverno a Napoli. Abiti scuri o smoking per i gentiluomini; abiti lunghi o midi eleganti dai toni profondi e luminosi per le signore.",
    palette: [
      { nome: "Dusty Blue / Carta da Zucchero", hex: "#6b8ca8", nota: "Colore nuziale guida e richiamo Toile de Jouy" },
      { nome: "Midnight Blue / Blu Notte", hex: "#1b2838", nota: "Sobrietà regale per completi e abiti da sera" },
      { nome: "Forest Green / Verde Bosco", hex: "#1f3b2b", nota: "Richiamo alla natura degli agrumeti secolari" },
      { nome: "Brushed Gold / Oro Caldo", hex: "#c5a059", nota: "Bagliori di luce e gioielli d'inverno" },
      { nome: "Winter Burgundy / Velluto Rubino", hex: "#5b1a28", nota: "Intensità e calore per la stagione dicembrina" },
    ],
    notaBonton: "Riserviamo con affetto il bianco, l'avorio e il panna alla nostra sposa.",
  },
  musica: {
    audioSrc: "./audio/musica_sposi.mp3",
    titolo: "Kris Bowers — Bridgerton Theme (Official Soundtrack)",
  },
  adminPin: "0712",
};
