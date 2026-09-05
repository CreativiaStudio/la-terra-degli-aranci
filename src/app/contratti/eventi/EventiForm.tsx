"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import SignaturePad from "@/components/SignaturePad";

export default function EventiForm({ initialPrezzo, initialPreventivo }: { initialPrezzo: string, initialPreventivo: string, initialData?: any }) {
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
      tipo_evento: "",
      data_evento: "",
      accetto: false,
      comunicazione_terzi: false,
      marketing: "NO"
    }
  });

  const tipoCliente = watch("tipo_cliente");
  const nazione = watch("nazione");
  const formValues = watch();

  // Recupera bozza salvata al caricamento
  useEffect(() => {
    const savedDraft = localStorage.getItem("draft_eventi_form");
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
      localStorage.setItem("draft_eventi_form", JSON.stringify(draft));
    }, 1000); // Debounce di 1 secondo
    return () => clearTimeout(timeoutId);
  }, [formValues, firmaContratto, firmaClausole]);

  const dict = {
    it: {
      title: "Firma del contratto",
      sub: "Contratto di concessione uso temporaneo spazi e servizi banqueting.",
      btn: "Invia il contratto firmato",
      successTitle: "Contratto inviato con successo!",
      successSub: "Grazie, abbiamo ricevuto il tuo contratto firmato.",
      riepilogo: "Riepilogo Evento",
      numPrev: "Numero Preventivo",
      prezzo: "Prezzo Concordato (€)",
      
      // Contratto Testi
      c_title: "Contratto di locazione temporanea",
      c_scrittura: "Scrittura privata tra:",
      c_santo: "La “Santo Stefano S.r.l.”, con sede legale in Napoli alla Piazzetta Santo Stefano 7 e Partita I.V.A. 06039150633 iscritta al registro delle imprese di Napoli, nella persona del legale rappresentante pro tempore ing. Roberto Sola;",
      c_and: "E",
      c_iovino: "la “Iovino Banqueting S.r.l. soc. unipersonale”, con sede legale in Casalnuovo di Napoli (NA) alla Via Napoli n. 141 e Partita I.V.A. 06818681212, iscritta al registro delle imprese di Napoli, nella persona del legale rappresentante pro tempore Sig.ra Rosaria Iovino;",
      c_sig: "Ed il Sig. (opp. ragione sociale)",
      c_conduttore: "D’ora innanzi denominato “Conduttore“.",
      c_richiede: "Con la firma della presente scrittura richiede l’uso del complesso “La Terra degli Aranci” con annessi giardini ivi inclusa la fruizione dei servizi di banqueting (somministrazione di cibo e bevande, allestimenti ecc…) curati dalla Iovino Banqueting s.r.l. soc. unipersonale con sede in Casalnuovo di Napoli (Na) alla via Napoli n° 141.",
      c_ispezionato: "Il Conduttore ha ispezionato i locali e avendoli trovati idonei alle proprie esigenze dichiara di volerli utilizzare per l'evento specificato nel modulo.",
      c_condizioni: "Condizioni generali del contratto:",
      c_p1: "L’ acconto viene versato a titolo di caparra confirmatoria e sarà imputato in conto prezzo all’atto del saldo complessivo dell’importo convenuto. Il saldo complessivo dell’importo convenuto dovrà essere versato il giorno stesso della locazione durante lo svolgimento dell’evento. I prezzi sono da intendersi al netto dell’iva. In caso di recesso dal presente impegno da parte del Conduttore, Santo Stefano S.r.l. non è tenuta a rendere alcuna somma. Nel caso contrario la Santo Stefano S.r.l. è tenuta alla restituzione del doppio della caparra. Il numero definitivo degli ospiti dovrà essere comunicato e consegnato in sede entro 10 gg dalla data dell’evento. Il presente contratto sarà registrato in caso d’uso.",
      c_p2: "Il Conduttore si assume la responsabilità dei danni che lo stesso i suoi ospiti possano arrecare a persone o cose. E’ espressamente vietato a qualsiasi titolo introdurre nella struttura e, tanto più usare, prodotti pirotecnici e coriandoli sfusi e/o a nastro. In caso di utilizzo di drone è necessario presentare il contratto con l’utilizzatore e la documentazione necessaria per l’utilizzo. E’ vietato effettuare inquadrature ravvicinate in proprietà aliene.",
      c_p3: "Il Conduttore prende atto e accetta che Santo Stefano S.r.l. non assume alcuna responsabilità riguardo i minori di 18 anni (accompagnati e non) come non assume alcuna responsabilità per eventuali furti, rapine, perdita o deterioramento dei beni indossati o portati dal Conduttore o dai suoi ospiti, con riferimento a danaro, automobili, gioielli, pellicce o altri valori. In particolare, le eventuali aree di sosta fornite dalla Santo Stefano s.r.l. al Conduttore ed ai suoi ospiti non sono assicurate per eventuali danni o furti alle automobili a cui è permessa la sosta.",
      c_p4: "L’animazione per i bambini risulta essere obbligatoria nella misura di un animatore ogni cinque bambini.",
      c_p5: "Il Conduttore prende atto e accetta che l’orario di utilizzo della struttura non dovrà prolungarsi oltre le ore 18.00 per un ricevimento iniziato a pranzo ed oltre le ore 24.00 per un ricevimento serale con inizio dalle ore 20.00.",
      c_p6: "Il ricevimento si intende terminato alla conclusione del buffet dei dolci e torta.",
      c_p7: "Il Conduttore accetta che è vietato svolgere musica amplificata o con strumenti squillanti e/o assordanti negli spazi esterni della struttura e comunque non oltre la mezzanotte e che qualsiasi intrattenimento musicale deve essere fornito dalla struttura e svolto previa presentazione della ricevuta di pagamento dei diritti S.I.A.E.",
      c_p8: "La Santo Stefano S.r.l non assume alcuna responsabilità per eventuali sospensioni nell’erogazione dell’energia elettrica, dell’acqua, del gas o qualsivoglia altro inconveniente comunque indipendente dalla propria volontà.",
      c_p9: "La locazione della struttura garantisce al Conduttore il normale svolgimento del ricevimento anche in caso di pioggia. Per l’utilizzo dei giardini in caso di pioggia è possibile noleggiare previa disponibilità una tensostruttura. Per tale servizio è previsto un costo aggiuntivo.",
      c_p10: "In caso di eventi catastrofici quali epidemie, terremoti, eruzioni o altri eventi naturali, che implichino la sospensione forzata dell’attività, la caparra versata per la stipula del presente contratto si intende valida per una nuova prenotazione da effettuarsi entro i 12 mesi dalla riapertura dell’attività.",
      
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
      f_tipo: "Tipo Evento *",
      f_battesimo: "Battesimo",
      f_comunione: "Comunione",
      f_laurea: "Laurea",
      f_festa: "Festa Privata",
      f_data: "Giorno ed ora dell'evento *",
      
      // Firme
      sig_contratto: "Firma Contratto",
      sig_clausole_testo: "Il Conduttore dichiara agli effetti dell’art. 1341 C.C. di accettare espressamente gli artt. 2,3,5,6,7,8,9,10 della presente scrittura.",
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
      title: "Sign Contract",
      sub: "Temporary space use and banqueting services agreement.",
      btn: "Submit signed contract",
      successTitle: "Contract submitted successfully!",
      successSub: "Thank you, we have received your signed contract.",
      riepilogo: "Event Summary",
      numPrev: "Quote Number",
      prezzo: "Agreed Price (€)",
      
      // Contratto Testi
      c_title: "Temporary lease agreement",
      c_scrittura: "Private agreement between:",
      c_santo: "“Santo Stefano S.r.l.”, with registered office in Naples at Piazzetta Santo Stefano 7, VAT number 06039150633, registered with the Naples Chamber of Commerce, represented by its pro tempore legal representative, Eng. Roberto Sola;",
      c_and: "AND",
      c_iovino: "“Iovino Banqueting S.r.l. soc. unipersonale”, with registered office in Casalnuovo di Napoli (NA) at Via Napoli no. 141, VAT number 06818681212, registered with the Naples Chamber of Commerce, represented by its pro tempore legal representative, Ms. Rosaria Iovino;",
      c_sig: "And Mr./Ms. (or Company Name)",
      c_conduttore: "Hereinafter referred to as the “Lessee“.",
      c_richiede: "By signing this agreement, the Lessee requests the use of the “La Terra degli Aranci” complex and adjoining gardens, including banqueting services (food and beverage supply, set-ups, etc.) managed by Iovino Banqueting s.r.l. soc. unipersonale based in Casalnuovo di Napoli (Na) at via Napoli no. 141.",
      c_ispezionato: "The Lessee has inspected the premises, found them suitable for their needs, and declares their intention to use them for the event specified in the form.",
      c_condizioni: "General terms and conditions:",
      c_p1: "The deposit is paid as an earnest money deposit and will be deducted from the total agreed amount upon final balance payment. The final balance must be paid on the day of the lease during the event. Prices are exclusive of VAT. In case of withdrawal by the Lessee, Santo Stefano S.r.l. is not required to refund any amount. Conversely, Santo Stefano S.r.l. must return double the deposit. The final number of guests must be communicated to the office within 10 days of the event date. This contract will be registered in case of use.",
      c_p2: "The Lessee assumes responsibility for any damage they or their guests may cause to people or property. It is expressly forbidden to introduce or use fireworks, loose confetti, and/or streamer poppers within the facility. If a drone is used, the contract with the operator and necessary documentation must be provided. Close-up filming of third-party properties is prohibited.",
      c_p3: "The Lessee acknowledges and accepts that Santo Stefano S.r.l. assumes no responsibility for minors under 18 (accompanied or not) and assumes no responsibility for any theft, robbery, loss, or damage to goods worn or brought by the Lessee or their guests, including money, cars, jewelry, furs, or other valuables. Specifically, any parking areas provided by Santo Stefano s.r.l. to the Lessee and their guests are not insured against damage or theft of parked vehicles.",
      c_p4: "Children's entertainment is mandatory, requiring one entertainer for every five children.",
      c_p5: "The Lessee acknowledges and accepts that the use of the facility must not extend beyond 6:00 PM for a lunch reception and beyond midnight for an evening reception starting at 8:00 PM.",
      c_p6: "The reception is considered concluded at the end of the dessert and cake buffet.",
      c_p7: "The Lessee accepts that amplified music or loud instruments are prohibited in the outdoor areas of the facility and, in any case, not beyond midnight. Any musical entertainment must be provided by the facility and performed upon presentation of the SIAE rights payment receipt.",
      c_p8: "Santo Stefano S.r.l assumes no responsibility for any suspension in the supply of electricity, water, gas, or any other inconvenience beyond its control.",
      c_p9: "The lease of the facility guarantees the normal execution of the reception even in case of rain. To use the gardens in case of rain, a marquee can be rented subject to availability. An additional cost applies for this service.",
      c_p10: "In the event of catastrophic events such as epidemics, earthquakes, eruptions, or other natural events requiring the forced suspension of activity, the deposit paid for this contract remains valid for a new booking to be made within 12 months of reopening.",
      
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
      f_tipo: "Event Type *",
      f_battesimo: "Baptism",
      f_comunione: "Communion",
      f_laurea: "Graduation",
      f_festa: "Private Party",
      f_data: "Event date and time *",
      
      // Firme
      sig_contratto: "Contract Signature",
      sig_clausole_testo: "Pursuant to Article 1341 of the Italian Civil Code, the Lessee expressly accepts Articles 2, 3, 5, 6, 7, 8, 9, 10 of this agreement.",
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
    
    // Fallback XX per CF stranieri
    if (data.nazione !== "Italia" && !data.codice_fiscale) {
      data.codice_fiscale = "XX";
    }

    const payload = {
      tipoContratto: "eventi",
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

    const uniqueId = `contract_eventi_${Date.now()}`;

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

      // 3. Se tutto va bene, rimuoviamo il backup locale, la bozza e mostriamo successo
      localStorage.removeItem(uniqueId);
      localStorage.removeItem("draft_eventi_form");
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
        <p><strong>{t.c_title}</strong></p>
        <p><strong>{t.c_scrittura}</strong></p>
        <p>{t.c_santo}</p>
        <p><strong>{t.c_and}</strong></p>
        <p>{t.c_iovino}</p>
        <p><strong>{t.c_sig}</strong></p>
        <p>{t.c_conduttore}</p>
        <p>{t.c_richiede}</p>
        <p>{t.c_ispezionato}</p>
        <p><strong>{t.c_condizioni}</strong></p>
        <ul>
          <li style={{marginBottom: "1rem"}}>{t.c_p1}</li>
          <li style={{marginBottom: "1rem"}}>{t.c_p2}</li>
          <li style={{marginBottom: "1rem"}}>{t.c_p3}</li>
          <li style={{marginBottom: "1rem"}}>{t.c_p4}</li>
          <li style={{marginBottom: "1rem"}}>{t.c_p5}</li>
          <li style={{marginBottom: "1rem"}}>{t.c_p6}</li>
          <li style={{marginBottom: "1rem"}}>{t.c_p7}</li>
          <li style={{marginBottom: "1rem"}}>{t.c_p8}</li>
          <li style={{marginBottom: "1rem"}}>{t.c_p9}</li>
          <li style={{marginBottom: "1rem"}}>{t.c_p10}</li>
        </ul>
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

          <div className="form-group full">
            <label>{t.f_tipo}</label>
            <select {...register("tipo_evento", { required: true })}>
              <option value="Battesimo">{t.f_battesimo}</option>
              <option value="Comunione">{t.f_comunione}</option>
              <option value="Laurea">{t.f_laurea}</option>
              <option value="Festa Privata">{t.f_festa}</option>
            </select>
          </div>
          <div className="form-group full">
            <label>{t.f_data}</label>
            <input type="datetime-local" {...register("data_evento", { required: true })} />
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
