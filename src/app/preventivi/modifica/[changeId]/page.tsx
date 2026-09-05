import { notFound } from "next/navigation";
import { getQuoteChangeForConfirmation } from "../actions";
import { generateSignature } from "@/lib/crypto";
import ConfirmChangeButton from "./ConfirmChangeButton";

export const revalidate = 0;

function signChange(changeId: string, quoteId: string, totaleAfter: number) {
  return generateSignature(`${changeId}:${totaleAfter}`, quoteId);
}

export default async function ModificaConfirmPage({
  params,
  searchParams
}: {
  params: Promise<{ changeId: string }>;
  searchParams: Promise<{ sig?: string }>;
}) {
  const { changeId } = await params;
  const { sig } = await searchParams;

  const result = await getQuoteChangeForConfirmation(changeId);
  if (!result) return notFound();
  const { change, quote } = result;

  const expectedSig = signChange(changeId, change.quote_id, Number(change.totale_after));
  if (!sig || sig !== expectedSig) return notFound();

  const itemsBefore = change.items_before || [];
  const itemsAfter = change.items_after || [];
  const beforeKeys = new Set(itemsBefore.map((i: any) => i.descrizione));
  const afterKeys = new Set(itemsAfter.map((i: any) => i.descrizione));
  const added = itemsAfter.filter((i: any) => !beforeKeys.has(i.descrizione));
  const removed = itemsBefore.filter((i: any) => !afterKeys.has(i.descrizione));
  const invariati = itemsAfter.filter((i: any) => beforeKeys.has(i.descrizione));

  const isPending = change.status === 'pending';

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#faf8f5", padding: "3rem 1rem", fontFamily: "var(--font-primary)", color: "#2b2b2b" }}>
      <div style={{ maxWidth: "780px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <span style={{ textTransform: "uppercase", letterSpacing: "3px", fontSize: "0.85rem", color: "#e58c2c", fontWeight: 600 }}>
            La Terra degli Aranci • Allegato al Contratto
          </span>
          <h1 style={{ color: "#514d48", fontSize: "2.4rem", margin: "0.5rem 0 0.8rem 0", fontWeight: 400, fontFamily: "serif" }}>
            Conferma Modifica Servizi
          </h1>
          <p style={{ color: "#777", fontSize: "1.05rem" }}>
            Rif. Preventivo TDA-{quote.id.slice(0, 8).toUpperCase()} - {quote.clients?.nome} {quote.clients?.cognome}
          </p>
        </div>

        <div className="premium-card" style={{ padding: "2.5rem", borderRadius: "16px", border: "1px solid #f0eee9" }}>
          {added.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ color: "#166534", fontSize: "1.1rem" }}>Servizi Aggiunti</h3>
              {added.map((item: any, idx: number) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid #f0eee9" }}>
                  <span>+ {item.descrizione}</span>
                  <strong style={{ color: "#166534" }}>€ {Number(item.prezzo_unitario).toLocaleString('it-IT')}</strong>
                </div>
              ))}
            </div>
          )}

          {removed.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ color: "#b91c1c", fontSize: "1.1rem" }}>Servizi Rimossi</h3>
              {removed.map((item: any, idx: number) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid #f0eee9" }}>
                  <span>- {item.descrizione}</span>
                  <strong style={{ color: "#b91c1c" }}>€ {Number(item.prezzo_unitario).toLocaleString('it-IT')}</strong>
                </div>
              ))}
            </div>
          )}

          {invariati.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ color: "#514d48", fontSize: "1.1rem" }}>Servizi Invariati</h3>
              {invariati.map((item: any, idx: number) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid #f5f5f5", color: "#777" }}>
                  <span>{item.descrizione}</span>
                  <span>€ {Number(item.prezzo_unitario).toLocaleString('it-IT')}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: "#faf8f5", padding: "1.5rem", borderRadius: "10px", border: "1px solid #f0eee9", marginTop: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", color: "#666" }}>
              <span>Totale Precedente</span>
              <span>€ {Number(change.totale_before).toLocaleString('it-IT')}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.4rem", fontWeight: "bold", color: "#e58c2c" }}>
              <span>Nuovo Totale</span>
              <span>€ {Number(change.totale_after).toLocaleString('it-IT')}</span>
            </div>
          </div>

          <p style={{ marginTop: "2rem", fontSize: "0.95rem", color: "#666", lineHeight: 1.6 }}>
            Ai sensi dell&apos;Art. 4 del contratto sottoscritto, il prezzo base è incrementabile
            sulla base dell&apos;allegato dei servizi. Confermando e firmando qui sotto, il
            differenziale di prezzo verrà interamente imputato al saldo finale dovuto il
            giorno dell&apos;evento: gli acconti già versati restano invariati.
          </p>

          {isPending ? (
            <ConfirmChangeButton changeId={changeId} sig={sig} />
          ) : (
            <div style={{ marginTop: "2rem", padding: "1.5rem", background: "#f3f8f2", color: "#2d5a27", borderRadius: "10px", textAlign: "center" }}>
              <strong>Questa modifica è già stata confermata.</strong>
              {change.pdf_url && (
                <div style={{ marginTop: "0.8rem" }}>
                  <a href={change.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2d5a27" }}>
                    Scarica l&apos;allegato firmato (PDF)
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
