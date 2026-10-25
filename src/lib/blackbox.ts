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
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { executeR2Command, BUCKET_NAME } from '@/lib/r2';

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

export const RETENTION_DAYS = 30; // Finestra attiva (cruscotto hot)
export const MAX_ARCHIVE_DAYS = 180; // 6 mesi di storico massimo (Warm archive anti-bloat)
const DEFAULT_DAYS = 30;
const DEFAULT_LIMIT = 500;
const MAX_ACTIVE_ENTRIES = 2000;
const MAX_R2_FEED_ENTRIES = 500;
const R2_FEED_KEY = 'blackbox/recent_feed.json';
const DAY_MS = 24 * 60 * 60 * 1000;

const ACTIVE_FILE = 'blackbox_log.json';
const ARCHIVE_PREFIX = 'blackbox_archive_';
const ARCHIVE_REGEX = /^blackbox_archive_\d{4}_\d{2}\.json$/;

let serverlessSeeded = false;

function isServerlessReadOnlyEnv(): boolean {
  const cwd = process.cwd();
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      cwd.startsWith('/var/task')
  );
}

/**
 * Cartella dati dedicata della Scatola Nera.
 * In locale / test usa `<cwd>/data`; su Vercel (`/var/task` read-only) usa
 * `/tmp/tda_blackbox_data` con pre-seed iniziale sicuro.
 */
function getDataDir(): string {
  if (!isServerlessReadOnlyEnv()) {
    return path.join(process.cwd(), 'data');
  }

  const tmpDir = path.join('/tmp', 'tda_blackbox_data');
  if (!serverlessSeeded) {
    serverlessSeeded = true;
    try {
      fs.mkdirSync(tmpDir, { recursive: true });
      const targetActive = path.join(tmpDir, ACTIVE_FILE);
      const bundledActive = path.join(process.cwd(), 'data', ACTIVE_FILE);
      if (!fs.existsSync(targetActive) && fs.existsSync(bundledActive)) {
        fs.copyFileSync(bundledActive, targetActive);
      }
    } catch {
      // ignore: fallback silenzioso se /tmp non necessita di seed
    }
  }
  return tmpDir;
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

/** Accoda un blocco di entry al file d'archivio del mese corrispondente (scartando quelle > 180gg). */
function appendToArchive(entries: BlackboxEntry[]): void {
  if (entries.length === 0) return;
  const dir = ensureDataDir();
  const maxCutoff = Date.now() - MAX_ARCHIVE_DAYS * DAY_MS;

  const validEntries = entries.filter((e) => {
    const ts = Date.parse(String(e?.timestamp || ''));
    return !Number.isFinite(ts) || ts >= maxCutoff;
  });
  if (validEntries.length === 0) return;

  const byFile = new Map<string, BlackboxEntry[]>();
  for (const entry of validEntries) {
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
 * Elimina fisicamente i file d'archivio mensili o le singole righe più vecchie
 * di 180 giorni (6 mesi). Garantisce che lo spazio su disco non cresca all'infinito.
 */
export function purgeExpiredArchives(maxDays = MAX_ARCHIVE_DAYS): number {
  const dir = getDataDir();
  let purgedCount = 0;
  try {
    if (!fs.existsSync(dir)) return 0;
    const files = fs
      .readdirSync(dir)
      .filter((f) => ARCHIVE_REGEX.test(f));
    const cutoff = Date.now() - maxDays * DAY_MS;

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const entries = readEntriesFile(fullPath);
      const valid = entries.filter((e) => {
        const ts = Date.parse(String(e?.timestamp || ''));
        return Number.isFinite(ts) && ts >= cutoff;
      });

      if (valid.length === 0) {
        try {
          fs.unlinkSync(fullPath);
          purgedCount += entries.length;
        } catch {
          // ignore
        }
      } else if (valid.length < entries.length) {
        purgedCount += (entries.length - valid.length);
        writeEntriesFile(fullPath, valid);
      }
    }
  } catch {
    // ignore
  }
  return purgedCount;
}

/**
 * Applica la ritenzione: restituisce solo le entry degli ultimi 30 giorni
 * (con tetto massimo anti-bloat di MAX_ACTIVE_ENTRIES = 2000 nel file attivo),
 * sposta le entry scadute o eccedenti negli archivi mensili e auto-pulisce
 * gli archivi più vecchi di 6 mesi (180 giorni).
 */
function applyRetention(entries: BlackboxEntry[]): BlackboxEntry[] {
  const cutoff = Date.now() - RETENTION_DAYS * DAY_MS;
  const retained: BlackboxEntry[] = [];
  const toArchive: BlackboxEntry[] = [];

  for (const entry of entries) {
    const ts = Date.parse(String(entry?.timestamp || ''));
    if (Number.isFinite(ts) && ts < cutoff) toArchive.push(entry);
    else retained.push(entry);
  }

  if (retained.length > MAX_ACTIVE_ENTRIES) {
    retained.sort(
      (a, b) => (Date.parse(a.timestamp) || 0) - (Date.parse(b.timestamp) || 0)
    );
    const overflowCount = retained.length - MAX_ACTIVE_ENTRIES;
    const overflow = retained.splice(0, overflowCount);
    for (const item of overflow) toArchive.push(item);
  }

  if (toArchive.length > 0) appendToArchive(toArchive);

  // Esegue l'auto-pulizia dei record > 180 giorni
  purgeExpiredArchives();

  return retained;
}

/** Tutte le entry presenti negli archivi mensili entro il limite massimo di 6 mesi (180gg). */
function readArchiveEntries(): BlackboxEntry[] {
  const dir = getDataDir();
  const maxCutoff = Date.now() - MAX_ARCHIVE_DAYS * DAY_MS;
  try {
    if (!fs.existsSync(dir)) return [];
    const files = fs
      .readdirSync(dir)
      .filter((f) => ARCHIVE_REGEX.test(f))
      .sort();
    const all: BlackboxEntry[] = [];
    for (const file of files) {
      for (const entry of readEntriesFile(path.join(dir, file))) {
        const ts = Date.parse(String(entry?.timestamp || ''));
        if (!Number.isFinite(ts) || ts >= maxCutoff) {
          all.push(entry);
        }
      }
    }
    return all;
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Mirroring Supabase (fire-and-forget con auto-pulizia a 180 giorni)  */
/* ------------------------------------------------------------------ */

let lastSupabasePurgeTimestamp = 0;
const PURGE_SUPABASE_INTERVAL_MS = 24 * 60 * 60 * 1000; // una volta ogni 24 ore

/**
 * Elimina le entry di telemetria più vecchie di 180 giorni (6 mesi) da Supabase,
 * proteggendo la quota di storage del database PostgreSQL.
 */
export async function purgeExpiredSupabaseLogs(maxDays = MAX_ARCHIVE_DAYS): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return false;

    const { getServiceSupabase } = await import('@/lib/supabase');
    const supabase = getServiceSupabase();
    const cutoffIso = new Date(Date.now() - maxDays * DAY_MS).toISOString();

    const { error } = await supabase
      .from('blackbox_logs')
      .delete()
      .lt('timestamp', cutoffIso);

    return !error;
  } catch {
    return false;
  }
}

/** Invia la entry a Supabase senza mai bloccare né propagare errori ed esegue auto-purge ogni 24h. */
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
      .then(() => {
        // Auto-purge rolling su Supabase ogni 24h per record > 180 giorni
        const now = Date.now();
        if (now - lastSupabasePurgeTimestamp > PURGE_SUPABASE_INTERVAL_MS) {
          lastSupabasePurgeTimestamp = now;
          void purgeExpiredSupabaseLogs();
        }
      })
      .catch(() => {});
  } catch {
    // ignore: il mirroring è puramente opportunistico
  }
}

/* ------------------------------------------------------------------ */
/* Rolling Ring-Buffer su Cloudflare R2 (Zero Object Bloat)            */
/* ------------------------------------------------------------------ */

let pendingR2Entries: BlackboxEntry[] = [];
let r2FlushInFlight = false;
let r2FeedCache: { entries: BlackboxEntry[]; timestamp: number } | null = null;

async function readR2FeedRaw(): Promise<BlackboxEntry[]> {
  try {
    const response = await executeR2Command<any>(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: R2_FEED_KEY,
      })
    );
    const bodyStr = await response?.Body?.transformToString?.();
    if (!bodyStr) return [];
    const parsed = JSON.parse(bodyStr);
    return Array.isArray(parsed) ? (parsed as BlackboxEntry[]) : [];
  } catch (err: any) {
    if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
      return [];
    }
    return [];
  }
}

async function flushR2FeedQueue(): Promise<void> {
  if (r2FlushInFlight || pendingR2Entries.length === 0) return;
  r2FlushInFlight = true;

  try {
    while (pendingR2Entries.length > 0) {
      const batch = pendingR2Entries.splice(0, pendingR2Entries.length);
      const existing = await readR2FeedRaw();
      const cutoff = Date.now() - RETENTION_DAYS * DAY_MS;

      const byId = new Map<string, BlackboxEntry>();
      for (const item of existing) {
        if (item?.id) byId.set(item.id, item);
      }
      for (const item of batch) {
        if (item?.id) byId.set(item.id, item);
      }

      const merged = Array.from(byId.values())
        .filter((e) => {
          const ts = Date.parse(String(e?.timestamp || ''));
          return !Number.isFinite(ts) || ts >= cutoff;
        })
        .sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0))
        .slice(0, MAX_R2_FEED_ENTRIES);

      await executeR2Command(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: R2_FEED_KEY,
          Body: JSON.stringify(merged),
          ContentType: 'application/json',
        })
      );

      r2FeedCache = { entries: merged, timestamp: Date.now() };
    }
  } catch {
    // ignore: R2 offline o errore transitorio non deve mai impattare il chiamante
  } finally {
    r2FlushInFlight = false;
  }
}

/**
 * Sincronizza la entry nel ring-buffer cloud R2 (`blackbox/recent_feed.json`,
 * max 500 eventi, rotazione 30gg) senza creare infiniti file singoli su R2.
 */
function mirrorToR2(entry: BlackboxEntry): void {
  try {
    pendingR2Entries.push(entry);
    void flushR2FeedQueue();
  } catch {
    // ignore
  }
}

async function readR2FeedSafe(timeoutMs = 1500): Promise<BlackboxEntry[]> {
  if (r2FeedCache && Date.now() - r2FeedCache.timestamp < 3000) {
    return r2FeedCache.entries;
  }

  try {
    const timeoutPromise = new Promise<BlackboxEntry[]>((resolve) => {
      setTimeout(() => resolve(r2FeedCache ? r2FeedCache.entries : []), timeoutMs);
    });
    const fetched = await Promise.race([readR2FeedRaw(), timeoutPromise]);
    if (fetched.length > 0 || !r2FeedCache) {
      r2FeedCache = { entries: fetched, timestamp: Date.now() };
    }
    return fetched;
  } catch {
    return r2FeedCache ? r2FeedCache.entries : [];
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
  mirrorToR2(full);
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

function filterAndSortEntries(
  entries: BlackboxEntry[],
  filters?: BlackboxFilters
): BlackboxEntry[] {
  const days =
    Number.isFinite(filters?.days) && (filters?.days as number) > 0
      ? (filters?.days as number)
      : DEFAULT_DAYS;
  const limit =
    Number.isFinite(filters?.limit) && (filters?.limit as number) > 0
      ? (filters?.limit as number)
      : DEFAULT_LIMIT;

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

function computeStatsFromEntries(entries: BlackboxEntry[]): BlackboxStats {
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

function mergeUniqueEntries(
  primary: BlackboxEntry[],
  secondary: BlackboxEntry[]
): BlackboxEntry[] {
  const byId = new Map<string, BlackboxEntry>();
  for (const entry of secondary) {
    if (entry?.id) byId.set(entry.id, entry);
  }
  for (const entry of primary) {
    if (entry?.id) byId.set(entry.id, entry);
  }
  return Array.from(byId.values());
}

/**
 * Legge le entry della Scatola Nera applicando filtri e ordinamento
 * decrescente (più recenti per prime).
 */
export function getBlackboxEntries(filters?: BlackboxFilters): BlackboxEntry[] {
  const days =
    Number.isFinite(filters?.days) && (filters?.days as number) > 0
      ? (filters?.days as number)
      : DEFAULT_DAYS;

  let entries = readEntriesFile(activeFilePath());
  // Per orizzonti superiori alla ritenzione attiva includiamo anche l'archivio.
  if (days > RETENTION_DAYS) entries = entries.concat(readArchiveEntries());

  return filterAndSortEntries(entries, filters);
}

/** Statistiche sintetiche per il cruscotto: ultime 24 ore + ultima attività. */
export function getBlackboxStats(): BlackboxStats {
  const entries = readEntriesFile(activeFilePath());
  return computeStatsFromEntries(entries);
}

/**
 * Versione unificata Cloud + Locale per il Server Component `/admin/scatola-nera`:
 * fonde il file locale con il ring-buffer R2 (`blackbox/recent_feed.json`),
 * garantendo visibilità cross-istanza su Vercel senza mai appesantire il DB.
 */
export async function getBlackboxEntriesUnified(
  filters?: BlackboxFilters
): Promise<BlackboxEntry[]> {
  const days =
    Number.isFinite(filters?.days) && (filters?.days as number) > 0
      ? (filters?.days as number)
      : DEFAULT_DAYS;

  let localEntries = readEntriesFile(activeFilePath());
  if (days > RETENTION_DAYS) localEntries = localEntries.concat(readArchiveEntries());

  const cloudEntries = await readR2FeedSafe();
  const merged = mergeUniqueEntries(localEntries, cloudEntries);
  return filterAndSortEntries(merged, filters);
}

/** Statistiche 24h unificate Cloud + Locale per il cruscotto `/admin/scatola-nera`. */
export async function getBlackboxStatsUnified(): Promise<BlackboxStats> {
  const localEntries = readEntriesFile(activeFilePath());
  const cloudEntries = await readR2FeedSafe();
  const merged = mergeUniqueEntries(localEntries, cloudEntries);
  return computeStatsFromEntries(merged);
}
