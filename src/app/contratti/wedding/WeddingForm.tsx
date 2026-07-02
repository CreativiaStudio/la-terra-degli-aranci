"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import SignaturePad from "@/components/SignaturePad";

export default function WeddingForm({ initialPrezzo, initialPreventivo }: { initialPrezzo: string, initialPreventivo: string }) {
  const [lang, setLang] = useState<"it" | "en">("it");
  const [firmaContratto, setFirmaContratto] = useState("");
  const [firmaClausole, setFirmaClausole] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [customError, setCustomError] = useState("");

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      tipo_cliente: "privato",
      nazione: "Italia",
      nome: "",
      cognome: "",
      ragione_sociale: "",
      luogo_di_nascita: "",
      data_di_nascita: "",
      citta_di_residenza: "",
      indirizzo: "",
      numero_civico: "",
      cap: "",
      codice_fiscale: "",
      partita_iva: "",
      sdi: "",
      telefono: "",
      email: "",
      pec: "",
      sposera_nome: "",
      sposera_cognome: "",
      data_evento: "",
      accetto: false,
      comunicazione_terzi: false,
      marketing: "NO",
      mezzo_anticipo: "Bonifico Bancario",
      data_anticipo: "",
      mezzo_saldo: "Bonifico Bancario",
      data_saldo: ""
    }
  });

  const tipoCliente = watch("tipo_cliente");
  const nazione = watch("nazione");
  const formValues = watch();

  // Recupera bozza salvata al caricamento
  useEffect(() => {
    const savedDraft = localStorage.getItem("draft_wedding_form");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        reset(parsed.form);
        if (parsed.firmaContratto) setFirmaContratto(parsed.firmaContratto);
        if (parsed.firmaClausole) setFirmaClausole(parsed.firmaClausole);
      } catch(e) {
        console.error("Errore nel recupero bozza", e);
      }
    }
  }, [reset]);

  // Salva bozza ad ogni modifica
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const draft = { form: formValues, firmaContratto, firmaClausole };
      localStorage.setItem("draft_wedding_form", JSON.stringify(draft));
    }, 1000); // Debounce di 1 secondo per non intasare il localStorage ad ogni tasto
    return () => clearTimeout(timeoutId);
  }, [formValues, firmaContratto, firmaClausole]);

  const dict = {
    it: {
      title: "Firma del contratto Wedding",
      sub: "Contratto di concessione uso temporaneo spazi e servizi banqueting.",
      btn: "Invia il contratto firmato",
      successTitle: "Contratto inviato con successo!",
      successSub: "Grazie, abbiamo ricevuto il tuo contratto di matrimonio firmato.",
      riepilogo: "Riepilogo Matrimonio",
      numPrev: "Numero Preventivo",
      prezzo: "Prezzo Concordato (€)",
      
      // Contratto Testi
      c_scrittura: "Scrittura privata tra:",
      c_santo: "La “Santo Stefano S.r.l.”, con sede legale in Napoli alla Piazzetta Santo Stefano 7 e Partita I.V.A. 06039150633 iscritta al registro delle imprese di Napoli, nella persona del legale rappresentante pro tempore ing. Roberto Sola;",
      c_and: "E",
      c_iovino: "la “Iovino Banqueting S.r.l. soc. unipersonale”, con sede legale in Casalnuovo di Napoli (NA) alla Via Napoli n. 141 e Partita I.V.A. 06818681212, iscritta al registro delle imprese di Napoli, nella persona del legale rappresentante pro tempore Sig.ra Rosaria Iovino;",
      c_sig: "Ed il Sig. (opp. ragione sociale)",
      c_cliente: "D’ora innanzi denominato “Cliente”.",
      c_premesso: "Premesso che",
      c_l1: "la società “Santo Stefano S.r.l.” è proprietaria del complesso denominato “La Terra degli Aranci” sito in Napoli alla Piazzetta S. Stefano n. 7;",
      c_l2: "il Cliente intende prendere in uso temporaneo tale complesso ed avvalersi dei servizi di banqueting (somministrazione di cibo e bevande, allestimenti et similia) offerti dalla società Iovino Banqueting S.r.l. soc. uni personale;",
      c_l3: "il Cliente ha ispezionato i locali e avendoli trovati idonei alle proprie esigenze dichiara di volerli utilizzare per il seguente evento: RICEVIMENTO DI MATRIMONIO",
      c_si_conviene: "SI CONVIENE E SI STIPULA QUANTO SEGUE",
      c_art1_t: "Art. 1 – Premessa",
      c_art1_c: "La premessa, i documenti in essa richiamati, nonché quelli a quest’ultimi da considerarsi connessi, sono parti integranti del presente accordo, presupposto determinante e patto essenziale dello stesso, nel suo insieme ed in ogni sua parte.",
      c_art2_t: "Art. 2 – Oggetto",
      c_art2_c: "Il Cliente prende in uso il complesso denominato “La Terra degli Aranci”, di proprietà della società “Santo Stefano S.r.l.”, per il RICEVIMENTO DI MATRIMONIO affidando alla società “Iovino Banqueting S.r.l. soc. unipersonale”, che accetta, l’appalto di servizio di preparazione e somministrazione di alimenti e bevande e di cura degli allestimenti",
      c_art3_t: "Art. 3 – Durata",
      c_art3_c1: "Il Cliente prende atto e accetta che, nel giorno prenotato, l’orario di utilizzo della struttura e dei relativi servizi per il ricevimento non dovrà prolungarsi oltre le ore 20,00 per un evento iniziato entro le ore 14,00 ed oltre le ore 24,00 per un evento serale. Per la conclusione del ricevimento è prevista una tolleranza massima di un’ora dall’orario convenuto. La chiusura della location è prevista al massimo due ore dopo l’orario convenuto. Nel caso il ricevimento si concluda oltre l’orario di tolleranza sarà applicato un supplemento di €1.000,00.",
      c_art3_c2: "Nel caso il menu concordato preveda il buffet di antipasti il Cliente prende atto e accetta che lo stesso si aprirà al più due ore dopo l’arrivo dei primi ospiti, quindi anche in assenza degli sposi. Un eventuale after dinner, da svolgersi in Sala Tufo, è considerato un servizio supplementare il cui orario massimo di chiusura è alle ore 2,00",
      c_art4_t: "Art. 4 – Corrispettivo",
      c_art4_c1: "Il prezzo base, incrementabile sulla base dell’allegato “La Terra degli Aranci – Servizi del ricevimento di matrimonio”, è pari a:",
      c_art4_c2: "€ 130,00 (Centotrenta/00) oltre IVA (per adulto);",
      c_art4_c3: "€ 50,00 (Cinquanta/00) oltre IVA (per bambino);",
      c_art4_c4: "Primo acconto da versare all’atto della firma del presente contratto alla “Santo Stefano S.r.l.”:",
      c_art4_c5: "€ 1.500,00 (MILLECINQUECENTO/00)",
      c_art4_c6: "Secondo acconto da versare 6 mesi prima della data dell’evento alla “Iovino Banqueting S.r.l. soc. unipersonale”:",
      c_art4_c7: "€ 3.000,00 (TREMILA/00)",
      c_art4_c8: "Gli acconti indicati vengono versati a titolo di caparra confirmatoria e saranno imputati in conto prezzo all’atto del saldo complessivo dell’importo convenuto che sarà versato il giorno del ricevimento. Ciascuna parte potrà recedere dal presente contratto dandone comunicazione all’altra con lettera raccomandata a/r con preavviso di almeno 30 giorni dalla data del ricevimento. In caso di recesso dal presente impegno da parte del Cliente, le società “Santo Stefano S.r.l.” e “Iovino Banqueting S.r.l. soc. unipersonale” non saranno tenute a rendere alcun importo; nel caso contrario, le società “Santo Stefano S.r.l.” e “Iovino Banqueting S.r.l. soc. unipersonale” saranno tenute, solidalmente, alla restituzione del doppio della caparra ricevuta. Il numero definitivo degli ospiti dovrà essere comunicato e consegnato in sede entro 10 gg dalla data dell’evento. Il presente contratto potrà essere registrato in caso di uso",
      c_art5_t: "Art. 5 – Obblighi delle parti",
      c_art5_c: "La “Santo Stefano s.r.l.” e la “Iovino Banqueting S.r.l. soc. unipersonale”, non assumono alcuna responsabilità per eventuali danni occorsi a cose o persone dovuti a calamità naturali. Il Cliente si assume la responsabilità dei danni che lo stesso o i suoi ospiti possano arrecare a persone o cose. Il Cliente prende atto e accetta che le società “Santo Stefano S.r.l.” e “Iovino Banqueting S.r.l. soc. unipersonale” non assumono alcuna responsabilità riguardo i minori di 18 anni (accompagnati e non) come non assumono alcuna responsabilità per eventuali furti, rapine, perdita o deterioramento dei beni indossati o portati dal Cliente ovvero dai suoi ospiti, con riferimento a denaro, automobili, gioielli o altri valori. Il Cliente prende atto e accetta che le aree di sosta fornite dalla “Santo Stefano S.r.l.” al Cliente ed ai suoi ospiti non sono assicurate per eventuali danni o furti alle automobili a cui è permessa la sosta. È espressamente vietato al Cliente, ovvero ai suoi ospiti, a qualsiasi titolo, introdurre nella struttura e, tanto più usare, prodotti pirotecnici e coriandoli sfusi e/o a nastro. In caso di utilizzo di drone è necessario presentare la documentazione necessaria all’utilizzo e il contratto con l’utilizzatore che è responsabile per eventuali danni arrecati a cose o persone. É vietato effettuare inquadrature ravvicinate in proprietà aliene. Il Cliente accetta che è vietato svolgere musica amplificata o con strumenti squillanti e/o assordanti negli spazi esterni della struttura e non oltre la mezzanotte. Qualsiasi intrattenimento musicale deve essere fornito dalla struttura. Il Cliente si farà carico di adempiere a tutti gli oneri ed obblighi con la SIAE, qualora nei locali si diffonda musica dal vivo, e manleva le società indicate da qualsiasi responsabilità civile o amministrativa, dovuta a trasgressioni della legge. L’animazione per i bambini risulta essere obbligatoria nella misura di un animatore ogni cinque bambini, dovendosi in tal sede intendere come bambini i minori compresi dagli anni 3 agli anni 12. Le società “Santo Stefano S.r.l.” e “Iovino Banqueting S.r.l. soc. unipersonale” non assumono alcuna responsabilità per eventuali sospensioni nell’erogazione dell’energia elettrica, dell’acqua, del gas o qualsivoglia altro inconveniente comunque indipendente dalla propria volontà. È garantito al Cliente il normale svolgimento del ricevimento anche in caso di pioggia. Per l’utilizzo dei giardini in caso di pioggia è possibile noleggiare, previa disponibilità, una tendostruttura: per tale servizio è previsto un costo aggiuntivo. In caso di eventi catastrofici quali epidemie, terremoti, eruzioni o altri eventi naturali, che implichino la sospensione forzata dell’attività, la caparra versata per la stipula del presente contratto si intende valida per una nuova prenotazione da effettuarsi entro i 12 mesi dalla riapertura dell’attività.",
      c_art6_t: "Art. 6 – Risoluzione",
      c_art6_c: "Il Cliente potrà risolvere unilateralmente il presente contratto qualora le altre parti si siano rese inadempienti ad una delle pattuizioni qui previste, con effetto ai sensi dell’art. 1456 c.c., mediante comunicazione, inviata a mezzo raccomandata a.r.",
      c_art7_t: "Art. 7 – Clausola di risoluzione delle controversie",
      c_art7_c: "La presente scrittura privata ha validità immediata e le parti contrattuali convengono come foro competente ed esclusivo, per la risoluzione e l’attuazione del presente contratto, il foro di Napoli.",
      c_art8_t: "Art. 8 – Tutela della riservatezza e trattamento dei dati personali",
      c_art8_c: "Ai sensi dell’art. 13 del Regolamento UE n. 2016/679 (GDPR) ed art. 13 del D.lgs 196/2003 e s.m.i., le parti danno atto che i dati personali che riguardano il Cliente saranno trattati dalla Santo Stefano srl e dalla Iovino Banqueting srl soc. unipersonale, ciascuna in qualità di autonoma Titolare del trattamento, esclusivamente per finalità connesse alla conclusione, gestione ed esecuzione del presente contratto, nonché per l’adempimento di obblighi di legge.",
      
      // Form
      f_stipula: "Stipuli il contratto come:",
      f_privato: "Privato",
      f_azienda: "Azienda",
      f_nome: "Nome *",
      f_cognome: "Cognome *",
      f_ragione: "Ragione Sociale *",
      f_luogo_nascita: "Luogo di nascita *",
      f_data_nascita: "Data di nascita *",
      f_nazione: "Nazione *",
      f_italia: "Italia",
      f_estero: "Estero",
      f_citta: "Città di residenza *",
      f_via: "In via/piazza *",
      f_civico: "Numero Civico *",
      f_piva: "Partita IVA *",
      f_cf: "Codice Fiscale",
      f_email: "Email *",
      f_telefono: "Telefono *",
      f_sdi: "SDI (Codice Destinatario)",
      f_partner_tit: "Dati del partner (Che sposerà...)",
      f_partner_n: "Nome Sposo/a *",
      f_partner_c: "Cognome Sposo/a *",
      f_data: "Giorno ed ora del Matrimonio *",
      
      // Pagamenti
      f_pagamenti_tit: "Dettagli Pagamenti (Concordati con la direzione)",
      f_mezzo_anticipo: "Mezzo pagamento anticipo (es. Bonifico)",
      f_data_anticipo: "Data versamento anticipo *",
      f_mezzo_saldo: "Mezzo pagamento saldo",
      f_data_saldo: "Data versamento saldo *",
      
      // Firme
      sig_contratto: "Firma Contratto",
      sig_clausole_testo: "Ai sensi e per gli effetti degli articoli 1341 e 1342 del Codice civile, le parti accettano il contratto nella sua globalità ed espressamente le clausole: ART. 2) OGGETTO; ART. 3) DURATA; ART. 4) CORRISPETTIVO; ART. 5) OBBLIGHI DELLE PARTI; ART. 7) CLAUSOLA DI RISOLUZIONE DELLE CONTROVERSIE; ART. 8) TUTELA DELLA RISERVATEZZA E TRATTAMENTO DEI DATI PERSONALI",
      sig_clausole: "Firma Clausole",
      
      // Privacy
      priv_1_tit: "Accettazione privacy (obbligatorio per l'esecuzione del contratto) *",
      priv_1_txt: "Dichiaro di aver letto l'Informativa Privacy e acconsento al trattamento dei miei dati personali per l'esecuzione del contratto e gli adempimenti di legge.",
      priv_2_tit: "Comunicazione a terzi",
      priv_2_si: "Acconsento alla comunicazione dei miei dati a partner e fornitori terzi per l'organizzazione dell'evento, come indicato nell'informativa.",
      priv_no: "Non esprimo il consenso",
      priv_3_tit: "Community",
      priv_3_si: "Desidero iscrivermi alla newsletter per entrare nella Community di La Terra degli Aranci e ricevere inviti a eventi esclusivi (Acconsento al trattamento per finalità di marketing).",
      submitting: "Invio in corso..."
    },
    en: {
      title: "Sign Wedding Contract",
      sub: "Temporary space use and banqueting services agreement.",
      btn: "Submit signed contract",
      successTitle: "Contract submitted successfully!",
      successSub: "Thank you, we have received your signed wedding contract.",
      riepilogo: "Wedding Summary",
      numPrev: "Quote Number",
      prezzo: "Agreed Price (€)",
      
      // Contratto Testi
      c_scrittura: "Private agreement between:",
      c_santo: "“Santo Stefano S.r.l.”, with registered office in Naples at Piazzetta Santo Stefano 7, VAT number 06039150633, registered with the Naples Chamber of Commerce, represented by its pro tempore legal representative, Eng. Roberto Sola;",
      c_and: "AND",
      c_iovino: "“Iovino Banqueting S.r.l. soc. unipersonale”, with registered office in Casalnuovo di Napoli (NA) at Via Napoli no. 141, VAT number 06818681212, registered with the Naples Chamber of Commerce, represented by its pro tempore legal representative, Ms. Rosaria Iovino;",
      c_sig: "And Mr./Ms. (or Company Name)",
      c_cliente: "Hereinafter referred to as the “Client”.",
      c_premesso: "Given that",
      c_l1: "the company “Santo Stefano S.r.l.” owns the complex named “La Terra degli Aranci” located in Naples at Piazzetta S. Stefano no. 7;",
      c_l2: "the Client intends to temporarily use this complex and utilize the banqueting services (food and beverage supply, set-ups, and similar) offered by Iovino Banqueting S.r.l. soc. unipersonale;",
      c_l3: "the Client has inspected the premises, found them suitable for their needs, and declares their intention to use them for the following event: WEDDING RECEPTION",
      c_si_conviene: "IT IS AGREED AND STIPULATED AS FOLLOWS",
      c_art1_t: "Art. 1 – Premise",
      c_art1_c: "The premise, the documents referred to therein, as well as those considered connected to the latter, are integral parts of this agreement, a determining prerequisite and an essential pact of the same, as a whole and in every part.",
      c_art2_t: "Art. 2 – Subject matter",
      c_art2_c: "The Client takes use of the complex named “La Terra degli Aranci”, owned by “Santo Stefano S.r.l.”, for the WEDDING RECEPTION, entrusting “Iovino Banqueting S.r.l. soc. unipersonale”, which accepts, the service contract for the preparation and supply of food and beverages and the care of set-ups.",
      c_art3_t: "Art. 3 – Duration",
      c_art3_c1: "The Client acknowledges and accepts that, on the booked day, the use of the facility and related reception services must not extend beyond 8:00 PM for an event starting by 2:00 PM and beyond midnight for an evening event. A maximum tolerance of one hour from the agreed time is allowed for the conclusion of the reception. The venue closes a maximum of two hours after the agreed time. Should the reception conclude beyond the tolerance period, a surcharge of €1,000.00 will be applied.",
      c_art3_c2: "If the agreed menu includes an appetizer buffet, the Client acknowledges and accepts that it will open no later than two hours after the arrival of the first guests, even in the absence of the spouses. Any after-dinner party, to be held in Sala Tufo, is considered an additional service with a maximum closing time of 2:00 AM.",
      c_art4_t: "Art. 4 – Compensation",
      c_art4_c1: "The base price, which may be increased based on the attachment “La Terra degli Aranci – Wedding reception services”, is equal to:",
      c_art4_c2: "€ 130.00 (One hundred thirty/00) plus VAT (per adult);",
      c_art4_c3: "€ 50.00 (Fifty/00) plus VAT (per child);",
      c_art4_c4: "First deposit to be paid upon signing this contract to “Santo Stefano S.r.l.”:",
      c_art4_c5: "€ 1,500.00 (ONE THOUSAND FIVE HUNDRED/00)",
      c_art4_c6: "Second deposit to be paid 6 months prior to the event date to “Iovino Banqueting S.r.l. soc. unipersonale”:",
      c_art4_c7: "€ 3,000.00 (THREE THOUSAND/00)",
      c_art4_c8: "The indicated deposits are paid as an earnest money deposit and will be deducted from the total agreed amount to be paid on the day of the reception. Either party may withdraw from this contract by notifying the other via registered letter with return receipt with at least 30 days' notice from the reception date. In case of withdrawal by the Client, “Santo Stefano S.r.l.” and “Iovino Banqueting S.r.l. soc. unipersonale” are not required to refund any amount; otherwise, they shall be jointly required to return double the deposit received. The final number of guests must be communicated and delivered to the office within 10 days of the event date. This contract may be registered in case of use.",
      c_art5_t: "Art. 5 – Obligations of the parties",
      c_art5_c: "“Santo Stefano s.r.l.” and “Iovino Banqueting S.r.l. soc. unipersonale” assume no responsibility for any damage to people or property due to natural disasters. The Client assumes responsibility for damage they or their guests may cause to people or property. The Client acknowledges and accepts that “Santo Stefano S.r.l.” and “Iovino Banqueting S.r.l. soc. unipersonale” assume no responsibility regarding minors under 18 (accompanied or not) and assume no responsibility for any theft, robbery, loss, or deterioration of goods worn or brought by the Client or their guests, including money, cars, jewelry, or other valuables. The Client acknowledges and accepts that parking areas provided by “Santo Stefano S.r.l.” to the Client and their guests are not insured against damage or theft to parked cars. It is expressly forbidden for the Client or their guests to introduce and use fireworks, loose confetti, and/or streamer poppers within the facility. If a drone is used, necessary documentation and the contract with the operator, who is responsible for any damage, must be presented. Close-up filming of third-party properties is prohibited. The Client accepts that amplified music or loud instruments are prohibited outdoors and not beyond midnight. Any musical entertainment must be provided by the facility. The Client will bear all SIAE obligations and charges if live music is played, indemnifying the aforementioned companies from any civil or administrative liability due to law transgressions. Children's entertainment is mandatory (one entertainer per five children, aged 3 to 12). The companies assume no responsibility for suspensions in the supply of electricity, water, gas, or any other inconvenience beyond their control. Normal reception execution is guaranteed even in case of rain. To use the gardens in case of rain, a marquee can be rented subject to availability: an additional cost applies. In catastrophic events (epidemics, earthquakes, eruptions) requiring forced activity suspension, the deposit remains valid for a new booking within 12 months of reopening.",
      c_art6_t: "Art. 6 – Termination",
      c_art6_c: "The Client may unilaterally terminate this contract if the other parties fail to comply with any of the provisions herein, with effect pursuant to Art. 1456 of the Italian Civil Code, by communication sent via registered letter with return receipt.",
      c_art7_t: "Art. 7 – Dispute resolution clause",
      c_art7_c: "This private agreement is immediately valid and the contracting parties agree on the Court of Naples as the exclusive competent jurisdiction for the resolution and implementation of this contract.",
      c_art8_t: "Art. 8 – Privacy protection and personal data processing",
      c_art8_c: "Pursuant to Art. 13 of EU Regulation 2016/679 (GDPR) and Art. 13 of Legislative Decree 196/2003 and subsequent amendments, the parties acknowledge that the Client's personal data will be processed by Santo Stefano srl and Iovino Banqueting srl soc. unipersonale, each as an independent Data Controller, exclusively for purposes related to the conclusion, management, and execution of this contract, as well as the fulfillment of legal obligations.",
      
      // Form
      f_stipula: "Stipulate the contract as:",
      f_privato: "Private individual",
      f_azienda: "Company",
      f_nome: "First Name *",
      f_cognome: "Last Name *",
      f_ragione: "Company Name *",
      f_luogo_nascita: "Place of birth *",
      f_data_nascita: "Date of birth *",
      f_nazione: "Country *",
      f_italia: "Italy",
      f_estero: "Abroad",
      f_citta: "City of residence *",
      f_via: "Street Address *",
      f_civico: "House number *",
      f_piva: "VAT Number *",
      f_cf: "Tax Code / Fiscal Code",
      f_email: "Email *",
      f_telefono: "Phone number *",
      f_sdi: "SDI (Recipient Code)",
      f_partner_tit: "Partner's data (Who will marry...)",
      f_partner_n: "Spouse First Name *",
      f_partner_c: "Spouse Last Name *",
      f_data: "Wedding date and time *",
      
      // Pagamenti
      f_pagamenti_tit: "Payment Details (Agreed with management)",
      f_mezzo_anticipo: "Deposit payment method (e.g. Bank Transfer)",
      f_data_anticipo: "Deposit payment date *",
      f_mezzo_saldo: "Balance payment method",
      f_data_saldo: "Balance payment date *",
      
      // Firme
      sig_contratto: "Contract Signature",
      sig_clausole_testo: "Pursuant to and for the purposes of Articles 1341 and 1342 of the Italian Civil Code, the parties accept the contract in its entirety and expressly the clauses: ART. 2) SUBJECT MATTER; ART. 3) DURATION; ART. 4) COMPENSATION; ART. 5) OBLIGATIONS OF THE PARTIES; ART. 7) DISPUTE RESOLUTION CLAUSE; ART. 8) PRIVACY PROTECTION AND PERSONAL DATA PROCESSING.",
      sig_clausole: "Clauses Signature",
      
      // Privacy
      priv_1_tit: "Privacy acceptance (mandatory for contract execution) *",
      priv_1_txt: "I declare that I have read the Privacy Policy and consent to the processing of my personal data for the execution of the contract and legal obligations.",
      priv_2_tit: "Communication to third parties",
      priv_2_si: "I consent to the communication of my data to partners and third-party suppliers for event organization, as stated in the policy.",
      priv_no: "I do not consent",
      priv_3_tit: "Community",
      priv_3_si: "I wish to subscribe to the newsletter to join La Terra degli Aranci Community and receive invitations to exclusive events (I consent to processing for marketing purposes).",
      submitting: "Submitting..."
    }
  };

  const t = dict[lang];

  const onSubmit = async (data: any) => {
    setCustomError("");
    if (!firmaContratto || !firmaClausole) {
      setCustomError(lang === "it" ? "Per favore, apponi entrambe le firme prima di inviare." : "Please sign both signature fields before submitting.");
      return;
    }
    if (!data.accetto) {
      setCustomError(lang === "it" ? "Devi accettare l'informativa sulla privacy." : "You must accept the privacy policy.");
      return;
    }
    if (!data.comunicazione_terzi) {
      setCustomError(lang === "it" ? "Devi acconsentire alla comunicazione a terzi per poter usufruire dei servizi." : "You must consent to third-party communication to use our services.");
      return;
    }

    setIsSubmitting(true);
    
    if (data.nazione !== "Italia" && !data.codice_fiscale) {
      data.codice_fiscale = "XX";
    }

    const payload = {
      tipoContratto: "wedding",
      lingua: lang,
      preventivo: initialPreventivo,
      prezzo: initialPrezzo,
      datiCliente: {
        ...data,
        giorno_ed_ora_evento: data.data_evento,
        residenza: data.citta_di_residenza
      },
      firma_disegnata: firmaContratto,
      firma_disegnata_clausole: firmaClausole
    };

    const uniqueId = `contract_wedding_${Date.now()}`;

    try {
      // 1. Salvataggio immediato in locale come backup "a prova di bomba"
      localStorage.setItem(uniqueId, JSON.stringify(payload));

      // 2. Invia i dati all'API
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error("Errore API");

      // 3. Se tutto va bene, rimuoviamo il backup locale, la bozza, e mostriamo successo
      localStorage.removeItem(uniqueId);
      localStorage.removeItem("draft_wedding_form");
      setIsSuccess(true);
    } catch (e) {
      console.error(e);
      // In caso di errore (rete caduta o server down), diciamo all'utente che il file è al sicuro
      alert(lang === "it" 
        ? "C'è stato un problema di connessione o del server. I tuoi dati però NON sono persi: il contratto è stato salvato in modo sicuro sul tuo dispositivo e verrà processato automaticamente appena la connessione sarà stabile."
        : "There was a connection or server problem. Your data is NOT lost: the contract has been safely saved on your device and will be processed automatically as soon as the connection is stable.");
    }
    setIsSubmitting(false);
  };

  // 4. Auto-Retry al caricamento della pagina per recuperare contratti falliti
  useEffect(() => {
    const retryPendingContracts = async () => {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("contract_")) {
          const payloadStr = localStorage.getItem(key);
          if (payloadStr) {
            try {
              const payload = JSON.parse(payloadStr);
              console.log(`Tentativo di re-invio per il contratto sospeso: ${key}`);
              const response = await fetch("/api/generate-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
              });
              if (response.ok) {
                console.log(`Contratto ${key} ripristinato e inviato con successo!`);
                localStorage.removeItem(key);
              }
            } catch (err) {
              console.error(`Errore nel re-invio di ${key}:`, err);
            }
          }
        }
      }
    };
    
    // Controlliamo i contratti in sospeso all'avvio e ogni volta che la connessione torna online
    retryPendingContracts();
    window.addEventListener('online', retryPendingContracts);
    return () => window.removeEventListener('online', retryPendingContracts);
  }, []);

  if (isSuccess) {
    return (
      <div className="premium-card" style={{ textAlign: "center" }}>
        <h1>{t.successTitle}</h1>
        <p>{t.successSub}</p>
      </div>
    );
  }

  return (
    <div className="premium-card">
      <div className="lang-switcher" style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginBottom: "1rem" }}>
        <button type="button" onClick={() => setLang("it")} style={{ padding: "0.5rem 1rem", border: "none", borderRadius: "4px", background: lang === "it" ? "var(--primary)" : "#eee", color: lang === "it" ? "white" : "black", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500 }}>
          <img src="https://flagcdn.com/w40/it.png" width="20" alt="Italiana" style={{ borderRadius: "2px" }} /> Italiano
        </button>
        <button type="button" onClick={() => setLang("en")} style={{ padding: "0.5rem 1rem", border: "none", borderRadius: "4px", background: lang === "en" ? "var(--primary)" : "#eee", color: lang === "en" ? "white" : "black", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500 }}>
          <img src="https://flagcdn.com/w40/gb.png" width="20" alt="English" style={{ borderRadius: "2px" }} /> English
        </button>
      </div>

      <h1>{t.title}</h1>
      <p style={{ textAlign: "center", marginBottom: "2rem" }}>{t.sub}</p>

      <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem", border: "1px solid var(--border-color)" }}>
        <h2 style={{ marginTop: 0 }}>{t.riepilogo}</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>{t.numPrev}</label>
            <input type="text" readOnly value={initialPreventivo} />
          </div>
          <div className="form-group">
            <label>{t.prezzo}</label>
            <input type="text" readOnly value={initialPrezzo} />
          </div>
        </div>
      </div>

      <div className="contract-text">
        <p><strong>{t.c_scrittura}</strong></p>
        <p>{t.c_santo}</p>
        <p><strong>{t.c_and}</strong></p>
        <p>{t.c_iovino}</p>
        <p><strong>{t.c_sig}</strong></p>
        <p>{t.c_cliente}</p>
        <p><strong>{t.c_premesso}</strong></p>
        <ul>
          <li>{t.c_l1}</li>
          <li>{t.c_l2}</li>
          <li>{t.c_l3}</li>
        </ul>
        <p><strong>{t.c_si_conviene}</strong></p>
        <p><strong>{t.c_art1_t}</strong><br/>{t.c_art1_c}</p>
        <p><strong>{t.c_art2_t}</strong><br/>{t.c_art2_c}</p>
        <p><strong>{t.c_art3_t}</strong><br/>{t.c_art3_c1}<br/>{t.c_art3_c2}</p>
        <p><strong>{t.c_art4_t}</strong><br/>{t.c_art4_c1}<br/>{t.c_art4_c2}<br/>{t.c_art4_c3}<br/>{t.c_art4_c4}<br/>{t.c_art4_c5}<br/>{t.c_art4_c6}<br/>{t.c_art4_c7}<br/><br/>{t.c_art4_c8}</p>
        <p><strong>{t.c_art5_t}</strong><br/>{t.c_art5_c}</p>
        <p><strong>{t.c_art6_t}</strong><br/>{t.c_art6_c}</p>
        <p><strong>{t.c_art7_t}</strong><br/>{t.c_art7_c}</p>
        <p><strong>{t.c_art8_t}</strong><br/>{t.c_art8_c}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group full" style={{ marginBottom: "1.5rem" }}>
          <label>{t.f_stipula}</label>
          <div className="radio-group">
            <label className="radio-label">
              <input type="radio" value="privato" {...register("tipo_cliente")} />
              {t.f_privato}
            </label>
            <label className="radio-label">
              <input type="radio" value="azienda" {...register("tipo_cliente")} />
              {t.f_azienda}
            </label>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>{t.f_nome}</label>
            <input type="text" {...register("nome", { required: true })} />
          </div>
          <div className="form-group">
            <label>{t.f_cognome}</label>
            <input type="text" {...register("cognome", { required: true })} />
          </div>

          {tipoCliente === "azienda" && (
            <div className="form-group full">
              <label>{t.f_ragione}</label>
              <input type="text" {...register("ragione_sociale", { required: true })} />
            </div>
          )}

          <div className="form-group">
            <label>{t.f_luogo_nascita}</label>
            <input type="text" {...register("luogo_di_nascita", { required: true })} />
          </div>
          <div className="form-group">
            <label>{t.f_data_nascita}</label>
            <input type="date" {...register("data_di_nascita", { required: true })} />
          </div>

          <div className="form-group">
            <label>{t.f_nazione}</label>
            <select {...register("nazione")}>
              <option value="Italia">{t.f_italia}</option>
              <option value="Estero">{t.f_estero}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{t.f_citta}</label>
            <input type="text" {...register("citta_di_residenza", { required: true })} />
          </div>

          <div className="form-group">
            <label>{t.f_via}</label>
            <input type="text" {...register("indirizzo", { required: true })} />
          </div>
          <div className="form-group">
            <label>{t.f_civico}</label>
            <input type="text" {...register("numero_civico", { required: true })} />
          </div>

          {tipoCliente === "azienda" ? (
            <div className="form-group">
              <label>{t.f_piva}</label>
              <input type="text" {...register("partita_iva", { required: true })} />
            </div>
          ) : (
            <div className="form-group">
              <label>{t.f_cf} {nazione === "Italia" ? "*" : ""}</label>
              <input type="text" {...register("codice_fiscale", { required: nazione === "Italia" })} />
            </div>
          )}

          <div className="form-group">
            <label>{t.f_email}</label>
            <input type="email" {...register("email", { required: true })} />
          </div>
          <div className="form-group">
            <label>{t.f_telefono}</label>
            <input type="text" {...register("telefono", { required: true })} />
          </div>

          {tipoCliente === "azienda" && nazione === "Italia" && (
            <div className="form-group">
              <label>{t.f_sdi}</label>
              <input type="text" {...register("sdi")} />
            </div>
          )}

          <div className="form-group full" style={{ marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
            <h3>{t.f_partner_tit}</h3>
          </div>

          <div className="form-group">
            <label>{t.f_partner_n}</label>
            <input type="text" {...register("sposera_nome", { required: true })} />
          </div>
          <div className="form-group">
            <label>{t.f_partner_c}</label>
            <input type="text" {...register("sposera_cognome", { required: true })} />
          </div>

          <div className="form-group full" style={{ marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
            <label>{t.f_data}</label>
            <input type="datetime-local" {...register("data_evento", { required: true })} />
          </div>

          <div className="form-group full" style={{ marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
            <h3>{t.f_pagamenti_tit}</h3>
          </div>
          
          <div className="form-group">
            <label>{t.f_mezzo_anticipo}</label>
            <input type="text" {...register("mezzo_anticipo", { required: true })} />
          </div>
          <div className="form-group">
            <label>{t.f_data_anticipo}</label>
            <input type="date" {...register("data_anticipo", { required: true })} />
          </div>

          <div className="form-group">
            <label>{t.f_mezzo_saldo}</label>
            <input type="text" {...register("mezzo_saldo", { required: true })} />
          </div>
          <div className="form-group">
            <label>{t.f_data_saldo}</label>
            <input type="date" {...register("data_saldo", { required: true })} />
          </div>
        </div>

        <SignaturePad label={t.sig_contratto} onEnd={setFirmaContratto} initialData={firmaContratto} />
        
        <p style={{ marginTop: "2rem", fontSize: "0.9rem" }}>{t.sig_clausole_testo}</p>

        <SignaturePad label={t.sig_clausole} onEnd={setFirmaClausole} initialData={firmaClausole} />

        <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", margin: "2rem 0", border: "1px solid var(--border-color)" }}>
          <div className="form-group full" style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "1.1rem" }}>{t.priv_1_tit}</label>
            <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginTop: "0.5rem", fontWeight: 400, cursor: "pointer" }}>
              <input type="checkbox" {...register("accetto", { required: true })} style={{ marginTop: "0.3rem" }} />
              <span>{t.priv_1_txt}</span>
            </label>
          </div>

          <div className="form-group full" style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "1.1rem" }}>{t.priv_2_tit} *</label>
            <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginTop: "0.5rem", fontWeight: 400, cursor: "pointer" }}>
              <input type="checkbox" {...register("comunicazione_terzi", { required: true })} style={{ marginTop: "0.3rem" }} />
              <span>{t.priv_2_si}</span>
            </label>
          </div>

          <div className="form-group full">
            <label style={{ fontSize: "1.1rem" }}>{t.priv_3_tit}</label>
            <div className="radio-group" style={{ flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
              <label className="radio-label">
                <input type="radio" value="SI" {...register("marketing")} />
                {t.priv_3_si}
              </label>
              <label className="radio-label">
                <input type="radio" value="NO" {...register("marketing")} />
                {t.priv_no}
              </label>
            </div>
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div style={{ color: "red", fontWeight: 500, marginBottom: "1rem", textAlign: "center" }}>
            {lang === "it" ? "Compila tutti i campi obbligatori (*)" : "Please fill out all required fields (*)"}
          </div>
        )}
        {customError && (
          <div style={{ color: "red", fontWeight: 500, marginBottom: "1rem", textAlign: "center" }}>
            {customError}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? t.submitting : t.btn}
        </button>
      </form>
    </div>
  );
}
