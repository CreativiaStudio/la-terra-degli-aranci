import { getServiceSupabase } from "@/lib/supabase";
import { getAllQuotesLocal, getServicesCatalogLocal, getAllWeddingDiariesLocal } from "@/lib/localDb";
import { ServiceCatalogItem } from "@/lib/servicesCatalog";

export function mapSupabaseRowToServiceCatalogItem(row: any): ServiceCatalogItem {
  return {
    id: row.id,
    code: row.code,
    categoria: row.categoria,
    nome: row.nome,
    titoloBase: row.titolo_base || row.titoloBase || undefined,
    variante: row.variante || undefined,
    descrizione: row.descrizione || '',
    prezzo_unitario: Number(row.prezzo_unitario) || 0,
    costo_fornitore: Number(row.costo_fornitore) || 0,
    fase_evento: row.fase_evento || 'generale',
    unita_misura: row.unita_misura || 'corpo',
    unitaLabel: row.unita_label || row.unitaLabel || '',
    splitLabel: row.split_label || row.splitLabel || '',
    splitKey: row.split_key || row.splitKey || '40_60',
    immagine: row.immagine || '',
    galleria: Array.isArray(row.galleria) ? row.galleria : [],
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function mapServiceCatalogItemToSupabaseRow(item: ServiceCatalogItem): Record<string, any> {
  return {
    id: item.id,
    code: item.code,
    categoria: item.categoria,
    nome: item.nome,
    titolo_base: item.titoloBase || null,
    variante: item.variante || null,
    descrizione: item.descrizione || null,
    prezzo_unitario: item.prezzo_unitario ?? 0,
    costo_fornitore: item.costo_fornitore ?? 0,
    fase_evento: item.fase_evento || 'generale',
    unita_misura: item.unita_misura || 'corpo',
    unita_label: item.unitaLabel || null,
    split_label: item.splitLabel || null,
    split_key: item.splitKey || null,
    immagine: item.immagine || null,
    galleria: item.galleria || [],
    updated_at: new Date().toISOString()
  };
}

export async function getQuotesFast(): Promise<any[]> {
  // Timeout iper-veloce a 150ms per caricamenti istantanei (evita l'attesa di rete/DNS)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 150);

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('quotes')
      .select('*, clients(*)')
      .order('created_at', { ascending: false })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {
    clearTimeout(timeoutId);
  }

  // Fallback istantaneo (< 5ms) sul DB locale
  return getAllQuotesLocal();
}

export async function getWeddingDiariesFast(): Promise<any[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 150);

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('wedding_diaries')
      .select('*')
      .order('updated_at', { ascending: false })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {
    clearTimeout(timeoutId);
  }

  return getAllWeddingDiariesLocal();
}

export async function getServicesCatalogFast(): Promise<ServiceCatalogItem[]> {
  // Timeout iper-veloce a 150ms per caricamento centralizzato Supabase
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 150);

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('services_catalog')
      .select('*')
      .order('code', { ascending: true })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (!error && data && data.length > 0) {
      return data.map(mapSupabaseRowToServiceCatalogItem);
    }
  } catch (e) {
    clearTimeout(timeoutId);
  }

  // Fallback istantaneo (< 5ms) sul DB locale
  return getServicesCatalogLocal();
}

/**
 * Interfaccia isolata per la Segreteria (Vincolo R2):
 * Rigorosamente PRIVATA di prezzo_unitario, costo_fornitore, split_key, split_label
 */
export interface SegreteriaCatalogItem {
  id: string;
  code: string;
  categoria: string;
  nome: string;
  titoloBase?: string;
  variante?: string;
  descrizione: string;
  fase_evento?: string;
  unita_misura: string;
  unitaLabel?: string;
  immagine?: string;
  galleria?: string[];
}

/**
 * Recupera il catalogo servizi per la vista tablet Segreteria
 * garantendo l'isolamento economico alla fonte (Data Layer Defense-in-Depth)
 */
export async function getServicesCatalogForSegreteria(): Promise<SegreteriaCatalogItem[]> {
  const fullCatalog = await getServicesCatalogFast();
  return fullCatalog.map((item) => ({
    id: item.id,
    code: item.code,
    categoria: item.categoria,
    nome: item.nome,
    titoloBase: item.titoloBase,
    variante: item.variante,
    descrizione: item.descrizione,
    fase_evento: item.fase_evento || "generale",
    unita_misura: item.unita_misura,
    unitaLabel: item.unitaLabel,
    immagine: item.immagine,
    galleria: item.galleria,
  }));
}

/**
 * Interfaccia per il Calendario della Segreteria (Vincolo R2):
 * Solo disponibilità di data e tipo evento, zero cifre o importi caparra
 */
export interface SegreteriaCalendarEvent {
  id: string;
  data_evento: string;
  tipo_evento: string;
  status: string;
  disponibilita: "occupato" | "opzionato" | "libero";
  titolo: string;
}

/**
 * Recupera il calendario per la vista tablet Segreteria senza totali economici o margini
 */
export async function getCalendarForSegreteria(): Promise<SegreteriaCalendarEvent[]> {
  const quotes = await getQuotesFast();
  return quotes.map((q) => ({
    id: q.id,
    data_evento: q.data_evento,
    tipo_evento: q.tipo_evento,
    status: q.status,
    disponibilita: q.status === "firmato" ? "occupato" : "opzionato",
    titolo: `${q.tipo_evento === "wedding" ? "Matrimonio" : "Evento Privato"} (${
      q.status === "firmato" ? "Confermato" : "Opzione"
    })`,
  }));
}


