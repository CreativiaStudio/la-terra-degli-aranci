import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, paddingBottom: 60, fontFamily: 'Times-Roman', fontSize: 11, lineHeight: 1.5, color: '#000000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, alignItems: 'center' },
  title: { fontSize: 14, fontFamily: 'Times-Bold', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 11, textAlign: 'center', marginBottom: 20, color: '#555555' },
  paragraph: { marginBottom: 12, textAlign: 'justify' },
  sectionTitle: { fontSize: 12, fontFamily: 'Times-Bold', marginTop: 15, marginBottom: 8 },
  table: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottom: '1px solid #eeeeee' },
  rowLabel: { flex: 1 },
  rowValue: { width: 90, textAlign: 'right' },
  added: { color: '#166534' },
  removed: { color: '#b91c1c' },
  totalsBox: { marginTop: 15, padding: 12, backgroundColor: '#faf8f5', border: '1px solid #eeeeee' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  signatureBlock: { marginTop: 40, width: 220 },
  signatureImage: { height: 40, objectFit: 'contain', marginTop: 5, borderBottom: '1px solid #000000' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: '2px solid #e27d3b', paddingTop: 10, fontSize: 8, textAlign: 'center' }
});

interface AddendumItem {
  descrizione: string;
  prezzo_unitario: number;
}

interface AddendumPdfTemplateProps {
  quoteRef: string;
  clientName: string;
  itemsBefore: AddendumItem[];
  itemsAfter: AddendumItem[];
  totaleBefore: number;
  totaleAfter: number;
  firmaDisegnata: string;
  logoPath?: string | null;
  logoRightPath?: string | null;
  signedAt: string;
}

// Le props sono tipizzate come `any` in ingresso (come ContractPdfTemplate) perché
// react-pdf's renderToStream si aspetta un ReactElement<DocumentProps>: un componente
// con props tipizzate in modo specifico non è assegnabile a quella firma.
export const AddendumPdfTemplate = ({
  quoteRef,
  clientName,
  itemsBefore,
  itemsAfter,
  totaleBefore,
  totaleAfter,
  firmaDisegnata,
  logoPath,
  logoRightPath,
  signedAt
}: AddendumPdfTemplateProps | any) => {
  const before: AddendumItem[] = itemsBefore || [];
  const after: AddendumItem[] = itemsAfter || [];
  const beforeKeys = new Set(before.map(i => i.descrizione));
  const afterKeys = new Set(after.map(i => i.descrizione));
  const removed = before.filter(i => !afterKeys.has(i.descrizione));
  const added = after.filter(i => !beforeKeys.has(i.descrizione));
  const invariati = after.filter(i => beforeKeys.has(i.descrizione));

  const dataFirma = new Date(signedAt).toLocaleDateString('it-IT');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          {logoPath && <Image src={logoPath} style={{ width: 70, height: 70, objectFit: 'contain' }} />}
          {logoRightPath && <Image src={logoRightPath} style={{ width: 150, height: 34, objectFit: 'contain' }} />}
        </View>

        <Text style={styles.title}>Allegato al Contratto - Modifica Servizi</Text>
        <Text style={styles.subtitle}>Rif. Preventivo TDA-{quoteRef} - {clientName}</Text>

        <Text style={styles.paragraph}>
          Ai sensi dell&apos;Art. 4 del contratto sottoscritto (&quot;il prezzo base, incrementabile
          sulla base dell&apos;allegato &apos;La Terra degli Aranci - Servizi del ricevimento&apos;&quot;), le
          parti confermano con il presente allegato la seguente variazione dei servizi
          inclusi, comunicata entro i termini contrattualmente previsti (10 giorni dalla
          data dell&apos;evento).
        </Text>

        {added.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Servizi Aggiunti</Text>
            <View style={styles.table}>
              {added.map((item, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={[styles.rowLabel, styles.added]}>+ {item.descrizione}</Text>
                  <Text style={[styles.rowValue, styles.added]}>€ {Number(item.prezzo_unitario).toLocaleString('it-IT')}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {removed.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Servizi Rimossi</Text>
            <View style={styles.table}>
              {removed.map((item, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={[styles.rowLabel, styles.removed]}>- {item.descrizione}</Text>
                  <Text style={[styles.rowValue, styles.removed]}>€ {Number(item.prezzo_unitario).toLocaleString('it-IT')}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {invariati.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Servizi Invariati</Text>
            <View style={styles.table}>
              {invariati.map((item, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={styles.rowLabel}>{item.descrizione}</Text>
                  <Text style={styles.rowValue}>€ {Number(item.prezzo_unitario).toLocaleString('it-IT')}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text>Totale Precedente</Text>
            <Text>€ {Number(totaleBefore).toLocaleString('it-IT')}</Text>
          </View>
          <View style={[styles.totalRow, { fontFamily: 'Times-Bold', fontSize: 13 }]}>
            <Text>Nuovo Totale Contrattuale</Text>
            <Text>€ {Number(totaleAfter).toLocaleString('it-IT')}</Text>
          </View>
        </View>

        <Text style={[styles.paragraph, { marginTop: 15 }]}>
          Il Cliente conferma di aver preso visione della presente variazione e
          dell&apos;aggiornamento del corrispettivo, che verrà interamente imputato al saldo
          finale dovuto il giorno dell&apos;evento, restando invariati gli acconti già versati.
        </Text>

        <View style={styles.signatureBlock}>
          <Text>Firma del Cliente ({dataFirma})</Text>
          {firmaDisegnata && <Image src={firmaDisegnata} style={styles.signatureImage} />}
        </View>

        <View style={styles.footer} fixed>
          <Text>La Terra degli Aranci - Piazzetta S. Stefano, 7, Napoli</Text>
        </View>
      </Page>
    </Document>
  );
};
