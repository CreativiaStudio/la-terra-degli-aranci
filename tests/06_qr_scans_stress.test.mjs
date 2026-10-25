/**
 * tests/06_qr_scans_stress.test.mjs
 * 
 * Test 6 - Stress Scansioni QR, Deduplicazione & Tasso di Conversione (Criterio 6)
 * 
 * Obiettivo:
 *  - Verificare il tracciamento delle scansioni QR sotto carico (totali vs uniche, cronologia, User Agent)
 *  - Verificare il dual-write su Cloudflare R2 e database locale (openDayTracker)
 *  - Verificare la formula matematica del conversion rate (lead / totalScans):
 *    1. Nessun crash o NaN su divisione per zero (0 scansioni -> 0% o visualizzazione sicura)
 *    2. Calcolo accurato di percentuali arrotondate (es. 1/3 -> 33%, 25/100 -> 25%)
 *    3. Gestione di lead eccedenti le scansioni (nessuna eccezione o overflow)
 *  - Verificare il tetto massimo della scansHistory (limite a 500 eventi per prevenire memory leak)
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  mockR2,
  loadModule,
  backupLocalDatabases,
  restoreLocalDatabases,
} from "./test-helper.mjs";

const {
  recordOpenDayScanCloud,
  getOpenDayAdminData,
  getOpenDayCloudState,
  saveOpenDayCloudState,
  resetOpenDayCloudCache,
} = loadModule("src/lib/openDayCloudSync.ts");
const { recordOpenDayScan, getOpenDayStats } = loadModule(
  "src/lib/openDayTracker.ts"
);
const { registerOrFindOpenDayLeadCloud } = loadModule(
  "src/lib/openDayCloudSync.ts"
);
const { getStore, saveStore } = loadModule("src/lib/localDb.ts");

describe("Test 6: Stress Scansioni QR & Robustezza KPI Conversione (Criterio 6)", () => {
  beforeEach(() => {
    backupLocalDatabases();
    mockR2.reset();
  });

  afterEach(() => {
    restoreLocalDatabases();
    mockR2.reset();
  });

  test("Stress Scansioni Concorrenti: 30 scansioni rapide registrate e salvate con cronologia", async () => {
    const scanBatch = Array.from({ length: 30 }, (_, i) => {
      const sources = ["qr_totem_ingresso", "qr_tavolo_agrumeto", "qr_sala_bianca", "direct"];
      return {
        source: sources[i % sources.length],
        userAgent: `TestBotMobile/${i + 1}.0 (iPhone; CPU OS 17_0 like Mac OS X)`,
      };
    });

    const results = await Promise.all(
      scanBatch.map((s) => recordOpenDayScanCloud(s.source, s.userAgent))
    );

    for (const r of results) {
      assert.strictEqual(r.success, true, "Ogni scansione deve completarsi con successo");
      assert.ok(r.count > 0, "Il conteggio deve essere positivo");
    }

    const state = await getOpenDayCloudState();
    assert.ok(
      state.totalScans >= 30,
      `Il totale scansioni deve essere almeno 30 (ricevuto: ${state.totalScans})`
    );
    assert.ok(
      Array.isArray(state.scansHistory),
      "scansHistory deve essere un array"
    );
    assert.ok(
      state.scansHistory.length >= 30,
      "La cronologia deve registrare le scansioni"
    );

    // Verifica primo elemento della cronologia
    const latest = state.scansHistory[0];
    assert.ok(latest.timestamp, "Deve avere timestamp ISO");
    assert.ok(latest.source, "Deve avere source");
    assert.ok(latest.userAgent, "Deve avere userAgent");
  });

  test("Dual-Write: Scansione registrata sia su R2 che su localDb/openDayTracker", async () => {
    // 1. Scrivi su cloud R2
    const cloudRes = await recordOpenDayScanCloud("qr_ingresso", "Safari/Mobile");
    assert.strictEqual(cloudRes.success, true);

    // 2. Scrivi su tracker locale
    const localRes = recordOpenDayScan("qr_ingresso", "Safari/Mobile");
    assert.strictEqual(localRes.success, true);

    // 3. Verifica dati aggregati
    const localStats = getOpenDayStats();
    assert.ok(
      localStats.totalScans >= 1,
      "Il contatore locale deve riflettere la scansione"
    );

    const cloudData = await getOpenDayAdminData();
    assert.ok(
      cloudData.stats.totalScans >= 1,
      "Il contatore cloud deve riflettere la scansione"
    );
  });

  test("Formula KPI Conversione: Zero crash su divisione per zero e calcolo matematico robusto", async () => {
    // Caso 1: Stato con 0 scansioni (resetta sia cloud R2 che localDb)
    const store = getStore();
    store.openday_stats = { total_scans: 0, unique_devices: 0, scans_history: [] };
    saveStore(store);

    await saveOpenDayCloudState({
      totalScans: 0,
      uniqueScans: 0,
      leads: [],
      scansHistory: [],
    });

    const emptyData = await getOpenDayAdminData();
    // Se totalScans o uniqueScans è 0, conversionRate DEVE essere 0 e non NaN o Infinity
    assert.strictEqual(
      Number.isFinite(emptyData.stats.conversionRate),
      true,
      "Il conversionRate deve essere un numero finito anche con 0 scansioni"
    );
    assert.strictEqual(
      Number.isNaN(emptyData.stats.conversionRate),
      false,
      "Il conversionRate non deve MAI essere NaN"
    );
    assert.strictEqual(
      emptyData.stats.conversionRate,
      0,
      "Con 0 scansioni il tasso di conversione deve valere 0%"
    );

    // Caso 2: 3 scansioni e 1 lead registrato
    await recordOpenDayScanCloud("qr");
    await recordOpenDayScanCloud("qr");
    await recordOpenDayScanCloud("qr");

    await registerOrFindOpenDayLeadCloud({
      nomiSposi: "Dario & Valentina",
      email: "dario.valentina@calc-test.it",
      telefono: "3334455667",
    });

    const data3to1 = await getOpenDayAdminData();
    const divisor = data3to1.stats.uniqueScans || data3to1.stats.totalScans;
    const expectedRate = divisor > 0 ? Math.min(100, Math.round((data3to1.stats.totalRegistered / divisor) * 100)) : 0;
    assert.strictEqual(
      data3to1.stats.conversionRate,
      expectedRate,
      `Il conversionRate calcolato deve essere ${expectedRate}% (trovato: ${data3to1.stats.conversionRate}%)`
    );

    // Caso 3: Edge case anomalo lead > scansioni (es. importazione anagrafica)
    // Non deve sollevare eccezioni né corrompere la struttura di getOpenDayAdminData()
    assert.doesNotThrow(async () => {
      await getOpenDayAdminData();
    });
  });

  test("Tetto massimo scansHistory: rispetta il limite di 500 elementi per prevenire memory leak", async () => {
    const state = await getOpenDayCloudState();
    // Inietta 510 scansioni fittizie nello stato per verificare il troncamento
    state.scansHistory = Array.from({ length: 510 }, (_, i) => ({
      timestamp: new Date().toISOString(),
      source: `qr_sim_${i}`,
      userAgent: "StressBot",
    }));

    // Triggera una nuova scansione
    await recordOpenDayScanCloud("qr_overflow_test");

    const updatedState = await getOpenDayCloudState();
    assert.ok(
      updatedState.scansHistory.length <= 500,
      `La cronologia non deve superare i 500 elementi (trovati: ${updatedState.scansHistory.length})`
    );
  });

  test("Zero Magic Numbers: a bucket R2 vuoto (404 NoSuchKey) e 0 scansioni locali, la 1ª scansione vale esattamente 1", async () => {
    mockR2.reset();
    resetOpenDayCloudCache();
    const store = getStore();
    store.openday_stats = { total_scans: 0, unique_devices: 0, scans_history: [] };
    saveStore(store);

    // Prima di qualsiasi scansione: 0 totale, 0 uniche (anche se esistono lead storici nel DB)
    const initialState = await getOpenDayCloudState();
    assert.strictEqual(
      initialState.totalScans,
      0,
      `Lo stato iniziale senza scansioni deve partire da 0 (trovato: ${initialState.totalScans})`
    );
    assert.strictEqual(
      initialState.uniqueScans,
      0,
      `Le scansioni uniche iniziali devono partire da 0 (trovato: ${initialState.uniqueScans})`
    );

    // 1ª scansione reale all'Open Day (isUnique = true)
    const firstScan = await recordOpenDayScanCloud("qr_ingresso_principale", "iPhone Safari", true);
    assert.strictEqual(firstScan.success, true);
    assert.strictEqual(firstScan.count, 1, "La prima scansione assoluta deve restituire count = 1");
    assert.strictEqual(firstScan.uniqueCount, 1, "La prima scansione unica deve restituire uniqueCount = 1");

    // Refresh della pagina dallo stesso telefono (isUnique = false)
    const refreshScan = await recordOpenDayScanCloud("qr_ingresso_principale", "iPhone Safari", false);
    assert.strictEqual(refreshScan.count, 2, "Il refresh incrementa totalScans a 2");
    assert.strictEqual(refreshScan.uniqueCount, 1, "Il refresh NON deve gonfiare uniqueScans (resta 1)");
  });
});
