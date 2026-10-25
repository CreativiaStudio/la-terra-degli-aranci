/**
 * tests/03_blackbox_audit.test.mjs
 * 
 * Test 3 - Audit Log Scatola Nera (Criterio 3)
 * 
 * Obiettivo:
 *  - Verificare l'emissione atomica e la persistenza dei tre eventi chiave dell'Open Day:
 *    1. QR_CODE_SCANSIONATO (categoria LEAD_VISITA, attore "Ospite Open Day")
 *    2. LEAD_OPENDAY_REGISTRATO e LEAD_OPENDAY_AGGIORNATO (categoria LEAD_VISITA)
 *    3. WEDDING_DIARY_AGGIORNATO (categoria DIARIO, con diaryProgress numerico e % nel messaggio)
 *  - Verificare la corretta applicazione dei filtri di getBlackboxEntries() (categoria, livello, giorni, search)
 *  - Verificare l'ordinamento decrescente cronologico degli eventi
 *  - Verificare la persistenza fisica su disco in data/blackbox_log.json
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  mockR2,
  loadModule,
  backupLocalDatabases,
  restoreLocalDatabases,
  projectRoot,
} from "./test-helper.mjs";

const { recordOpenDayScanCloud, registerOrFindOpenDayLeadCloud, saveWeddingDiaryCloud } =
  loadModule("src/lib/openDayCloudSync.ts");
const {
  getBlackboxEntries,
  getBlackboxEntriesUnified,
  getBlackboxStats,
  purgeExpiredArchives,
  MAX_ARCHIVE_DAYS,
} = loadModule("src/lib/blackbox.ts");

const BLACKBOX_FILE = path.join(projectRoot, "data", "blackbox_log.json");

describe("Test 3: Tracciamento Audit Scatola Nera (Criterio 3)", () => {
  beforeEach(() => {
    backupLocalDatabases();
    mockR2.reset();
  });

  afterEach(() => {
    restoreLocalDatabases();
    mockR2.reset();
  });

  test("Tracciamento Scansione QR: emette log con categoria LEAD_VISITA e azione QR_CODE_SCANSIONATO", async () => {
    const scanSource = "qr_tavolo_agrumeto";
    const testUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";

    const scanRes = await recordOpenDayScanCloud(scanSource, testUA);
    assert.strictEqual(scanRes.success, true, "La scansione deve essere registrata con successo");

    // Verifica presenza nella Scatola Nera
    const entries = getBlackboxEntries({ category: "LEAD_VISITA", limit: 50 });
    const qrLog = entries.find(
      (e) => e.action === "QR_CODE_SCANSIONATO" && e.metadata?.source === scanSource
    );

    assert.ok(qrLog, "Deve esistere una entry con azione QR_CODE_SCANSIONATO per la sorgente specificata");
    assert.strictEqual(qrLog.category, "LEAD_VISITA");
    assert.strictEqual(qrLog.level, "INFO");
    assert.strictEqual(qrLog.actor, "Ospite Open Day");
    assert.ok(qrLog.message.includes("Scansione QR Code Open Day registrata"));
    assert.strictEqual(qrLog.metadata.source, scanSource);
    assert.ok(
      qrLog.metadata.userAgent.includes("iPhone"),
      "I metadati devono includere lo User Agent mobile dell'ospite"
    );
  });

  test("Tracciamento Registrazione e Aggiornamento Lead: LEAD_OPENDAY_REGISTRATO e LEAD_OPENDAY_AGGIORNATO", async () => {
    const leadEmail = `audit.test.${Date.now()}@openday.it`;
    const leadPhone = "3337788990";

    // 1. Nuova Registrazione
    const newLeadRes = await registerOrFindOpenDayLeadCloud({
      nomiSposi: "Fabio & Beatrice",
      email: leadEmail,
      telefono: leadPhone,
      dataSognata: "2027-06-25",
    });

    assert.strictEqual(newLeadRes.isNew, true);

    const logsAfterNew = getBlackboxEntries({ category: "LEAD_VISITA", limit: 20 });
    const regLog = logsAfterNew.find(
      (e) => e.action === "LEAD_OPENDAY_REGISTRATO" && e.metadata?.email === leadEmail
    );

    assert.ok(regLog, "Deve esistere il log con azione LEAD_OPENDAY_REGISTRATO");
    assert.strictEqual(regLog.category, "LEAD_VISITA");
    assert.strictEqual(regLog.actor, "Ospite Open Day");
    assert.strictEqual(regLog.metadata.isNew, true);
    assert.strictEqual(regLog.metadata.nomi, "Fabio & Beatrice");
    assert.strictEqual(regLog.metadata.dataSognata, "2027-06-25");

    // 2. Aggiornamento Lead Esistente
    const updateLeadRes = await registerOrFindOpenDayLeadCloud({
      nomiSposi: "Fabio & Beatrice De Luca",
      email: leadEmail,
      telefono: leadPhone,
      dataSognata: "2027-07-02", // nuova data
    });

    assert.strictEqual(updateLeadRes.isNew, false);

    const logsAfterUpdate = getBlackboxEntries({ category: "LEAD_VISITA", limit: 20 });
    const updateLog = logsAfterUpdate.find(
      (e) => e.action === "LEAD_OPENDAY_AGGIORNATO" && e.metadata?.email === leadEmail
    );

    assert.ok(updateLog, "Deve esistere il log con azione LEAD_OPENDAY_AGGIORNATO");
    assert.strictEqual(updateLog.category, "LEAD_VISITA");
    assert.strictEqual(updateLog.metadata.isNew, false);
    assert.strictEqual(updateLog.metadata.nomi, "Fabio & Beatrice De Luca");
    assert.strictEqual(updateLog.metadata.dataSognata, "2027-07-02");
  });

  test("Tracciamento Wedding Diary: WEDDING_DIARY_AGGIORNATO con categoria DIARIO e percentuale di completamento", async () => {
    // 1. Registra un lead
    const lead = await registerOrFindOpenDayLeadCloud({
      nomiSposi: "Giorgio & Rossella",
      email: `giorgio.rossella.${Date.now()}@tda.it`,
      telefono: "3389900112",
      dataSognata: "2027-05-15",
    });

    const clientId = lead.client.id;

    // 2. Salva risposte al Wedding Diary
    const answers = {
      sposo_nome: "Giorgio",
      sposa_nome: "Rossella",
      la_nostra_data_perfetta: "2027-05-15",
      stile_matrimonio: "Botanico Elegante",
      spazi_preferiti: ["Agrumeto Storico", "Sala Bianca"],
    };

    const diaryRes = await saveWeddingDiaryCloud(clientId, answers);
    assert.strictEqual(diaryRes.success, true);
    assert.ok(diaryRes.diary.completion_rate > 0, "Il progresso del diario deve essere > 0%");

    // 3. Verifica il log generato
    const diaryLogs = getBlackboxEntries({ category: "DIARIO", limit: 20 });
    const log = diaryLogs.find(
      (e) => e.action === "WEDDING_DIARY_AGGIORNATO" && e.metadata?.clientId === clientId
    );

    assert.ok(log, "Deve essere presente il log WEDDING_DIARY_AGGIORNATO");
    assert.strictEqual(log.category, "DIARIO");
    assert.strictEqual(log.actor, "Cliente Sposi");
    assert.strictEqual(log.metadata.clientId, clientId);
    assert.strictEqual(typeof log.metadata.diaryProgress, "number");
    assert.strictEqual(log.metadata.diaryProgress, diaryRes.diary.completion_rate);
    assert.ok(
      log.message.includes(`(Progresso: ${diaryRes.diary.completion_rate}%)`),
      `Il messaggio deve contenere la percentuale di progresso (trovato: ${log.message})`
    );
  });

  test("Integrità Filtri e Ordinamento Scatola Nera: isolamento categorie e ordine cronologico decrescente", async () => {
    const allEntries = getBlackboxEntries({ limit: 100 });
    assert.ok(Array.isArray(allEntries));

    // Verifica ordinamento decrescente: ogni timestamp deve essere <= del precedente
    for (let i = 1; i < allEntries.length; i++) {
      const prevTime = new Date(allEntries[i - 1].timestamp).getTime();
      const currTime = new Date(allEntries[i].timestamp).getTime();
      assert.ok(
        prevTime >= currTime,
        `Gli eventi devono essere ordinati dal più recente al più vecchio (${allEntries[i - 1].timestamp} vs ${allEntries[i].timestamp})`
      );
    }

    // Verifica filtro DIARIO
    const diaryEntries = getBlackboxEntries({ category: "DIARIO" });
    for (const e of diaryEntries) {
      assert.strictEqual(e.category, "DIARIO", "Tutti gli elementi devono avere categoria DIARIO");
    }

    // Verifica persistenza fisica su file JSON
    assert.ok(fs.existsSync(BLACKBOX_FILE), "Il file data/blackbox_log.json deve esistere su disco");
    const fileContent = fs.readFileSync(BLACKBOX_FILE, "utf8");
    assert.doesNotThrow(() => JSON.parse(fileContent), "Il file blackbox_log.json deve essere un JSON valido");
  });

  test("Anti-Bloat Scatola Nera: coalescing raffiche Diary a parità di % + ring-buffer unico su R2 (zero file singoli)", async () => {
    const lead = await registerOrFindOpenDayLeadCloud({
      nomiSposi: "Edoardo & Chiara",
      email: `edoardo.chiara.${Date.now()}@coalesce.it`,
      telefono: "3391122334",
    });
    const clientId = lead.client.id;

    // 5 micro-salvataggi istantanei sullo stesso campo (stessa % di completamento entro 2.5s)
    for (let i = 1; i <= 5; i++) {
      await saveWeddingDiaryCloud(clientId, {
        note_speciali_sposi: ` Digitazione carattere ${i}`,
      });
    }

    const diaryLogs = getBlackboxEntries({ category: "DIARIO", limit: 50 }).filter(
      (e) => e.action === "WEDDING_DIARY_AGGIORNATO" && e.metadata?.clientId === clientId
    );
    assert.strictEqual(
      diaryLogs.length,
      1,
      `5 micro-salvataggi ravvicinati con identica % devono coalescere in 1 solo log Scatola Nera (trovati: ${diaryLogs.length})`
    );

    // Attende il flush fire-and-forget su MockR2
    await new Promise((r) => setTimeout(r, 30));

    // Verifica che su R2 esista il ring-buffer unico blackbox/recent_feed.json e ZERO file singoli blackbox/entries/*
    const bucketName = process.env.R2_BUCKET_NAME || "la-terra-degli-aranci";
    const bucketMap = mockR2.buckets.get(bucketName);
    const allR2Keys = bucketMap ? Array.from(bucketMap.keys()) : [];
    const perEntryBloatKeys = allR2Keys.filter((k) => k.startsWith("blackbox/entries/"));
    assert.strictEqual(
      perEntryBloatKeys.length,
      0,
      `Non devono esistere file singoli blackbox/entries/*.json su R2 (trovati: ${perEntryBloatKeys.length})`
    );
    assert.ok(
      allR2Keys.includes("blackbox/recent_feed.json"),
      "Deve esistere il ring-buffer unico blackbox/recent_feed.json su R2"
    );

    const unified = await getBlackboxEntriesUnified({ category: "DIARIO", limit: 20 });
    assert.ok(
      unified.some((e) => e.metadata?.clientId === clientId),
      "getBlackboxEntriesUnified deve restituire gli eventi fusi tra locale e ring-buffer R2"
    );
  });

  test("Politica Anti-Bloat a 6 Mesi (180gg): auto-purge fisico dei file d'archivio obsoleti", async () => {
    const dataDir = path.join(projectRoot, "data");
    const oldFile = path.join(dataDir, "blackbox_archive_2026_01.json");
    const recentFile = path.join(dataDir, "blackbox_archive_2026_09.json");

    try {
      // 1. Crea file d'archivio di oltre 200 giorni fa (> 180 giorni)
      const oldTimestamp = new Date(Date.now() - 220 * 24 * 60 * 60 * 1000).toISOString();
      const oldEntries = [
        {
          id: "old-entry-1",
          timestamp: oldTimestamp,
          level: "INFO",
          category: "LEAD_VISITA",
          actor: "Ospite Antico",
          action: "QR_CODE_SCANSIONATO",
          message: "Scansione obsoleta oltre 6 mesi fa",
        },
      ];
      fs.writeFileSync(oldFile, JSON.stringify(oldEntries, null, 2), "utf8");

      // 2. Crea file d'archivio recente (60 giorni fa, compreso nella finestra 180gg)
      const recentTimestamp = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const recentEntries = [
        {
          id: "recent-entry-1",
          timestamp: recentTimestamp,
          level: "INFO",
          category: "LEAD_VISITA",
          actor: "Ospite Stagione",
          action: "QR_CODE_SCANSIONATO",
          message: "Scansione valida della stagione corrente",
        },
      ];
      fs.writeFileSync(recentFile, JSON.stringify(recentEntries, null, 2), "utf8");

      // 3. Esegue purgeExpiredArchives
      const purged = purgeExpiredArchives(MAX_ARCHIVE_DAYS);
      assert.ok(purged >= 1, "Deve aver eliminato almeno 1 entry obsoleta");

      // 4. Verifica che il file vecchio sia stato eliminato fisicamente e il recente sia intatto
      assert.strictEqual(fs.existsSync(oldFile), false, "Il file d'archivio > 180gg deve essere stato cancellato");
      assert.strictEqual(fs.existsSync(recentFile), true, "Il file d'archivio entro 180gg deve essere preservato");
    } finally {
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      if (fs.existsSync(recentFile)) fs.unlinkSync(recentFile);
    }
  });
});
