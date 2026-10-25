/**
 * tests/02_r2_failover.test.mjs
 * 
 * Test 2 - Simulazione Failover R2 Offline (Criterio 2)
 * 
 * Obiettivo:
 *  - Verificare che con R2 offline o credenziali errate (simulazione timeout di rete S3, errore 503, invalid access key):
 *    1. La registrazione avvenga su localDb (store.clients e store.quotes)
 *    2. Venga impostato il cookie di sessione client firmato con durata di 30 giorni (maxAge: 2592000)
 *    3. Venga restituito success: true senza lanciare eccezioni o mostrare errori HTTP 500
 *    4. getOpenDayCloudState() recuperi i dati dal database locale come fallback resiliente
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  mockR2,
  testCookieJar,
  revalidatedPaths,
  loadModule,
  backupLocalDatabases,
  restoreLocalDatabases,
} from "./test-helper.mjs";

const { submitOpenDayEntryAction } = loadModule("src/app/openday/actions.ts");
const { getOpenDayCloudState, registerOrFindOpenDayLeadCloud } = loadModule(
  "src/lib/openDayCloudSync.ts"
);
const { getStore } = loadModule("src/lib/localDb.ts");
const { verifyClientSessionToken } = loadModule("src/lib/magicLinkAuth.ts");

describe("Test 2: Resilienza & Failover R2 Offline su localDb (Criterio 2)", () => {
  beforeEach(() => {
    backupLocalDatabases();
    mockR2.reset();
    testCookieJar.clear();
    revalidatedPaths.length = 0;
  });

  afterEach(() => {
    restoreLocalDatabases();
    mockR2.reset();
    testCookieJar.clear();
  });

  test("Con R2 offline (Network Timeout): submitOpenDayEntryAction salva su localDb, imposta cookie 30gg e ritorna success: true", async () => {
    // 1. Simula Cloudflare R2 completamente offline (timeout di rete)
    mockR2.setFailover(
      true,
      new Error("ETIMEDOUT: Connect to cdc3d1bfef17f23cb453fe2737b2ede8.r2.cloudflarestorage.com:443 failed")
    );

    const leadInput = {
      nomiSposi: "Valerio & Serena",
      email: "valerio.serena@failover-test.it",
      telefono: "3491234567",
      dataSognata: "2027-09-15",
      periodoSognato: "Settembre 2027",
    };

    // 2. Invocazione della Server Action
    let result;
    assert.doesNotThrow(async () => {
      result = await submitOpenDayEntryAction(leadInput);
    }, "La Server Action non deve mai sollevare eccezioni non gestite (HTTP 500)");

    result = await submitOpenDayEntryAction(leadInput);

    // 3. Verifica esito positivo per l'utente (Zero Errori a Schermo)
    assert.strictEqual(
      result.success,
      true,
      `La registrazione deve avere successo anche con R2 offline. Errore: ${result.error}`
    );
    assert.ok(result.clientId, "Deve restituire un clientId valido");
    assert.strictEqual(
      result.clientName,
      "Valerio & Serena",
      "Deve restituire il nome corretto"
    );
    assert.strictEqual(
      result.redirectUrl,
      `/openday/diario?id=${result.clientId}`,
      "Deve restituire il redirectUrl corretto per il diario degli sposi"
    );

    // 4. Verifica persistenza indistruttibile su localDb
    const store = getStore();
    const savedClient = (store.clients || []).find(
      (c) => c.id === result.clientId || c.email === "valerio.serena@failover-test.it"
    );

    assert.ok(
      savedClient,
      "Il cliente deve essere stato registrato nello store di localDb"
    );
    assert.strictEqual(savedClient.nome, "Valerio & Serena");
    assert.strictEqual(savedClient.telefono, "+393491234567");
    assert.ok(
      savedClient.tags && savedClient.tags.includes("Open Day"),
      "Il cliente deve avere il tag Open Day"
    );

    // 5. Verifica impostazione Cookie di sessione a 30 giorni
    const sessionCookie = testCookieJar.get("tda_client_session");
    assert.ok(
      sessionCookie,
      "Il cookie di sessione tda_client_session deve essere stato impostato"
    );

    // Verifica opzioni cookie: maxAge 30 giorni (30 * 24 * 60 * 60 = 2592000s) e httpOnly
    assert.strictEqual(
      sessionCookie.options.maxAge,
      30 * 24 * 60 * 60,
      "Il cookie di sessione deve avere maxAge di esattamente 30 giorni (2592000 secondi)"
    );
    assert.strictEqual(
      sessionCookie.options.httpOnly,
      true,
      "Il cookie deve essere httpOnly per sicurezza"
    );

    // Verifica firma crittografica HMAC del cookie
    const verifiedSession = verifyClientSessionToken(sessionCookie.value);
    assert.ok(
      verifiedSession,
      "Il token di sessione nel cookie deve avere firma HMAC valida"
    );
    assert.strictEqual(
      verifiedSession.email,
      "valerio.serena@failover-test.it"
    );
    assert.strictEqual(verifiedSession.clientId, result.clientId);

    // 6. Verifica fallback trasparente di getOpenDayCloudState()
    const cloudState = await getOpenDayCloudState();
    const fallbackLead = cloudState.leads.find(
      (l) => l.email === "valerio.serena@failover-test.it"
    );
    assert.ok(
      fallbackLead,
      "getOpenDayCloudState() deve recuperare il lead da localDb in modalità fallback"
    );
    assert.strictEqual(fallbackLead.nome, "Valerio & Serena");
  });

  test("Con credenziali R2 non valide (InvalidAccessKeyId): registerOrFindOpenDayLeadCloud preserva i dati su localDb", async () => {
    // Simula credenziali rifiutate da Cloudflare R2
    const s3AuthError = new Error("The AWS Access Key Id you provided does not exist in our records.");
    s3AuthError.name = "InvalidAccessKeyId";
    mockR2.setFailover(true, s3AuthError);

    const result = await registerOrFindOpenDayLeadCloud({
      nomiSposi: "Claudio & Simona",
      email: "claudio.simona@invalid-creds.it",
      telefono: "0818765432",
      dataSognata: "2027-05-18",
    });

    assert.strictEqual(
      result.success,
      true,
      "L'operazione non deve fallire con credenziali R2 corrotte"
    );
    assert.ok(result.client, "Il client deve essere restituito");

    const store = getStore();
    const local = (store.clients || []).find(
      (c) => c.email === "claudio.simona@invalid-creds.it"
    );
    assert.ok(local, "Il cliente deve essere presente nel database locale");
  });
});
