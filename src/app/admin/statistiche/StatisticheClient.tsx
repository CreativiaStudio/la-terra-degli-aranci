"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { StatisticheDashboardData } from "@/lib/statisticheEngine";
import type { GoogleCalendarEvent } from "@/lib/localDb";

interface StatisticheClientProps {
  initialData: StatisticheDashboardData;
  rawQuotes?: any[];
  appointments?: any[];
  openDayData?: any;
  gcalEvents?: GoogleCalendarEvent[];
}

interface CalendarEventRow {
  id: string;
  data: string; // YYYY-MM-DD
  orario?: string;
  titolo: string;
  cliente: string;
  location: "laterradegliaranci" | "villa_pagodina" | "sala_tufo" | "sala_bianca";
  locationLabel: string;
  tipo: "wedding" | "battesimo" | "privato" | "corporate";
  tipoLabel: string;
  turno: "pranzo" | "cena" | "intero";
  turnoLabel: string;
  stato: "confermato" | "opzione_verbale";
  isVerbalOption: boolean;
  telefono?: string;
  note?: string;
  linkCrm?: string;
}

export default function StatisticheClient({
  initialData,
  rawQuotes = [],
  appointments = [],
  openDayData,
  gcalEvents = [],
}: StatisticheClientProps) {
  const [selectedYear, setSelectedYear] = useState<number>(initialData.annoSelezionato || 2026);
  const [activeTab, setActiveTab] = useState<"eventi" | "stagionalita" | "pluriennale">("eventi");

  // Filtri di Controllo Operativo per Roberto Sola
  const [filterPreset, setFilterPreset] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("all"); // "all", "laterradegliaranci", "villa_pagodina"
  const [eventType, setEventType] = useState<string>("all"); // "all", "wedding", "battesimo", "privato", "corporate"
  const [eventStatus, setEventStatus] = useState<string>("all"); // "all", "confermato", "opzione_verbale"

  // Gestione parametri URL (es. da /admin/openday)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const presetParam = params.get("preset");
    if (presetParam === "openday") {
      setFilterPreset("openday");
      setEventType("wedding");
      setStartDate("");
      setEndDate("");
    }
  }, []);

  // Preset rapidi per le domande di Roberto (1-Click)
  const handleApplyPreset = (preset: string) => {
    setFilterPreset(preset);
    if (preset === "estate2026") {
      // Domanda 1 di Roberto: "Tra Giugno e Agosto 2026 quanti matrimoni ho?"
      setStartDate("2026-06-01");
      setEndDate("2026-08-31");
      setEventType("wedding");
      setEventStatus("all");
      setLocationFilter("all");
      setSelectedYear(2026);
    } else if (preset === "battesimi2027") {
      // Domanda 2 di Roberto: "Quanti battesimi ho nel 2027?"
      setStartDate("2027-01-01");
      setEndDate("2027-12-31");
      setEventType("battesimo");
      setEventStatus("all");
      setLocationFilter("all");
      setSelectedYear(2027);
    } else if (preset === "wedding2026") {
      setStartDate("2026-01-01");
      setEndDate("2026-12-31");
      setEventType("wedding");
      setEventStatus("all");
      setLocationFilter("all");
      setSelectedYear(2026);
    } else if (preset === "pagodina") {
      setStartDate("");
      setEndDate("");
      setEventType("all");
      setEventStatus("all");
      setLocationFilter("villa_pagodina");
    } else if (preset === "opzioni") {
      setStartDate("");
      setEndDate("");
      setEventType("all");
      setEventStatus("opzione_verbale");
      setLocationFilter("all");
    } else if (preset === "anno2026") {
      setStartDate("2026-01-01");
      setEndDate("2026-12-31");
      setEventType("all");
      setEventStatus("all");
      setLocationFilter("all");
      setSelectedYear(2026);
    } else if (preset === "anno2027") {
      setStartDate("2027-01-01");
      setEndDate("2027-12-31");
      setEventType("all");
      setEventStatus("all");
      setLocationFilter("all");
      setSelectedYear(2027);
    } else {
      // Reset completo
      setStartDate("");
      setEndDate("");
      setEventType("all");
      setEventStatus("all");
      setLocationFilter("all");
    }
  };

  // Costruzione della lista unificata eventi dal calendario Google, quote reali e lead Open Day
  // (ZERO contatti demo fittizi inventati)
  const allEvents: CalendarEventRow[] = useMemo(() => {
    const list: CalendarEventRow[] = [];
    const usedIds = new Set<string>();

    // 1. Eventi importati da Google Calendar (TDA & Villa Pagodina)
    (gcalEvents || []).forEach((e) => {
      const d = e.start ? e.start.slice(0, 10) : "";
      if (!d) return;

      const summary = e.summary || "Evento Calendario";
      const desc = e.description || "";
      const text = `${summary} ${desc}`.toLowerCase();

      // Riconoscimento Tipologia
      let tipo: "wedding" | "battesimo" | "privato" | "corporate" = "wedding";
      let tipoLabel = "💍 Matrimonio";

      if (text.includes("battesimo") || text.includes("comunione") || text.includes("cresima")) {
        tipo = "battesimo";
        tipoLabel = text.includes("comunione") ? "🕊️ Prima Comunione" : "🕊️ Battesimo";
      } else if (text.includes("compleanno") || text.includes("18 anni") || text.includes("laurea") || text.includes("anniversario")) {
        tipo = "privato";
        tipoLabel = "🎉 Festa Privata";
      } else if (text.includes("corporate") || text.includes("aziendal") || text.includes("convegno")) {
        tipo = "corporate";
        tipoLabel = "🏢 Evento Aziendale";
      }

      // Riconoscimento Location
      let loc: "laterradegliaranci" | "villa_pagodina" | "sala_tufo" | "sala_bianca" = "laterradegliaranci";
      let locLabel = "🌿 La Terra degli Aranci";
      if (e.location === "villa_pagodina" || text.includes("villa pagodina") || text.includes("pagodina") || summary.toUpperCase().startsWith("VP")) {
        loc = "villa_pagodina";
        locLabel = "🏛️ Villa Pagodina";
      } else if (e.location === "sala_tufo" || text.includes("sala tufo")) {
        loc = "sala_tufo";
        locLabel = "🏛️ TDA - Sala Tufo";
      } else if (e.location === "sala_bianca" || text.includes("sala bianca")) {
        loc = "sala_bianca";
        locLabel = "🏛️ TDA - Sala Bianca";
      }

      // Riconoscimento Turno (Pranzo / Cena)
      const isPranzo = e.start.includes("12:") || e.start.includes("13:") || text.includes("pranzo");
      const turno = isPranzo ? "pranzo" : "cena";
      const turnoLabel = isPranzo ? "☀️ Pranzo" : "🌙 Cena";

      const isVerbal = Boolean(e.is_verbal_confirmation || summary.startsWith("?") || text.includes("opzione verbale"));
      const cleanTitolo = summary.replace(/^\?\s*/, "").trim();

      usedIds.add(e.id);
      list.push({
        id: e.id,
        data: d,
        orario: e.start.includes("T") ? e.start.slice(11, 16) : undefined,
        titolo: cleanTitolo,
        cliente: e.client_nome || cleanTitolo,
        location: loc,
        locationLabel: locLabel,
        tipo,
        tipoLabel,
        turno,
        turnoLabel,
        stato: isVerbal ? "opzione_verbale" : "confermato",
        isVerbalOption: isVerbal,
        telefono: e.client_telefono,
        note: e.description,
        linkCrm: `/admin/crm?client=${e.id}`,
      });
    });

    // 2. Quote reali caricate nell'ecosistema TDA
    (rawQuotes || []).forEach((q) => {
      if (usedIds.has(q.id)) return;
      const d = q.data_evento ? q.data_evento.slice(0, 10) : "";
      if (!d) return;

      const rawTipo = String(q.tipo_evento || "").toLowerCase();
      let tipo: "wedding" | "battesimo" | "privato" | "corporate" = "wedding";
      let tipoLabel = "💍 Matrimonio";

      if (rawTipo.includes("battesimo") || rawTipo.includes("comunione")) {
        tipo = "battesimo";
        tipoLabel = "🕊️ Battesimo / Comunione";
      } else if (rawTipo.includes("corporate") || rawTipo.includes("aziendale")) {
        tipo = "corporate";
        tipoLabel = "🏢 Evento Aziendale";
      } else if (rawTipo.includes("privat") || rawTipo.includes("compleanno") || rawTipo.includes("laurea")) {
        tipo = "privato";
        tipoLabel = "🎉 Festa Privata";
      }

      const cliente = [q.clients?.nome, q.clients?.cognome].filter(Boolean).join(" ") || "Cliente TDA";
      const isSigned = q.status === "firmato";

      usedIds.add(q.id);
      list.push({
        id: q.id,
        data: d,
        titolo: `${tipoLabel}: ${cliente}`,
        cliente,
        location: "laterradegliaranci",
        locationLabel: q.tipo_esclusiva === "esclusiva" ? "🌿 TDA (Esclusiva)" : "🌿 TDA (Semiesclusiva)",
        tipo,
        tipoLabel,
        turno: q.turno === "cena" ? "cena" : "pranzo",
        turnoLabel: q.turno === "cena" ? "🌙 Cena" : "☀️ Pranzo",
        stato: isSigned ? "confermato" : "opzione_verbale",
        isVerbalOption: !isSigned,
        telefono: q.clients?.telefono,
        note: q.note_roberto || q.clients?.note,
        linkCrm: `/admin/crm?client=${q.client_id || q.clients?.id || q.id}`,
      });
    });

    // 3. Lead Open Day reali registrati da smartphone (Cloudflare R2)
    const odClients = openDayData?.openDayClients || [];
    odClients.forEach((od: any) => {
      if (usedIds.has(od.id)) return;
      const d = od.dataSognata ? od.dataSognata.slice(0, 10) : "";
      if (!d) return;

      usedIds.add(od.id);
      list.push({
        id: od.id,
        data: d,
        titolo: `💍 Open Day: ${od.nome}`,
        cliente: od.nome,
        location: "laterradegliaranci",
        locationLabel: "🌿 La Terra degli Aranci",
        tipo: "wedding",
        tipoLabel: "💍 Matrimonio (Open Day)",
        turno: "pranzo",
        turnoLabel: "☀️ Pranzo / Cena",
        stato: "opzione_verbale",
        isVerbalOption: true,
        telefono: od.telefono,
        note: `Registrato via QR Code Open Day. Avanzamento Wedding Diary: ${od.diaryProgress || 0}%.`,
        linkCrm: `/admin/crm?client=${od.id}`,
      });
    });

    // Ordina per data crescente
    return list.sort((a, b) => a.data.localeCompare(b.data));
  }, [gcalEvents, rawQuotes, openDayData]);

  // Filtraggio dinamico degli eventi
  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => {
      // 1. Filtro data
      if (startDate && e.data < startDate) return false;
      if (endDate && e.data > endDate) return false;
      if (!startDate && !endDate && selectedYear) {
        if (!e.data.startsWith(String(selectedYear))) return false;
      }

      // 2. Filtro Location (TDA vs Villa Pagodina)
      if (locationFilter !== "all") {
        if (locationFilter === "villa_pagodina" && e.location !== "villa_pagodina") return false;
        if (locationFilter === "laterradegliaranci" && e.location === "villa_pagodina") return false;
      }

      // 3. Filtro Tipologia Evento
      if (eventType !== "all") {
        if (eventType === "wedding" && e.tipo !== "wedding") return false;
        if (eventType === "battesimo" && e.tipo !== "battesimo") return false;
        if (eventType === "privato" && e.tipo !== "privato") return false;
        if (eventType === "corporate" && e.tipo !== "corporate") return false;
      }

      // 4. Filtro Stato (Confermato vs Opzione ?)
      if (eventStatus !== "all") {
        if (eventStatus === "confermato" && e.stato !== "confermato") return false;
        if (eventStatus === "opzione_verbale" && e.stato !== "opzione_verbale") return false;
      }

      return true;
    });
  }, [allEvents, startDate, endDate, selectedYear, locationFilter, eventType, eventStatus]);

  // Conteggi e Metriche Operative in Tempo Reale (Puro Conteggio Eventi, ZERO €)
  const metrics = useMemo(() => {
    const totaleEventi = filteredEvents.length;
    const confermatiCount = filteredEvents.filter((e) => e.stato === "confermato").length;
    const opzioniCount = filteredEvents.filter((e) => e.stato === "opzione_verbale").length;

    const tdaCount = filteredEvents.filter((e) => e.location !== "villa_pagodina").length;
    const pagodinaCount = filteredEvents.filter((e) => e.location === "villa_pagodina").length;

    const weddingCount = filteredEvents.filter((e) => e.tipo === "wedding").length;
    const battesimiCount = filteredEvents.filter((e) => e.tipo === "battesimo").length;
    const privatiCount = filteredEvents.filter((e) => e.tipo === "privato").length;
    const corporateCount = filteredEvents.filter((e) => e.tipo === "corporate").length;

    const pranziCount = filteredEvents.filter((e) => e.turno === "pranzo").length;
    const ceneCount = filteredEvents.filter((e) => e.turno === "cena").length;

    return {
      totaleEventi,
      confermatiCount,
      opzioniCount,
      tdaCount,
      pagodinaCount,
      weddingCount,
      battesimiCount,
      privatiCount,
      corporateCount,
      pranziCount,
      ceneCount,
    };
  }, [filteredEvents]);

  // Descrizione leggibile del filtro attivo
  const activeFilterLabel = useMemo(() => {
    if (filterPreset === "estate2026") return "⭐ Matrimoni Estate 2026 (01/06/2026 – 31/08/2026)";
    if (filterPreset === "battesimi2027") return "🕊️ Battesimi & Cerimonie 2027";
    if (filterPreset === "wedding2026") return "💍 Matrimoni Anno 2026";
    if (filterPreset === "pagodina") return "🏛️ Tutti gli Eventi Villa Pagodina";
    if (filterPreset === "opzioni") return "❓ Opzioni Verbali da Confermare (?)";
    if (filterPreset === "anno2026") return "📅 Anno 2026 Completo";
    if (filterPreset === "anno2027") return "📅 Anno 2027 Completo";
    if (startDate || endDate) {
      return `Periodo Personalizzato: ${startDate || "Inizio"} ➔ ${endDate || "Oggi"}`;
    }
    return `Anno ${selectedYear} (Calendario TDA & Pagodina)`;
  }, [filterPreset, startDate, endDate, selectedYear]);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", fontFamily: "'Outfit', sans-serif", paddingBottom: "4rem" }}>
      
      {/* HEADER AMMINISTRAZIONE */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.8rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", color: "#e58c2c", fontWeight: "bold" }}>
            CONTROLLO OPERATIVO CALENDARIO & RICEVIMENTI
          </span>
          <h1 style={{ margin: "0.3rem 0 0 0", color: "#1e1b18", fontSize: "2.3rem", fontFamily: "serif" }}>
            📊 Statistiche Eventi & Disponibilità Date
          </h1>
          <p style={{ margin: "0.4rem 0 0 0", color: "#64748b", fontSize: "0.95rem" }}>
            Monitoraggio conteggio eventi, matrimoni, battesimi e opzioni verbali per <strong>La Terra degli Aranci</strong> e <strong>Villa Pagodina</strong>.
          </p>
        </div>

        {/* Tasti Selettore Rapido Anno */}
        <div style={{ display: "flex", gap: "6px", background: "#f1f5f9", padding: "6px", borderRadius: "14px" }}>
          {[2025, 2026, 2027, 2028].map((y) => {
            const isSelected = selectedYear === y && !startDate && !endDate && filterPreset === "all";
            return (
              <button
                key={y}
                type="button"
                onClick={() => {
                  setSelectedYear(y);
                  setFilterPreset("all");
                  setStartDate("");
                  setEndDate("");
                  setLocationFilter("all");
                  setEventType("all");
                  setEventStatus("all");
                }}
                style={{
                  padding: "0.55rem 1rem",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  background: isSelected ? "#1e1b18" : "transparent",
                  color: isSelected ? "#fff" : "#475569",
                  boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {y} {y === 2026 && "★"}
              </button>
            );
          })}
        </div>
      </div>

      {/* AVVISO DIRETTO SINCRONIZZAZIONE GOOGLE CALENDAR */}
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "14px",
          padding: "1rem 1.4rem",
          marginBottom: "1.8rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <span style={{ fontSize: "1.8rem" }}>📅</span>
          <div>
            <div style={{ fontWeight: 800, color: "#166534", fontSize: "0.95rem" }}>
              Sincronizzazione Google Calendar (La Terra degli Aranci & Villa Pagodina)
            </div>
            <div style={{ color: "#15803d", fontSize: "0.85rem", marginTop: "0.15rem" }}>
              Integrazione attiva con parsing automatico del punto interrogativo <code>?</code> (opzioni verbali) e divisione automatica per location.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Link
            href="/admin/calendario"
            style={{
              padding: "0.45rem 0.9rem",
              background: "#166534",
              color: "#ffffff",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <span>🗓️</span>
            <span>Apri Griglia Calendario</span>
          </Link>
        </div>
      </div>

      {/* SEZIONE: LE DOMANDE RAPIDE DI ROBERTO (1-CLICK PRESETS) */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          border: "1px solid #e8e2d8",
          padding: "1.2rem 1.5rem",
          marginBottom: "1.8rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.2rem" }}>🎯</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1e1b18", textTransform: "uppercase", letterSpacing: "1px" }}>
              Domande Rapide di Roberto:
            </span>
          </div>
          <span style={{ fontSize: "0.8rem", color: "#8E8880" }}>
            Conteggi immediati a colpo d&apos;occhio
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => handleApplyPreset("estate2026")}
            style={{
              padding: "0.55rem 0.95rem",
              borderRadius: "10px",
              border: filterPreset === "estate2026" ? "2px solid #e58c2c" : "1px solid #e2e8f0",
              background: filterPreset === "estate2026" ? "#fff7ed" : "#faf8f5",
              color: filterPreset === "estate2026" ? "#c2410c" : "#2B2B2B",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "all 0.15s",
            }}
          >
            <span>⭐</span>
            <span>Matrimoni Estate 2026 (Giu–Ago)</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset("battesimi2027")}
            style={{
              padding: "0.55rem 0.95rem",
              borderRadius: "10px",
              border: filterPreset === "battesimi2027" ? "2px solid #0369a1" : "1px solid #e2e8f0",
              background: filterPreset === "battesimi2027" ? "#f0f9ff" : "#faf8f5",
              color: filterPreset === "battesimi2027" ? "#0369a1" : "#2B2B2B",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "all 0.15s",
            }}
          >
            <span>🕊️</span>
            <span>Quanti Battesimi nel 2027?</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset("pagodina")}
            style={{
              padding: "0.55rem 0.95rem",
              borderRadius: "10px",
              border: filterPreset === "pagodina" ? "2px solid #7e22ce" : "1px solid #e2e8f0",
              background: filterPreset === "pagodina" ? "#faf5ff" : "#faf8f5",
              color: filterPreset === "pagodina" ? "#7e22ce" : "#2B2B2B",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <span>🏛️</span>
            <span>Eventi Villa Pagodina</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset("opzioni")}
            style={{
              padding: "0.55rem 0.95rem",
              borderRadius: "10px",
              border: filterPreset === "opzioni" ? "2px solid #b45f0c" : "1px solid #e2e8f0",
              background: filterPreset === "opzioni" ? "#fffbeb" : "#faf8f5",
              color: filterPreset === "opzioni" ? "#b45f0c" : "#2B2B2B",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <span>❓</span>
            <span>Opzioni Verbali da Confermare (?)</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset("all")}
            style={{
              padding: "0.55rem 0.85rem",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#64748b",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            🔄 Reset Filtri
          </button>
        </div>

        {/* BARRA FILTRI OPERATIVI PER DATA E STRUTTURA */}
        <div
          style={{
            marginTop: "1.2rem",
            paddingTop: "1rem",
            borderTop: "1px solid #f1f5f9",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.8rem",
            alignItems: "center",
          }}
        >
          {/* Range Data Inizio */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "0.2rem" }}>
              📅 Dal Giorno:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setFilterPreset("custom");
              }}
              style={{
                width: "100%",
                padding: "0.45rem 0.65rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
              }}
            />
          </div>

          {/* Range Data Fine */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "0.2rem" }}>
              📅 Al Giorno:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setFilterPreset("custom");
              }}
              style={{
                width: "100%",
                padding: "0.45rem 0.65rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
              }}
            />
          </div>

          {/* Struttura (TDA vs Pagodina) */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "0.2rem" }}>
              🏛️ Struttura / Location:
            </label>
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setFilterPreset("custom");
              }}
              style={{
                width: "100%",
                padding: "0.45rem 0.65rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                background: "#fff",
              }}
            >
              <option value="all">Tutte le Strutture</option>
              <option value="laterradegliaranci">🌿 La Terra degli Aranci</option>
              <option value="villa_pagodina">🏛️ Villa Pagodina</option>
            </select>
          </div>

          {/* Tipologia Evento */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "0.2rem" }}>
              💍 Tipologia Evento:
            </label>
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setFilterPreset("custom");
              }}
              style={{
                width: "100%",
                padding: "0.45rem 0.65rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                background: "#fff",
              }}
            >
              <option value="all">Tutti i Tipi di Evento</option>
              <option value="wedding">💍 Matrimoni (Wedding)</option>
              <option value="battesimo">🕊️ Battesimi & Comunioni</option>
              <option value="privato">🎉 Feste Private & Compleanni</option>
              <option value="corporate">🏢 Eventi Aziendali</option>
            </select>
          </div>

          {/* Stato (Confermato vs Opzione ?) */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "0.2rem" }}>
              ✍️ Stato Blocco Data:
            </label>
            <select
              value={eventStatus}
              onChange={(e) => {
                setEventStatus(e.target.value);
                setFilterPreset("custom");
              }}
              style={{
                width: "100%",
                padding: "0.45rem 0.65rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                background: "#fff",
              }}
            >
              <option value="all">Tutti gli Eventi</option>
              <option value="confermato">✓ Date Confermate (Bloccate)</option>
              <option value="opzione_verbale">? Opzioni Verbali Non Confermate</option>
            </select>
          </div>
        </div>

        {/* Badge Riscontro Attivo */}
        <div style={{ marginTop: "0.9rem", padding: "0.6rem 0.9rem", background: "#f8fafc", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
          <div style={{ fontSize: "0.85rem", color: "#1e1b18" }}>
            <strong>Filtro Attivo:</strong> <span style={{ color: "#e58c2c", fontWeight: 700 }}>{activeFilterLabel}</span>
          </div>
          <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
            Eventi Trovati: <strong style={{ color: "#1e1b18" }}>{filteredEvents.length}</strong> &bull; Date Confermate: <strong style={{ color: "#16a34a" }}>{metrics.confermatiCount}</strong> &bull; Opzioni <code>?</code>: <strong style={{ color: "#b45f0c" }}>{metrics.opzioniCount}</strong>
          </div>
        </div>
      </div>

      {/* 4 CARD KPI CONTEGGIO PURO PER ROBERTO (ZERO CIFRE IN €) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.2rem",
          marginBottom: "2rem",
        }}
      >
        {/* Card 1: Conteggio Totale Eventi */}
        <div
          style={{
            background: "#fff",
            padding: "1.6rem",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", fontWeight: 700 }}>
            EVENTI TOTALI IN CALENDARIO
          </span>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1e1b18", marginTop: "0.3rem" }}>
            {metrics.totaleEventi}
          </div>
          <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#64748b" }}>
            <div>☀️ Pranzi: <strong>{metrics.pranziCount}</strong> &bull; 🌙 Cene: <strong>{metrics.ceneCount}</strong></div>
          </div>
        </div>

        {/* Card 2: Date Confermate vs Opzioni Verbali */}
        <div
          style={{
            background: "#fff",
            padding: "1.6rem",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", fontWeight: 700 }}>
            STATO BLOCCO DATE
          </span>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#16a34a", marginTop: "0.3rem" }}>
            {metrics.confermatiCount}
          </div>
          <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#64748b" }}>
            <div>✓ Date Confermate (Bloccate): <strong style={{ color: "#16a34a" }}>{metrics.confermatiCount}</strong></div>
            <div>? Opzioni Verbali in Attesa: <strong style={{ color: "#b45f0c" }}>{metrics.opzioniCount}</strong></div>
          </div>
        </div>

        {/* Card 3: Ripartizione Strutture */}
        <div
          style={{
            background: "#fff",
            padding: "1.6rem",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", fontWeight: 700 }}>
            RIPARTIZIONE LOCATION
          </span>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#e58c2c", marginTop: "0.3rem" }}>
            {metrics.tdaCount} <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "#8E8880" }}>/ {metrics.pagodinaCount}</span>
          </div>
          <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#64748b" }}>
            <div>🌿 La Terra degli Aranci: <strong>{metrics.tdaCount} eventi</strong></div>
            <div>🏛️ Villa Pagodina: <strong>{metrics.pagodinaCount} eventi</strong></div>
          </div>
        </div>

        {/* Card 4: Matrimoni vs Altri Eventi */}
        <div
          style={{
            background: "#fff",
            padding: "1.6rem",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#0369a1", fontWeight: 700 }}>
            TIPOLOGIE DI RICEVIMENTO
          </span>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#0369a1", marginTop: "0.3rem" }}>
            {metrics.weddingCount} <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "#8E8880" }}>Nozze</span>
          </div>
          <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#64748b" }}>
            <div>🕊️ Battesimi / Comunioni: <strong>{metrics.battesimiCount}</strong></div>
            <div>🎉 Feste Private & Corporate: <strong>{metrics.privatiCount + metrics.corporateCount}</strong></div>
          </div>
        </div>
      </div>

      {/* TABELLA SINTETICA EVENTI & CALENDARIO (ZERO CIFRE IN €) */}
      <div
        style={{
          background: "#fff",
          borderRadius: "18px",
          border: "1px solid #e2e8f0",
          padding: "1.5rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
          marginBottom: "2.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.2rem 0", color: "#1e1b18" }}>
              📋 Registro Eventi in Calendario ({filteredEvents.length})
            </h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
              Elenco reale sincronizzato da Google Calendar (TDA e Villa Pagodina).
            </p>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", background: "#f8fafc", borderRadius: "14px", border: "1px dashed #cbd5e1" }}>
            <span style={{ fontSize: "2rem" }}>🗓️</span>
            <div style={{ fontWeight: 600, color: "#1e1b18", marginTop: "0.5rem" }}>
              Nessun evento in calendario corrisponde ai filtri selezionati
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>
              Seleziona un altro anno o premi &quot;Reset Filtri&quot; in alto.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <th style={{ padding: "0.75rem 0.8rem" }}>Data & Turno</th>
                  <th style={{ padding: "0.75rem 0.8rem" }}>Evento / Cliente</th>
                  <th style={{ padding: "0.75rem 0.8rem" }}>Struttura</th>
                  <th style={{ padding: "0.75rem 0.8rem" }}>Tipologia</th>
                  <th style={{ padding: "0.75rem 0.8rem" }}>Recapiti & Note</th>
                  <th style={{ padding: "0.75rem 0.8rem", textAlign: "center" }}>Stato Blocco</th>
                  <th style={{ padding: "0.75rem 0.8rem", textAlign: "right" }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.85rem 0.8rem", fontWeight: 700, color: "#1e1b18", whiteSpace: "nowrap" }}>
                      <div>📅 {e.data}</div>
                      <div style={{ fontSize: "0.72rem", color: "#8E8880", marginTop: "0.15rem" }}>
                        {e.turnoLabel} {e.orario ? `(${e.orario})` : ""}
                      </div>
                    </td>

                    <td style={{ padding: "0.85rem 0.8rem", fontWeight: 600, color: "#1e1b18" }}>
                      <div style={{ fontSize: "0.92rem" }}>{e.titolo}</div>
                      {e.cliente !== e.titolo && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Rif: {e.cliente}</div>
                      )}
                    </td>

                    <td style={{ padding: "0.85rem 0.8rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.55rem",
                          borderRadius: "10px",
                          background: e.location === "villa_pagodina" ? "#faf5ff" : "#f0fdf4",
                          color: e.location === "villa_pagodina" ? "#7e22ce" : "#166534",
                          border: `1px solid ${e.location === "villa_pagodina" ? "#e9d5ff" : "#bbf7d0"}`,
                        }}
                      >
                        {e.locationLabel}
                      </span>
                    </td>

                    <td style={{ padding: "0.85rem 0.8rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.55rem",
                          borderRadius: "12px",
                          background: e.tipo === "wedding" ? "#fef3c7" : e.tipo === "battesimo" ? "#e0f2fe" : "#f1f5f9",
                          color: e.tipo === "wedding" ? "#92400e" : e.tipo === "battesimo" ? "#0369a1" : "#475569",
                        }}
                      >
                        {e.tipoLabel}
                      </span>
                    </td>

                    <td style={{ padding: "0.85rem 0.8rem", fontSize: "0.82rem", color: "#64748b" }}>
                      {e.telefono && (
                        <div style={{ fontWeight: 600, color: "#16a34a" }}>📞 {e.telefono}</div>
                      )}
                      {e.note ? (
                        <div style={{ maxWidth: "240px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {e.note}
                        </div>
                      ) : (
                        <span style={{ color: "#cbd5e1" }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: "0.85rem 0.8rem", textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          padding: "0.25rem 0.6rem",
                          borderRadius: "16px",
                          background: e.isVerbalOption ? "#fffbeb" : "#f0fdf4",
                          color: e.isVerbalOption ? "#b45f0c" : "#166534",
                          border: `1px solid ${e.isVerbalOption ? "#fde68a" : "#bbf7d0"}`,
                        }}
                      >
                        {e.isVerbalOption ? "? OPZIONE VERBALE" : "✓ DATA BLOCCATA"}
                      </span>
                    </td>

                    <td style={{ padding: "0.85rem 0.8rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link
                        href={e.linkCrm || "/admin/crm"}
                        style={{
                          padding: "0.35rem 0.7rem",
                          background: "#1e1b18",
                          color: "#fff",
                          borderRadius: "7px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          display: "inline-block",
                        }}
                      >
                        👁️ CRM
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RIEPILOGO STAGIONALITÀ PURA (CONTEGGIO NUMERICO EVENTI, ZERO €) */}
      <div
        style={{
          background: "#fff",
          borderRadius: "18px",
          border: "1px solid #e2e8f0",
          padding: "1.8rem 2rem",
          marginBottom: "2.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.3rem", color: "#1e1b18" }}>
            📅 Stagionalità Mese per Mese: Conteggio Ricevimenti ({selectedYear})
          </h3>
          <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
            Distribuzione del numero di eventi tra pranzo e cena per verificare i mesi di picco e i turni ancora disponibili.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))", gap: "8px", alignItems: "flex-end", minHeight: "180px", paddingTop: "1rem" }}>
          {initialData.statisticheAnno.mensile.map((m) => {
            const maxEv = Math.max(...initialData.statisticheAnno.mensile.map((x) => x.eventi), 1);
            const heightPercent = (m.eventi / maxEv) * 100;
            const isPeak = m.meseNum >= 5 && m.meseNum <= 10;
            return (
              <div key={m.meseNum} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 800, color: m.eventi > 0 ? "#1e1b18" : "#94a3b8", marginBottom: "6px" }}>
                  {m.eventi > 0 ? `${m.eventi}` : "-"}
                </div>
                <div
                  style={{
                    width: "100%",
                    maxWidth: "40px",
                    height: `${Math.max(8, heightPercent * 1.2)}px`,
                    maxHeight: "120px",
                    background: isPeak
                      ? "linear-gradient(180deg, #e58c2c 0%, #c2410c 100%)"
                      : "#cbd5e1",
                    borderRadius: "6px 6px 0 0",
                    transition: "all 0.3s ease",
                  }}
                  title={`${m.mese}: ${m.eventi} ricevimenti (${m.pranzo} pranzi, ${m.cena} cene)`}
                />
                <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "8px", fontWeight: isPeak ? 700 : 500 }}>
                  {m.mese.slice(0, 3)}
                </span>
                <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                  {m.eventi > 0 ? `☀️${m.pranzo} 🌙${m.cena}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
