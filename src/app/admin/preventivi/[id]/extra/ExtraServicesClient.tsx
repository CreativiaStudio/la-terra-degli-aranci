"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { ExtraQuote, ExtraServiceItem } from "@/lib/localDb";
import { saveExtraQuoteAction } from "./actions";

interface ExtraServicesClientProps {
  quote: any;
  initialExtraQuote: ExtraQuote | null;
}

const PRESETS: Array<{
  descrizione: string;
  prezzo_unitario: number;
  ripartizione: 'santo_stefano' | 'iovino' | '40_60' | '50_50';
}> = [
  {
    descrizione: "Allestimento Catenarie & Scenografia Luminosa Parco Aranci",
    prezzo_unitario: 650,
    ripartizione: "santo_stefano",
  },
  {
    descrizione: "Allestimento Floreale Extra Cerimonia Civile nel Giardino",
    prezzo_unitario: 800,
    ripartizione: "santo_stefano",
  },
  {
    descrizione: "Noleggio Auto d'Epoca per Ingresso Sposi",
    prezzo_unitario: 500,
    ripartizione: "santo_stefano",
  },
  {
    descrizione: "DJ Set & Service Audio/Luci Dedicato Sala Tufo",
    prezzo_unitario: 450,
    ripartizione: "santo_stefano",
  },
  {
    descrizione: "Ore Aggiuntive Open Bar con Bartender Dedicato (cad.)",
    prezzo_unitario: 350,
    ripartizione: "iovino",
  },
  {
    descrizione: "Angolo Sigari, Rhum & Degustazione Cioccolati Pregiati",
    prezzo_unitario: 400,
    ripartizione: "iovino",
  },
  {
    descrizione: "Buffet Dolci Tradizionali Napoletani & Graffata Calda a Vista",
    prezzo_unitario: 550,
    ripartizione: "iovino",
  },
  {
    descrizione: "Torta Nuziale Monumentale d'Autore con Taglio Scenografico",
    prezzo_unitario: 450,
    ripartizione: "iovino",
  },
];

export default function ExtraServicesClient({
  quote,
  initialExtraQuote,
}: ExtraServicesClientProps) {
  const [items, setItems] = useState<ExtraServiceItem[]>(
    initialExtraQuote?.items || []
  );
  const [noteInterne, setNoteInterne] = useState<string>(
    initialExtraQuote?.note_interne || ""
  );
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Calcolo quote in tempo reale
  let totaleSantoStefano = 0;
  let totaleIovino = 0;
  let totaleComplessivo = 0;

  for (const it of items) {
    const rigaTot = (Number(it.quantita) || 1) * (Number(it.prezzo_unitario) || 0);
    totaleComplessivo += rigaTot;
    if (it.ripartizione === "santo_stefano") {
      totaleSantoStefano += rigaTot;
    } else if (it.ripartizione === "iovino") {
      totaleIovino += rigaTot;
    } else if (it.ripartizione === "40_60") {
      totaleSantoStefano += rigaTot * 0.4;
      totaleIovino += rigaTot * 0.6;
    } else if (it.ripartizione === "50_50") {
      totaleSantoStefano += rigaTot * 0.5;
      totaleIovino += rigaTot * 0.5;
    }
  }

  const handleAddItem = (
    descrizione = "Nuovo Servizio Extra",
    prezzo = 0,
    ripartizione: 'santo_stefano' | 'iovino' | '40_60' | '50_50' = "santo_stefano"
  ) => {
    const newItem: ExtraServiceItem = {
      id: crypto.randomUUID(),
      descrizione,
      quantita: 1,
      prezzo_unitario: prezzo,
      totale: prezzo,
      ripartizione,
      note: "",
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (
    id: string,
    field: keyof ExtraServiceItem,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const qta = Number(field === "quantita" ? value : item.quantita) || 0;
        const pu =
          Number(field === "prezzo_unitario" ? value : item.prezzo_unitario) || 0;
        updated.totale = qta * pu;
        return updated;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = () => {
    setSaveStatus({ type: null, message: "" });
    startTransition(async () => {
      const res = await saveExtraQuoteAction(quote.id, items, noteInterne);
      if (res.success) {
        setSaveStatus({
          type: "success",
          message: "✓ Preventivo Parallelo salvato con successo!",
        });
        setTimeout(() => setSaveStatus({ type: null, message: "" }), 3500);
      } else {
        setSaveStatus({
          type: "error",
          message: res.error || "Errore durante il salvataggio.",
        });
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const clientName = `${quote.clients?.nome || ""} ${quote.clients?.cognome || ""}`.trim() || "Cliente TDA";
  const formattedEventDate = quote.data_evento
    ? format(new Date(quote.data_evento), "dd MMMM yyyy", { locale: it })
    : "Data da concordare";

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* CSS dedicato per la stampa cartacea ad uso direzione/cliente */}
      <style>{`
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
            font-family: 'Times New Roman', serif !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #333 !important;
            padding: 8px 10px !important;
            font-size: 11pt !important;
          }
          .print-table th {
            background-color: #f5f5f5 !important;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>

      {/* HEADER AMMINISTRAZIONE (NON-PRINT) */}
      <div className="no-print" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
          <Link
            href="/admin/preventivi"
            style={{ color: "#ea580c", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}
          >
            ← Torna al Registro Preventivi
          </Link>
          <span style={{ color: "#94a3b8" }}>|</span>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Rif. Preventivo: TDA-{quote.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fef3c7", color: "#92400e", padding: "0.25rem 0.75rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              🔒 RISERVATO DIREZIONE (INVISIBILE NELL&apos;AREA SPOSI)
            </div>
            <h1 style={{ margin: "0.2rem 0", color: "#1e1b18", fontSize: "2rem", fontFamily: "serif" }}>
              Allegato Preventivo Servizi Extra & Accessori
            </h1>
            <p style={{ margin: 0, color: "#64748b" }}>
              Cliente: <strong>{clientName}</strong> &bull; Evento: <strong>{formattedEventDate}</strong> &bull; {quote.tipo_evento?.toUpperCase()}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: "0.75rem 1.4rem",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#1e1b18",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              🖨️ Stampa Allegato Cartaceo
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              style={{
                padding: "0.75rem 1.6rem",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: isPending ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(229,140,44,0.3)",
              }}
            >
              {isPending ? "Salvataggio..." : "💾 Salva Modifiche"}
            </button>
          </div>
        </div>

        {saveStatus.message && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.8rem 1.2rem",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "0.9rem",
              background: saveStatus.type === "success" ? "#dcfce7" : "#fee2e2",
              color: saveStatus.type === "success" ? "#166534" : "#991b1b",
              border: `1px solid ${saveStatus.type === "success" ? "#86efac" : "#fca5a5"}`,
            }}
          >
            {saveStatus.message}
          </div>
        )}
      </div>

      {/* CARD KPI & RIPARTIZIONE FISCALE (NO-PRINT) */}
      <div
        className="no-print"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.2rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "1.5rem",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", fontWeight: 700 }}>
            TOTALE SERVIZI EXTRA
          </span>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#ea580c", marginTop: "0.3rem" }}>
            € {totaleComplessivo.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
          </div>
          <small style={{ color: "#94a3b8" }}>{items.length} voci registrate</small>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "1.5rem",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#0369a1", fontWeight: 700 }}>
              SANTO STEFANO S.R.L.
            </span>
            <span style={{ fontSize: "0.75rem", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
              Location / Allestimenti
            </span>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0284c7", marginTop: "0.3rem" }}>
            € {totaleSantoStefano.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
          </div>
          <small style={{ color: "#64748b" }}>
            {totaleComplessivo > 0 ? ((totaleSantoStefano / totaleComplessivo) * 100).toFixed(1) : 0}% del totale extra
          </small>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "1.5rem",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#166534", fontWeight: 700 }}>
              IOVINO BANQUETING S.R.L.
            </span>
            <span style={{ fontSize: "0.75rem", background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
              Food & Beverage
            </span>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#16a34a", marginTop: "0.3rem" }}>
            € {totaleIovino.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
          </div>
          <small style={{ color: "#64748b" }}>
            {totaleComplessivo > 0 ? ((totaleIovino / totaleComplessivo) * 100).toFixed(1) : 0}% del totale extra
          </small>
        </div>
      </div>

      {/* TASTI AGGIUNTA RAPIDA PRESETS (NO-PRINT) */}
      <div
        className="no-print"
        style={{
          background: "#f8fafc",
          border: "1px dashed #cbd5e1",
          borderRadius: "14px",
          padding: "1.2rem 1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
          <strong style={{ fontSize: "0.9rem", color: "#334155" }}>⚡ Preset Servizi Frequenti (Un click per inserire):</strong>
          <button
            type="button"
            onClick={() => handleAddItem()}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: "8px",
              border: "1px solid #ea580c",
              background: "#fff",
              color: "#ea580c",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            + Aggiungi Voce Personalizzata
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddItem(p.descrizione, p.prezzo_unitario, p.ripartizione)}
              style={{
                padding: "0.45rem 0.85rem",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                color: "#1e293b",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#ea580c")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
            >
              + {p.descrizione} (€{p.prezzo_unitario})
            </button>
          ))}
        </div>
      </div>

      {/* TABELLA EDITABILE AMMINISTRAZIONE (NO-PRINT) */}
      <div
        className="no-print"
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          overflow: "hidden",
          marginBottom: "2rem",
        }}
      >
        <div style={{ padding: "1.2rem 1.5rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#1e293b" }}>
            Elenco Servizi Extra & Assegnazione Fiscale
          </h2>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
            I prezzi inseriti qui rimangono interni e riservati alla Direzione.
          </span>
        </div>

        {items.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
            Nessun servizio extra inserito al momento. Usa i pulsanti preset sopra o aggiungi una voce personalizzata.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left", color: "#64748b" }}>
                  <th style={{ padding: "1rem" }}>Descrizione Servizio</th>
                  <th style={{ padding: "1rem", width: "90px" }}>Q.tà</th>
                  <th style={{ padding: "1rem", width: "140px" }}>Prezzo Unit. (€)</th>
                  <th style={{ padding: "1rem", width: "140px" }}>Totale (€)</th>
                  <th style={{ padding: "1rem", width: "200px" }}>Imputazione Azienda</th>
                  <th style={{ padding: "1rem", width: "60px", textAlign: "center" }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.8rem 1rem" }}>
                      <input
                        type="text"
                        value={item.descrizione}
                        onChange={(e) => handleUpdateItem(item.id, "descrizione", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.9rem",
                        }}
                      />
                    </td>

                    <td style={{ padding: "0.8rem 1rem" }}>
                      <input
                        type="number"
                        min="1"
                        value={item.quantita}
                        onChange={(e) => handleUpdateItem(item.id, "quantita", Number(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.9rem",
                        }}
                      />
                    </td>

                    <td style={{ padding: "0.8rem 1rem" }}>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={item.prezzo_unitario}
                        onChange={(e) => handleUpdateItem(item.id, "prezzo_unitario", Number(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                        }}
                      />
                    </td>

                    <td style={{ padding: "0.8rem 1rem", fontWeight: 700, color: "#1e293b" }}>
                      € {(item.quantita * item.prezzo_unitario).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                    </td>

                    <td style={{ padding: "0.8rem 1rem" }}>
                      <select
                        value={item.ripartizione}
                        onChange={(e) => handleUpdateItem(item.id, "ripartizione", e.target.value as any)}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          background:
                            item.ripartizione === "santo_stefano"
                              ? "#f0f9ff"
                              : item.ripartizione === "iovino"
                              ? "#f0fdf4"
                              : "#fff7ed",
                          color:
                            item.ripartizione === "santo_stefano"
                              ? "#0369a1"
                              : item.ripartizione === "iovino"
                              ? "#15803d"
                              : "#c2410c",
                        }}
                      >
                        <option value="santo_stefano">Santo Stefano S.r.l. (100%)</option>
                        <option value="iovino">Iovino Banqueting S.r.l. (100%)</option>
                        <option value="40_60">Split 40% SS / 60% Iovino</option>
                        <option value="50_50">Split 50% SS / 50% Iovino</option>
                      </select>
                    </td>

                    <td style={{ padding: "0.8rem 1rem", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Elimina voce"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "1.1rem",
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NOTE INTERNE DIREZIONE (NO-PRINT) */}
      <div
        className="no-print"
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <label style={{ display: "block", fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>
          📝 Note Interne Direzione (Fornitori, accordi verbali, modalità di pagamento contanti/bonifico):
        </label>
        <textarea
          rows={3}
          value={noteInterne}
          onChange={(e) => setNoteInterne(e.target.value)}
          placeholder="Es: Saldo extra richiesto 3 giorni prima dell'evento. Allestimento floreale concordato con fornitore esterno Mario Rossi..."
          style={{
            width: "100%",
            padding: "0.8rem",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontFamily: "inherit",
            fontSize: "0.9rem",
          }}
        />
      </div>

      {/* SEZIONE STAMPA CARTACEA UFFICIALE (VISIBLE SOLO IN STAMPA O ANTEPRIMA) */}
      <div
        className="print-only print-container"
        style={{
          fontFamily: "'Times New Roman', Times, serif",
          color: "#000",
          lineHeight: 1.5,
        }}
      >
        <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "1.5rem", marginBottom: "2rem" }}>
          <h1 style={{ margin: 0, fontSize: "24pt", textTransform: "uppercase", letterSpacing: "2px" }}>
            La Terra degli Aranci
          </h1>
          <p style={{ margin: "5px 0 0 0", fontSize: "11pt", fontStyle: "italic" }}>
            Santo Stefano S.r.l. &bull; Iovino Banqueting S.r.l. &bull; Napoli
          </p>
          <h2 style={{ margin: "1.2rem 0 0 0", fontSize: "16pt", textTransform: "uppercase" }}>
            Allegato Ufficiale Servizi Integrativi & Accessori Extra
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "10pt" }}>
            (Allegato integrante e sostanziale al Contratto di Ricevimento TDA-{quote.id.slice(0, 8).toUpperCase()})
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem", fontSize: "11pt" }}>
          <div>
            <strong>Committente / Sposi:</strong> {clientName}<br />
            <strong>Contatto Email:</strong> {quote.clients?.email || "Non indicata"}<br />
            <strong>Telefono:</strong> {quote.clients?.telefono || "Non indicato"}
          </div>
          <div style={{ textAlign: "right" }}>
            <strong>Data Evento:</strong> {formattedEventDate}<br />
            <strong>Tipologia Ricevimento:</strong> {quote.tipo_evento?.toUpperCase()}<br />
            <strong>Data Emissione Allegato:</strong> {format(new Date(), "dd/MM/yyyy")}
          </div>
        </div>

        <table className="print-table" style={{ width: "100%", marginBottom: "2rem" }}>
          <thead>
            <tr>
              <th style={{ width: "50px", textAlign: "center" }}>#</th>
              <th>Descrizione del Servizio Integrativo</th>
              <th style={{ width: "80px", textAlign: "center" }}>Q.tà</th>
              <th style={{ width: "120px", textAlign: "right" }}>Prezzo Unit.</th>
              <th style={{ width: "140px", textAlign: "right" }}>Importo Totale</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td style={{ textAlign: "center" }}>{index + 1}</td>
                <td>{item.descrizione}</td>
                <td style={{ textAlign: "center" }}>{item.quantita}</td>
                <td style={{ textAlign: "right" }}>€ {Number(item.prezzo_unitario).toFixed(2)}</td>
                <td style={{ textAlign: "right" }}>€ {Number(item.quantita * item.prezzo_unitario).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: "right", fontWeight: "bold", fontSize: "12pt" }}>
                TOTALE SERVIZI INTEGRATIVI EXTRA (IVA INCLUSA):
              </td>
              <td style={{ textAlign: "right", fontWeight: "bold", fontSize: "12pt" }}>
                € {totaleComplessivo.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Clausole e condizioni */}
        <div style={{ fontSize: "9pt", textAlign: "justify", marginBottom: "2.5rem", borderTop: "1px solid #ccc", paddingTop: "1rem" }}>
          <p style={{ margin: "0 0 6px 0" }}>
            <strong>Condizioni Generali Servizi Extra:</strong> I servizi integrativi sopra descritti vengono ordinati su espressa richiesta dei Committenti e formano parte integrante dell&apos;organizzazione dell&apos;evento nuziale/ricevimento presso La Terra degli Aranci.
          </p>
          <p style={{ margin: "0 0 6px 0" }}>
            Eventuali variazioni o aggiunte successive alla sottoscrizione del presente modulo dovranno pervenire per iscritto e concordate con congruo anticipo con la Direzione della struttura.
          </p>
        </div>

        {/* Box Firme */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3rem" }}>
          <div style={{ width: "45%", textAlign: "center" }}>
            <p style={{ fontSize: "11pt", margin: "0 0 4rem 0" }}>
              <strong>Per la Direzione</strong><br />
              (La Terra degli Aranci)
            </p>
            <div style={{ borderBottom: "1px solid #000", width: "80%", margin: "0 auto" }}></div>
          </div>

          <div style={{ width: "45%", textAlign: "center" }}>
            <p style={{ fontSize: "11pt", margin: "0 0 4rem 0" }}>
              <strong>Firma dei Committenti per Accettazione</strong><br />
              (Letto, confermato e sottoscritto)
            </p>
            <div style={{ borderBottom: "1px solid #000", width: "80%", margin: "0 auto" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
