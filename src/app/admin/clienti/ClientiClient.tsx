"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createEventForClientAction,
  type ClientiFormula,
} from "./actions";
import TagEditorModal, { TAG_STYLES } from "./TagEditorModal";

export interface ClienteEventoRow {
  id: string;
  titolo: string;
  data: string | null;
  formula: string;
  stage: string;
  stageLabel: string;
  badgeColor: string;
}

export interface ClienteRow {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  /** Tag assegnati: VIP Club TDA, Sposi, Privato, Nuovo. */
  tags: string[];
  isClub: boolean;
  eventiCount: number;
  ltvCents: number;
  eventi: ClienteEventoRow[];
}

interface ClientiClientProps {
  clienti: ClienteRow[];
}

function whatsappHref(telefono: string): string {
  return `https://wa.me/${String(telefono).replace(/[^0-9]/g, "")}`;
}

function formatDate(value: string | null): string {
  if (!value) return "Da definire";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/** Riepilogo pulito dei tipi di evento (senza duplicati), es. "Matrimonio + Battesimo". */
function getEventTypesSummary(eventi: ClienteEventoRow[]): string {
  if (!eventi || eventi.length === 0) return "";
  const tipi: string[] = [];
  for (const ev of eventi) {
    const titolo = String(ev?.titolo || "").trim();
    if (titolo && !tipi.includes(titolo)) tipi.push(titolo);
  }
  return tipi.join(" + ");
}

export default function ClientiClient({ clienti }: ClientiClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [tagsCliente, setTagsCliente] = useState<ClienteRow | null>(null);
  const [formClienteId, setFormClienteId] = useState("");
  const [formData, setFormData] = useState("");
  const [formTurno, setFormTurno] = useState<"pranzo" | "cena">("pranzo");
  const [formFormula, setFormFormula] = useState<ClientiFormula>("sala_bianca");
  const [formTipo, setFormTipo] = useState<"wedding" | "eventi">("wedding");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clienti;
    return clienti.filter((c) =>
      `${c.nome} ${c.cognome} ${c.email} ${c.telefono}`.toLowerCase().includes(q)
    );
  }, [clienti, search]);

  const totalClients = clienti.length;
  const clubMembers = clienti.filter((c) => c.isClub).length;
  const repeatClients = clienti.filter((c) => c.eventiCount > 1).length;
  const loyaltyRate = totalClients > 0 ? Math.round((repeatClients / totalClients) * 100) : 0;

  const openModal = (clienteId?: string) => {
    setError("");
    setFormClienteId(clienteId || clienti[0]?.id || "");
    setFormData("");
    setFormTurno("pranzo");
    setFormFormula("sala_bianca");
    setFormTipo("wedding");
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formClienteId) {
      setError("Seleziona un cliente esistente.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData)) {
      setError("Inserisci una data evento valida.");
      return;
    }
    startTransition(async () => {
      const res = await createEventForClientAction({
        clientId: formClienteId,
        data_evento: formData,
        turno: formTurno,
        formula: formFormula,
        tipo_evento: formTipo,
      });
      if (res.success && res.contractUrl) {
        window.location.href = res.contractUrl;
      } else {
        setError(res.error || "Impossibile creare l'evento.");
      }
    });
  };

  const kpiCard = (label: string, value: string, accent: string) => (
    <div
      className="premium-card"
      style={{
        padding: "1.4rem 1.6rem",
        borderLeft: `4px solid ${accent}`,
        display: "flex",
        flexDirection: "column",
        gap: "0.3rem",
      }}
    >
      <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "1px", color: "#8a847c", fontWeight: 700 }}>
        {label}
      </span>
      <span style={{ fontSize: "1.9rem", fontWeight: 800, color: "#1e1b18", lineHeight: 1.1 }}>{value}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: "1250px", margin: "0 auto", fontFamily: "'Outfit', sans-serif" }}>
      {/* Intestazione */}
      <div style={{ marginBottom: "1.5rem" }}>
        <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.85rem", color: "#e58c2c", fontWeight: "bold" }}>
          PILASTRO CLIENTI & CLUB TDA
        </span>
        <h1 style={{ margin: "0.3rem 0 0 0", color: "#514d48", fontSize: "2.2rem", fontFamily: "serif" }}>
          👥 Rubrica Clienti & Club TDA
        </h1>
        <p style={{ margin: 0, color: "#777" }}>
          Anagrafica unificata e fidelizzazione degli ospiti che hanno scelto La Terra degli Aranci. Gli importi e il valore storico (LTV) sono disponibili nella scheda CRM di ogni cliente.
        </p>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.2rem", marginBottom: "1.8rem" }}>
        {kpiCard("Clienti Registrati", String(totalClients), "#e58c2c")}
        {kpiCard("Membri Club TDA", String(clubMembers), "#1e1b18")}
        {kpiCard("Eventi Ripetuti / Fidelizzati", String(repeatClients), "#16a34a")}
        {kpiCard("Tasso Fidelizzazione", `${loyaltyRate}%`, "#0284c7")}
      </div>

      {/* Barra superiore */}
      <div className="premium-card" style={{ padding: "1.2rem 1.5rem", marginBottom: "1.6rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="🔍 Cerca per nome, email o telefono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "0.7rem 1.2rem", borderRadius: "8px", border: "1px solid #ddd", width: "320px", fontSize: "0.95rem" }}
            />
            <span style={{ color: "#777", fontSize: "0.9rem" }}>
              Trovati: <strong>{filtered.length}</strong> clienti
            </span>
          </div>

          <button
            type="button"
            onClick={() => openModal()}
            style={{
              padding: "0.7rem 1.3rem",
              background: "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(229,140,44,0.3)",
            }}
          >
            ⚡ Nuovo Evento per Cliente Esistente
          </button>
        </div>
      </div>

      {/* Tabella Clienti */}
      <div className="premium-card" style={{ padding: "1rem", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e8e2d9", color: "#78716c", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <th style={{ padding: "0.8rem 0.7rem" }}>Cliente</th>
              <th style={{ padding: "0.8rem 0.7rem" }}>Contatti</th>
              <th style={{ padding: "0.8rem 0.7rem" }}>Storico Eventi</th>
              <th style={{ padding: "0.8rem 0.7rem", textAlign: "right" }}>Eventi</th>
              <th style={{ padding: "0.8rem 0.7rem", textAlign: "right" }}>Azione</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "2.5rem", textAlign: "center", color: "#94a3b8" }}>
                  Nessun cliente trovato con i criteri di ricerca.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f0eee9", verticalAlign: "top" }}>
                  <td style={{ padding: "0.9rem 0.7rem" }}>
                    <Link
                      href={`/admin/clienti/${c.id}`}
                      style={{
                        fontSize: "0.95rem",
                        color: "#1e1b18",
                        display: "inline-block",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                      title="Apri Scheda CRM"
                    >
                      {c.nome} {c.cognome}
                    </Link>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.35rem", alignItems: "center" }}>
                      {c.tags.length === 0 ? (
                        <span style={{ fontSize: "0.72rem", color: "#a8a29e" }}>—</span>
                      ) : (
                        c.tags.map((tag) => {
                          const s = TAG_STYLES[tag] || { bg: "#f5f5f4", color: "#57534e", border: "#e7e5e4" };
                          return (
                            <span
                              key={tag}
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "0.15rem 0.5rem",
                                borderRadius: "999px",
                                background: s.bg,
                                color: s.color,
                                border: `1px solid ${s.border}`,
                              }}
                            >
                              {tag}
                            </span>
                          );
                        })
                      )}
                      <button
                        type="button"
                        onClick={() => setTagsCliente(c)}
                        title="Modifica etichette"
                        aria-label={`Modifica etichette di ${c.nome} ${c.cognome}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0.1rem 0.4rem",
                          borderRadius: 999,
                          border: "1px solid #e8e2d9",
                          background: "#fff",
                          color: "#c2410c",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          lineHeight: 1.4,
                        }}
                      >
                        🏷️
                      </button>
                    </div>
                  </td>

                  <td style={{ padding: "0.9rem 0.7rem" }}>
                    <small style={{ display: "block", color: "#6a6764", fontSize: "0.78rem" }}>{c.email || "—"}</small>
                    {c.telefono ? (
                      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "0.2rem", flexWrap: "wrap" }}>
                        <a href={`tel:${c.telefono}`} style={{ fontSize: "0.78rem", color: "#514d48", fontWeight: 700, textDecoration: "none" }}>
                          📞 {c.telefono}
                        </a>
                        <a
                          href={whatsappHref(c.telefono)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: 700, textDecoration: "none" }}
                        >
                          💬 WhatsApp
                        </a>
                      </div>
                    ) : (
                      <small style={{ color: "#a8a29e" }}>Telefono non disponibile</small>
                    )}
                  </td>

                  <td style={{ padding: "0.9rem 0.7rem" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {c.eventi.length === 0 ? (
                        <span style={{ fontSize: "0.78rem", color: "#a8a29e" }}>Nessun evento collegato</span>
                      ) : (
                        c.eventi.map((ev) => (
                          <a
                            key={ev.id}
                            href={`/admin/eventi/${ev.id}`}
                            title={`${ev.titolo} · ${formatDate(ev.data)} · ${ev.formula}`}
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "0.18rem 0.5rem",
                              borderRadius: "6px",
                              background: ev.badgeColor,
                              color: "#ffffff",
                              textDecoration: "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ev.stageLabel} · {formatDate(ev.data)}
                          </a>
                        ))
                      )}
                    </div>
                  </td>

                  <td style={{ padding: "0.9rem 0.7rem", textAlign: "right", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.28rem 0.75rem",
                        borderRadius: "999px",
                        background: "#fff7ed",
                        color: "#c2410c",
                        border: "1px solid #ffedd5",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                      }}
                    >
                      {c.eventiCount} {c.eventiCount === 1 ? "evento" : "eventi"}
                    </span>
                    <small style={{ display: "block", marginTop: "0.35rem", color: "#78716c", fontSize: "0.74rem", fontWeight: 600, whiteSpace: "normal" }}>
                      {getEventTypesSummary(c.eventi) || "Nessun dettaglio"}
                    </small>
                  </td>

                  <td style={{ padding: "0.9rem 0.7rem", textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center", justifyContent: "flex-end" }}>
                      <Link
                        href={`/admin/clienti/${c.id}`}
                        style={{
                          padding: "0.45rem 0.85rem",
                          background: "#fff7ed",
                          color: "#c2410c",
                          border: "1px solid #ffedd5",
                          borderRadius: "7px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        👤 Scheda CRM
                      </Link>
                      <button
                        type="button"
                        onClick={() => openModal(c.id)}
                        style={{
                          padding: "0.45rem 0.85rem",
                          background: "#ffffff",
                          color: "#1e1b18",
                          border: "1px solid #e8e2d9",
                          borderRadius: "7px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        ➕ Nuovo Evento
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODALE NUOVO EVENTO */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "2rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              width: "100%",
              maxWidth: "560px",
              borderRadius: "16px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              padding: "2.2rem",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                position: "absolute",
                top: "1.2rem",
                right: "1.2rem",
                background: "#f0eee9",
                border: "none",
                fontSize: "1.1rem",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✕
            </button>

            <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700 }}>
              NUOVO EVENTO
            </span>
            <h2 style={{ margin: "0.3rem 0 1.4rem 0", color: "#514d48", fontSize: "1.6rem", fontFamily: "serif" }}>
              Crea evento per cliente esistente
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                Cliente
                <select
                  value={formClienteId}
                  onChange={(e) => setFormClienteId(e.target.value)}
                  required
                  style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", background: "#fff" }}
                >
                  <option value="">— Seleziona cliente —</option>
                  {clienti.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.cognome} {c.telefono ? `· ${c.telefono}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                  Tipo evento
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as "wedding" | "eventi")}
                    style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", background: "#fff" }}
                  >
                    <option value="wedding">Matrimonio (Wedding)</option>
                    <option value="eventi">Evento Privato</option>
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                  Data evento
                  <input
                    type="date"
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    required
                    style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem" }}
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                  Turno
                  <select
                    value={formTurno}
                    onChange={(e) => setFormTurno(e.target.value as "pranzo" | "cena")}
                    style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", background: "#fff" }}
                  >
                    <option value="pranzo">Pranzo (12:30)</option>
                    <option value="cena">Cena (19:30)</option>
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", color: "#514d48", fontWeight: 600 }}>
                  Formula
                  <select
                    value={formFormula}
                    onChange={(e) => setFormFormula(e.target.value as ClientiFormula)}
                    style={{ padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", background: "#fff" }}
                  >
                    <option value="esclusiva">Esclusiva Villa</option>
                    <option value="sala_bianca">Semi-esclusiva · Sala Bianca</option>
                    <option value="sala_tufo">Semi-esclusiva · Sala Tufo</option>
                  </select>
                </label>
              </div>

              {error && (
                <div style={{ color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "0.6rem 0.8rem", fontSize: "0.85rem", fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.4rem" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={pending}
                  style={{ flex: 1, padding: "0.85rem", borderRadius: "10px", border: "1px solid #ddd", background: "#fff", color: "#555", fontWeight: 600, cursor: pending ? "not-allowed" : "pointer" }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  style={{
                    flex: 2,
                    padding: "0.85rem",
                    borderRadius: "10px",
                    border: "none",
                    background: pending ? "#d6c3ac" : "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: pending ? "not-allowed" : "pointer",
                  }}
                >
                  {pending ? "Creazione in corso..." : "✍️ Crea Quote & Vai al Contratto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE MODIFICA ETICHETTE */}
      {tagsCliente && (
        <TagEditorModal
          clientId={tagsCliente.id}
          clientName={`${tagsCliente.nome} ${tagsCliente.cognome}`.trim()}
          initialTags={tagsCliente.tags}
          onClose={() => setTagsCliente(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
