"use client";

import { useState } from "react";
import { createQuote } from "../actions";
import { useRouter } from "next/navigation";

export default function PreventivoForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stato Cliente
  const [cliente, setCliente] = useState({ nome: "", cognome: "", email: "", telefono: "", codice_fiscale: "" });
  
  // Stato Preventivo
  const [tipoEvento, setTipoEvento] = useState("wedding");
  const [dataEvento, setDataEvento] = useState("");
  const [scontoFisso, setScontoFisso] = useState(0);

  // Prodotti / Servizi
  const [items, setItems] = useState([{ id: Date.now(), descrizione: "Affitto Location e Menu Base", quantita: 1, prezzo_unitario: 120 }]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), descrizione: "", quantita: 1, prezzo_unitario: 0 }]);
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Calcolo Totale
  const totaleCalcolato = items.reduce((acc, item) => acc + (item.quantita * item.prezzo_unitario), 0) - scontoFisso;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = {
      cliente,
      tipo_evento: tipoEvento,
      data_evento: dataEvento,
      items,
      sconto_fisso: scontoFisso,
      totale_calcolato: totaleCalcolato > 0 ? totaleCalcolato : 0
    };

    const res = await createQuote(formData);
    
    if (res.success) {
      alert("Preventivo salvato e generato con successo!");
      router.push("/admin/preventivi");
    } else {
      setError(res.error || "Errore sconosciuto");
      setLoading(false);
    }
  };

  const inputStyle = { width: "100%", padding: "0.8rem", border: "1px solid var(--border-color)", borderRadius: "8px", boxSizing: "border-box" as const, marginBottom: "1rem" };
  const labelStyle = { display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#333" };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
      {/* Colonna Sinistra: Anagrafica e Dettagli */}
      <div>
        <div className="premium-card" style={{ marginBottom: "2rem" }}>
          <h2 style={{ borderBottom: "2px solid var(--primary-color)", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>Dati Cliente</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Nome *</label>
              <input type="text" style={inputStyle} required value={cliente.nome} onChange={e => setCliente({...cliente, nome: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Cognome *</label>
              <input type="text" style={inputStyle} required value={cliente.cognome} onChange={e => setCliente({...cliente, cognome: e.target.value})} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" style={inputStyle} value={cliente.email} onChange={e => setCliente({...cliente, email: e.target.value})} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Telefono</label>
              <input type="tel" style={inputStyle} value={cliente.telefono} onChange={e => setCliente({...cliente, telefono: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Codice Fiscale / P.IVA</label>
              <input type="text" style={inputStyle} value={cliente.codice_fiscale} onChange={e => setCliente({...cliente, codice_fiscale: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="premium-card">
          <h2 style={{ borderBottom: "2px solid var(--primary-color)", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>Dettagli Evento</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Tipologia *</label>
              <select style={inputStyle} value={tipoEvento} onChange={e => setTipoEvento(e.target.value)}>
                <option value="wedding">Wedding (Matrimonio)</option>
                <option value="eventi">Eventi Privati / Aziendali</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Data Evento</label>
              <input type="date" style={inputStyle} value={dataEvento} onChange={e => setDataEvento(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Colonna Destra: Prodotti e Totale */}
      <div>
        <div className="premium-card" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "2px solid var(--primary-color)", paddingBottom: "0.5rem" }}>
            <h2 style={{ margin: 0 }}>Servizi e Prodotti</h2>
            <button type="button" onClick={addItem} style={{ background: "#e9ecef", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>+ Aggiungi Voce</button>
          </div>
          
          {items.map((item, index) => (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "10px", alignItems: "center", marginBottom: "1rem", background: "#f8f9fa", padding: "10px", borderRadius: "8px" }}>
              <div>
                <small style={{display: "block", color:"#666", marginBottom:"3px"}}>Descrizione</small>
                <input type="text" required value={item.descrizione} onChange={e => updateItem(item.id, 'descrizione', e.target.value)} style={{width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px"}} placeholder="Es. Angolo Cubano" />
              </div>
              <div>
                <small style={{display: "block", color:"#666", marginBottom:"3px"}}>Quantità (Pax)</small>
                <input type="number" min="1" value={item.quantita} onChange={e => updateItem(item.id, 'quantita', parseInt(e.target.value))} style={{width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px"}} />
              </div>
              <div>
                <small style={{display: "block", color:"#666", marginBottom:"3px"}}>Prezzo Cad. (€)</small>
                <input type="number" min="0" value={item.prezzo_unitario} onChange={e => updateItem(item.id, 'prezzo_unitario', parseFloat(e.target.value))} style={{width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px"}} />
              </div>
              <div style={{ paddingTop: "20px" }}>
                <button type="button" onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontSize: "1.2rem", padding: "0.5rem" }}>×</button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: "2rem", borderTop: "1px solid #ddd", paddingTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "1rem", gap: "1rem" }}>
              <strong style={{ color: "#666" }}>Sconto Applicato (€):</strong>
              <input type="number" min="0" value={scontoFisso} onChange={e => setScontoFisso(parseFloat(e.target.value) || 0)} style={{ padding: "0.5rem", border: "1px solid #ddd", borderRadius: "4px", width: "100px", textAlign: "right" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--primary-color)", color: "white", padding: "1.5rem", borderRadius: "8px", fontSize: "1.5rem", fontWeight: "bold" }}>
              <span>TOTALE:</span>
              <span>€ {totaleCalcolato > 0 ? totaleCalcolato.toLocaleString('it-IT') : 0}</span>
            </div>
          </div>
        </div>

        {error && <div style={{ color: "var(--error)", padding: "1rem", background: "#fee", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}

        <button type="submit" disabled={loading} style={{
          width: "100%",
          padding: "1.2rem",
          background: "#333",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "1.2rem",
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
        }}>
          {loading ? "Salvataggio in corso..." : "💾 Salva e Genera Link Preventivo"}
        </button>
      </div>
    </form>
  );
}
