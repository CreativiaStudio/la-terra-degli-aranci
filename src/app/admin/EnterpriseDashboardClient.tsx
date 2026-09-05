"use client";

import React from "react";
import StatsOverview from "./components/StatsOverview";
import QuickActionsBar from "./components/QuickActionsBar";
import QuotesTable from "./components/QuotesTable";

interface EnterpriseDashboardClientProps {
  quotes: any[];
  signedPdfs?: any[];
}

export default function EnterpriseDashboardClient({ quotes, signedPdfs = [] }: EnterpriseDashboardClientProps) {
  const preventiviInviati = quotes.length;
  const preventiviInAttesa = quotes.filter(q => q.status === 'inviato' || q.status === 'bozza').length;
  const contrattiInviati = quotes.filter(q => q.status === 'accettato' || q.status === 'convertito' || q.status === 'firmato').length;
  
  // Contratti in Attesa: contratti per cui è stato generato/inviato il link ma non sono ancora stati firmati dagli sposi
  const contrattiInAttesa = quotes.filter(q => {
    if (q.status !== 'convertito' && q.status !== 'accettato') return false;
    const nomeRaw = (q.clients?.nome || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cognomeRaw = (q.clients?.cognome || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const isSigned = signedPdfs.some(pdf => {
      const keyLower = pdf.key.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (nomeRaw && keyLower.includes(nomeRaw)) || (cognomeRaw && keyLower.includes(cognomeRaw));
    });
    return !isSigned && q.status !== 'firmato';
  }).length;

  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "1.5rem 0" }}>
      
      {/* Header Direzionale */}
      <div style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", color: "#e58c2c", fontWeight: "700" }}>
            La Terra degli Aranci • Area Direzionale
          </span>
          <h1 style={{ margin: "0.3rem 0 0 0", color: "#514d48", fontSize: "2.4rem", fontFamily: "serif", textAlign: "left" }}>
            Pannello di Controllo Direzionale
          </h1>
          <p style={{ margin: 0, color: "#777", fontSize: "1rem" }}>
            Benvenuto Roberto! Tutto sotto controllo: preventivi, contratti 1-click ed anagrafica sposi.
          </p>
        </div>

        <div style={{ background: "#ffffff", padding: "0.6rem 1.2rem", borderRadius: "20px", border: "1px solid #e0ddd9", fontSize: "0.85rem", fontWeight: "600", color: "#514d48" }}>
          🟢 Sistema Online & Sincronizzato con Cloudflare R2
        </div>
      </div>

      {/* 1. Bar dei 4 Box Pipeline */}
      <StatsOverview 
        preventiviInviati={preventiviInviati} 
        preventiviInAttesa={preventiviInAttesa} 
        contrattiInviati={contrattiInviati} 
        contrattiInAttesa={contrattiInAttesa} 
      />

      {/* 2. Azioni Rapide a Portata di Hand */}
      <QuickActionsBar />

      {/* 3. Registro Preventivi & Conversione 1-Click */}
      <QuotesTable quotes={quotes} signedPdfs={signedPdfs} />

    </div>
  );
}
