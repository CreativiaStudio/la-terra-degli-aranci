import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatEuro } from '@/lib/contractPayments';

/**
 * ReceiptPdfTemplate
 * ------------------------------------------------------------------
 * Quietanza di Pagamento / Ricevuta Acconto per La Terra degli Aranci.
 *
 * Il documento attesta il pagamento di un acconto (caparra, 2° acconto o
 * saldo) del piano rate concordato con la direzione. La grafica ricalca
 * l'identità visiva del brand (arancio #e58c2c, avorio #faf8f5, inchiostro
 * #1e1b18) e include gli elementi di validazione (hash di verifica + QR).
 *
 * Le props sono tipizzate come `any` in ingresso (come ContractPdfTemplate)
 * perché react-pdf's renderToStream si aspetta un ReactElement<DocumentProps>:
 * un componente con props tipizzate in modo specifico non è assegnabile a
 * quella firma.
 */
export interface ReceiptPdfTemplateProps {
  receiptNumber: string;
  emissionDate: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  step: number;
  description: string;
  issuingCompany: string;
  amount: number;
  paymentMethod: string;
  status: string;
  totalAgreed: number;
  totalPaid: number;
  residual: number;
  verificationHash: string;
  passToken?: string;
  qrDataUrl?: string | null;
  logoPath?: string | null;
  logoRightPath?: string | null;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingHorizontal: 38,
    paddingBottom: 72,
    fontFamily: 'Times-Roman',
    fontSize: 10,
    lineHeight: 1.45,
    color: '#1e1b18',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #e58c2c',
    paddingBottom: 10,
    marginBottom: 16,
  },
  headerBrand: { alignItems: 'flex-start', justifyContent: 'center' },
  companyName: { fontFamily: 'Times-Bold', fontSize: 13, color: '#1e1b18', letterSpacing: 0.4 },
  companyMeta: { fontSize: 8, color: '#6a6764', marginTop: 2 },
  companyLocation: { fontFamily: 'Times-Bold', fontSize: 9, color: '#e58c2c', marginTop: 3 },
  titleBox: {
    backgroundColor: '#faf8f5',
    border: '1px solid #e58c2c',
    borderLeft: '4px solid #e58c2c',
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginBottom: 14,
  },
  titleText: { fontFamily: 'Times-Bold', fontSize: 12.5, color: '#1e1b18', letterSpacing: 0.3 },
  titleSub: { fontFamily: 'Times-Italic', fontSize: 9, color: '#807261', marginTop: 3 },
  twoCols: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  section: { flex: 1 },
  sectionLabel: {
    fontFamily: 'Times-Bold',
    fontSize: 7.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#e58c2c',
    marginBottom: 4,
  },
  infoCard: {
    border: '1px solid #eee7de',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
  },
  infoRow: { flexDirection: 'row', marginBottom: 3 },
  infoKey: { width: 78, fontSize: 8.5, color: '#807261' },
  infoVal: { flex: 1, fontSize: 9.5, color: '#1e1b18' },
  infoValStrong: { flex: 1, fontSize: 10, fontFamily: 'Times-Bold', color: '#1e1b18' },
  table: { border: '1px solid #eee7de', borderRadius: 6, marginBottom: 12, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e1b18', paddingVertical: 7, paddingHorizontal: 10 },
  th: { color: '#ffffff', fontFamily: 'Times-Bold', fontSize: 8.5, textTransform: 'uppercase', letterSpacing: 0.6 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottom: '1px solid #f0ebe4',
    alignItems: 'center',
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tdLabel: { width: 108, fontSize: 8.5, color: '#807261' },
  tdValue: { flex: 1, fontSize: 9.5, color: '#1e1b18' },
  tdAmount: { fontFamily: 'Times-Bold', fontSize: 13, color: '#166534' },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#166534',
    color: '#ffffff',
    fontFamily: 'Times-Bold',
    fontSize: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    letterSpacing: 0.5,
  },
  summary: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  summaryCell: {
    flex: 1,
    border: '1px solid #eee7de',
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  summaryCellHighlight: {
    flex: 1,
    border: '1px solid #bbf7d0',
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
  summaryLabel: { fontSize: 7.5, color: '#807261', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
  summaryValue: { fontFamily: 'Times-Bold', fontSize: 12, color: '#1e1b18' },
  summaryValuePaid: { fontFamily: 'Times-Bold', fontSize: 12, color: '#166534' },
  summaryValueDue: { fontFamily: 'Times-Bold', fontSize: 12, color: '#e58c2c' },
  legalBox: {
    marginTop: 4,
    border: '1px dashed #e58c2c',
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 11,
    backgroundColor: '#fffdf9',
  },
  legalText: { fontSize: 8.5, color: '#4a463f', textAlign: 'justify' },
  closingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 },
  verifyBlock: { flex: 1, paddingRight: 12 },
  verifyLabel: { fontFamily: 'Times-Bold', fontSize: 8, color: '#807261', marginBottom: 2 },
  verifyHash: { fontFamily: 'Courier', fontSize: 8, color: '#1e1b18' },
  verifyToken: { fontFamily: 'Courier', fontSize: 7, color: '#807261', marginTop: 2 },
  stampBlock: {
    width: 190,
    border: '2px solid #e58c2c',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#fffaf3',
  },
  stampTitle: { fontFamily: 'Times-Bold', fontSize: 9.5, color: '#e58c2c', textAlign: 'center', letterSpacing: 0.4 },
  stampCompany: { fontFamily: 'Times-Bold', fontSize: 8.5, color: '#1e1b18', textAlign: 'center', marginTop: 3 },
  stampMeta: { fontSize: 7, color: '#807261', textAlign: 'center', marginTop: 2 },
  qrImage: { width: 52, height: 52, marginBottom: 4 },
  footer: {
    position: 'absolute',
    bottom: 26,
    left: 38,
    right: 38,
    borderTop: '2px solid #e58c2c',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#807261',
  },
});

export const ReceiptPdfTemplate = ({
  receiptNumber,
  emissionDate,
  clientName,
  eventType,
  eventDate,
  step,
  description,
  issuingCompany,
  amount,
  paymentMethod,
  status,
  totalAgreed,
  totalPaid,
  residual,
  verificationHash,
  passToken,
  qrDataUrl,
  logoPath,
  logoRightPath,
}: ReceiptPdfTemplateProps | any) => {
  const stepLabel =
    step === 1 ? '1° Acconto / Caparra Confirmatoria' : step === 2 ? '2° Acconto' : 'Saldo Finale';

  const Footer = () => (
    <View style={styles.footer} fixed>
      <Text>Tenuta Santo Stefano S.r.l.{'\n'}Via Piave, 128 - 80126 Napoli (NA) | P.IVA 08341921213</Text>
      <Text>La Terra degli Aranci{'\n'}Piazzetta S. Stefano, 7 - Napoli (Vomero)</Text>
      <Text>+39 081 714 87 68{'\n'}info@laterradegliaranci.it</Text>
    </View>
  );

  return (
    <Document
      title={`Quietanza di Pagamento ${receiptNumber}`}
      author="Tenuta Santo Stefano S.r.l. - La Terra degli Aranci"
      subject="Quietanza di Pagamento / Ricevuta Acconto"
      creator="La Terra degli Aranci"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          {logoPath ? <Image src={logoPath} style={{ width: 62, height: 62, objectFit: 'contain' }} /> : <View />}
          <View style={{ alignItems: 'flex-end' }}>
            {logoRightPath ? (
              <Image src={logoRightPath} style={{ width: 150, height: 32, objectFit: 'contain', marginBottom: 4 }} />
            ) : null}
            <Text style={styles.companyName}>Tenuta Santo Stefano S.r.l.</Text>
            <Text style={styles.companyMeta}>Sede Legale: Via Piave, 128 - 80126 Napoli (NA) | P.IVA: 08341921213</Text>
            <Text style={styles.companyLocation}>Location: La Terra degli Aranci - Piazzetta S. Stefano, 7, Napoli (Vomero)</Text>
          </View>
        </View>

        <View style={styles.titleBox}>
          <Text style={styles.titleText}>QUIETANZA DI PAGAMENTO &amp; RICEVUTA ACCONTO</Text>
          <Text style={styles.titleSub}>
            Numero Ricevuta: {receiptNumber}  |  Data Emissione: {emissionDate}  |  {stepLabel}
          </Text>
        </View>

        <View style={styles.twoCols}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Ricevuto da</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Beneficiario</Text>
                <Text style={styles.infoValStrong}>{clientName || 'Cliente'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Evento</Text>
                <Text style={styles.infoVal}>
                  {eventType} del {eventDate}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Estremi Documento</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Ricevuta n.</Text>
                <Text style={styles.infoVal}>{receiptNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Emessa il</Text>
                <Text style={styles.infoVal}>{emissionDate}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Dettaglio Contabile</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 3 }]}>Descrizione</Text>
            <Text style={[styles.th, { flex: 1.4 }]}>Importo</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={{ flex: 3 }}>
              <Text style={styles.tdValue}>{description}</Text>
              <Text style={{ fontSize: 8, color: '#807261', marginTop: 3 }}>
                Società emittente: {issuingCompany}
              </Text>
            </View>
            <View style={{ flex: 1.4 }}>
              <Text style={styles.tdAmount}>{formatEuro(Number(amount) || 0)}</Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tdLabel}>Metodo di pagamento</Text>
            <Text style={styles.tdValue}>{paymentMethod}</Text>
          </View>

          <View style={styles.tableRowLast}>
            <Text style={styles.tdLabel}>Stato</Text>
            <Text style={styles.statusPill}>{status}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Quadro Riepilogativo</Text>
        <View style={styles.summary}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Totale concordato evento</Text>
            <Text style={styles.summaryValue}>{formatEuro(Number(totalAgreed) || 0)}</Text>
          </View>
          <View style={styles.summaryCellHighlight}>
            <Text style={styles.summaryLabel}>Totale versato</Text>
            <Text style={styles.summaryValuePaid}>{formatEuro(Number(totalPaid) || 0)}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Residuo a saldo</Text>
            <Text style={styles.summaryValueDue}>{formatEuro(Number(residual) || 0)}</Text>
          </View>
        </View>

        <View style={styles.legalBox}>
          <Text style={styles.legalText}>
            Si rilascia la presente quietanza a titolo liberatorio per l&apos;importo sopra indicato ai sensi
            dell&apos;art. 1199 c.c. Il pagamento è imputato in conto prezzo al totale concordato per l&apos;evento.
          </Text>
        </View>

        <View style={styles.closingRow}>
          <View style={styles.verifyBlock}>
            {qrDataUrl ? <Image src={qrDataUrl} style={styles.qrImage} /> : null}
            <Text style={styles.verifyLabel}>Hash univoco di verifica</Text>
            <Text style={styles.verifyHash}>{verificationHash}</Text>
            {passToken ? <Text style={styles.verifyToken}>Pass Token: {passToken}</Text> : null}
          </View>

          <View style={styles.stampBlock}>
            <Text style={styles.stampTitle}>TIMBRO DIGITALE</Text>
            <Text style={styles.stampCompany}>Firma Elettronica Certificata</Text>
            <Text style={styles.stampMeta}>Tenuta Santo Stefano S.r.l.</Text>
            <Text style={styles.stampMeta}>Documento generato digitalmente e verificabile</Text>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  );
};

export default ReceiptPdfTemplate;
