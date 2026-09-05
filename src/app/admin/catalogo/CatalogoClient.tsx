"use client";

import React, { useState, useEffect } from "react";
import {
  SERVICES_CATALOG,
  ServiceCatalogItem,
  EventPhase,
  calculateServiceSplit,
  calculateVillaMargin
} from "@/lib/servicesCatalog";
import { saveServiceItemAction, resetCatalogAction } from "./actions";
import { Check, Eye, Sparkles } from "lucide-react";

interface WPMediaItem {
  id: number;
  title: string;
  url: string;
  thumbnail: string;
}

export const PHASE_CONFIG: Record<EventPhase, { label: string; icon: string; bg: string; text: string; border: string }> = {
  agrumeto: { label: "Agrumeto", icon: "🌿", bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
  rito: { label: "Rito", icon: "💍", bg: "#fff1f2", text: "#be123c", border: "#fecdd3" },
  sala_tufo: { label: "Sala Tufo", icon: "🏛️", bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  torta: { label: "Taglio Torta", icon: "🎂", bg: "#e0e7ff", text: "#3730a3", border: "#c7d2fe" },
  after_party: { label: "After Party", icon: "🎉", bg: "#f3e8ff", text: "#6b21a8", border: "#e9d5ff" },
  generale: { label: "Generale", icon: "✨", bg: "#f1f5f9", text: "#334155", border: "#cbd5e1" }
};

export default function CatalogoClient() {
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>(SERVICES_CATALOG);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string>("tutte");
  const [selectedCategory, setSelectedCategory] = useState("tutti");
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid"); // DEFAULT A SCHEDE / CARTE
  const [editingItem, setEditingItem] = useState<ServiceCatalogItem | null>(null);
  const [previewItem, setPreviewItem] = useState<ServiceCatalogItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Inline Price Editing State
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlinePriceValue, setInlinePriceValue] = useState<string>("");

  // WP Media Library Picker State
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<WPMediaItem[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaSearch, setMediaSearch] = useState("");

  // Carica dal localStorage o fallback ufficiale
  useEffect(() => {
    const saved = localStorage.getItem("tda_services_catalog_v3") || localStorage.getItem("tda_services_catalog_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].code) {
          // Merge per garantire fase_evento e costo_fornitore anche da vecchi snapshot
          const merged = parsed.map((item: ServiceCatalogItem) => {
            const official = SERVICES_CATALOG.find((o) => o.id === item.id || o.code === item.code);
            return {
              ...item,
              fase_evento: item.fase_evento || official?.fase_evento || "generale",
              costo_fornitore: typeof item.costo_fornitore === "number" ? item.costo_fornitore : (official?.costo_fornitore || 0)
            };
          });
          setCatalog(merged);
        } else {
          setCatalog(SERVICES_CATALOG);
          localStorage.setItem("tda_services_catalog_v3", JSON.stringify(SERVICES_CATALOG));
        }
      } catch (e) {
        console.error("Errore nel caricamento del catalogo salvato:", e);
      }
    } else {
      localStorage.setItem("tda_services_catalog_v3", JSON.stringify(SERVICES_CATALOG));
    }
  }, []);

  const saveCatalogState = (newCatalog: ServiceCatalogItem[]) => {
    setCatalog(newCatalog);
    localStorage.setItem("tda_services_catalog_v3", JSON.stringify(newCatalog));
  };

  const handleResetCatalog = async () => {
    if (confirm("Ripristinare l'intero listino ufficiale dai dati ufficiali Excel (129 servizi con codici, fasi e ripartizioni)?")) {
      setCatalog(SERVICES_CATALOG);
      localStorage.setItem("tda_services_catalog_v3", JSON.stringify(SERVICES_CATALOG));
      try {
        await resetCatalogAction();
      } catch (e) {
        console.warn("Reset action fallback:", e);
      }
      setNotice("🔄 Listino ripristinato con successo ai 129 servizi ufficiali dall'Excel!");
      setTimeout(() => setNotice(null), 3000);
    }
  };

  // Inline Price Save Handler
  const handleSaveInlinePrice = async (id: string) => {
    const num = parseFloat(inlinePriceValue);
    const validPrice = isNaN(num) || num < 0 ? 0 : Math.round(num * 100) / 100;

    const targetItem = catalog.find((item) => item.id === id);
    if (!targetItem) {
      setInlineEditingId(null);
      return;
    }

    if (targetItem.prezzo_unitario === validPrice) {
      setInlineEditingId(null);
      return;
    }

    const updatedItem: ServiceCatalogItem = {
      ...targetItem,
      prezzo_unitario: validPrice
    };

    const updated = catalog.map((item) => (item.id === id ? updatedItem : item));
    saveCatalogState(updated);
    setInlineEditingId(null);
    setNotice(`⚡ Prezzo aggiornato a € ${validPrice.toLocaleString("it-IT")} per [${updatedItem.code}]!`);
    setTimeout(() => setNotice(null), 2500);

    // Sync con persistenza Supabase e DB locale
    try {
      await saveServiceItemAction(updatedItem);
    } catch (err) {
      console.warn("Async inline save warning:", err);
    }
  };

  // Fetch Media Library WP
  const fetchWPMedia = async (page = 1, search = "") => {
    setIsLoadingMedia(true);
    try {
      let url = `https://www.laterradegliaranci.it/wp-json/wp/v2/media?per_page=100&page=${page}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const formatted: WPMediaItem[] = data.map((m: any) => ({
          id: m.id,
          title: m.title?.rendered || `Media #${m.id}`,
          url: m.source_url,
          thumbnail: m.media_details?.sizes?.thumbnail?.source_url || m.source_url
        }));
        if (page === 1) setMediaItems(formatted);
        else setMediaItems((prev) => [...prev, ...formatted]);
        setMediaPage(page);
      }
    } catch (e) {
      console.error("Errore fetch WP Media:", e);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleOpenMediaPicker = () => {
    setIsMediaModalOpen(true);
    if (mediaItems.length === 0) fetchWPMedia(1, "");
  };

  const handleSelectMedia = (media: WPMediaItem) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, immagine: media.url });
      setNotice(`🖼️ Foto "${media.title}" associata al servizio!`);
      setTimeout(() => setNotice(null), 3000);
    }
    setIsMediaModalOpen(false);
  };

  const handleEdit = (item: ServiceCatalogItem) => {
    setEditingItem({
      ...item,
      fase_evento: item.fase_evento || "generale",
      costo_fornitore: item.costo_fornitore ?? 0
    });
    setIsNew(false);
  };

  const handleAddNew = () => {
    const newCode = `EXT-${Date.now().toString().slice(-4)}`;
    setEditingItem({
      id: newCode.toLowerCase(),
      code: newCode,
      categoria: "Extra ricevimento",
      nome: "Nuovo Servizio Personalizzato",
      descrizione: "Descrizione e dettagli del nuovo servizio...",
      prezzo_unitario: 100,
      costo_fornitore: 0,
      fase_evento: "generale",
      unita_misura: "corpo",
      unitaLabel: "per evento",
      splitLabel: "40% Santo Stefano / 60% Iovino",
      splitKey: "40_60",
      immagine: "https://laterradegliaranci.it/wp-content/uploads/2024/07/sala-terradegliaranci.jpg"
    });
    setIsNew(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editingItem.nome.trim()) {
      alert("Inserisci un nome per il servizio.");
      return;
    }

    let updated: ServiceCatalogItem[];
    if (isNew) {
      updated = [editingItem, ...catalog];
    } else {
      updated = catalog.map((item) => (item.id === editingItem.id ? editingItem : item));
    }
    saveCatalogState(updated);
    setEditingItem(null);
    setNotice(`✅ Servizio [${editingItem.code}] "${editingItem.nome}" salvato nel Listino Ufficiale TDA!`);
    setTimeout(() => setNotice(null), 3000);

    // Sync con persistenza server
    try {
      await saveServiceItemAction(editingItem);
    } catch (err) {
      console.warn("Async save warning:", err);
    }
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Sei sicuro di voler eliminare questo servizio dal listino?")) {
      const updated = catalog.filter((item) => item.id !== id);
      saveCatalogState(updated);
      if (editingItem?.id === id) setEditingItem(null);
      setNotice("🗑️ Servizio eliminato con successo.");
      setTimeout(() => setNotice(null), 3000);
    }
  };

  // Categorie uniche estratte dinamicamente dal listino
  const categories = Array.from(new Set(catalog.map((s) => s.categoria)));

  // Conteggio per fasi
  const phaseKeys: EventPhase[] = ["agrumeto", "rito", "sala_tufo", "torta", "after_party", "generale"];

  // Filtraggio dinamico combinato (Fase + Categoria + Ricerca)
  const filteredCatalog = catalog.filter((item) => {
    const matchesPhase = selectedPhase === "tutte" || (item.fase_evento || "generale") === selectedPhase;
    const matchesCategory = selectedCategory === "tutti" || item.categoria === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (item.code && item.code.toLowerCase().includes(q)) ||
      item.nome.toLowerCase().includes(q) ||
      item.categoria.toLowerCase().includes(q) ||
      (item.fase_evento && item.fase_evento.toLowerCase().includes(q)) ||
      (item.descrizione && item.descrizione.toLowerCase().includes(q)) ||
      (item.splitLabel && item.splitLabel.toLowerCase().includes(q));

    return matchesPhase && matchesCategory && matchesSearch;
  });

  return (
    <div style={{ maxWidth: "1340px", margin: "0 auto", fontFamily: "'Outfit', sans-serif" }}>
      
      {/* Top Banner Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ textTransform: "uppercase", letterSpacing: "1.5px", fontSize: "0.78rem", color: "#e58c2c", fontWeight: 800 }}>
            AREA DIREZIONALE • LA TERRA DEGLI ARANCI
          </span>
          <h1 style={{ margin: "0.1rem 0 0 0", color: "#1e1b18", fontSize: "1.9rem", fontFamily: "Georgia, 'Playfair Display', serif", fontWeight: 700 }}>
            ⚙️ Catalogo Servizi & Listino Ufficiale TDA 2026
          </h1>
          <p style={{ margin: "0.15rem 0 0 0", color: "#6a6764", fontSize: "0.88rem" }}>
            Gestione rapida con <strong>modifica prezzo in-line</strong>, anteprima live <strong>Schermo Sposi</strong>, calcolo del <strong>Margine Netto Villa</strong> e filtri per <strong>Fase dell&apos;Evento</strong>.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleResetCatalog}
            style={{
              padding: "0.55rem 1rem",
              background: "#faf8f5",
              color: "#1e1b18",
              border: "1.5px solid #ded7cd",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer"
            }}
          >
            🔄 Ripristina Dati Excel
          </button>

          <button
            type="button"
            onClick={handleAddNew}
            style={{
              padding: "0.55rem 1.2rem",
              background: "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 6px 16px rgba(229,140,44,0.25)"
            }}
          >
            ➕ Nuovo Servizio
          </button>
        </div>
      </div>

      {notice && (
        <div style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "0.8rem 1.2rem", borderRadius: "12px", marginBottom: "1.2rem", fontWeight: 700, fontSize: "0.9rem" }}>
          {notice}
        </div>
      )}

      {/* Bar della Ricerca & Doppi Filtri (Fasi Evento + Categorie) */}
      <div style={{ background: "#ffffff", padding: "1.2rem 1.4rem", borderRadius: "20px", border: "1px solid #e8e2d9", marginBottom: "1.4rem", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
        
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.2rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="🔍 Cerca per CODICE (es. RIC01, EXT12, ANG24), Nome servizio, Fase o Categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "0.65rem 1rem", borderRadius: "12px", border: "1.5px solid #ded7cd", fontSize: "0.92rem", outline: "none" }}
            />
          </div>

          {/* Switch Vista Tabella vs Griglia */}
          <div style={{ display: "flex", background: "#f0ede8", padding: "0.25rem", borderRadius: "12px" }}>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              style={{
                padding: "0.45rem 0.95rem",
                borderRadius: "9px",
                border: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                background: viewMode === "table" ? "#ffffff" : "transparent",
                color: viewMode === "table" ? "#1e1b18" : "#666",
                boxShadow: viewMode === "table" ? "0 2px 6px rgba(0,0,0,0.08)" : "none"
              }}
            >
              📋 Tabella Compatta & Margini
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              style={{
                padding: "0.45rem 0.95rem",
                borderRadius: "9px",
                border: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                background: viewMode === "grid" ? "#ffffff" : "transparent",
                color: viewMode === "grid" ? "#1e1b18" : "#666",
                boxShadow: viewMode === "grid" ? "0 2px 6px rgba(0,0,0,0.08)" : "none"
              }}
            >
              🎴 Schede Foto & Schermo Sposi
            </button>
          </div>
        </div>

        {/* FILTRO 1: FASI DELL'EVENTO */}
        <div style={{ marginBottom: "0.85rem" }}>
          <span style={{ fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#8c857e", display: "block", marginBottom: "0.4rem" }}>
            🎯 FILTRA PER FASE DELL&apos;EVENTO
          </span>
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setSelectedPhase("tutte")}
              style={{
                padding: "0.4rem 0.9rem",
                borderRadius: "14px",
                fontSize: "0.8rem",
                fontWeight: 700,
                border: selectedPhase === "tutte" ? "1.5px solid #1e1b18" : "1px solid #e8e2d9",
                cursor: "pointer",
                background: selectedPhase === "tutte" ? "#1e1b18" : "#ffffff",
                color: selectedPhase === "tutte" ? "#ffffff" : "#44403c"
              }}
            >
              🌟 Tutte le Fasi ({catalog.length})
            </button>

            {phaseKeys.map((pKey) => {
              const cfg = PHASE_CONFIG[pKey];
              const count = catalog.filter((c) => (c.fase_evento || "generale") === pKey).length;
              const isSelected = selectedPhase === pKey;

              return (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => setSelectedPhase(pKey)}
                  style={{
                    padding: "0.4rem 0.9rem",
                    borderRadius: "14px",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    border: isSelected ? `2px solid ${cfg.text}` : `1px solid ${cfg.border}`,
                    cursor: "pointer",
                    background: isSelected ? cfg.bg : "#ffffff",
                    color: cfg.text,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem"
                  }}
                >
                  <span>{cfg.icon}</span> {cfg.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* FILTRO 2: CATEGORIE SERVIZI */}
        <div>
          <span style={{ fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#8c857e", display: "block", marginBottom: "0.4rem" }}>
            📂 FILTRA PER CATEGORIA
          </span>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setSelectedCategory("tutti")}
              style={{
                padding: "0.35rem 0.8rem",
                borderRadius: "12px",
                fontSize: "0.78rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: selectedCategory === "tutti" ? "#e58c2c" : "#faf8f5",
                color: selectedCategory === "tutti" ? "#ffffff" : "#6a6764"
              }}
            >
              Tutte le Categorie
            </button>

            {categories.map((cat) => {
              const count = catalog.filter((c) => c.categoria === cat).length;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "0.35rem 0.8rem",
                    borderRadius: "12px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    background: isSelected ? "#e58c2c" : "#faf8f5",
                    color: isSelected ? "#ffffff" : "#6a6764"
                  }}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* RENDERING 1: VISTA TABELLA COMPATTA CON INLINE EDITING, FASI E MARGINI */}
      {viewMode === "table" ? (
        <div style={{ background: "#ffffff", borderRadius: "20px", border: "1px solid #e8e2d9", boxShadow: "0 6px 20px rgba(0,0,0,0.03)", marginBottom: "2.5rem", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "#faf8f5", borderBottom: "1.5px solid #eee7de", color: "#78716c", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "0.7rem 0.6rem", width: "65px" }}>Codice</th>
                <th style={{ padding: "0.7rem 0.6rem", width: "115px" }}>Fase Evento</th>
                <th style={{ padding: "0.7rem 0.6rem" }}>Nome Servizio & Categoria</th>
                <th style={{ padding: "0.7rem 0.6rem", width: "110px" }} title="Clicca direttamente sul prezzo per modificarlo in-line">
                  Prezzo Listino ✏️
                </th>
                <th style={{ padding: "0.7rem 0.6rem", width: "100px" }}>Costo Forn.</th>
                <th style={{ padding: "0.7rem 0.6rem", width: "125px" }}>Margine Villa</th>
                <th style={{ padding: "0.7rem 0.6rem", width: "80px" }}>Unità</th>
                <th style={{ padding: "0.7rem 0.6rem", width: "145px" }}>Ripartizione</th>
                <th style={{ padding: "0.7rem 0.6rem", textAlign: "right", width: "100px" }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredCatalog.map((s, idx) => {
                const phaseKey: EventPhase = s.fase_evento || "generale";
                const phaseCfg = PHASE_CONFIG[phaseKey] || PHASE_CONFIG.generale;
                const margin = calculateVillaMargin(s.prezzo_unitario, s.costo_fornitore);
                const isEditingThisPrice = inlineEditingId === s.id;

                return (
                  <tr
                    key={s.id || idx}
                    onClick={() => handleEdit(s)}
                    title="Clicca per aprire la scheda di modifica completa"
                    style={{
                      borderBottom: "1px solid #f2ede7",
                      verticalAlign: "middle",
                      cursor: "pointer",
                      transition: "background 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#faf7f2")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    
                    {/* CODICE BADGE */}
                    <td style={{ padding: "0.5rem 0.6rem" }}>
                      <span
                        style={{
                          background: "#1e1b18",
                          color: "#ffffff",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          padding: "0.18rem 0.45rem",
                          borderRadius: "6px",
                          letterSpacing: "0.5px",
                          display: "inline-block"
                        }}
                      >
                        {s.code || s.id.toUpperCase()}
                      </span>
                    </td>

                    {/* BADGE FASE EVENTO */}
                    <td style={{ padding: "0.5rem 0.6rem", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          background: phaseCfg.bg,
                          color: phaseCfg.text,
                          border: `1px solid ${phaseCfg.border}`,
                          padding: "0.18rem 0.5rem",
                          borderRadius: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem"
                        }}
                      >
                        <span>{phaseCfg.icon}</span> {phaseCfg.label}
                      </span>
                    </td>

                    {/* NOME SERVIZIO & CATEGORIA */}
                    <td style={{ padding: "0.5rem 0.6rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <strong style={{ color: "#1e1b18", fontSize: "0.88rem", fontWeight: 700, lineHeight: 1.25 }}>
                          {s.nome}
                        </strong>
                        <span style={{ fontSize: "0.7rem", color: "#a09c96", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {s.categoria}
                        </span>
                      </div>
                    </td>

                    {/* PREZZO LISTINO CON INLINE EDITING INTERATTIVO */}
                    <td
                      style={{ padding: "0.5rem 0.6rem", whiteSpace: "nowrap" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setInlineEditingId(s.id);
                        setInlinePriceValue(s.prezzo_unitario.toString());
                      }}
                      title="Clicca direttamente qui per modificare il prezzo in-line"
                    >
                      {isEditingThisPrice ? (
                        <div
                          style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#e58c2c" }}>€</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            autoFocus
                            value={inlinePriceValue}
                            onChange={(e) => setInlinePriceValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveInlinePrice(s.id);
                              if (e.key === "Escape") setInlineEditingId(null);
                            }}
                            onBlur={() => handleSaveInlinePrice(s.id)}
                            style={{
                              width: "80px",
                              padding: "0.25rem 0.4rem",
                              borderRadius: "6px",
                              border: "2px solid #e58c2c",
                              fontSize: "0.88rem",
                              fontWeight: 800,
                              outline: "none",
                              background: "#fffbeb",
                              color: "#1e1b18"
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            cursor: "text",
                            padding: "0.2rem 0.45rem",
                            borderRadius: "6px",
                            background: "#fffbeb",
                            border: "1px dashed #fcd34d"
                          }}
                        >
                          <strong style={{ fontSize: "0.92rem", color: "#1e1b18", fontFamily: "Georgia, serif" }}>
                            {s.prezzo_unitario > 0 ? `€ ${s.prezzo_unitario.toLocaleString("it-IT")}` : "Da Quotare"}
                          </strong>
                          <span style={{ fontSize: "0.72rem", color: "#b45309" }} title="Modifica rapida">
                            ✏️
                          </span>
                        </div>
                      )}
                    </td>

                    {/* COSTO FORNITORE (ADMIN ONLY) */}
                    <td style={{ padding: "0.5rem 0.6rem", whiteSpace: "nowrap" }}>
                      {s.costo_fornitore && s.costo_fornitore > 0 ? (
                        <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "0.82rem" }}>
                          € {s.costo_fornitore.toLocaleString("it-IT")}
                        </span>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>- Interno</span>
                      )}
                    </td>

                    {/* MARGINE NETTO VILLA (ADMIN ONLY) */}
                    <td style={{ padding: "0.5rem 0.6rem", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <strong style={{ color: "#166534", fontSize: "0.86rem", fontFamily: "Georgia, serif" }}>
                          € {margin.margineNetto.toLocaleString("it-IT")}
                        </strong>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            padding: "0.12rem 0.35rem",
                            borderRadius: "5px",
                            background: margin.marginePercentuale >= 50 ? "#ecfdf5" : "#fff7ed",
                            color: margin.marginePercentuale >= 50 ? "#047857" : "#c2410c"
                          }}
                        >
                          +{margin.marginePercentuale}%
                        </span>
                      </div>
                    </td>

                    {/* UNITÀ MISURA */}
                    <td style={{ padding: "0.5rem 0.6rem", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: s.unita_misura === "pax" ? "#1d4ed8" : "#047857",
                          background: s.unita_misura === "pax" ? "#eff6ff" : "#ecfdf5",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "5px"
                        }}
                      >
                        {s.unitaLabel || (s.unita_misura === "pax" ? "A Persona" : "Fisso")}
                      </span>
                    </td>

                    {/* RIPARTIZIONE ECONOMICA */}
                    <td style={{ padding: "0.5rem 0.6rem" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "#14532d",
                          fontWeight: 700,
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          padding: "0.18rem 0.45rem",
                          borderRadius: "6px",
                          display: "inline-block",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {s.splitLabel === "40% Santo Stefano / 60% Iovino"
                          ? "40% TDA / 60% Iovino"
                          : s.splitLabel === "Da scegliere tramite codice riparto"
                          ? "Da definire"
                          : s.splitLabel}
                      </span>
                    </td>

                    {/* AZIONI: ANTEPRIMA SCHERMO SPOSI + MODIFICA + CESTINO */}
                    <td style={{ padding: "0.5rem 0.6rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "inline-flex", gap: "0.3rem", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewItem(s);
                          }}
                          title="Anteprima Schermo Sposi (Display Villa)"
                          style={{
                            background: "#faf8f5",
                            border: "1.5px solid #e58c2c",
                            color: "#c2410c",
                            padding: "0.3rem 0.5rem",
                            borderRadius: "8px",
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            fontWeight: 700
                          }}
                        >
                          👁️
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(s);
                          }}
                          title="Modifica Servizio e Foto HD"
                          style={{
                            background: "#ffffff",
                            border: "1.5px solid #ded7cd",
                            color: "#1e1b18",
                            padding: "0.3rem 0.5rem",
                            borderRadius: "8px",
                            fontSize: "0.82rem",
                            cursor: "pointer"
                          }}
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(s.id, e)}
                          title="Elimina Servizio"
                          style={{
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#dc2626",
                            padding: "0.3rem 0.5rem",
                            borderRadius: "8px",
                            fontSize: "0.82rem",
                            cursor: "pointer"
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* RENDERING 2: VISTA SCHEDE GRIGLIA FOTO CON BADGE FASI E TASTO SCHERMO SPOSI */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.4rem", marginBottom: "3rem" }}>
          {filteredCatalog.map((s) => {
            const isPax = s.unita_misura === "pax";
            const phaseKey: EventPhase = s.fase_evento || "generale";
            const phaseCfg = PHASE_CONFIG[phaseKey] || PHASE_CONFIG.generale;
            const margin = calculateVillaMargin(s.prezzo_unitario, s.costo_fornitore);

            return (
              <div
                key={s.id}
                onClick={() => handleEdit(s)}
                style={{
                  background: "#ffffff",
                  borderRadius: "20px",
                  border: "1px solid #e8e2d9",
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer"
                }}
              >
                <div>
                  <div
                    style={{
                      height: "160px",
                      backgroundImage: `url('${s.immagine || "https://laterradegliaranci.it/wp-content/uploads/2024/07/sala-terradegliaranci.jpg"}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      position: "relative"
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "0.7rem",
                        left: "0.7rem",
                        background: "#1e1b18",
                        color: "#fff",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        padding: "0.25rem 0.65rem",
                        borderRadius: "8px",
                        letterSpacing: "0.5px"
                      }}
                    >
                      🏷️ {s.code || s.id.toUpperCase()}
                    </span>

                    <span
                      style={{
                        position: "absolute",
                        top: "0.7rem",
                        right: "0.7rem",
                        background: phaseCfg.bg,
                        color: phaseCfg.text,
                        border: `1px solid ${phaseCfg.border}`,
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        padding: "0.25rem 0.65rem",
                        borderRadius: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem"
                      }}
                    >
                      <span>{phaseCfg.icon}</span> {phaseCfg.label}
                    </span>
                  </div>

                  <div style={{ padding: "1.2rem" }}>
                    <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "#e58c2c", fontWeight: 800, display: "block", marginBottom: "0.3rem" }}>
                      {s.categoria}
                    </span>

                    <h3 style={{ fontSize: "1.1rem", color: "#1e1b18", margin: "0 0 0.8rem 0", fontWeight: 700, fontFamily: "Georgia, serif", lineHeight: 1.3 }}>
                      {s.nome}
                    </h3>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", background: "#faf8f5", padding: "0.6rem 0.8rem", borderRadius: "12px", border: "1px solid #eee7de" }}>
                      <span style={{ fontSize: "0.78rem", color: "#78716c", fontWeight: 700 }}>Prezzo Listino</span>
                      <strong style={{ fontSize: "1.2rem", color: "#1e1b18", fontFamily: "Georgia, serif" }}>
                        {s.prezzo_unitario > 0 ? `€ ${s.prezzo_unitario.toLocaleString("it-IT")}` : "Da Quotare"}
                      </strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", background: "#f8fafc", padding: "0.5rem 0.7rem", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.78rem" }}>
                      <span style={{ color: "#64748b" }}>Margine Netto Villa</span>
                      <span style={{ color: "#166534", fontWeight: 800 }}>
                        € {margin.margineNetto.toLocaleString("it-IT")} (+{margin.marginePercentuale}%)
                      </span>
                    </div>

                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.5rem 0.7rem", borderRadius: "10px" }}>
                      <span style={{ fontSize: "0.75rem", color: "#14532d", fontWeight: 700 }}>
                        ⚖️ {s.splitLabel || "40% TDA / 60% Iovino"}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "0.9rem 1.2rem", background: "#faf8f5", borderTop: "1px solid #e8e2d9", display: "flex", gap: "0.5rem", justifyContent: "space-between" }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(s);
                    }}
                    style={{
                      flex: 1,
                      background: "#faf8f5",
                      border: "1.5px solid #e58c2c",
                      color: "#c2410c",
                      padding: "0.5rem 0.6rem",
                      borderRadius: "10px",
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    ✏️ Modifica Servizio
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALE DI MODIFICA SCHEDA SERVIZIO */}
      {editingItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(30, 27, 24, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1.5rem",
            backdropFilter: "blur(4px)"
          }}
          onClick={() => setEditingItem(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "650px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              border: "1px solid #e8e2d9"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", borderBottom: "1px solid #eee7de", paddingBottom: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#e58c2c" }}>
                  SCHEDA SERVIZIO • LISTINO 2026
                </span>
                <h2 style={{ margin: "0.2rem 0 0 0", color: "#1e1b18", fontSize: "1.4rem", fontFamily: "Georgia, serif" }}>
                  {editingItem.code ? `[${editingItem.code}] ` : ""}{editingItem.nome}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{ background: "#f5f2eb", border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "1.1rem", fontWeight: "bold", color: "#666" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#444", marginBottom: "0.3rem" }}>
                  Nome Servizio *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.nome}
                  onChange={(e) => setEditingItem({ ...editingItem, nome: e.target.value })}
                  style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1.5px solid #ded7cd", fontSize: "0.95rem", outline: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#444", marginBottom: "0.3rem" }}>
                    Prezzo al Pubblico (€) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingItem.prezzo_unitario}
                    onChange={(e) => setEditingItem({ ...editingItem, prezzo_unitario: parseFloat(e.target.value) || 0 })}
                    style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1.5px solid #ded7cd", fontSize: "1rem", fontWeight: "bold", color: "#1e1b18" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#444", marginBottom: "0.3rem" }}>
                    Costo Fornitore Stimato (€)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingItem.costo_fornitore || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, costo_fornitore: parseFloat(e.target.value) || 0 })}
                    style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1.5px solid #ded7cd", fontSize: "1rem", color: "#64748b" }}
                  />
                </div>
              </div>

              {/* Box Margine Netto Villa */}
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.8rem 1rem", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#166534" }}>Margine Netto per La Terra degli Aranci:</span>
                <strong style={{ fontSize: "1.1rem", color: "#15803d" }}>
                  € {Math.max(0, (editingItem.prezzo_unitario || 0) - (editingItem.costo_fornitore || 0)).toLocaleString("it-IT")}
                </strong>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#444", marginBottom: "0.3rem" }}>
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={editingItem.categoria}
                    onChange={(e) => setEditingItem({ ...editingItem, categoria: e.target.value })}
                    style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1.5px solid #ded7cd", fontSize: "0.9rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#444", marginBottom: "0.3rem" }}>
                    Fase dell'Evento
                  </label>
                  <select
                    value={editingItem.fase_evento || "generale"}
                    onChange={(e) => setEditingItem({ ...editingItem, fase_evento: e.target.value as EventPhase })}
                    style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1.5px solid #ded7cd", fontSize: "0.9rem", background: "#fff" }}
                  >
                    <option value="agrumeto">🌿 Agrumeto (Accoglienza)</option>
                    <option value="rito">💍 Rito Simbolico</option>
                    <option value="sala_tufo">🏛️ Sala Tufo (Pranzo/Cena)</option>
                    <option value="torta">🎂 Taglio Torta</option>
                    <option value="after_party">🎉 After Party / Dopocena</option>
                    <option value="generale">✨ Generale / Tutta la Villa</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#444", marginBottom: "0.3rem" }}>
                  Descrizione Estesa
                </label>
                <textarea
                  rows={3}
                  value={editingItem.descrizione || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, descrizione: e.target.value })}
                  style={{ width: "100%", padding: "0.7rem", borderRadius: "10px", border: "1.5px solid #ded7cd", fontSize: "0.9rem", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#444", marginBottom: "0.3rem" }}>
                  Foto HD per Schermo Sposi
                </label>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <input
                    type="text"
                    value={editingItem.immagine || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, immagine: e.target.value })}
                    placeholder="URL immagine HD..."
                    style={{ flex: 1, padding: "0.7rem", borderRadius: "10px", border: "1.5px solid #ded7cd", fontSize: "0.85rem" }}
                  />
                  <button
                    type="button"
                    onClick={handleOpenMediaPicker}
                    style={{ padding: "0.7rem 1rem", background: "#faf8f5", border: "1.5px solid #e58c2c", color: "#c2410c", borderRadius: "10px", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    🖼️ Libreria WP
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.8rem", marginTop: "1rem", borderTop: "1px solid #eee7de", paddingTop: "1.2rem" }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  style={{ padding: "0.7rem 1.4rem", background: "#f5f2eb", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", color: "#555" }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  style={{ padding: "0.7rem 1.8rem", background: "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)", border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "0.9rem", color: "#fff", cursor: "pointer", boxShadow: "0 4px 14px rgba(229,140,44,0.3)" }}
                >
                  💾 Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE MEDIA LIBRARY WORDPRESS */}
      {isMediaModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "1.5rem"
          }}
          onClick={() => setIsMediaModalOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "1.8rem",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
              <h3 style={{ margin: 0, color: "#1e1b18", fontSize: "1.3rem", fontFamily: "Georgia, serif" }}>
                🖼️ Seleziona Foto da WordPress Media Library
              </h3>
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(false)}
                style={{ background: "#eee", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.8rem", maxHeight: "55vh", overflowY: "auto", padding: "0.5rem" }}>
              {mediaItems.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelectMedia(m)}
                  style={{ borderRadius: "12px", overflow: "hidden", border: "2px solid #eee", cursor: "pointer", transition: "transform 0.15s ease", textAlign: "center" }}
                >
                  <img src={m.thumbnail || m.url} alt={m.title} style={{ width: "100%", height: "100px", objectFit: "cover" }} />
                  <div style={{ padding: "0.4rem", fontSize: "0.72rem", color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
