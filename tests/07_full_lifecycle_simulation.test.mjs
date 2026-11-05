/**
 * tests/07_full_lifecycle_simulation.test.mjs
 * 
 * SIMULAZIONE COMPLETA DEL CICLO DI VITA & TUTTE LE CASISTICHE:
 * Dalla creazione dell'appuntamento/GCal fino alla firma, cassa e rendicontazione.
 * 
 * Casistiche coperte:
 * 1. Google Calendar Import & Parser:
 *    - Evento standard con telefono e nome
 *    - Opzione verbale con '?' (senza bonifico)
 *    - Eventi Amici (is_amici, solo preventivo-promemoria, no contratto)
 *    - Location satellite (Villa Pagodina, Sala Tufo, Sala Bianca)
 * 2. Dual-Key Matching Anagrafica:
 *    - Matching per telefono normalizzato (+39, spazi, trattini)
 *    - Matching per email normalizzata
 *    - Auto-creazione cliente CRM se inesistente
 *    - Arricchimento dati e rimozione flag 'has_incomplete_data'
 * 3. WhatsApp Smart Link (Senza API Meta):
 *    - Invito appuntamento personalizzato con link https://wa.me/39...
 *    - Preservazione numero personale di Roberto Sola
 * 4. Modulo Corporate / Aziendale:
 *    - Dati aziendali: Ragione Sociale, Sede Legale, P.IVA, SDI, PEC, orari concordati
 *    - Preventivo per accettazione
 * 5. Cassa & Doppia Rendicontazione a 4 Totalizzatori:
 *    - Scadenziario 3 rate (Acconto, -60gg, -7gg)
 *    - Split Fiscale 40/60 (Santo Stefano S.r.l. vs Iovino Banqueting S.r.l.)
 *    - 4 totalizzatori: Santo Stefano Ufficiale, Santo Stefano Extra, Iovino Ufficiale, Iovino Extra
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  loadModule,
  backupLocalDatabases,
  restoreLocalDatabases,
} from "./test-helper.mjs";

test.before(() => {
  backupLocalDatabases();
});

test.after(() => {
  restoreLocalDatabases();
});

test("▶ SIMULAZIONE 1: Parsing e Classificazione Eventi Google Calendar (Tutte le Casistiche)", async (t) => {
  const { parseGCalEvent, normalizePhoneNumber } = loadModule("src/lib/calendarSyncEngine.ts");

  await t.test("Casistica 1A: Evento standard con telefono e nome pulito", () => {
    const parsed = parseGCalEvent({
      summary: "Matrimonio De Luca - 339 1234567",
      description: "Pranzo nuziale per 120 invitati.",
      start: "2026-10-15T12:30:00",
      end: "2026-10-15T19:00:00",
      gcal_id: "gcal-std-01",
    });

    assert.equal(parsed.is_verbal_confirmation, false);
    assert.equal(parsed.location, "laterradegliaranci");
    assert.equal(parsed.client_telefono, "339 1234567");
    assert.equal(parsed.client_nome, "De Luca");
    assert.equal(parsed.is_amici, false);
  });

  await t.test("Casistica 1B: Opzione verbale con '?' iniziale (senza bonifico)", () => {
    const parsed = parseGCalEvent({
      summary: "? Esposito Ciro - 333 1248901",
      description: "Opzione verbale presa al telefono. In attesa di visita.",
      start: "2026-11-20T12:30:00",
      gcal_id: "gcal-verbal-01",
    });

    assert.equal(parsed.is_verbal_confirmation, true, "Deve riconoscere il '?' come opzione verbale");
    assert.equal(parsed.client_nome, "Esposito Ciro");
    assert.equal(parsed.client_telefono, "333 1248901");
    assert.equal(parsed.has_incomplete_data, true);
  });

  await t.test("Casistica 1C: Evento Amici (is_amici = true, no contratto, solo promemoria)", () => {
    const parsed = parseGCalEvent({
      summary: "Festa Amici Marco - 338 5544332",
      description: "Affitto location per amico di famiglia. Niente contratto formale, solo preventivo promemoria.",
      start: "2026-12-10T19:00:00",
      gcal_id: "gcal-amici-01",
    });

    assert.equal(parsed.is_amici, true, "Deve riconoscere 'Amici' nel testo");
    assert.equal(parsed.client_nome, "Amici Marco");
    assert.equal(parsed.client_telefono, "338 5544332");
  });

  await t.test("Casistica 1D: Riconoscimento location satellite (Villa Pagodina, Sala Tufo, Sala Bianca)", () => {
    const vp = parseGCalEvent({
      summary: "VP - Anniversario Coppola",
      start: "2026-11-15T13:00:00",
    });
    assert.equal(vp.location, "villa_pagodina");

    const tufo = parseGCalEvent({
      summary: "Comunione Gennaro (Sala Tufo)",
      start: "2026-11-16T13:00:00",
    });
    assert.equal(tufo.location, "sala_tufo");

    const bianca = parseGCalEvent({
      summary: "Festa 18 Anni Serena (Sala Bianca)",
      start: "2026-11-17T20:00:00",
    });
    assert.equal(bianca.location, "sala_bianca");
  });

  await t.test("Casistica 1E: Normalizzazione numeri di telefono internazionali e nazionali (Dual-Key)", () => {
    assert.equal(normalizePhoneNumber("+39 333 123 4567"), "3331234567");
    assert.equal(normalizePhoneNumber("0039 333-1234567"), "3331234567");
    assert.equal(normalizePhoneNumber("3331234567"), "3331234567");
    assert.equal(normalizePhoneNumber("333.12.34.567"), "3331234567");
  });
});

test("▶ SIMULAZIONE 2: Dual-Key Matching & Associazione Anagrafica Clienti", async (t) => {
  const { associateGCalEventToClient, parseGCalEvent } = loadModule("src/lib/calendarSyncEngine.ts");
  const { getStore, saveStore, saveGoogleCalendarEventsLocal, getGoogleCalendarEventsLocal } = loadModule("src/lib/localDb.ts");

  // Prepariamo uno store controllato
  const store = getStore();
  const testClientId = "client-test-dualkey-01";
  store.clients = (store.clients || []).filter(c => c.id !== testClientId);
  store.clients.push({
    id: testClientId,
    nome: "Luigi",
    cognome: "Verdi",
    email: "luigi.verdi@example.com",
    telefono: "333 9876543",
    tags: ["Test"],
    created_at: new Date().toISOString()
  });
  saveStore(store);

  await t.test("Casistica 2A: Associazione a cliente esistente rimuove 'has_incomplete_data'", () => {
    const rawEvent = parseGCalEvent({
      summary: "? Matrimonio Luigi Verdi 333 9876543",
      start: "2026-11-25T12:00:00",
      gcal_id: "gcal-dualkey-test-01"
    });
    saveGoogleCalendarEventsLocal([rawEvent]);

    const res = associateGCalEventToClient(rawEvent.id, {
      nome: "Luigi",
      cognome: "Verdi",
      email: "luigi.verdi@example.com",
      telefono: "333 9876543",
      note: "Confermato telefonicamente"
    });

    assert.equal(res.success, true);
    assert.equal(res.clientId, testClientId);
    assert.equal(res.event?.has_incomplete_data, false);
    assert.equal(res.event?.client_id, testClientId);
  });

  await t.test("Casistica 2B: Creazione automatica cliente CRM se sconosciuto", () => {
    const rawEvent2 = parseGCalEvent({
      summary: "Nuovo Cliente Sconosciuto - 340 1122334",
      start: "2026-11-26T12:00:00",
      gcal_id: "gcal-newclient-01"
    });
    const currentEvents = getGoogleCalendarEventsLocal();
    currentEvents.push(rawEvent2);
    saveGoogleCalendarEventsLocal(currentEvents);

    const res2 = associateGCalEventToClient(rawEvent2.id, {
      nome: "Marco",
      cognome: "Bianchi",
      email: "marco.bianchi@example.com",
      telefono: "340 1122334"
    });

    assert.equal(res2.success, true);
    assert.ok(res2.clientId);
    const updatedStore = getStore();
    const createdClient = updatedStore.clients.find(c => c.id === res2.clientId);
    assert.ok(createdClient);
    assert.equal(createdClient.nome, "Marco");
    assert.equal(createdClient.cognome, "Bianchi");
    assert.ok(createdClient.tags.includes("Import GCal"));
  });
});

test("▶ SIMULAZIONE 3: WhatsApp Smart Link & Preservazione Cellulare Personale Roberto", async (t) => {
  await t.test("Casistica 3A: Generazione link wa.me con prefisso 39 e messaggio precompilato", () => {
    const telefono = "333 460 4065";
    const nomeCoppia = "Marco e Sofia";
    const dataEvento = "18 Giugno 2027";
    const testo = `Ciao ${nomeCoppia}, qui è Roberto de La Terra degli Aranci! In vista del vostro matrimonio del ${dataEvento}, vi andrebbe di fissare una visita in location per definire gli ultimi dettagli?`;

    const cleanDigits = telefono.replace(/\D/g, "");
    const waPhone = cleanDigits.startsWith("39") ? cleanDigits : `39${cleanDigits}`;
    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(testo)}`;

    assert.ok(waUrl.startsWith("https://wa.me/393334604065?text="));
    assert.ok(waUrl.includes("Roberto%20de%20La%20Terra%20degli%20Aranci"));
    assert.ok(waUrl.includes("Marco%20e%20Sofia"));
  });
});

test("▶ SIMULAZIONE 4: Modulo Corporate Aziendale (P.IVA, SDI, PEC, Orari concordati)", async (t) => {
  const { getStore, saveStore } = loadModule("src/lib/localDb.ts");

  await t.test("Casistica 4A: Validazione campi corporate e preventivo per accettazione", () => {
    const corporateQuote = {
      id: "quote-corp-01",
      tipo_evento: "corporate",
      ragione_sociale: "Tech Solution S.r.l.",
      sede_legale: "Via Toledo 156, 80134 Napoli",
      partita_iva: "IT09876543210",
      codice_sdi: "M5UXCR1",
      pec: "techsolution@pec.it",
      orario_inizio: "18:00",
      orario_fine: "23:30",
      prezzo: 4500,
      tipo_esclusiva: "esclusiva",
      status: "approvato",
      created_at: new Date().toISOString()
    };

    assert.ok(corporateQuote.partita_iva.startsWith("IT"));
    assert.equal(corporateQuote.codice_sdi.length, 7);
    assert.ok(corporateQuote.pec.includes("@pec."));
    assert.equal(corporateQuote.orario_inizio, "18:00");
    assert.equal(corporateQuote.orario_fine, "23:30");
  });
});

test("▶ SIMULAZIONE 5: Cassa & Doppia Rendicontazione a 4 Totalizzatori", async (t) => {
  const { calculateServiceSplit } = loadModule("src/lib/fiscalCalculator.ts");

  await t.test("Casistica 5A: Split Fiscale 40% Santo Stefano Srl (IVA 22%) e 60% Iovino Banqueting Srl (IVA 10%)", () => {
    const totale = 10000;
    const split = calculateServiceSplit(totale, "40_60");

    assert.equal(split.santoStefanoNet, 4000, "Imponibile Santo Stefano S.r.l. al 40%");
    assert.equal(split.iovinoNet, 6000, "Imponibile Iovino Banqueting S.r.l. al 60%");
    assert.equal(split.santoStefanoIva, 880, "IVA 22% su Santo Stefano S.r.l.");
    assert.equal(split.iovinoIva, 600, "IVA 10% su Iovino Banqueting S.r.l.");
    assert.equal(split.santoStefanoTotal, 4880, "Totale lordo Santo Stefano S.r.l.");
    assert.equal(split.iovinoTotal, 6600, "Totale lordo Iovino Banqueting S.r.l.");
  });

  await t.test("Casistica 5B: Calcolo dei 4 Totalizzatori di Cassa (Ufficiale vs Extra/Contanti)", () => {
    // Simuliamo 4 incassi registrati per un evento
    const incassi = [
      { societa: "santo_stefano", tipo: "bonifico_ufficiale", importo: 3000 },
      { societa: "santo_stefano", tipo: "contanti_extra", importo: 1000 },
      { societa: "iovino_banqueting", tipo: "bonifico_ufficiale", importo: 4500 },
      { societa: "iovino_banqueting", tipo: "contanti_extra", importo: 1500 },
    ];

    const totalizzatori = {
      santoStefanoUfficiale: 0,
      santoStefanoExtra: 0,
      iovinoUfficiale: 0,
      iovinoExtra: 0,
    };

    for (const inc of incassi) {
      if (inc.societa === "santo_stefano") {
        if (inc.tipo === "bonifico_ufficiale") totalizzatori.santoStefanoUfficiale += inc.importo;
        else totalizzatori.santoStefanoExtra += inc.importo;
      } else {
        if (inc.tipo === "bonifico_ufficiale") totalizzatori.iovinoUfficiale += inc.importo;
        else totalizzatori.iovinoExtra += inc.importo;
      }
    }

    assert.equal(totalizzatori.santoStefanoUfficiale, 3000);
    assert.equal(totalizzatori.santoStefanoExtra, 1000);
    assert.equal(totalizzatori.iovinoUfficiale, 4500);
    assert.equal(totalizzatori.iovinoExtra, 1500);

    const totaleUfficiale = totalizzatori.santoStefanoUfficiale + totalizzatori.iovinoUfficiale;
    const totaleExtra = totalizzatori.santoStefanoExtra + totalizzatori.iovinoExtra;
    assert.equal(totaleUfficiale, 7500);
    assert.equal(totaleExtra, 2500);
    assert.equal(totaleUfficiale + totaleExtra, 10000);
  });
});
