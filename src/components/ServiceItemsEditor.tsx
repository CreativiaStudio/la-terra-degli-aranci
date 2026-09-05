"use client";

import { useState } from "react";
import { SERVICES_CATALOG } from "@/lib/servicesCatalog";

export interface ServiceItem {
  id: string | number;
  descrizione: string;
  quantita: number;
  prezzo_unitario: number;
}

interface ServiceItemsEditorProps {
  items: any[]; // accetta sia la forma persistita {prezzo_unitario} che quella legacy {prezzo}
  numeroOspiti: number;
  onNumeroOspitiChange?: (n: number) => void;
  onChange: (items: ServiceItem[]) => void;
  readOnly?: boolean;
  // Modalità cliente: si possono solo aggiungere voci dal catalogo (prezzo fisso) o
  // rimuoverle, mai modificarne descrizione/prezzo o crearne di personalizzate.
  restrictToCatalog?: boolean;
}

function normalizeItems(items: any[]): ServiceItem[] {
  return (items || []).map((item, idx) => ({
    id: item.id ?? `${Date.now()}-${idx}`,
    descrizione: item.descrizione || "",
    quantita: item.quantita ?? 1,
    prezzo_unitario: Number(item.prezzo_unitario !== undefined ? item.prezzo_unitario : item.prezzo) || 0
  }));
}

const inputStyle = { width: "100%", padding: "0.8rem", border: "1px solid #e0ddd9", borderRadius: "8px", boxSizing: "border-box" as const, marginBottom: "0.8rem" };
const labelStyle = { display: "block", marginBottom: "0.4rem", fontWeight: "600", color: "#333", fontSize: "0.95rem" };

export default function ServiceItemsEditor({ items: initialItems, numeroOspiti, onNumeroOspitiChange, onChange, readOnly = false, restrictToCatalog = false }: ServiceItemsEditorProps) {
  const [items, setItems] = useState<ServiceItem[]>(() => normalizeItems(initialItems));
  // Le voci presenti all'apertura dell'editor: tutto ciò che non è in questo set è
  // stato appena aggiunto in questa sessione e va evidenziato.
  const [initialIds] = useState<Set<string | number>>(() => new Set(items.map(i => i.id)));

  const emit = (next: ServiceItem[]) => {
    setItems(next);
    onChange(next);
  };

  const addCatalogItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;
    const catItem = SERVICES_CATALOG.find(i => i.id === selectedId);
    if (catItem) {
      const prezzoCalcolato = catItem.unita_misura === 'pax'
        ? catItem.prezzo_unitario * (numeroOspiti || 1)
        : catItem.prezzo_unitario;

      emit([{
        id: `${Date.now()}-${Math.random()}`,
        descrizione: catItem.descrizione,
        quantita: 1,
        prezzo_unitario: prezzoCalcolato
      }, ...items]);
    }
    e.target.value = "";
  };

  const addCustomItem = () => {
    emit([{ id: `${Date.now()}-${Math.random()}`, descrizione: "", quantita: 1, prezzo_unitario: 0 }, ...items]);
  };

  const updateItem = (id: string | number, field: 'descrizione' | 'prezzo_unitario', value: any) => {
    emit(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string | number) => {
    emit(items.filter(item => item.id !== id));
  };

  const lockDetails = readOnly || restrictToCatalog;

  return (
    <div>
      {!readOnly && (
        <>
          {onNumeroOspitiChange && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Numero Indicativo Ospiti (Pax)</label>
              <input
                type="number"
                min="1"
                style={{ ...inputStyle, maxWidth: "220px" }}
                value={numeroOspiti}
                onChange={e => onNumeroOspitiChange(parseInt(e.target.value) || 1)}
                placeholder="Es. 100"
              />
            </div>
          )}

          {/* Selettore da Catalogo Ufficiale */}
          <div style={{ background: "#faf8f5", padding: "1.2rem", borderRadius: "10px", border: "1px solid #e0ddd9", marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.6rem", fontWeight: "bold", fontSize: "0.95rem", color: "#514d48" }}>
              ✨ Seleziona Servizio dal Catalogo TDA:
            </label>
            <select onChange={addCatalogItem} style={{ ...inputStyle, marginBottom: 0, background: "white" }} defaultValue="">
              <option value="" disabled>-- Seleziona un servizio dal catalogo --</option>
              {SERVICES_CATALOG.map(item => (
                <option key={item.id} value={item.id}>
                  [{item.categoria}] {item.descrizione} {item.unita_misura === 'pax' ? `(€${item.prezzo_unitario}/persona)` : `(€${item.prezzo_unitario} fisso)`}
                </option>
              ))}
            </select>
          </div>

          {!restrictToCatalog && (
            <div style={{ textAlign: "right", marginBottom: "1rem" }}>
              <button type="button" onClick={addCustomItem} style={{ background: "#f0eee9", border: "1px solid #ddd", padding: "0.6rem 1.2rem", borderRadius: "6px", cursor: "pointer", fontWeight: "600", color: "#333", fontSize: "0.9rem" }}>
                + Aggiungi Voce Personalizzata
              </button>
            </div>
          )}
        </>
      )}

      {/* Elenco Servizi */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {items.map((item, index) => {
          const isNew = !initialIds.has(item.id);
          return (
            <div
              key={item.id}
              style={{
                background: isNew ? "#f0fdf4" : "#faf8f5",
                border: isNew ? "2px solid #16a34a" : "1px solid #e9ecef",
                borderRadius: "10px",
                padding: "1.2rem",
                display: "grid",
                gridTemplateColumns: readOnly ? "1fr auto" : "1fr auto auto",
                gap: "1.2rem",
                alignItems: "center",
                position: "relative"
              }}
            >
              {/* Descrizione Servizio */}
              <div>
                <label style={{ ...labelStyle, fontSize: "0.85rem", color: "#666", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  Servizio #{index + 1}
                  {isNew && (
                    <span style={{ background: "#16a34a", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      ✨ Nuovo
                    </span>
                  )}
                </label>
                {lockDetails ? (
                  <div style={{ fontWeight: 500, color: "#333" }}>{item.descrizione}</div>
                ) : (
                  <input
                    type="text"
                    required
                    value={item.descrizione}
                    onChange={e => updateItem(item.id, 'descrizione', e.target.value)}
                    style={{ ...inputStyle, marginBottom: 0, background: "white" }}
                    placeholder="Es. Show Cooking Caciocavallo Impiccato sulla Brace"
                  />
                )}
              </div>

              {/* Prezzo Fisso / Totale Concordato del Servizio */}
              <div style={{ minWidth: "160px" }}>
                <label style={{ ...labelStyle, fontSize: "0.85rem", color: "#666" }}>Prezzo Servizio (€)</label>
                {lockDetails ? (
                  <div style={{ fontWeight: "bold", fontSize: "1.1rem", color: "#514d48" }}>€ {item.prezzo_unitario.toLocaleString('it-IT')}</div>
                ) : (
                  <input
                    type="number"
                    min="0"
                    value={item.prezzo_unitario}
                    onChange={e => updateItem(item.id, 'prezzo_unitario', parseFloat(e.target.value) || 0)}
                    style={{ ...inputStyle, marginBottom: 0, fontWeight: "bold", fontSize: "1.1rem", color: "#514d48", background: "white" }}
                  />
                )}
              </div>

              {/* Tasto Elimina */}
              {!readOnly && (
                <div style={{ paddingTop: "1.2rem" }}>
                  <button type="button" onClick={() => removeItem(item.id)} title="Elimina questa voce" style={{ background: "#fee", border: "1px solid #fcc", color: "#d93838", cursor: "pointer", fontSize: "1.2rem", fontWeight: "bold", padding: "0.5rem 0.8rem", borderRadius: "6px" }}>
                    ×
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
