"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  SERVICES_CATALOG,
  ServiceCatalogItem,
  calculateVillaMargin,
} from "@/lib/servicesCatalog";
import {
  calculateWeddingSimulation,
  WeddingSimulationInput,
  SimulationExtraItem,
  SANTO_STEFANO_CORP,
  IOVINO_CORP,
} from "@/lib/fiscalCalculator";

export default function SimulatoreClient() {
  const [adults, setAdults] = useState<number>(110);
  const [children, setChildren] = useState<number>(10);
  const [menuType, setMenuType] = useState<"base" | "mandarancio" | "arancio">("base");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("tutte");
  const [selectedServices, setSelectedServices] = useState<{ item: ServiceCatalogItem; qty: number }[]>([
    { item: SERVICES_CATALOG.find((s) => s.code === "EXT01") || SERVICES_CATALOG[5], qty: 1 },
    { item: SERVICES_CATALOG.find((s) => s.code === "ANG01") || SERVICES_CATALOG[20], qty: 1 },
  ]);

  // Estrai categorie uniche dai 129 servizi
  const categories = useMemo(() => {
    const set = new Set(SERVICES_CATALOG.map((s) => s.categoria));
    return Array.from(set);
  }, []);

  // Filtra catalogo per ricerca e categoria
  const filteredCatalog = useMemo(() => {
    return SERVICES_CATALOG.filter((s) => {
      if (selectedCategory !== "tutte" && s.categoria !== selectedCategory) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          s.nome.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.descrizione.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  const toggleService = (item: ServiceCatalogItem) => {
    setSelectedServices((prev) => {
      const idx = prev.findIndex((p) => p.item.code === item.code);
      if (idx >= 0) {
        return prev.filter((p) => p.item.code !== item.code);
      } else {
        return [...prev, { item, qty: 1 }];
      }
    });
  };

  const updateQuantity = (code: string, delta: number) => {
    setSelectedServices((prev) =>
      prev
        .map((p) => {
          if (p.item.code === code) {
            const next = Math.max(1, p.qty + delta);
            return { ...p, qty: next };
          }
          return p;
        })
        .filter((p) => p.qty > 0)
    );
  };

  // Converti per il motore di calcolo
  const simulationInput: WeddingSimulationInput = useMemo(() => {
    const extras: SimulationExtraItem[] = selectedServices.map(({ item, qty }) => ({
      id: item.code,
      code: item.code,
      nome: item.nome,
      prezzo_unitario: item.prezzo_unitario,
      quantita: qty,
      splitKey: item.splitKey,
      splitLabel: item.splitLabel,
    }));

    return {
      adultsCount: adults,
      childrenCount: children,
      menuType,
      extras,
    };
  }, [adults, children, menuType, selectedServices]);

  const simulation = useMemo(() => {
    return calculateWeddingSimulation(simulationInput);
  }, [simulationInput]);

  // Calcolo margini totali sui servizi extra
  const totalMarginInfo = useMemo(() => {
    let totMargin = 0;
    let totExtrasRevenue = 0;
    selectedServices.forEach(({ item, qty }) => {
      const price = item.prezzo_unitario * qty;
      const margin = calculateVillaMargin(price, (item.costo_fornitore || 0) * qty);
      totMargin += margin.margineNetto;
      totExtrasRevenue += price;
    });
    const perc = totExtrasRevenue > 0 ? Math.round((totMargin / totExtrasRevenue) * 100) : 0;
    return { totMargin, totExtrasRevenue, perc };
  }, [selectedServices]);

  return (
    <div style={{ maxWidth: "1350px", margin: "0 auto", fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <span
          style={{
            textTransform: "uppercase",
            letterSpacing: "2px",
            fontSize: "0.85rem",
            color: "#e58c2c",
            fontWeight: "bold",
          }}
        >
          SUITE DIREZIONALE & PRICING
        </span>
        <h1
          style={{
            margin: "0.3rem 0 0 0",
            color: "#514d48",
            fontSize: "2.2rem",
            fontFamily: "serif",
          }}
        >
          🧮 Simulatore Preventivi, Split & Margini TDA
        </h1>
        <p style={{ margin: 0, color: "#777" }}>
          Simula in tempo reale la sostenibilità economica, i margini e la ripartizione fiscale (Santo Stefano 40% / Iovino Banqueting 60%) sui <strong>129 servizi ufficiali</strong>.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: "2rem", alignItems: "start" }}>
        {/* Colonna Sinistra: Configurazione & Catalogo 129 */}
        <div>
          {/* Card Parametri Ricevimento Base */}
          <div className="premium-card" style={{ padding: "1.8rem", marginBottom: "2rem" }}>
            <h3 style={{ margin: "0 0 1.2rem 0", color: "#1e1b18", fontSize: "1.25rem" }}>
              👥 Parametri Ricevimento & Minimo Garantito
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.2rem" }}>
              {/* Invitati Adulti */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Numero Adulti (min. 70 pax)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="number"
                    min={70}
                    max={250}
                    value={adults}
                    onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 70))}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: "#1e1b18",
                    }}
                  />
                </div>
                <small style={{ color: adults >= 100 ? "#16a34a" : "#b45309", display: "block", marginTop: "4px" }}>
                  {adults >= 100 ? "Tariffa standard: €130/pax" : "Tariffa scaglione 70-99: €140/pax"}
                </small>
              </div>

              {/* Bambini */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Numero Bambini (€50/cad)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={children}
                  onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "#1e1b18",
                  }}
                />
                <small style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
                  Menù dedicato bimbi + animazione
                </small>
              </div>

              {/* Menu Tier */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Variante Menù Gastronomico
                </label>
                <select
                  value={menuType}
                  onChange={(e) => setMenuType(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "#1e1b18",
                    background: "#fff",
                  }}
                >
                  <option value="base">Menù Base Standard (Incluso)</option>
                  <option value="mandarancio">Menù Mandarancio (+€10/pax)</option>
                  <option value="arancio">Menù Arancio Luxury (+€20/pax)</option>
                </select>
                <small style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
                  Cucina interna Iovino Banqueting
                </small>
              </div>
            </div>
          </div>

          {/* Catalogo dei 129 Servizi Ufficiali */}
          <div className="premium-card" style={{ padding: "1.8rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.8rem" }}>
              <div>
                <h3 style={{ margin: 0, color: "#1e1b18", fontSize: "1.25rem" }}>
                  ✨ Catalogo Ufficiale (129 Servizi TDA 2026)
                </h3>
                <small style={{ color: "#64748b" }}>
                  Seleziona servizi extra, show cooking e allestimenti da includere nella simulazione
                </small>
              </div>

              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="🔍 Cerca per codice o nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: "0.5rem 0.8rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
                    width: "200px",
                  }}
                />

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    padding: "0.5rem 0.8rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    background: "#fff",
                  }}
                >
                  <option value="tutte">Tutte le Categorie ({SERVICES_CATALOG.length})</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista Servizi Selezionabili */}
            <div style={{ maxHeight: "420px", overflowY: "auto", border: "1px solid #f1f5f9", borderRadius: "10px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 2 }}>
                  <tr style={{ textAlign: "left", color: "#64748b", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "0.6rem 0.8rem" }}>Azione</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>Codice</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>Servizio</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>Categoria</th>
                    <th style={{ padding: "0.6rem 0.8rem", textAlign: "right" }}>Prezzo Unit.</th>
                    <th style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>Split Fiscale</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalog.map((item) => {
                    const isSelected = selectedServices.some((s) => s.item.code === item.code);
                    return (
                      <tr
                        key={item.code}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: isSelected ? "#fffbeb" : "transparent",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleService(item)}
                      >
                        <td style={{ padding: "0.6rem 0.8rem" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ padding: "0.6rem 0.8rem", fontWeight: 700, color: "#ea580c" }}>
                          {item.code}
                        </td>
                        <td style={{ padding: "0.6rem 0.8rem" }}>
                          <strong style={{ color: "#1e1b18" }}>{item.nome}</strong>
                          {item.fase_evento && (
                            <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block" }}>
                              Fase: {item.fase_evento}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "0.6rem 0.8rem", color: "#64748b", fontSize: "0.8rem" }}>
                          {item.categoria}
                        </td>
                        <td style={{ padding: "0.6rem 0.8rem", textAlign: "right", fontWeight: 700, color: "#1e1b18" }}>
                          € {item.prezzo_unitario.toLocaleString("it-IT")}
                        </td>
                        <td style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              padding: "0.2rem 0.5rem",
                              borderRadius: "6px",
                              background: item.splitKey === "40_60" ? "#e0e7ff" : "#fef3c7",
                              color: item.splitKey === "40_60" ? "#3730a3" : "#92400e",
                            }}
                          >
                            {item.splitLabel || item.splitKey}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Servizi Selezionati con Quantità */}
            {selectedServices.length > 0 && (
              <div style={{ marginTop: "1.5rem", borderTop: "2px solid #f1f5f9", paddingTop: "1rem" }}>
                <h4 style={{ margin: "0 0 0.8rem 0", color: "#1e1b18" }}>
                  ✨ Servizi Extra Selezionati ({selectedServices.length})
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {selectedServices.map(({ item, qty }) => (
                    <div
                      key={item.code}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.6rem 1rem",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                        <span style={{ fontWeight: 700, color: "#ea580c" }}>{item.code}</span>
                        <span style={{ fontWeight: 600, color: "#1e1b18" }}>{item.nome}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.code, -1);
                            }}
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "4px",
                              border: "1px solid #cbd5e1",
                              background: "#fff",
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: "20px", textAlign: "center", fontWeight: 700 }}>
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.code, 1);
                            }}
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "4px",
                              border: "1px solid #cbd5e1",
                              background: "#fff",
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            +
                          </button>
                        </div>

                        <strong style={{ minWidth: "90px", textAlign: "right", color: "#1e1b18" }}>
                          € {(item.prezzo_unitario * qty).toLocaleString("it-IT")}
                        </strong>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleService(item);
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Colonna Destra: Quadro Economico & Ripartizione Fiscale */}
        <div style={{ position: "sticky", top: "1.5rem" }}>
          <div
            className="premium-card"
            style={{
              padding: "2rem",
              background: "linear-gradient(180deg, #ffffff 0%, #fffbf5 100%)",
              border: "2px solid #ea580c",
            }}
          >
            <span
              style={{
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                fontSize: "0.75rem",
                color: "#ea580c",
                fontWeight: 800,
                display: "block",
                marginBottom: "0.3rem",
              }}
            >
              RISULTATO SIMULAZIONE
            </span>
            <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1e1b18", lineHeight: 1.1 }}>
              € {simulation.grandTotal.toLocaleString("it-IT")}
            </div>
            <small style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
              Totale Complessivo Stimato (IVA inclusa)
            </small>

            {/* Dettaglio Ricevimento vs Extra */}
            <div style={{ borderTop: "1px solid #fed7aa", marginTop: "1.2rem", paddingTop: "1rem", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: "#64748b" }}>Ricevimento Base ({adults} pax + {children} bimbi)</span>
                <strong>€ {simulation.receptionTotal.toLocaleString("it-IT")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: "#64748b" }}>Servizi Extra ({selectedServices.length} voci)</span>
                <strong>€ {simulation.extrasTotal.toLocaleString("it-IT")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", color: "#16a34a" }}>
                <span>Margine Netto Villa su Extra</span>
                <strong>€ {totalMarginInfo.totMargin.toLocaleString("it-IT")} ({totalMarginInfo.perc}%)</strong>
              </div>
            </div>

            {/* Split Societario Santo Stefano vs Iovino */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #fed7aa",
                padding: "1rem",
                marginTop: "1.2rem",
              }}
            >
              <h4 style={{ margin: "0 0 0.6rem 0", color: "#1e1b18", fontSize: "0.95rem" }}>
                🏛️ Ripartizione Fiscale Societaria
              </h4>

              <div style={{ marginBottom: "0.6rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#c2410c", fontWeight: 700 }}>
                  <span>{SANTO_STEFANO_CORP.ragioneSociale}</span>
                  <span>€ {simulation.ssTot.toLocaleString("it-IT")}</span>
                </div>
                <small style={{ color: "#78716c", display: "block" }}>
                  Imponibile € {Math.round(simulation.ssTot - simulation.ssIva).toLocaleString("it-IT")} + IVA 22% (€ {simulation.ssIva.toLocaleString("it-IT")})
                </small>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#15803d", fontWeight: 700 }}>
                  <span>{IOVINO_CORP.ragioneSociale}</span>
                  <span>€ {simulation.iovTot.toLocaleString("it-IT")}</span>
                </div>
                <small style={{ color: "#78716c", display: "block" }}>
                  Imponibile € {Math.round(simulation.iovTot - simulation.iovIva).toLocaleString("it-IT")} + IVA 10% (€ {simulation.iovIva.toLocaleString("it-IT")})
                </small>
              </div>
            </div>

            {/* Piano Acconti Ufficiale TDA */}
            <div
              style={{
                background: "#fffaf0",
                borderRadius: "12px",
                border: "1px solid #fde68a",
                padding: "1rem",
                marginTop: "1.2rem",
                fontSize: "0.85rem",
              }}
            >
              <h4 style={{ margin: "0 0 0.6rem 0", color: "#92400e" }}>
                📅 Piano Acconti Ufficiale TDA
              </h4>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <span>1° Acconto (Firma - Santo Stefano)</span>
                <strong>€ {simulation.deposits.firstDepositSS.toLocaleString("it-IT")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <span>2° Acconto (-6 Mesi - Iovino)</span>
                <strong>€ {simulation.deposits.secondDepositIovino.toLocaleString("it-IT")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#0284c7", fontWeight: 700, borderTop: "1px dashed #fde68a", paddingTop: "0.3rem" }}>
                <span>Saldo Finale (10-15gg)</span>
                <span>€ {simulation.deposits.finalBalanceTotal.toLocaleString("it-IT")}</span>
              </div>
              <small style={{ color: "#78350f", display: "block", marginTop: "4px" }}>
                Residuo SS: € {simulation.deposits.finalBalanceSS.toLocaleString("it-IT")} • Residuo Iovino: € {simulation.deposits.finalBalanceIovino.toLocaleString("it-IT")}
              </small>
            </div>

            {/* Bottone Crea Preventivo */}
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/admin/preventivi/nuovo">
                <button
                  type="button"
                  style={{
                    width: "100%",
                    padding: "0.85rem",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)",
                  }}
                >
                  📝 Crea Preventivo Ufficiale da Questa Simulazione
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
