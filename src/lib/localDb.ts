import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SERVICES_CATALOG, ServiceCatalogItem } from '@/lib/servicesCatalog';
import { generateSignature } from '@/lib/crypto';
import { SEMI_ESCLUSIVA_FORMULE } from '@/lib/contractMeta';
import type { Payment } from '@/lib/eventLedger';

/**
 * Re-export dei tipi contabili di riferimento, per permettere ai moduli di
 * dominio (eventStage, eventDto, ...) di importare `Quote`/`EventLedger` da
 * `@/lib/localDb` senza dipendenze dirette multiple.
 */
export type { Quote, EventLedger, QuoteChange } from '@/lib/eventLedger';

function getDataFilePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))) {
    const tmpFile = path.join('/tmp', 'data_store.json');
    if (!fs.existsSync(tmpFile)) {
      const origFile = path.join(process.cwd(), 'data_store.json');
      if (fs.existsSync(origFile)) {
        try {
          fs.copyFileSync(origFile, tmpFile);
        } catch {
          // ignore
        }
      }
    }
    return tmpFile;
  }
  return path.join(process.cwd(), 'data_store.json');
}

/**
 * Appuntamento / Visita in Tenuta.
 * Rappresenta una richiesta di appuntamento (telefonata o form del sito) per
 * una visita guidata della location, sia per un matrimonio sia per un evento
 * privato. Vive nel `data_store.json` locale (`appointments`).
 */
export interface Appointment {
  id: string;
  tipo: 'wedding' | 'privato';
  nome: string;
  cognome?: string;
  partnerNome?: string;
  partnerCognome?: string;
  telefono: string;
  email?: string;
  dataOra: string; // ISO o 'YYYY-MM-DDTHH:mm'
  dataAppuntamento: string; // 'YYYY-MM-DD'
  orarioAppuntamento: string; // 'HH:mm'
  dataEventoPresunta?: string; // es. 'Luglio 2027', 'Settembre 2027'
  interesse: 'esclusiva' | 'semi_esclusiva' | 'sala_bianca' | 'sala_tufo' | 'da_definire';
  ospitiPrevisti?: number;
  canale: 'sito_web' | 'telefono' | 'whatsapp' | 'instagram' | 'passaparola';
  stato: 'da_confermare' | 'confermato' | 'effettuato' | 'annullato';
  note?: string;
  /** Preferenze raccolte dalla Segreteria durante la visita in tenuta. */
  preferenze?: AppointmentPreferences;
  created_at: string;
}

/**
 * Preferenze visita raccolte dalla Segreteria sul tablet durante il giro della
 * tenuta. Vengono salvate sull'appuntamento e sincronizzate nel Wedding Diary
 * della coppia, così le ritrova già precompilate nella propria Area Riservata.
 */
export interface AppointmentPreferences {
  /** Stile & mood dell'evento (es. "Botanico Chic & Agrumi"). */
  stileMood: string;
  /** Spazi della tenuta selezionati durante il tour. */
  spaziSelezionati: string[];
  /** Tipo di cerimonia desiderata. */
  tipoCerimonia: string;
  /** Servizi/esperienze di interesse (senza prezzi). */
  serviziInteresse: string[];
  /** Preferenze servizi espresse durante il Tour Fotografico Servizi. */
  preferenzeServizi?: string[];
  /** Date candidate di preferenza della coppia (fino a 4 date ISO 'YYYY-MM-DD'). */
  dateCandidate?: string[];
  /** Mese di riferimento per il controllo disponibilità (es. '2027-07' o 'Luglio 2027'). */
  mesePreferenza?: string;
  /** Note sulla musica / colonna sonora. */
  musicaNote: string;
  /** Celiaci, allergie o intolleranze segnalate. */
  celiaciNote: string;
  /** Impressioni generali della visita. */
  noteGenerali: string;
  updated_at?: string;
}

export interface LocalStore {
  clients: any[];
  quotes: any[];
  wedding_diaries?: any[];
  signed_contracts?: any[];
  quote_changes?: any[];
  project_builder_sessions?: any[];
  services_catalog?: ServiceCatalogItem[];
  ticket_orders?: any[];
  blog_posts?: any[];
  /**
   * Registro incassi reale (append-only). Vive a livello radice dello store,
   * separato dalle quote: mappa 1:1 su una futura tabella Supabase `payments`.
   */
  payments?: Payment[];
  /**
   * Contratti finali / accordi diretti generati dall'admin rapido.
   * Volutamente SEPARATI da `signed_contracts` (evita la regressione S1):
   * un accordo diretto non è un contratto firmato e non deve attivare
   * il flusso di firma/congelamento acconti della pipeline esistente.
   */
  final_contracts?: any[];
  /** Appuntamenti / Visite in Tenuta (agenda segreteria e direzione). */
  appointments?: Appointment[];
}

export function getStore(): LocalStore {
  const dataFile = getDataFilePath();
  if (!fs.existsSync(dataFile)) {
    const initial: LocalStore = {
      clients: [],
      quotes: [],
      wedding_diaries: [],
      signed_contracts: [],
      quote_changes: [],
      project_builder_sessions: [],
      services_catalog: [...SERVICES_CATALOG],
      ticket_orders: [],
      blog_posts: [],
      payments: [],
      appointments: buildDemoAppointments()
    };
    try {
      fs.writeFileSync(dataFile, JSON.stringify(initial, null, 2), 'utf8');
    } catch (e) {
      console.warn("Avviso inizializzazione data_store:", e);
    }
    return initial;
  }
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.wedding_diaries) parsed.wedding_diaries = [];
    if (!parsed.signed_contracts) parsed.signed_contracts = [];
    if (!parsed.quote_changes) parsed.quote_changes = [];
    if (!parsed.project_builder_sessions) parsed.project_builder_sessions = [];
    if (!parsed.ticket_orders) parsed.ticket_orders = [];
    if (!parsed.blog_posts) parsed.blog_posts = [];
    if (!parsed.payments) parsed.payments = [];
    const appointmentsMissing = !Array.isArray(parsed.appointments);
    if (appointmentsMissing) parsed.appointments = buildDemoAppointments();
    if (!parsed.services_catalog || !Array.isArray(parsed.services_catalog) || parsed.services_catalog.length === 0) {
      parsed.services_catalog = [...SERVICES_CATALOG];
      try {
        fs.writeFileSync(dataFile, JSON.stringify(parsed, null, 2), 'utf8');
      } catch {
        // ignore
      }
    } else if (appointmentsMissing) {
      try {
        fs.writeFileSync(dataFile, JSON.stringify(parsed, null, 2), 'utf8');
      } catch {
        // ignore
      }
    }
    return parsed;
  } catch (e) {
    return {
      clients: [],
      quotes: [],
      wedding_diaries: [],
      signed_contracts: [],
      quote_changes: [],
      project_builder_sessions: [],
      services_catalog: [...SERVICES_CATALOG],
      ticket_orders: [],
      payments: [],
      appointments: buildDemoAppointments()
    };
  }
}

function saveStore(store: LocalStore) {
  const dataFile = getDataFilePath();
  try {
    fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), 'utf8');
  } catch (e: any) {
    console.warn("Avviso salvataggio localDb su fs:", e.message);
  }
}

export function saveQuoteLocal(formData: any) {
  const store = getStore();
  
  const clientId = crypto.randomUUID();
  const client = {
    id: clientId,
    nome: formData.cliente.nome,
    cognome: formData.cliente.cognome,
    email: formData.cliente.email,
    telefono: formData.cliente.telefono,
    codice_fiscale: formData.cliente.codice_fiscale,
    created_at: new Date().toISOString()
  };
  store.clients.push(client);

  const quoteId = crypto.randomUUID();
  const quote = {
    id: quoteId,
    client_id: clientId,
    tipo_evento: formData.tipo_evento,
    data_evento: formData.data_evento || null,
    numero_ospiti: formData.numero_ospiti || 100,
    items: formData.items || [],
    sconto_fisso: formData.sconto_fisso || 0,
    totale_calcolato: formData.totale_calcolato || 0,
    status: 'inviato',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  store.quotes.push(quote);

  saveStore(store);
  return { quoteId, client };
}

export function saveLeadQuoteLocal(data: {
  nome: string;
  cognome: string;
  telefono: string;
  email: string;
  canaleProvenienza?: string;
  tipoEvento: string;
  dataEvento?: string | null;
  numeroOspiti?: number;
  spaziSelezionati?: string[];
  stileMood?: string;
  serviziInteresse?: string[];
  note?: string;
}) {
  const store = getStore();
  const clientId = crypto.randomUUID();
  const newClient = {
    id: clientId,
    nome: (data.nome || "").trim(),
    cognome: (data.cognome || "").trim(),
    email: (data.email || "").trim(),
    telefono: (data.telefono || "").trim(),
    provenienza: data.canaleProvenienza || "Tour Location Tablet",
    created_at: new Date().toISOString(),
  };
  store.clients.unshift(newClient);

  const quoteId = crypto.randomUUID();
  const newQuote = {
    id: quoteId,
    client_id: clientId,
    tipo_evento: data.tipoEvento === "wedding" ? "wedding" : "eventi",
    data_evento: data.dataEvento || null,
    numero_ospiti: data.numeroOspiti || 100,
    spazi_selezionati: data.spaziSelezionati || [],
    stile_mood: data.stileMood || "",
    servizi_interesse: data.serviziInteresse || [],
    note_visita_segreteria: data.note || "",
    status: "bozza_visita",
    source: "tablet_segreteria",
    items: [],
    sconto_fisso: 0,
    totale_calcolato: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    clients: newClient,
  };
  store.quotes.unshift(newQuote);

  saveStore(store);
  return { quoteId, client: newClient, quote: newQuote };
}

export function getQuoteLocal(id: string) {
  const store = getStore();
  const quote = store.quotes.find(q => q.id === id);
  if (!quote) return null;
  const client = store.clients.find(c => c.id === quote.client_id) || {
    nome: 'Cliente',
    cognome: 'TDA',
    email: ''
  };
  return { ...quote, clients: client };
}

export function getAllQuotesLocal() {
  const store = getStore();
  return store.quotes.map(q => {
    const client = store.clients.find(c => c.id === q.client_id) || {
      nome: 'Cliente',
      cognome: 'TDA',
      email: ''
    };
    return { ...q, clients: client };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function updateQuoteStatusLocal(id: string, status: string) {
  const store = getStore();
  const quote = store.quotes.find(q => q.id === id);
  if (quote) {
    quote.status = status;
    quote.updated_at = new Date().toISOString();
    saveStore(store);
    return true;
  }
  return false;
}

export function updateQuoteStatusLocalByPrefix(prefix: string, status: string) {
  const store = getStore();
  const quote = store.quotes.find(q => q.id.toLowerCase().startsWith(prefix.toLowerCase()));
  if (quote) {
    quote.status = status;
    quote.updated_at = new Date().toISOString();
    saveStore(store);
    return true;
  }
  return false;
}

export function getWeddingDiaryLocal(clientId: string) {
  const store = getStore();
  const diary = store.wedding_diaries?.find(d => d.client_id === clientId || d.quote_id === clientId);
  return diary || null;
}

export interface WeddingDiaryPayload {
  client_id: string;
  quote_id?: string;
  /** Risposte strutturate del questionario Wedding Diary: { nome_campo: valore }. */
  answers?: Record<string, any>;
  /** Percentuale di completamento del Diary (0-100). */
  completion_rate?: number;
  /** Campi legacy (AI Concierge / vecchie schede) e chiavi extra ammesse. */
  [key: string]: any;
}

/**
 * Salvataggio NON distruttivo del Wedding Diary.
 * - aggiorna solo le chiavi esplicitamente presenti nel payload;
 * - fonde (shallow merge) l'oggetto `answers`, così un autosave parziale
 *   non cancella mai le risposte già memorizzate;
 * - preserva l'`id` esistente della scheda.
 */
export function saveWeddingDiaryLocal(data: WeddingDiaryPayload) {
  const store = getStore();
  if (!store.wedding_diaries) store.wedding_diaries = [];

  const index = store.wedding_diaries.findIndex(
    d =>
      (data.client_id && d.client_id === data.client_id) ||
      (data.quote_id && d.quote_id && d.quote_id === data.quote_id)
  );

  const prev = index >= 0 ? store.wedding_diaries[index] : {};

  // Patch: solo le chiavi realmente fornite (le undefined non sovrascrivono nulla)
  const patch: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    patch[key] = value;
  });

  // Merge non distruttivo delle risposte strutturate
  const prevAnswers =
    prev && typeof prev.answers === "object" && prev.answers !== null ? prev.answers : {};
  const nextAnswers =
    data.answers && typeof data.answers === "object"
      ? { ...prevAnswers, ...data.answers }
      : prevAnswers;
  const hasAnswers = Object.keys(nextAnswers).length > 0;

  const entry = {
    ...prev,
    ...patch,
    id: prev.id || data.id || crypto.randomUUID(),
    answers: hasAnswers ? nextAnswers : prev.answers,
    updated_at: new Date().toISOString()
  };

  if (index >= 0) {
    store.wedding_diaries[index] = entry;
  } else {
    store.wedding_diaries.push(entry);
  }

  saveStore(store);
  return entry;
}

export function getAllWeddingDiariesLocal() {
  const store = getStore();
  return store.wedding_diaries || [];
}

export function getSignedContractLocal(id: string) {
  const store = getStore();
  if (!store.signed_contracts) return null;
  const search = id.toLowerCase();
  return store.signed_contracts.find(
    sc => (sc.quote_id && sc.quote_id.toLowerCase().startsWith(search)) ||
          (sc.client_id && sc.client_id.toLowerCase() === search) ||
          (sc.id && sc.id.toLowerCase() === search)
  ) || null;
}

export function updateQuoteItemsAndTotalLocal(quoteId: string, items: any[], totale: number) {
  const store = getStore();
  const quote = store.quotes.find(q => q.id === quoteId);
  if (!quote) return false;
  quote.items = items;
  quote.totale_calcolato = totale;
  quote.updated_at = new Date().toISOString();
  saveStore(store);
  return true;
}

export function freezeInstallmentsLocalByPrefix(prefix: string, caparra: number, secondoAcconto: number) {
  const store = getStore();
  const quote = store.quotes.find(q => q.id.toLowerCase().startsWith(prefix.toLowerCase()));
  if (!quote) return false;
  if (quote.importo_caparra != null || quote.importo_secondo_acconto != null) return false;
  quote.importo_caparra = caparra;
  quote.importo_secondo_acconto = secondoAcconto;
  saveStore(store);
  return true;
}

export function createQuoteChangeLocal(data: {
  quote_id: string;
  initiated_by: 'cliente' | 'admin';
  items_before: any[];
  items_after: any[];
  totale_before: number;
  totale_after: number;
}) {
  const store = getStore();
  if (!store.quote_changes) store.quote_changes = [];

  const entry = {
    id: crypto.randomUUID(),
    quote_id: data.quote_id,
    initiated_by: data.initiated_by,
    items_before: data.items_before,
    items_after: data.items_after,
    totale_before: data.totale_before,
    totale_after: data.totale_after,
    status: 'pending',
    firma_disegnata: '',
    pdf_url: '',
    created_at: new Date().toISOString(),
    confirmed_at: null
  };

  store.quote_changes.push(entry);
  saveStore(store);
  return entry;
}

export function getQuoteChangeLocal(id: string) {
  const store = getStore();
  return store.quote_changes?.find(c => c.id === id) || null;
}

export function getQuoteChangesForQuoteLocal(quoteId: string) {
  const store = getStore();
  return (store.quote_changes || [])
    .filter(c => c.quote_id === quoteId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function updateQuoteChangePdfUrlLocal(id: string, pdfUrl: string) {
  const store = getStore();
  const change = store.quote_changes?.find(c => c.id === id);
  if (!change) return false;
  change.pdf_url = pdfUrl;
  saveStore(store);
  return true;
}

export function confirmQuoteChangeLocal(id: string, firmaDisegnata: string, pdfUrl: string) {
  const store = getStore();
  const change = store.quote_changes?.find(c => c.id === id);
  if (!change || change.status !== 'pending') return false;

  change.status = 'confermato';
  change.firma_disegnata = firmaDisegnata;
  change.pdf_url = pdfUrl;
  change.confirmed_at = new Date().toISOString();
  saveStore(store);
  return true;
}

export function saveSignedContractLocal(payload: any) {
  const store = getStore();
  if (!store.signed_contracts) store.signed_contracts = [];

  const quoteId = payload.preventivo || payload.quote_id || "";
  const index = store.signed_contracts.findIndex(
    sc => sc.quote_id && sc.quote_id.toLowerCase().startsWith(quoteId.toLowerCase())
  );

  const entry = {
    id: index >= 0 ? store.signed_contracts[index].id : crypto.randomUUID(),
    quote_id: quoteId,
    tipoContratto: payload.tipoContratto || "wedding",
    lingua: payload.lingua || "it",
    prezzo: payload.prezzo,
    datiCliente: payload.datiCliente || {},
    firma_disegnata: payload.firma_disegnata || "",
    firma_disegnata_clausole: payload.firma_disegnata_clausole || "",
    pdf_url: payload.pdf_url || "",
    signed_at: payload.signed_at || new Date().toISOString()
  };

  if (index >= 0) {
    store.signed_contracts[index] = entry;
  } else {
    store.signed_contracts.push(entry);
  }

  saveStore(store);
  return entry;
}

export function getProjectBuilderSessionLocal(sessionId: string) {
  const store = getStore();
  if (!store.project_builder_sessions) return null;
  return store.project_builder_sessions.find(s => s.sessionId === sessionId || s.session_id === sessionId) || null;
}

export function saveProjectBuilderSessionLocal(sessionData: any) {
  const store = getStore();
  if (!store.project_builder_sessions) store.project_builder_sessions = [];
  const sessionId = sessionData.sessionId || sessionData.session_id;
  const index = store.project_builder_sessions.findIndex(s => (s.sessionId || s.session_id) === sessionId);
  const entry = {
    ...sessionData,
    sessionId: sessionId,
    updatedAt: sessionData.updatedAt || sessionData.updated_at || new Date().toISOString()
  };

  if (index >= 0) {
    store.project_builder_sessions[index] = entry;
  } else {
    store.project_builder_sessions.push(entry);
  }

  saveStore(store);
  return entry;
}

export function getServicesCatalogLocal(): ServiceCatalogItem[] {
  const store = getStore();
  if (!store.services_catalog || !Array.isArray(store.services_catalog) || store.services_catalog.length === 0) {
    store.services_catalog = [...SERVICES_CATALOG];
    saveStore(store);
  }
  return store.services_catalog;
}

export function saveServicesCatalogLocal(items: ServiceCatalogItem[]): ServiceCatalogItem[] {
  const store = getStore();
  store.services_catalog = items;
  saveStore(store);
  return store.services_catalog;
}

export function updateServiceCatalogItemLocal(item: Partial<ServiceCatalogItem> & { id: string }): ServiceCatalogItem | null {
  const store = getStore();
  if (!store.services_catalog || !Array.isArray(store.services_catalog) || store.services_catalog.length === 0) {
    store.services_catalog = [...SERVICES_CATALOG];
  }
  const index = store.services_catalog.findIndex(
    s => s.id.toLowerCase() === item.id.toLowerCase() || (item.code && s.code.toLowerCase() === item.code.toLowerCase())
  );
  if (index === -1) {
    return null;
  }
  store.services_catalog[index] = {
    ...store.services_catalog[index],
    ...item,
    updated_at: new Date().toISOString()
  };
  saveStore(store);
  return store.services_catalog[index];
}

export function resetServicesCatalogLocal(): ServiceCatalogItem[] {
  const store = getStore();
  store.services_catalog = [...SERVICES_CATALOG];
  saveStore(store);
  return store.services_catalog;
}

export interface TicketOrder {
  id: string;
  evento_id: string;
  evento_titolo: string;
  data_evento: string;
  cliente_nome: string;
  cliente_email: string;
  numero_biglietti: number;
  prezzo_unitario: number;
  totale: number;
  sconto_club_applicato: boolean;
  qr_pass_token: string;
  status: "confermato";
  created_at: string;
}

export function saveTicketOrderLocal(data: {
  evento_id: string;
  evento_titolo: string;
  data_evento: string;
  cliente_nome: string;
  cliente_email: string;
  numero_biglietti: number;
  prezzo_unitario: number;
  totale: number;
  sconto_club_applicato?: boolean;
}): TicketOrder {
  const store = getStore();
  if (!store.ticket_orders) store.ticket_orders = [];

  const id = `tkt-${crypto.randomUUID().slice(0, 8)}`;
  const qrPassToken = crypto.createHash("sha256").update(`${id}:${data.cliente_email}:${data.totale}`).digest("hex").slice(0, 16).toUpperCase();

  const entry: TicketOrder = {
    id,
    evento_id: data.evento_id,
    evento_titolo: data.evento_titolo,
    data_evento: data.data_evento,
    cliente_nome: data.cliente_nome,
    cliente_email: data.cliente_email,
    numero_biglietti: data.numero_biglietti,
    prezzo_unitario: data.prezzo_unitario,
    totale: data.totale,
    sconto_club_applicato: data.sconto_club_applicato ?? true,
    qr_pass_token: qrPassToken,
    status: "confermato",
    created_at: new Date().toISOString()
  };

  store.ticket_orders.unshift(entry);
  saveStore(store);
  return entry;
}

export function getTicketOrdersLocal(clienteEmail?: string): TicketOrder[] {
  const store = getStore();
  const orders = store.ticket_orders || [];
  if (!clienteEmail) return orders;
  return orders.filter(o => o.cliente_email.toLowerCase() === clienteEmail.toLowerCase());
}

/* ------------------------------------------------------------------ */
/* Registro Incassi Reale (collezione `payments`, append-only)         */
/* ------------------------------------------------------------------ */

/**
 * Registra un incasso reale. Il record non viene mai eliminato fisicamente:
 * nasce `valido` e può solo essere annullato con motivo (vedi cancelPaymentLocal).
 */
export function recordPaymentLocal(
  payment: Omit<Payment, 'id' | 'created_at' | 'stato'>
): Payment {
  const store = getStore();
  if (!store.payments) store.payments = [];

  const entry: Payment = {
    ...payment,
    id: crypto.randomUUID(),
    stato: 'valido',
    created_at: new Date().toISOString(),
  };

  store.payments.push(entry);
  saveStore(store);
  return entry;
}

/**
 * Annulla un pagamento valido (soft delete append-only). Restituisce `false`
 * se il pagamento non esiste o è già annullato.
 */
export function cancelPaymentLocal(paymentId: string, motivo: string): boolean {
  const store = getStore();
  if (!store.payments) store.payments = [];

  const payment = store.payments.find(p => p.id === paymentId);
  if (!payment || payment.stato === 'annullato') return false;

  payment.stato = 'annullato';
  payment.annullato_motivo = motivo;
  payment.annullato_at = new Date().toISOString();
  saveStore(store);
  return true;
}

/** Tutti i pagamenti (validi e annullati) collegati a una quote, per id esatto. */
export function getPaymentsForQuoteLocal(quoteId: string): Payment[] {
  const store = getStore();
  const search = String(quoteId || '').trim().toLowerCase();
  if (!search) return [];

  return (store.payments || [])
    .filter(p => p.quote_id && p.quote_id.toLowerCase() === search)
    .sort((a, b) => {
      const byDate = String(a.data_incasso || '').localeCompare(String(b.data_incasso || ''));
      if (byDate !== 0) return byDate;
      return String(a.created_at || '').localeCompare(String(b.created_at || ''));
    });
}

/** Intero registro incassi (validi e annullati), in ordine cronologico. */
export function getAllPaymentsLocal(): Payment[] {
  const store = getStore();
  return (store.payments || [])
    .slice()
    .sort((a, b) => {
      const byDate = String(a.data_incasso || '').localeCompare(String(b.data_incasso || ''));
      if (byDate !== 0) return byDate;
      return String(a.created_at || '').localeCompare(String(b.created_at || ''));
    });
}

export function saveBlogPostLocal(post: any) {
  const store = getStore();
  if (!store.blog_posts) store.blog_posts = [];

  const existingIndex = store.blog_posts.findIndex(p => p.id === post.id || p.slug === post.slug);
  const updatedEntry = {
    ...post,
    id: post.id || `post-${crypto.randomUUID().slice(0, 8)}`,
    updated_at: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    store.blog_posts[existingIndex] = updatedEntry;
  } else {
    store.blog_posts.unshift(updatedEntry);
  }

  saveStore(store);
  return updatedEntry;
}

export function getBlogPostsLocal(): any[] {
  const store = getStore();
  return store.blog_posts || [];
}

/* ------------------------------------------------------------------ */
/* Modulo Contratti — helper aggiuntivi (solo funzioni NUOVE)          */
/* Nessuna funzione esistente viene modificata per garantire la        */
/* compatibilità al 100% con la pipeline preventivi/contratti.        */
/* ------------------------------------------------------------------ */

/**
 * Espone lo store locale in sola lettura per i moduli di supporto
 * (es. slotAvailability) che devono attraversare preventivi e contratti.
 */
export function getLocalStore(): LocalStore {
  return getStore();
}

export interface QuoteContractMetaUpdate {
  fase_contratto?: string;
  tipo_esclusiva?: string;
  spazi_riservati?: string[];
  canale_contratto?: string;
  opzione?: any;
}

/**
 * Aggiorna i metadati contrattuali di un preventivo (match per id esatto,
 * con fallback sul prefisso come nel resto del localDb).
 */
export function updateQuoteContractMetaLocal(quoteId: string, meta: QuoteContractMetaUpdate) {
  const store = getStore();
  const search = String(quoteId || "").toLowerCase();
  const quote =
    store.quotes.find(q => String(q.id).toLowerCase() === search) ||
    store.quotes.find(q => String(q.id).toLowerCase().startsWith(search));

  if (!quote) return null;

  if (meta.fase_contratto !== undefined) quote.fase_contratto = meta.fase_contratto;
  if (meta.tipo_esclusiva !== undefined) quote.tipo_esclusiva = meta.tipo_esclusiva;
  if (meta.spazi_riservati !== undefined) quote.spazi_riservati = meta.spazi_riservati;
  if (meta.canale_contratto !== undefined) quote.canale_contratto = meta.canale_contratto;
  if (meta.opzione !== undefined) quote.opzione = meta.opzione;

  quote.updated_at = new Date().toISOString();
  saveStore(store);
  return quote;
}

/**
 * Salva un contratto finale nella lista dedicata `final_contracts`.
 * IMPORTANTE: non tocca `signed_contracts` (evita la regressione S1).
 */
export function saveFinalContractLocal(payload: any) {
  const store = getStore();
  if (!store.final_contracts) store.final_contracts = [];

  const quoteId = payload?.preventivo || payload?.quote_id || payload?.quoteId || "";
  const search = String(quoteId).toLowerCase();
  const index = search
    ? store.final_contracts.findIndex(
        fc => fc.quote_id && String(fc.quote_id).toLowerCase().startsWith(search)
      )
    : -1;

  const entry = {
    ...payload,
    id: index >= 0 ? store.final_contracts[index].id : crypto.randomUUID(),
    quote_id: quoteId,
    finalized_at: payload?.finalized_at || new Date().toISOString(),
  };

  if (index >= 0) {
    store.final_contracts[index] = entry;
  } else {
    store.final_contracts.unshift(entry);
  }

  saveStore(store);
  return entry;
}

/**
 * Restituisce il contratto finale collegato a un preventivo (match per prefisso).
 */
export function getFinalContractByQuoteLocal(quoteId: string) {
  const store = getStore();
  if (!store.final_contracts) return null;
  const search = String(quoteId || "").toLowerCase();
  return (
    store.final_contracts.find(
      fc =>
        (fc.quote_id && String(fc.quote_id).toLowerCase().startsWith(search)) ||
        (fc.id && String(fc.id).toLowerCase() === search)
    ) || null
  );
}

/** Elenco completo dei contratti finali (più recenti per primi se timestamp presente). */
export function getFinalContractsLocal(): any[] {
  const store = getStore();
  return store.final_contracts || [];
}

export interface AdminQuickQuotePayload {
  cliente: {
    nome: string;
    cognome: string;
    email?: string;
    telefono?: string;
    partnerNome?: string;
    partnerCognome?: string;
    codice_fiscale?: string;
  };
  tipo_cliente?: 'privato' | 'azienda';
  ragione_sociale?: string;
  partita_iva?: string;
  sdi?: string;
  pec?: string;
  tipo_evento: string;
  data_evento: string;
  turno?: string;
  tipo_esclusiva?: string;
  spazi_riservati?: string[];
  canale_contratto?: string;
  source?: string;
  fase_contratto?: string;
  prezzo: number;
  items?: any[];
  note?: string;
  opzione?: any;
  importo_caparra?: number;
  importo_secondo_acconto?: number;
}

/**
 * Crea (o riutilizza) il cliente e genera un preventivo formale per l'admin rapido.
 *
 * Regola di riutilizzo: un cliente esistente viene riutilizzato SOLO quando
 * coincidono SIA il contatto (email/telefono) SIA nome e cognome (case-insensitive).
 * Se il contatto coincide ma il nome è diverso (es. "Luca Esposito" vs "Mario Pepe")
 * si tratta di una persona o simulazione differente: viene creato un nuovo cliente
 * autonomo con il proprio id, così riepilogo e link del contratto mostrano sempre i
 * dati inseriti da Roberto.
 */
export function saveAdminQuickQuoteLocal(payload: AdminQuickQuotePayload) {
  const store = getStore();

  const emailRaw = String(payload.cliente.email || "").trim();
  const email = emailRaw.toLowerCase();
  const telefono = String(payload.cliente.telefono || "").trim();
  const nome = String(payload.cliente.nome || "").trim();
  const cognome = String(payload.cliente.cognome || "").trim();
  const nomeNorm = nome.toLowerCase();
  const cognomeNorm = cognome.toLowerCase();
  const partnerNome = String(payload.cliente.partnerNome || "").trim();
  const partnerCognome = String(payload.cliente.partnerCognome || "").trim();

  const tipoCliente: 'privato' | 'azienda' = payload.tipo_cliente === 'azienda' ? 'azienda' : 'privato';
  const ragioneSociale = tipoCliente === 'azienda' ? String(payload.ragione_sociale || "").trim() : "";
  const partitaIva = tipoCliente === 'azienda' ? String(payload.partita_iva || "").trim() : "";
  const sdi = tipoCliente === 'azienda' ? String(payload.sdi || "").trim() : "";
  const pec = tipoCliente === 'azienda' ? String(payload.pec || "").trim() : "";
  const codiceFiscale = String(payload.cliente.codice_fiscale || "").trim();

  // Stesso cliente SOLO se coincidono contatto (email o telefono) E nome + cognome.
  const hasContact = Boolean(email || telefono);
  const contactMatches = (c: any) =>
    (!!email && String(c.email || "").trim().toLowerCase() === email) ||
    (!!telefono && String(c.telefono || "").trim() === telefono);
  const nameMatches = (c: any) =>
    String(c.nome || "").trim().toLowerCase() === nomeNorm &&
    String(c.cognome || "").trim().toLowerCase() === cognomeNorm;

  let client: any;
  if (hasContact) {
    client = store.clients.find((c) => contactMatches(c) && nameMatches(c));
  }

  if (!client) {
    // Persona (o simulazione) diversa: nuovo record cliente autonomo.
    client = {
      id: crypto.randomUUID(),
      nome,
      cognome,
      email: emailRaw,
      telefono,
      codice_fiscale: codiceFiscale,
      tipo_cliente: tipoCliente,
      ragione_sociale: ragioneSociale,
      partita_iva: partitaIva,
      sdi: sdi,
      pec: pec,
      sposera_nome: partnerNome,
      sposera_cognome: partnerCognome,
      provenienza: "Admin Rapido",
      created_at: new Date().toISOString(),
    };
    store.clients.unshift(client);
  } else {
    // Stesso cliente: i dati dell'emissione corrente aggiornano il record.
    if (nome) client.nome = nome;
    if (cognome) client.cognome = cognome;
    if (emailRaw) client.email = emailRaw;
    if (telefono) client.telefono = telefono;
    if (codiceFiscale) client.codice_fiscale = codiceFiscale;
    if (partnerNome) client.sposera_nome = partnerNome;
    if (partnerCognome) client.sposera_cognome = partnerCognome;

    client.tipo_cliente = tipoCliente;
    if (tipoCliente === 'azienda') {
      // I dati fiscali aziendali dell'emissione corrente prevalgono su quelli precedenti.
      if (ragioneSociale) client.ragione_sociale = ragioneSociale;
      if (partitaIva) client.partita_iva = partitaIva;
      if (sdi) client.sdi = sdi;
      if (pec) client.pec = pec;
    }

    // Allinea alla tabella `quotes` gli snapshot del cliente già collegati,
    // così ogni riepilogo riflette sempre i dati aggiornati.
    (store.quotes || []).forEach((q: any) => {
      if (q && q.client_id === client.id) q.clients = client;
    });
  }

  const prezzo = Number(payload.prezzo) || 0;
  const caparra = payload.importo_caparra ?? Math.min(1500, prezzo);
  const secondoAcconto =
    payload.importo_secondo_acconto ?? Math.min(3000, Math.max(0, prezzo - caparra));

  const quoteId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  const quote = {
    id: quoteId,
    client_id: client.id,
    tipo_evento: payload.tipo_evento === "wedding" ? "wedding" : "eventi",
    tipo_cliente: tipoCliente,
    ragione_sociale: ragioneSociale,
    partita_iva: partitaIva,
    sdi: sdi,
    pec: pec,
    data_evento: payload.data_evento,
    turno: payload.turno || null,
    tipo_esclusiva: payload.tipo_esclusiva || "semi_esclusiva",
    spazi_riservati: payload.spazi_riservati || [],
    canale_contratto: payload.canale_contratto || "accordo_diretto",
    source: payload.source || "admin_rapido",
    fase_contratto: payload.fase_contratto || "accordo_diretto",
    opzione: payload.opzione ?? null,
    numero_ospiti: 0,
    items: payload.items || [],
    sconto_fisso: 0,
    prezzo: prezzo,
    totale: prezzo,
    totale_calcolato: prezzo,
    importo_caparra: caparra,
    importo_secondo_acconto: secondoAcconto,
    note_visita_segreteria: payload.note || "",
    status: "inviato",
    created_at: nowIso,
    updated_at: nowIso,
    // Snapshot del cliente dell'emissione corrente: garantisce che il riepilogo
    // e il link del contratto mostrino sempre nome/cognome inseriti da Roberto.
    clients: client,
  };

  store.quotes.unshift(quote);
  saveStore(store);

  return { quoteId, client, quote, clientId: client.id };
}

export interface ExistingClientEventPayload {
  /** id esatto del cliente esistente in `store.clients`. */
  client_id: string;
  tipo_evento: string;
  /** 'YYYY-MM-DD' */
  data_evento: string;
  turno?: string;
  tipo_esclusiva?: string;
  spazi_riservati?: string[];
  canale_contratto?: string;
  source?: string;
  fase_contratto?: string;
  prezzo?: number;
  items?: any[];
  note?: string;
  importo_caparra?: number;
  importo_secondo_acconto?: number;
  opzione?: any;
}

/**
 * Crea una quote rapida collegandola in modo RIGOROSO a un cliente esistente
 * (per id esatto), senza ricerche per contatto. Usata dalla Rubrica Clienti
 * per il flusso "Nuovo Evento per Cliente Esistente".
 *
 * Restituisce `null` se il cliente non esiste, così il chiamante può
 * interrompere senza creare record orfani.
 */
export function createClientEventQuoteLocal(payload: ExistingClientEventPayload) {
  const store = getStore();
  const client = (store.clients || []).find((c: any) => c && c.id === payload.client_id);
  if (!client) return null;

  const prezzo = Number(payload.prezzo) || 0;
  const caparra = payload.importo_caparra ?? Math.min(1500, prezzo);
  const secondoAcconto =
    payload.importo_secondo_acconto ?? Math.min(3000, Math.max(0, prezzo - caparra));

  const quoteId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  const quote = {
    id: quoteId,
    client_id: client.id,
    tipo_evento: payload.tipo_evento === "wedding" ? "wedding" : "eventi",
    tipo_cliente: client.tipo_cliente === "azienda" ? "azienda" : "privato",
    ragione_sociale: client.ragione_sociale || "",
    partita_iva: client.partita_iva || "",
    sdi: client.sdi || "",
    pec: client.pec || "",
    data_evento: payload.data_evento,
    turno: payload.turno || null,
    tipo_esclusiva: payload.tipo_esclusiva || "semi_esclusiva",
    spazi_riservati: payload.spazi_riservati || [],
    canale_contratto: payload.canale_contratto || "accordo_diretto",
    source: payload.source || "admin_clienti",
    fase_contratto: payload.fase_contratto || "accordo_diretto",
    opzione: payload.opzione ?? null,
    numero_ospiti: 0,
    items: payload.items || [],
    sconto_fisso: 0,
    prezzo: prezzo,
    totale: prezzo,
    totale_calcolato: prezzo,
    importo_caparra: caparra,
    importo_secondo_acconto: secondoAcconto,
    note_visita_segreteria: payload.note || "",
    status: "inviato",
    created_at: nowIso,
    updated_at: nowIso,
    clients: client,
  };

  store.quotes.unshift(quote);
  saveStore(store);

  return { quoteId, client, quote, clientId: client.id };
}

const OPTION_QUICK_DAYS = 7;
const OPTION_QUICK_PRELAZIONE_ORE = 24;

/**
 * Registra un'opzione rapida da calendario: solo contatto, data, turno e spazio.
 * Il cliente viene creato o riassociato (email/telefono); la quote nasce con
 * status 'opzione' e fase 'opzione_rapida', con scadenza automatica a 7 giorni.
 * Il controllo di disponibilità è a carico del chiamante (slotAvailability).
 */
export function saveQuickCalendarOptionLocal(data: {
  nome: string;
  telefono: string;
  email?: string;
  dataEvento: string;
  turno: string;
  formula: string;
  note?: string;
  tipoEvento?: 'wedding' | 'eventi';
}) {
  const store = getStore();

  const email = String(data.email || "").trim().toLowerCase();
  const telefono = String(data.telefono || "").trim();
  const nome = String(data.nome || "").trim();
  const nowIso = new Date().toISOString();

  let client = store.clients.find(
    c =>
      (email && String(c.email || "").trim().toLowerCase() === email) ||
      (telefono && String(c.telefono || "").trim() === telefono)
  );

  if (!client) {
    client = {
      id: crypto.randomUUID(),
      nome,
      cognome: "",
      email: String(data.email || "").trim(),
      telefono,
      provenienza: "Opzione Calendario",
      created_at: nowIso,
    };
    store.clients.unshift(client);
  } else {
    if (!client.nome && nome) client.nome = nome;
    if (!client.email && data.email) client.email = String(data.email).trim();
    if (!client.telefono && telefono) client.telefono = telefono;
  }

  const formula = String(data.formula || "esclusiva");
  const isEsclusiva = formula === "esclusiva";
  const semi = formula === "sala_tufo" ? "sala_tufo" : "sala_bianca";
  const tipoEsclusiva = isEsclusiva ? "esclusiva" : "semi_esclusiva";
  const spazi = isEsclusiva ? [] : [...SEMI_ESCLUSIVA_FORMULE[semi].spazi];
  const turno = data.turno === "cena" ? "cena" : "pranzo";

  const now = new Date();
  const scadenza = new Date(now.getTime() + OPTION_QUICK_DAYS * 24 * 60 * 60 * 1000);

  const opzione = {
    attiva: true,
    tipo: tipoEsclusiva,
    data_inizio: now.toISOString(),
    scadenza: scadenza.toISOString(),
    turno,
    spazi,
    canale: "opzione_calendario",
    prelazione_ore: OPTION_QUICK_PRELAZIONE_ORE,
  };

  const quoteId = crypto.randomUUID();
  const quote = {
    id: quoteId,
    client_id: client.id,
    tipo_evento: data.tipoEvento === "eventi" ? "eventi" : "wedding",
    data_evento: data.dataEvento,
    turno,
    tipo_esclusiva: tipoEsclusiva,
    spazi_riservati: spazi,
    formula_opzione: isEsclusiva ? "esclusiva" : semi,
    canale_contratto: "opzione_calendario",
    source: "calendario_opzione_rapida",
    fase_contratto: "opzione_rapida",
    opzione,
    numero_ospiti: 0,
    items: [],
    sconto_fisso: 0,
    prezzo: 0,
    totale: 0,
    totale_calcolato: 0,
    note_visita_segreteria: data.note || "",
    status: "opzione",
    created_at: nowIso,
    updated_at: nowIso,
  };

  store.quotes.unshift(quote);
  saveStore(store);

  return { quoteId, client, quote };
}

export interface QuickCalendarOptionLocal {
  quoteId: string;
  nome: string;
  telefono: string;
  email: string;
  data_evento: string;
  turno: string;
  tipo_esclusiva: 'esclusiva' | 'semi_esclusiva';
  spazi: string[];
  formula: string;
  note: string;
  scadenza: string;
  giorniRimanenti: number;
  scaduta: boolean;
  created_at: string;
}

/** Opzioni rapide da calendario ancora aperte (non convertite né rilasciate). */
export function getQuickCalendarOptionsLocal(): QuickCalendarOptionLocal[] {
  const store = getStore();
  const nowMs = Date.now();

  const results: QuickCalendarOptionLocal[] = [];
  (store.quotes || []).forEach((q) => {
    if (!q || !q.id) return;
    if (q.fase_contratto !== 'opzione_rapida' || q.status !== 'opzione') return;
    if (!q.data_evento) return;

    const client = (store.clients || []).find((c) => c && c.id === q.client_id) || {};
    const rawScadenza = q.opzione?.scadenza;
    const parsedMs = rawScadenza ? new Date(rawScadenza).getTime() : NaN;
    const createdMs = new Date(q.created_at || nowMs).getTime();
    const scadenzaMs = Number.isFinite(parsedMs)
      ? parsedMs
      : (Number.isFinite(createdMs) ? createdMs : nowMs) + OPTION_QUICK_DAYS * 24 * 60 * 60 * 1000;
    const giorniRimanenti = Math.ceil((scadenzaMs - nowMs) / (1000 * 60 * 60 * 24));

    results.push({
      quoteId: q.id,
      nome: [client.nome, client.cognome].filter(Boolean).join(' ').trim() || 'Cliente',
      telefono: String(client.telefono || ''),
      email: String(client.email || ''),
      data_evento: String(q.data_evento).slice(0, 10),
      turno: q.turno === 'cena' ? 'cena' : 'pranzo',
      tipo_esclusiva: q.tipo_esclusiva === 'esclusiva' ? 'esclusiva' : 'semi_esclusiva',
      spazi: Array.isArray(q.spazi_riservati) ? q.spazi_riservati : [],
      formula: String(q.formula_opzione || (q.tipo_esclusiva === 'esclusiva' ? 'esclusiva' : 'sala_bianca')),
      note: String(q.note_visita_segreteria || ''),
      scadenza: new Date(scadenzaMs).toISOString(),
      giorniRimanenti,
      scaduta: giorniRimanenti < 0,
      created_at: q.created_at || '',
    });
  });

  return results;
}

/**
 * Chiude un'opzione rapida convertita in contratto: libera lo slot (il nuovo
 * contratto lo occupa già) e conserva il collegamento per tracciabilità.
 */
export function markQuickOptionConvertedLocal(optionQuoteId: string, newQuoteId: string): boolean {
  const store = getStore();
  const search = String(optionQuoteId || '').trim().toLowerCase();
  if (!search) return false;
  const quote = store.quotes.find(
    (q) => q && String(q.id).toLowerCase() === search && q.fase_contratto === 'opzione_rapida'
  );
  if (!quote) return false;

  quote.status = 'opzione_convertita';
  quote.opzione = {
    ...(quote.opzione || {}),
    attiva: false,
    convertita: true,
    convertita_in: newQuoteId,
    convertita_il: new Date().toISOString(),
  };
  quote.updated_at = new Date().toISOString();
  saveStore(store);
  return true;
}

/* ------------------------------------------------------------------ */
/* Contratti in attesa di firma (pending)                             */
/* Solo funzioni NUOVE: non modificano la pipeline esistente.         */
/* ------------------------------------------------------------------ */

export interface PendingContractLocal {
  /** id completo del preventivo/quote */
  quoteId: string;
  /** numero preventivo (prefisso di 8 caratteri dell'id) */
  preventivo: string;
  client_id: string | null;
  /** cliente associato da `store.clients` (null se non trovato) */
  cliente: any;
  cliente_nome: string;
  intestatari: string;
  tipo_evento: string;
  tipoEvento: 'wedding' | 'eventi';
  data_evento: string | null;
  status: string;
  prezzo: number;
  caparra: number;
  saldo: number;
  sig: string;
  url: string;
  absoluteUrl: string;
  whatsappText: string;
  opzione: any | null;
  opzione_attiva: boolean;
  scadenza: string;
  giorniRimanenti: number;
  scaduta: boolean;
  created_at: string;
  updated_at: string | null;
  /** record quote completo, per eventuali usi avanzati a valle */
  quote: any;
}

function formatEuroPending(value: number): string {
  return new Intl.NumberFormat('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    .format(Math.max(0, Math.round(value)));
}

/**
 * Raccoglie le chiavi identificative dei contratti già firmati/finalizzati,
 * confrontando `quote_id`, `preventivo` e il relativo prefisso a 8 caratteri.
 */
function collectContractKeys(records: any[] | undefined, keys: Set<string>) {
  (records || []).forEach((record) => {
    if (!record) return;
    [record.quote_id, record.preventivo, record.quoteId].forEach((value) => {
      if (!value) return;
      const key = String(value).toLowerCase();
      keys.add(key);
      keys.add(key.slice(0, 8));
    });
  });
}

function buildPendingWhatsAppText(params: {
  nome: string;
  dataEvento: string;
  prezzo: number;
  caparra: number;
  secondoAcconto: number;
  saldo: number;
  absoluteUrl: string;
  giorniRimanenti: number;
  scaduta: boolean;
  scadenza: string;
  tipoEvento: 'wedding' | 'eventi';
}): string {
  const righe = [
    `Ciao ${params.nome}, ecco il riepilogo del contratto presso La Terra degli Aranci:`,
    '',
    `🎉 Tipo evento: ${params.tipoEvento === 'wedding' ? 'Matrimonio' : 'Evento privato'}`,
    `📅 Data evento: ${params.dataEvento}`,
    `💶 Canone fitto location: € ${formatEuroPending(params.prezzo)}`,
    `🔒 Caparra confirmatoria (alla firma): € ${formatEuroPending(params.caparra)}`,
  ];

  if (params.secondoAcconto > 0) {
    righe.push(`📆 2° acconto (a -6 mesi dall'evento): € ${formatEuroPending(params.secondoAcconto)}`);
  }

  righe.push(`💳 Saldo (all'evento): € ${formatEuroPending(params.saldo)}`);

  if (params.scaduta) {
    righe.push("⚠️ L'opzione sulla data è scaduta: ti consigliamo di ricontattarci per confermarla.");
  } else if (params.scadenza) {
    righe.push(
      `⏳ Opzione riservata ancora per ${params.giorniRimanenti} giorn${params.giorniRimanenti === 1 ? 'o' : 'i'} (fino al ${params.scadenza}).`
    );
  }

  righe.push('', 'Firma il contratto digitale qui:', params.absoluteUrl);
  return righe.join('\n');
}

/**
 * Elenca tutti i preventivi/contratti in attesa di firma:
 * accordi diretti, admin rapido, convertiti o inviati con opzione attiva,
 * escludendo quelli già firmati (`signed_contracts` / `final_contracts`).
 */
export function getPendingContractsLocal(): PendingContractLocal[] {
  const store = getStore();

  const signedKeys = new Set<string>();
  collectContractKeys(store.signed_contracts, signedKeys);
  collectContractKeys(store.final_contracts, signedKeys);

  const nowMs = Date.now();
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'https://ecosistema.laterradegliaranci.it'
  ).replace(/\/+$/, '');

  const isSigned = (q: any): boolean => {
    if (q.status === 'firmato') return true;
    const candidates = [q.id, q.preventivo, q.id ? String(q.id).slice(0, 8) : ''];
    return candidates.some((value) => value && signedKeys.has(String(value).toLowerCase()));
  };

  const isPending = (q: any): boolean =>
    q.fase_contratto === 'accordo_diretto' ||
    q.canale_contratto === 'accordo_diretto' ||
    q.source === 'admin_rapido' ||
    q.status === 'convertito' ||
    (q.status === 'inviato' && !!q.opzione?.attiva);

  const results: PendingContractLocal[] = [];

  (store.quotes || []).forEach((q) => {
    if (!q || !q.id) return;
    if (!isPending(q)) return;
    if (isSigned(q)) return;

    const client = (store.clients || []).find((c) => c && c.id === q.client_id) || null;
    const intestatari = client
      ? [client.nome, client.cognome].filter(Boolean).join(' ').trim() || 'Cliente'
      : 'Cliente';

    const preventivo = String(q.id).slice(0, 8);
    const prezzo = Number(q.prezzo ?? q.totale ?? q.totale_calcolato ?? 0);
    const caparra = Number(q.importo_caparra ?? Math.min(1500, prezzo));
    const secondoAcconto = Number(q.importo_secondo_acconto ?? 0) || 0;
    const saldo = Math.max(0, prezzo - caparra - secondoAcconto);
    const sig = generateSignature(String(prezzo), preventivo);
    const tipoEvento: 'wedding' | 'eventi' = q.tipo_evento === 'wedding' ? 'wedding' : 'eventi';
    const url = `/contratti/${tipoEvento}?prezzo=${prezzo}&preventivo=${preventivo}&sig=${sig}`;
    const absoluteUrl = `${baseUrl}${url}`;

    // Opzione: scadenza esplicita oppure 7 giorni dalla creazione.
    const createdMs = new Date(q.created_at || q.updated_at || nowMs).getTime();
    const fallbackScadenzaMs =
      (Number.isFinite(createdMs) ? createdMs : nowMs) + 7 * 24 * 60 * 60 * 1000;
    const rawScadenza = q.opzione?.scadenza;
    const parsedScadenzaMs = rawScadenza ? new Date(rawScadenza).getTime() : NaN;
    const scadenzaMs = Number.isFinite(parsedScadenzaMs) ? parsedScadenzaMs : fallbackScadenzaMs;
    const giorniRimanenti = Math.ceil((scadenzaMs - nowMs) / (1000 * 60 * 60 * 24));
    const scaduta = giorniRimanenti < 0;
    const scadenza = new Date(scadenzaMs).toISOString();

    const whatsappText = buildPendingWhatsAppText({
      nome: intestatari,
      dataEvento: String(q.data_evento || 'da definire'),
      prezzo,
      caparra,
      secondoAcconto,
      saldo,
      absoluteUrl,
      giorniRimanenti,
      scaduta,
      scadenza,
      tipoEvento,
    });

    results.push({
      quoteId: q.id,
      preventivo,
      client_id: q.client_id ?? null,
      cliente: client,
      cliente_nome: intestatari,
      intestatari,
      tipo_evento: q.tipo_evento || tipoEvento,
      tipoEvento,
      data_evento: q.data_evento || null,
      status: q.status || '',
      prezzo,
      caparra,
      saldo,
      sig,
      url,
      absoluteUrl,
      whatsappText,
      opzione: q.opzione ?? null,
      opzione_attiva: !!q.opzione?.attiva,
      scadenza,
      giorniRimanenti,
      scaduta,
      created_at: q.created_at || '',
      updated_at: q.updated_at || null,
      quote: q,
    });
  });

  return results.sort(
    (a, b) => (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0)
  );
}

/**
 * Elimina un contratto in attesa di firma (match per id esatto o prefisso).
 * Restituisce `true` se la quote è stata trovata ed eliminata.
 */
export function deletePendingContractLocal(quoteId: string): boolean {
  const store = getStore();
  const search = String(quoteId || '').trim().toLowerCase();
  if (!search) return false;

  // Un id può essere passato per intero o come prefisso (numero preventivo a 8
  // caratteri). Il match è bidirezionale: id esatto, id che inizia con la
  // ricerca, oppure ricerca che inizia con l'id.
  const matches = (value: any): boolean => {
    const qid = String(value || '').trim().toLowerCase();
    if (!qid) return false;
    return qid === search || qid.startsWith(search) || search.startsWith(qid);
  };

  let removed = false;

  // Filtra TUTTE le quote corrispondenti: submit multipli possono aver
  // generato duplicati, uno splice singolo ne lascerebbe qualcuno orfano.
  if (Array.isArray(store.quotes)) {
    const before = store.quotes.length;
    store.quotes = store.quotes.filter((q) => !(q && matches(q.id)));
    if (store.quotes.length !== before) removed = true;
  }

  // Rimuove anche l'eventuale contratto finale collegato, se presente.
  if (Array.isArray(store.final_contracts)) {
    const before = store.final_contracts.length;
    store.final_contracts = store.final_contracts.filter(
      (fc) => !(fc && (matches(fc.quote_id) || matches(fc.quoteId) || matches(fc.id)))
    );
    if (store.final_contracts.length !== before) removed = true;
  }

  if (!removed) return false;

  saveStore(store);
  return true;
}

/* ------------------------------------------------------------------ */
/* Riprogrammazione data/turno evento (Scheda Regia)                   */
/* ------------------------------------------------------------------ */

export interface QuoteScheduleUpdate {
  /** Nuova data evento 'YYYY-MM-DD'. */
  data_evento?: string;
  turno?: string | null;
  tipo_esclusiva?: string;
  spazi_riservati?: string[];
  formula_opzione?: string | null;
}

/**
 * Aggiorna data/turno/formula di un preventivo (match per id esatto o prefisso).
 * Usato dalla "Sposta Data" della Scheda Regia dopo la verifica dei conflitti.
 */
export function updateQuoteScheduleLocal(quoteId: string, schedule: QuoteScheduleUpdate) {
  const store = getStore();
  const search = String(quoteId || '').toLowerCase();
  if (!search) return null;

  const quote =
    store.quotes.find((q) => String(q.id).toLowerCase() === search) ||
    store.quotes.find((q) => String(q.id).toLowerCase().startsWith(search));
  if (!quote) return null;

  if (schedule.data_evento !== undefined) quote.data_evento = schedule.data_evento;
  if (schedule.turno !== undefined) quote.turno = schedule.turno;
  if (schedule.tipo_esclusiva !== undefined) quote.tipo_esclusiva = schedule.tipo_esclusiva;
  if (schedule.spazi_riservati !== undefined) quote.spazi_riservati = schedule.spazi_riservati;
  if (schedule.formula_opzione !== undefined) quote.formula_opzione = schedule.formula_opzione;

  quote.updated_at = new Date().toISOString();
  saveStore(store);
  return quote;
}

/* ------------------------------------------------------------------ */
/* Appuntamenti & Visite in Tenuta                                     */
/* ------------------------------------------------------------------ */

/**
 * Estrae `YYYY-MM-DD` e `HH:mm` da un valore data/ora. Accetta sia
 * `'YYYY-MM-DDTHH:mm'` sia un ISO completo; in assenza di orario restituisce ''.
 */
function splitDataOra(value: unknown): { data: string; ora: string } {
  const raw = String(value ?? '').trim();
  if (!raw) return { data: '', ora: '' };
  const match = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/.exec(raw);
  if (!match) return { data: '', ora: '' };
  return { data: match[1], ora: match[2] || '' };
}

/**
 * Converte una data ISO `YYYY-MM-DD` in etichetta leggibile `gg/mm/aaaa`.
 * Se il valore non è una data ISO, lo restituisce invariato.
 */
function formatIsoToItalian(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || '').trim());
  if (!m) return String(value || '').trim();
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/**
 * Genera 8 appuntamenti dimostrativi realistici (agenda segreteria): un mix di
 * wedding e eventi privati, con 3 visite già fissate per OGGI e 2 per domani.
 * Usato solo quando lo store non contiene ancora alcun appuntamento.
 */
function buildDemoAppointments(): Appointment[] {
  const now = new Date().toISOString();
  const rows: Array<Omit<Appointment, 'id'>> = [
    {
      tipo: 'wedding',
      nome: 'Marco',
      cognome: 'Esposito',
      partnerNome: 'Sofia',
      partnerCognome: 'De Luca',
      telefono: '333 124 7789',
      email: 'marco.esposito@gmail.com',
      dataOra: '2026-10-08T11:30',
      dataAppuntamento: '2026-10-08',
      orarioAppuntamento: '11:30',
      dataEventoPresunta: 'Luglio 2027',
      interesse: 'esclusiva',
      ospitiPrevisti: 120,
      canale: 'sito_web',
      stato: 'confermato',
      note: 'Coppia in cerca di location esclusiva. Interessati al giardino degli agrumi e alla villa per il ricevimento.',
      created_at: now,
    },
    {
      tipo: 'privato',
      nome: 'Giulia',
      cognome: 'De Angelis',
      telefono: '340 552 1180',
      email: 'g.deangelis@azienda.it',
      dataOra: '2026-10-08T16:00',
      dataAppuntamento: '2026-10-08',
      orarioAppuntamento: '16:00',
      dataEventoPresunta: 'Dicembre 2026',
      interesse: 'sala_bianca',
      ospitiPrevisti: 80,
      canale: 'telefono',
      stato: 'da_confermare',
      note: 'Evento aziendale di fine anno (convention + cena). Referente amministrazione. Richiede proiettore e palco.',
      created_at: now,
    },
    {
      tipo: 'wedding',
      nome: 'Alessandro',
      cognome: 'Russo',
      partnerNome: 'Chiara',
      partnerCognome: 'Greco',
      telefono: '328 991 4477',
      email: 'ale.russo@libero.it',
      dataOra: '2026-10-08T18:00',
      dataAppuntamento: '2026-10-08',
      orarioAppuntamento: '18:00',
      dataEventoPresunta: 'Settembre 2027',
      interesse: 'sala_tufo',
      ospitiPrevisti: 150,
      canale: 'whatsapp',
      stato: 'confermato',
      note: 'Preferiscono la Sala Tufo per la cerimonia civile. Verificare disponibilità weekend di settembre.',
      created_at: now,
    },
    {
      tipo: 'privato',
      nome: 'Paolo',
      cognome: 'Ferrara',
      telefono: '347 220 9081',
      email: 'paolo.ferrara50@gmail.com',
      dataOra: '2026-10-09T10:00',
      dataAppuntamento: '2026-10-09',
      orarioAppuntamento: '10:00',
      dataEventoPresunta: 'Aprile 2027',
      interesse: 'semi_esclusiva',
      ospitiPrevisti: 60,
      canale: 'passaparola',
      stato: 'da_confermare',
      note: 'Cinquantesimo compleanno a sorpresa organizzato dalla moglie. Sopralluogo per allestimento.',
      created_at: now,
    },
    {
      tipo: 'wedding',
      nome: 'Luca',
      cognome: 'Bianchi',
      partnerNome: 'Martina',
      partnerCognome: 'Conti',
      telefono: '335 776 2234',
      email: 'lucaemartina2027@gmail.com',
      dataOra: '2026-10-09T17:30',
      dataAppuntamento: '2026-10-09',
      orarioAppuntamento: '17:30',
      dataEventoPresunta: 'Giugno 2027',
      interesse: 'esclusiva',
      ospitiPrevisti: 100,
      canale: 'instagram',
      stato: 'confermato',
      note: 'Arrivano da fuori regione. Chiedono info su alloggio per gli invitati e navetta.',
      created_at: now,
    },
    {
      tipo: 'privato',
      nome: 'Anna',
      cognome: 'Romano',
      telefono: '338 014 5522',
      email: 'anna.romano@outlook.it',
      dataOra: '2026-10-12T15:00',
      dataAppuntamento: '2026-10-12',
      orarioAppuntamento: '15:00',
      dataEventoPresunta: 'Maggio 2027',
      interesse: 'sala_bianca',
      ospitiPrevisti: 45,
      canale: 'telefono',
      stato: 'da_confermare',
      note: 'Battesimo della nipote. Vuole vedere la Sala Bianca allestita per un pranzo di famiglia.',
      created_at: now,
    },
    {
      tipo: 'wedding',
      nome: 'Francesco',
      cognome: 'Marino',
      partnerNome: 'Elena',
      partnerCognome: 'Vitale',
      telefono: '366 340 7712',
      email: 'francesco.marino@icloud.com',
      dataOra: '2026-10-15T12:00',
      dataAppuntamento: '2026-10-15',
      orarioAppuntamento: '12:00',
      dataEventoPresunta: 'Maggio 2027',
      interesse: 'semi_esclusiva',
      ospitiPrevisti: 130,
      canale: 'sito_web',
      stato: 'da_confermare',
      note: 'Richiesta dal form del sito. Interessati a pacchetto semi-esclusivo con banqueting incluso.',
      created_at: now,
    },
    {
      tipo: 'wedding',
      nome: 'Davide',
      cognome: 'Sanna',
      partnerNome: 'Irene',
      partnerCognome: 'Costa',
      telefono: '349 887 3310',
      email: 'davide.sanna@gmail.com',
      dataOra: '2026-10-05T16:30',
      dataAppuntamento: '2026-10-05',
      orarioAppuntamento: '16:30',
      dataEventoPresunta: 'Luglio 2027',
      interesse: 'esclusiva',
      ospitiPrevisti: 110,
      canale: 'passaparola',
      stato: 'effettuato',
      note: 'Visita effettuata: molto interessati, inviato preventivo esclusiva da ricontattare entro la settimana.',
      created_at: now,
    },
  ];

  return rows.map((row) => ({
    ...row,
    id: `apt-${crypto.randomUUID().slice(0, 8)}`,
  }));
}

/** Elenco completo degli appuntamenti, ordinato dal più imminente al più lontano. */
export function getAllAppointmentsLocal(): Appointment[] {
  const store = getStore();
  const list = Array.isArray(store.appointments) ? store.appointments : [];
  return list.slice().sort((a, b) => {
    const byDate = String(a.dataAppuntamento || '').localeCompare(String(b.dataAppuntamento || ''));
    if (byDate !== 0) return byDate;
    return String(a.orarioAppuntamento || '').localeCompare(String(b.orarioAppuntamento || ''));
  });
}

/**
 * Crea un nuovo appuntamento. I campi mancanti vengono normalizzati con default
 * sicuri e, se `dataOra` è presente ma data/orario no, vengono derivati da essa.
 */
export function createAppointmentLocal(data: Partial<Appointment>): Appointment {
  const store = getStore();
  if (!Array.isArray(store.appointments)) store.appointments = [];

  const dataOra = String(data.dataOra || '').trim();
  const split = splitDataOra(dataOra);
  const dataAppuntamento = String(data.dataAppuntamento || split.data || '').trim();
  const orarioAppuntamento = String(data.orarioAppuntamento || split.ora || '').trim();

  const entry: Appointment = {
    id: data.id || `apt-${crypto.randomUUID().slice(0, 8)}`,
    tipo: data.tipo === 'privato' ? 'privato' : 'wedding',
    nome: String(data.nome || '').trim(),
    cognome: data.cognome ? String(data.cognome).trim() : undefined,
    partnerNome: data.partnerNome ? String(data.partnerNome).trim() : undefined,
    partnerCognome: data.partnerCognome ? String(data.partnerCognome).trim() : undefined,
    telefono: String(data.telefono || '').trim(),
    email: data.email ? String(data.email).trim() : undefined,
    dataOra: dataOra || (dataAppuntamento && orarioAppuntamento ? `${dataAppuntamento}T${orarioAppuntamento}` : dataAppuntamento),
    dataAppuntamento,
    orarioAppuntamento,
    dataEventoPresunta: data.dataEventoPresunta ? String(data.dataEventoPresunta).trim() : undefined,
    interesse: data.interesse || 'da_definire',
    ospitiPrevisti: Number.isFinite(Number(data.ospitiPrevisti)) && Number(data.ospitiPrevisti) > 0
      ? Number(data.ospitiPrevisti)
      : undefined,
    canale: data.canale || 'telefono',
    stato: data.stato || 'da_confermare',
    note: data.note ? String(data.note).trim() : undefined,
    created_at: data.created_at || new Date().toISOString(),
  };

  store.appointments.push(entry);
  saveStore(store);
  return entry;
}

/** Aggiorna lo stato di un appuntamento. `true` se trovato e aggiornato. */
export function updateAppointmentStatusLocal(id: string, stato: Appointment['stato']): boolean {
  const store = getStore();
  if (!Array.isArray(store.appointments)) return false;
  const appointment = store.appointments.find((a) => a && a.id === id);
  if (!appointment) return false;
  appointment.stato = stato;
  saveStore(store);
  return true;
}

/** Elimina un appuntamento per id. `true` se trovato e rimosso. */
export function deleteAppointmentLocal(id: string): boolean {
  const store = getStore();
  if (!Array.isArray(store.appointments)) return false;
  const before = store.appointments.length;
  store.appointments = store.appointments.filter((a) => !(a && a.id === id));
  if (store.appointments.length === before) return false;
  saveStore(store);
  return true;
}

/** Recupera un singolo appuntamento per id (o `null` se non esiste). */
export function getAppointmentLocal(id: string): Appointment | null {
  const store = getStore();
  if (!Array.isArray(store.appointments)) return null;
  return store.appointments.find((a) => a && a.id === id) || null;
}

/**
 * Aggiorna (o imposta) le preferenze visita di un appuntamento. Registra il
 * timestamp di aggiornamento così la direzione sa quando sono state raccolte.
 */
export function updateAppointmentPreferencesLocal(
  id: string,
  preferenze: AppointmentPreferences
): Appointment | null {
  const store = getStore();
  if (!Array.isArray(store.appointments)) return null;
  const appointment = store.appointments.find((a) => a && a.id === id);
  if (!appointment) return null;
  const existing = appointment.preferenze;
  // Preserva `preferenzeServizi` dal payload se fornito, altrimenti dall'oggetto
  // esistente: un autosave parziale non deve mai cancellare i servizi del tour.
  const preservedServices = Array.isArray(preferenze?.preferenzeServizi)
    ? preferenze.preferenzeServizi
    : Array.isArray(existing?.preferenzeServizi)
      ? existing.preferenzeServizi
      : [];
  // Stessa logica di preservazione per le date candidate e il mese di riferimento.
  const preservedDates = Array.isArray(preferenze?.dateCandidate)
    ? preferenze.dateCandidate
    : Array.isArray(existing?.dateCandidate)
      ? existing.dateCandidate
      : [];
  const preservedMese =
    typeof preferenze?.mesePreferenza === 'string'
      ? preferenze.mesePreferenza
      : existing?.mesePreferenza ?? '';

  appointment.preferenze = {
    ...preferenze,
    preferenzeServizi: preservedServices,
    dateCandidate: preservedDates,
    mesePreferenza: preservedMese,
    updated_at: new Date().toISOString(),
  };

  // Se la coppia ha indicato date candidate, allinea il periodo evento presunto
  // con un'etichetta leggibile (es. "17/07/2027, 24/07/2027").
  if (preservedDates.length > 0) {
    appointment.dataEventoPresunta = preservedDates.map(formatIsoToItalian).join(', ');
  }

  saveStore(store);

  // Sincronizza le date candidate nel Wedding Diary della coppia, così le
  // ritrova già indicate nella propria Area Riservata.
  if (preservedDates.length > 0) {
    try {
      const client = findOrCreateClientForAppointmentLocal(appointment);
      const targetDates = preservedDates.join(', ');
      saveWeddingDiaryLocal({
        client_id: client.id,
        target_dates: targetDates,
        answers: { target_dates: targetDates },
      });
    } catch {
      // Il salvataggio dell'appuntamento resta comunque valido.
    }
  }

  return appointment;
}

/**
 * Trova (o crea) il record cliente collegato a un appuntamento, così le
 * preferenze raccolte dalla segreteria possono essere sincronizzate nel
 * Wedding Diary della coppia. Il matching usa email o telefono normalizzati;
 * in assenza di contatti ripiega su nome + cognome.
 */
interface ClientLike {
  id: string;
  nome?: string;
  cognome?: string;
  email?: string;
  telefono?: string;
  sposera_nome?: string;
  sposera_cognome?: string;
  provenienza?: string;
  created_at?: string;
  [key: string]: unknown;
}

export function findOrCreateClientForAppointmentLocal(appointment: Appointment): ClientLike {
  const store = getStore();
  if (!Array.isArray(store.clients)) store.clients = [];

  const email = String(appointment.email || '').trim().toLowerCase();
  const phoneDigits = String(appointment.telefono || '').replace(/\D/g, '');
  const nome = String(appointment.nome || '').trim();
  const cognome = String(appointment.cognome || '').trim();

  const matches = (c: ClientLike): boolean => {
    const cEmail = String(c?.email || '').trim().toLowerCase();
    const cPhone = String(c?.telefono || '').replace(/\D/g, '');
    if (email && cEmail && cEmail === email) return true;
    if (phoneDigits && cPhone && cPhone === phoneDigits) return true;
    if (
      !email &&
      !phoneDigits &&
      nome &&
      String(c?.nome || '').trim().toLowerCase() === nome.toLowerCase() &&
      String(c?.cognome || '').trim().toLowerCase() === cognome.toLowerCase()
    ) {
      return true;
    }
    return false;
  };

  let client: ClientLike | undefined = store.clients.find((c) => matches(c));

  if (!client) {
    client = {
      id: crypto.randomUUID(),
      nome,
      cognome,
      email: String(appointment.email || '').trim(),
      telefono: String(appointment.telefono || '').trim(),
      sposera_nome: appointment.partnerNome || '',
      sposera_cognome: appointment.partnerCognome || '',
      provenienza: 'Tablet Segreteria (Visita)',
      created_at: new Date().toISOString(),
    };
    store.clients.unshift(client);
  } else {
    if (nome && !client.nome) client.nome = nome;
    if (cognome && !client.cognome) client.cognome = cognome;
    if (appointment.email && !client.email) client.email = String(appointment.email).trim();
    if (appointment.telefono && !client.telefono) client.telefono = String(appointment.telefono).trim();
    if (appointment.partnerNome && !client.sposera_nome) client.sposera_nome = appointment.partnerNome;
    if (appointment.partnerCognome && !client.sposera_cognome) client.sposera_cognome = appointment.partnerCognome;
  }

  saveStore(store);
  return client;
}

/**
 * Toggle di un servizio/spazio preferito durante il Tour Fotografico Servizi.
 * - aggiunge/rimuove il titolo in `preferenze.preferenzeServizi`;
 * - allinea `preferenze.serviziInteresse` (stesso stato aggiunto/rimosso);
 * - sincronizza il Wedding Diary della coppia e traccia l'aggiornamento.
 * Ritorna `null` se l'appuntamento o il titolo non sono validi.
 */
export function toggleTourServicePreferenceLocal(
  appointmentId: string,
  serviceTitle: string
): { appointment: Appointment; added: boolean; currentServices: string[] } | null {
  const store = getStore();
  if (!Array.isArray(store.appointments)) return null;

  const appointment = store.appointments.find((a) => a && a.id === appointmentId);
  if (!appointment) return null;

  const title = String(serviceTitle || "").trim();
  if (!title) return null;

  const existing = appointment.preferenze;
  const base: AppointmentPreferences = {
    stileMood: existing?.stileMood ?? "",
    spaziSelezionati: Array.isArray(existing?.spaziSelezionati) ? [...existing.spaziSelezionati] : [],
    tipoCerimonia: existing?.tipoCerimonia ?? "",
    serviziInteresse: Array.isArray(existing?.serviziInteresse) ? [...existing.serviziInteresse] : [],
    preferenzeServizi: Array.isArray(existing?.preferenzeServizi) ? [...existing.preferenzeServizi] : [],
    dateCandidate: Array.isArray(existing?.dateCandidate) ? [...existing.dateCandidate] : [],
    mesePreferenza: existing?.mesePreferenza ?? "",
    musicaNote: existing?.musicaNote ?? "",
    celiaciNote: existing?.celiaciNote ?? "",
    noteGenerali: existing?.noteGenerali ?? "",
  };

  const currentTour = base.preferenzeServizi!;
  const serviceIndex = currentTour.findIndex((s) => s.toLowerCase() === title.toLowerCase());

  let added: boolean;
  let currentServices: string[];
  if (serviceIndex >= 0) {
    currentServices = currentTour.filter((_, i) => i !== serviceIndex);
    added = false;
  } else {
    currentServices = [...currentTour, title];
    added = true;
  }

  base.preferenzeServizi = currentServices;

  // Allinea `serviziInteresse` con lo stato del servizio nel tour.
  const interestIndex = base.serviziInteresse.findIndex((s) => s.toLowerCase() === title.toLowerCase());
  if (added) {
    if (interestIndex < 0) base.serviziInteresse = [...base.serviziInteresse, title];
  } else if (interestIndex >= 0) {
    base.serviziInteresse = base.serviziInteresse.filter((_, i) => i !== interestIndex);
  }

  base.updated_at = new Date().toISOString();
  appointment.preferenze = base;
  saveStore(store);

  // Sincronizza il Wedding Diary della coppia (trova o crea il cliente).
  const client = findOrCreateClientForAppointmentLocal(appointment);
  saveWeddingDiaryLocal({
    client_id: client.id,
    answers: {
      open_bar_cocktails: base.serviziInteresse.join(", "),
      tour_service_preferences: currentServices.join(", "),
    },
  });

  return { appointment, added, currentServices };
}


