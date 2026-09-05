import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SERVICES_CATALOG, ServiceCatalogItem } from '@/lib/servicesCatalog';

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
}

function getStore(): LocalStore {
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
      blog_posts: []
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
    if (!parsed.services_catalog || !Array.isArray(parsed.services_catalog) || parsed.services_catalog.length === 0) {
      parsed.services_catalog = [...SERVICES_CATALOG];
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
      ticket_orders: []
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

export function saveWeddingDiaryLocal(data: { client_id: string; quote_id?: string; palette?: string; style?: string; preferred_spaces?: string[]; dietary_notes?: string; music_preferences?: string; notes?: string }) {
  const store = getStore();
  if (!store.wedding_diaries) store.wedding_diaries = [];
  
  const index = store.wedding_diaries.findIndex(d => d.client_id === data.client_id || (data.quote_id && d.quote_id === data.quote_id));
  const entry = {
    id: index >= 0 ? store.wedding_diaries[index].id : crypto.randomUUID(),
    ...data,
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


