"use client";

import { useState } from "react";
import { createQuote } from "../actions";
import { useRouter } from "next/navigation";
import ServiceItemsEditor, { ServiceItem } from "@/components/ServiceItemsEditor";

export default function PreventivoForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stato Cliente
  const [cliente, setCliente] = useState({ nome: "", cognome: "", email: "", telefono: "", codice_fiscale: "" });
  
  // Stato Preventivo
  const [tipoEvento, setTipoEvento] = useState("wedding");
  const [dataEvento, setDataEvento] = useState("");
  const [numeroOspiti, setNumeroOspiti] = useState(100);
  const [scontoFisso, setScontoFisso] = useState(0);

  // Prodotti / Servizi
  const [items, setItems] = useState<ServiceItem[]>([
    { id: Date.now(), descrizione: "Affitto Villa in Esclusiva & Menu Wedding Base", quantita: 1, prezzo_unitario: 14000 }
  ]);

  // Calcolo Totale
  const totaleServizi = items.reduce((acc, item) => acc + (Number(item.prezzo_unitario) || 0), 0);
  const totaleCalcolato = totaleServizi - scontoFisso;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = {
      cliente,
      tipo_evento: tipoEvento,
      data_evento: dataEvento,
      numero_ospiti: numeroOspiti,
      items,
      sconto_fisso: scontoFisso,
      totale_calcolato: totaleCalcolato > 0 ? totaleCalcolato : 0
    };

    const res = await createQuote(formData);
    
    if (res.success) {
      alert("Preventivo salvato e generato con successo!");
      router.push("/admin/preventivi");
    } else {
      setError((res as any).error || "Errore sconosciuto durante il salvataggio");
      setLoading(false);
    }
  };

  const inputStyle = { width: "100%", padding: "0.8rem", border: "1px solid #e0ddd9", borderRadius: "8px", boxSizing: "border-box" as const, marginBottom: "0.8rem" };
  const labelStyle = { display: "block", marginBottom: "0.4rem", fontWeight: "600", color: "#333", fontSize: "0.95rem" };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "850px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* 1. Dati Cliente */}
      <div className="premium-card" style={{ padding: "2rem" }}>
        <h2 style={{ borderBottom: "2px solid #e58c2c", paddingBottom: "0.5rem", marginBottom: "1.5rem", color: "#e58c2c" }}>
          1. Dati Cliente
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Nome *</label>
            <input type="text" style={inputStyle} required value={cliente.nome} onChange={e => setCliente({...cliente, nome: e.target.value})} placeholder="Es. Roberto" />
          </div>
          <div>
            <label style={labelStyle}>Cognome *</label>
            <input type="text" style={inputStyle} required value={cliente.cognome} onChange={e => setCliente({...cliente, cognome: e.target.value})} placeholder="Es. Rossi" />
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Email Cliente</label>
            <input type="email" style={inputStyle} value={cliente.email} onChange={e => setCliente({...cliente, email: e.target.value})} placeholder="sposi@email.com" />
          </div>
          <div>
            <label style={labelStyle}>Telefono / WhatsApp</label>
            <input type="tel" style={inputStyle} value={cliente.telefono} onChange={e => setCliente({...cliente, telefono: e.target.value})} placeholder="+39 333 0000000" />
          </div>
        </div>
        
        <div>
          <label style={labelStyle}>Codice Fiscale / P.IVA</label>
          <input type="text" style={inputStyle} value={cliente.codice_fiscale} onChange={e => setCliente({...cliente, codice_fiscale: e.target.value})} placeholder="RSSRBT80A01F839X" />
        </div>
      </div>

      {/* 2. Dettagli Evento */}
      <div className="premium-card" style={{ padding: "2rem" }}>
        <h2 style={{ borderBottom: "2px solid #e58c2c", paddingBottom: "0.5rem", marginBottom: "1.5rem", color: "#e58c2c" }}>
          2. Dettagli Evento
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Tipologia Evento *</label>
            <select style={inputStyle} value={tipoEvento} onChange={e => setTipoEvento(e.target.value)}>
              <option value="wedding">💍 Wedding (Matrimonio)</option>
              <option value="eventi">🎉 Eventi Privati / Corporate</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Data Evento Prevista</label>
            <input type="date" style={inputStyle} value={dataEvento} onChange={e => setDataEvento(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Numero Indicativo Ospiti (Pax)</label>
            <input type="number" min="1" style={inputStyle} value={numeroOspiti} onChange={e => setNumeroOspiti(parseInt(e.target.value) || 1)} placeholder="Es. 100" />
          </div>
        </div>
      </div>

      {/* 3. Servizi in Proposta */}
      <div className="premium-card" style={{ padding: "2rem" }}>
        <div style={{ borderBottom: "2px solid #e58c2c", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: "0 0 1rem 0", color: "#e58c2c" }}>
            3. Servizi in Proposta
          </h2>
        </div>

        <ServiceItemsEditor
          items={items}
          numeroOspiti={numeroOspiti}
          onChange={setItems}
        />

        {/* Calcoli e Totali */}
        <div style={{ marginTop: "2.5rem", borderTop: "2px solid #eee", paddingTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem", color: "#666", fontSize: "1.05rem" }}>
            <span>Subtotale Servizi:</span>
            <strong>€ {totaleServizi.toLocaleString('it-IT')}</strong>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", background: "#faf8f5", padding: "1rem", borderRadius: "8px", border: "1px solid #eee" }}>
            <span style={{ color: "#e58c2c", fontWeight: "bold", fontSize: "1.05rem" }}>Sconto Riservato alla Coppia (€):</span>
            <input 
              type="number" 
              min="0" 
              value={scontoFisso} 
              onChange={e => setScontoFisso(parseFloat(e.target.value) || 0)} 
              style={{ padding: "0.6rem 1rem", border: "1px solid #ddd", borderRadius: "6px", width: "140px", textAlign: "right", fontWeight: "bold", fontSize: "1.1rem", background: "white" }} 
            />
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#e58c2c", color: "#ffffff", padding: "1.8rem", borderRadius: "10px", fontSize: "1.6rem", fontWeight: "bold", boxShadow: "0 4px 15px rgba(229, 140, 44, 0.3)" }}>
            <span style={{ color: "#ffffff" }}>TOTALE PROPOSTA:</span>
            <span style={{ color: "#ffffff" }}>€ {totaleCalcolato > 0 ? totaleCalcolato.toLocaleString('it-IT') : 0}</span>
          </div>
        </div>
      </div>

      {error && <div style={{ color: "#d93838", padding: "1rem", background: "#fee", borderRadius: "8px" }}>{error}</div>}

      <button type="submit" disabled={loading} style={{
        width: "100%",
        padding: "1.2rem",
        background: "#e58c2c",
        color: "#ffffff",
        border: "none",
        borderRadius: "10px",
        fontSize: "1.25rem",
        fontWeight: "bold",
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: "0 6px 20px rgba(229, 140, 44, 0.4)"
      }}>
        {loading ? "Salvataggio in corso..." : "💾 Salva e Genera Link Preventivo"}
      </button>
    </form>
  );
}
