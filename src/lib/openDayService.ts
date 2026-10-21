import { getStore, saveStore, getWeddingDiaryLocal, saveWeddingDiaryLocal } from '@/lib/localDb';
import { normalizePhoneNumber } from '@/lib/phoneHelper';

export interface OpenDayLeadInput {
  nomiSposi: string;
  email: string;
  telefono: string;
  dataSognata?: string;
  periodoSognato?: string;
  note?: string;
}

export interface OpenDayLeadResult {
  success: boolean;
  isNew: boolean;
  client: any;
  quote: any;
  error?: string;
}

/**
 * Registra o aggancia un Lead proveniente dal QR Code Open Day.
 * Deduplica intelligentemente su Email e Telefono normalizzato E.164,
 * sincronizza con lo store e inizializza il Wedding Diary Livello 1.
 */
export function registerOrFindOpenDayLead(input: OpenDayLeadInput): OpenDayLeadResult {
  try {
    const rawNomi = (input.nomiSposi || '').trim();
    const rawEmail = (input.email || '').trim().toLowerCase();
    const rawPhone = (input.telefono || '').trim();

    if (!rawNomi) {
      return { success: false, isNew: false, client: null, quote: null, error: 'I nomi degli sposi sono obbligatori.' };
    }

    if (!rawEmail || !rawEmail.includes('@') || !rawEmail.includes('.')) {
      return { success: false, isNew: false, client: null, quote: null, error: 'Inserisci un indirizzo email valido.' };
    }

    const phoneResult = normalizePhoneNumber(rawPhone);
    if (!phoneResult.valid) {
      return { success: false, isNew: false, client: null, quote: null, error: phoneResult.error || 'Numero di telefono non valido.' };
    }

    const store = getStore();
    const clients = store.clients || [];
    const quotes = store.quotes || [];
    const appointments = store.appointments || [];

    // 1. DEDUPLICAZIONE: Cerca cliente esistente per Email (priorità 1) o Telefono normalizzato (priorità 2)
    let matchedClient = clients.find(c => {
      if (c?.email && c.email.trim().toLowerCase() === rawEmail) return true;
      if (c?.telefono) {
        const p = normalizePhoneNumber(c.telefono);
        if (p.valid && p.normalized === phoneResult.normalized) return true;
      }
      return false;
    });

    // Se non trovato tra i clienti, controlla negli appuntamenti (es. visita pregressa su Calendar)
    if (!matchedClient) {
      const matchedApt = appointments.find(a => {
        if (a?.email && a.email.trim().toLowerCase() === rawEmail) return true;
        if (a?.telefono) {
          const p = normalizePhoneNumber(a.telefono);
          if (p.valid && p.normalized === phoneResult.normalized) return true;
        }
        return false;
      });

      if (matchedApt) {
        console.log(`[Open Day] Trovato appuntamento pre-esistente per ${rawEmail} / ${phoneResult.normalized}. Aggancio automatico.`);
      }
    }

    const nowIso = new Date().toISOString();

    if (matchedClient) {
      // CLIENTE ESISTENTE: Aggiorna i dati senza sovrascrivere lo storico
      if (!matchedClient.tags) matchedClient.tags = [];
      if (!matchedClient.tags.includes('Open Day')) matchedClient.tags.push('Open Day');
      if (!matchedClient.tags.includes('Wedding Diary')) matchedClient.tags.push('Wedding Diary');
      matchedClient.updated_at = nowIso;
      matchedClient.ultimo_accesso_openday = nowIso;

      // Trova la quote attiva
      let matchedQuote = quotes.find(q => q.client_id === matchedClient.id || q.id === matchedClient.id);
      if (!matchedQuote) {
        matchedQuote = {
          id: `quote-od-${Date.now()}`,
          client_id: matchedClient.id,
          tipo_evento: 'wedding',
          tipo_cliente: 'privato',
          data_evento: input.dataSognata || '2027-06-18',
          turno: 'pranzo',
          tipo_esclusiva: 'esclusiva',
          spazi_riservati: ['Parco Botanico', 'Sala Bianca', 'Sala Tufo', 'Agrumeto'],
          source: 'openday_qr',
          status: 'lead',
          prezzo: 0,
          totale: 0,
          totale_calcolato: 0,
          items: [],
          created_at: nowIso,
          updated_at: nowIso,
          clients: matchedClient,
        };
        quotes.unshift(matchedQuote);
      }

      saveStore(store);

      // Assicura inizializzazione Wedding Diary
      let diary = getWeddingDiaryLocal(matchedClient.id);
      if (!diary) {
        diary = saveWeddingDiaryLocal({
          client_id: matchedClient.id,
          quote_id: matchedQuote.id,
          answers: {
            la_nostra_data_perfetta: input.dataSognata || '',
            periodo_desiderato: input.periodoSognato || '',
          },
          completion_rate: 5,
        });
      }

      return {
        success: true,
        isNew: false,
        client: matchedClient,
        quote: matchedQuote,
      };
    }

    // 2. NUOVO CLIENTE LEAD OPEN DAY
    const newClientId = `client-od-${Date.now()}`;
    const newQuoteId = `quote-od-${Date.now()}`;

    // Parsing nome sposa & sposo se contiene & o e
    let nomeSposi = rawNomi;
    let cognome = '(Open Day 2026)';
    if (rawNomi.includes('&')) {
      const parts = rawNomi.split('&').map(p => p.trim());
      nomeSposi = parts[0] || rawNomi;
      cognome = parts[1] ? `& ${parts[1]}` : cognome;
    } else if (rawNomi.toLowerCase().includes(' e ')) {
      const parts = rawNomi.split(/ e /i).map(p => p.trim());
      nomeSposi = parts[0] || rawNomi;
      cognome = parts[1] ? `& ${parts[1]}` : cognome;
    }

    const newClient = {
      id: newClientId,
      nome: nomeSposi,
      cognome: cognome,
      email: rawEmail,
      telefono: phoneResult.normalized,
      telefono_display: phoneResult.display,
      provenienza: 'QR Code Open Day',
      tags: ['Open Day', 'Wedding Diary'],
      data_evento_sognata: input.dataSognata || input.periodoSognato || '',
      note: input.note ? `Note Open Day: ${input.note}` : 'Lead generato da scansione QR Code Open Day in villa',
      created_at: nowIso,
      updated_at: nowIso,
      tipo_cliente: 'privato',
    };

    const newQuote = {
      id: newQuoteId,
      client_id: newClientId,
      tipo_evento: 'wedding',
      tipo_cliente: 'privato',
      data_evento: input.dataSognata || '2027-06-18',
      turno: 'pranzo',
      tipo_esclusiva: 'esclusiva',
      spazi_riservati: ['Parco Botanico', 'Sala Bianca', 'Sala Tufo', 'Agrumeto'],
      source: 'openday_qr',
      status: 'lead',
      prezzo: 0,
      totale: 0,
      totale_calcolato: 0,
      items: [],
      notes: input.periodoSognato ? `Periodo desiderato: ${input.periodoSognato}` : '',
      created_at: nowIso,
      updated_at: nowIso,
      clients: newClient,
    };

    clients.unshift(newClient);
    quotes.unshift(newQuote);
    saveStore(store);

    // Inizializza Wedding Diary Livello 1 per la coppia
    const initialDiary = saveWeddingDiaryLocal({
      client_id: newClientId,
      quote_id: newQuoteId,
      answers: {
        la_nostra_data_perfetta: input.dataSognata || '',
        periodo_desiderato: input.periodoSognato || '',
      },
      completion_rate: 5,
    });

    console.log(`[Open Day] Nuovo lead creato: ${rawNomi} (${rawEmail} | ${phoneResult.normalized}) ID: ${newClientId}`);

    return {
      success: true,
      isNew: true,
      client: newClient,
      quote: newQuote,
    };
  } catch (err: any) {
    console.error('Errore registerOrFindOpenDayLead:', err);
    return {
      success: false,
      isNew: false,
      client: null,
      quote: null,
      error: err?.message || 'Errore interno durante la registrazione.',
    };
  }
}
