"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface CrmClientProps {
  quotes: any[];
  signedPdfs: any[];
  openDayClients?: any[];
}

function safeFormatDate(value: any, pattern: string = "dd MMMM yyyy"): string {
  if (!value) return "In definizione";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return format(d, pattern, { locale: it });
  } catch {
    return String(value);
  }
}

export default function CrmClient({ quotes, signedPdfs, openDayClients = [] }: CrmClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  // Print Operational View helper
  const handlePrintOperational = (title: string, contentHtml: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            h1 { font-family: Georgia, serif; color: #e58c2c; border-bottom: 2px solid #e58c2c; padding-bottom: 10px; }
            .box { background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px; }
            .bold { font-weight: bold; }
            .badge { background: #d4edda; color: #155724; padding: 4px 10px; border-radius: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>La Terra degli Aranci • ${title}</h1>
          ${contentHtml}
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintChef = (client: any) => {
    const html = `
      <div class="box">
        <h2>Scheda Operativa Cucina & Chef</h2>
        <p class="bold">Evento: ${client.nome} ${client.cognome} ${client.sposa_nome ? `& ${client.sposa_nome} ${client.sposa_cognome}` : ''}</p>
        <p>Data Evento: <span class="badge">${safeFormatDate(client.data_evento)}</span></p>
        <p>Totale Ospiti Previsti: <span class="bold">${client.n_ospiti} Pax</span></p>
      </div>
      <div class="box">
        <h3>Dettaglio Menù Speciali & Allergeni:</h3>
        <p class="bold" style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 6px;">
          ${client.wedding_diary?.intolleranze || 'Nessuna intolleranza speciale registrata.'}
        </p>
        <p><strong>Stile Servizio:</strong> ${client.wedding_diary?.stile_evento || 'Servizio Placcato Classico'}</p>
      </div>
    `;
    handlePrintOperational(`Scheda Chef - ${client.nome} ${client.cognome}`, html);
  };

  const handlePrintFiorista = (client: any) => {
    const html = `
      <div class="box">
        <h2>Scheda Operativa Allestimenti & Wedding Planner</h2>
        <p class="bold">Coppia: ${client.nome} ${client.cognome} ${client.sposa_nome ? `& ${client.sposa_nome} ${client.sposa_cognome}` : ''}</p>
        <p>Data Evento: <span class="badge">${safeFormatDate(client.data_evento)}</span></p>
        <p>Stile Desiderato: ${client.wedding_diary?.stile_evento}</p>
      </div>
      <div class="box">
        <h3>Palette Colori Scelta:</h3>
        <p class="bold">${client.wedding_diary?.palette_nomi ? client.wedding_diary.palette_nomi.join(' • ') : 'Standard Agrumeto'}</p>
        <h3>Intrattenimento & Scaletta Musica:</h3>
        <p>${client.wedding_diary?.musica || 'Musica di sottofondo ed intrattenimento'}</p>
      </div>
    `;
    handlePrintOperational(`Scheda Allestimenti - ${client.nome} ${client.cognome}`, html);
  };

  // 1. Mappa preventivi e contratti reali
  const quoteClients = (quotes || []).map(q => {
    const nomeRaw = (q.clients?.nome || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cognomeRaw = (q.clients?.cognome || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const signedMatch = signedPdfs.find(pdf => {
      const keyLower = pdf.key.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (nomeRaw && keyLower.includes(nomeRaw)) || (cognomeRaw && keyLower.includes(cognomeRaw));
    });

    const isFirmato = q.status === 'firmato' || Boolean(signedMatch);

    return {
      id: q.id,
      clientId: q.client_id || q.clients?.id || q.id,
      nome: q.clients?.nome || 'Cliente',
      cognome: q.clients?.cognome || '',
      sposa_nome: q.clients?.sposera_nome || '',
      sposa_cognome: q.clients?.sposera_cognome || '',
      email: q.clients?.email || '',
      telefono: q.clients?.telefono || '',
      tipo_evento: q.tipo_evento || 'wedding',
      data_evento: q.data_evento || 'In definizione',
      status: isFirmato ? 'firmato' : q.status || 'inviato',
      fonte_lead: q.source === 'tablet_segreteria' ? 'Tablet Segreteria' : 'Preventivo Ecosistema TDA',
      data_primo_contatto: q.created_at ? q.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      totale_preventivo: Number(q.totale_calcolato || 0),
      sconto: Number(q.sconto_fisso || 0),
      n_ospiti: q.numero_ospiti || 100,
      pdf_url: signedMatch ? signedMatch.url : null,
      wedding_diary: {
        compilato: isFirmato,
        progress: isFirmato ? 100 : 30,
        palette_colori: ["#e58c2c", "#2d5a27", "#ffffff"],
        palette_nomi: ["Arancio TDA", "Verde Natura", "Bianco Spose"],
        stile_evento: q.tipo_evento === 'wedding' ? "Matrimonio Esclusivo in Villa" : "Evento Privato",
        intolleranze: "Segnalazioni in fase di definizione con la cucina",
        musica: "Service Audio & Luci incluso",
        note_roberto: "Cliente registrato nell'ecosistema TDA."
      }
    };
  });

  // 2. Mappa lead qualificati registrati via Open Day (Cloudflare R2)
  const odClients = (openDayClients || []).map((od: any) => {
    const ans = od.diaryAnswers || {};
    return {
      id: od.id,
      clientId: od.id,
      nome: od.nome || 'Coppia Sposi',
      cognome: od.cognome || '',
      sposa_nome: ans.sposa_nome || '',
      sposa_cognome: ans.sposa_cognome || '',
      email: od.email || ans.sposo_email || ans.sposa_email || '',
      telefono: od.telefono || ans.sposo_telefono || ans.sposa_telefono || '',
      tipo_evento: 'wedding',
      data_evento: od.dataSognata || ans.data_matrimonio_desiderata || od.periodoSognato || 'In definizione',
      status: 'openday_lead',
      fonte_lead: od.provenienza || 'QR Code Open Day',
      data_primo_contatto: od.created_at ? od.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      totale_preventivo: 0,
      sconto: 0,
      n_ospiti: ans.numero_invitati_previsto || 100,
      pdf_url: null,
      wedding_diary: {
        compilato: Boolean(od.diaryProgress && od.diaryProgress > 0),
        progress: od.diaryProgress || 0,
        palette_colori: ans.palette_colori || ["#e58c2c", "#2d5a27"],
        palette_nomi: ["Arancio TDA", "Verde Parco"],
        stile_evento: ans.stile_matrimonio || "In definizione",
        intolleranze: ans.intolleranze_alimentari || "Nessuna segnalata",
        musica: ans.genere_musica_aperitivo || "Da concordare",
        note_roberto: `Registrato via QR Code Open Day. Avanzamento Wedding Diary: ${od.diaryProgress || 0}%.`,
        answers: ans,
      }
    };
  });

  // Unione dedup (priorità ai contratti firmati/preventivi, poi Open Day)
  const clientMap = new Map<string, any>();
  for (const c of quoteClients) {
    const key = (c.email || c.id).toLowerCase();
    clientMap.set(key, c);
  }
  for (const c of odClients) {
    const key = (c.email || c.id).toLowerCase();
    if (!clientMap.has(key)) {
      clientMap.set(key, c);
    }
  }

  const allClients = Array.from(clientMap.values());

  const filteredClients = allClients.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const full = `${c.nome} ${c.cognome} ${c.email} ${c.telefono}`.toLowerCase();
    return full.includes(q);
  });

  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
      
      {/* Header CRM */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", color: "#e58c2c", fontWeight: "bold" }}>
            GESTIONE CLIENTELA & LEAD 360°
          </span>
          <h1 style={{ margin: "0.3rem 0 0 0", color: "#514d48", fontSize: "2.2rem", fontFamily: "serif" }}>
            👥 CRM & Anagrafica Clienti
          </h1>
          <p style={{ margin: 0, color: "#777" }}>
            Panoramica completa di tutti i contatti: da dove provengono, preventivi, contratti firmati e Wedding Diary.
          </p>
        </div>
      </div>

      {/* Control Bar & Search */}
      <div className="premium-card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <input 
              type="text" 
              placeholder="🔍 Cerca per nome, cognome, email o telefono..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: "0.7rem 1.2rem", borderRadius: "8px", border: "1px solid #ddd", width: "320px", fontSize: "0.95rem" }}
            />
            <span style={{ color: "#777", fontSize: "0.9rem" }}>Trovati: <strong>{filteredClients.length} contatti</strong></span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span style={{ padding: "0.4rem 0.8rem", background: "#f0eee9", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold", color: "#555" }}>
              Tutti i Contatti ({allClients.length})
            </span>
          </div>
        </div>
      </div>

      {/* Tabella Clienti CRM */}
      <div className="premium-card" style={{ padding: "1rem", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", tableLayout: "fixed" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e8e2d9", color: "#78716c", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <th style={{ padding: "0.75rem 0.6rem", width: "26%" }}>Cliente / Sposi & Evento</th>
              <th style={{ padding: "0.75rem 0.6rem", width: "17%" }}>Contatti Direct</th>
              <th style={{ padding: "0.75rem 0.6rem", width: "13%" }}>Origine Lead</th>
              <th style={{ padding: "0.75rem 0.6rem", width: "10%" }}>Stato</th>
              <th style={{ padding: "0.75rem 0.6rem", textAlign: "right", width: "34%" }}>Azioni Ecosistema</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f0eee9", verticalAlign: "middle" }}>
                
                {/* Cliente & Evento (Combinati) */}
                <td style={{ padding: "0.75rem 0.6rem" }}>
                  <strong style={{ fontSize: "0.92rem", color: "#1e1b18", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.nome} {c.cognome} {(c as any).sposa_nome ? `& ${(c as any).sposa_nome} ${(c as any).sposa_cognome}` : ''}
                  </strong>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.74rem", color: "#78716c", marginTop: "0.1rem", whiteSpace: "nowrap" }}>
                    <span style={{ color: "#e58c2c", fontWeight: 700 }}>
                      {c.tipo_evento === 'wedding' ? '💍 Wedding' : '🎉 Privato'} ({c.n_ospiti} Pax)
                    </span>
                    <span>•</span>
                    <span style={{ fontWeight: 600, color: "#514d48" }}>
                      📅 {c.data_evento ? safeFormatDate(c.data_evento, 'dd MMM yyyy') : 'Da definire'}
                    </span>
                  </div>
                </td>

                {/* Contatti */}
                <td style={{ padding: "0.75rem 0.6rem" }}>
                  <small style={{ display: "block", color: "#6a6764", fontSize: "0.76rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.email || '—'}</small>
                  {c.telefono ? (
                    <a
                      href={`https://wa.me/${c.telefono.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "0.74rem", color: "#16a34a", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.15rem", whiteSpace: "nowrap" }}
                    >
                      📱 {c.telefono}
                    </a>
                  ) : (
                    <span style={{ fontSize: "0.74rem", color: "#aaa" }}>Nessun telefono</span>
                  )}
                </td>

                {/* Origine Lead */}
                <td style={{ padding: "0.75rem 0.6rem" }}>
                  <span
                    title={c.fonte_lead}
                    style={{
                      fontSize: "0.72rem",
                      background: c.status === 'openday_lead' ? "#f0fdf4" : "#f5f0e8",
                      border: `1px solid ${c.status === 'openday_lead' ? "#bbf7d0" : "#e8e2d9"}`,
                      padding: "0.2rem 0.45rem",
                      borderRadius: "6px",
                      color: c.status === 'openday_lead' ? "#166534" : "#544e45",
                      fontWeight: 600,
                      maxWidth: "140px",
                      display: "inline-block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.status === 'openday_lead' ? '🌿 QR Open Day' : `🎯 ${c.fonte_lead}`}
                  </span>
                </td>

                {/* Stato Workflow */}
                <td style={{ padding: "0.75rem 0.6rem", whiteSpace: "nowrap" }}>
                  <span style={{
                    padding: "0.25rem 0.55rem",
                    borderRadius: "16px",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    background: c.status === 'firmato' ? '#f0fdf4' : c.status === 'openday_lead' ? '#ecfdf5' : c.status === 'in_trattativa' ? '#fff7ed' : '#f0f9ff',
                    color: c.status === 'firmato' ? '#15803d' : c.status === 'openday_lead' ? '#047857' : c.status === 'in_trattativa' ? '#c2410c' : '#0369a1',
                    border: `1px solid ${c.status === 'firmato' ? '#bbf7d0' : c.status === 'openday_lead' ? '#a7f3d0' : c.status === 'in_trattativa' ? '#ffedd5' : '#bae6fd'}`,
                  }}>
                    {c.status === 'firmato' ? '✍️ FIRMATO' : c.status === 'openday_lead' ? `💍 DIARIO ${c.wedding_diary?.progress || 0}%` : c.status === 'in_trattativa' ? 'TRATTATIVA' : 'VISITA'}
                  </span>
                </td>

                {/* Tasti Azione Ecosistema Sincronizzati */}
                <td style={{ padding: "0.75rem 0.6rem", textAlign: "right", whiteSpace: "nowrap" }}>
                  <div style={{ display: "inline-flex", gap: "0.3rem", alignItems: "center", justifyContent: "flex-end" }}>
                    {c.status === 'openday_lead' && (
                      <a
                        href={`/openday/diario?id=${c.id}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Apri Wedding Diary Coppia"
                        style={{
                          padding: "0.4rem 0.65rem",
                          background: "#ecfdf5",
                          color: "#047857",
                          border: "1px solid #a7f3d0",
                          borderRadius: "7px",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.2rem",
                        }}
                      >
                        📖 Diario {c.wedding_diary?.progress || 0}%
                      </a>
                    )}
                    <a
                      href={`/admin/project-builder/segreteria?session=${c.id}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Tablet Staff Accoglienza"
                      style={{
                        padding: "0.4rem 0.65rem",
                        background: "#fff7ed",
                        color: "#c2410c",
                        border: "1px solid #ffedd5",
                        borderRadius: "7px",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.2rem",
                      }}
                    >
                      📋 Tablet
                    </a>

                    <a
                      href={`/admin/project-builder/roberto?session=${c.id}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Control Panel Roberto Ufficio"
                      style={{
                        padding: "0.4rem 0.7rem",
                        background: "#1e1b18",
                        color: "#ffffff",
                        borderRadius: "7px",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.2rem",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.12)",
                      }}
                    >
                      💼 Roberto
                    </a>

                    <button 
                      type="button" 
                      onClick={() => setSelectedClient(c)}
                      title="Apri Scheda Dettagliata 360°"
                      style={{
                        padding: "0.4rem 0.65rem",
                        background: "#ffffff",
                        color: "#1e1b18",
                        border: "1px solid #e8e2d9",
                        borderRadius: "7px",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.2rem",
                      }}
                    >
                      👁️ Scheda 360°
                    </button>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODALE SCHEDA CLIENTE 360° ENTERPRISE */}
      {selectedClient && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(5px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "2rem"
        }}>
          <div style={{
            background: "#ffffff",
            width: "100%",
            maxWidth: "900px",
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: "16px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            padding: "2.5rem",
            position: "relative"
          }}>
            
            {/* Tasto Chiudi */}
            <button 
              type="button" 
              onClick={() => setSelectedClient(null)}
              style={{
                position: "absolute",
                top: "1.5rem",
                right: "1.5rem",
                background: "#f0eee9",
                border: "none",
                fontSize: "1.2rem",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              ✕
            </button>

            {/* Header Scheda Cliente */}
            <div style={{ borderBottom: "2px solid #f0eee9", paddingBottom: "1.5rem", marginBottom: "1.8rem" }}>
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: "bold" }}>
                SCHEDA CLIENTE 360° ENTERPRISE
              </span>
              <h2 style={{ margin: "0.3rem 0", color: "#514d48", fontSize: "2rem", fontFamily: "serif" }}>
                {selectedClient.nome} {selectedClient.cognome} {selectedClient.sposa_nome ? `& ${selectedClient.sposa_nome} ${selectedClient.sposa_cognome}` : ''}
              </h2>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ padding: "0.3rem 0.8rem", background: "#d4edda", color: "#155724", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "bold" }}>
                  Status: {selectedClient.status.toUpperCase()}
                </span>
                <span style={{ color: "#777", fontSize: "0.9rem" }}>
                  Data Evento: <strong>{safeFormatDate(selectedClient.data_evento)}</strong>
                </span>
              </div>

              {/* PROJECT BUILDER FAST LAUNCHER BAR */}
              <div style={{ marginTop: "1rem", padding: "0.9rem 1.1rem", background: "#fff7ed", borderRadius: "12px", border: "1px solid #ffedd5", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    ⚡ Project Builder Live:
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  <a
                    href={`/admin/project-builder/segreteria?session=${selectedClient.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: "0.45rem 0.9rem", background: "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "0.82rem", fontWeight: "bold", boxShadow: "0 2px 6px rgba(229,140,44,0.3)" }}
                  >
                    📋 Avvia Accoglienza Tablet (Segreteria)
                  </a>
                  <a
                    href={`/admin/project-builder/roberto?session=${selectedClient.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: "0.45rem 0.9rem", background: "#1e1b18", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "0.82rem", fontWeight: "bold" }}
                  >
                    💼 Avvia Trattativa Roberto
                  </a>
                  <a
                    href={`/cliente/project-builder?session=${selectedClient.id}&type=${selectedClient.tipo_evento || 'wedding'}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: "0.45rem 0.9rem", background: "#ffffff", color: "#1e1b18", border: "1px solid #e2d7c7", borderRadius: "8px", textDecoration: "none", fontSize: "0.82rem", fontWeight: "bold" }}
                  >
                    ✨ Schermo Ufficio Sposi
                  </a>
                  <a
                    href={`/cliente?id=${selectedClient.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: "0.45rem 0.9rem", background: "#f5f0e8", color: "#c2410c", border: "1px solid #e58c2c", borderRadius: "8px", textDecoration: "none", fontSize: "0.82rem", fontWeight: "bold" }}
                  >
                    💍 Portale Sposi (Post-Firma)
                  </a>
                </div>
              </div>
            </div>

            {/* Grid 2 Colonne Informazioni */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "2rem" }}>
              
              {/* Colonna Sinistra: Anagrafica & Documenti */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* 1. Dati di Contatto & Origine */}
                <div style={{ background: "#faf8f5", padding: "1.2rem", borderRadius: "10px", border: "1px solid #e0ddd9" }}>
                  <h4 style={{ margin: "0 0 0.8rem 0", color: "#514d48", borderBottom: "1px solid #ddd", paddingBottom: "0.4rem" }}>
                    📌 Anagrafica & Origine Lead
                  </h4>
                  <p style={{ margin: "0.3rem 0", fontSize: "0.9rem" }}><strong>Email:</strong> {selectedClient.email}</p>
                  <p style={{ margin: "0.3rem 0", fontSize: "0.9rem" }}><strong>Telefono:</strong> {selectedClient.telefono}</p>
                  <p style={{ margin: "0.3rem 0", fontSize: "0.9rem" }}><strong>Come è entrato:</strong> <span style={{ color: "#e58c2c", fontWeight: "bold" }}>{selectedClient.fonte_lead}</span></p>
                  <p style={{ margin: "0.3rem 0", fontSize: "0.9rem" }}><strong>Data Primo Contatto:</strong> {selectedClient.data_primo_contatto}</p>
                </div>

                {/* 2. Documenti & Contratti */}
                <div style={{ background: "#faf8f5", padding: "1.2rem", borderRadius: "10px", border: "1px solid #e0ddd9" }}>
                  <h4 style={{ margin: "0 0 0.8rem 0", color: "#514d48", borderBottom: "1px solid #ddd", paddingBottom: "0.4rem" }}>
                    📑 Documenti & Proposta Economica
                  </h4>
                  <p style={{ margin: "0.3rem 0", fontSize: "0.9rem" }}><strong>Totale Proposta:</strong> € {selectedClient.totale_preventivo.toLocaleString('it-IT')}</p>
                  {selectedClient.sconto > 0 && (
                    <p style={{ margin: "0.3rem 0", fontSize: "0.9rem", color: "#2d5a27" }}><strong>Sconto Applicato:</strong> € {selectedClient.sconto.toLocaleString('it-IT')}</p>
                  )}
                  <p style={{ margin: "0.3rem 0", fontSize: "0.9rem" }}><strong>Numero Ospiti Stimato:</strong> {selectedClient.n_ospiti} Pax</p>

                  <div style={{ marginTop: "1rem", display: "flex", gap: "0.8rem" }}>
                    {selectedClient.pdf_url ? (
                      <a href={selectedClient.pdf_url} target="_blank" rel="noopener noreferrer" style={{ padding: "0.6rem 1rem", background: "#2d5a27", color: "white", textDecoration: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "0.85rem" }}>
                        ✍️ Vedi PDF Contratto Firmato (R2)
                      </a>
                    ) : (
                      <span style={{ padding: "0.5rem 0.8rem", background: "#e58c2c", color: "white", borderRadius: "6px", fontWeight: "bold", fontSize: "0.85rem" }}>
                        ✓ Contratto Cifrato Registrato
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Stato Pagamenti */}
                <div style={{ background: "#faf8f5", padding: "1.2rem", borderRadius: "10px", border: "1px solid #e0ddd9" }}>
                  <h4 style={{ margin: "0 0 0.8rem 0", color: "#514d48", borderBottom: "1px solid #ddd", paddingBottom: "0.4rem" }}>
                    💶 Stato Pagamenti & Acconti
                  </h4>
                  <p style={{ margin: "0.3rem 0", fontSize: "0.9rem", color: "#2d5a27", fontWeight: "bold" }}>
                    ✓ 1° Acconto Caparra (30%): € {(selectedClient.totale_preventivo * 0.3).toLocaleString('it-IT')} RICEVUTO
                  </p>
                  <p style={{ margin: "0.3rem 0", fontSize: "0.9rem", color: "#856404" }}>
                    ⏳ 2° Acconto (30%): € {(selectedClient.totale_preventivo * 0.3).toLocaleString('it-IT')} In Scadenza
                  </p>
                  <p style={{ margin: "0.3rem 0", fontSize: "0.9rem", color: "#004085" }}>
                    🔹 Saldo Finale: € {(selectedClient.totale_preventivo * 0.4).toLocaleString('it-IT')} Giorno Evento
                  </p>
                </div>

              </div>

              {/* Colonna Destra: Wedding Diary & Preferenze Complete */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                <div style={{ background: "#ffffff", padding: "1.2rem", borderRadius: "10px", border: "2px solid #e58c2c" }}>
                  <h4 style={{ margin: "0 0 0.8rem 0", color: "#e58c2c", borderBottom: "1px solid #eee", paddingBottom: "0.4rem" }}>
                    📖 Wedding Diary & Risposte Sposi
                  </h4>

                  {selectedClient.wedding_diary?.compilato ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.9rem" }}>
                      
                      <div>
                        <strong>🎨 Palette Colori Scelta:</strong>
                        <div style={{ display: "flex", gap: "8px", marginTop: "6px", alignItems: "center" }}>
                          {selectedClient.wedding_diary.palette_colori.map((color: string, i: number) => (
                            <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem" }}>
                              <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: color, border: "1px solid #ccc", display: "inline-block" }}></span>
                              {selectedClient.wedding_diary.palette_nomi[i]}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <strong>✨ Stile & Atmosfera Desiderata:</strong>
                        <p style={{ margin: "3px 0 0 0", color: "#555" }}>{selectedClient.wedding_diary.stile_evento}</p>
                      </div>

                      <div>
                        <strong>🍷 Intolleranze Alimentari & Allergie:</strong>
                        <p style={{ margin: "3px 0 0 0", color: "#856404", background: "#fff3cd", padding: "0.5rem", borderRadius: "6px" }}>
                          {selectedClient.wedding_diary.intolleranze}
                        </p>
                      </div>

                      <div>
                        <strong>🎵 Intrattenimento Musicale:</strong>
                        <p style={{ margin: "3px 0 0 0", color: "#555" }}>{selectedClient.wedding_diary.musica}</p>
                      </div>

                      {/* PULSANTI ESPORTAZIONE SCHEDE OPERATIVE CUCINA & ALLSTIMENTI */}
                      <div style={{ borderTop: "1px solid #eee", paddingTop: "0.8rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                        <button 
                          type="button" 
                          onClick={() => handlePrintChef(selectedClient)}
                          style={{ padding: "0.5rem 0.8rem", background: "#514d48", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "0.8rem", cursor: "pointer" }}
                        >
                          👨‍🍳 Scheda Chef & Cucina
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handlePrintFiorista(selectedClient)}
                          style={{ padding: "0.5rem 0.8rem", background: "#e58c2c", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "0.8rem", cursor: "pointer" }}
                        >
                          🌺 Scheda Allestimenti
                        </button>
                      </div>

                    </div>
                  ) : (
                    <p style={{ color: "#888", fontStyle: "italic" }}>
                      In attesa di compilazione del Wedding Diary da parte degli sposi.
                    </p>
                  )}
                </div>

                {/* Note Riservate Roberto Sola */}
                <div style={{ background: "#faf8f5", padding: "1.2rem", borderRadius: "10px", border: "1px solid #e0ddd9" }}>
                  <h4 style={{ margin: "0 0 0.8rem 0", color: "#514d48", borderBottom: "1px solid #ddd", paddingBottom: "0.4rem" }}>
                    📝 Note Direzionali Roberto Sola
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#444", fontStyle: "italic", lineHeight: "1.5" }}>
                    "{selectedClient.wedding_diary?.note_roberto || 'Nessuna nota inserita.'}"
                  </p>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
