export interface CoupleInfo {
  sposa: string;
  sposo: string;
  monogramma: string;
  claim: string;
}

export interface VenueInfo {
  nome: string;
  indirizzo: string;
  capCitta: string;
  zona: string;
  puntiRiferimento: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  parcheggio: string;
  accessibilita: string;
  trasportiPubblici: string;
  mapsUrl: string;
  appleMapsUrl: string;
  wazeUrl: string;
}

export interface TimelineEvent {
  ora: string;
  titolo: string;
  luogo: string;
  descrizione: string;
  iconName: string;
  previewImage?: string;
  badge?: string;
}

export interface DressCodeColor {
  nome: string;
  hex: string;
  nota: string;
}

export interface DressCodeInfo {
  titolo: string;
  descrizione: string;
  palette: DressCodeColor[];
  notaBonton: string;
}

export interface GiftInfo {
  intestatari: string;
  iban: string;
  banca: string;
  causaleConsigliata: string;
  messaggio: string;
}

export interface WeddingData {
  sposi: CoupleInfo;
  dataOra: {
    dataFormattata: string;
    orarioCerimonia: string;
    isoTimestamp: string;
    targetTimestampMs: number;
    stagione: string;
    scadenzaRsvp: string;
    messaggioSollecito: string;
  };
  location: VenueInfo;
  timeline: TimelineEvent[];
  regalo: GiftInfo;
  dressCode: DressCodeInfo;
  musica?: {
    audioSrc: string;
    titolo: string;
  };
  adminPin: string;
}
