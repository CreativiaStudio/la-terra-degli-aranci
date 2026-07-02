const fs = require('fs');
const React = require('react');
const { renderToFile } = require('@react-pdf/renderer');
const path = require('path');

// We need to compile the TSX file first to use it in node.
require('@babel/register')({
  presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'classic' }], '@babel/preset-typescript'],
  extensions: ['.js', '.jsx', '.ts', '.tsx']
});

const { ContractPdfTemplate } = require('./src/lib/pdf/ContractPdfTemplate.tsx');

const getBase64Image = (filePath) => {
  try {
    const bitmap = fs.readFileSync(filePath);
    const base64 = Buffer.from(bitmap).toString("base64");
    const ext = path.extname(filePath).substring(1);
    return `data:image/${ext};base64,${base64}`;
  } catch (err) {
    return null;
  }
};

async function generate() {
  try {
    const logoSimboloPath = getBase64Image(path.join(process.cwd(), "public", "tda-simbolo.png"));
    const logoRightPath = getBase64Image(path.join(process.cwd(), "public", "logo-testo.png"));
    const firmaRobertoPath = getBase64Image(path.join(process.cwd(), "public", "firma-roberto.png"));
    const firmaRosariaPath = getBase64Image(path.join(process.cwd(), "public", "firma-rosaria.png"));

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
        giorno_ed_ora_evento: "2026-09-03T19:30"
      },
      firma_disegnata: null,
      firma_disegnata_clausole: null
    };

    const element = React.createElement(ContractPdfTemplate, {
      tipoContratto: payload.tipoContratto,
      lang: payload.lingua,
      data: payload.datiCliente,
      preventivo: payload.preventivo,
      prezzo: payload.prezzo,
      firmaContratto: payload.firma_disegnata,
      firmaClausole: payload.firma_disegnata_clausole,
      logoPath: logoSimboloPath,
      logoRightPath: logoRightPath,
      firmaRobertoPath: firmaRobertoPath,
      firmaRosariaPath: firmaRosariaPath
    });

    await renderToFile(element, "test-output.pdf");
    console.log("SUCCESS");
  } catch(e) {
    console.error(e);
  }
}
generate();
