/**
 * tests/01_r2_concurrency.test.mjs
 * 
 * Test 1 - Concorrenza R2: Invocazione concorrente di registerOrFindOpenDayLeadCloud con 20 richieste simultanee
 * 
 * Obiettivo:
 *  - Verificare che sotto 20 scritture simultanee con nomi ed email differenti, il 100% dei lead risulti registrato
 *  - Verificare l'assenza totale di race condition ("Lost Updates")
 *  - Verificare che il payload salvato in R2 (openday/cloud_state.json) sia un JSON integro e non corrotto
 *  - Verificare la corretta deduplicazione concorrente per email e telefono normalizzato
 *  - Verificare la robustezza con nomi contenenti caratteri speciali, spazi ed email maiuscole
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  mockR2,
  loadModule,
  backupLocalDatabases,
  restoreLocalDatabases,
} from "./test-helper.mjs";

const { registerOrFindOpenDayLeadCloud, getOpenDayCloudState } = loadModule(
  "src/lib/openDayCloudSync.ts"
);
const { normalizePhoneNumber } = loadModule("src/lib/phoneHelper.ts");

describe("Test 1: Concorrenza R2 & Deduplicazione Atomica (Criterio 1)", () => {
  beforeEach(() => {
    backupLocalDatabases();
    mockR2.reset();
    // Simula una latenza di rete realistica (5ms) per stressare le race conditions
    mockR2.setLatency(5);
  });

  afterEach(() => {
    restoreLocalDatabases();
    mockR2.reset();
  });

  test("Invocazione concorrente di 20 lead simultanei: 100% registrati senza lost updates o corruzione JSON", async () => {
    // 1. Rileva baseline count e genera 20 coppie distinte con formati realistici, email uniche e telefoni validi
    const baseline = await getOpenDayCloudState();
    const initialCount = baseline.leads.length;

    const concurrentLeads = Array.from({ length: 20 }, (_, i) => {
      const idx = String(i + 1).padStart(2, "0");
      return {
        nomiSposi: `Coppia Test ${idx} & Partner ${idx}`,
        email: `coppia${idx}@openday-tda2026.it`,
        telefono: `33310000${idx}`,
        dataSognata: `2027-06-${idx}`,
        periodoSognato: `Giugno 2027`,
      };
    });

    // 2. Lancia le 20 registrazioni simultaneamente con Promise.all
    const startTime = Date.now();
    const results = await Promise.all(
      concurrentLeads.map((lead) => registerOrFindOpenDayLeadCloud(lead))
    );
    const duration = Date.now() - startTime;

    // 3. Verifica che tutte e 20 le chiamate si siano risolte con successo
    assert.strictEqual(
      results.length,
      20,
      "Tutte e 20 le richieste concorrenti devono completarsi"
    );

    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      assert.strictEqual(
        res.success,
        true,
        `Richiesta concorrente #${i + 1} deve ritornare success: true. Errore: ${res.error}`
      );
      assert.ok(
        res.client,
        `Richiesta #${i + 1} deve restituire l'oggetto client`
      );
      assert.ok(
        res.client.id.startsWith("client-od-"),
        `ID del client #${i + 1} deve iniziare con client-od- (ricevuto: ${res.client.id})`
      );
      assert.strictEqual(
        res.isNew,
        true,
        `Il lead #${i + 1} è un nuovo contatto e deve avere isNew: true`
      );
    }

    // 4. Verifica lo stato salvato su R2 (openday/cloud_state.json)
    const rawR2Content = mockR2.getRaw(
      process.env.R2_BUCKET_NAME || "la-terra-degli-aranci",
      "openday/cloud_state.json"
    );

    assert.ok(rawR2Content, "Il file openday/cloud_state.json deve esistere su R2");

    let parsedState;
    assert.doesNotThrow(() => {
      parsedState = JSON.parse(rawR2Content);
    }, "Il JSON salvato su R2 deve essere valido e non corrotto");

    assert.ok(
      Array.isArray(parsedState.leads),
      "Lo stato su R2 deve contenere un array leads"
    );

    // 5. Verifica che NESSUN lead sia andato perso (zero lost updates)
    assert.strictEqual(
      parsedState.leads.length,
      initialCount + 20,
      `Tutti e 20 i lead devono essere presenti su R2 (attesi: ${initialCount + 20}, trovati: ${parsedState.leads.length})`
    );

    // Verifica che ogni singola email delle 20 richieste sia presente nello stato finale
    const savedEmails = new Set(
      parsedState.leads.map((l) => l.email.toLowerCase().trim())
    );
    for (const lead of concurrentLeads) {
      assert.ok(
        savedEmails.has(lead.email.toLowerCase().trim()),
        `L'email ${lead.email} deve essere stata persistita nello stato finale`
      );
    }

    // Verifica che i telefoni delle 20 richieste siano stati normalizzati E.164
    for (const lead of concurrentLeads) {
      const saved = parsedState.leads.find((l) => l.email === lead.email);
      assert.ok(saved, `Il lead con email ${lead.email} deve essere presente nello stato finale`);
      assert.ok(
        saved.telefono.startsWith("+39"),
        `Il telefono ${saved.telefono} deve essere normalizzato con prefisso internazionale (+39)`
      );
    }

    // 6. Verifica cache & getOpenDayCloudState()
    const cloudState = await getOpenDayCloudState();
    assert.strictEqual(
      cloudState.leads.length,
      initialCount + 20,
      `getOpenDayCloudState() deve restituire esattamente ${initialCount + 20} lead`
    );
  });

  test("Deduplicazione concorrente: 5 richieste parallele con 3 duplicati aggiornano lo stato senza duplicare i record", async () => {
    const baseState = await getOpenDayCloudState();
    const baseCount = baseState.leads.length;

    const uid = Date.now();
    const emailA = `marco.sofia.${uid}@dedup-test.it`;
    const phoneA = `333${String(uid).slice(-7)}`;
    const emailB = `luca.martina.${uid}@dedup-test.it`;
    const phoneB = `340${String(uid).slice(-7)}`;

    // 1. Registra prima 2 lead base
    const r1 = await registerOrFindOpenDayLeadCloud({
      nomiSposi: "Marco & Sofia",
      email: emailA,
      telefono: phoneA,
      dataSognata: "2027-05-10",
    });
    assert.strictEqual(r1.isNew, true);

    const r2 = await registerOrFindOpenDayLeadCloud({
      nomiSposi: "Luca & Martina",
      email: emailB,
      telefono: phoneB,
      dataSognata: "2027-09-18",
    });
    assert.strictEqual(r2.isNew, true);

    // 2. Lancia 5 richieste concorrenti:
    // - 2 sono duplicati di Marco & Sofia (uno con email in MAIUSCOLO, uno con telefono formattato con trattini)
    // - 1 è duplicato di Luca & Martina (con spazi nell'email)
    // - 2 sono coppie nuove
    const batch = [
      // Duplicato 1
      {
        nomiSposi: "Marco & Sofia Rossi",
        email: `  ${emailA.toUpperCase()}  `,
        telefono: `+39 ${phoneA.slice(0, 3)} ${phoneA.slice(3, 6)} ${phoneA.slice(6)}`,
        dataSognata: "2027-05-12", // Data aggiornata
      },
      // Duplicato 2
      {
        nomiSposi: "Marco Rossi & Sofia",
        email: emailA,
        telefono: phoneA,
        periodoSognato: "Maggio 2027",
      },
      // Duplicato 3
      {
        nomiSposi: "Luca & Martina Bianchi",
        email: emailB.toUpperCase(),
        telefono: `0039${phoneB}`,
        dataSognata: "2027-09-20",
      },
      // Nuovo 1
      {
        nomiSposi: "Giovanni & Elena",
        email: `giovanni.elena.${uid}@dedup-test.it`,
        telefono: `338${String(uid).slice(-7)}`,
        dataSognata: "2027-10-05",
      },
      // Nuovo 2
      {
        nomiSposi: "Davide & Francesca",
        email: `davide.francesca.${uid}@dedup-test.it`,
        telefono: `339${String(uid).slice(-7)}`,
        dataSognata: "2027-07-22",
      },
    ];

    const results = await Promise.all(
      batch.map((item) => registerOrFindOpenDayLeadCloud(item))
    );

    // Duplicato 1: isNew false
    assert.strictEqual(results[0].isNew, false, "Duplicato 1 deve avere isNew: false");
    // Duplicato 2: isNew false
    assert.strictEqual(results[1].isNew, false, "Duplicato 2 deve avere isNew: false");
    // Duplicato 3: isNew false
    assert.strictEqual(results[2].isNew, false, "Duplicato 3 deve avere isNew: false");
    // Nuovo 1: isNew true
    assert.strictEqual(results[3].isNew, true, "Nuovo 1 deve avere isNew: true");
    // Nuovo 2: isNew true
    assert.strictEqual(results[4].isNew, true, "Nuovo 2 deve avere isNew: true");

    // Totale lead dopo l'operazione: 2 iniziali + 2 nuovi = 4 lead aggiunti al baseline
    const finalState = await getOpenDayCloudState();
    assert.strictEqual(
      finalState.leads.length,
      baseCount + 4,
      `I lead totali devono aumentare di esattamente 4 (trovati: ${finalState.leads.length}, attesi: ${baseCount + 4})`
    );

    // Verifica che i dati di Marco & Sofia siano stati aggiornati senza duplicare
    const marco = finalState.leads.find(
      (l) => l.email.toLowerCase() === emailA.toLowerCase()
    );
    assert.ok(marco, "Il lead Marco & Sofia deve esistere");
    assert.strictEqual(
      marco.dataSognata,
      "2027-05-12",
      "La data sognata deve essere stata aggiornata"
    );
  });

  test("Adversarial: Nomi con caratteri speciali (apostrofi, ampersand, virgolette, trattini)", async () => {
    const adversarialLeads = [
      {
        nomiSposi: "D'Angelo & O'Connor",
        email: "dangelo.oconnor@special.it",
        telefono: "+39 347 123 4567",
        dataSognata: "2027-04-15",
      },
      {
        nomiSposi: "Maria \"Mia\" & Luigi (Sposi 2027)",
        email: "mia.luigi@quotes.it",
        telefono: "348 987 6543",
        dataSognata: "2027-06-30",
      },
    ];

    const results = await Promise.all(
      adversarialLeads.map((l) => registerOrFindOpenDayLeadCloud(l))
    );

    for (const res of results) {
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.isNew, true);
    }

    const state = await getOpenDayCloudState();
    const dangelo = state.leads.find((l) => l.email === "dangelo.oconnor@special.it");
    assert.ok(dangelo);
    assert.strictEqual(dangelo.nome, "D'Angelo & O'Connor");
  });
});
