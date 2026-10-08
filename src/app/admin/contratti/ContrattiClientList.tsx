"use client";

import React, { useState } from "react";

/**
 * Contratto firmato mostrato nell'Archivio. Viene costruito lato server unendo
 * le quote firmate, i record `signed_contracts` e gli eventuali PDF orfani di R2.
 */
export interface SignedContractItem {
  id: string;
  quoteId: string;
  /** Codice evento (es. TDA-VALERIO). */
  codice: string;
  tipoEvento: "wedding" | "eventi";
  /** Intestatari / Sposi. */
  nomeSposi: string;
  /** Data evento ISO 'YYYY-MM-DD' ('' se non disponibile). */
  dataEvento: string;
  /** Data evento già formattata 'gg/mm/aaaa'. */
  dataEventoLabel: string;
  /** Timestamp di firma ISO. */
  dataFirma: string;
  /** Data di firma già formattata 'gg/mm/aaaa HH:mm'. */
  dataFirmaLabel: string;
  /** Totale concordato in Euro. */
  prezzo: number;
  /** Formula / Spazi. */
  formula: string;
  /** URL del PDF (R2 oppure endpoint /api/pdf). */
  pdfUrl: string;
  /** URL della Scheda Regia Evento ('' per i PDF orfani). */
  eventPageUrl: string;
  /** true per i PDF presenti solo su R2 senza quote collegata. */
  isOrphan?: boolean;
}

interface ContrattiClientListProps {
  eventiContracts: SignedContractItem[];
  weddingContracts: SignedContractItem[];
}

const AMBER = "#e58c2c";
const ANTHRACITE = "#1e1b18";
const BORDER = "#e0ddd9";

const euro = (value: number) =>
  `€ ${new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.max(0, Number(value) || 0))}`;

const label: React.CSSProperties = {
  fontSize: "0.7rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontWeight: 700,
  color: "#8a6a2f",
  marginBottom: "0.35rem",
};

const actionButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.55rem 0.95rem",
  borderRadius: "10px",
  border: `1px solid ${BORDER}`,
  background: "#ffffff",
  color: ANTHRACITE,
  fontFamily: "inherit",
  fontSize: "0.88rem",
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
};

export default function ContrattiClientList({ eventiContracts, weddingContracts }: ContrattiClientListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleEventi, setVisibleEventi] = useState(5);
  const [visibleWedding, setVisibleWedding] = useState(5);

  const filterContracts = (contracts: SignedContractItem[]) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return contracts;
    return contracts.filter((item) => {
      return (
        item.nomeSposi.toLowerCase().includes(query) ||
        item.codice.toLowerCase().includes(query) ||
        item.dataEventoLabel.toLowerCase().includes(query) ||
        item.dataEvento.toLowerCase().includes(query) ||
        item.formula.toLowerCase().includes(query)
      );
    });
  };

  const filteredEventi = filterContracts(eventiContracts);
  const filteredWedding = filterContracts(weddingContracts);

  const renderCard = (item: SignedContractItem) => (
    <li
      key={item.id}
      style={{
        listStyle: "none",
        border: `1px solid ${BORDER}`,
        borderRadius: "16px",
        padding: "1.3rem 1.4rem",
        background: "#fcfbf9",
        boxShadow: "0 6px 18px rgba(30,27,24,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1.1rem",
        }}
      >
        <div>
          <div style={label}>Intestatari / Sposi</div>
          <div style={{ fontWeight: 700, fontSize: "1.12rem", color: ANTHRACITE }}>{item.nomeSposi}</div>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            padding: "0.35rem 0.8rem",
            borderRadius: "999px",
            background: "#fff7ed",
            border: `1px solid ${AMBER}`,
            color: "#b45f0c",
            fontSize: "0.8rem",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          🎟️ {item.codice}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "0.9rem",
          marginBottom: "1.1rem",
        }}
      >
        <div>
          <div style={label}>Data Evento</div>
          <div style={{ fontWeight: 600, color: ANTHRACITE }}>{item.dataEventoLabel || "—"}</div>
        </div>
        <div>
          <div style={label}>Data di Firma</div>
          <div style={{ fontWeight: 600, color: ANTHRACITE }}>{item.dataFirmaLabel || "—"}</div>
        </div>
        <div>
          <div style={label}>Totale Concordato</div>
          <div style={{ fontWeight: 700, fontSize: "1.05rem", color: ANTHRACITE }}>{euro(item.prezzo)}</div>
        </div>
        <div>
          <div style={label}>Formula / Spazi</div>
          <div style={{ fontWeight: 600, color: ANTHRACITE }}>{item.formula}</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.6rem",
          flexWrap: "wrap",
          borderTop: `1px dashed ${BORDER}`,
          paddingTop: "1rem",
        }}
      >
        <a
          href={item.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...actionButton, background: `linear-gradient(135deg, ${AMBER} 0%, #d17a22 100%)`, color: "#ffffff", border: "none" }}
        >
          📄 Scarica / Visualizza PDF
        </a>
        {item.eventPageUrl && (
          <a href={item.eventPageUrl} target="_blank" rel="noopener noreferrer" style={actionButton}>
            🔎 Scheda Regia Evento
          </a>
        )}
        {item.isOrphan && (
          <span style={{ ...actionButton, cursor: "default", color: "#8a6a2f", background: "#fff7ed" }}>
            📦 PDF d&apos;archivio (senza scheda)
          </span>
        )}
      </div>
    </li>
  );

  const renderList = (
    contracts: SignedContractItem[],
    visibleCount: number,
    setVisible: (v: number) => void
  ) => {
    if (contracts.length === 0) {
      return <p style={{ color: "var(--text-light)", fontStyle: "italic" }}>Nessun contratto trovato.</p>;
    }

    const currentContracts = contracts.slice(0, visibleCount);
    const hasMore = visibleCount < contracts.length;

    return (
      <>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "1rem", margin: 0 }}>
          {currentContracts.map(renderCard)}
        </ul>
        {hasMore && (
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              onClick={() => setVisible(visibleCount + 5)}
              style={{
                background: "transparent",
                border: `1px solid ${AMBER}`,
                color: "#b45f0c",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              Carica altro
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div style={{ marginBottom: "2rem" }}>
        <input
          type="text"
          placeholder="Cerca per nome sposi, codice (es. TDA-VALERIO) o data..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: "0.8rem 1rem", fontSize: "1rem", borderRadius: "8px", border: "1px solid var(--border-color)", boxSizing: "border-box" }}
        />
      </div>

      <div className="form-grid">
        <div style={{ background: "#faf9f7", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <h2>Eventi Privati ({filteredEventi.length})</h2>
          {renderList(filteredEventi, visibleEventi, setVisibleEventi)}
        </div>

        <div style={{ background: "#faf9f7", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <h2>Wedding ({filteredWedding.length})</h2>
          {renderList(filteredWedding, visibleWedding, setVisibleWedding)}
        </div>
      </div>
    </>
  );
}
