/**
 * notificationDispatcher.ts — Dispatch delle notifiche direzionali de La Terra degli Aranci.
 *
 * Canale primario: WhatsApp Cloud API ufficiale di Meta (Graph API v19.0).
 * Canale secondario/opzionale: webhook n8n (automazioni esterne).
 * Fallback: modalità simulata con append su `data_backups/notifications.log`,
 *            così nessuna notifica va MAI persa (dev o token Meta non ancora attivo).
 *
 * Variabili d'ambiente:
 *  - META_WHATSAPP_TOKEN    Bearer token di Meta Cloud API
 *  - META_PHONE_NUMBER_ID   ID del numero di telefono su Meta Business
 *  - META_RECIPIENT_PHONE   Numero WhatsApp destinatario (Roberto / Direzione, es. '3933...')
 *  - N8N_WEBHOOK_URL        (Opzionale) webhook n8n per dispatch flessibile
 *  - APP_URL / NEXT_PUBLIC_APP_URL   Base URL per il link alla Scheda Regia
 *
 * Il modulo usa `fs`: va importato SOLO lato server (Server Actions / route handler).
 * Regola non negoziabile: il dispatch non deve MAI far fallire il flusso di dominio
 * che lo invoca — ogni errore di rete/IO viene catturato e tracciato nell'audit log.
 */

import fs from 'fs';
import path from 'path';
import type { ServiceTicket, ServiceTicketItem } from '@/lib/localDb';

/* ------------------------------------------------------------------ */
/* Tipi pubblici                                                       */
/* ------------------------------------------------------------------ */

export type DispatchChannel = 'meta_api' | 'n8n' | 'simulated';

export interface DispatchResult {
  success: boolean;
  channel: DispatchChannel;
  error?: string;
  details?: {
    appUrl?: string;
    link?: string;
    recipient?: string;
    configured?: { meta: boolean; n8n: boolean };
    attempts?: Record<string, { ok: boolean; data?: any; error?: string }>;
    [key: string]: any;
  };
}

/* ------------------------------------------------------------------ */
/* Configurazione & helper di formato                                  */
/* ------------------------------------------------------------------ */

const META_GRAPH_VERSION = 'v19.0';
const AUDIT_DIRNAME = 'data_backups';
const AUDIT_FILENAME = 'notifications.log';

/** Base URL dell'app, con fallback coerente tra sviluppo e produzione. */
function getAppUrl(): string {
  const explicit = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  const fallback =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://laterradegliaranci.it';
  return String(explicit || fallback).trim().replace(/\/+$/, '');
}

/**
 * Normalizza il destinatario WhatsApp nel formato atteso dalla Cloud API:
 * solo cifre, senza prefisso internazionale '00' né simbolo '+'.
 */
function normalizeWhatsAppRecipient(value?: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  let digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  return digits;
}

/** Formatta un importo in euro (it-IT) o stringa vuota se non valido. */
function formatCurrency(value?: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  try {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  } catch {
    return `€ ${value.toFixed(2)}`;
  }
}

/** Formatta la data evento: ISO 'YYYY-MM-DD' -> 'DD/MM/YYYY', altrimenti testo libero. */
function formatEventDate(value?: string): string {
  const raw = String(value || '').trim();
  if (!raw) return 'Da definire';
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return raw;
}

/** Etichetta leggibile del tipo evento. */
function formatEventType(value?: string): string {
  const raw = String(value || '').trim();
  if (!raw) return 'Evento';
  const normalized = raw.toLowerCase();
  if (normalized === 'wedding') return 'Matrimonio';
  if (normalized === 'eventi' || normalized === 'evento') return 'Evento privato';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Descrizione testuale di un errore `unknown`. */
function describeError(error: unknown): string {
  if (error instanceof Error) return error.message || error.name || 'Errore';
  return String(error ?? 'Errore sconosciuto');
}

/** Riga di elenco puntato per un singolo servizio richiesto. */
function formatServiceItem(item: ServiceTicketItem, index: number): string {
  const name = String(item?.nome || '').trim() || `Servizio ${index + 1}`;
  const qty = typeof item?.quantita === 'number' && item.quantita > 1 ? item.quantita : undefined;
  const unit = formatCurrency(item?.prezzo_unitario);

  let line = `• ${name}`;
  if (item?.azione === 'rimozione') line += ' _(rimozione)_';
  else if (item?.azione === 'variazione') line += ' _(variazione)_';

  if (qty) line += ` ×${qty}`;

  if (unit) {
    line += ` — ${unit}`;
    if (qty) {
      const total = formatCurrency((item.prezzo_unitario as number) * qty);
      if (total) line += ` cad. (${total})`;
    }
  }

  const note = String(item?.note || '').trim();
  if (note) line += ` — ${note}`;

  return line;
}

/**
 * Costruisce il testo WhatsApp formattato per la notifica di un Ticket
 * Richiesta Servizi, con il link diretto alla Scheda Regia di Roberto.
 */
export function formatServiceTicketMessage(ticket: ServiceTicket, appUrl: string = getAppUrl()): string {
  const clientName = String(ticket?.client_name || '').trim() || 'Sposi';
  const link = `${appUrl}/admin/eventi/${ticket?.quote_id || ''}?tab=ticket`;

  const servizi = Array.isArray(ticket?.servizi) ? ticket.servizi : [];
  const serviziBlock =
    servizi.length > 0
      ? servizi.map((item, index) => formatServiceItem(item, index)).join('\n')
      : '• Nessun servizio specificato';

  const lines: string[] = [
    '🔔 *NUOVA RICHIESTA SERVIZI — LA TERRA DEGLI ARANCI*',
    '',
    `👰 *Sposi:* ${clientName}`,
    `📅 *Data evento:* ${formatEventDate(ticket?.event_date)}`,
    `🎉 *Tipo evento:* ${formatEventType(ticket?.tipo_evento)}`,
    '',
    '🛠 *Servizi richiesti:*',
    serviziBlock,
  ];

  const noteSposi = String(ticket?.note_sposi || '').trim();
  if (noteSposi) {
    lines.push('', '📝 *Note degli sposi:*', noteSposi);
  }

  lines.push('', '🔗 *Scheda Regia:*', link);

  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/* Audit log (fallback persistente)                                    */
/* ------------------------------------------------------------------ */

/**
 * Accoda una riga JSONL su `data_backups/notifications.log`. Non lancia mai:
 * se il filesystem non è scrivibile degrada con un warning su console.
 */
function appendAuditLog(entry: Record<string, any>): string | null {
  try {
    const dir = path.join(process.cwd(), AUDIT_DIRNAME);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, AUDIT_FILENAME);
    fs.appendFileSync(file, `${JSON.stringify(entry)}\n`, 'utf8');
    return file;
  } catch (error) {
    console.warn('[notificationDispatcher] Impossibile scrivere l\'audit log:', describeError(error));
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* HTTP helper                                                         */
/* ------------------------------------------------------------------ */

/**
 * Esegue una POST JSON. Restituisce il body decodificato. In caso di risposta
 * non-2xx lancia un errore arricchito con status e body per la diagnostica.
 */
async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<{ status: number; data: any }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err: any = new Error(`HTTP ${res.status} ${res.statusText}`.trim());
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return { status: res.status, data };
}

/** Estrae un messaggio diagnostico da un errore di `postJson`. */
function errorFromAttempt(error: any): string {
  if (error && typeof error === 'object' && 'status' in error) {
    const body = typeof error.body === 'string' ? error.body : JSON.stringify(error.body);
    return `HTTP ${error.status}: ${body}`;
  }
  return describeError(error);
}

/* ------------------------------------------------------------------ */
/* API principale                                                      */
/* ------------------------------------------------------------------ */

/**
 * Dispatcha la notifica di un nuovo Ticket Richiesta Servizi alla Direzione.
 *
 * Ordine di invio:
 *  1. Meta WhatsApp Cloud API (se `META_WHATSAPP_TOKEN` + `META_PHONE_NUMBER_ID`
 *     + `META_RECIPIENT_PHONE` sono configurati).
 *  2. Webhook n8n (se `N8N_WEBHOOK_URL` è configurato).
 *  3. Fallback simulato: log su console + append su `data_backups/notifications.log`.
 *
 * L'audit log viene SEMPRE scritto (anche in caso di invio riuscito), così esiste
 * una traccia storica completa di ogni notifica.
 */
export async function dispatchServiceTicketNotification(
  ticket: ServiceTicket
): Promise<DispatchResult> {
  const appUrl = getAppUrl();
  const messageText = formatServiceTicketMessage(ticket, appUrl);
  const link = `${appUrl}/admin/eventi/${ticket?.quote_id || ''}?tab=ticket`;

  const metaToken = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  const recipient = normalizeWhatsAppRecipient(process.env.META_RECIPIENT_PHONE);
  const n8nUrl = process.env.N8N_WEBHOOK_URL;

  const metaConfigured = Boolean(metaToken && phoneNumberId && recipient);
  const n8nConfigured = Boolean(n8nUrl);

  const attempts: Record<string, { ok: boolean; data?: any; error?: string }> = {};

  // 1) Canale nativo ufficiale: WhatsApp Cloud API (Meta Graph API).
  if (metaConfigured) {
    try {
      const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;
      const { data } = await postJson(
        url,
        {
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'text',
          text: { preview_url: true, body: messageText },
        },
        { Authorization: `Bearer ${metaToken}` }
      );
      attempts.meta = { ok: true, data };
    } catch (error) {
      attempts.meta = { ok: false, error: errorFromAttempt(error) };
    }
  }

  // 2) Canale opzionale: webhook n8n (payload completo ticket + messaggio).
  if (n8nConfigured) {
    try {
      const { data } = await postJson(n8nUrl as string, {
        event: 'service_ticket.created',
        channel: 'n8n',
        timestamp: new Date().toISOString(),
        appUrl,
        link,
        recipient,
        message: messageText,
        ticket,
      });
      attempts.n8n = { ok: true, data };
    } catch (error) {
      attempts.n8n = { ok: false, error: errorFromAttempt(error) };
    }
  }

  const metaOk = attempts.meta?.ok === true;
  const n8nOk = attempts.n8n?.ok === true;
  const anyConfigured = metaConfigured || n8nConfigured;

  let channel: DispatchChannel;
  let success: boolean;
  let error: string | undefined;

  if (metaOk) {
    channel = 'meta_api';
    success = true;
  } else if (n8nOk) {
    channel = 'n8n';
    success = true;
  } else if (!anyConfigured) {
    // Modalità simulata prevista: nessuna credenziale ancora configurata.
    channel = 'simulated';
    success = true;
  } else {
    // Almeno un canale configurato ma tutti i tentativi sono falliti.
    channel = 'simulated';
    success = false;
    error = Object.entries(attempts)
      .filter(([, a]) => !a.ok)
      .map(([name, a]) => `${name}: ${a.error}`)
      .join(' | ') || 'Dispatch fallito';
  }

  const details: DispatchResult['details'] = {
    appUrl,
    link,
    recipient: recipient || undefined,
    configured: { meta: metaConfigured, n8n: n8nConfigured },
    attempts,
  };

  if (channel === 'simulated') {
    console.log(
      `[notificationDispatcher] Notifica in modalità simulata per ticket ${ticket?.id || 'n/d'} (quote ${ticket?.quote_id || 'n/d'}).\n${messageText}`
    );
  }

  // Audit append-only: nessuna notifica va mai persa.
  const auditFile = appendAuditLog({
    timestamp: new Date().toISOString(),
    ticket_id: ticket?.id || null,
    quote_id: ticket?.quote_id || null,
    client_name: ticket?.client_name || null,
    channel,
    success,
    error: error || null,
    delivered: channel !== 'simulated' && success,
    message: messageText,
    ticket,
    details,
  });

  if (auditFile) details.audit_file = auditFile;

  return { success, channel, error, details };
}
