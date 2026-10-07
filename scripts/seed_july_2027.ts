import fs from "fs";
import path from "path";
import crypto from "crypto";

interface LocalStore {
  clients: any[];
  quotes: any[];
  wedding_diaries?: any[];
  signed_contracts?: any[];
  quote_changes?: any[];
  project_builder_sessions?: any[];
  services_catalog?: any[];
  ticket_orders?: any[];
  blog_posts?: any[];
  payments?: any[];
  final_contracts?: any[];
}

const dataFile = path.join(process.cwd(), "data_store.json");
if (!fs.existsSync(dataFile)) {
  console.error("data_store.json non trovato!");
  process.exit(1);
}

const store: LocalStore = JSON.parse(fs.readFileSync(dataFile, "utf8"));

// Dati anagrafici realistici per i client demo (evita 'Cliente TDA')
const staticDemoClients = [
  {
    id: "client-demo1",
    nome: "Valerio",
    cognome: "De Simone",
    sposera_nome: "Laura",
    sposera_cognome: "Conti",
    email: "valerio.desimone@gmail.com",
    telefono: "+39 347 1122334",
    codice_fiscale: "DSMVLR90A01F839K",
    provenienza: "Napoli (Posillipo)",
    created_at: "2026-07-23T07:06:08.106Z",
  },
  {
    id: "client-demo3",
    nome: "Studio Notarile Avv. Vincenzo",
    cognome: "Ferrara",
    email: "studio.ferrara@notariato.it",
    telefono: "+39 081 7654321",
    codice_fiscale: "FRRVNC75B12F839Z",
    provenienza: "Napoli Centro",
    tipo_cliente: "azienda",
    ragione_sociale: "Studio Notarile Avv. Vincenzo Ferrara",
    created_at: "2026-07-23T07:06:08.106Z",
  },
  {
    id: "client-demo4",
    nome: "Dott. Gianluigi",
    cognome: "Coppola",
    sposera_nome: "Marika",
    sposera_cognome: "Russo",
    email: "gianluigi.coppola@sanita.it",
    telefono: "+39 335 8899001",
    codice_fiscale: "CPPGNL88C15F839T",
    provenienza: "Napoli (Vomero)",
    note: "Cliente storico VIP Club TDA con 2 eventi firmati (2023 e 2025).",
    created_at: "2022-10-10T00:00:00.000Z",
  },
  {
    id: "0a462b53-e984-4902-9562-e9d0dd776af8",
    nome: "Mario",
    cognome: "Pepe",
    sposera_nome: "Elena",
    sposera_cognome: "Dumea",
    email: "mariopepe9@hotmail.it",
    telefono: "366353837",
    codice_fiscale: "PPEMRA89T15F839X",
    provenienza: "Admin Rapido",
    created_at: "2026-10-02T12:24:12.776Z",
  }
];

// Preserva quotes demo con anagrafiche complete
const preservedQuotes = (store.quotes || []).filter(q =>
  q.id && (q.id.includes("demo") || q.id === "d55e42f2-6fd7-43e7-bfbf-af29e69399d1")
).map(q => {
  const c = staticDemoClients.find(client => client.id === q.client_id);
  if (c) {
    q.clients = c;
    if (q.id === "quote-demo1") {
      q.turno = "cena";
      q.tipo_esclusiva = "esclusiva";
      q.formula_opzione = "esclusiva";
      q.numero_ospiti = 120;
    }
  }
  return q;
});

const preservedDiaries = (store.wedding_diaries || []).filter(d =>
  d.client_id && d.client_id.includes("demo")
);
const preservedSigned = (store.signed_contracts || []).filter(s =>
  s.quote_id && s.quote_id.includes("demo")
);

// Inizializza nuove collezioni
const newClients: any[] = [...staticDemoClients];
const newQuotes: any[] = [...preservedQuotes];
const newDiaries: any[] = [...preservedDiaries];
const newSigned: any[] = [...preservedSigned];
const newPayments: any[] = [
  // Pagamenti storici per popolamento LTV e Club TDA
  {
    id: "pay-hist-1",
    quote_id: "quote-demo4-old",
    data_incasso: "2023-05-20",
    importo_cents: 1500000,
    metodo: "bonifico",
    incassato_da: "santo_stefano",
    riferimento: "Saldo Matrimonio 2023",
    note: "Saldo integrale ricevimento nuziale",
    stato: "valido",
    registrato_da: "Direzione TDA",
    created_at: "2023-05-20T10:00:00.000Z"
  },
  {
    id: "pay-hist-2",
    quote_id: "quote-demo4-new",
    data_incasso: "2025-04-10",
    importo_cents: 400000,
    metodo: "bonifico",
    incassato_da: "santo_stefano",
    riferimento: "Saldo Battesimo 2025",
    note: "Saldo festa privata Club TDA",
    stato: "valido",
    registrato_da: "Direzione TDA",
    created_at: "2025-04-10T10:00:00.000Z"
  },
  {
    id: "pay-hist-3",
    quote_id: "quote-demo3",
    data_incasso: "2026-10-05",
    importo_cents: 240000,
    metodo: "bonifico",
    incassato_da: "santo_stefano",
    riferimento: "Saldo Ricevimento Notarile",
    note: "Saldo evento aziendale",
    stato: "valido",
    registrato_da: "Direzione TDA",
    created_at: "2026-10-05T10:00:00.000Z"
  }
];

// Helper per creare client + quote + payment
function createEvent(params: {
  nome: string;
  cognome: string;
  partnerNome?: string;
  partnerCognome?: string;
  telefono: string;
  email: string;
  dataEvento: string;
  turno: "pranzo" | "cena";
  formula: "esclusiva" | "semi_esclusiva";
  formulaDettaglio?: "esclusiva" | "sala_bianca" | "sala_tufo";
  spazi: string[];
  ospiti: number;
  tipoEvento?: "wedding" | "eventi";
  status: "firmato" | "convertito" | "inviato" | "bozza_visita" | "opzione";
  canoneLocation: number;
  menuPrezzoUnitario: number;
  extraItems?: Array<{ descrizione: string; quantita: number; prezzo: number; splitKey: string }>;
  sconto?: number;
  paymentsList?: Array<{
    data: string;
    importo: number;
    metodo: "bonifico" | "contanti" | "assegno";
    incassatoDa: "santo_stefano" | "iovino";
    riferimento: string;
    note: string;
  }>;
  diaryData?: {
    musica: string;
    stile: string;
    primoBallo: string;
    torta: string;
    celiaci: string;
    noteGenerali: string;
  };
  noteSegreteria?: string;
}) {
  const clientId = crypto.randomUUID();
  const quoteId = crypto.randomUUID();

  // 1. Client
  const client = {
    id: clientId,
    nome: params.nome,
    cognome: params.cognome,
    sposera_nome: params.partnerNome || "",
    sposera_cognome: params.partnerCognome || "",
    email: params.email,
    telefono: params.telefono,
    codice_fiscale: "CF" + crypto.randomUUID().slice(0, 14).toUpperCase(),
    provenienza: "Napoli",
    created_at: "2026-09-01T10:00:00.000Z",
  };
  newClients.push(client);

  // 2. Items
  const items = [
    {
      id: Date.now() + Math.floor(Math.random() * 10000),
      descrizione: `Canone Concessione Villa (${params.formulaDettaglio === "esclusiva" ? "Esclusiva" : "Semi-Esclusiva " + params.formulaDettaglio})`,
      quantita: 1,
      prezzo_unitario: params.canoneLocation,
      splitKey: "ss100",
      totale: params.canoneLocation,
    },
    {
      id: Date.now() + Math.floor(Math.random() * 10000) + 1,
      descrizione: `Banchetto Gourmet Ricevimento (${params.ospiti} Ospiti)`,
      quantita: params.ospiti,
      prezzo_unitario: params.menuPrezzoUnitario,
      splitKey: "40_60",
      totale: params.ospiti * params.menuPrezzoUnitario,
    },
  ];

  if (params.extraItems) {
    params.extraItems.forEach((extra, idx) => {
      items.push({
        id: Date.now() + Math.floor(Math.random() * 10000) + 10 + idx,
        descrizione: extra.descrizione,
        quantita: extra.quantita,
        prezzo_unitario: extra.prezzo,
        splitKey: extra.splitKey,
        totale: extra.quantita * extra.prezzo,
      });
    });
  }

  const subTotale = items.reduce((acc, it) => acc + it.totale, 0);
  const sconto = params.sconto || 0;
  const totaleCalcolato = subTotale - sconto;

  const isFirmato = params.status === "firmato";
  const isInFirma = params.status === "convertito";
  const isOpzione = params.status === "opzione";

  // 3. Quote
  const quote = {
    id: quoteId,
    client_id: clientId,
    tipo_evento: params.tipoEvento || "wedding",
    data_evento: params.dataEvento,
    turno: params.turno,
    tipo_esclusiva: params.formula,
    formula_opzione: params.formulaDettaglio || (params.formula === "esclusiva" ? "esclusiva" : "sala_bianca"),
    spazi_riservati: params.spazi,
    numero_ospiti: params.ospiti,
    canale_contratto: isFirmato || isInFirma ? "accordo_diretto" : undefined,
    fase_contratto: isFirmato || isInFirma ? "accordo_diretto" : (isOpzione ? "opzione_rapida" : undefined),
    source: isFirmato || isInFirma ? "admin_rapido" : undefined,
    items,
    sconto_fisso: sconto,
    prezzo: totaleCalcolato,
    totale: totaleCalcolato,
    totale_calcolato: totaleCalcolato,
    importo_caparra: 1500,
    importo_secondo_acconto: params.tipoEvento === "eventi" ? 0 : 3000,
    status: params.status,
    note_visita_segreteria: params.noteSegreteria || "",
    created_at: "2026-09-10T12:00:00.000Z",
    updated_at: new Date().toISOString(),
    opzione: isOpzione || isInFirma ? {
      attiva: true,
      tipo: params.formula,
      data_inizio: "2026-10-02T10:00:00.000Z",
      scadenza: "2026-10-12T23:59:59.000Z",
      turno: params.turno,
      spazi: params.spazi,
      canale: "calendario_rapido"
    } : null,
    clients: client
  };
  newQuotes.push(quote);

  // 4. Signed Contracts se firmato
  if (isFirmato) {
    newSigned.push({
      quote_id: quoteId,
      tipo_evento: params.tipoEvento || "wedding",
      firmato_il: "2026-09-15T15:30:00.000Z",
      datiCliente: client
    });
  }

  // 5. Payments
  if (params.paymentsList && params.paymentsList.length > 0) {
    params.paymentsList.forEach((pay) => {
      newPayments.push({
        id: crypto.randomUUID(),
        quote_id: quoteId,
        data_incasso: pay.data,
        importo_cents: Math.round(pay.importo * 100),
        metodo: pay.metodo,
        incassato_da: pay.incassatoDa,
        riferimento: pay.riferimento,
        note: pay.note,
        stato: "valido",
        registrato_da: "Roberto Sola (Direzione)",
        created_at: pay.data + "T10:00:00.000Z",
      });
    });
  }

  // 6. Wedding Diary
  if (params.diaryData && params.tipoEvento !== "eventi") {
    newDiaries.push({
      id: crypto.randomUUID(),
      client_id: clientId,
      quote_id: quoteId,
      answers: {
        music_preference: params.diaryData.musica,
        style_mood: params.diaryData.stile,
        first_dance: params.diaryData.primoBallo,
        cake_cutting: params.diaryData.torta,
        dietary_notes: params.diaryData.celiaci,
        general_notes: params.diaryData.noteGenerali,
        ceremony_type: "Rito Simbolico nel Giardino delle Promesse",
        guest_count_estimate: String(params.ospiti),
        open_bar_cocktails: "Gin Mare, Vodka Belvedere, Mojito all'Arancio",
      },
      updated_at: "2026-10-05T18:00:00.000Z",
    });
  }
}

// -------------------------------------------------------------
// DEFINIZIONE DEGLI 11 EVENTI DI LUGLIO 2027
// -------------------------------------------------------------

// 1. Sabato 3 Luglio 2027 — Pranzo (12:30) | Esclusiva Intera Tenuta (Firmato, 2 rate pagate)
createEvent({
  nome: "Marco",
  cognome: "Esposito",
  partnerNome: "Sofia",
  partnerCognome: "De Luca",
  telefono: "+39 347 8891234",
  email: "marco.esposito@gmail.com",
  dataEvento: "2027-07-03",
  turno: "pranzo",
  formula: "esclusiva",
  formulaDettaglio: "esclusiva",
  spazi: ["Agrumeto Storico", "Sala Tufo", "Sala Bianca", "Terrazza Panoramica"],
  ospiti: 140,
  status: "firmato",
  canoneLocation: 4500,
  menuPrezzoUnitario: 110, // 15.400
  extraItems: [
    { descrizione: "Show Cooking Graffette Calde all'Arancio", quantita: 1, prezzo: 600, splitKey: "40_60" },
    { descrizione: "Open Bar Premium Illimitato Dopopranzo", quantita: 1, prezzo: 1500, splitKey: "40_60" },
    { descrizione: "Spettacolo Fontane Fredde Piriche Taglio Torta", quantita: 1, prezzo: 500, splitKey: "ss100" }
  ],
  sconto: 500,
  paymentsList: [
    { data: "2026-09-15", importo: 1500, metodo: "bonifico", incassatoDa: "santo_stefano", riferimento: "CRO: IT9801239842", note: "Caparra confirmatoria alla firma" },
    { data: "2027-01-03", importo: 3000, metodo: "bonifico", incassatoDa: "iovino", riferimento: "CRO: IT5509823411", note: "2° Acconto -6 mesi somministrazione cucina" }
  ],
  diaryData: {
    musica: "Band Swing & Bossa Nova per buffet aperitivo in Agrumeto, poi DJ Set",
    stile: "Elegante botanico con dettagli agrumi e ceramiche vietresi",
    primoBallo: "'A te' - Lorenzo Jovanotti",
    torta: "Millefoglie espressa con frutti di bosco e fontane luminose",
    celiaci: "5 celiaci certificati, 2 vegani, 1 allergia grave ai crostacei",
    noteGenerali: "Gli sposi desiderano ingresso trionfale in giardino con brindisi sotto gli aranci."
  },
  noteSegreteria: "Visita in villa effettuata a Luglio 2026. Coppia molto decisa ed elegante."
});

// 2. Sabato 3 Luglio 2027 — Cena (19:30) | Semi-Esclusiva Sala Tufo (Firmato, Caparra pagata)
createEvent({
  nome: "Lorenzo",
  cognome: "Romano",
  partnerNome: "Camilla",
  partnerCognome: "Ferrara",
  telefono: "+39 338 7654321",
  email: "lorenzo.romano@libero.it",
  dataEvento: "2027-07-03",
  turno: "cena",
  formula: "semi_esclusiva",
  formulaDettaglio: "sala_tufo",
  spazi: ["Sala Tufo", "Giardino delle Promesse", "Terrazza Taglio Torta"],
  ospiti: 85,
  status: "firmato",
  canoneLocation: 3500,
  menuPrezzoUnitario: 120, // 10.200
  extraItems: [
    { descrizione: "Angolo Sigari, Cioccolato Pregiato & Rum", quantita: 1, prezzo: 700, splitKey: "40_60" }
  ],
  paymentsList: [
    { data: "2026-09-20", importo: 1500, metodo: "bonifico", incassatoDa: "santo_stefano", riferimento: "CRO: IT1209384756", note: "Caparra confirmatoria blocco data Sala Tufo" }
  ],
  diaryData: {
    musica: "Arpa celtica e violino al tramonto, lounge bar dopocena",
    stile: "Rustico chic con candele sospese e tufo illuminato caldo",
    primoBallo: "'Perfect' - Ed Sheeran",
    torta: "Naked cake con crema chantilly e gocce di cioccolato",
    celiaci: "3 celiaci, 1 intollerante al lattosio",
    noteGenerali: "Tavoli imperiali in Sala Tufo con runner di eucalipto."
  },
  noteSegreteria: "La sera del 3 Luglio convive perfettamente col matrimonio del pranzo!"
});

// 3. Domenica 4 Luglio 2027 — Pranzo (12:30) | Esclusiva (In Firma con Opzione 7gg)
createEvent({
  nome: "Antonio",
  cognome: "De Rosa",
  partnerNome: "Chiara",
  partnerCognome: "Russo",
  telefono: "+39 335 4433221",
  email: "antonio.derosa@outlook.it",
  dataEvento: "2027-07-04",
  turno: "pranzo",
  formula: "esclusiva",
  formulaDettaglio: "esclusiva",
  spazi: ["Agrumeto Storico", "Sala Bianca", "Sala Tufo"],
  ospiti: 120,
  status: "convertito", // In firma
  canoneLocation: 4500,
  menuPrezzoUnitario: 115, // 13.800
  extraItems: [
    { descrizione: "Rito Civile nel Giardino delle Promesse", quantita: 1, prezzo: 1200, splitKey: "ss100" },
    { descrizione: "Carretto Gelato Artigianale Napoletano", quantita: 1, prezzo: 600, splitKey: "40_60" }
  ],
  noteSegreteria: "Contratto emesso con opzione bloccata per 7 giorni. Sposi in attesa di confermare bonifico caparra."
});

// 4. Giovedì 8 Luglio 2027 — Cena (19:30) | Festa Privata / Laurea (Firmato, Acconto contanti)
createEvent({
  nome: "Dott.ssa Giulia",
  cognome: "De Angelis",
  telefono: "+39 349 9871122",
  email: "giulia.deangelis@gmail.com",
  dataEvento: "2027-07-08",
  turno: "cena",
  formula: "semi_esclusiva",
  formulaDettaglio: "sala_tufo",
  spazi: ["Sala Tufo", "Terrazza Agrumeto"],
  ospiti: 65,
  tipoEvento: "eventi",
  status: "firmato",
  canoneLocation: 2000,
  menuPrezzoUnitario: 50, // 3.250 buffet
  extraItems: [
    { descrizione: "DJ Set & Cocktail Bar Illimitato Laurea", quantita: 1, prezzo: 850, splitKey: "40_60" }
  ],
  paymentsList: [
    { data: "2026-10-01", importo: 1000, metodo: "contanti", incassatoDa: "santo_stefano", riferimento: "Rif: Ricevuta Manuale n. 44", note: "Acconto confirmatorio festa di laurea" }
  ],
  noteSegreteria: "Festa di Laurea Magistrale in Medicina. Richiesto carretto graffette a mezzanotte."
});

// 5. Sabato 10 Luglio 2027 — Pranzo (12:30) | Semi-Esclusiva Sala Bianca (Firmato)
createEvent({
  nome: "Davide",
  cognome: "Rinaldi",
  partnerNome: "Elena",
  partnerCognome: "Sorrentino",
  telefono: "+39 333 1122334",
  email: "davide.rinaldi@gmail.com",
  dataEvento: "2027-07-10",
  turno: "pranzo",
  formula: "semi_esclusiva",
  formulaDettaglio: "sala_bianca",
  spazi: ["Sala Bianca", "Agrumeto Storico"],
  ospiti: 90,
  status: "firmato",
  canoneLocation: 3500,
  menuPrezzoUnitario: 115, // 10.350
  paymentsList: [
    { data: "2026-09-10", importo: 1500, metodo: "bonifico", incassatoDa: "santo_stefano", riferimento: "CRO: IT4409823412", note: "Caparra confirmatoria Sala Bianca" }
  ],
  diaryData: {
    musica: "Pianoforte a coda e voce dal vivo",
    stile: "Total White con accenti oro e lino naturale",
    primoBallo: "'She' - Elvis Costello",
    torta: "Torta monumentale a piani all'arancia e mandorla",
    celiaci: "4 celiaci, 1 intollerante al nichel",
    noteGenerali: "Centrotavola floreali bassi con ortensie bianche e rose inglesi."
  }
});

// 6. Sabato 10 Luglio 2027 — Pranzo (12:30) | Semi-Esclusiva Sala Tufo (Coesistente nello stesso turno!)
createEvent({
  nome: "Gennaro",
  cognome: "Marino",
  partnerNome: "Federica",
  partnerCognome: "Vitale",
  telefono: "+39 340 5566778",
  email: "gennaro.marino@alice.it",
  dataEvento: "2027-07-10",
  turno: "pranzo",
  formula: "semi_esclusiva",
  formulaDettaglio: "sala_tufo",
  spazi: ["Sala Tufo", "Giardino delle Promesse"],
  ospiti: 75,
  status: "firmato",
  canoneLocation: 3500,
  menuPrezzoUnitario: 110, // 8.250
  paymentsList: [
    { data: "2026-09-12", importo: 1500, metodo: "bonifico", incassatoDa: "santo_stefano", riferimento: "CRO: IT7788990011", note: "Caparra confirmatoria Sala Tufo" }
  ],
  diaryData: {
    musica: "Quartetto d'archi classico all'accoglienza",
    stile: "Romantico mediterraneo con ulivo e rosmarino",
    primoBallo: "'Il cielo in una stanza'",
    torta: "Crostata monumentale di frutta fresca di stagione",
    celiaci: "2 celiaci, 3 vegetariani",
    noteGenerali: "Stesso turno del matrimonio Rinaldi: sale indipendenti con acustica separata."
  }
});

// 7. Sabato 10 Luglio 2027 — Cena (19:30) | Esclusiva (Opzione 7gg da confermare)
createEvent({
  nome: "Roberto",
  cognome: "D'Amico",
  partnerNome: "Beatrice",
  partnerCognome: "Mancini",
  telefono: "+39 348 2233445",
  email: "roberto.damico@yahoo.it",
  dataEvento: "2027-07-10",
  turno: "cena",
  formula: "esclusiva",
  formulaDettaglio: "esclusiva",
  spazi: ["Agrumeto Storico", "Sala Bianca", "Sala Tufo"],
  ospiti: 110,
  status: "opzione",
  canoneLocation: 4500,
  menuPrezzoUnitario: 120,
  noteSegreteria: "Opzione telefonica rapida di 7 giorni presa il 4 Ottobre. Richiesta prelazione prima di rilasciare."
});

// 8. Domenica 11 Luglio 2027 — Cena (19:30) | Esclusiva (Preventivo inviato)
createEvent({
  nome: "Fabio",
  cognome: "Caruso",
  partnerNome: "Noemi",
  partnerCognome: "Barone",
  telefono: "+39 331 9988776",
  email: "fabio.caruso@gmail.com",
  dataEvento: "2027-07-11",
  turno: "cena",
  formula: "esclusiva",
  formulaDettaglio: "esclusiva",
  spazi: ["Agrumeto Storico", "Sala Tufo", "Terrazza"],
  ospiti: 130,
  status: "inviato",
  canoneLocation: 4500,
  menuPrezzoUnitario: 115,
  noteSegreteria: "Preventivo analitico inviato con degustazione vini campani DOC."
});

// 9. Sabato 17 Luglio 2027 — Pranzo (12:30) | Esclusiva (Firmato, 3 rate incassate, Flusso Cassa Completo)
createEvent({
  nome: "Claudio",
  cognome: "Ferri",
  partnerNome: "Simona",
  partnerCognome: "Marchetti",
  telefono: "+39 345 6677889",
  email: "claudio.ferri@virgilio.it",
  dataEvento: "2027-07-17",
  turno: "pranzo",
  formula: "esclusiva",
  formulaDettaglio: "esclusiva",
  spazi: ["Agrumeto Storico", "Sala Bianca", "Sala Tufo", "Terrazza Panoramica"],
  ospiti: 150,
  status: "firmato",
  canoneLocation: 4500,
  menuPrezzoUnitario: 115, // 17.250
  extraItems: [
    { descrizione: "Angolo Sigari Cubani & Distillati Pregiati", quantita: 1, prezzo: 800, splitKey: "40_60" },
    { descrizione: "Show Cooking Brace Gourmet in Giardino", quantita: 1, prezzo: 1200, splitKey: "40_60" },
    { descrizione: "Illuminazione Architetturale Catene Vintage Giardino", quantita: 1, prezzo: 900, splitKey: "ss100" }
  ],
  paymentsList: [
    { data: "2026-08-01", importo: 1500, metodo: "bonifico", incassatoDa: "santo_stefano", riferimento: "CRO: IT8829103948", note: "Caparra confirmatoria iniziale" },
    { data: "2027-01-17", importo: 3000, metodo: "bonifico", incassatoDa: "iovino", riferimento: "CRO: IT9948201948", note: "2° Acconto Banqueting Iovino" },
    { data: "2027-05-02", importo: 2000, metodo: "contanti", incassatoDa: "santo_stefano", riferimento: "Quietanza cassa n. 88", note: "Versamento straordinario anticipato su canone" }
  ],
  diaryData: {
    musica: "Trio jazz all'accoglienza, sax solista al taglio torta, DJ set scatenato",
    stile: "Luxury botanico con lampadari di cristallo tra gli aranci",
    primoBallo: "'All of Me' - John Legend",
    torta: "Torta d'autore con cascata di fiori freschi e fuochi pirotecnici",
    celiaci: "8 celiaci (richiesto menu parallelo completo Iovino), 3 vegani, 2 senza lattosio",
    noteGenerali: "Sposi molto attenti alla mise en place: piatti in porcellana dipinta a mano."
  },
  noteSegreteria: "Cliente alto spendente, già cliente della famiglia per una cresima nel 2024."
});

// 10. Sabato 24 Luglio 2027 — Cena (19:30) | Esclusiva (Lead Visita da iPad Segreteria)
createEvent({
  nome: "Edoardo",
  cognome: "Gallo",
  partnerNome: "Giorgia",
  partnerCognome: "Castaldi",
  telefono: "+39 339 3344556",
  email: "edoardo.gallo@gmail.com",
  dataEvento: "2027-07-24",
  turno: "cena",
  formula: "esclusiva",
  formulaDettaglio: "esclusiva",
  spazi: ["Agrumeto Storico", "Sala Tufo", "Sala Bianca"],
  ospiti: 125,
  status: "bozza_visita",
  canoneLocation: 4500,
  menuPrezzoUnitario: 110,
  noteSegreteria: "Visita guidata in villa con tablet iPad effettuata il 06/10. La coppia ha adorato l'Agrumeto al tramonto e la Sala Tufo. In attesa che Roberto generi il contratto rapido."
});

// 11. Sabato 31 Luglio 2027 — Cena (19:30) | Esclusiva Gran Gala Estate (Firmato con caparra + acconto)
createEvent({
  nome: "Federico",
  cognome: "Testa",
  partnerNome: "Ludovica",
  partnerCognome: "Leone",
  telefono: "+39 346 7788990",
  email: "federico.testa@hotmail.it",
  dataEvento: "2027-07-31",
  turno: "cena",
  formula: "esclusiva",
  formulaDettaglio: "esclusiva",
  spazi: ["Agrumeto Storico", "Sala Bianca", "Sala Tufo", "Terrazza Taglio Torta"],
  ospiti: 160,
  status: "firmato",
  canoneLocation: 4500,
  menuPrezzoUnitario: 125, // 20.000
  extraItems: [
    { descrizione: "Show Cooking Pizza Fritta Napoletana & Montanarine", quantita: 1, prezzo: 800, splitKey: "40_60" },
    { descrizione: "Open Bar Illimitato con Barman Acrobatico", quantita: 1, prezzo: 1600, splitKey: "40_60" }
  ],
  paymentsList: [
    { data: "2026-08-25", importo: 1500, metodo: "bonifico", incassatoDa: "santo_stefano", riferimento: "CRO: IT4473829102", note: "Caparra confirmatoria blocco data estate 2027" },
    { data: "2027-01-31", importo: 3000, metodo: "bonifico", incassatoDa: "iovino", riferimento: "CRO: IT9938291023", note: "2° Acconto programmato Banqueting" }
  ],
  diaryData: {
    musica: "Band acustica live all'aperitivo, DJ Set dopocena fino alle 03:00",
    stile: "Glamour estivo sotto le stelle con candele e specchi",
    primoBallo: "'Thinking Out Loud'",
    torta: "Torta monumentale a vista con taglio in terrazza panoramica",
    celiaci: "6 celiaci, 1 allergia alla frutta secca",
    noteGenerali: "Richiesto angolo sigari e carretto graffette caldo alle 02:00."
  },
  noteSegreteria: "Grande evento di chiusura del mese di Luglio."
});

// Applica le nuove collezioni allo store
store.clients = newClients;
store.quotes = newQuotes;
store.wedding_diaries = newDiaries;
store.signed_contracts = newSigned;
store.payments = newPayments;

fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), "utf8");

console.log("=== SEED COMPLETATO CON SUCCESSO ===");
console.log("Clienti totali:", store.clients.length);
console.log("Quotes totali:", store.quotes.length);
console.log("Pagamenti reali registrati:", store.payments.length);
console.log("Wedding Diaries compilati:", store.wedding_diaries.length);
const incassatoTotale = store.payments.reduce((acc, p) => acc + (p.importo_cents || 0), 0) / 100;
console.log("Totale Incassato Reale nel Ledger:", "€ " + incassatoTotale.toLocaleString("it-IT"));
