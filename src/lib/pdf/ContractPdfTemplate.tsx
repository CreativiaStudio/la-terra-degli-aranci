import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Stili base
const styles = StyleSheet.create({
  page: { padding: 40, paddingBottom: 75, fontFamily: 'Times-Roman', fontSize: 11, lineHeight: 1.5, color: '#000000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, alignItems: 'center' },
  title: { fontSize: 13, fontFamily: 'Times-Bold', textAlign: 'center', marginBottom: 15 },
  bold: { fontFamily: 'Times-Bold' },
  paragraph: { marginBottom: 10, textAlign: 'justify' },
  list: { marginLeft: 15, marginBottom: 10 },
  listItem: { flexDirection: 'row', marginBottom: 6, textAlign: 'justify' },
  bullet: { width: 15 },
  signatureSection: { marginTop: 15, flexDirection: 'row', justifyContent: 'space-between' },
  signatureBlock: { width: 150 },
  signatureImage: { height: 40, objectFit: 'contain', marginTop: 5, borderBottom: '1px solid #000' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: '2px solid #e27d3b', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  checkbox: { width: 10, height: 10, border: '1px solid #000', marginRight: 5, textAlign: 'center', fontSize: 8, lineHeight: 1 },
});

export const ContractPdfTemplate = ({ 
  tipoContratto, 
  lang, 
  data, 
  preventivo, 
  prezzo, 
  firmaContratto,
  firmaClausole,
  logoPath,
  logoRightPath,
  firmaRobertoPath,
  firmaRosariaPath
}: any) => {

  const isWedding = tipoContratto === 'wedding';
  const isEvent = tipoContratto === 'eventi';

  // Format the event date if present (from datetime-local "YYYY-MM-DDTHH:mm")
  let dataEventoStr = "______________";
  let oraEventoStr = "________";
  if (isEvent && data.giorno_ed_ora_evento) {
    try {
      const parts = data.giorno_ed_ora_evento.split("T");
      if (parts.length === 2) {
        dataEventoStr = parts[0].split("-").reverse().join("/");
        oraEventoStr = parts[1];
      } else {
        dataEventoStr = data.giorno_ed_ora_evento;
      }
    } catch(e) {}
  }
  const isEn = lang === 'en';
  
  const dataMatrimonio = data.data_evento ? new Date(data.data_evento).toLocaleDateString('it-IT') : '';
  const dataNascita = data.data_di_nascita ? new Date(data.data_di_nascita).toLocaleDateString('it-IT') : '';
  const orarioInizio = data.data_evento ? new Date(data.data_evento).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '';
  const todayDate = new Date().toLocaleDateString('it-IT');

  const Footer = () => (
    <View style={styles.footer} fixed>
      <Text>Piazzetta S. Stefano, 7{'\n'}Napoli (Vomero)</Text>
      <Text>+39 081 714 87 68{'\n'}info@laterradegliaranci.it</Text>
      <Text>@terraaranci{'\n'}www.laterradegliaranci.it</Text>
    </View>
  );

  const Header = () => (
    <View style={styles.header} fixed>
      {logoPath && (
         <Image src={logoPath} style={{ width: 80, height: 80, objectFit: 'contain' }} />
      )}
      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
        {logoRightPath ? (
           <Image src={logoRightPath} style={{ width: 180, height: 40, objectFit: 'contain' }} />
        ) : (
           <Text style={{ fontSize: 24, color: '#807261', fontFamily: 'Times-Roman', letterSpacing: 1 }}>La Terra degli Aranci</Text>
        )}
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header />
        <Footer />

        <Text style={styles.title}>{isWedding ? (isEn ? "Wedding Reception" : "Ricevimento di Matrimonio") : (isEn ? "Temporary lease agreement" : "Contratto di locazione temporanea")}</Text>
        <Text style={styles.title}>{isEn ? "Private agreement between" : "Scrittura privata tra"}</Text>
        
        <Text style={styles.paragraph}>
          {isEn 
            ? "“Santo Stefano S.r.l.”, with registered office in Naples at Piazzetta Santo Stefano 7, VAT number 06039150633, registered with the Naples Chamber of Commerce, represented by its pro tempore legal representative, Eng. Roberto Sola;"
            : "La “Santo Stefano S.r.l.”, con sede legale in Napoli alla Piazzetta Santo Stefano 7 e Partita I.V.A. 06039150633 iscritta al registro delle imprese di Napoli, nella persona del legale rappresentante pro tempore ing. Roberto Sola;"}
        </Text>
        <Text style={[styles.paragraph, styles.bold, { textAlign: 'center' }]}>{isEn ? "AND" : "E"}</Text>
        <Text style={styles.paragraph}>
          {isEn
            ? "“Iovino Banqueting S.r.l. soc. unipersonale”, with registered office in Casalnuovo di Napoli (NA) at Via Napoli no. 141, VAT number 06818681212, registered with the Naples Chamber of Commerce, represented by its pro tempore legal representative, Ms. Rosaria Iovino;"
            : "la “Iovino Banqueting S.r.l. soc. unipersonale”, con sede legale in Casalnuovo di Napoli (NA) alla Via Napoli n. 141 e Partita I.V.A. 06818681212, iscritta al registro delle imprese di Napoli, nella persona del legale rappresentante pro tempore Sig.ra Rosaria Iovino;"}
        </Text>
        <Text style={[styles.paragraph, styles.bold, { textAlign: 'center' }]}>{isEn ? "AND" : "E"}</Text>
        
        <View style={styles.paragraph}>
          <Text style={styles.bold}>{isEn ? "And Mr./Ms. (or Company Name)" : "Ed il Sig. (opp. ragione sociale)"}</Text>
          <Text>{data.nome} {data.cognome}</Text>
          {data.ragione_sociale ? <Text>{isEn ? "Company Name:" : "Ragione sociale:"} {data.ragione_sociale}</Text> : null}
          <Text>{isEn ? "born in" : "nato a"} {data.luogo_di_nascita}, {isEn ? "on" : "il"} {dataNascita}, {isEn ? "resident in" : "residente a"} {data.residenza}</Text>
          <Text>{isEn ? "at street/square" : "in via/piazza"} {data.indirizzo}, n. {data.numero_civico}, {isEn ? "ZIP" : "CAP"} {data.cap}, {data.nazione}</Text>
          <Text>{isEn ? "Tax Code" : "C.F."} {data.codice_fiscale}{data.partita_iva ? `, (${isEn ? "VAT" : "P.IVA"}) ${data.partita_iva}` : ''}</Text>
          <Text>tel {data.telefono} mail {data.email}</Text>
          <Text>{data.sdi ? `(SDI) ${data.sdi} ` : ''}{data.pec ? `(PEC) ${data.pec} ` : ''}{data.sdi || data.pec ? ', ' : ''}{isEn ? `hereinafter referred to as "${isWedding ? "Client" : "Lessee" }".` : `d'ora innanzi denominato "${isWedding ? "Cliente" : "Conduttore"}".`}</Text>
          {isWedding ? (
            <Text style={{ marginTop: 5, fontFamily: 'Times-Bold' }}>
              {isEn ? "Who will marry" : "Che sposerà"} {data.sposera_nome} {data.sposera_cognome}
            </Text>
          ) : null}
        </View>

        {isWedding ? (
          <View>
            <Text style={[styles.paragraph, styles.bold, { textAlign: 'center' }]}>{isEn ? "GIVEN THAT" : "PREMESSO CHE"}</Text>
            <View style={styles.list}>
              <View style={styles.listItem}><Text style={styles.bullet}>•</Text><Text>{isEn ? "the company “Santo Stefano S.r.l.” owns the complex named “La Terra degli Aranci” located in Naples at Piazzetta S. Stefano no. 7;" : "la società \"Santo Stefano S.r.l.\" è proprietaria del complesso denominato \"La Terra degli Aranci\" sito in Napoli alla Piazzetta S. Stefano n. 7;"}</Text></View>
              <View style={styles.listItem}><Text style={styles.bullet}>•</Text><Text>{isEn ? "the Client intends to temporarily use this complex and utilize the banqueting services (food and beverage supply, set-ups, and similar) offered by Iovino Banqueting S.r.l. soc. unipersonale;" : "il Cliente intende prendere in uso temporaneo tale complesso ed avvalersi dei servizi di banqueting (somministrazione di cibo e bevande, allestimenti et similia) offerti dalla società Iovino Banqueting S.r.l. soc. uni personale;"}</Text></View>
              <View style={styles.listItem}><Text style={styles.bullet}>•</Text><Text>{isEn ? "the Client has inspected the premises, found them suitable for their needs, and declares their intention to use them for the following event: WEDDING RECEPTION." : "il Cliente ha ispezionato i locali e avendoli trovati idonei alle proprie esigenze dichiara di volerli utilizzare per il seguente evento: RICEVIMENTO DI MATRIMONIO."}</Text></View>
            </View>

            <Text style={[styles.title, {marginTop: 10}]}>{isEn ? "IT IS AGREED AND STIPULATED AS FOLLOWS" : "SI CONVIENE E SI STIPULA QUANTO SEGUE"}</Text>
            
            <Text style={[styles.bold, {textAlign: 'center', marginBottom: 5}]}>{isEn ? "Art. 1 - Premise" : "Art. 1 — Premessa"}</Text>
            <Text style={styles.paragraph}>
              {isEn ? "The premise, the documents referred to therein, as well as those considered connected to the latter, are integral parts of this agreement, a determining prerequisite and an essential pact of the same, as a whole and in every part." : "La premessa, i documenti in essa richiamati, nonché quelli a quest'ultimi da considerarsi connessi, sono parti integranti del presente accordo, presupposto determinante e patto essenziale dello stesso, nel suo insieme ed in ogni sua parte."}
            </Text>

            <Text style={[styles.bold, {textAlign: 'center', marginBottom: 5, marginTop: 10}]}>{isEn ? "Art. 2 - Subject matter" : "Art. 2 — Oggetto"}</Text>
            <Text style={styles.paragraph}>
              {isEn ? "The Client takes use of the complex named “La Terra degli Aranci”, owned by “Santo Stefano S.r.l.”, for the WEDDING RECEPTION, entrusting “Iovino Banqueting S.r.l. soc. unipersonale”, which accepts, the service contract for the preparation and supply of food and beverages and the care of set-ups." : "Il Cliente prende in uso il complesso denominato \"La Terra degli Aranci\", di proprietà della società \"Santo Stefano S.r.l.\", per il RICEVIMENTO DI MATRIMONIO, affidando alla società \"Iovino Banqueting S.r.l. soc. unipersonale\", che accetta, l'appalto di servizio di preparazione e somministrazione di alimenti e bevande e di cura degli allestimenti."}
            </Text>

            <Text style={[styles.bold, {textAlign: 'center', marginBottom: 5, marginTop: 10}]}>{isEn ? "Art. 3 - Duration" : "Art. 3 — Durata"}</Text>
            <Text style={styles.paragraph}>
              {isEn ? "The Client acknowledges and accepts that, on the booked day, the use of the facility and related reception services must not extend beyond 8:00 PM for an event starting by 2:00 PM and beyond midnight for an evening event. A maximum tolerance of one hour from the agreed time is allowed for the conclusion of the reception. The venue closes a maximum of two hours after the agreed time. Should the reception conclude beyond the tolerance period, a surcharge of €1,000.00 will be applied.\nIf the agreed menu includes an appetizer buffet, the Client acknowledges and accepts that it will open no later than two hours after the arrival of the first guests, even in the absence of the spouses. Any after-dinner party, to be held in Sala Tufo, is considered an additional service with a maximum closing time of 2:00 AM." : "Il Cliente prende atto e accetta che, nel giorno prenotato, l'orario di utilizzo della struttura e dei relativi servizi per il ricevimento non dovrà prolungarsi oltre le ore 20,00 per un evento iniziato entro le ore 14,00 ed oltre le ore 24,00 per un evento serale. Per la conclusione del ricevimento è prevista una tolleranza massima di un'ora dall'orario convenuto. La chiusura della location è prevista al massimo due ore dopo l'orario convenuto. Nel caso il ricevimento si concluda oltre l'orario di tolleranza sarà applicato un supplemento di €1.000,00.\nNel caso il menu concordato preveda il buffet di antipasti il Cliente prende atto e accetta che lo stesso si aprirà al più due ore dopo l'arrivo dei primi ospiti, quindi anche in assenza degli sposi. Un eventuale after dinner, da svolgersi in Sala Tufo, è considerato un servizio supplementare il cui orario massimo di chiusura è alle ore 2,00."}
            </Text>

            <Text style={[styles.bold, {textAlign: 'center', marginBottom: 5, marginTop: 10}]}>{isEn ? "Art. 4 - Compensation" : "Art. 4 — Corrispettivo"}</Text>
            <Text style={styles.paragraph}>
              {isEn ? "The indicated deposits are paid as an earnest money deposit and will be deducted from the total agreed amount to be paid on the day of the reception. Either party may withdraw from this contract by notifying the other via registered letter with return receipt with at least 30 days' notice from the reception date. In case of withdrawal by the Client, “Santo Stefano S.r.l.” and “Iovino Banqueting S.r.l. soc. unipersonale” are not required to refund any amount; otherwise, they shall be jointly required to return double the deposit received. The final number of guests must be communicated and delivered to the office within 10 days of the event date. This contract may be registered in case of use." : "Gli acconti indicati vengono versati a titolo di caparra confirmatoria e saranno imputati in conto prezzo all’atto del saldo complessivo dell’importo convenuto che sarà versato il giorno del ricevimento. Ciascuna parte potrà recedere dal presente contratto dandone comunicazione all’altra con lettera raccomandata a/r con preavviso di almeno 30 giorni dalla data del ricevimento. In caso di recesso dal presente impegno da parte del Cliente, le società “Santo Stefano S.r.l.” e “Iovino Banqueting S.r.l. soc. unipersonale” non saranno tenute a rendere alcun importo; nel caso contrario, le società “Santo Stefano S.r.l.” e “Iovino Banqueting S.r.l. soc. unipersonale” saranno tenute, solidalmente, alla restituzione del doppio della caparra ricevuta. Il numero definitivo degli ospiti dovrà essere comunicato e consegnato in sede entro 10 gg dalla data dell’evento. Il presente contratto potrà essere registrato in caso di uso."}
            </Text>

            <View wrap={false}>
              <Text style={[styles.bold, {textAlign: 'center', marginBottom: 5, marginTop: 10}]}>{isEn ? "Art. 5 - Obligations of the parties" : "Art. 5 – Obblighi delle parti"}</Text>
              <Text style={styles.paragraph}>
                {isEn ? "“Santo Stefano s.r.l.” and “Iovino Banqueting S.r.l. soc. unipersonale” assume no responsibility for any damage to people or property due to natural disasters. The Client assumes responsibility for damage they or their guests may cause to people or property. The Client acknowledges and accepts that “Santo Stefano S.r.l.” and “Iovino Banqueting S.r.l. soc. unipersonale” assume no responsibility regarding minors under 18 (accompanied or not) and assume no responsibility for any theft, robbery, loss, or deterioration of goods worn or brought by the Client or their guests, including money, cars, jewelry, or other valuables. The Client acknowledges and accepts that parking areas provided by “Santo Stefano S.r.l.” to the Client and their guests are not insured against damage or theft to parked cars. It is expressly forbidden for the Client or their guests to introduce and use fireworks, loose confetti, and/or streamer poppers within the facility. If a drone is used, necessary documentation and the contract with the operator, who is responsible for any damage, must be presented. Close-up filming of third-party properties is prohibited. The Client accepts that amplified music or loud instruments are prohibited outdoors and not beyond midnight. Any musical entertainment must be provided by the facility. The Client will bear all SIAE obligations and charges if live music is played, indemnifying the aforementioned companies from any civil or administrative liability due to law transgressions.\nChildren's entertainment is mandatory (one entertainer per five children, aged 3 to 12). The companies assume no responsibility for suspensions in the supply of electricity, water, gas, or any other inconvenience beyond their control. Normal reception execution is guaranteed even in case of rain. To use the gardens in case of rain, a marquee can be rented subject to availability: an additional cost applies. In catastrophic events (epidemics, earthquakes, eruptions) requiring forced activity suspension, the deposit remains valid for a new booking within 12 months of reopening." : "La “Santo Stefano s.r.l.” e la “Iovino Banqueting S.r.l. soc. unipersonale”, non assumono alcuna responsabilità per eventuali danni occorsi a cose o persone dovuti a calamità naturali. Il Cliente si assume la responsabilità dei danni che lo stesso o i suoi ospiti possano arrecare a persone o cose. Il Cliente prende atto e accetta che le società “Santo Stefano S.r.l.” e “Iovino Banqueting S.r.l. soc. unipersonale” non assumono alcuna responsabilità riguardo i minori di 18 anni (accompagnati e non) come non assumono alcuna responsabilità per eventuali furti, rapine, perdita o deterioramento dei beni indossati o portati dal Cliente ovvero dai suoi ospiti, con riferimento a denaro, automobili, gioielli o altri valori. Il Cliente prende atto e accetta che le aree di sosta fornite dalla “Santo Stefano S.r.l.” al Cliente ed ai suoi ospiti non sono assicurate per eventuali danni o furti alle automobili a cui è permessa la sosta. È espressamente vietato al Cliente, ovvero ai suoi ospiti, a qualsiasi titolo, introdurre nella struttura e, tanto più usare, prodotti pirotecnici e coriandoli sfusi e/o a nastro. In caso di utilizzo di drone è necessario presentare la documentazione necessaria all’utilizzo e il contratto con l’utilizzatore che è responsabile per eventuali danni arrecati a cose o persone. É vietato effettuare inquadrature ravvicinate in proprietà aliene. Il Cliente accetta che è vietato svolgere musica amplificata o con strumenti squillanti e/o assordanti negli spazi esterni della struttura e non oltre la mezzanotte. Qualsiasi intrattenimento musicale deve essere fornito dalla struttura. Il Cliente si farà carico di adempiere a tutti gli oneri ed obblighi con la SIAE, qualora nei locali si diffonda musica dal vivo, e manleva le società indicate da qualsiasi responsabilità civile o amministrativa, dovuta a trasgressioni della legge.\nL’animazione per i bambini risulta essere obbligatoria nella misura di un animatore ogni cinque bambini, dovendosi in tal sede intendere come bambini i minori compresi dagli anni 3 agli anni 12. Le società “Santo Stefano S.r.l.” e “Iovino Banqueting S.r.l. soc. unipersonale” non assumono alcuna responsabilità per eventuali sospensioni nell’erogazione dell’energia elettrica, dell’acqua, del gas o qualsivoglia altro inconveniente comunque indipendente dalla propria volontà. È garantito al Cliente il normale svolgimento del ricevimento anche in caso di pioggia. Per l’utilizzo dei giardini in caso di pioggia è possibile noleggiare, previa disponibilità, una tendostruttura: per tale servizio è previsto un costo aggiuntivo. In caso di eventi catastrofici quali epidemie, terremoti, eruzioni o altri eventi naturali, che implichino la sospensione forzata dell’attività, la caparra versata per la stipula del presente contratto si intende valida per una nuova prenotazione da effettuarsi entro i 12 mesi dalla riapertura dell’attività."}
              </Text>
            </View>

            <View wrap={false}>
              <Text style={[styles.bold, {textAlign: 'center', marginBottom: 5, marginTop: 10}]}>{isEn ? "Art. 6 - Termination" : "Art. 6 – Risoluzione"}</Text>
              <Text style={styles.paragraph}>
                {isEn ? "The Client may unilaterally terminate this contract if the other parties fail to comply with any of the provisions herein, with effect pursuant to Art. 1456 of the Italian Civil Code, by communication sent via registered letter with return receipt." : "Il Cliente potrà risolvere unilateralmente il presente contratto qualora le altre parti si siano rese inadempienti ad una delle pattuizioni qui previste, con effetto ai sensi dell’art. 1456 c.c., mediante comunicazione, inviata a mezzo raccomandata a.r."}
              </Text>
            </View>

            <View wrap={false}>
              <Text style={[styles.bold, {textAlign: 'center', marginBottom: 5, marginTop: 10}]}>{isEn ? "Art. 7 - Dispute resolution clause" : "Art. 7 – Clausola di risoluzione delle controversie"}</Text>
              <Text style={styles.paragraph}>
                {isEn ? "This private agreement is immediately valid and the contracting parties agree on the Court of Naples as the exclusive competent jurisdiction for the resolution and implementation of this contract." : "La presente scrittura privata ha validità immediata e le parti contrattuali convengono come foro competente ed esclusivo, per la risoluzione e l’attuazione del presente contratto, il foro di Napoli."}
              </Text>
            </View>

            <View wrap={false}>
              <Text style={[styles.bold, {textAlign: 'center', marginBottom: 5, marginTop: 10}]}>{isEn ? "Art. 8 - Privacy protection and personal data processing" : "Art. 8 – Tutela della riservatezza e trattamento dei dati personali"}</Text>
              <Text style={styles.paragraph}>
                {isEn ? "Pursuant to Art. 13 of EU Regulation 2016/679 (GDPR) and Art. 13 of Legislative Decree 196/2003 and subsequent amendments, the parties acknowledge that the Client's personal data will be processed by Santo Stefano srl and Iovino Banqueting srl soc. unipersonale, each as an independent Data Controller, exclusively for purposes related to the conclusion, management, and execution of this contract, as well as the fulfillment of legal obligations." : "Ai sensi dell'art. 13 del Regolamento UE n. 2016/679 (GDPR) ed art. 13 del D.lgs 196/2003 e s.m.i., le parti danno atto che i dati personali che riguardano il Cliente saranno trattati dalla Santo Stefano srl e dalla Iovino Banqueting srl soc. unipersonale, ciascuna in qualità di autonoma Titolare del trattamento, esclusivamente per finalità connesse alla conclusione, gestione ed esecuzione del presente contratto, nonché per l’adempimento di obblighi di legge."}
              </Text>
            </View>

            <Text style={{ marginTop: 20 }}>{isEn ? "Date and place, Naples," : "Data e luogo, Napoli,"} {todayDate}</Text>

          </View>
        ) : <View />}

        {isEvent ? (
          <View>
            <Text style={styles.paragraph}>
              {isEn ? `By signing this agreement, the Lessee requests the use of the “La Terra degli Aranci” complex and adjoining gardens for the day ${dataEventoStr} at ${oraEventoStr} including banqueting services (food and beverage supply, set-ups, etc.) managed by Iovino Banqueting s.r.l. soc. unipersonale based in Casalnuovo di Napoli (Na) at via Napoli no. 141.\nThe Lessee has inspected the premises, found them suitable for their needs, and declares their intention to use them for the following event: ` : `Il conduttore con la firma della presente scrittura richiede l’uso del complesso “La Terra degli Aranci” con annessi giardini per il giorno ${dataEventoStr} alle ore ${oraEventoStr} ivi inclusa la fruizione dei servizi di banqueting (somministrazione di cibo e bevande, allestimenti ecc…) curati dalla Iovino Banqueting s.r.l. soc. unipersonale con sede in Casalnuovo di Napoli (Na) alla via Napoli n° 141.\nIl Conduttore ha ispezionato i locali e avendoli trovati idonei alle proprie esigenze dichiara di volerli utilizzare per il seguente evento: `}
              <Text style={styles.bold}>{data.tipo_evento || "______________"}</Text>
            </Text>

            <Text style={[styles.title, {marginTop: 15}]}>{isEn ? "General terms and conditions" : "Condizioni generali del contratto"}</Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>1.</Text> {isEn ? "The deposit is paid as an earnest money deposit and will be deducted from the total agreed amount upon final balance payment. The final balance must be paid on the day of the lease during the event. Prices are exclusive of VAT. In case of withdrawal by the Lessee, Santo Stefano S.r.l. is not required to refund any amount. Conversely, Santo Stefano S.r.l. must return double the deposit. The final number of guests must be communicated to the office within 10 days of the event date. This contract will be registered in case of use." : "L’ acconto viene versato a titolo di caparra confirmatoria e sarà imputato in conto prezzo all’atto del saldo complessivo dell’importo convenuto. Il saldo complessivo dell’importo convenuto dovrà essere versato il giorno stesso della locazione durante lo svolgimento dell’evento. I prezzi sono da intendersi al netto dell’iva. In caso di recesso dal presente impegno da parte del Conduttore, Santo Stefano S.r.l. non è tenuta a rendere alcuna somma. Nel caso contrario la Santo Stefano S.r.l. è tenuta alla restituzione del doppio della caparra. Il numero definitivo degli ospiti dovrà essere comunicato e consegnato in sede entro 10 gg dalla data dell’evento. Il presente contratto sarà registrato in caso d’uso."}
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>2.</Text> {isEn ? "The Lessee assumes responsibility for any damage they or their guests may cause to people or property. It is expressly forbidden to introduce or use fireworks, loose confetti, and/or streamer poppers within the facility. If a drone is used, the contract with the operator and necessary documentation must be provided. Close-up filming of third-party properties is prohibited." : "Il Conduttore si assume la responsabilità dei danni che lo stesso i suoi ospiti possano arrecare a persone o cose. E’ espressamente vietato a qualsiasi titolo introdurre nella struttura e, tanto più usare, prodotti pirotecnici e coriandoli sfusi e/o a nastro. In caso di utilizzo di drone è necessario presentare il contratto con l’utilizzatore e la documentazione necessaria per l’utilizzo. E’ vietato effettuare inquadrature ravvicinate in proprietà aliene."}
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.</Text> {isEn ? "The Lessee acknowledges and accepts that Santo Stefano S.r.l. assumes no responsibility for minors under 18 (accompanied or not) and assumes no responsibility for any theft, robbery, loss, or damage to goods worn or brought by the Lessee or their guests, including money, cars, jewelry, furs, or other valuables. Specifically, any parking areas provided by Santo Stefano s.r.l. to the Lessee and their guests are not insured against damage or theft of parked vehicles." : "Il Conduttore prende atto e accetta che Santo Stefano S.r.l. non assume alcuna responsabilità riguardo i minori di 18 anni (accompagnati e non) come non assume alcuna responsabilità per eventuali furti, rapine, perdita o deterioramento dei beni indossati o portati dal Conduttore o dai suoi ospiti, con riferimento a danaro, automobili, gioielli, pellicce o altri valori. In particolare, le eventuali aree di sosta fornite dalla Santo Stefano s.r.l. al Conduttore ed ai suoi ospiti non sono assicurate per eventuali danni o furti alle automobili a cui è permessa la sosta."}
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>4.</Text> {isEn ? "Children's entertainment is mandatory, requiring one entertainer for every five children." : "L’animazione per i bambini risulta essere obbligatoria nella misura di un animatore ogni cinque bambini."}
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>5.</Text> {isEn ? "The Lessee acknowledges and accepts that the use of the facility must not extend beyond 6:00 PM for a lunch reception and beyond midnight for an evening reception starting at 8:00 PM." : "Il Conduttore prende atto e accetta che l’orario di utilizzo della struttura non dovrà prolungarsi oltre le ore 18.00 per un ricevimento iniziato a pranzo ed oltre le ore 24.00 per un ricevimento serale con inizio dalle ore 20.00."}
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>6.</Text> {isEn ? "The reception is considered concluded at the end of the dessert and cake buffet." : "Il ricevimento si intende terminato alla conclusione del buffet dei dolci e torta."}
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>7.</Text> {isEn ? "The Lessee accepts that amplified music or loud instruments are prohibited in the outdoor areas of the facility and, in any case, not beyond midnight. Any musical entertainment must be provided by the facility and performed upon presentation of the SIAE rights payment receipt." : "Il Conduttore accetta che è vietato svolgere musica amplificata o con strumenti squillanti e/o assordanti negli spazi esterni della struttura e comunque non oltre la mezzanotte e che qualsiasi intrattenimento musicale deve essere fornito dalla struttura e svolto previa presentazione della ricevuta di pagamento dei diritti S.I.A.E."}
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>8.</Text> {isEn ? "Santo Stefano S.r.l assumes no responsibility for any suspension in the supply of electricity, water, gas, or any other inconvenience beyond its control." : "La Santo Stefano S.r.l non assume alcuna responsabilità per eventuali sospensioni nell’erogazione dell’energia elettrica, dell’acqua, del gas o qualsivoglia altro inconveniente comunque indipendente dalla propria volontà."}
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>9.</Text> {isEn ? "The lease of the facility guarantees the normal execution of the reception even in case of rain. To use the gardens in case of rain, a marquee can be rented subject to availability. An additional cost applies for this service." : "La locazione della struttura garantisce al Conduttore il normale svolgimento del ricevimento anche in caso di pioggia. Per l’utilizzo dei giardini in caso di pioggia è possibile noleggiare previa disponibilità una tensostruttura. Per tale servizio è previsto un costo aggiuntivo."}
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>10.</Text> {isEn ? "In the event of catastrophic events such as epidemics, earthquakes, eruptions, or other natural events requiring the forced suspension of activity, the deposit paid for this contract remains valid for a new booking to be made within 12 months of reopening." : "In caso di eventi catastrofici quali epidemie, terremoti, eruzioni o altri eventi naturali, che implichino la sospensione forzata dell’attività, la caparra versata per la stipula del presente contratto si intende valida per una nuova prenotazione da effettuarsi entro i 12 mesi dalla riapertura dell’attività."}
            </Text>

            <Text style={styles.paragraph}>
              {isEn ? "Price agreed:" : "Prezzo: concordato:"}{'\n'}
              - Sala Bianca e Giardino Mediterraneo: € + iva{'\n'}
              - Sala Tufo e Giardino delle Promesse: € + iva{'\n'}{'\n'}
              {isEn ? "First Deposit: €1.000,00 (One thousand/00) by bank transfer to Santo Stefano srl (Iban IT10D0303203410010000000169)." : "Primo Acconto: €1.000,00 (Mille/00) a mezzo bonifico alla Santo Stefano srl (Iban IT10D0303203410010000000169)."}
            </Text>
          </View>
        ) : <View />}

        <View wrap={false}>
          <Text style={{ marginTop: 15, fontSize: 10 }}>{isEn ? "Date and place, Naples," : "Data e luogo, Napoli,"} {todayDate}</Text>
          <View style={styles.signatureSection}>
            <View style={styles.signatureBlock}>
              <Text style={[styles.bold, {fontSize: 10}]}>Santo Stefano S.r.l.</Text>
              {firmaRobertoPath ? <Image src={firmaRobertoPath} style={styles.signatureImage} /> : null}
            </View>
            <View style={styles.signatureBlock}>
              <Text style={[styles.bold, {fontSize: 10}]}>Iovino Banqueting S.r.l.</Text>
              {firmaRosariaPath ? <Image src={firmaRosariaPath} style={styles.signatureImage} /> : null}
            </View>
            <View style={styles.signatureBlock}>
              <Text style={[styles.bold, {fontSize: 10}]}>{isWedding ? (isEn ? "Client" : "Cliente") : (isEn ? "Lessee" : "Conduttore")}</Text>
              {firmaContratto ? <Image src={firmaContratto} style={styles.signatureImage} /> : null}
            </View>
          </View>
        </View>


      </Page>
      
      {/* PAGINA PRIVACY E CONSENSI */}
      <Page size="A4" style={styles.page}>
        <Header />
        <Footer />
        <Text style={[styles.titlePrivacy, { fontSize: 14, marginBottom: 15 }]}>INFORMATIVA CLIENTI{'\n'}Informativa Privacy ai sensi del Regolamento UE 679/2016{'\n'}in materia di protezione dei dati personali</Text>
        <Text style={[styles.paragraph, {fontSize: 10}]}>
          Oggetto: Informativa ai sensi dell’art. 13 del Regolamento UE n. 2016/679{'\n\n'}
          Ai sensi dell’art. del Regolamento UE n. 2016/679 (di seguito “GDPR 2016/679”), recante disposizioni a tutela delle persone e di altri soggetti rispetto al trattamento dei dati personali, desideriamo informarVi che i dati personali da Voi forniti formeranno oggetto di trattamento nel rispetto della normativa sopra richiamata e degli obblighi di riservatezza cui è tenuta l’azienda.{'\n\n'}
          <Text style={styles.bold}>1. Titolare del trattamento</Text>{'\n'}
          Contitolari del trattamento sono la Santo Stefano s.r.l. (P.Iva 06039150633) con sede in Largo Martuscelli 37 a Napoli rappresentato dall’Ing Roberto Sola in qualità di Amministratore e la Iovino Banqueting s.r.l. (P.Iva 06818681212) con sede in Via Napoli 141 a Casalnuovo di Napoli rappresentata dalla Sig.ra Rosaria Iovino in qualità di Amministratore. La “Santo Stefano s.r.l.” e la “Iovino Banqueting s.r.l.” possono essere contattati via mail all’indirizzo info@laterradegliaranci.it e via telefono allo 0817148768.{'\n\n'}
          <Text style={styles.bold}>2. Finalità del trattamento</Text>{'\n'}
          I dati personali di persone fisiche, persone giuridiche, ditte individuali e/o liberi professionisti da Voi forniti sono necessari per lo svolgimento del rapporto commerciale con la “Santo Stefano s.r.l.” e/o la “Iovino Banqueting s.r.l.”, per adempiere ad obblighi legali, per eventuale gestione del contenzioso e per finalità di marketing quali l’invio via email, posta, telefono, sms e/o whatsapp di materiale promozionale e pubblicitario offerti. Il conferimento di alcune di queste finalità, indicate nel consenso che Lei firmerà, sono un requisito necessario alla conclusione del contratto, in mancanza la “Santo Stefano s.r.l.” e/o la “Iovino Banqueting s.r.l.” sarebbero nell’impossibilità di instaurare il rapporto o di dare esecuzione allo stesso.{'\n\n'}
          <Text style={styles.bold}>3. Categorie di dati trattati</Text>{'\n'}
          La “Santo Stefano s.r.l.” e/o la “Iovino Banqueting s.r.l.” trattano i dati personali che includono, a titolo esemplificativo, dati anagrafi (es. nome, cognome, indirizzo, codice fiscale, partita iva, numeri di telefono, email) e materiale fotografico e video dell’evento.{'\n\n'}
          <Text style={styles.bold}>4. Modalità di trattamento</Text>{'\n'}
          Il trattamento sarà svolto in forma automatizzata e/o manuale, nel rispetto di quanto previsto dall’art. 32 del GDPR 2016/679 in materia di misure di sicurezza, ad opera di soggetti appositamente incaricati ed in ottemperanza a quanto previsto dall’art. 29 GDPR 2016/679.{'\n\n'}
          <Text style={styles.bold}>5. Periodo di conservazione dei dati</Text>{'\n'}
          I dati personali saranno conservati per tutta la durata del rapporto contrattuale, per l’esecuzione degli adempimenti allo stesso inerenti e conseguenti, per il rispetto degli obblighi di legge, ai sensi dell’art. 5 GDPR 2016/679, previo il Vostro consenso libero ed esplicito espresso in calce alla presente informativa. I dati utilizzati ai fini pubblicitari e promozionali saranno conservati per una durata massima di 5 anni.{'\n\n'}
          <Text style={styles.bold}>6. Ambito di comunicazione e diffusione</Text>{'\n'}
          Possono venire a conoscenza dei Vostri dati le persone fisiche e giuridiche nominate Responsabili del trattamento e le persone fisiche autorizzate al trattamento dei dati necessari allo svolgimento delle mansioni assegnategli per lo svolgimento dell’evento: lavoratori dipendenti, stagisti. Informiamo che i dati raccolti non saranno mai diffusi e non saranno oggetto di comunicazione senza Vostro esplicito consenso, salvo le comunicazioni necessarie che possono comportare il trasferimento di dati ad enti pubblici, a consulenti o ad altri soggetti per l’adempimento degli obblighi di legge.{'\n\n'}
          <Text style={styles.bold}>7. Trasferimento dei dati personali</Text>{'\n'}
          I Vostri dati non saranno trasferiti né in Stati membri dell’Unione Europea né in Paesi terzi non appartenenti all’Unione Europea.{'\n\n'}
          <Text style={styles.bold}>8. Diritti dell’interessato</Text>{'\n'}
          In ogni momento, Voi potrete esercitare, ai sensi degli articoli dal 15 al 22 del Regolamento UE n. 2016/679, il diritto di accesso, rettifica, cancellazione, limitazione, portabilità e opposizione. Potrete esercitare i Vostri diritti con richiesta scritta inviata all’indirizzo postale delle sedi legali di uno dei contitolari, o all’indirizzo mail info@laterradegliaranci.it.
        </Text>
        <Text style={[styles.paragraph, {fontSize: 10}]}>
          <Text style={styles.bold}>9. Deroga all’esercizio dei diritti</Text>{'\n'}
          La normativa sulla protezione dei dati riconosce specifiche deroghe ai diritti riconosciuti all’interessato come previsto dall'art. 17 GDPR.{'\n\n'}
          <Text style={styles.bold}>10. Esattezza dei dati, accesso e rettifica o cancellazione dei dati</Text>{'\n'}
          Con la sottoscrizione della presente informativa si fornisce conferma ad oggi dell’esattezza dei dati sopra comunicati rispetto alle finalità per i quali sono trattati e Vi impegnate a comunicare tempestivamente ogni aggiornamento. Io sottoscritto/a dichiaro di aver ricevuto l’informativa che precede.
        </Text>
        <Text style={{ marginTop: 15, fontSize: 10 }}>Data e luogo, Napoli, {todayDate}</Text>
        <Text style={[styles.bold, {fontSize: 10, marginTop: 20, marginBottom: 10}]}>Firme dei contitolari del trattamento</Text>
        <View style={styles.signatureSection} wrap={false}>
          <View style={styles.signatureBlock}>
            <Text style={[styles.bold, {fontSize: 10}]}>Santo Stefano S.r.l.</Text>
            {firmaRobertoPath ? <Image src={firmaRobertoPath} style={styles.signatureImage} /> : null}
          </View>
          <View style={styles.signatureBlock}>
            <Text style={[styles.bold, {fontSize: 10}]}>Iovino Banqueting S.r.l.</Text>
            {firmaRosariaPath ? <Image src={firmaRosariaPath} style={styles.signatureImage} /> : null}
          </View>
        </View>

        <Text style={[styles.titlePrivacy, {marginTop: 40, fontSize: 14, marginBottom: 15}]}>CONSENSO TRATTAMENTO DATI{'\n'}ai sensi del Regolamento UE 679/2016 in materia di protezione dei dati personali</Text>
        <Text style={[styles.paragraph, {fontSize: 10}]}>
          Io sottoscritto {data.nome} {data.cognome}{'\n'}
          dopo aver appreso in modo chiaro le modalità di trattamento dei dati da me forniti ed aver ricevuto apposita informativa{'\n'}
          ai sensi del Regolamento UE 679/2016, esprimo liberamente il consenso al trattamento dei suddetti dati personali per:
        </Text>
        
        <View style={{marginTop: 15, fontSize: 10}}>
          <Text>1) l’esecuzione e le esigenze contrattuali ed i conseguenti adempimenti degli obblighi legali e fiscali, nonché per conseguire un’efficace gestione del rapporto commerciale.</Text>
          <Text style={{marginTop: 5}}>[ {data.accetto ? "X" : " "} ] Esprimo il consenso</Text>
        </View>

        <View style={{marginTop: 15, fontSize: 10}}>
          <Text>2) comunicarli a terzi per le finalità indicate nell’informativa.</Text>
          <Text style={{marginTop: 8}}>[ {data.comunicazione_terzi ? "X" : " "} ] Esprimo il consenso</Text>
          <Text style={{marginTop: 3}}>[ {!data.comunicazione_terzi ? "X" : " "} ] NON esprimo il consenso</Text>
        </View>

        <View style={{marginTop: 15, fontSize: 10}}>
          <Text>3) per le finalità di marketing indicate nell’informativa.</Text>
          <Text style={{marginTop: 8}}>[ {data.marketing === "SI" ? "X" : " "} ] Esprimo il consenso</Text>
          <Text style={{marginTop: 3}}>[ {data.marketing === "NO" ? "X" : " "} ] NON esprimo il consenso</Text>
        </View>

        <View style={[styles.signatureSection, {justifyContent: 'flex-end', marginTop: 20}]} wrap={false}>
          <View style={styles.signatureBlock}>
            <Text style={[styles.bold, {fontSize: 10, textAlign: 'center'}]}>Firma e data</Text>
            {firmaContratto && <Image src={firmaContratto} style={[styles.signatureImage, { borderBottom: 'none', height: 50 }]} />}
            <Text style={{fontSize: 10, marginTop: 5, textAlign: 'center'}}>{todayDate}</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};
