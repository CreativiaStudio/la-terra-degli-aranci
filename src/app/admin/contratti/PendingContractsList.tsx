"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import type { PendingContractLocal } from "@/lib/localDb";
import { isoToItalian } from "@/lib/dateInput";
import { deletePendingContractAction } from "./pendingActions";

const AMBER = "#e58c2c";
const ANTHRACITE = "#1e1b18";
const BORDER = "#e0ddd9";

const euro = (value: number) =>
  `€ ${new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.max(0, Number(value) || 0))}`;

const label: CSSProperties = {
  fontSize: "0.7rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontWeight: 700,
  color: "#8a6a2f",
  marginBottom: "0.35rem",
};

const contactChip: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.3rem",
  padding: "0.35rem 0.7rem",
  borderRadius: "999px",
  background: "#ffffff",
  border: `1px solid ${BORDER}`,
  color: ANTHRACITE,
  fontSize: "0.85rem",
  fontWeight: 500,
  textDecoration: "none",
};

const actionButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.55rem 0.95rem",
  borderRadius: "10px",
  border: `1px solid ${BORDER}`,
  background: "#ffffff",
  color: ANTHRACITE,
  fontFamily: "inherit",
  fontSize: "0.88rem",
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
};

/** Intestatari: "Sposo & Sposa" per i matrimoni, solo il cliente per gli eventi. */
function getIntestatari(c: PendingContractLocal): string {
  const cliente = c.cliente || {};
  const primary = [cliente.nome, cliente.cognome].filter(Boolean).join(" ").trim();
  const partner = [cliente.sposera_nome, cliente.sposera_cognome].filter(Boolean).join(" ").trim();

  if (primary && partner) return `${primary} & ${partner}`;
  return primary || c.intestatari || "Cliente";
}

function formatItalianDate(value: string | null): string {
  if (!value) return "Da definire";
  const iso = String(value).slice(0, 10);
  return isoToItalian(iso) || String(value);
}

interface PendingContractsListProps {
  initialContracts: PendingContractLocal[];
}

export default function PendingContractsList({ initialContracts }: PendingContractsListProps) {
  const router = useRouter();
  const [contracts, setContracts] = useState<PendingContractLocal[]>(initialContracts);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setContracts(initialContracts);
  }, [initialContracts]);

  const handleCopy = async (contract: PendingContractLocal) => {
    const link = contract.absoluteUrl || contract.url;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(contract.quoteId);
      window.setTimeout(() => {
        setCopiedId((current) => (current === contract.quoteId ? null : current));
      }, 2000);
    } catch (err) {
      console.error("Impossibile copiare il link del contratto:", err);
      window.alert("Impossibile copiare il link. Copialo manualmente:\n" + link);
    }
  };

  const handleDelete = async (contract: PendingContractLocal) => {
    const conferma = window.confirm(
      `Revocare l'opzione di ${getIntestatari(contract)}?\n\nLa data tornerà disponibile sul calendario e il link di firma non sarà più valido.`
    );
    if (!conferma) return;

    setDeletingId(contract.quoteId);
    try {
      const res = await deletePendingContractAction(contract.quoteId);
      if (res?.success) {
        setContracts((prev) => prev.filter((c) => c.quoteId !== contract.quoteId));
        router.refresh();
      } else {
        window.alert("Impossibile revocare l'opzione o record non trovato.");
      }
    } catch (err) {
      console.error("Errore durante la revoca dell'opzione:", err);
      window.alert("Errore durante la revoca dell'opzione. Riprova tra qualche istante.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      className="premium-card"
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 18px 50px rgba(30,27,24,0.06)",
        padding: "1.6rem 1.8rem",
        marginBottom: "2rem",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
          borderBottom: `1px solid ${BORDER}`,
          paddingBottom: "1rem",
          marginBottom: "1.4rem",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              textAlign: "left",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: 400,
              color: ANTHRACITE,
            }}
          >
            ⏳ Contratti in Attesa di Firma (In Pending)
          </h2>
          <p style={{ margin: "0.45rem 0 0 0", color: "#6a6764", fontSize: "0.92rem", maxWidth: 780, lineHeight: 1.5 }}>
            {"Contratti digitali emessi dalla direzione con opzione calendario bloccata per 7 giorni. Gli sposi devono solo completare l'anagrafica e apporre la firma."}
          </p>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            background: "#fff7ed",
            color: "#b45f0c",
            border: `1px solid ${AMBER}`,
            borderRadius: "999px",
            padding: "0.4rem 0.95rem",
            fontWeight: 700,
            fontSize: "0.9rem",
            whiteSpace: "nowrap",
          }}
        >
          {contracts.length} attiv{contracts.length === 1 ? "o" : "i"}
        </span>
      </header>

      {contracts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2.2rem 1rem", color: "#6a6764" }}>
          <div style={{ fontSize: "2.4rem", marginBottom: "0.5rem" }}>🌿</div>
          <p style={{ margin: 0, fontWeight: 600, color: ANTHRACITE }}>Nessun contratto in attesa di firma.</p>
          <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.9rem" }}>
            Quando emetti un contratto digitale, lo troverai qui con il link pronto da inviare agli sposi.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.2rem" }}>
          {contracts.map((contract) => {
            const cliente = contract.cliente || {};
            const intestatari = getIntestatari(contract);
            const telefono = String(cliente.telefono || "").trim();
            const email = String(cliente.email || "").trim();
            const isWedding = contract.tipoEvento === "wedding";
            const dataEvento = formatItalianDate(contract.data_evento);

            const turnoRaw = contract.quote?.turno || contract.opzione?.turno || "";
            const turno =
              turnoRaw === "pranzo" ? "Pranzo" : turnoRaw === "cena" ? "Cena" : "Da definire";

            const formulaRaw = contract.quote?.tipo_esclusiva || contract.opzione?.tipo || "";
            const esclusiva = formulaRaw === "esclusiva";

            const scadenza = contract.scadenza
              ? isoToItalian(String(contract.scadenza).slice(0, 10)) || String(contract.scadenza).slice(0, 10)
              : "";

            let statusBg = "#f0fdf4";
            let statusColor = "#15803d";
            let statusBorder = "#bbf7d0";
            let statusText = "";

            if (contract.scaduta) {
              statusBg = "#fef2f2";
              statusColor = "#b91c1c";
              statusBorder = "#fecaca";
              statusText = "🔴 Opzione 7gg scaduta";
            } else if (contract.giorniRimanenti <= 0) {
              statusBg = "#fffbeb";
              statusColor = "#b45309";
              statusBorder = "#fde68a";
              statusText = "⚠️ Scade oggi";
            } else {
              const giorni = contract.giorniRimanenti;
              statusText = `🟢 Opzione Attiva: mancano ${giorni} giorn${giorni === 1 ? "o" : "i"}${
                scadenza ? ` (scade il ${scadenza})` : ""
              }`;
            }

            const isCopied = copiedId === contract.quoteId;
            const isDeleting = deletingId === contract.quoteId;

            return (
              <article
                key={contract.quoteId}
                style={{
                  border: `1px solid ${BORDER}`,
                  borderRadius: "16px",
                  padding: "1.3rem 1.4rem",
                  background: "#fcfbf9",
                  boxShadow: "0 6px 18px rgba(30,27,24,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                    flexWrap: "wrap",
                    marginBottom: "1.1rem",
                  }}
                >
                  <div>
                    <div style={label}>Intestatari</div>
                    <div style={{ fontWeight: 700, fontSize: "1.12rem", color: ANTHRACITE }}>{intestatari}</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    {telefono && (
                      <a href={`tel:${telefono.replace(/\s+/g, "")}`} style={contactChip}>
                        📞 {telefono}
                      </a>
                    )}
                    {email && (
                      <a href={`mailto:${email}`} style={contactChip}>
                        ✉️ {email}
                      </a>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "0.9rem",
                    marginBottom: "1.1rem",
                  }}
                >
                  <div>
                    <div style={label}>Evento</div>
                    <div style={{ fontWeight: 600, color: ANTHRACITE }}>
                      {isWedding ? "💍 Matrimonio" : "🎉 Evento"} · {dataEvento}
                    </div>
                  </div>
                  <div>
                    <div style={label}>Turno</div>
                    <div style={{ fontWeight: 600, color: ANTHRACITE }}>{turno}</div>
                  </div>
                  <div>
                    <div style={label}>Formula</div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.3rem 0.7rem",
                        borderRadius: "999px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        background: esclusiva ? "#eef2ff" : "#f0fdf4",
                        color: esclusiva ? "#4338ca" : "#15803d",
                        border: `1px solid ${esclusiva ? "#c7d2fe" : "#bbf7d0"}`,
                      }}
                    >
                      {esclusiva ? "Esclusiva intera tenuta" : "Semi-esclusiva"}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "0.9rem",
                    marginBottom: "1.1rem",
                  }}
                >
                  <div>
                    <div style={label}>Canone location</div>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem", color: ANTHRACITE }}>{euro(contract.prezzo)}</div>
                    <div style={{ fontSize: "0.76rem", color: "#6a6764" }}>100% Santo Stefano</div>
                  </div>
                  <div>
                    <div style={label}>Caparra confirmatoria</div>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem", color: ANTHRACITE }}>{euro(contract.caparra)}</div>
                  </div>
                  <div>
                    <div style={label}>Saldo all&apos;evento</div>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#b45f0c" }}>{euro(contract.saldo)}</div>
                  </div>
                </div>

                <div
                  style={{
                    display: "inline-block",
                    background: statusBg,
                    color: statusColor,
                    border: `1px solid ${statusBorder}`,
                    borderRadius: "10px",
                    padding: "0.55rem 0.9rem",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    marginBottom: "1.1rem",
                  }}
                >
                  {statusText}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "0.6rem",
                    flexWrap: "wrap",
                    borderTop: `1px dashed ${BORDER}`,
                    paddingTop: "1rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleCopy(contract)}
                    style={{
                      ...actionButton,
                      background: isCopied ? "#f0fdf4" : "#ffffff",
                      borderColor: isCopied ? "#bbf7d0" : BORDER,
                      color: isCopied ? "#15803d" : ANTHRACITE,
                    }}
                  >
                    {isCopied ? "Copiato! ✓" : "📋 Copia Link"}
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(contract.whatsappText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={actionButton}
                  >
                    💬 WhatsApp
                  </a>

                  <a href={contract.url} target="_blank" rel="noopener noreferrer" style={actionButton}>
                    👁️ Vista Sposi
                  </a>

                  <Link href={`/preventivi/${contract.quoteId}`} target="_blank" style={actionButton}>
                    📋 Scheda Proposta
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(contract)}
                    disabled={isDeleting}
                    style={{
                      ...actionButton,
                      marginLeft: "auto",
                      background: "#fef2f2",
                      borderColor: "#fecaca",
                      color: "#b91c1c",
                      opacity: isDeleting ? 0.6 : 1,
                      cursor: isDeleting ? "wait" : "pointer",
                    }}
                  >
                    {isDeleting ? "Revoca…" : "🗑️ Revoca Opzione"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
