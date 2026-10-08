/**
 * contractVault.ts — Blindatura multi-posizione dei contratti (Contract Vault).
 *
 * Ogni contratto generato o firmato viene salvato, oltre che nel `data_store.json`,
 * in una posizione fisica dedicata e indipendente:
 *
 *   data_backups/contracts/contract_{quoteId}.json   (snapshot atomico del contratto)
 *   data_backups/contracts/contracts_audit.jsonl     (registro audit append-only)
 *
 * Regole non negoziabili (stesse della Scatola Nera):
 *  1. La scrittura del vault non deve MAI bloccare né far fallire il flusso di
 *     dominio: ogni errore viene loggato e inghiottito.
 *  2. Scrittura atomica: file temporaneo nella stessa cartella + rename.
 *  3. Il registro audit è append-only in formato JSONL.
 *
 * Il modulo usa `fs`: va importato SOLO lato server (Server Actions / Server
 * Components / route handler).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const VAULT_DIRNAME = 'data_backups';
const CONTRACTS_DIRNAME = 'contracts';
const AUDIT_FILE = 'contracts_audit.jsonl';

export interface ContractVaultResult {
  success: boolean;
  filePath?: string;
  savedAt?: string;
}

/** Cartella fisica del vault contratti: `<cwd>/data_backups/contracts`. */
export function getContractsVaultDir(): string {
  return path.join(process.cwd(), VAULT_DIRNAME, CONTRACTS_DIRNAME);
}

/** Crea la cartella del vault se non esiste. Non lancia mai. */
function ensureVaultDir(): string {
  const dir = getContractsVaultDir();
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // Filesystem read-only: degradiamo senza mai rompere l'operazione di dominio.
  }
  return dir;
}

/** Rende sicuro un id per l'uso come nome file (UUID, prefissi, ecc.). */
function sanitizeQuoteId(quoteId: string): string {
  const clean = String(quoteId || '').trim().replace(/[^a-zA-Z0-9._-]/g, '_');
  return clean || `unknown-${Date.now()}`;
}

/** Scrittura atomica: file temporaneo + rename, con fallback a scrittura diretta. */
function writeAtomic(filePath: string, content: string): void {
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tmp, content, 'utf8');
    fs.renameSync(tmp, filePath);
  } catch {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {
      // ignore
    }
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

/** Accoda un record al registro audit JSONL. Non lancia mai. */
function appendAudit(entry: Record<string, any>): void {
  try {
    const dir = ensureVaultDir();
    fs.appendFileSync(path.join(dir, AUDIT_FILE), `${JSON.stringify(entry)}\n`, 'utf8');
  } catch {
    // L'audit non deve mai bloccare il flusso chiamante.
  }
}

/** true se il vault non contiene ancora nessuno snapshot di contratto. */
export function isContractVaultEmpty(): boolean {
  try {
    const dir = getContractsVaultDir();
    if (!fs.existsSync(dir)) return true;
    return (
      fs
        .readdirSync(dir)
        .filter((f) => f.startsWith('contract_') && f.endsWith('.json') && f !== 'contracts_audit.jsonl')
        .length === 0
    );
  } catch {
    return true;
  }
}

/**
 * Salva uno snapshot atomico del contratto in `data_backups/contracts/contract_{quoteId}.json`
 * e registra l'operazione nel registro audit JSONL.
 */
export function saveContractToVault(
  quoteId: string,
  contractData: any,
  source = 'unknown'
): ContractVaultResult {
  const savedAt = new Date().toISOString();
  try {
    const dir = ensureVaultDir();
    const id = sanitizeQuoteId(quoteId);
    const fileName = `contract_${id}.json`;
    const filePath = path.join(dir, fileName);

    const payload = {
      id: crypto.randomUUID(),
      quoteId: String(quoteId || ''),
      source,
      saved_at: savedAt,
      data: contractData ?? null,
    };

    writeAtomic(filePath, JSON.stringify(payload, null, 2));

    appendAudit({
      id: payload.id,
      timestamp: savedAt,
      action: 'SAVE_CONTRACT',
      source,
      quoteId: String(quoteId || ''),
      file: fileName,
    });

    return { success: true, filePath, savedAt };
  } catch (error: any) {
    console.warn('saveContractToVault fallito:', error?.message || error);
    return { success: false };
  }
}

/** Versione bulk, usata dal sync/init per esportare tutti i contratti firmati. */
export function saveContractsToVault(
  records: Array<{ quoteId: string; data: any; source?: string }>
): number {
  let exported = 0;
  for (const record of records) {
    if (!record || !record.quoteId) continue;
    if (saveContractToVault(record.quoteId, record.data, record.source || 'bulk').success) {
      exported += 1;
    }
  }
  return exported;
}

/**
 * Sync/init: esporta nel vault TUTTI i contratti firmati già presenti in
 * `data_store.json` — sia le `quotes` con status 'firmato' / firma registrata,
 * sia i record di `signed_contracts` / `final_contracts` (anche orfani).
 *
 * È idempotente: sovrascrive gli snapshot esistenti con la versione corrente.
 * L'import di `localDb` è dinamico per evitare una dipendenza circolare statica.
 */
export async function syncSignedContractsToVault(): Promise<{ exported: number }> {
  try {
    const { getStore } = await import('@/lib/localDb');
    const store = getStore();

    const signedRecords = [
      ...(store.signed_contracts || []),
      ...(store.final_contracts || []),
    ];

    const signedKeys = new Set<string>();
    for (const contract of signedRecords) {
      if (!contract) continue;
      for (const value of [contract.quote_id, contract.preventivo, contract.quoteId]) {
        if (!value) continue;
        const key = String(value).trim().toLowerCase();
        if (!key) continue;
        signedKeys.add(key);
        signedKeys.add(key.slice(0, 8));
      }
    }

    const findSignedRecord = (quoteId: string): any => {
      const id = String(quoteId || '').trim().toLowerCase();
      if (!id) return null;
      const exact = signedRecords.find(
        (sc) =>
          sc &&
          String(sc.quote_id || sc.preventivo || sc.quoteId || '')
            .trim()
            .toLowerCase() === id
      );
      if (exact) return exact;
      return (
        signedRecords.find((sc) => {
          if (!sc) return false;
          const key = String(sc.quote_id || sc.preventivo || sc.quoteId || '')
            .trim()
            .toLowerCase();
          if (!key || key.length < 8 || id.length < 8) return false;
          return id.startsWith(key) || key.startsWith(id);
        }) || null
      );
    };

    const records: Array<{ quoteId: string; data: any; source: string }> = [];
    const covered = new Set<string>();

    /**
     * Confronto id firmato tollerante ma senza falsi positivi: match esatto,
     * oppure prefisso bidirezionale solo se entrambe le stringhe hanno almeno
     * 8 caratteri (evita collisioni tra id brevi come 'quote-de…').
     */
    const isSignedByRecord = (quoteId: string): boolean => {
      const id = String(quoteId || '').trim().toLowerCase();
      if (!id) return false;
      if (signedKeys.has(id)) return true;
      return signedRecords.some((sc) => {
        if (!sc) return false;
        const key = String(sc.quote_id || sc.preventivo || sc.quoteId || '')
          .trim()
          .toLowerCase();
        if (!key || key.length < 8 || id.length < 8) return false;
        return id.startsWith(key) || key.startsWith(id);
      });
    };

    for (const q of store.quotes || []) {
      if (!q || !q.id) continue;
      const id = String(q.id).toLowerCase();
      const isSigned =
        q.status === 'firmato' ||
        Boolean(q.data_firma) ||
        Boolean(q.signed_at) ||
        isSignedByRecord(id);
      if (!isSigned) continue;

      const signedRecord = findSignedRecord(id);
      records.push({
        quoteId: String(q.id),
        data: { quote: q, signedRecord },
        source: 'sync_init',
      });
      covered.add(id);
    }

    // Contratti firmati presenti solo in `signed_contracts` (quote non in store).
    for (const sc of signedRecords) {
      if (!sc) continue;
      const key = String(sc.quote_id || sc.preventivo || sc.quoteId || '')
        .trim()
        .toLowerCase();
      if (!key) continue;
      const alreadyCovered = [...covered].some(
        (id) => id === key || (id.length >= 8 && key.length >= 8 && (id.startsWith(key) || key.startsWith(id)))
      );
      if (alreadyCovered) continue;
      records.push({
        quoteId: String(sc.quote_id || sc.preventivo || sc.quoteId),
        data: { signedRecord: sc },
        source: 'sync_init_orphan',
      });
    }

    const exported = saveContractsToVault(records);
    return { exported };
  } catch (error: any) {
    console.warn('syncSignedContractsToVault fallito:', error?.message || error);
    return { exported: 0 };
  }
}
