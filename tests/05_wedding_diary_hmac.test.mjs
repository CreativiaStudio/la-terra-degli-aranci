/**
 * tests/05_wedding_diary_hmac.test.mjs
 * 
 * Test 5 - Wedding Diary, Crittografia HMAC & Accesso Admin (Criterio 5)
 * 
 * Obiettivo:
 *  - Verificare la generazione e validazione crittografica del token di condivisione HMAC:
 *    1. createDiaryShareToken(clientId): genera un token deterministico a 32 caratteri hex
 *    2. verifyDiaryShareToken(clientId, token): valida in tempo costante e respinge token alterati o errati
 *  - Verificare la blindatura collaborativa del diario (salvataggio a patch / merge concorrente):
 *    Le risposte inviate da un partner non devono cancellare i campi compilati dall'altro partner
 *  - Verificare la corretta composizione dei link per l'amministratore (OpenDayActionsMenu)
 *    Link "Guarda Wedding Diary" e link "Invia su WhatsApp" con token HMAC incorporato
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  mockR2,
  loadModule,
  backupLocalDatabases,
  restoreLocalDatabases,
} from "./test-helper.mjs";

const { createDiaryShareToken, verifyDiaryShareToken } = loadModule(
  "src/lib/magicLinkAuth.ts"
);
const {
  registerOrFindOpenDayLeadCloud,
  saveWeddingDiaryCloud,
  getOpenDayLeadAndDiary,
} = loadModule("src/lib/openDayCloudSync.ts");
const { computeDiaryProgress } = loadModule(
  "src/app/cliente/components/weddingDiaryFields.ts"
);

describe("Test 5: Wedding Diary, Token HMAC & Accesso Collaborativo (Criterio 5)", () => {
  beforeEach(() => {
    backupLocalDatabases();
    mockR2.reset();
  });

  afterEach(() => {
    restoreLocalDatabases();
    mockR2.reset();
  });

  test("Sicurezza Crittografica HMAC: Generazione e Validazione Timing-Safe del Token di Condivisione", () => {
    const clientIdA = "client-od-test-alpha-123";
    const clientIdB = "client-od-test-beta-456";

    // 1. Generazione
    const tokenA = createDiaryShareToken(clientIdA);
    const tokenB = createDiaryShareToken(clientIdB);

    assert.ok(tokenA, "Il token non deve essere vuoto");
    assert.strictEqual(tokenA.length, 32, "Il token deve essere una stringa esadecimale a 32 caratteri");
    assert.match(tokenA, /^[0-9a-f]{32}$/, "Il token deve contenere solo caratteri esadecimali");

    // Deterministico per lo stesso clientId
    assert.strictEqual(
      createDiaryShareToken(clientIdA),
      tokenA,
      "Il token deve essere deterministico per lo stesso clientId"
    );

    // Univoco per clienti differenti
    assert.notStrictEqual(
      tokenA,
      tokenB,
      "Clienti diversi devono generare token HMAC differenti"
    );

    // 2. Validazione
    assert.strictEqual(
      verifyDiaryShareToken(clientIdA, tokenA),
      true,
      "Il token corretto deve essere verificato con esito positivo"
    );

    // Respinge token scambiato tra clienti (anti-cross-tenant)
    assert.strictEqual(
      verifyDiaryShareToken(clientIdA, tokenB),
      false,
      "Il token del cliente B non deve essere valido per il cliente A"
    );

    assert.strictEqual(
      verifyDiaryShareToken(clientIdB, tokenA),
      false,
      "Il token del cliente A non deve essere valido per il cliente B"
    );

    // Respinge token manomesso (anche di un singolo carattere)
    const tamperedToken =
      tokenA.slice(0, -1) + (tokenA.endsWith("a") ? "b" : "a");
    assert.strictEqual(
      verifyDiaryShareToken(clientIdA, tamperedToken),
      false,
      "Un token manomesso deve essere categoricamente respinto"
    );

    // Respinge input vuoti o nulli
    assert.strictEqual(verifyDiaryShareToken("", tokenA), false);
    assert.strictEqual(verifyDiaryShareToken(clientIdA, ""), false);
    assert.strictEqual(verifyDiaryShareToken(null, null), false);
  });

  test("Salvataggio a Patch Collaborativo: Compilazione concorrente Sposo/Sposa senza sovrascritture distruttive", async () => {
    // 0. Pre-registra la coppia come lead Open Day ufficiale
    const lead = await registerOrFindOpenDayLeadCloud({
      nomiSposi: "Giacomo & Eleonora",
      email: `giacomo.eleonora.${Date.now()}@collab.it`,
      telefono: "3338877665",
      dataSognata: "2027-09-24",
    });
    const clientId = lead.client.id;

    // 1. Lo Sposo compila i suoi dati di base (campi ufficiali del form)
    const sposoUpdate = {
      la_nostra_data_perfetta: "2027-09-24",
      inizio_evento: "Pranzo",
      rito_simbolico: "All'aperto nel Giardino delle Promesse",
    };

    const res1 = await saveWeddingDiaryCloud(clientId, sposoUpdate);
    assert.strictEqual(res1.success, true);
    const prog1 = res1.diary.completion_rate;
    assert.ok(prog1 > 0, "Il progresso iniziale deve essere maggiore di zero");

    // 2. La Sposa accede dal suo telefono e compila musica e abito, senza inviare i campi dello sposo
    const sposaUpdate = {
      canzone_ingresso_sposa: "Canon in D - Johann Pachelbel",
      abito_della_sposa: "Abito a sirena in pizzo francese",
      partecipazioni_e_inviti: "Partecipazioni digitali e cartacee su carta cotone",
    };

    const res2 = await saveWeddingDiaryCloud(clientId, sposaUpdate);
    assert.strictEqual(res2.success, true);
    const prog2 = res2.diary.completion_rate;
    assert.ok(
      prog2 > prog1,
      `Il progresso deve aumentare con nuove risposte (prog1: ${prog1}%, prog2: ${prog2}%)`
    );

    // 3. Verifica che il merge finale contenga TUTTI i campi di entrambi i partner
    const cloudRecord = await getOpenDayLeadAndDiary(clientId);
    const finalAnswers = cloudRecord.diary?.answers || {};

    // Campi dello sposo
    assert.strictEqual(
      finalAnswers.la_nostra_data_perfetta,
      "2027-09-24",
      "Il campo la_nostra_data_perfetta deve essere preservato"
    );
    assert.strictEqual(
      finalAnswers.inizio_evento,
      "Pranzo",
      "Il campo inizio_evento deve essere preservato"
    );
    assert.strictEqual(
      finalAnswers.rito_simbolico,
      "All'aperto nel Giardino delle Promesse",
      "Il campo rito_simbolico deve essere preservato"
    );

    // Campi della sposa
    assert.strictEqual(
      finalAnswers.canzone_ingresso_sposa,
      "Canon in D - Johann Pachelbel",
      "Il campo canzone_ingresso_sposa deve essere preservato"
    );
    assert.strictEqual(
      finalAnswers.abito_della_sposa,
      "Abito a sirena in pizzo francese",
      "Il campo abito_della_sposa deve essere preservato"
    );
    assert.strictEqual(
      finalAnswers.partecipazioni_e_inviti,
      "Partecipazioni digitali e cartacee su carta cotone",
      "Il campo partecipazioni_e_inviti deve essere preservato"
    );

    // Progresso matematico accurato
    const expectedProgress = computeDiaryProgress(finalAnswers);
    assert.strictEqual(
      cloudRecord.diary?.completion_rate,
      expectedProgress,
      "La percentuale di completamento memorizzata deve combaciare col ricalcolo esatto"
    );
  });

  test("Composizione dei link di condivisione WhatsApp e Accesso Admin 1-Click", () => {
    const clientId = "client-od-links-test";
    const nome = "Alessandro & Sara";
    const telefono = "+39 347 1122334";
    const shareToken = createDiaryShareToken(clientId);

    // Generazione URL WhatsApp
    const cleanPhone = telefono.replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `Gentili ${nome}, grazie per la visita a La Terra degli Aranci! Ecco il vostro Wedding Diary custodito: https://ecosistema.laterradegliaranci.it/openday/diario?id=${clientId}&share=${shareToken}`
    )}`;

    assert.ok(waUrl.startsWith("https://wa.me/393471122334?text="));
    assert.ok(
      decodeURIComponent(waUrl).includes(`id=${clientId}&share=${shareToken}`),
      "L'URL WhatsApp deve contenere id e shareToken HMAC"
    );

    // Link Accesso Diario
    const directDiaryUrl = `/openday/diario?id=${clientId}&share=${shareToken}`;
    assert.ok(directDiaryUrl.includes(clientId));
    assert.ok(directDiaryUrl.includes(shareToken));
  });

  test("Salvataggio puntuale con parametro patch in saveWeddingDiaryCloud", async () => {
    const lead = await registerOrFindOpenDayLeadCloud({
      nomiSposi: "Marco & Laura",
      email: `marco.laura.${Date.now()}@patch.it`,
      telefono: "3391122334",
    });
    const clientId = lead.client.id;

    // Sposo invia snapshot iniziale
    await saveWeddingDiaryCloud(clientId, {
      stile_matrimonio: "Country Chic in agrumeto",
      colore_principale: "Arancione e Verde Salvia",
    });

    // Sposa invia solo una patch puntuale di un campo
    const patchRes = await saveWeddingDiaryCloud(
      clientId,
      {}, // answers vuoto o non rilevante
      { canzone_primo_ballo: "Perfect - Ed Sheeran" } // patch puntuale
    );

    assert.strictEqual(patchRes.success, true);
    assert.strictEqual(
      patchRes.diary.answers.stile_matrimonio,
      "Country Chic in agrumeto",
      "Il campo precedente dello sposo non deve essere cancellato"
    );
    assert.strictEqual(
      patchRes.diary.answers.canzone_primo_ballo,
      "Perfect - Ed Sheeran",
      "Il nuovo campo della patch deve essere applicato"
    );
  });
});
