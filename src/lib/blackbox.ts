/**
 * blackbox.ts — Scatola Nera (Audit & Error Ledger) de La Terra degli Aranci.
 *
 * Registro append-only di attività ed errori, pensato per NON appesantire mai
 * `data_store.json`: i log vivono in un file dedicato `data/blackbox_log.json`.
 *
 * Regole non negoziabili:
 *  1. File dedicato `data/blackbox_log.json` (la cartella `data` viene creata).
 *  2. Ritenzione attiva di 30 giorni: gli eventi più vecchi vengono spostati
 *     in `data/blackbox_archive_YYYY_MM.json` (nessun dato perso a vita).
 *  3. Scrittura atomica sincrona (file temporaneo + rename).
 *  4. Mirroring Supabase asincrono "fire-and-forget": un eventuale offline di
 *     rete non blocca MAI il server.
 *
 * Il modulo usa `fs`: va importato SOLO lato server (Server Actions / Server
 * Components). I componenti client importano esclusivamente i tipi.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/* ------------------------------------------------------------------ */
/* Tipi pubblici                                                       */
/* ------------------------------------------------------------------ */

export type BlackboxLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export type BlackboxCategory =
  | 'CONTRATTI'
  | 'CASSA'
  | 'LEAD_VISITA'
  | 'EVENTI'
  | 'CLIENTI'
  | 'DIARIO'
  | 'PDF'
  | 'SISTEMA';

export interface BlackboxEntry {
  id: string; // uuid
  timestamp: string; // ISO
  level: BlackboxLevel;
  category: BlackboxCategory;
  actor: string; // es. "Direzione Roberto", "Tablet Segreteria", "Cliente Sposi", "Sistema"
  action: string; // es. "CONTRATTO_CREATO", "INCASSO_REGISTRATO", "OPZIONE_REVOCATA"
  message: string; // descrizione leggibile
  metadata?: Record<string, any>;
  errorDetails?: {
    name?: string;
    message: string;
    stack?: string;
  };
}

export interface BlackboxStats {
  totalLast24h: number;
  errorsLast24h: number;
  warningsLast24h: number;
  lastActivity?: BlackboxEntry;
}

export interface BlackboxLogInput {
  level?: BlackboxLevel;
  category: BlackboxCategory;
  actor: string;
  action: string;
  message: string;
  metadata?: Record<string, any>;
  errorDetails?: { name?: string; message: string; stack?: string };
}

export interface BlackboxFilters {
  category?: string;
  level?: string;
  days?: number; // default: 30 giorni
  limit?: number; // default: 500
  search?: string;
}

/* ------------------------------------------------------------------ */
/* Costanti e percorsi                                                 */
/* ------------------------------------------------------------------ */

const RETENTION_DAYS = 30;
const DEFAULT_DAYS = 30;
const DEFAULT_LIMIT = 500;
const DAY_MS = 24 * 60 * 60 * 1000;

const ACTIVE_FILE = 'blackbox_log.json';
const ARCHIVE_PREFIX = 'blackbox_archive_';
const ARCHIVE_REGEX = /^blackbox_archive_\d{4}_\d{2}\.json$/;

/** Cartella dati dedicata della Scatola Nera. */
function getDataDir(): string {
  return path.join(process.cwd(), 'data');
}

function activeFilePath(): string {
  return path.join(getDataDir(), ACTIVE_FILE);
}

function ensureDataDir(): string {
  const dir = getDataDir();
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // Se la cartella non è creabile (es. filesystem read-only) degradiamo
    // senza mai lanciare: il log non deve mai rompere l'operazione di dominio.
  }
  return dir;
}

/* ------------------------------------------------------------------ */
/* I/O sicuro                                                          */
/* ------------------------------------------------------------------ */

/** Legge un file JSON che contiene un array di entry, con fallback a []. */
function readEntriesFile(filePath: string): BlackboxEntry[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BlackboxEntry[]) : [];
  } catch {
    return [];
  }
}

/** Scrittura atomica sincrona: file temporaneo nella stessa dir + rename. */
function writeEntriesFile(filePath: string, entries: BlackboxEntry[]): void {
  ensureDataDir();
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(entries, null, 2), 'utf8');
    fs.renameSync(tmp, filePath);
  } catch {
    // Pulizia best-effort del temporaneo e fallback a scrittura diretta.
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {
      // ignore
    }
    try {
      fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf8');
    } catch {
      // ignore: il log non deve mai bloccare il flusso chiamante
    }
  }
}

/* ------------------------------------------------------------------ */
/* Ritenzione temporale (30 giorni) + archivio mensile                 */
/* ------------------------------------------------------------------ */

function archiveFileNameFor(timestamp: string): string {
  // 'YYYY-MM-...' → 'blackbox_archive_YYYY_MM.json'
  const month = /^(\d{4})-(\d{2})/.exec(timestamp);
  const suffix = month ? `${month[1]}_${month[2]}` : 'unknown';
  return `${ARCHIVE_PREFIX}${suffix}.json`;
}

/** Accoda un blocco di entry al file d'archivio del mese corrispondente. */
function appendToArchive(entries: BlackboxEntry[]): void {
  if (entries.length === 0) return;
  const dir = ensureDataDir();

  const byFile = new Map<string, BlackboxEntry[]>();
  for (const entry of entries) {
    const file = archiveFileNameFor(String(entry.timestamp || ''));
    const bucket = byFile.get(file);
    if (bucket) bucket.push(entry);
    else byFile.set(file, [entry]);
  }

  for (const [file, bucket] of byFile) {
    const fullPath = path.join(dir, file);
    const existing = readEntriesFile(fullPath);
    writeEntriesFile(fullPath, existing.concat(bucket));
  }
}

/**
 * Applica la ritenzione: restituisce solo le entry degli ultimi 30 giorni e
 * sposta le più vecchie nei file d'archivio mensili.
 */
function applyRetention(entries: BlackboxEntry[]): BlackboxEntry[] {
  const cutoff = Date.now() - RETENTION_DAYS * DAY_MS;
  const retained: BlackboxEntry[] = [];
  const expired: BlackboxEntry[] = [];

  for (const entry of entries) {
    const ts = Date.parse(String(entry?.timestamp || ''));
    if (Number.isFinite(ts) && ts < cutoff) expired.push(entry);
    else retained.push(entry);
  }

  if (expired.length > 0) appendToArchive(expired);
  return retained;
}

/** Tutte le entry presenti negli archivi mensili (per filtri > 30 giorni). */
function readArchiveEntries(): BlackboxEntry[] {
  const dir = getDataDir();
  try {
    if (!fs.existsSync(dir)) return [];
    const files = fs
      .readdirSync(dir)
      .filter((f) => ARCHIVE_REGEX.test(f))
      .sort();
    const all: BlackboxEntry[] = [];
    for (const file of files) {
      for (const entry of readEntriesFile(path.join(dir, file))) all.push(entry);
    }
    return all;
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Mirroring Supabase (fire-and-forget)                                */
/* ------------------------------------------------------------------ */

/** Invia la entry a Supabase senza mai bloccare né propagare errori. */
function mirrorToSupabase(entry: BlackboxEntry): void {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return;

    void import('@/lib/supabase')
      .then(({ getServiceSupabase }) => {
        const supabase = getServiceSupabase();
        return supabase.from('blackbox_logs').insert({
          id: entry.id,
          timestamp: entry.timestamp,
          level: entry.level,
          category: entry.category,
          actor: entry.actor,
          action: entry.action,
          message: entry.message,
          metadata: entry.metadata ?? null,
          error_details: entry.errorDetails ?? null,
        });
      })
      .then(() => {})
      .catch(() => {});
  } catch {
    // ignore: il mirroring è puramente opportunistico
  }
}

/* ------------------------------------------------------------------ */
/* API core                                                            */
/* ------------------------------------------------------------------ */

/**
 * Registra un'attività nella Scatola Nera. Scrittura sincrona e atomica sul
 * file attivo, con ritenzione a 30 giorni e mirroring Supabase asincrono.
 */
export function logActivity(entry: BlackboxLogInput): BlackboxEntry {
  const now = new Date().toISOString();
  const full: BlackboxEntry = {
    id: crypto.randomUUID(),
    timestamp: now,
    level: entry.level ?? 'INFO',
    category: entry.category,
    actor: entry.actor,
    action: entry.action,
    message: entry.message,
    metadata: entry.metadata,
    errorDetails: entry.errorDetails,
  };

  try {
    ensureDataDir();
    const current = readEntriesFile(activeFilePath());
    current.push(full);
    const retained = applyRetention(current);
    writeEntriesFile(activeFilePath(), retained);
  } catch {
    // Non deve mai propagare: il logging non può rompere il dominio.
  }

  mirrorToSupabase(full);
  return full;
}

/** Normalizza un errore `unknown` nei dettagli strutturati della entry. */
function normalizeErrorDetails(error: unknown): {
  name?: string;
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message || 'Errore senza messaggio',
      stack: error.stack,
    };
  }
  const message = String(error ?? '');
  return { name: 'UnknownError', message: message || 'Errore inatteso' };
}

/**
 * Registra un errore (livello ERROR) con dettagli strutturati. Il mirroring
 * Supabase resta asincrono e non blocca il chiamante.
 */
export function logError(
  category: BlackboxCategory,
  actor: string,
  action: string,
  error: unknown,
  metadata?: Record<string, any>
): BlackboxEntry {
  const details = normalizeErrorDetails(error);
  return logActivity({
    level: 'ERROR',
    category,
    actor,
    action,
    message: details.message,
    metadata,
    errorDetails: details,
  });
}

/** Testo ricercabile di una entry (attore, azione, messaggio, categoria, metadata). */
function searchableText(entry: BlackboxEntry): string {
  let meta = '';
  try {
    meta = entry.metadata ? JSON.stringify(entry.metadata) : '';
  } catch {
    meta = '';
  }
  return `${entry.actor} ${entry.action} ${entry.message} ${entry.category} ${meta}`.toLowerCase();
}

/**
 * Legge le entry della Scatola Nera applicando filtri e ordinamento
 * decrescente (più recenti per prime).
 */
export function getBlackboxEntries(filters?: BlackboxFilters): BlackboxEntry[] {
  const days = Number.isFinite(filters?.days) && (filters?.days as number) > 0
    ? (filters?.days as number)
    : DEFAULT_DAYS;
  const limit = Number.isFinite(filters?.limit) && (filters?.limit as number) > 0
    ? (filters?.limit as number)
    : DEFAULT_LIMIT;

  let entries = readEntriesFile(activeFilePath());
  // Per orizzonti superiori alla ritenzione attiva includiamo anche l'archivio.
  if (days > RETENTION_DAYS) entries = entries.concat(readArchiveEntries());

  const cutoff = Date.now() - days * DAY_MS;
  const category = String(filters?.category || '').trim().toUpperCase();
  const level = String(filters?.level || '').trim().toUpperCase();
  const search = String(filters?.search || '').trim().toLowerCase();

  const filtered = entries.filter((entry) => {
    if (!entry || !entry.timestamp) return false;

    const ts = Date.parse(entry.timestamp);
    if (Number.isFinite(ts) && ts < cutoff) return false;

    if (category && String(entry.category).toUpperCase() !== category) return false;
    if (level && String(entry.level).toUpperCase() !== level) return false;
    if (search && !searchableText(entry).includes(search)) return false;

    return true;
  });

  filtered.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  return filtered.slice(0, limit);
}

/** Statistiche sintetiche per il cruscotto: ultime 24 ore + ultima attività. */
export function getBlackboxStats(): BlackboxStats {
  const entries = readEntriesFile(activeFilePath());
  const cutoff = Date.now() - DAY_MS;

  let totalLast24h = 0;
  let errorsLast24h = 0;
  let warningsLast24h = 0;
  let lastActivity: BlackboxEntry | undefined;

  for (const entry of entries) {
    if (!entry || !entry.timestamp) continue;
    const ts = Date.parse(entry.timestamp);
    if (!Number.isFinite(ts)) continue;

    if (ts >= cutoff) {
      totalLast24h += 1;
      const level = String(entry.level).toUpperCase();
      if (level === 'ERROR' || level === 'CRITICAL') errorsLast24h += 1;
      else if (level === 'WARN') warningsLast24h += 1;
    }

    if (!lastActivity || ts > Date.parse(lastActivity.timestamp)) lastActivity = entry;
  }

  return { totalLast24h, errorsLast24h, warningsLast24h, lastActivity };
}
