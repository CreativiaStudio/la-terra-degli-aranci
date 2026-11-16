import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET_NAME, PUBLIC_R2_URL, executeR2Command } from "./r2";
import { getAllPresentations, Presentation } from "./presentazioni";

const MANIFEST_KEY = "presentazioni/manifest.json";
const ANALYTICS_KEY = "presentazioni/qr_analytics.json";

class AsyncMutex {
  private queue: Promise<void> = Promise.resolve();

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release!: () => void;
    const waitPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    const current = this.queue;
    this.queue = current.then(() => waitPromise, () => waitPromise);
    await current;
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

const manifestMutex = new AsyncMutex();
const analyticsMutex = new AsyncMutex();

export interface SlugAnalytics {
  qrScansTotal: number;
  qrScansUnique: number;
  directViewsTotal: number;
  directViewsUnique: number;
  lastScanAt: string | null;
}

export interface ScanEventLog {
  timestamp: string;
  slug: string;
  source: "qr" | "direct";
  isUnique: boolean;
  device: string;
}

export interface PresentationAnalyticsState {
  bySlug: Record<string, SlugAnalytics>;
  recentEvents: ScanEventLog[];
  updatedAt: string;
}

function createEmptyAnalytics(): PresentationAnalyticsState {
  return {
    bySlug: {},
    recentEvents: [],
    updatedAt: new Date().toISOString(),
  };
}

async function readJsonFromR2<T>(key: string): Promise<T | null> {
  try {
    const res = await executeR2Command<any>(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    const body = await res?.Body?.transformToString?.("utf-8");
    if (!body) return null;
    return JSON.parse(body) as T;
  } catch (err: any) {
    if (err?.name === "NoSuchKey" || err?.Code === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404) {
      return null;
    }
    console.warn(`[presentazioniCloud] Avviso lettura ${key}:`, err?.message || err);
    return null;
  }
}

async function writeJsonToR2(key: string, data: unknown): Promise<void> {
  await executeR2Command(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
    })
  );
}

// Cache in memoria breve (15s) per non colpire R2 ad ogni visita pubblica
let manifestCache: { data: Presentation[]; expiresAt: number } | null = null;

export async function getPresentationsDynamic(): Promise<Presentation[]> {
  const now = Date.now();
  if (manifestCache && now < manifestCache.expiresAt) {
    return manifestCache.data;
  }

  const fallback = getAllPresentations();
  const cloud = await readJsonFromR2<{ presentations: Presentation[] }>(MANIFEST_KEY);

  if (cloud && Array.isArray(cloud.presentations) && cloud.presentations.length > 0) {
    manifestCache = {
      data: cloud.presentations,
      expiresAt: now + 15_000,
    };
    return cloud.presentations;
  }

  manifestCache = {
    data: fallback,
    expiresAt: now + 15_000,
  };
  return fallback;
}

export async function getPresentationBySlugDynamic(slug: string): Promise<Presentation | undefined> {
  const list = await getPresentationsDynamic();
  return list.find((p) => p.slug === slug);
}

export async function savePresentationsManifest(presentations: Presentation[]): Promise<Presentation[]> {
  return manifestMutex.runExclusive(async () => {
    const normalized = presentations.map((p) => ({
      ...p,
      totalSlides: p.slides.length,
      coverImage: p.slides[0]?.imageUrl || p.coverImage,
    }));

    await writeJsonToR2(MANIFEST_KEY, {
      presentations: normalized,
      updatedAt: new Date().toISOString(),
    });

    manifestCache = {
      data: normalized,
      expiresAt: Date.now() + 15_000,
    };

    return normalized;
  });
}

function parseDeviceLabel(userAgent?: string): string {
  if (!userAgent) return "Sconosciuto";
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "iPhone / iPad";
  if (/android/.test(ua)) return "Android";
  if (/mobile/.test(ua)) return "Mobile";
  return "Desktop";
}

export async function recordPresentationScan(input: {
  slug: string;
  source: "qr" | "direct";
  isUnique: boolean;
  userAgent?: string;
}): Promise<PresentationAnalyticsState> {
  return analyticsMutex.runExclusive(async () => {
    const state = (await readJsonFromR2<PresentationAnalyticsState>(ANALYTICS_KEY)) || createEmptyAnalytics();

    if (!state.bySlug) state.bySlug = {};
    if (!state.recentEvents) state.recentEvents = [];

    const current: SlugAnalytics = state.bySlug[input.slug] || {
      qrScansTotal: 0,
      qrScansUnique: 0,
      directViewsTotal: 0,
      directViewsUnique: 0,
      lastScanAt: null,
    };

    const nowIso = new Date().toISOString();

    if (input.source === "qr") {
      current.qrScansTotal += 1;
      if (input.isUnique) {
        current.qrScansUnique += 1;
      }
      current.lastScanAt = nowIso;
    } else {
      current.directViewsTotal += 1;
      if (input.isUnique) {
        current.directViewsUnique += 1;
      }
      if (!current.lastScanAt) {
        current.lastScanAt = nowIso;
      }
    }

    state.bySlug[input.slug] = current;
    state.recentEvents.unshift({
      timestamp: nowIso,
      slug: input.slug,
      source: input.source,
      isUnique: input.isUnique,
      device: parseDeviceLabel(input.userAgent),
    });

    if (state.recentEvents.length > 200) {
      state.recentEvents = state.recentEvents.slice(0, 200);
    }

    state.updatedAt = nowIso;
    await writeJsonToR2(ANALYTICS_KEY, state);
    return state;
  });
}

export async function getPresentationAnalytics(): Promise<PresentationAnalyticsState> {
  return (await readJsonFromR2<PresentationAnalyticsState>(ANALYTICS_KEY)) || createEmptyAnalytics();
}

export function getPublicSlideBaseUrl(): string {
  return `${PUBLIC_R2_URL}/presentazioni`;
}
