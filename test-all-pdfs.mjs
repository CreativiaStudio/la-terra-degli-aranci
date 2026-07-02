import fs from "fs";

async function testPdf(name, payload) {
  try {
    console.log(`\n============================`);
    console.log(`Invio test: ${name}`);
    const res = await fetch("http://localhost:3000/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
        const data = await res.json();
        console.log(`✅ [${name}] OK:`, data.url);
    } else {
        const text = await res.text();
        console.error(`❌ [${name}] ERRORE ${res.status}:`, text);
    }
  } catch (e) {
    console.error(`❌ [${name}] ECCEZIONE:`, e);
  }
}

const basePayload = {
    preventivo: "TEST-001",
    prezzo: "1500,00",
    datiCliente: {
      nome: "Mario",
      cognome: "Rossi",
      luogo_di_nascita: "Napoli",
      data_di_nascita: "1980-01-01",
      residenza: "Roma",
      nazione: "Italia",
      indirizzo: "Via Roma",
      numero_civico: "1",
      cap: "00100",
      email: "mario@rossi.it",
      telefono: "1234567890",
      codice_fiscale: "RSSMRA80A01H501A",
      data_evento: "2026-10-20",
      accetto: true,
      comunicazione_terzi: "SI",
      marketing: "SI"
    },
    firma_disegnata: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    firma_disegnata_clausole: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
};

async function runTests() {
    // 1. Wedding Italiano
    await testPdf("Wedding (Italiano)", {
        ...basePayload,
        tipoContratto: "wedding",
        lingua: "it",
        datiCliente: {
            ...basePayload.datiCliente,
            sposera_nome: "Luigi",
            sposera_cognome: "Verdi"
        }
    });

    // 2. Wedding Inglese
    await testPdf("Wedding (Inglese)", {
        ...basePayload,
        tipoContratto: "wedding",
        lingua: "en",
        datiCliente: {
            ...basePayload.datiCliente,
            sposera_nome: "Luigi",
            sposera_cognome: "Verdi"
        }
    });

    // 3. Eventi Italiano
    await testPdf("Eventi (Italiano)", {
        ...basePayload,
        tipoContratto: "eventi",
        lingua: "it",
        datiCliente: {
            ...basePayload.datiCliente,
            tipo_evento: "Battesimo",
            giorno_ed_ora_evento: "2026-10-20T12:30"
        }
    });

    // 4. Eventi Inglese
    await testPdf("Eventi (Inglese)", {
        ...basePayload,
        tipoContratto: "eventi",
        lingua: "en",
        datiCliente: {
            ...basePayload.datiCliente,
            tipo_evento: "Birthday Party",
            giorno_ed_ora_evento: "2026-10-20T12:30"
        }
    });
}

runTests();
