"use client";

import { useState } from "react";
import { Copy, CheckCircle2, Lock } from "lucide-react";
import { generateSecureToken } from "@/app/actions";

export default function GeneratoreLink() {
  const [tipo, setTipo] = useState("eventi");
  const [prezzo, setPrezzo] = useState("");
  const [preventivo, setPreventivo] = useState("");
  
  const [generatedLink, setGeneratedLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const isReady = prezzo && preventivo;

  const handleGenerate = async () => {
    setIsGenerating(true);
    const { prezzo: p, preventivo: prev, sig } = await generateSecureToken(prezzo, preventivo);
    setGeneratedLink(`${baseUrl}/contratti/${tipo}?prezzo=${p}&preventivo=${prev}&sig=${sig}`);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="premium-card" style={{ marginBottom: "2rem" }}>
        <h1>Generatore Link Contratti</h1>
        <p style={{ textAlign: "center", marginBottom: "2rem", color: "var(--text-light)" }}>
          Compila i campi qui sotto per generare un link crittografato e non manomettibile dal cliente.
        </p>

        <div className="form-grid">
          <div className="form-group full">
            <label>Tipo di Contratto</label>
            <select value={tipo} onChange={(e) => { setTipo(e.target.value); setGeneratedLink(""); }}>
              <option value="eventi">Contratto Eventi</option>
              <option value="wedding">Contratto Wedding</option>
            </select>
          </div>

          <div className="form-group">
            <label>Numero Preventivo</label>
            <input 
              type="text" 
              placeholder="Es. 142" 
              value={preventivo}
              onChange={(e) => { setPreventivo(e.target.value); setGeneratedLink(""); }}
            />
          </div>

          <div className="form-group">
            <label>Prezzo Concordato (€)</label>
            <input 
              type="number" 
              placeholder="Es. 2500" 
              value={prezzo}
              onChange={(e) => { setPrezzo(e.target.value); setGeneratedLink(""); }}
            />
          </div>

          <div className="form-group full" style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
            <button 
              className="btn-primary" 
              onClick={handleGenerate} 
              disabled={!isReady || isGenerating}
              style={{ width: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Lock size={18} />
              {isGenerating ? "Generazione..." : "Genera Link Sicuro"}
            </button>
          </div>

          {generatedLink && (
            <div className="form-group full" style={{ marginTop: "2rem", background: "#f0eee9", padding: "1.5rem", borderRadius: "8px" }}>
              <label>Link Sicuro (Pronto da copiare e inviare):</label>
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <input 
                  type="text" 
                  readOnly 
                  value={generatedLink} 
                  style={{ flex: 1, backgroundColor: "white" }} 
                />
                <button 
                  onClick={handleCopy}
                  style={{
                    background: copied ? "#28a745" : "var(--primary)",
                    color: "white",
                    border: "none",
                    padding: "0 1.5rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    transition: "all 0.2s"
                  }}
                >
                  {copied ? <><CheckCircle2 size={18} /> Copiato!</> : <><Copy size={18} /> Copia Link</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
