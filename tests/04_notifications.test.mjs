/**
 * tests/04_notifications.test.mjs
 * 
 * Test 4 - Centro Notifiche Direzionali Roberto Sola (Criterio 4)
 * 
 * Obiettivo:
 *  - Verificare che getAdminNotificationsAction():
 *    1. Restituisca notifiche tipo "openday" (priorità alta, badge arancione #ea580c, link /admin/openday)
 *       per i lead registrati o aggiornati negli ultimi 7 giorni
 *    2. Restituisca notifiche tipo "diary" (badge viola #6d28d9, link diretto al diario)
 *       per i diari con risposte o progresso negli ultimi 7 giorni
 *    3. Escluda rigorosamente eventi più vecchi di 7 giorni (finestra temporale DIARY_RECENT_DAYS)
 *    4. Ordini le notifiche in modo strettamente decrescente cronologico (dalla più recente alla più vecchia)
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  mockR2,
  loadModule,
  backupLocalDatabases,
  restoreLocalDatabases,
} from "./test-helper.mjs";

const { getAdminNotificationsAction } = loadModule(
  "src/app/admin/notificationsAction.ts"
);
const { registerOrFindOpenDayLeadCloud, saveWeddingDiaryCloud } = loadModule(
  "src/lib/openDayCloudSync.ts"
);
const { getStore, saveStore } = loadModule("src/lib/localDb.ts");

describe("Test 4: Notifiche Direzionali Roberto Sola (Criterio 4)", () => {
  beforeEach(() => {
    backupLocalDatabases();
    mockR2.reset();
  });

  afterEach(() => {
    restoreLocalDatabases();
    mockR2.reset();
  });

  test("Generazione notifiche Open Day (arancione, priorità alta) e Wedding Diary (viola)", async () => {
    // 1. Registra un nuovo lead Open Day recente (oggi)
    const lead = await registerOrFindOpenDayLeadCloud({
      nomiSposi: "Lorenzo & Camilla",
      email: "lorenzo.camilla@test-notif.it",
      telefono: "3331122998",
      dataSognata: "2027-06-12",
      periodoSognato: "Giugno 2027",
    });

    // 2. Compila risposte al Wedding Diary per questo lead (utilizzando campi ufficiali del form)
    await saveWeddingDiaryCloud(lead.client.id, {
      la_nostra_data_perfetta: "2027-06-12",
      inizio_evento: "Pranzo",
      rito_simbolico: "All'aperto nell'agrumeto",
    });

    // 3. Esegui la Server Action per il recupero delle notifiche direzionali
    const notifications = await getAdminNotificationsAction();

    assert.ok(
      Array.isArray(notifications),
      "getAdminNotificationsAction deve restituire un array"
    );

    // 4. Verifica Notifica Open Day
    const opendayNotif = notifications.find(
      (n) => n.tipo === "openday" && (n.id === `openday:${lead.client.id}` || n.id.includes(lead.client.id))
    );

    assert.ok(
      opendayNotif,
      `Deve esistere una notifica openday per il cliente ${lead.client.id}`
    );
    assert.strictEqual(opendayNotif.priorita, "alta", "La priorità deve essere alta");
    assert.strictEqual(opendayNotif.badgeLabel, "Open Day");
    assert.strictEqual(opendayNotif.badgeColor, "#ea580c", "Colore badge arancione");
    assert.strictEqual(opendayNotif.badgeBg, "#ffedd5");
    assert.strictEqual(opendayNotif.link, "/admin/openday");
    assert.ok(
      opendayNotif.messaggio.includes("Lorenzo & Camilla"),
      "Il messaggio deve contenere i nomi degli sposi"
    );
    assert.ok(
      opendayNotif.messaggio.includes("2027-06-12"),
      "Il messaggio deve riportare la data sognata espressa"
    );

    // 5. Verifica Notifica Wedding Diary
    const diaryNotif = notifications.find(
      (n) => n.tipo === "diary" && (n.id === `diary:${lead.client.id}` || n.id.includes(lead.client.id) || n.link.includes(lead.client.id))
    );

    assert.ok(
      diaryNotif,
      `Deve esistere una notifica diary per il cliente ${lead.client.id}`
    );
    assert.strictEqual(diaryNotif.badgeLabel, "Diary");
    assert.strictEqual(diaryNotif.badgeColor, "#6d28d9", "Colore badge viola");
    assert.strictEqual(diaryNotif.badgeBg, "#ede9fe");
    assert.ok(
      diaryNotif.link.includes(`/openday/diario?id=${lead.client.id}`) ||
        diaryNotif.link.includes("/admin/eventi/"),
      `Il link deve condurre alla vista del diario senza generare 404 (ricevuto: ${diaryNotif.link})`
    );
    assert.ok(
      diaryNotif.messaggio.includes("Lorenzo & Camilla") ||
        diaryNotif.messaggio.includes("Lorenzo"),
      "Il messaggio del diario deve risolvere correttamente il nome della coppia"
    );
  });

  test("Finestra temporale: esclude eventi registrati oltre 7 giorni fa", async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const oldClientId = "client-od-old-test";

    // Inietta un lead vecchio nello store locale
    const store = getStore();
    if (!store.clients) store.clients = [];
    store.clients.push({
      id: oldClientId,
      nome: "Coppia Scaduta & Partner",
      email: "old.couple@test.it",
      telefono: "+393339999999",
      created_at: eightDaysAgo,
      updated_at: eightDaysAgo,
      tags: ["Open Day", "Wedding Diary"],
    });
    saveStore(store);

    const notifications = await getAdminNotificationsAction();

    const oldNotif = notifications.find((n) => n.id === `openday:${oldClientId}`);
    assert.strictEqual(
      oldNotif,
      undefined,
      "Le notifiche per lead registrati più di 7 giorni fa devono essere escluse"
    );
  });

  test("Ordinamento cronologico decrescente di tutte le notifiche restituite", async () => {
    const notifications = await getAdminNotificationsAction();

    for (let i = 1; i < notifications.length; i++) {
      const prevTime = new Date(notifications[i - 1].data).getTime();
      const currTime = new Date(notifications[i].data).getTime();
      if (Number.isFinite(prevTime) && Number.isFinite(currTime)) {
        assert.ok(
          prevTime >= currTime,
          `Notifiche non ordinate cronologicamente: #${i - 1} (${notifications[i - 1].data}) vs #${i} (${notifications[i].data})`
        );
      }
    }
  });

  test("Anti-Spam Campanella: 15 modifiche consecutive al Wedding Diary generano UNA SOLA card aggregata con link HMAC share", async () => {
    const lead = await registerOrFindOpenDayLeadCloud({
      nomiSposi: "Matteo & Giulia",
      email: `matteo.giulia.${Date.now()}@antispam-test.it`,
      telefono: "3476655443",
      dataSognata: "2027-07-10",
    });

    const clientId = lead.client.id;

    // Simula 15 salvataggi progressivi ravvicinati dalla coppia (sposa + sposo)
    const progressiveFields = [
      { sposo_nome: "Matteo" },
      { sposa_nome: "Giulia" },
      { la_nostra_data_perfetta: "2027-07-10" },
      { inizio_evento: "Sera" },
      { rito_simbolico: "Sì, nell'agrumeto" },
      { numero_invitati_stimato: "140" },
      { stile_matrimonio: "Mediterraneo Chic" },
      { spazi_preferiti: ["Agrumeto"] },
      { spazi_preferiti: ["Agrumeto", "Piscina"] },
      { musica_preferita: "Live Band & Sax" },
      { allergie_intolleranze: "2 celiaci, 3 vegetariani" },
      { taglio_torta: "Sotto gli alberi di arancio" },
      { open_bar: "Signature Cocktail Agrumi" },
      { note_speciali_sposi: "Vorremmo luci calde tra gli alberi" },
      { note_speciali_sposi: "Vorremmo luci calde tra gli alberi e tavolo imperiale" },
    ];

    let lastCompletion = 0;
    for (const patch of progressiveFields) {
      const res = await saveWeddingDiaryCloud(clientId, patch);
      assert.strictEqual(res.success, true);
      lastCompletion = res.diary.completion_rate;
    }

    const notifications = await getAdminNotificationsAction();
    const coupleDiaryNotifs = notifications.filter(
      (n) => n.tipo === "diary" && n.id === `diary:${clientId}`
    );

    assert.strictEqual(
      coupleDiaryNotifs.length,
      1,
      `15 salvataggi del Wedding Diary devono produrre ESATTAMENTE 1 card in campanella (trovate: ${coupleDiaryNotifs.length})`
    );

    const card = coupleDiaryNotifs[0];
    assert.ok(
      card.messaggio.includes(`${lastCompletion}%`),
      `La singola card deve mostrare l'ultima percentuale di avanzamento (${lastCompletion}%), trovato: ${card.messaggio}`
    );
    assert.ok(
      card.link.includes(`/openday/diario?id=${clientId}`) && card.link.includes("&share="),
      `Il link della campanella deve includere il token HMAC &share= per accesso 1-click di Roberto (ricevuto: ${card.link})`
    );
  });
});
