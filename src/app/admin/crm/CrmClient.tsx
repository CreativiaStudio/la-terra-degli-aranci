"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface CrmClientProps {
  clients?: any[];
  diaries?: any[];
  quotes?: any[];
  signedPdfs?: any[];
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

export default function CrmClient({
  clients = [],
  diaries = [],
  quotes = [],
  signedPdfs = [],
  openDayClients = [],
}: CrmClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  // Print Operational View helper
  const handlePrintOperational = (title: string, contentHtml: string) => {
    const printWindow = window.open("", "_blank");
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
    const wd = client.wedding_diary || {};
    const ans = wd.answers || {};
    const html = `
      <div class="box">
        <h2>Scheda Operativa Cucina & Chef</h2>
        <p class="bold">Evento: ${client.nome} ${client.cognome} ${client.sposa_nome ? `& ${client.sposa_nome} ${client.sposa_cognome}` : ""}</p>
        <p>Data Evento: <span class="badge">${safeFormatDate(client.data_evento)}</span></p>
        <p>Totale Ospiti Previsti: <span class="bold">${client.n_ospiti} Pax</span></p>
        <p>Formula & Servizio: <span class="bold">${ans.stile_servizio || wd.stile_evento || "Servizio Placcato Classico"}</span></p>
      </div>
      <div class="box">
        <h3>Dettaglio Menù Speciali & Allergeni:</h3>
        <p class="bold" style="color: #856404; background: #fff3cd; padding: 12px; border-radius: 6px; font-size: 1.1rem;">
          ⚠️ ${wd.intolleranze || ans.intolleranze_alimentari || "Nessuna intolleranza speciale registrata."}
        </p>
        <p><strong>Isole & Angoli Speciali Desiderati:</strong> ${
          Array.isArray(ans.angoli_speciali)
            ? ans.angoli_speciali.join(" • ")
            : ans.angoli_speciali || "Standard villa"
        }</p>
        <p><strong>Torta Nuziale:</strong> ${ans.torta_nuziale_desiderata || "Millefoglie espressa ai frutti di bosco"}</p>
        <p><strong>Selezione Vini:</strong> ${ans.vino_preferito || (Array.isArray(ans.vino_e_brindisi) ? ans.vino_e_brindisi.join(", ") : "Vini campani DOC")}</p>
      </div>
    `;
    handlePrintOperational(`Scheda Chef - ${client.nome} ${client.cognome}`, html);
  };

  const handlePrintFiorista = (client: any) => {
    const wd = client.wedding_diary || {};
    const ans = wd.answers || {};
    const html = `
      <div class="box">
        <h2>Scheda Operativa Allestimenti & Wedding Planner</h2>
        <p class="bold">Coppia: ${client.nome} ${client.cognome} ${client.sposa_nome ? `& ${client.sposa_nome} ${client.sposa_cognome}` : ""}</p>
        <p>Data Evento: <span class="badge">${safeFormatDate(client.data_evento)}</span></p>
        <p>Stile Desiderato: <span class="bold">${wd.stile_evento || ans.stile_matrimonio || "Botanico Chic"}</span></p>
      </div>
      <div class="box">
        <h3>Palette Colori Scelta:</h3>
        <p class="bold" style="color: #2D5A27; font-size: 1.1rem;">
          ${Array.isArray(wd.palette_colori) ? wd.palette_colori.join(" • ") : "Arancio TDA • Verde Parco"}
        </p>
        <h3>Fiori & Atmosfera:</h3>
        <p><strong>Allestimenti Floreali:</strong> ${ans.allestimenti_floreali || (Array.isArray(ans.fiori_e_allestimenti) ? ans.fiori_e_allestimenti.join(", ") : "Agrumi e foliage spontaneo")}</p>
        <p><strong>Luci & Ambienti:</strong> ${Array.isArray(ans.luci_e_atmosfere) ? ans.luci_e_atmosfere.join(" • ") : "Cielo stellato di micro-led"}</p>
        <p><strong>Profumazione Ambienti:</strong> ${ans.profumazione_ambienti || "Zagara e fiori d'arancio"}</p>
        <h3>Scaletta Musicale Emozionale:</h3>
        <p><strong>Ingresso Sposa:</strong> ${ans.canzone_ingresso_sposa || "River Flows in You"}</p>
        <p><strong>Ingresso Sposi:</strong> ${ans.brano_ingresso_sposi || "Fix You"}</p>
        <p><strong>Primo Ballo:</strong> ${ans.primo_ballo_insieme || "Perfect - Ed Sheeran"}</p>
        <p><strong>Taglio Torta:</strong> ${ans.brano_ingresso_torta || "A Sky Full of Stars"}</p>
      </div>
    `;
    handlePrintOperational(`Scheda Allestimenti - ${client.nome} ${client.cognome}`, html);
  };

  // Helper unificato per risolvere il Wedding Diary completo di qualsiasi cliente
  const resolveDiaryForClient = (clientId: string, clientEmail?: string) => {
    // 1. Cerca in diaries (store.wedding_diaries e cloud)
    const foundDiary = (diaries || []).find((d: any) =>
      (d?.client_id && String(d.client_id).toLowerCase() === String(clientId).toLowerCase()) ||
      (d?.quote_id && String(d.quote_id).toLowerCase() === String(clientId).toLowerCase()) ||
      (d?.id && String(d.id).toLowerCase() === String(clientId).toLowerCase())
    );

    // 2. Cerca in openDayClients
    const foundOd = (openDayClients || []).find((od: any) =>
      String(od?.id).toLowerCase() === String(clientId).toLowerCase() ||
      (clientEmail && od?.email && od.email.toLowerCase() === clientEmail.toLowerCase())
    );

    // 3. Cerca in clients locale
    const foundClient = (clients || []).find((c: any) =>
      String(c?.id).toLowerCase() === String(clientId).toLowerCase() ||
      (clientEmail && c?.email && c.email.toLowerCase() === clientEmail.toLowerCase())
    );

    const ans: Record<string, any> = {
      ...(foundClient?.diaryAnswers || {}),
      ...(foundOd?.diaryAnswers || {}),
      ...(foundDiary?.answers || {}),
    };

    const hasAnswers = Object.keys(ans).length > 0;
    const progress = foundOd?.diaryProgress || foundClient?.diaryProgress || (hasAnswers ? 54 : 0);

    const paletteColors = Array.isArray(ans.palette_colori)
      ? ans.palette_colori
      : typeof ans.palette_colori === "string"
      ? ans.palette_colori.split(",").map((c: string) => c.trim())
      : ["#E58C2C", "#2D5A27"];

    const stileEvento =
      ans.stile_matrimonio ||
      ans.style_mood ||
      (Array.isArray(ans.Stile_evento) ? ans.Stile_evento.join(" • ") : ans.Stile_evento) ||
      "Botanico Elegante & Luci d'Autore";

    const musicStr = [
      ans.genere_musica_aperitivo ? `Aperitivo: ${ans.genere_musica_aperitivo}` : "",
      ans.canzone_ingresso_sposa ? `Ingresso Sposa: ${ans.canzone_ingresso_sposa}` : "",
      ans.brano_ingresso_sposi ? `Ingresso Sposi: ${ans.brano_ingresso_sposi}` : "",
      ans.primo_ballo_insieme ? `Primo Ballo: ${ans.primo_ballo_insieme}` : "",
      ans.brano_ingresso_torta ? `Taglio Torta: ${ans.brano_ingresso_torta}` : "",
    ]
      .filter(Boolean)
      .join(" • ") || "Musica dal vivo durante aperitivo e DJ set dopocena";

    return {
      compilato: hasAnswers || progress > 0,
      progress: progress || (hasAnswers ? 50 : 0),
      palette_colori: paletteColors,
      palette_nomi: paletteColors.map((hex: string) =>
        hex === "#E58C2C"
          ? "Arancio TDA"
          : hex === "#2D5A27"
          ? "Verde Parco"
          : hex === "#514D48"
          ? "Tufo Nobile"
          : "Colore Spose"
      ),
      stile_evento: stileEvento,
      intolleranze: ans.intolleranze_alimentari || ans.dietary_notes || "Nessuna intolleranza segnalata al momento",
      musica: musicStr,
      note_roberto:
        ans.note_diario ||
        ans.general_notes ||
        ans.esigenze_particolari ||
        `Registrato nell'ecosistema TDA. Avanzamento Wedding Diary: ${progress}%.`,
      answers: ans,
    };
  };

  // Unificazione a 3 Sorgenti: Quotes Reali + Open Day Cloud R2 + Anagrafica Master store.clients
  const allClients = useMemo(() => {
    const clientMap = new Map<string, any>();

    // 1. Mappa anagrafica Master (store.clients)
    (clients || []).forEach((c: any) => {
      if (!c || !c.id) return;
      const key = (c.id || c.email || "").toLowerCase();
      const wd = resolveDiaryForClient(c.id, c.email);
      const ans = wd.answers || {};

      clientMap.set(key, {
        id: c.id,
        clientId: c.id,
        nome: c.nome || ans.sposo_nome || "Cliente TDA",
        cognome: c.cognome || ans.sposo_cognome || "",
        sposa_nome: c.sposa_nome || ans.sposa_nome || "",
        sposa_cognome: c.sposa_cognome || ans.sposa_cognome || "",
        email: c.email || ans.sposo_email || ans.sposa_email || "",
        telefono: c.telefono || ans.sposo_telefono || ans.sposa_telefono || "",
        tipo_evento: c.tipo_evento || "wedding",
        data_evento: c.data_evento || c.dataSognata || ans.data_matrimonio_desiderata || c.periodoSognato || "In definizione",
        status: (c.tags && c.tags.includes("Open Day")) ? "openday_lead" : (c.status || "in_trattativa"),
        fonte_lead: c.provenienza || (c.tags && c.tags.includes("Open Day") ? "QR Code Open Day" : "Anagrafica Ecosistema TDA"),
        data_primo_contatto: c.created_at ? c.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        totale_preventivo: Number(c.totale_preventivo || 0),
        sconto: Number(c.sconto || 0),
        n_ospiti: Number(ans.numero_invitati_previsto) || Number(c.numero_ospiti) || 110,
        pdf_url: null,
        wedding_diary: wd,
      });
    });

    // 2. Mappa lead qualificati registrati via Open Day (Cloudflare R2 o locale)
    (openDayClients || []).forEach((od: any) => {
      if (!od || !od.id) return;
      const key = (od.id || od.email || "").toLowerCase();
      const wd = resolveDiaryForClient(od.id, od.email);
      const ans = wd.answers || {};

      const existing = clientMap.get(key);
      const mergedNome = od.nome || existing?.nome || ans.sposo_nome || "Coppia Sposi";
      const mergedCognome = od.cognome || existing?.cognome || ans.sposo_cognome || "";

      clientMap.set(key, {
        id: od.id,
        clientId: od.id,
        nome: mergedNome,
        cognome: mergedCognome,
        sposa_nome: ans.sposa_nome || existing?.sposa_nome || "",
        sposa_cognome: ans.sposa_cognome || existing?.sposa_cognome || "",
        email: od.email || existing?.email || ans.sposo_email || "",
        telefono: od.telefono || existing?.telefono || ans.sposo_telefono || "",
        tipo_evento: "wedding",
        data_evento: od.dataSognata || ans.data_matrimonio_desiderata || od.periodoSognato || existing?.data_evento || "In definizione",
        status: "openday_lead",
        fonte_lead: od.provenienza || "QR Code Open Day",
        data_primo_contatto: od.created_at ? od.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        totale_preventivo: 0,
        sconto: 0,
        n_ospiti: Number(ans.numero_invitati_previsto) || 120,
        pdf_url: null,
        wedding_diary: wd,
      });
    });

    // 3. Mappa preventivi e contratti reali (quotes)
    (quotes || []).forEach((q: any) => {
      if (!q || !q.id) return;
      const qKey = (q.client_id || q.clients?.id || q.id || q.clients?.email || "").toLowerCase();

      const signedMatch = (signedPdfs || []).find((pdf: any) => {
        const keyLower = String(pdf.key || "").toLowerCase();
        const cid = String(q.id || "").toLowerCase();
        return keyLower.includes(cid);
      });

      const isFirmato = q.status === "firmato" || Boolean(signedMatch);
      const wd = resolveDiaryForClient(q.client_id || q.id, q.clients?.email);

      clientMap.set(qKey, {
        id: q.id,
        clientId: q.client_id || q.clients?.id || q.id,
        nome: q.clients?.nome || "Cliente",
        cognome: q.clients?.cognome || "",
        sposa_nome: q.clients?.sposera_nome || "",
        sposa_cognome: q.clients?.sposera_cognome || "",
        email: q.clients?.email || "",
        telefono: q.clients?.telefono || "",
        tipo_evento: q.tipo_evento || "wedding",
        data_evento: q.data_evento || "In definizione",
        status: isFirmato ? "firmato" : q.status || "inviato",
        fonte_lead: q.source === "tablet_segreteria" ? "Tablet Segreteria" : "Preventivo Ecosistema TDA",
        data_primo_contatto: q.created_at ? q.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        totale_preventivo: Number(q.totale_calcolato || 0),
        sconto: Number(q.sconto_fisso || 0),
        n_ospiti: Number(q.numero_ospiti) || 100,
        pdf_url: signedMatch ? signedMatch.url : null,
        wedding_diary: {
          ...wd,
          compilato: isFirmato || wd.compilato,
          progress: isFirmato ? 100 : wd.progress,
        },
      });
    });

    return Array.from(clientMap.values());
  }, [clients, openDayClients, quotes, signedPdfs, diaries]);

  // Apertura automatica della Scheda 360° se si proviene da URL con ?client=... o ?id=...
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const targetId = (params.get("client") || params.get("id") || params.get("session") || "").trim().toLowerCase();
    if (targetId && allClients.length > 0) {
      const matched = allClients.find(
        (c) =>
          String(c.id).toLowerCase() === targetId ||
          String(c.clientId || "").toLowerCase() === targetId ||
          (c.email && c.email.toLowerCase() === targetId) ||
          c.nome.toLowerCase().includes(targetId)
      );
      if (matched) {
        setSelectedClient(matched);
      }
    }
  }, [allClients]);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return allClients;
    const q = searchQuery.toLowerCase();
    return allClients.filter((c) => {
      const full = `${c.nome} ${c.cognome} ${c.sposa_nome || ""} ${c.sposa_cognome || ""} ${c.email} ${c.telefono}`.toLowerCase();
      return full.includes(q);
    });
  }, [allClients, searchQuery]);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header CRM */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", color: "#e58c2c", fontWeight: "bold" }}>
            GESTIONE CLIENTELA & LEAD 360°
          </span>
          <h1 style={{ margin: "0.3rem 0 0 0", color: "#1e1b18", fontSize: "2.2rem", fontFamily: "serif" }}>
            👥 CRM & Anagrafica Clienti
          </h1>
          <p style={{ margin: 0, color: "#64748b" }}>
            Panoramica completa di tutti i contatti: provenienza, risposte del Wedding Diary, preventivi e contratti.
          </p>
        </div>
      </div>

      {/* Control Bar & Search */}
      <div className="premium-card" style={{ padding: "1.2rem 1.5rem", marginBottom: "1.8rem", background: "#ffffff", borderRadius: "14px", border: "1px solid #e8e2d8", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flex: 1, minWidth: "280px" }}>
            <input
              type="text"
              placeholder="🔍 Cerca per nome sposi, email o cellulare..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "0.65rem 1.1rem", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100%", maxWidth: "380px", fontSize: "0.92rem" }}
            />
            <span style={{ color: "#64748b", fontSize: "0.88rem", whiteSpace: "nowrap" }}>
              Trovati: <strong>{filteredClients.length} contatti</strong>
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span style={{ padding: "0.4rem 0.85rem", background: "#f1f5f9", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "bold", color: "#475569" }}>
              Tutti i Contatti ({allClients.length})
            </span>
          </div>
        </div>
      </div>

      {/* Tabella Clienti CRM */}
      <div className="premium-card" style={{ padding: "1rem", background: "#ffffff", borderRadius: "16px", border: "1px solid #e8e2d8", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", overflowX: "auto" }}>
        {filteredClients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
            <span style={{ fontSize: "2rem" }}>👥</span>
            <div style={{ fontWeight: 700, color: "#1e1b18", marginTop: "0.5rem" }}>Nessun contatto corrisponde ai filtri di ricerca</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e8e2d9", color: "#78716c", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "0.75rem 0.8rem", width: "28%" }}>Cliente / Sposi & Evento</th>
                <th style={{ padding: "0.75rem 0.8rem", width: "18%" }}>Contatti Direct</th>
                <th style={{ padding: "0.75rem 0.8rem", width: "14%" }}>Origine Lead</th>
                <th style={{ padding: "0.75rem 0.8rem", width: "14%" }}>Stato Workflow</th>
                <th style={{ padding: "0.75rem 0.8rem", textAlign: "right", width: "26%" }}>Azioni Ecosistema</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f0eee9", verticalAlign: "middle" }}>
                  {/* Cliente & Evento */}
                  <td style={{ padding: "0.85rem 0.8rem" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e1b18" }}>
                      {c.nome} {c.cognome} {c.sposa_nome ? `& ${c.sposa_nome} ${c.sposa_cognome}` : ""}
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.75rem", color: "#78716c", marginTop: "0.15rem" }}>
                      <span style={{ color: "#e58c2c", fontWeight: 700 }}>
                        {c.tipo_evento === "wedding" ? "💍 Wedding" : "🎉 Privato"} ({c.n_ospiti} Pax)
                      </span>
                      <span>•</span>
                      <span style={{ fontWeight: 600, color: "#514d48" }}>
                        📅 {c.data_evento ? safeFormatDate(c.data_evento, "dd MMM yyyy") : "Da definire"}
                      </span>
                    </div>
                  </td>

                  {/* Contatti */}
                  <td style={{ padding: "0.85rem 0.8rem" }}>
                    <small style={{ display: "block", color: "#6a6764", fontSize: "0.78rem" }}>{c.email || "—"}</small>
                    {c.telefono ? (
                      <a
                        href={`https://wa.me/${c.telefono.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "0.76rem", color: "#16a34a", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.2rem", marginTop: "0.1rem" }}
                      >
                        📱 {c.telefono}
                      </a>
                    ) : (
                      <span style={{ fontSize: "0.74rem", color: "#aaa" }}>Nessun telefono</span>
                    )}
                  </td>

                  {/* Origine Lead */}
                  <td style={{ padding: "0.85rem 0.8rem" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        background: c.status === "openday_lead" ? "#f0fdf4" : "#f5f0e8",
                        border: `1px solid ${c.status === "openday_lead" ? "#bbf7d0" : "#e8e2d9"}`,
                        padding: "0.25rem 0.5rem",
                        borderRadius: "6px",
                        color: c.status === "openday_lead" ? "#166534" : "#544e45",
                        fontWeight: 700,
                        display: "inline-block",
                      }}
                    >
                      {c.status === "openday_lead" ? "🌿 QR Open Day" : `🎯 ${c.fonte_lead}`}
                    </span>
                  </td>

                  {/* Stato Workflow */}
                  <td style={{ padding: "0.85rem 0.8rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.6rem",
                        borderRadius: "16px",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        background: c.status === "firmato" ? "#f0fdf4" : c.status === "openday_lead" ? "#ecfdf5" : "#fff7ed",
                        color: c.status === "firmato" ? "#15803d" : c.status === "openday_lead" ? "#047857" : "#c2410c",
                        border: `1px solid ${c.status === "firmato" ? "#bbf7d0" : c.status === "openday_lead" ? "#a7f3d0" : "#ffedd5"}`,
                      }}
                    >
                      {c.status === "firmato"
                        ? "✍️ FIRMATO"
                        : c.status === "openday_lead"
                        ? `💍 DIARIO ${c.wedding_diary?.progress || 0}%`
                        : "📋 IN VISITA"}
                    </span>
                  </td>

                  {/* Azioni Ecosistema */}
                  <td style={{ padding: "0.85rem 0.8rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      {c.wedding_diary?.compilato && (
                        <a
                          href={`/openday/diario?id=${c.id}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "0.4rem 0.65rem",
                            background: "#ecfdf5",
                            color: "#047857",
                            border: "1px solid #a7f3d0",
                            borderRadius: "7px",
                            fontSize: "0.76rem",
                            fontWeight: 700,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.2rem",
                          }}
                        >
                          📖 Diario {c.wedding_diary?.progress || 0}%
                        </a>
                      )}

                      <a
                        href={`/admin/project-builder/roberto?session=${c.id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: "0.4rem 0.7rem",
                          background: "#1e1b18",
                          color: "#ffffff",
                          borderRadius: "7px",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.2rem",
                        }}
                      >
                        💼 Roberto
                      </a>

                      <button
                        type="button"
                        onClick={() => setSelectedClient(c)}
                        style={{
                          padding: "0.4rem 0.75rem",
                          background: "#ffffff",
                          color: "#1e1b18",
                          border: "1px solid #cbd5e1",
                          borderRadius: "7px",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          cursor: "pointer",
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
        )}
      </div>

      {/* MODALE SCHEDA CLIENTE 360° ENTERPRISE RICCA */}
      {selectedClient && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1.5rem",
          }}
          onClick={() => setSelectedClient(null)}
        >
          <div
            style={{
              background: "#ffffff",
              width: "100%",
              maxWidth: "960px",
              maxHeight: "92vh",
              overflowY: "auto",
              borderRadius: "18px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              padding: "2.2rem",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tasto Chiudi */}
            <button
              type="button"
              onClick={() => setSelectedClient(null)}
              style={{
                position: "absolute",
                top: "1.5rem",
                right: "1.5rem",
                background: "#f1f5f9",
                border: "none",
                fontSize: "1.2rem",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                cursor: "pointer",
                fontWeight: "bold",
                color: "#475569",
              }}
            >
              ✕
            </button>

            {/* Header Scheda Cliente */}
            <div style={{ borderBottom: "2px solid #f1f5f9", paddingBottom: "1.2rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 800 }}>
                SCHEDA CLIENTE 360° ENTERPRISE &bull; LA TERRA DEGLI ARANCI
              </span>
              <h2 style={{ margin: "0.3rem 0", color: "#1e1b18", fontSize: "2rem", fontFamily: "serif" }}>
                {selectedClient.nome} {selectedClient.cognome} {selectedClient.sposa_nome ? `& ${selectedClient.sposa_nome} ${selectedClient.sposa_cognome}` : ""}
              </h2>
              <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", marginTop: "0.4rem", flexWrap: "wrap" }}>
                <span style={{ padding: "0.25rem 0.75rem", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 800 }}>
                  STATUS: {selectedClient.status.toUpperCase()}
                </span>
                <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                  Data Evento: <strong>{safeFormatDate(selectedClient.data_evento)}</strong>
                </span>
                <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                  Invitati Stimati: <strong>{selectedClient.n_ospiti} Pax</strong>
                </span>
              </div>

              {/* FAST LAUNCHER BAR ROBERTO */}
              <div style={{ marginTop: "1rem", padding: "0.85rem 1.1rem", background: "#fff7ed", borderRadius: "12px", border: "1px solid #ffedd5", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.8rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#c2410c", textTransform: "uppercase", letterSpacing: "1px" }}>
                  ⚡ Azioni Rapide Direzione:
                </span>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <a
                    href={`/admin/project-builder/roberto?session=${selectedClient.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: "0.45rem 0.9rem", background: "#1e1b18", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "0.82rem", fontWeight: "bold" }}
                  >
                    💼 Trattativa Ufficio Roberto
                  </a>
                  <a
                    href={`/admin/project-builder/segreteria?session=${selectedClient.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: "0.45rem 0.9rem", background: "#e58c2c", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "0.82rem", fontWeight: "bold" }}
                  >
                    📋 Tablet Segreteria
                  </a>
                  {selectedClient.wedding_diary?.compilato && (
                    <a
                      href={`/openday/diario?id=${selectedClient.id}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: "0.45rem 0.9rem", background: "#047857", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "0.82rem", fontWeight: "bold" }}
                    >
                      📖 Diario Online
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Grid 2 Colonne Informazioni */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
              {/* Colonna Sinistra: Anagrafica & Note Direzionali */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                {/* 1. Dati di Contatto & Origine */}
                <div style={{ background: "#faf8f5", padding: "1.2rem", borderRadius: "12px", border: "1px solid #e8e2d8" }}>
                  <h4 style={{ margin: "0 0 0.8rem 0", color: "#1e1b18", borderBottom: "1px solid #e8e2d8", paddingBottom: "0.4rem" }}>
                    📌 Anagrafica & Contatti
                  </h4>
                  <p style={{ margin: "0.3rem 0", fontSize: "0.9rem" }}><strong>Email:</strong> {selectedClient.email || "—"}</p>
                  <p style={{ margin: "0.3rem 0", fontSize: "0.9rem" }}>
                    <strong>Telefono:</strong>{" "}
                    {selectedClient.telefono ? (
                      <a href={`https://wa.me/${selectedClient.telefono.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" style={{ color: "#16a34a", fontWeight: 700, textDecoration: "none" }}>
                        {selectedClient.telefono} (Apri WhatsApp 💬)
                      </a>
                    ) : "—"}
                  </p>
                  <p style={{ margin: "0.3rem 0", fontSize: "0.9rem" }}>
                    <strong>Origine Contatto:</strong> <span style={{ color: "#e58c2c", fontWeight: 700 }}>{selectedClient.fonte_lead}</span>
                  </p>
                  <p style={{ margin: "0.3rem 0", fontSize: "0.9rem" }}><strong>Data Registrazione:</strong> {selectedClient.data_primo_contatto}</p>
                </div>

                {/* 2. Note Roberto & Desideri Sposi */}
                <div style={{ background: "#faf8f5", padding: "1.2rem", borderRadius: "12px", border: "1px solid #e8e2d8" }}>
                  <h4 style={{ margin: "0 0 0.8rem 0", color: "#1e1b18", borderBottom: "1px solid #e8e2d8", paddingBottom: "0.4rem" }}>
                    📝 Note Direzionali & Desideri
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#475569", fontStyle: "italic", lineHeight: "1.5" }}>
                    &quot;{selectedClient.wedding_diary?.note_roberto || "Nessuna nota speciale inserita."}&quot;
                  </p>
                </div>

                {/* 3. Tasti Stampa Schede Operative Cucina & Allestimenti */}
                <div style={{ background: "#ffffff", padding: "1.2rem", borderRadius: "12px", border: "1px solid #e8e2d8" }}>
                  <h4 style={{ margin: "0 0 0.8rem 0", color: "#1e1b18", borderBottom: "1px solid #e8e2d8", paddingBottom: "0.4rem" }}>
                    🖨️ Schede Operative per l&apos;Evento
                  </h4>
                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handlePrintChef(selectedClient)}
                      style={{ padding: "0.55rem 0.9rem", background: "#1e1b18", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "0.82rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      👨‍🍳 Scheda Chef & Cucina
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintFiorista(selectedClient)}
                      style={{ padding: "0.55rem 0.9rem", background: "#e58c2c", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "0.82rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      🌺 Scheda Allestimenti
                    </button>
                  </div>
                </div>
              </div>

              {/* Colonna Destra: Wedding Diary & Risposte Integrali */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div style={{ background: "#ffffff", padding: "1.4rem", borderRadius: "14px", border: "2px solid #e58c2c", boxShadow: "0 4px 12px rgba(229,140,44,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #fee2e2", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
                    <h4 style={{ margin: 0, color: "#c2410c", fontSize: "1.1rem" }}>
                      📖 Wedding Diary & Desideri Emozionali
                    </h4>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, padding: "0.2rem 0.6rem", background: "#ffedd5", color: "#c2410c", borderRadius: "12px" }}>
                      Completamento: {selectedClient.wedding_diary?.progress || 0}%
                    </span>
                  </div>

                  {selectedClient.wedding_diary?.compilato ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.88rem" }}>
                      {/* Palette Colori */}
                      <div>
                        <strong style={{ color: "#1e1b18" }}>🎨 Palette Colori Scelta:</strong>
                        <div style={{ display: "flex", gap: "8px", marginTop: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          {selectedClient.wedding_diary.palette_colori.map((color: string, i: number) => (
                            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", background: "#f8fafc", padding: "0.25rem 0.6rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: color, border: "1px solid rgba(0,0,0,0.15)", display: "inline-block" }} />
                              <strong>{selectedClient.wedding_diary.palette_nomi[i] || color}</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Stile & Atmosfera */}
                      <div>
                        <strong style={{ color: "#1e1b18" }}>✨ Visione & Atmosfera:</strong>
                        <div style={{ marginTop: "4px", color: "#334155", background: "#f8fafc", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          {selectedClient.wedding_diary.stile_evento}
                        </div>
                      </div>

                      {/* Intolleranze & Celiaci */}
                      <div>
                        <strong style={{ color: "#856404" }}>🍷 Gestione Celiaci & Intolleranze:</strong>
                        <div style={{ marginTop: "4px", color: "#856404", background: "#fff3cd", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #ffeeba", fontWeight: 600 }}>
                          ⚠️ {selectedClient.wedding_diary.intolleranze}
                        </div>
                      </div>

                      {/* Colonna Sonora & Brani */}
                      <div>
                        <strong style={{ color: "#1e1b18" }}>🎵 Scaletta Musicale & Momenti Topici:</strong>
                        <div style={{ marginTop: "4px", color: "#334155", background: "#f8fafc", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          {selectedClient.wedding_diary.musica}
                        </div>
                      </div>

                      {/* Dettagli Extra dal questionario se presenti */}
                      {selectedClient.wedding_diary.answers?.allestimenti_floreali && (
                        <div>
                          <strong style={{ color: "#1e1b18" }}>🌿 Fiori & Allestimenti:</strong>
                          <div style={{ marginTop: "4px", color: "#334155", background: "#f8fafc", padding: "0.5rem 0.8rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            {selectedClient.wedding_diary.answers.allestimenti_floreali}
                          </div>
                        </div>
                      )}

                      {selectedClient.wedding_diary.answers?.torta_nuziale_desiderata && (
                        <div>
                          <strong style={{ color: "#1e1b18" }}>🎂 Torta Nuziale & Sweet Table:</strong>
                          <div style={{ marginTop: "4px", color: "#334155", background: "#f8fafc", padding: "0.5rem 0.8rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            {selectedClient.wedding_diary.answers.torta_nuziale_desiderata}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "2rem 1rem", background: "#f8fafc", borderRadius: "10px", color: "#64748b" }}>
                      <span style={{ fontSize: "1.8rem" }}>📖</span>
                      <p style={{ margin: "0.5rem 0 0 0", fontStyle: "italic", fontSize: "0.88rem" }}>
                        In attesa della prima compilazione del Wedding Diary da parte degli sposi.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
