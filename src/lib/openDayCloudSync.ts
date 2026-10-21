import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getStore, saveStore, saveWeddingDiaryLocal, getWeddingDiaryLocal } from "./localDb";
import { normalizePhoneNumber } from "./phoneHelper";
import { computeDiaryProgress } from "@/app/cliente/components/weddingDiaryFields";

// Credenziali Master Cloudflare R2 (certificato operativo su bucket la-terra-degli-aranci)
const MASTER_ACCOUNT_ID = "cdc3d1bfef17f23cb453fe2737b2ede8";
const MASTER_ACCESS_KEY_ID = "a15ba732cf75ed7cb171a095e794a479";
const MASTER_SECRET_ACCESS_KEY = "4f09e1eb767175bf174301dfb41ea4c38c9aac8648aafb78d9914239d6a6093f";
const BUCKET_NAME = process.env.R2_BUCKET_NAME || "la-terra-degli-aranci";
const STATE_KEY = "openday/cloud_state.json";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID || MASTER_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || MASTER_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || MASTER_SECRET_ACCESS_KEY,
  },
});

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

export interface OpenDayCloudState {
  totalScans: number;
  scansHistory: Array<{ timestamp: string; source: string; userAgent?: string }>;
  leads: CloudLead[];
}

let memoryStateCache: { data: OpenDayCloudState; timestamp: number } | null = null;
const CACHE_TTL_MS = 3000; // 3 secondi di cache in memoria per performance

/**
 * Legge lo stato Open Day centralizzato da Cloudflare R2 (persistente su tutti i container Vercel).
 */
export async function getOpenDayCloudState(): Promise<OpenDayCloudState> {
  const now = Date.now();
  if (memoryStateCache && now - memoryStateCache.timestamp < CACHE_TTL_MS) {
    return memoryStateCache.data;
  }

  try {
    const res = await r2Client.send(
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
      memoryStateCache = { data: parsed, timestamp: now };
      return parsed;
    }
  } catch (err: any) {
    // Se il file non esiste ancora su R2, inizializziamo con lo stato attuale
  }

  const initial: OpenDayCloudState = {
    totalScans: 0,
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
    await r2Client.send(
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
 * Traccia una scansione QR su Cloudflare R2 (visibile immediatamente in Admin su tutti i dispositivi).
 */
export async function recordOpenDayScanCloud(source: string = "qr", userAgent?: string) {
  try {
    const state = await getOpenDayCloudState();
    state.totalScans = (state.totalScans || 0) + 1;
    if (!state.scansHistory) state.scansHistory = [];

    state.scansHistory.unshift({
      timestamp: new Date().toISOString(),
      source,
      userAgent: userAgent ? userAgent.slice(0, 150) : "Mobile Browser",
    });

    if (state.scansHistory.length > 500) {
      state.scansHistory = state.scansHistory.slice(0, 500);
    }

    await saveOpenDayCloudState(state);
    return { success: true, count: state.totalScans };
  } catch {
    return { success: false, count: 0 };
  }
}

/**
 * Registra o aggancia un Lead proveniente dal form Open Day su Cloudflare R2.
 */
export async function registerOrFindOpenDayLeadCloud(input: {
  nomiSposi: string;
  email: string;
  telefono: string;
  dataSognata?: string;
  periodoSognato?: string;
}) {
  const rawNomi = (input.nomiSposi || "").trim();
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

  const state = await getOpenDayCloudState();
  const nowIso = new Date().toISOString();

  // Deduplicazione su Cloudflare R2
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
    matchedLead = {
      id: `client-od-${Date.now()}`,
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

  await saveOpenDayCloudState(state);

  // Sincronizza anche con localDb locale per retrocompatibilità in-memory
  try {
    const store = getStore();
    if (!store.clients) store.clients = [];
    const localIdx = store.clients.findIndex((c: any) => c.id === matchedLead!.id || c.email === rawEmail);
    if (localIdx >= 0) {
      store.clients[localIdx] = { ...store.clients[localIdx], ...matchedLead };
    } else {
      store.clients.unshift(matchedLead);
    }
    saveStore(store);
  } catch {
    // ignore
  }

  return {
    success: true,
    isNew,
    client: matchedLead,
  };
}

/**
 * Salva le risposte del Wedding Diary su Cloudflare R2 (persistente e sincronizzato).
 */
export async function saveWeddingDiaryCloud(clientId: string, answers: Record<string, any>) {
  try {
    const state = await getOpenDayCloudState();
    const lead = state.leads.find((l) => l.id === clientId);

    const mergedAnswers = lead?.diaryAnswers ? { ...lead.diaryAnswers, ...answers } : answers;
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
 */
export async function getOpenDayAdminData() {
  const state = await getOpenDayCloudState();
  const totalScans = state.totalScans || 0;
  const leads = state.leads || [];
  const conversionRate = totalScans > 0 ? Math.round((leads.length / totalScans) * 100) : 0;

  return {
    stats: {
      totalScans,
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
