"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import ServiceItemsEditor, { ServiceItem } from "@/components/ServiceItemsEditor";
import { createQuoteChange } from "@/app/preventivi/modifica/actions";

interface ClientDocumentsProps {
  quote: any;
  clientQuotes?: any[];
  experiences?: any[];
  signedPdf?: any;
  contractUrl?: string;
  lang?: "it" | "en";
  onLangChange?: (lang: "it" | "en") => void;
  isHistoricalDashboard?: boolean;
  canEditServices?: boolean;
  serviceChangesHistory?: any[];
}

export default function ClientDocuments({
  quote,
  clientQuotes = [],
  experiences = [],
  signedPdf,
  contractUrl,
  lang = "it",
  isHistoricalDashboard = false,
  canEditServices = false,
  serviceChangesHistory = []
}: ClientDocumentsProps) {
  const isEng = lang === "en";
  const router = useRouter();

  const [isEditingServices, setIsEditingServices] = useState(false);
  const [editedItems, setEditedItems] = useState<ServiceItem[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [navigatingUrl, setNavigatingUrl] = useState<string | null>(null);

  const pendingQuote = clientQuotes.find(
    q => q.status === "inviato" || q.status === "bozza" || q.status === "accettato"
  );
  
  const pendingServiceChange = serviceChangesHistory.find(c => c.status === 'pending');

  // Raccogli i preventivi storici. 
  // Se è la dashboard storica, TUTTI i preventivi sono storici. Altrimenti escludiamo quello in visualizzazione.
  const historicalQuotes = isHistoricalDashboard ? clientQuotes : clientQuotes.filter(q => q.id !== quote?.id);

  const hasPending = !!pendingQuote;

  // URL di firma digitale per il preventivo in attesa
  const finalSigningUrl = contractUrl || `/contratti/${pendingQuote?.tipo_evento === "eventi" ? "eventi" : "wedding"}`;

  // URL del PDF firmato ufficiale per l'ultimo contratto completato
  const pdfDownloadUrl = signedPdf?.url || `/api/pdf/${quote?.id || "demo"}`;

  const quoteItems = quote?.items || [
    { descrizione: "Affitto Villa in Esclusiva & Menu Wedding Base", prezzo_unitario: 14000, quantita: 1 },
    { descrizione: "Confettata Elegante Completa", prezzo_unitario: 450, quantita: 1 },
    { descrizione: "After Party & DJ Set in Sala Tufo", prezzo_unitario: 750, quantita: 1 }
  ];

  const total = quote?.totale_calcolato || 15200;

  // Verifica se l'evento in primo piano è già passato
  const isPastEvent = quote?.data_evento ? new Date(quote.data_evento).getTime() < new Date().getTime() : false;

  const totaleServiziModificati = editedItems.reduce((acc, item) => acc + (Number(item.prezzo_unitario) || 0), 0);
  const nuovoTotale = totaleServiziModificati - (Number(quote?.sconto_fisso) || 0);
  const deltaTotale = nuovoTotale - total;

  const handleStartEditing = () => {
    setEditError("");
    setEditedItems(quoteItems.map((item: any, idx: number) => ({
      id: item.id ?? `${idx}`,
      descrizione: item.descrizione || "",
      quantita: item.quantita ?? 1,
      prezzo_unitario: Number(item.prezzo_unitario !== undefined ? item.prezzo_unitario : item.prezzo) || 0
    })));
    setIsEditingServices(true);
  };

  const handleCancelEditing = () => {
    setIsEditingServices(false);
    setEditError("");
  };

  const handleSubmitServiceChange = async () => {
    setEditLoading(true);
    setEditError("");
    const res = await createQuoteChange(quote.id, editedItems, 'cliente');
    if (res.success) {
      router.push(`/preventivi/modifica/${res.changeId}?sig=${res.sig}`);
    } else {
      setEditError(res.error);
      setEditLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      
      {/* 1. BOX PRINCIPALE DINAMICO DI NOTIFICA (Nascosto se Dashboard Storica) */}
      {!isHistoricalDashboard && (
        <>
        {hasPending ? (
          /* BOX WARNING ARANCIONE: Notifica se c'è un contratto da firmare */
        <div style={{
          background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
          borderRadius: "20px",
          padding: "2.2rem 2.5rem",
          border: "2px solid #f97316",
          boxShadow: "0 12px 30px rgba(249, 115, 22, 0.15)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: "1.6rem" }}>⚠️</span>
                <span style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  padding: "0.35rem 0.85rem",
                  borderRadius: "20px",
                  background: "#c2410c",
                  color: "#ffffff",
                  textTransform: "uppercase",
                  letterSpacing: "1.2px"
                }}>
                  {isEng ? "Action Required: Pending Signature" : "Azione Richiesta: Contratto in Attesa di Firma"}
                </span>
              </div>

              <h3 style={{ fontSize: "1.65rem", color: "#1e1b18", marginTop: "0.2rem", marginBottom: "0.5rem", fontWeight: 600 }}>
                {isEng ? "Your Agreement is Waiting for Your Signature" : "Avete 1 Contratto in Attesa di Firma"}
              </h3>
              
              <p style={{ color: "#4a3c31", fontSize: "1rem", maxWidth: "650px", lineHeight: 1.6, margin: 0 }}>
                {isEng
                  ? "Please complete the digital signature for your event agreement to lock in your booking date."
                  : `È presente un contratto di concessione spazi e servizi per l'evento del ${pendingQuote?.data_evento || quote?.data_evento || "prossimo periodo"}. Procedete alla firma digitale per confermare definitivamente la prenotazione.`}
              </p>
            </div>

            <div>
              <Link
                href={finalSigningUrl}
                onClick={() => setNavigatingUrl(finalSigningUrl)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.7rem",
                  background: "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
                  color: "#ffffff",
                  padding: "1.1rem 2rem",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  textDecoration: "none",
                  boxShadow: "0 8px 20px rgba(229,140,44,0.4)",
                  transition: "transform 0.2s ease"
                }}
              >
                {navigatingUrl === finalSigningUrl ? (
                  isEng ? "⏳ Opening Document..." : "⏳ Apertura Documento in corso..."
                ) : (
                  `✍️ ${isEng ? "Sign Digital Contract Now →" : "Procedi alla Firma Digitale Ora →"}`
                )}
              </Link>
            </div>
          </div>
        </div>
      ) : pendingServiceChange ? (
        /* BOX WARNING ARANCIONE: Notifica se c'è una modifica servizi da firmare */
        <div style={{
          background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
          borderRadius: "20px",
          padding: "2.2rem 2.5rem",
          border: "2px solid #f97316",
          boxShadow: "0 12px 30px rgba(249, 115, 22, 0.15)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: "1.6rem" }}>⚠️</span>
                <span style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  padding: "0.35rem 0.85rem",
                  borderRadius: "20px",
                  background: "#c2410c",
                  color: "#ffffff",
                  textTransform: "uppercase",
                  letterSpacing: "1.2px"
                }}>
                  {isEng ? "Action Required: Service Modification Pending" : "Azione Richiesta: Modifica Servizi in Attesa di Firma"}
                </span>
              </div>

              <h3 style={{ fontSize: "1.65rem", color: "#1e1b18", marginTop: "0.2rem", marginBottom: "0.5rem", fontWeight: 600 }}>
                {isEng ? "Your Requested Service Change is Waiting for Signature" : "Avete 1 Modifica Servizi in Attesa di Firma"}
              </h3>
              
              <p style={{ color: "#4a3c31", fontSize: "1rem", maxWidth: "650px", lineHeight: 1.6, margin: 0 }}>
                {isEng
                  ? "You requested a change to your event services. Please complete the digital signature on the addendum to confirm the updated services and total."
                  : `È stata richiesta una modifica ai servizi previsti per il vostro evento. Procedete alla firma digitale dell'allegato per confermare il nuovo totale.`}
              </p>
            </div>

            <div>
              <Link
                href={pendingServiceChange.signing_url || `/preventivi/modifica/${pendingServiceChange.id}?sig=${pendingServiceChange.sig}`}
                onClick={() => setNavigatingUrl(pendingServiceChange.signing_url || `/preventivi/modifica/${pendingServiceChange.id}?sig=${pendingServiceChange.sig}`)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.7rem",
                  background: "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
                  color: "#ffffff",
                  padding: "1.1rem 2rem",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  textDecoration: "none",
                  boxShadow: "0 8px 20px rgba(229,140,44,0.4)",
                  transition: "transform 0.2s ease"
                }}
              >
                {navigatingUrl === (pendingServiceChange.signing_url || `/preventivi/modifica/${pendingServiceChange.id}?sig=${pendingServiceChange.sig}`) ? (
                  isEng ? "⏳ Opening Addendum..." : "⏳ Apertura Modifica in corso..."
                ) : (
                  `✍️ ${isEng ? "Sign Service Addendum Now →" : "Procedi alla Firma della Modifica Ora →"}`
                )}
              </Link>
            </div>
          </div>
        </div>
      ) : !isHistoricalDashboard && quote?.status === "firmato" ? (
        /* 1. BOX CONTRATTO FIRMATO / FIRMA IN SOSPESO (Nascosto per i clienti storici) */
        <div style={{
          background: isPastEvent ? "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" : "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          borderRadius: "20px",
          padding: "2.2rem 2.5rem",
          border: isPastEvent ? "1px solid #e2e8f0" : "1px solid #bbf7d0",
          boxShadow: "0 10px 25px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{isPastEvent ? "📁" : "✅"}</span>
                <span style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  padding: "0.35rem 0.85rem",
                  borderRadius: "20px",
                  background: isPastEvent ? "#475569" : "#166534",
                  color: "#ffffff",
                  textTransform: "uppercase",
                  letterSpacing: "1px"
                }}>
                  {isPastEvent ? (isEng ? "Event Completed & Archived" : "Evento Concluso & Archiviato") : (isEng ? "Contract Signed & Active" : "Contratto Firmato & Attivo")}
                </span>
              </div>

              <h3 style={{ fontSize: "1.65rem", color: "#1e1b18", marginTop: "0.3rem", marginBottom: "0.5rem", fontWeight: 600 }}>
                {isPastEvent ? (isEng ? "Event Documents" : "Documenti dell'Evento Passato") : (isEng ? "Official Agreement Archived" : "Contratto Ufficiale di Locazione & Servizi")}
              </h3>
              
              <p style={{ color: "#2d4a36", fontSize: "0.98rem", maxWidth: "620px", lineHeight: 1.6, margin: 0 }}>
                {isEng
                  ? "Your digital contract has been registered and archived. You can view or download your official PDF at any time."
                  : "Il vostro contratto stipulato con La Terra degli Aranci è regolarmente attivo ed archiviato. Potete scaricare la copia PDF ufficiale non modificabile in qualsiasi momento."}
              </p>
            </div>

            <div>
              <a
                href={pdfDownloadUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.7rem",
                  background: "#166534",
                  color: "#ffffff",
                  padding: "1rem 1.8rem",
                  borderRadius: "14px",
                  fontWeight: 600,
                  fontSize: "1rem",
                  textDecoration: "none",
                  boxShadow: "0 6px 16px rgba(22, 101, 52, 0.25)"
                }}
              >
                📄 {isEng ? "Download Signed PDF" : "Scarica Contratto PDF"}
              </a>
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. DETTAGLIO SERVIZI ED ESPERIENZE IN VILLA */}
      <div style={{ background: "#ffffff", borderRadius: "20px", padding: "2.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #eee7de" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700 }}>
              {isHistoricalDashboard ? (isEng ? "YOUR CHOSEN SERVICES" : "I VOSTRI SERVIZI & RICORDI IN VILLA") : (isEng ? "ECONOMIC PROPOSAL" : "PROPOSTA ECONOMICA CONCORDATA")}
            </span>
            <h2 style={{ fontSize: "1.65rem", color: "#1e1b18", marginTop: "0.2rem" }}>
              🌿 {isHistoricalDashboard ? (isEng ? "Services Provided for Your Event" : "Servizi Confermati per il Vostro Evento") : (isEng ? "Quotation Details" : "Dettaglio del Preventivo Selezionato")}
            </h2>
          </div>

          {!isHistoricalDashboard && (
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              {!isEditingServices && (
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.85rem", color: "#777", display: "block" }}>{isEng ? "Total Agreed" : "Totale Concordato"}</span>
                  <span style={{ fontSize: "1.85rem", fontWeight: 700, color: "#e58c2c" }}>
                    € {total.toLocaleString("it-IT")}
                  </span>
                </div>
              )}

              {canEditServices && !isEditingServices && (
                <button
                  type="button"
                  onClick={handleStartEditing}
                  style={{
                    padding: "0.7rem 1.3rem",
                    borderRadius: "10px",
                    border: "1px solid #e58c2c",
                    background: "#fff7ed",
                    color: "#c2410c",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  ✏️ {isEng ? "Edit Services" : "Modifica Servizi"}
                </button>
              )}
            </div>
          )}
        </div>

        {canEditServices && (
          <p style={{ margin: "-0.8rem 0 1.5rem 0", fontSize: "0.85rem", color: "#888" }}>
            {isEng
              ? "You can add or remove services up to 10 days before the event date. Every change requires a quick digital signature."
              : "È possibile aggiungere o rimuovere servizi fino a 10 giorni prima della data dell'evento. Ogni modifica richiede una rapida firma digitale."}
          </p>
        )}

        {!isEditingServices ? (
          /* Tabella Voci Preventivo (sola lettura) */
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f0eae1", color: "#888", fontSize: "0.85rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "0.8rem 0" }}>{isEng ? "Service Description" : "Descrizione Servizio"}</th>
                  <th style={{ padding: "0.8rem 0", textAlign: "center" }}>{isEng ? "Qty" : "Qta"}</th>
                  {!isHistoricalDashboard && (
                    <th style={{ padding: "0.8rem 0", textAlign: "right" }}>{isEng ? "Amount" : "Prezzo"}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {quoteItems.map((item: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f7f3ed" }}>
                    <td style={{ padding: "1rem 0", fontSize: "0.98rem", color: "#2c2a27", fontWeight: 500 }}>
                      {item.descrizione}
                    </td>
                    <td style={{ padding: "1rem 0", textAlign: "center", color: "#666" }}>
                      {item.quantita || 1}
                    </td>
                    {!isHistoricalDashboard && (
                      <td style={{ padding: "1rem 0", textAlign: "right", fontWeight: 600, color: "#1e1b18" }}>
                        € {(item.prezzo_unitario * (item.quantita || 1)).toLocaleString("it-IT")}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Modalità Modifica Servizi */
          <div>
            <ServiceItemsEditor
              items={editedItems}
              numeroOspiti={quote?.numero_ospiti || 100}
              onChange={setEditedItems}
              restrictToCatalog
            />

            <div style={{ marginTop: "1.5rem", background: "#faf8f5", padding: "1.5rem", borderRadius: "12px", border: "1px solid #eee8df" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", color: "#666" }}>
                <span>{isEng ? "Current Total" : "Totale Attuale"}</span>
                <span>€ {total.toLocaleString("it-IT")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.4rem", fontWeight: "bold", color: "#e58c2c" }}>
                <span>{isEng ? "New Total" : "Nuovo Totale"}</span>
                <span>€ {nuovoTotale.toLocaleString("it-IT")}</span>
              </div>
              {deltaTotale !== 0 && (
                <div style={{ marginTop: "0.4rem", textAlign: "right", fontSize: "0.9rem", color: deltaTotale > 0 ? "#e58c2c" : "#166534" }}>
                  {deltaTotale > 0 ? "+" : ""}€ {deltaTotale.toLocaleString("it-IT")}
                </div>
              )}
            </div>

            {editError && <div style={{ color: "#d93838", marginTop: "1rem", fontWeight: 600 }}>{editError}</div>}

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleCancelEditing}
                disabled={editLoading}
                style={{
                  padding: "1rem 1.8rem",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  background: "#ffffff",
                  color: "#555",
                  fontWeight: 600,
                  cursor: editLoading ? "not-allowed" : "pointer"
                }}
              >
                {isEng ? "Cancel" : "Annulla"}
              </button>
              <button
                type="button"
                onClick={handleSubmitServiceChange}
                disabled={editLoading || deltaTotale === 0}
                style={{
                  flex: 1,
                  padding: "1rem 1.8rem",
                  borderRadius: "10px",
                  border: "none",
                  background: deltaTotale === 0 ? "#ccc" : "#e58c2c",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: editLoading || deltaTotale === 0 ? "not-allowed" : "pointer",
                  boxShadow: deltaTotale === 0 ? "none" : "0 6px 20px rgba(229, 140, 44, 0.4)"
                }}
              >
                {editLoading
                  ? (isEng ? "Processing..." : "Elaborazione...")
                  : (isEng ? "Request Change & Sign →" : "Richiedi Modifica e Firma →")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2.5 STORICO MODIFICHE SERVIZI */}
      {serviceChangesHistory.length > 0 && (
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "2.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #eee7de" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700 }}>
              {isEng ? "SERVICE CHANGE HISTORY" : "STORICO MODIFICHE SERVIZI"}
            </span>
            <h2 style={{ fontSize: "1.65rem", color: "#1e1b18", marginTop: "0.2rem" }}>
              🕓 {isEng ? "Requested Changes" : "Modifiche Richieste al Preventivo"}
            </h2>
            <p style={{ color: "#6a6764", fontSize: "0.95rem", marginTop: "0.3rem" }}>
              {isEng
                ? "Track every change requested to your services, whether by you or by our team."
                : "Tieni sempre sotto controllo ogni modifica richiesta ai servizi, sia da te che dalla Direzione."}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {serviceChangesHistory.map((change: any) => {
              const isConfirmed = change.status === 'confermato';
              const delta = Number(change.totale_after) - Number(change.totale_before);
              const initiatedByLabel = change.initiated_by === 'admin'
                ? (isEng ? "Requested by our team" : "Richiesta dalla Direzione")
                : (isEng ? "Requested by you" : "Richiesta da te");

              const beforeItems: any[] = change.items_before || [];
              const afterItems: any[] = change.items_after || [];

              const addedItems = afterItems.filter((aItem) => 
                !beforeItems.some((bItem) => bItem.descrizione === aItem.descrizione)
              );
              const removedItems = beforeItems.filter((bItem) => 
                !afterItems.some((aItem) => aItem.descrizione === bItem.descrizione)
              );

              return (
                <div key={change.id} style={{
                  padding: "1.4rem 1.6rem",
                  borderRadius: "14px",
                  background: "#faf8f5",
                  border: "1px solid #eee8df",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.3rem" }}>
                        <span style={{ fontWeight: 700, color: "#1e1b18" }}>{initiatedByLabel}</span>
                        <span style={{
                          fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.7rem", borderRadius: "20px",
                          background: isConfirmed ? "#166534" : "#c2410c", color: "#ffffff", textTransform: "uppercase"
                        }}>
                          {isConfirmed ? (isEng ? "Confirmed & Signed" : "Confermata & Firmata") : (isEng ? "Awaiting Signature" : "In Attesa di Firma")}
                        </span>
                      </div>
                      <small style={{ color: "#888" }}>
                        📅 {format(new Date(change.created_at), 'dd MMMM yyyy, HH:mm', { locale: it })}
                      </small>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
                      <div style={{ textAlign: "right" }}>
                        <small style={{ color: "#888", display: "block" }}>{isEng ? "New Total" : "Nuovo Totale"}</small>
                        <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1e1b18" }}>
                          € {Number(change.totale_after).toLocaleString('it-IT')}
                        </span>
                        {delta !== 0 && (
                          <small style={{ display: "block", color: delta > 0 ? "#e58c2c" : "#166534" }}>
                            {delta > 0 ? "+" : ""}€ {delta.toLocaleString('it-IT')}
                          </small>
                        )}
                      </div>

                      {isConfirmed ? (
                        change.pdf_url ? (
                          <a
                            href={change.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "0.6rem 1.1rem",
                              borderRadius: "10px",
                              background: "#166534",
                              color: "#ffffff",
                              fontWeight: 600,
                              fontSize: "0.85rem",
                              textDecoration: "none",
                              whiteSpace: "nowrap"
                            }}
                          >
                            📄 {isEng ? "Addendum PDF" : "Allegato PDF"}
                          </a>
                        ) : null
                      ) : (
                        <Link
                          href={change.signing_url || `/preventivi/modifica/${change.id}?sig=${change.sig}`}
                          onClick={() => setNavigatingUrl(change.signing_url || `/preventivi/modifica/${change.id}?sig=${change.sig}`)}
                          style={{
                            padding: "0.65rem 1.2rem",
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: "0.88rem",
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                            boxShadow: "0 4px 12px rgba(229,140,44,0.35)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            transition: "transform 0.15s ease"
                          }}
                        >
                          {navigatingUrl === (change.signing_url || `/preventivi/modifica/${change.id}?sig=${change.sig}`) ? (
                            isEng ? "⏳ Opening..." : "⏳ Apertura..."
                          ) : (
                            `✍️ ${isEng ? "Sign Now" : "Firma Ora"} →`
                          )}
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Dettaglio Servizi Aggiunti / Rimossi */}
                  {(addedItems.length > 0 || removedItems.length > 0) && (
                    <div style={{ borderTop: "1px dashed #e2d7c7", paddingTop: "0.8rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                      {addedItems.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.85rem" }}>
                          <span style={{ fontWeight: 700, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.15rem 0.5rem", borderRadius: "6px" }}>
                            🟢 {isEng ? "Added Services:" : "Servizi Aggiunti:"}
                          </span>
                          {addedItems.map((item: any, i: number) => (
                            <span key={i} style={{ color: "#1e1b18", fontWeight: 600, background: "#ffffff", border: "1px solid #e8e2d9", padding: "0.15rem 0.5rem", borderRadius: "6px" }}>
                              + {item.descrizione} (€{(Number(item.prezzo_unitario) || 0).toLocaleString("it-IT")})
                            </span>
                          ))}
                        </div>
                      )}

                      {removedItems.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.85rem" }}>
                          <span style={{ fontWeight: 700, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", padding: "0.15rem 0.5rem", borderRadius: "6px" }}>
                            🔴 {isEng ? "Removed Services:" : "Servizi Rimossi:"}
                          </span>
                          {removedItems.map((item: any, i: number) => (
                            <span key={i} style={{ color: "#666", textDecoration: "line-through", background: "#ffffff", border: "1px solid #e8e2d9", padding: "0.15rem 0.5rem", borderRadius: "6px" }}>
                              - {item.descrizione} (€{(Number(item.prezzo_unitario) || 0).toLocaleString("it-IT")})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      </>
      )}

      {/* 3. ARCHIVIO EVENTI & CONTRATTI STORICI DELL'UTENTE */}
      {historicalQuotes.length > 0 && (
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "2.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #eee7de" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700 }}>
              {isHistoricalDashboard 
                ? (isEng ? "YOUR JOURNEY WITH US" : "LA VOSTRA STORIA CON NOI")
                : (isEng ? "YOUR BOOKING HISTORY" : "STORICO CONTRATTI ED EVENTI STIPULATI")}
            </span>
            <h2 style={{ fontSize: "1.65rem", color: "#1e1b18", marginTop: "0.2rem" }}>
              {isHistoricalDashboard ? "🌟 " : "📂 "}
              {isHistoricalDashboard 
                ? (isEng ? "Your Ecosystem & Events Archive" : "Il Vostro Ecosistema & Archivio Eventi")
                : (isEng ? "Your Events & Contracts Archive" : "I Miei Eventi & Archivio Contratti")}
            </h2>
            <p style={{ color: "#6a6764", fontSize: "0.95rem", marginTop: "0.3rem" }}>
              {isEng
                ? "Access all current and past event contracts registered under your name at La Terra degli Aranci."
                : "Consulta la cronologia di tutti gli eventi e contratti stipulati negli anni con La Terra degli Aranci."}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {historicalQuotes.map((q: any, idx: number) => {
              const isSignedItem = q.status === "firmato" || q.status === "convertito";
              const eventTypeLabel = q.tipo_evento === "wedding" ? (isEng ? "💍 Wedding Reception" : "💍 Ricevimento di Matrimonio") : (isEng ? "🎉 Private Event / Party" : "🎉 Evento Privato & Festa");
              const isPast = q.data_evento ? new Date(q.data_evento).getTime() < new Date().getTime() : false;
              
              return (
                <div
                  key={q.id || idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.2rem 1.6rem",
                  borderRadius: "14px",
                  background: "#faf8f5",
                  border: "1px solid #eee8df",
                  flexWrap: "wrap",
                  gap: "1rem"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.3rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "#1e1b18" }}>{eventTypeLabel}</span>
                    <span style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "0.25rem 0.7rem",
                      borderRadius: "20px",
                      background: isSignedItem ? (isPast ? "#475569" : "#166534") : "#c2410c",
                      color: "#ffffff",
                      textTransform: "uppercase"
                    }}>
                      {isSignedItem 
                        ? (isPast ? (isEng ? "Completed" : "Concluso") : (isEng ? "Signed & Active" : "Firmato & Attivo")) 
                        : (isEng ? "Pending Signature" : "In Attesa di Firma")}
                    </span>
                  </div>
                  <small style={{ color: "#777", display: "block" }}>
                    📅 {isEng ? "Event Date:" : "Data Evento:"} {q.data_evento || "Da concordare"} • {q.numero_ospiti || 100} {isEng ? "Guests" : "posti"}
                  </small>
                </div>

                {!isHistoricalDashboard && (
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1e1b18" }}>
                        € {(q.totale_calcolato || 15200).toLocaleString("it-IT")}
                      </span>
                    </div>

                    {isSignedItem ? (
                      <a
                        href={`/api/pdf/${q.id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: "0.65rem 1.2rem",
                          borderRadius: "10px",
                          background: "#166534",
                          color: "#ffffff",
                          fontWeight: 600,
                          fontSize: "0.88rem",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem"
                        }}
                      >
                        📄 {isEng ? "PDF Document" : "Scarica PDF"}
                      </a>
                    ) : (
                      <Link
                        href={contractUrl || "/contratti/wedding"}
                        onClick={() => setNavigatingUrl(contractUrl || "/contratti/wedding")}
                        style={{
                          padding: "0.65rem 1.2rem",
                          borderRadius: "10px",
                          background: "#e58c2c",
                          color: "#ffffff",
                          fontWeight: 600,
                          fontSize: "0.88rem",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem"
                        }}
                      >
                        {navigatingUrl === (contractUrl || "/contratti/wedding") ? (
                          isEng ? "⏳ Opening..." : "⏳ Apertura..."
                        ) : (
                          `✍️ ${isEng ? "Sign Now" : "Firma Ora"}`
                        )}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* 4. SEZIONE ESPERIENZE ED EVENTI EXTRA A LA TERRA DEGLI ARANCI */}
      {experiences && experiences.length > 0 && (
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "2.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #eee7de" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700 }}>
              {isEng ? "SPECIAL EXPERIENCES & GALA EVENTS" : "ESPERIENZE ED EVENTI SPECIALI VISSUTI"}
            </span>
            <h2 style={{ fontSize: "1.65rem", color: "#1e1b18", marginTop: "0.2rem" }}>
              ✨ {isEng ? "Your Experiences at La Terra degli Aranci" : "Le Vostre Esperienze a La Terra degli Aranci"}
            </h2>
            <p style={{ color: "#6a6764", fontSize: "0.95rem", marginTop: "0.3rem" }}>
              {isEng
                ? "Revisiting your exclusive dinners, concerts in the citrus grove, and seasonal gala celebrations."
                : "Ricorda le vostre cene esclusive, i concerti nell'agrumeto e le serate di gala a cui avete preso parte."}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {experiences.map((exp: any) => (
              <div
                key={exp.id}
                style={{
                  padding: "1.6rem",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #fdfbf7 0%, #faf6f0 100%)",
                  border: "1px solid #eee5d8",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1rem"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "#e58c2c", fontWeight: 700 }}>
                      {exp.categoria}
                    </span>
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "12px", background: "#f0fdf4", color: "#166534", fontWeight: 700 }}>
                      {exp.stato}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.15rem", color: "#1e1b18", fontWeight: 600, margin: "0 0 0.5rem 0" }}>
                    {exp.titolo}
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "#6a6764", lineHeight: 1.5, margin: 0 }}>
                    {exp.dettagli}
                  </p>
                </div>

                <div style={{ paddingTop: "0.8rem", borderTop: "1px dashed #e2d7c7", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "#777" }}>
                  <span>📅 {exp.data}</span>
                  <span style={{ color: "#e58c2c", fontWeight: 600 }}>La Terra degli Aranci</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. BANNER INCORAGGIAMENTO CROSS-SELLING (Solo Storico) */}
      {isHistoricalDashboard && (
        <div style={{ 
          background: "linear-gradient(135deg, #1e1b18 0%, #3a342e 100%)", 
          borderRadius: "20px", 
          padding: "3rem", 
          textAlign: "center", 
          color: "#ffffff",
          boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Sottile pattern di sfondo (opzionale css puro) */}
          <div style={{ position: "absolute", top: "-50px", left: "-50px", width: "150px", height: "150px", background: "radial-gradient(circle, rgba(229,140,44,0.1) 0%, transparent 70%)", borderRadius: "50%" }}></div>
          <div style={{ position: "absolute", bottom: "-50px", right: "-50px", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(229,140,44,0.1) 0%, transparent 70%)", borderRadius: "50%" }}></div>

          <div style={{ position: "relative", zIndex: 1, maxWidth: "600px", margin: "0 auto" }}>
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "1rem" }}>🌿</span>
            <h2 style={{ fontSize: "2rem", fontFamily: "serif", fontWeight: 400, margin: "0 0 1rem 0" }}>
              {isEng ? "A Return Home" : "Un Ritorno a Casa"}
            </h2>
            <p style={{ fontSize: "1.05rem", color: "#d2ccc4", lineHeight: 1.6, marginBottom: "2rem" }}>
              {isEng
                ? "La Terra degli Aranci will always be a bit of a home to you. If in the future you wish to celebrate a new chapter in your family (a special anniversary, a christening, or a private party), we would be delighted to welcome you back."
                : "La Terra degli Aranci resterà sempre un po' casa vostra. Se in futuro vorrete celebrare un nuovo capitolo della vostra famiglia (un anniversario speciale, un battesimo, o una festa privata), saremo felici di accogliervi di nuovo."}
            </p>
            <button 
              onClick={() => alert("Apertura modulo di contatto VIP / Chat con Roberto")}
              style={{
                background: "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
                color: "#ffffff",
                border: "none",
                padding: "1rem 2.5rem",
                borderRadius: "14px",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(229,140,44,0.3)",
                transition: "transform 0.2s"
              }}>
              {isEng ? "Tell us your idea" : "Raccontaci la tua idea"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
