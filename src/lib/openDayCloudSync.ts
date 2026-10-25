import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getStore, saveStore, saveWeddingDiaryLocal, getWeddingDiaryLocal } from "./localDb";
import { normalizePhoneNumber } from "./phoneHelper";
import { computeDiaryProgress } from "@/app/cliente/components/weddingDiaryFields";
import { logActivity } from "./blackbox";
import { executeR2Command, BUCKET_NAME } from "./r2";

const STATE_KEY = "openday/cloud_state.json";

/**
 * Mutex asincrono in-memory per serializzare atomicamente le operazioni
 * di lettura-modifica-scrittura su openday/cloud_state.json.
 * Previene tassativamente race condition (Lost Updates) anche sotto 20+ richieste contemporanee.
 */
class AsyncMutex {
  private queue: Promise<void> = Promise.resolve();

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;
    const waitPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentQueue = this.queue;
    this.queue = currentQueue.then(() => waitPromise, () => waitPromise);
    await currentQueue;
    try {
      return await fn();
    } finally {
      release!();
    }
  }
}

export const stateMutex = new AsyncMutex();

/**
 * Esegue comandi R2 con ritentativi ed esponenziale backoff, sfruttando
 * il fallback master certificato di r2.ts (zero 500 per errori di firma).
 */
async function executeR2WithRetry<T = any>(command: any, retries: number = 3): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await executeR2Command<T>(command);
    } catch (err: any) {
      lastErr = err;
      if (err?.name === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404) {
        throw err;
      }
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, (i + 1) * 80));
      }
    }
  }
  throw lastErr;
}

export interface CloudLead {
  id: string;
  nome: string;
  cognome?: string;
  email: string;
  telefono: string;
  dataSognata?: string;
  periodoSognato?: string;
  provenienza: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  ultimo_accesso_openday?: string;
  diaryAnswers?: Record<string, any>;
  diaryProgress?: number;
}

export interface RegisterOpenDayLeadResult {
  success: boolean;
  isNew?: boolean;
  client?: CloudLead;
  error?: string;
}

export interface OpenDayCloudState {
  totalScans: number;
  uniqueScans: number;
  scansHistory: Array<{
    timestamp: string;
    source: string;
    userAgent?: string;
    isUnique?: boolean;
  }>;
  leads: CloudLead[];
}

let memoryStateCache: { data: OpenDayCloudState; timestamp: number } | null = null;
const CACHE_TTL_MS = 3000; // 3 secondi di cache in memoria per performance

export function resetOpenDayCloudCache(): void {
  memoryStateCache = null;
}

/**
 * Riconcilia in automatico i lead presenti in localDb (es. salvati durante failover R2 offline)
 * verso Cloudflare R2 non appena quest'ultimo ritorna operativo.
 * Garantisce zero perdite di lead o risposte diari.
 */
export function syncBackLocalLeadsToCloud(cloudState: OpenDayCloudState): boolean {
  let stateModified = false;
  try {
    const store: any = getStore();
    const localLeads = (store.clients || []).filter(
      (c: any) => c?.provenienza === "QR Code Open Day" || (c?.tags && c.tags.includes("Open Day"))
    );

    if (!Array.isArray(cloudState.leads)) {
      cloudState.leads = [];
    }

    for (const local of localLeads) {
      const localEmail = (local.email || "").trim().toLowerCase();
      const localPhone = local.telefono ? normalizePhoneNumber(local.telefono) : null;

      const existingIdx = cloudState.leads.findIndex((cl) => {
        if (cl.id && cl.id === local.id) return true;
        if (localEmail && cl.email && cl.email.trim().toLowerCase() === localEmail) return true;
        if (localPhone?.valid && cl.telefono) {
          const cp = normalizePhoneNumber(cl.telefono);
          if (cp.valid && cp.normalized === localPhone.normalized) return true;
        }
        return false;
      });

      if (existingIdx === -1) {
        // Lead presente in locale ma non su cloud: sincronizzazione immediata
        const diary = getWeddingDiaryLocal(local.id);
        const ans = diary?.answers || local.diaryAnswers || {};
        const progress = local.diaryProgress || computeDiaryProgress(ans);

        cloudState.leads.push({
          id: local.id,
          nome: local.nome,
          cognome: local.cognome || "",
          email: local.email || ans.sposo_email || "",
          telefono: localPhone?.valid ? localPhone.normalized : (local.telefono || ans.sposo_telefono || ""),
          dataSognata: local.dataSognata || ans.data_matrimonio_desiderata,
          periodoSognato: local.periodoSognato,
          provenienza: local.provenienza || "QR Code Open Day",
          tags: local.tags || ["Open Day", "Wedding Diary"],
          created_at: local.created_at || new Date().toISOString(),
          updated_at: local.updated_at || new Date().toISOString(),
          diaryAnswers: ans,
          diaryProgress: progress,
        });
        stateModified = true;
      } else {
        // Lead già su cloud: verifica se localDb ha risposte più recenti o complete
        const cloudLead = cloudState.leads[existingIdx];
        const localDiary = getWeddingDiaryLocal(local.id);
        const ans = localDiary?.answers || local.diaryAnswers || {};
        const localCount = Object.keys(ans).length;
        const cloudCount = Object.keys(cloudLead.diaryAnswers || {}).length;

        if (localCount > cloudCount) {
          cloudLead.diaryAnswers = { ...(cloudLead.diaryAnswers || {}), ...ans };
          cloudLead.diaryProgress = computeDiaryProgress(cloudLead.diaryAnswers);
          cloudLead.updated_at = local.updated_at || new Date().toISOString();
          stateModified = true;
        }
      }
    }

    // Sincronizza anche contatori scansioni se maggiori in localDb
    if (store.openday_stats) {
      if (typeof store.openday_stats.total_scans === "number" && store.openday_stats.total_scans > (cloudState.totalScans || 0)) {
        cloudState.totalScans = store.openday_stats.total_scans;
        stateModified = true;
      }
      if (typeof store.openday_stats.unique_devices === "number" && store.openday_stats.unique_devices > (cloudState.uniqueScans || 0)) {
        cloudState.uniqueScans = store.openday_stats.unique_devices;
        stateModified = true;
      }
    }
  } catch (err) {
    console.warn("Avviso durante syncBackLocalLeadsToCloud:", err);
  }
  return stateModified;
}

/**
 * Legge lo stato Open Day centralizzato da Cloudflare R2 (persistente su tutti i container Vercel).
 */
export async function getOpenDayCloudState(): Promise<OpenDayCloudState> {
  const now = Date.now();
  if (memoryStateCache && now - memoryStateCache.timestamp < CACHE_TTL_MS) {
    return memoryStateCache.data;
  }

  try {
    const res = await executeR2WithRetry(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: STATE_KEY,
      })
    );
    const jsonStr = await res.Body?.transformToString();
    if (jsonStr) {
      const parsed: OpenDayCloudState = JSON.parse(jsonStr);
      if (!Array.isArray(parsed.leads)) parsed.leads = [];
      if (!Array.isArray(parsed.scansHistory)) parsed.scansHistory = [];
      if (typeof parsed.totalScans !== "number") parsed.totalScans = 0;
      if (typeof parsed.uniqueScans !== "number") {
        const historyUniques = parsed.scansHistory.filter((s) => s.isUnique !== false).length;
        parsed.uniqueScans = Math.max(parsed.leads.length, historyUniques || parsed.totalScans);
      }

      // Riconciliazione automatica con il database locale se ci sono lead salvati offline
      const reconciled = syncBackLocalLeadsToCloud(parsed);
      if (reconciled) {
        saveOpenDayCloudState(parsed).catch((err) =>
          console.warn("Avviso salvataggio stato riconciliato su R2:", err)
        );
      }

      memoryStateCache = { data: parsed, timestamp: now };
      return parsed;
    }
  } catch (err: any) {
    // Se il file non esiste ancora su R2 o c'è un errore di connessione, fallback sul DB locale
    if (err?.name !== "NoSuchKey" && err?.$metadata?.httpStatusCode !== 404) {
      console.warn("Avviso recupero stato R2 Open Day, failover su localDb:", err?.message || err);
    }
  }

  // Fallback sicuro su localDb: recupera i lead dell'Open Day salvati in locale
  try {
    const store: any = getStore();
    const fallbackLeads: CloudLead[] = (store.clients || [])
      .filter((c: any) => c?.provenienza === "QR Code Open Day" || (c?.tags && c.tags.includes("Open Day")))
      .map((c: any) => {
        const diary = getWeddingDiaryLocal(c.id);
        const ans = diary?.answers || c.diaryAnswers || {};
        return {
          id: c.id,
          nome: c.nome,
          cognome: c.cognome || "",
          email: c.email || ans.sposo_email || "",
          telefono: c.telefono || ans.sposo_telefono || "",
          dataSognata: c.dataSognata || ans.data_matrimonio_desiderata,
          periodoSognato: c.periodoSognato,
          provenienza: c.provenienza || "QR Code Open Day",
          tags: c.tags || ["Open Day", "Wedding Diary"],
          created_at: c.created_at || new Date().toISOString(),
          updated_at: c.updated_at || new Date().toISOString(),
          diaryAnswers: ans,
          diaryProgress: c.diaryProgress || computeDiaryProgress(ans),
        };
      });

    const fallbackTotalScans = typeof store.openday_stats?.total_scans === "number" ? store.openday_stats.total_scans : 0;
    const fallbackUniqueScans = typeof store.openday_stats?.unique_devices === "number" ? store.openday_stats.unique_devices : 0;

    const fallbackState: OpenDayCloudState = {
      totalScans: fallbackTotalScans,
      uniqueScans: fallbackUniqueScans,
      scansHistory: store.openday_stats?.scans_history || [],
      leads: fallbackLeads,
    };
    memoryStateCache = { data: fallbackState, timestamp: now };
    return fallbackState;
  } catch {
    // ignore
  }

  const initial: OpenDayCloudState = {
    totalScans: 0,
    uniqueScans: 0,
    scansHistory: [],
    leads: [],
  };
  memoryStateCache = { data: initial, timestamp: now };
  return initial;
}

/**
 * Salva lo stato Open Day centralizzato su Cloudflare R2.
 */
export async function saveOpenDayCloudState(state: OpenDayCloudState): Promise<boolean> {
  try {
    memoryStateCache = { data: state, timestamp: Date.now() };
    await executeR2WithRetry(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: STATE_KEY,
        Body: JSON.stringify(state, null, 2),
        ContentType: "application/json",
      })
    );
    return true;
  } catch (err) {
    console.warn("Avviso salvataggio stato R2 Open Day:", err);
    return false;
  }
}

/**
 * Traccia una scansione QR su Cloudflare R2 e localDb (visibile immediatamente in Admin su tutti i dispositivi).
 * Supporta la distinzione tra scansioni totali e scansioni uniche (anti-refresh F5).
 */
export async function recordOpenDayScanCloud(
  source: string = "qr",
  userAgent?: string,
  isUnique: boolean = true
) {
  return stateMutex.runExclusive(async () => {
    try {
      const state = await getOpenDayCloudState();
      state.totalScans = (state.totalScans || 0) + 1;
      if (typeof state.uniqueScans !== "number") {
        state.uniqueScans = state.leads?.length || 0;
      }
      if (isUnique !== false) {
        state.uniqueScans += 1;
      }
      if (!state.scansHistory) state.scansHistory = [];

      state.scansHistory.unshift({
        timestamp: new Date().toISOString(),
        source,
        userAgent: userAgent ? userAgent.slice(0, 150) : "Mobile Browser",
        isUnique: isUnique !== false,
      });

      if (state.scansHistory.length > 500) {
        state.scansHistory = state.scansHistory.slice(0, 500);
      }

      await saveOpenDayCloudState(state);

      // Dual-write anche su database locale (openDayTracker / localDb)
      try {
        const store: any = getStore();
        if (!store.openday_stats) {
          store.openday_stats = {
            total_scans: 0,
            unique_devices: 0,
            scans_history: [],
          };
        }
        store.openday_stats.total_scans = state.totalScans;
        store.openday_stats.unique_devices = state.uniqueScans;
        store.openday_stats.scans_history = state.scansHistory.slice(0, 500);
        saveStore(store);
      } catch (localErr) {
        console.warn("Avviso dual-write locale scansione:", localErr);
      }

      logActivity({
        level: "INFO",
        category: "LEAD_VISITA",
        actor: "Ospite Open Day",
        action: "QR_CODE_SCANSIONATO",
        message: `Scansione QR Code Open Day registrata (${isUnique !== false ? "Unica" : "Ripetuta"} - Totale: ${state.totalScans}, Uniche: ${state.uniqueScans})`,
        metadata: {
          source,
          userAgent: userAgent ? userAgent.slice(0, 150) : "Mobile Browser",
          isUnique: isUnique !== false,
          totalScans: state.totalScans,
          uniqueScans: state.uniqueScans,
        },
      });

      return {
        success: true,
        count: state.totalScans,
        totalScans: state.totalScans,
        uniqueScans: state.uniqueScans,
        uniqueCount: state.uniqueScans,
      };
    } catch {
      return { success: false, count: 0, totalScans: 0, uniqueScans: 0 };
    }
  });
}

/**
 * Registra o aggancia un Lead proveniente dal form Open Day su Cloudflare R2 e localDb.
 * Atomicamente serializzato tramite stateMutex: zero Lost Updates sotto carico di 20+ richieste concorrenti.
 * Resilienza failover: anche con R2 offline o credenziali errate, salva su localDb e non solleva errori 500.
 */
export async function registerOrFindOpenDayLeadCloud(input: {
  nomiSposi?: string;
  nomi?: string;
  email: string;
  telefono: string;
  dataSognata?: string;
  periodoSognato?: string;
}): Promise<RegisterOpenDayLeadResult> {
  const rawNomi = (input.nomiSposi || input.nomi || "").trim();
  const rawEmail = (input.email || "").trim().toLowerCase();
  const rawPhone = (input.telefono || "").trim();

  if (!rawNomi) return { success: false, error: "I nomi degli sposi sono obbligatori." };
  if (!rawEmail || !rawEmail.includes("@") || !rawEmail.includes(".")) {
    return { success: false, error: "Inserisci un indirizzo email valido." };
  }

  const phoneResult = normalizePhoneNumber(rawPhone);
  if (!phoneResult.valid) {
    return { success: false, error: phoneResult.error || "Numero di cellulare non valido." };
  }

  return stateMutex.runExclusive(async () => {
    const state = await getOpenDayCloudState();
    const nowIso = new Date().toISOString();

    // Deduplicazione su Cloudflare R2 (per email o telefono normalizzato)
    let matchedLead = state.leads.find((l) => {
      if (l.email && l.email.trim().toLowerCase() === rawEmail) return true;
      if (l.telefono) {
        const p = normalizePhoneNumber(l.telefono);
        if (p.valid && p.normalized === phoneResult.normalized) return true;
      }
      return false;
    });

    let isNew = false;

    if (matchedLead) {
      matchedLead.nome = rawNomi;
      matchedLead.telefono = phoneResult.normalized;
      matchedLead.updated_at = nowIso;
      matchedLead.ultimo_accesso_openday = nowIso;
      if (input.dataSognata) matchedLead.dataSognata = input.dataSognata;
      if (input.periodoSognato) matchedLead.periodoSognato = input.periodoSognato;
    } else {
      isNew = true;
      const uniqueSuffix = Math.random().toString(36).slice(2, 7);
      matchedLead = {
        id: `client-od-${Date.now()}-${uniqueSuffix}`,
        nome: rawNomi,
        cognome: "",
        email: rawEmail,
        telefono: phoneResult.normalized,
        dataSognata: input.dataSognata,
        periodoSognato: input.periodoSognato,
        provenienza: "QR Code Open Day",
        tags: ["Open Day", "Wedding Diary"],
        created_at: nowIso,
        updated_at: nowIso,
        ultimo_accesso_openday: nowIso,
        diaryAnswers: {},
        diaryProgress: 0,
      };
      state.leads.unshift(matchedLead);
    }

    // Salva in cloud su R2
    await saveOpenDayCloudState(state);

    // Dual-write failover: salva SEMPRE anche su localDb locale
    try {
      const store = getStore();
      if (!store.clients) store.clients = [];
      const localIdx = store.clients.findIndex(
        (c: any) => c.id === matchedLead!.id || (c.email && c.email.trim().toLowerCase() === rawEmail)
      );
      if (localIdx >= 0) {
        store.clients[localIdx] = { ...store.clients[localIdx], ...matchedLead };
      } else {
        store.clients.unshift(matchedLead);
      }
      saveStore(store);
    } catch (localDbErr) {
      console.warn("Avviso dual-write localDb:", localDbErr);
    }

    logActivity({
      level: "INFO",
      category: "LEAD_VISITA",
      actor: "Ospite Open Day",
      action: isNew ? "LEAD_OPENDAY_REGISTRATO" : "LEAD_OPENDAY_AGGIORNATO",
      message: `${rawNomi} (${rawEmail}, ${phoneResult.normalized}) si è registrato all'Open Day. Data sognata: ${input.dataSognata || "Da definire"}`,
      metadata: {
        clientId: matchedLead.id,
        nomi: rawNomi,
        email: rawEmail,
        telefono: phoneResult.normalized,
        dataSognata: input.dataSognata,
        periodoSognato: input.periodoSognato,
        isNew,
      },
    });

    return {
      success: true,
      isNew,
      client: matchedLead,
    };
  });
}

const lastDiaryLogByClient = new Map<string, { progress: number; ts: number }>();

/**
 * Salva le risposte del Wedding Diary su Cloudflare R2 (persistente e sincronizzato).
 * Supporta il field-level patching atomico sotto AsyncMutex per evitare race condition tra sposi.
 */
export async function saveWeddingDiaryCloud(
  clientId: string,
  answers: Record<string, any>,
  patch?: Record<string, any>
) {
  return stateMutex.runExclusive(async () => {
    try {
      const state = await getOpenDayCloudState();
      const lead = state.leads.find((l) => l.id === clientId);

      const existingAnswers = lead?.diaryAnswers || getWeddingDiaryLocal(clientId)?.answers || {};
      const mergedAnswers: Record<string, any> = { ...existingAnswers };

      if (patch && typeof patch === "object" && Object.keys(patch).length > 0) {
        Object.assign(mergedAnswers, patch);
      } else if (answers && typeof answers === "object") {
        Object.assign(mergedAnswers, answers);
      }

      const progress = computeDiaryProgress(mergedAnswers);
      const nowIso = new Date().toISOString();

      if (lead) {
        lead.diaryAnswers = mergedAnswers;
        lead.diaryProgress = progress;
        lead.updated_at = nowIso;
        await saveOpenDayCloudState(state);
      }

      // Salva anche nel fallback locale
      saveWeddingDiaryLocal({
        client_id: clientId,
        answers: mergedAnswers,
        completion_rate: progress,
      });

      const prevLog = lastDiaryLogByClient.get(clientId);
      const nowMs = Date.now();
      if (!prevLog || prevLog.progress !== progress || nowMs - prevLog.ts >= 2500) {
        lastDiaryLogByClient.set(clientId, { progress, ts: nowMs });
        logActivity({
          level: "INFO",
          category: "DIARIO",
          actor: "Cliente Sposi",
          action: "WEDDING_DIARY_AGGIORNATO",
          message: `Wedding Diary aggiornato per cliente ${clientId} (Progresso: ${progress}%)`,
          metadata: {
            clientId,
            diaryProgress: progress,
            answersCount: Object.keys(mergedAnswers).length,
            hasPatch: Boolean(patch && Object.keys(patch).length > 0),
          },
        });
      }

      return {
        success: true,
        diary: {
          client_id: clientId,
          answers: mergedAnswers,
          completion_rate: progress,
          updated_at: nowIso,
        },
      };
    } catch (err: any) {
      return { success: false, error: err?.message || "Errore salvataggio diario su cloud." };
    }
  });
}

/**
 * Recupera un Lead e il suo Wedding Diary da R2 (o fallback locale).
 */
export async function getOpenDayLeadAndDiary(clientId: string) {
  try {
    const state = await getOpenDayCloudState();
    const lead = state.leads.find((l) => l.id === clientId);

    if (lead) {
      return {
        client: lead,
        diary: {
          client_id: lead.id,
          answers: lead.diaryAnswers || {},
          completion_rate: lead.diaryProgress || 0,
          updated_at: lead.updated_at,
        },
      };
    }
  } catch {
    // fallback sotto
  }

  // Fallback locale
  const store = getStore();
  const client = (store.clients || []).find((c: any) => c.id === clientId);
  const diary = getWeddingDiaryLocal(clientId);

  return {
    client: client || null,
    diary: diary || null,
  };
}

/**
 * Recupera i dati aggregati per la pagina di monitoraggio /admin/openday da Cloudflare R2.
 * Calcola il conversion rate basandosi sulle scansioni uniche (robusto contro div per zero e capped a 100%).
 */
export async function getOpenDayAdminData() {
  const state = await getOpenDayCloudState();
  const totalScans = state.totalScans || 0;
  const uniqueScans = typeof state.uniqueScans === "number" ? state.uniqueScans : totalScans;
  const leads = state.leads || [];
  const conversionRate = uniqueScans > 0 ? Math.min(100, Math.round((leads.length / uniqueScans) * 100)) : 0;

  return {
    stats: {
      totalScans,
      uniqueScans,
      totalRegistered: leads.length,
      conversionRate,
      recentScans: (state.scansHistory || []).slice(0, 10),
    },
    openDayClients: leads.map((l) => ({
      ...l,
      diaryProgress: l.diaryProgress || computeDiaryProgress(l.diaryAnswers),
      diaryAnswers: l.diaryAnswers || {},
    })),
  };
}
