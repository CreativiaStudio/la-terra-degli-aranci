const fs = require('fs');

async function testPdf() {
  const payload = {
    tipoContratto: "eventi",
    lingua: "it",
    preventivo: "TEST-002",
    prezzo: "3.500,00",
    datiCliente: {
      nome: "Silvia",
      cognome: "Masucci",
      ragione_sociale: "",
      luogo_di_nascita: "Torino",
      data_di_nascita: "1986-08-18",
      citta_di_residenza: "Napoli",
      residenza: "Napoli",
      indirizzo: "Corso Europa",
      numero_civico: "10",
      cap: "80127",
      nazione: "Italia",
      codice_fiscale: "mscslv86m58l219h",
      partita_iva: "",
      telefono: "3400912048",
      email: "silvia.masucci@libero.it",
      sdi: "",
      pec: "",
      tipo_evento: "Festa Privata",
      giorno_ed_ora_evento: "2026-09-03T19:30",
      comunicazione_terzi: "SI",
      marketing: "NO",
      mezzo_anticipo: "Bonifico",
      data_anticipo: "2024-01-15",
      mezzo_saldo: "Assegno",
      data_saldo: "2024-09-01"
    },
    // base64 dummy image for testing signature
    firma_disegnata: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    firma_disegnata_clausole: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
  };

  try {
    const response = await fetch("http://localhost:3000/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    console.log("RISULTATO:", json);
  } catch (error) {
    console.error("ERRORE:", error);
  }
}

testPdf();
