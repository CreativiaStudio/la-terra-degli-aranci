// src/services/invitiApi.ts
// Service per comunicare con la REST API WordPress su laterradegliaranci.it

const API_BASE =
  typeof window !== 'undefined' && window.location.origin.includes('laterradegliaranci.it')
    ? '/wp-json/tda/v1'
    : 'https://www.laterradegliaranci.it/wp-json/tda/v1';

export interface CouplePublicData {
  id: string;
  slug: string;
  sposa: string;
  sposo: string;
  monogramma: string;
  data_evento: string;
  data_formattata: string;
  location_nome: string;
  location_indirizzo: string;
  location_maps_url: string;
  iban: string;
  iban_intestatari: string;
  canzone_url: string;
  lovewall: Array<{
    nome: string;
    messaggio_auguri: string;
    created_at: string;
  }>;
}

export interface CrmGuestRecord {
  id: string;
  coppia_slug: string;
  nome: string;
  telefono: string;
  email: string;
  presenza: 'confermato' | 'declinato';
  tipologia_nucleo?: string;
  accompagnatori?: string;
  num_adulti: string;
  num_bambini: string;
  eta_bambini: string;
  intolleranze: string;
  note_chef: string;
  canzone_dj: string;
  messaggio_auguri: string;
  lovewall_approvato: string;
  bonifico_notificato: string;
  created_at: string;
}

export interface CrmKpiSummary {
  totale_risposte: number;
  confermati: number;
  declinati: number;
  totale_ospiti: number;
  adulti: number;
  bambini: number;
  bonifici_notificati: number;
  celiaci: number;
  vegetariani: number;
  con_esigenze: number;
}

export interface CrmGuestsResponse {
  success: boolean;
  kpi: CrmKpiSummary;
  guests: CrmGuestRecord[];
  playlist: Array<{ canzone: string; richiesta_da: string }>;
}

export const invitiApi = {
  /**
   * Estrae lo slug della coppia corrente dall'URL (es. /invito/francesca-e-ferdinando/)
   */
  getCurrentSlug(): string {
    if (typeof window === 'undefined') return 'francesca-e-ferdinando';

    // 1. Check query param ?coppia=...
    const urlParams = new URLSearchParams(window.location.search);
    const paramSlug = urlParams.get('coppia');
    if (paramSlug) return paramSlug.toLowerCase();

    // 2. Check path /invito/:slug
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const invitoIdx = pathParts.indexOf('invito');
    if (invitoIdx !== -1 && pathParts[invitoIdx + 1]) {
      const candidate = pathParts[invitoIdx + 1];
      if (!['assets', 'images', 'audio', 'crm', 'admin'].includes(candidate)) {
        return candidate.toLowerCase();
      }
    }

    return 'francesca-e-ferdinando';
  },

  /**
   * Recupera i dati pubblici dell'evento
   */
  async getInvitoData(slug: string): Promise<CouplePublicData | null> {
    try {
      const res = await fetch(`${API_BASE}/invito/${slug}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    } catch (err) {
      console.warn('Fallback offline/locale per invito data:', err);
      return null;
    }
  },

  /**
   * Salva l'RSVP dell'ospite nel database WordPress
   */
  async submitRsvp(
    slug: string,
    data: {
      nome: string;
      telefono?: string;
      email?: string;
      presenza: 'confermato' | 'declinato';
      tipologia_nucleo?: string;
      accompagnatori?: string | string[];
      num_adulti?: number;
      num_bambini?: number;
      eta_bambini?: string;
      intolleranze?: string[];
      note_chef?: string;
      canzone_dj?: string;
      messaggio_auguri?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/invito/${slug}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Errore durante la registrazione');
      }
      return json;
    } catch (err: any) {
      return { success: false, message: err.message || 'Errore di connessione' };
    }
  },

  /**
   * Notifica il bonifico effettuato con dedica
   */
  async notifyBonifico(
    slug: string,
    data: { nome: string; messaggio?: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/invito/${slug}/bonifico`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, message: err.message || 'Errore di connessione' };
    }
  },

  /**
   * Login Sposi al CRM con PIN
   */
  async crmLogin(
    slug: string,
    pin: string
  ): Promise<{ success: boolean; message: string; sposi?: string; canzone_url?: string }> {
    try {
      const res = await fetch(`${API_BASE}/crm/${slug}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, message: json.message || 'PIN errato' };
      }
      return json;
    } catch (err: any) {
      return { success: false, message: 'Impossibile contattare il server' };
    }
  },

  /**
   * Elenco completo invitati e KPI aggregati
   */
  async getCrmGuests(slug: string, pin: string): Promise<CrmGuestsResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/crm/${slug}/guests?pin=${encodeURIComponent(pin)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('Errore recupero ospiti CRM:', err);
      return null;
    }
  },

  /**
   * Modifica stato o elimina ospite
   */
  async updateGuest(
    slug: string,
    pin: string,
    id: number,
    action: 'update' | 'delete',
    fields?: Partial<{ presenza: string; lovewall_approvato: number; note_chef: string }>
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/crm/${slug}/guest-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CRM-PIN': pin,
        },
        body: JSON.stringify({ id, action, ...fields }),
      });
      const json = await res.json();
      return json.success === true;
    } catch (err) {
      return false;
    }
  },

  /**
   * Aggiorna canzone MP3 di sottofondo
   */
  async updateSong(slug: string, pin: string, canzone_url: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/crm/${slug}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CRM-PIN': pin,
        },
        body: JSON.stringify({ canzone_url }),
      });
      const json = await res.json();
      return json.success === true;
    } catch (err) {
      return false;
    }
  },

  /**
   * Restituisce l'URL diretto per il download del file CSV/Excel
   */
  getExportCsvUrl(slug: string, pin: string): string {
    return `${API_BASE}/crm/${slug}/export-csv?pin=${encodeURIComponent(pin)}`;
  },
};
