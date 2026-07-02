// Utilizzo fetch nativo in Node 25

async function testPdf() {
  const payload = {
    tipoContratto: "eventi",
    lingua: "it",
    preventivo: "TEST-001",
    prezzo: "1500,00",
    datiCliente: {
      nome: "Mario",
      cognome: "Rossi",
      luogo_di_nascita: "Napoli",
      data_di_nascita: "01/01/1980",
      citta_di_residenza: "Roma",
      nazione: "Italia",
      indirizzo: "Via Roma",
      numero_civico: "1",
      email: "mario@rossi.it",
      telefono: "1234567890",
      codice_fiscale: "RSSMRA80A01H501A",
      data_evento: "20/10/2026",
      tipo_evento: "Comunione"
    },
    // base64 dummy trasparente per test
    firma_disegnata: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    firma_disegnata_clausole: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
  };

  try {
    console.log("Invio test a /api/generate-pdf...");
    const res = await fetch("http://localhost:3000/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log("Risultato:", data);
  } catch (e) {
    console.error("Errore:", e);
  }
}

testPdf();
