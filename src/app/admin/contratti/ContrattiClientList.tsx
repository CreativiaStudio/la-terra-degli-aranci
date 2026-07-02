"use client";

import React, { useState } from "react";

type PdfFile = {
  key: string;
  lastModified?: Date;
  size?: number;
  url: string;
};

interface ContrattiClientListProps {
  eventiPdfs: PdfFile[];
  weddingPdfs: PdfFile[];
}

export default function ContrattiClientList({ eventiPdfs, weddingPdfs }: ContrattiClientListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleEventi, setVisibleEventi] = useState(5);
  const [visibleWedding, setVisibleWedding] = useState(5);

  const filterPdfs = (pdfs: PdfFile[]) => {
    return pdfs.filter(file => {
      const displayName = file.key.replace('contratti/eventi/', '').replace('contratti/wedding/', '').replace('.pdf', '').split('_').slice(1).join(' ') || file.key;
      const dateStr = file.lastModified?.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) || "";
      const searchLower = searchQuery.toLowerCase();
      
      return displayName.toLowerCase().includes(searchLower) || dateStr.toLowerCase().includes(searchLower);
    });
  };

  const filteredEventi = filterPdfs(eventiPdfs);
  const filteredWedding = filterPdfs(weddingPdfs);

  const renderList = (files: PdfFile[], visibleCount: number, setVisible: (v: number) => void, typeFolder: string) => {
    if (files.length === 0) {
      return <p style={{ color: "var(--text-light)", fontStyle: "italic" }}>Nessun contratto trovato.</p>;
    }

    const currentFiles = files.slice(0, visibleCount);
    const hasMore = visibleCount < files.length;

    return (
      <>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {currentFiles.map(file => {
            const displayName = file.key.replace(`contratti/${typeFolder}/`, '').replace('.pdf', '').split('_').slice(1).join(' ') || file.key.replace(`contratti/${typeFolder}/`, '');
            const dateStr = file.lastModified?.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
            const timeStr = file.lastModified?.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            
            return (
              <li key={file.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0", flex: 1 }}>
                  <span style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "1rem", lineHeight: "1.2" }}>{displayName}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-light)", lineHeight: "1.2" }}>{dateStr} {timeStr}</span>
                </div>
                <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ background: "var(--primary)", color: "white", padding: "0.4rem 0.8rem", borderRadius: "6px", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500, marginLeft: "1rem" }}>
                  Scarica
                </a>
              </li>
            );
          })}
        </ul>
        {hasMore && (
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button 
              onClick={() => setVisible(visibleCount + 5)}
              style={{ background: "transparent", border: "1px solid var(--primary)", color: "var(--primary)", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 }}
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
          placeholder="Cerca per nome o data (es. Luglio 2026)..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: "0.8rem 1rem", fontSize: "1rem", borderRadius: "8px", border: "1px solid var(--border-color)", boxSizing: "border-box" }}
        />
      </div>

      <div className="form-grid">
        <div style={{ background: "#faf9f7", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <h2>Eventi Privati ({filteredEventi.length})</h2>
          {renderList(filteredEventi, visibleEventi, setVisibleEventi, "eventi")}
        </div>

        <div style={{ background: "#faf9f7", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <h2>Wedding ({filteredWedding.length})</h2>
          {renderList(filteredWedding, visibleWedding, setVisibleWedding, "wedding")}
        </div>
      </div>
    </>
  );
}
