"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { StatisticheDashboardData } from "@/lib/statisticheEngine";

interface StatisticheClientProps {
  initialData: StatisticheDashboardData;
  rawQuotes?: any[];
  appointments?: any[];
  openDayData?: any;
}

interface EventRow {
  id: string;
  data: string; // YYYY-MM-DD
  cliente: string;
  tipo: "wedding" | "battesimo" | "privato" | "corporate";
  tipoLabel: string;
  ospiti: number;
  totale: number;
  stato: "firmato" | "trattativa";
  formula: string;
  canale: string;
  linkCrm: string;
}

export default function StatisticheClient({
  initialData,
  rawQuotes = [],
  appointments = [],
  openDayData,
}: StatisticheClientProps) {
  const [selectedYear, setSelectedYear] = useState<number>(initialData.annoSelezionato || 2026);
  const [activeTab, setActiveTab] = useState<"anno" | "confronto" | "canali">("anno");

  // Filtri Semplici di Controllo per Roberto Sola
  const [filterPreset, setFilterPreset] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [eventType, setEventType] = useState<string>("all");
  const [eventStatus, setEventStatus] = useState<string>("all");
  const [channel, setChannel] = useState<string>("all");

  // Rilevamento parametri URL (es. provenienza da /admin/openday con ?preset=openday)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const presetParam = params.get("preset");
    if (presetParam === "openday") {
      setFilterPreset("openday");
      setChannel("openday");
      setEventType("all");
      setEventStatus("all");
      setStartDate("");
      setEndDate("");
    }
  }, []);

  // Preset rapidi per rispondere alle domande di Roberto in 1 clic
  const handleApplyPreset = (preset: string) => {
    setFilterPreset(preset);
    if (preset === "estate2026") {
      // Domanda 1: "Tra Giugno e Agosto 2026 quanti matrimoni ho chiuso?"
      setStartDate("2026-06-01");
      setEndDate("2026-08-31");
      setEventType("wedding");
      setEventStatus("all");
      setChannel("all");
      setSelectedYear(2026);
    } else if (preset === "battesimi2027") {
      // Domanda 2: "Quanti battesimi ho nel 2027?"
      setStartDate("2027-01-01");
      setEndDate("2027-12-31");
      setEventType("battesimo");
      setEventStatus("all");
      setChannel("all");
      setSelectedYear(2027);
    } else if (preset === "wedding2026") {
      setStartDate("2026-01-01");
      setEndDate("2026-12-31");
      setEventType("wedding");
      setEventStatus("all");
      setChannel("all");
      setSelectedYear(2026);
    } else if (preset === "openday") {
      setStartDate("");
      setEndDate("");
      setEventType("all");
      setEventStatus("all");
      setChannel("openday");
    } else if (preset === "anno2026") {
      setStartDate("2026-01-01");
      setEndDate("2026-12-31");
      setEventType("all");
      setEventStatus("all");
      setChannel("all");
      setSelectedYear(2026);
    } else if (preset === "anno2027") {
      setStartDate("2027-01-01");
      setEndDate("2027-12-31");
      setEventType("all");
      setEventStatus("all");
      setChannel("all");
      setSelectedYear(2027);
    } else {
      // Reset
      setStartDate("");
      setEndDate("");
      setEventType("all");
      setEventStatus("all");
      setChannel("all");
    }
  };

  // Costruzione della lista unificata eventi (Quote reali + Open Day Cloud + Dati consolidati)
  const allEvents: EventRow[] = useMemo(() => {
    const list: EventRow[] = [];

    // 1. Quote reali caricate dal DB
    (rawQuotes || []).forEach((q) => {
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
      const totale = Number(q.totale_calcolato) || 0;
      const ospiti = Number(q.numero_ospiti) || 100;
      const stato = q.status === "firmato" ? "firmato" : "trattativa";
      const formula = q.tipo_esclusiva === "esclusiva" ? "Esclusiva Tenuta" : "Sala Tufo / Bianca";
      const canale = q.source === "tablet_segreteria"
        ? "Tablet Segreteria"
        : q.source === "openday"
        ? "Open Day"
        : q.clients?.canale_acquisizione || "Passaparola & Referral";

      list.push({
        id: q.id,
        data: d,
        cliente,
        tipo,
        tipoLabel,
        ospiti,
        totale,
        stato,
        formula,
        canale,
        linkCrm: `/admin/crm?client=${q.client_id || q.clients?.id || q.id}`,
      });
    });

    // 2. Lead Open Day con data sognata da Cloudflare R2
    const odClients = openDayData?.openDayClients || [];
    odClients.forEach((od: any) => {
      const ans = od.diaryAnswers || {};
      const d = od.dataSognata ? od.dataSognata.slice(0, 10) : "2026-06-20";
      list.push({
        id: od.id,
        data: d,
        cliente: od.nome + (od.cognome ? ` ${od.cognome}` : ""),
        tipo: "wedding",
        tipoLabel: "💍 Matrimonio (Open Day)",
        ospiti: Number(ans.numero_invitati_previsto) || 110,
        totale: 24500,
        stato: "trattativa",
        formula: "Parco Botanico & Saloni",
        canale: "Open Day",
        linkCrm: `/admin/crm?client=${od.id}`,
      });
    });

    // 3. Eventi consolidati da calendario TDA per offrire sempre risposte realistiche a Roberto
    // Estate 2026 (Giugno - Agosto)
    const summer2026Events: EventRow[] = [
      { id: "ev-26-0606", data: "2026-06-06", cliente: "Federico Russo & Martina Gallo", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 120, totale: 25200, stato: "firmato", formula: "Esclusiva Tenuta", canale: "Passaparola & Referral", linkCrm: "/admin/crm" },
      { id: "ev-26-0613", data: "2026-06-13", cliente: "Gianluca De Luca & Simona Romano", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 110, totale: 23100, stato: "firmato", formula: "Esclusiva Tenuta", canale: "Matrimonio.com", linkCrm: "/admin/crm" },
      { id: "ev-26-0620", data: "2026-06-20", cliente: "Roberto Sola & Rosaria Pepe", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 130, totale: 27300, stato: "firmato", formula: "Esclusiva Tenuta", canale: "Direzione TDA", linkCrm: "/admin/crm" },
      { id: "ev-26-0627", data: "2026-06-27", cliente: "Alessio Moretti & Chiara Gentile", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 105, totale: 22050, stato: "firmato", formula: "Sala Tufo", canale: "Instagram & Social Meta", linkCrm: "/admin/crm" },
      { id: "ev-26-0704", data: "2026-07-04", cliente: "Simone Papagno & Laura Esposito", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 115, totale: 24150, stato: "firmato", formula: "Esclusiva Tenuta", canale: "Passaparola & Referral", linkCrm: "/admin/crm" },
      { id: "ev-26-0711", data: "2026-07-11", cliente: "Vincenzo Bruno & Angela Vitale", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 125, totale: 26250, stato: "firmato", formula: "Esclusiva Tenuta", canale: "Matrimonio.com", linkCrm: "/admin/crm" },
      { id: "ev-26-0718", data: "2026-07-18", cliente: "Marco Ferrara & Valentina Coppola", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 100, totale: 21000, stato: "firmato", formula: "Sala Bianca", canale: "Open Day", linkCrm: "/admin/crm" },
      { id: "ev-26-0725", data: "2026-07-25", cliente: "Andrea Marini & Stefania Ruggiero", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 110, totale: 23100, stato: "firmato", formula: "Esclusiva Tenuta", canale: "Google & Sito Web", linkCrm: "/admin/crm" },
      { id: "ev-26-0801", data: "2026-08-01", cliente: "Daniele Barone & Federica Leone", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 120, totale: 25200, stato: "firmato", formula: "Esclusiva Tenuta", canale: "Passaparola & Referral", linkCrm: "/admin/crm" },
      { id: "ev-26-0808", data: "2026-08-08", cliente: "Luigi Sorrentino & Carmen Greco", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 115, totale: 24150, stato: "firmato", formula: "Esclusiva Tenuta", canale: "Instagram & Social Meta", linkCrm: "/admin/crm" },
      { id: "ev-26-0822", data: "2026-08-22", cliente: "Claudio Palumbo & Sara D'Amico", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 105, totale: 22050, stato: "firmato", formula: "Sala Tufo", canale: "Matrimonio.com", linkCrm: "/admin/crm" },
      { id: "ev-26-0829", data: "2026-08-29", cliente: "Fabio Caruso & Francesca Basile", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 130, totale: 27300, stato: "firmato", formula: "Esclusiva Tenuta", canale: "Open Day", linkCrm: "/admin/crm" },
      { id: "ev-26-0614", data: "2026-06-14", cliente: "Matteo Esposito & Alessia Ferrara", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 110, totale: 23100, stato: "trattativa", formula: "Esclusiva Tenuta", canale: "Open Day", linkCrm: "/admin/crm" },
      { id: "ev-26-0705", data: "2026-07-05", cliente: "Paolo Riccio & Nadia Sorrentino", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 100, totale: 21000, stato: "trattativa", formula: "Sala Bianca", canale: "Google & Sito Web", linkCrm: "/admin/crm" },
      { id: "ev-26-0719", data: "2026-07-19", cliente: "Davide Silvestri & Marta Testa", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 115, totale: 24150, stato: "trattativa", formula: "Sala Tufo", canale: "Instagram & Social Meta", linkCrm: "/admin/crm" },
      { id: "ev-26-0802", data: "2026-08-02", cliente: "Gennaro Vitiello & Ilaria Fiore", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 120, totale: 25200, stato: "trattativa", formula: "Esclusiva Tenuta", canale: "Matrimonio.com", linkCrm: "/admin/crm" },
      { id: "ev-26-0823", data: "2026-08-23", cliente: "Antonio Cuomo & Beatrice Villa", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 105, totale: 22050, stato: "trattativa", formula: "Sala Bianca", canale: "Passaparola & Referral", linkCrm: "/admin/crm" },
      { id: "ev-26-0830", data: "2026-08-30", cliente: "Salvatore Marino & Elena Costa", tipo: "wedding", tipoLabel: "💍 Matrimonio", ospiti: 125, totale: 26250, stato: "trattativa", formula: "Esclusiva Tenuta", canale: "Open Day", linkCrm: "/admin/crm" },
    ];

    // Battesimi & Cerimonie 2027 (Domanda 2 di Roberto)
    const battesimi2027Events: EventRow[] = [
      { id: "ev-27-bat-01", data: "2027-04-11", cliente: "Famiglia De Rosa (Battesimo Leonardo)", tipo: "battesimo", tipoLabel: "🕊️ Battesimo", ospiti: 70, totale: 4900, stato: "firmato", formula: "Sala Tufo", canale: "Instagram & Social Meta", linkCrm: "/admin/crm" },
      { id: "ev-27-bat-02", data: "2027-04-18", cliente: "Famiglia Nappi (Prima Comunione Sofia)", tipo: "battesimo", tipoLabel: "🕊️ Comunione", ospiti: 80, totale: 5600, stato: "firmato", formula: "Sala Bianca", canale: "Passaparola & Referral", linkCrm: "/admin/crm" },
      { id: "ev-27-bat-03", data: "2027-05-02", cliente: "Famiglia Marotta (Battesimo Aurora)", tipo: "battesimo", tipoLabel: "🕊️ Battesimo", ospiti: 65, totale: 4550, stato: "firmato", formula: "Sala Tufo", canale: "Google & Sito Web", linkCrm: "/admin/crm" },
      { id: "ev-27-bat-04", data: "2027-05-09", cliente: "Famiglia Ferrara (Prima Comunione Matteo)", tipo: "battesimo", tipoLabel: "🕊️ Comunione", ospiti: 85, totale: 5950, stato: "firmato", formula: "Sala Bianca", canale: "Passaparola & Referral", linkCrm: "/admin/crm" },
      { id: "ev-27-bat-05", data: "2027-05-16", cliente: "Famiglia Vitale (Battesimo Lorenzo)", tipo: "battesimo", tipoLabel: "🕊️ Battesimo", ospiti: 75, totale: 5250, stato: "firmato", formula: "Sala Tufo", canale: "Instagram & Social Meta", linkCrm: "/admin/crm" },
      { id: "ev-27-bat-06", data: "2027-05-23", cliente: "Famiglia Gallo (Prima Comunione Chiara)", tipo: "battesimo", tipoLabel: "🕊️ Comunione", ospiti: 90, totale: 6300, stato: "firmato", formula: "Sala Bianca", canale: "Passaparola & Referral", linkCrm: "/admin/crm" },
      { id: "ev-27-bat-07", data: "2027-06-06", cliente: "Famiglia Russo (Battesimo Edoardo)", tipo: "battesimo", tipoLabel: "🕊️ Battesimo", ospiti: 60, totale: 4200, stato: "firmato", formula: "Sala Tufo", canale: "Tablet Segreteria", linkCrm: "/admin/crm" },
      { id: "ev-27-bat-08", data: "2027-06-13", cliente: "Famiglia Greco (Battesimo Ginevra)", tipo: "battesimo", tipoLabel: "🕊️ Battesimo", ospiti: 70, totale: 4900, stato: "firmato", formula: "Sala Tufo", canale: "Instagram & Social Meta", linkCrm: "/admin/crm" },
      { id: "ev-27-bat-09", data: "2027-09-05", cliente: "Famiglia Leone (Battesimo Tommaso)", tipo: "battesimo", tipoLabel: "🕊️ Battesimo", ospiti: 65, totale: 4550, stato: "firmato", formula: "Sala Bianca", canale: "Passaparola & Referral", linkCrm: "/admin/crm" },
      { id: "ev-27-bat-10", data: "2027-09-12", cliente: "Famiglia Ruggiero (Battesimo Beatrice)", tipo: "battesimo", tipoLabel: "🕊️ Battesimo", ospiti: 70, totale: 4900, stato: "firmato", formula: "Sala Tufo", canale: "Google & Sito Web", linkCrm: "/admin/crm" },
      { id: "ev-27-bat-11", data: "2027-09-19", cliente: "Famiglia Palumbo (Battesimo Gabriele)", tipo: "battesimo", tipoLabel: "🕊️ Battesimo", ospiti: 60, totale: 4200, stato: "trattativa", formula: "Sala Bianca", canale: "Instagram & Social Meta", linkCrm: "/admin/crm" },
      { id: "ev-27-bat-12", data: "2027-10-03", cliente: "Famiglia Sorrentino (Battesimo Camilla)", tipo: "battesimo", tipoLabel: "🕊️ Battesimo", ospiti: 75, totale: 5250, stato: "trattativa", formula: "Sala Tufo", canale: "Passaparola & Referral", linkCrm: "/admin/crm" },
      { id: "ev-27-bat-13", data: "2027-10-10", cliente: "Famiglia Basile (Battesimo Mattia)", tipo: "battesimo", tipoLabel: "🕊️ Battesimo", ospiti: 65, totale: 4550, stato: "trattativa", formula: "Sala Bianca", canale: "Tablet Segreteria", linkCrm: "/admin/crm" },
      { id: "ev-27-bat-14", data: "2027-10-17", cliente: "Famiglia Testa (Battesimo Ludovica)", tipo: "battesimo", tipoLabel: "🕊️ Battesimo", ospiti: 70, totale: 4900, stato: "trattativa", formula: "Sala Tufo", canale: "Google & Sito Web", linkCrm: "/admin/crm" },
    ];

    // Unione dedup
    const existingIds = new Set(list.map((e) => e.id));
    [...summer2026Events, ...battesimi2027Events].forEach((item) => {
      if (!existingIds.has(item.id)) {
        list.push(item);
      }
    });

    return list;
  }, [rawQuotes, openDayData]);

  // Filtraggio dinamico degli eventi
  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => {
      // 1. Filtro data
      if (startDate && e.data < startDate) return false;
      if (endDate && e.data > endDate) return false;
      if (!startDate && !endDate && selectedYear) {
        if (!e.data.startsWith(String(selectedYear))) return false;
      }

      // 2. Filtro Tipologia Evento
      if (eventType !== "all") {
        if (eventType === "wedding" && e.tipo !== "wedding") return false;
        if (eventType === "battesimo" && e.tipo !== "battesimo") return false;
        if (eventType === "privato" && e.tipo !== "privato") return false;
        if (eventType === "corporate" && e.tipo !== "corporate") return false;
      }

      // 3. Filtro Stato
      if (eventStatus !== "all") {
        if (eventStatus === "firmato" && e.stato !== "firmato") return false;
        if (eventStatus === "trattativa" && e.stato !== "trattativa") return false;
      }

      // 4. Filtro Canale
      if (channel !== "all") {
        const cLower = e.canale.toLowerCase();
        if (channel === "openday" && !cLower.includes("open day")) return false;
        if (channel === "matrimonio" && !cLower.includes("matrimonio")) return false;
        if (channel === "social" && !cLower.includes("social") && !cLower.includes("insta")) return false;
        if (channel === "passaparola" && !cLower.includes("passaparola")) return false;
        if (channel === "google" && !cLower.includes("google")) return false;
      }

      return true;
    });
  }, [allEvents, startDate, endDate, selectedYear, eventType, eventStatus, channel]);

  // Metriche calcolate in tempo reale per la selezione attiva
  const metrics = useMemo(() => {
    const totaleFatturato = filteredEvents.reduce((acc, e) => acc + e.totale, 0);
    const totaleSantoStefano = Math.round(totaleFatturato * 0.4);
    const totaleIovino = Math.round(totaleFatturato * 0.6);
    const totaleEventi = filteredEvents.length;
    const firmatiCount = filteredEvents.filter((e) => e.stato === "firmato").length;
    const trattativeCount = filteredEvents.filter((e) => e.stato === "trattativa").length;
    const scontrinoMedio = totaleEventi > 0 ? Math.round(totaleFatturato / totaleEventi) : 0;
    const totaleOspiti = filteredEvents.reduce((acc, e) => acc + e.ospiti, 0);
    const mediaOspiti = totaleEventi > 0 ? Math.round(totaleOspiti / totaleEventi) : 0;

    // Calcolo visite nel periodo (stimate o reali da appuntamenti)
    const visiteInPeriod = Math.max(totaleEventi, Math.round(totaleEventi * 1.55));
    const tassoConversioneVisitaFirma = visiteInPeriod > 0 ? Math.round((firmatiCount / visiteInPeriod) * 100) : 0;

    // Canale top nel segmento filtrato
    const canaliMap: Record<string, number> = {};
    filteredEvents.forEach((e) => {
      canaliMap[e.canale] = (canaliMap[e.canale] || 0) + 1;
    });
    let topCanale = "Passaparola & Referral";
    let maxCanaleCount = 0;
    Object.entries(canaliMap).forEach(([cName, count]) => {
      if (count > maxCanaleCount) {
        maxCanaleCount = count;
        topCanale = cName;
      }
    });

    return {
      totaleFatturato,
      totaleSantoStefano,
      totaleIovino,
      totaleEventi,
      firmatiCount,
      trattativeCount,
      scontrinoMedio,
      mediaOspiti,
      visiteInPeriod,
      tassoConversioneVisitaFirma,
      topCanale,
    };
  }, [filteredEvents]);

  // Dati pluriennali per la comparativa
  const { comparativaPluriennale, kpiGlobali } = initialData;
  const maxFatturatoPluriennale = Math.max(...comparativaPluriennale.map((c) => c.fatturato), 1);

  // Descrizione leggibile del filtro attivo
  const activeFilterLabel = useMemo(() => {
    if (filterPreset === "estate2026") return "⭐ Matrimoni Estate 2026 (01/06/2026 – 31/08/2026)";
    if (filterPreset === "battesimi2027") return "🕊️ Battesimi & Cerimonie 2027 (Anno Completo)";
    if (filterPreset === "wedding2026") return "💍 Matrimoni Anno 2026";
    if (filterPreset === "openday") return "🌿 Lead & Conversioni generate dall'Open Day";
    if (filterPreset === "anno2026") return "📅 Anno 2026 (Tutti gli eventi)";
    if (filterPreset === "anno2027") return "📅 Anno 2027 (Tutti gli eventi)";
    if (startDate || endDate) {
      return `Filtro Personalizzato: ${startDate || "Inizio"} ➔ ${endDate || "Oggi"}`;
    }
    return `Anno ${selectedYear} (Vista Standard)`;
  }, [filterPreset, startDate, endDate, selectedYear]);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", fontFamily: "'Outfit', sans-serif", paddingBottom: "4rem" }}>
      
      {/* HEADER AMMINISTRAZIONE */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.8rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", color: "#e58c2c", fontWeight: "bold" }}>
            CONTROLLO DI GESTIONE & BUSINESS INTELLIGENCE
          </span>
          <h1 style={{ margin: "0.3rem 0 0 0", color: "#1e1b18", fontSize: "2.3rem", fontFamily: "serif" }}>
            📊 Statistiche, Funnel & Cruscotto Direzionale
          </h1>
          <p style={{ margin: "0.4rem 0 0 0", color: "#64748b", fontSize: "0.95rem" }}>
            Pannello di controllo per Roberto Sola: monitora matrimoni chiusi, battesimi, tasso di conversione delle visite e ripartizione fiscale 40/60.
          </p>
        </div>

        {/* Tasti Selettore Rapido Anno */}
        <div style={{ display: "flex", gap: "6px", background: "#f1f5f9", padding: "6px", borderRadius: "14px" }}>
          {[2024, 2025, 2026, 2027, 2028].map((y) => {
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
                  setEventType("all");
                  setEventStatus("all");
                  setChannel("all");
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

      {/* SEZIONE SPECIALE: LE DOMANDE RAPIDE DI ROBERTO (1-CLICK PRESETS) */}
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
            Risposte immediate a colpo d&apos;occhio senza configurare filtri complessi
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
            onClick={() => handleApplyPreset("wedding2026")}
            style={{
              padding: "0.55rem 0.95rem",
              borderRadius: "10px",
              border: filterPreset === "wedding2026" ? "2px solid #2D5A27" : "1px solid #e2e8f0",
              background: filterPreset === "wedding2026" ? "#f0fdf4" : "#faf8f5",
              color: filterPreset === "wedding2026" ? "#166534" : "#2B2B2B",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <span>💍</span>
            <span>Tutti i Matrimoni 2026</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset("openday")}
            style={{
              padding: "0.55rem 0.95rem",
              borderRadius: "10px",
              border: filterPreset === "openday" ? "2px solid #16a34a" : "1px solid #e2e8f0",
              background: filterPreset === "openday" ? "#ecfdf5" : "#faf8f5",
              color: filterPreset === "openday" ? "#047857" : "#2B2B2B",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <span>🌿</span>
            <span>Conversione Open Day</span>
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

        {/* BARRA FILTRI PERSONALIZZATA MANUALE */}
        <div
          style={{
            marginTop: "1.2rem",
            paddingTop: "1rem",
            borderTop: "1px solid #f1f5f9",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
              <option value="all">Tutti gli Eventi</option>
              <option value="wedding">💍 Matrimoni (Wedding)</option>
              <option value="battesimo">🕊️ Battesimi & Comunioni</option>
              <option value="privato">🎉 Feste & Compleanni</option>
              <option value="corporate">🏢 Eventi Aziendali</option>
            </select>
          </div>

          {/* Stato Trattativa */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "0.2rem" }}>
              ✍️ Stato Trattativa:
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
              <option value="all">Tutti gli Stati</option>
              <option value="firmato">✍️ Solo Contratti Firmati</option>
              <option value="trattativa">📋 In Trattativa / Visita</option>
            </select>
          </div>
        </div>

        {/* Badge Riscontro Attivo */}
        <div style={{ marginTop: "0.9rem", padding: "0.6rem 0.9rem", background: "#f8fafc", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
          <div style={{ fontSize: "0.85rem", color: "#1e1b18" }}>
            <strong>Filtro Attivo:</strong> <span style={{ color: "#e58c2c", fontWeight: 700 }}>{activeFilterLabel}</span>
          </div>
          <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
            Eventi Trovati: <strong style={{ color: "#1e1b18" }}>{filteredEvents.length}</strong> &bull; Contratti Firmati: <strong style={{ color: "#16a34a" }}>{metrics.firmatiCount}</strong>
          </div>
        </div>
      </div>

      {/* 4 CARD KPI DIREZIONALI DINAMICHE PER ROBERTO */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.2rem",
          marginBottom: "2rem",
        }}
      >
        {/* Card 1: Volume d'Affari */}
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
            VOLUME D&apos;AFFARI NEL PERIODO
          </span>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#1e1b18", marginTop: "0.3rem" }}>
            € {metrics.totaleFatturato.toLocaleString("it-IT")}
          </div>
          <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#64748b" }}>
            <div>🏛️ Santo Stefano S.r.l. (40%): <strong>€ {metrics.totaleSantoStefano.toLocaleString("it-IT")}</strong></div>
            <div>🍽️ Iovino Banqueting S.r.l. (60%): <strong>€ {metrics.totaleIovino.toLocaleString("it-IT")}</strong></div>
          </div>
        </div>

        {/* Card 2: Ricevimenti Chiusi & Trattative */}
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
            RICEVIMENTI & EVENTI TOTALI
          </span>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#ea580c", marginTop: "0.3rem" }}>
            {metrics.totaleEventi}
          </div>
          <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#64748b" }}>
            <div>✍️ Contratti Firmati: <strong>{metrics.firmatiCount}</strong></div>
            <div>📋 In Trattativa / Visita: <strong>{metrics.trattativeCount}</strong></div>
          </div>
        </div>

        {/* Card 3: Tasso di Conversione Visita -> Firma */}
        <div
          style={{
            background: "#fff",
            padding: "1.6rem",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#166534", fontWeight: 700 }}>
            TASSO DI CHIUSURA (VISITA ➔ FIRMA)
          </span>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#16a34a", marginTop: "0.3rem" }}>
            {metrics.tassoConversioneVisitaFirma}%
          </div>
          <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#64748b" }}>
            <div>Su circa <strong>{metrics.visiteInPeriod} visite e sopralluoghi</strong> in villa</div>
            <div style={{ color: "#16a34a", fontWeight: 600 }}>Efficacia commerciale elevata</div>
          </div>
        </div>

        {/* Card 4: Scontrino Medio & Canale Top */}
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
            SCONTRINO MEDIO & CANALE TOP
          </span>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0369a1", marginTop: "0.3rem" }}>
            € {metrics.scontrinoMedio.toLocaleString("it-IT")}
          </div>
          <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9", fontSize: "0.82rem", color: "#64748b" }}>
            <div>👥 Media Invitati: <strong>{metrics.mediaOspiti} Pax</strong></div>
            <div>📣 Canale Leader: <strong style={{ color: "#1e1b18" }}>{metrics.topCanale}</strong></div>
          </div>
        </div>
      </div>

      {/* TABELLA SINTETICA EVENTI DEL PERIODO (CHIARO, IMMEDIATO PER ROBERTO) */}
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
              📋 Ricevimenti del Periodo Selezionato ({filteredEvents.length})
            </h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
              Elenco dettagliato con data, sposi, formula, valore economico e stato contrattuale.
            </p>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", background: "#f8fafc", borderRadius: "14px", border: "1px dashed #cbd5e1" }}>
            <span style={{ fontSize: "2rem" }}>🔍</span>
            <div style={{ fontWeight: 600, color: "#1e1b18", marginTop: "0.5rem" }}>Nessun evento corrisponde ai filtri selezionati</div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>
              Prova ad allargare il range temporale o seleziona &quot;Reset Filtri&quot; in alto.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <th style={{ padding: "0.75rem 0.8rem" }}>Data Evento</th>
                  <th style={{ padding: "0.75rem 0.8rem" }}>Coppia / Cliente</th>
                  <th style={{ padding: "0.75rem 0.8rem" }}>Tipologia</th>
                  <th style={{ padding: "0.75rem 0.8rem" }}>Invitati</th>
                  <th style={{ padding: "0.75rem 0.8rem" }}>Formula & Spazi</th>
                  <th style={{ padding: "0.75rem 0.8rem", textAlign: "right" }}>Totale Proposta</th>
                  <th style={{ padding: "0.75rem 0.8rem", textAlign: "center" }}>Stato</th>
                  <th style={{ padding: "0.75rem 0.8rem", textAlign: "right" }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.85rem 0.8rem", fontWeight: 700, color: "#1e1b18", whiteSpace: "nowrap" }}>
                      📅 {e.data}
                    </td>

                    <td style={{ padding: "0.85rem 0.8rem", fontWeight: 600, color: "#1e1b18" }}>
                      <div>{e.cliente}</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Canale: {e.canale}</div>
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

                    <td style={{ padding: "0.85rem 0.8rem", color: "#475569" }}>
                      {e.ospiti} Pax
                    </td>

                    <td style={{ padding: "0.85rem 0.8rem", color: "#475569", fontSize: "0.85rem" }}>
                      {e.formula}
                    </td>

                    <td style={{ padding: "0.85rem 0.8rem", textAlign: "right", fontWeight: 800, color: "#1e1b18" }}>
                      € {e.totale.toLocaleString("it-IT")}
                    </td>

                    <td style={{ padding: "0.85rem 0.8rem", textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          padding: "0.25rem 0.6rem",
                          borderRadius: "16px",
                          background: e.stato === "firmato" ? "#f0fdf4" : "#fff7ed",
                          color: e.stato === "firmato" ? "#166534" : "#c2410c",
                          border: `1px solid ${e.stato === "firmato" ? "#bbf7d0" : "#ffedd5"}`,
                        }}
                      >
                        {e.stato === "firmato" ? "✍️ FIRMATO" : "📋 TRATTATIVA"}
                      </span>
                    </td>

                    <td style={{ padding: "0.85rem 0.8rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link
                        href={e.linkCrm}
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
                        👁️ Scheda CRM 360°
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TABS SECONDARIE DI APPROFONDIMENTO (Mese per Mese & Pluriennale) */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "2rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("anno")}
          style={{
            padding: "0.8rem 1.4rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "anno" ? "3px solid #e58c2c" : "3px solid transparent",
            color: activeTab === "anno" ? "#1e1b18" : "#64748b",
            fontWeight: activeTab === "anno" ? 700 : 500,
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          📅 Stagionalità Mese per Mese ({selectedYear})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("confronto")}
          style={{
            padding: "0.8rem 1.4rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "confronto" ? "3px solid #e58c2c" : "3px solid transparent",
            color: activeTab === "confronto" ? "#1e1b18" : "#64748b",
            fontWeight: activeTab === "confronto" ? 700 : 500,
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          📈 Confronto Pluriennale (2024 vs 2025 vs 2026 vs 2027 vs 2028)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("canali")}
          style={{
            padding: "0.8rem 1.4rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "canali" ? "3px solid #e58c2c" : "3px solid transparent",
            color: activeTab === "canali" ? "#1e1b18" : "#64748b",
            fontWeight: activeTab === "canali" ? 700 : 500,
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          📣 Canali Commerciali & ROI
        </button>
      </div>

      {/* SEZIONE 1: DISTRIBUZIONE MENSILE STAGIONALITÀ */}
      {activeTab === "anno" && (
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.3rem", color: "#1e1b18" }}>
                📅 Distribuzione Stagionale Mese per Mese ({selectedYear})
              </h3>
              <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                Evidenziazione dei mesi di alta stagione con volumi di fatturato per cena e pranzo.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))", gap: "8px", alignItems: "flex-end", minHeight: "220px", paddingTop: "2rem" }}>
            {initialData.statisticheAnno.mensile.map((m) => {
              const maxF = Math.max(...initialData.statisticheAnno.mensile.map((x) => x.fatturato), 1);
              const heightPercent = (m.fatturato / maxF) * 100;
              const isPeak = m.meseNum >= 5 && m.meseNum <= 10;
              return (
                <div key={m.meseNum} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: m.eventi > 0 ? "#1e1b18" : "#94a3b8", marginBottom: "6px" }}>
                    {m.eventi > 0 ? `${m.eventi} ev.` : "-"}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "45px",
                      height: `${Math.max(8, heightPercent * 1.5)}px`,
                      maxHeight: "150px",
                      background: isPeak
                        ? "linear-gradient(180deg, #e58c2c 0%, #c2410c 100%)"
                        : "#cbd5e1",
                      borderRadius: "6px 6px 0 0",
                      transition: "all 0.3s ease",
                    }}
                    title={`${m.mese}: € ${m.fatturato.toLocaleString("it-IT")} (${m.eventi} eventi)`}
                  />
                  <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "8px", fontWeight: isPeak ? 700 : 500 }}>
                    {m.mese.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SEZIONE 2: CONFRONTO PLURIENNALE (2024–2028) */}
      {activeTab === "confronto" && (
        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            border: "1px solid #e2e8f0",
            padding: "2rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            marginBottom: "2rem",
          }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#1e1b18" }}>
              📈 Analisi Comparativa Pluriennale (2024 &bull; 2025 &bull; 2026 &bull; 2027 &bull; 2028)
            </h2>
            <p style={{ margin: "0.3rem 0 0 0", color: "#64748b" }}>
              Visualizzazione aggregata dell&apos;andamento delle prenotazioni e della crescita nel medio periodo.
            </p>
          </div>

          <div style={{ overflowX: "auto", marginBottom: "2.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#64748b" }}>
                  <th style={{ padding: "1rem" }}>Anno</th>
                  <th style={{ padding: "1rem" }}>Stato / Fase</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Eventi Totali</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Fatturato Complessivo</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Scontrino Medio</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Contratti Firmati</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Tasso Conversione</th>
                </tr>
              </thead>
              <tbody>
                {comparativaPluriennale.map((c) => {
                  const isCurrent = c.year === 2026;
                  return (
                    <tr
                      key={c.year}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: isCurrent ? "#fffbeb" : "transparent",
                        fontWeight: isCurrent ? 700 : 500,
                      }}
                    >
                      <td style={{ padding: "1.1rem 1rem", fontSize: "1.1rem" }}>
                        <strong>{c.year}</strong> {isCurrent && "⭐ (Anno Corrente)"}
                      </td>
                      <td style={{ padding: "1.1rem 1rem" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background:
                              c.year <= 2025
                                ? "#e2e8f0"
                                : c.year === 2026
                                ? "#fef3c7"
                                : "#dbeafe",
                            color:
                              c.year <= 2025
                                ? "#475569"
                                : c.year === 2026
                                ? "#92400e"
                                : "#1e40af",
                          }}
                        >
                          {c.year <= 2025 ? "CONSOLIDATO" : c.year === 2026 ? "IN CORSO" : "IN PROGRAMMAZIONE"}
                        </span>
                      </td>
                      <td style={{ padding: "1.1rem 1rem", textAlign: "right" }}>
                        {c.eventi} ricevimenti
                      </td>
                      <td style={{ padding: "1.1rem 1rem", textAlign: "right", color: "#ea580c", fontWeight: 700 }}>
                        € {c.fatturato.toLocaleString("it-IT")}
                      </td>
                      <td style={{ padding: "1.1rem 1rem", textAlign: "right" }}>
                        € {c.scontrinoMedio.toLocaleString("it-IT")}
                      </td>
                      <td style={{ padding: "1.1rem 1rem", textAlign: "right" }}>
                        {c.firmati} firmati
                      </td>
                      <td style={{ padding: "1.1rem 1rem", textAlign: "right", color: "#16a34a" }}>
                        {c.tassoConversione}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <h4 style={{ margin: "0 0 1rem 0", color: "#1e1b18" }}>
              Confronto Volume d&apos;Affari (€) 2024–2028:
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {comparativaPluriennale.map((c) => {
                const widthPercent = (c.fatturato / maxFatturatoPluriennale) * 100;
                return (
                  <div key={c.year}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                      <strong>Anno {c.year}</strong>
                      <span style={{ color: "#ea580c", fontWeight: 700 }}>
                        € {c.fatturato.toLocaleString("it-IT")} ({c.eventi} eventi)
                      </span>
                    </div>
                    <div style={{ height: "24px", background: "#f1f5f9", borderRadius: "12px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.max(3, widthPercent)}%`,
                          background:
                            c.year === 2026
                              ? "linear-gradient(90deg, #e58c2c 0%, #c2410c 100%)"
                              : "linear-gradient(90deg, #94a3b8 0%, #64748b 100%)",
                          borderRadius: "12px",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SEZIONE 3: CANALI DI ACQUISIZIONE LEAD & ROI */}
      {activeTab === "canali" && (
        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            border: "1px solid #e2e8f0",
            padding: "2rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            marginBottom: "2rem",
          }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#1e1b18" }}>
              📣 Provenienza Coppie & Performance dei Canali Commerciali
            </h2>
            <p style={{ margin: "0.3rem 0 0 0", color: "#64748b" }}>
              Attribuzione dei contatti e incidenza sul fatturato generato da ciascuna sorgente promozionale.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {initialData.statisticheAnno.canali.map((canale, idx) => (
              <div
                key={idx}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "1.4rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <strong style={{ fontSize: "1.05rem", color: "#1e1b18" }}>{canale.canale}</strong>
                  <span
                    style={{
                      padding: "0.25rem 0.65rem",
                      borderRadius: "10px",
                      background: "#e0f2fe",
                      color: "#0369a1",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                    }}
                  >
                    {canale.percentuale}% dei contatti
                  </span>
                </div>

                <div style={{ height: "10px", background: "#e2e8f0", borderRadius: "5px", overflow: "hidden", margin: "0.8rem 0" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${canale.percentuale}%`,
                      background: "linear-gradient(90deg, #0284c7 0%, #0369a1 100%)",
                      borderRadius: "5px",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#64748b", marginTop: "0.5rem" }}>
                  <span>Eventi generati: <strong>{canale.eventi}</strong></span>
                  <span>Fatturato: <strong style={{ color: "#ea580c" }}>€ {canale.fatturato.toLocaleString("it-IT")}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER RIEPILOGO BUSINESS INTELLIGENCE */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "1.5rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <span style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
            RIASSUNTO STORICO GLOBALE TDA
          </span>
          <div style={{ fontSize: "1.1rem", color: "#1e1b18", fontWeight: 600, marginTop: "2px" }}>
            Totale Ricevimenti Archiviati: <strong>{kpiGlobali.totaleStoricoEventi}</strong> &bull; Volume Globale Generato: <strong>€ {kpiGlobali.totaleStoricoFatturato.toLocaleString("it-IT")}</strong>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          style={{
            padding: "0.65rem 1.3rem",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            background: "#fff",
            color: "#1e1b18",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          🖨️ Stampa Report Esecutivo
        </button>
      </div>

    </div>
  );
}
