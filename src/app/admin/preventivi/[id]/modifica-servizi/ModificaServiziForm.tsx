"use client";

import { useState } from "react";
import ServiceItemsEditor, { ServiceItem } from "@/components/ServiceItemsEditor";
import { createQuoteChange } from "@/app/preventivi/modifica/actions";
import CopyLinkButton from "@/app/admin/contratti/converti/CopyLinkButton";

export default function ModificaServiziForm({ quote }: { quote: any }) {
  const [items, setItems] = useState<ServiceItem[]>(quote.items || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");

  const totaleAttuale = Number(quote.totale_calcolato) || 0;
  const totaleServizi = items.reduce((acc, item) => acc + (Number(item.prezzo_unitario) || 0), 0);
  const nuovoTotale = totaleServizi - (Number(quote.sconto_fisso) || 0);
  const delta = nuovoTotale - totaleAttuale;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const res = await createQuoteChange(quote.id, items, 'admin');
    if (res.success) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      setLink(`${origin}/preventivi/modifica/${res.changeId}?sig=${res.sig}`);
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  if (link) {
    return (
      <div className="premium-card" style={{ padding: "2rem" }}>
        <h2 style={{ marginTop: 0, color: "#e58c2c" }}>🔗 Link di Conferma Generato</h2>
        <p style={{ color: "#666" }}>
          Invia questo link al cliente: dovrà firmare digitalmente per rendere effettiva
          la modifica ed aggiornare il totale del contratto.
        </p>
        <CopyLinkButton link={link} />
      </div>
    );
  }

  return (
    <div className="premium-card" style={{ padding: "2rem" }}>
      <h2 style={{ marginTop: 0, color: "#e58c2c" }}>Componi la Modifica</h2>
      <ServiceItemsEditor items={items} numeroOspiti={quote.numero_ospiti || 100} onChange={setItems} />

      <div style={{ marginTop: "2rem", background: "#faf8f5", padding: "1.5rem", borderRadius: "12px", border: "1px solid #eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", color: "#666" }}>
          <span>Totale Attuale</span>
          <span>€ {totaleAttuale.toLocaleString('it-IT')}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.4rem", fontWeight: "bold", color: "#e58c2c" }}>
          <span>Nuovo Totale</span>
          <span>€ {nuovoTotale.toLocaleString('it-IT')}</span>
        </div>
      </div>

      {error && <div style={{ color: "#d93838", marginTop: "1rem", fontWeight: 600 }}>{error}</div>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || delta === 0}
        style={{
          marginTop: "1.5rem",
          padding: "1rem 2rem",
          background: delta === 0 ? "#ccc" : "#e58c2c",
          color: "#ffffff",
          border: "none",
          borderRadius: "10px",
          fontSize: "1rem",
          fontWeight: "bold",
          cursor: loading || delta === 0 ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Generazione link..." : "🔗 Genera Link di Conferma per il Cliente"}
      </button>
    </div>
  );
}
