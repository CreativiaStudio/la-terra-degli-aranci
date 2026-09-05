"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { SANTO_STEFANO_CORP, IOVINO_CORP } from "@/lib/fiscalCalculator";

interface EventiCassaClientProps {
  quotes: any[];
}

export default function EventiCassaClient({ quotes }: EventiCassaClientProps) {
  const [filterType, setFilterType] = useState<"tutti" | "wedding" | "eventi">("tutti");
  const [filterStatus, setFilterStatus] = useState<string>("tutti");

  const confirmedQuotes = quotes.filter(
    (q) => q.status === "accettato" || q.status === "convertito" || q.status === "firmato"
  );

  const displayQuotes = confirmedQuotes.filter((q) => {
    if (filterType !== "tutti" && q.tipo_evento !== filterType) return false;
    if (filterStatus !== "tutti" && q.status !== filterStatus) return false;
    return true;
  });

  // Calcoli globali cassa e flussi societari
  let totaleFatturatoGenerale = 0;
  let totaleImponibileSS = 0;
  let totaleIvaSS = 0;
  let totaleLordoSS = 0;

  let totaleImponibileIovino = 0;
  let totaleIvaIovino = 0;
  let totaleLordoIovino = 0;

  let totaleAcconti1IncassatiSS = 0;
  let totaleAcconti2PrevistiIovino = 0;

  confirmedQuotes.forEach((q) => {
    const tot = Number(q.totale_calcolato || 0);
    totaleFatturatoGenerale += tot;

    // Split base 40/60
    const quotaSS = tot * 0.4;
    const imponibileSS = quotaSS / (1 + SANTO_STEFANO_CORP.vatRate);
    const ivaSS = quotaSS - imponibileSS;

    const quotaIov = tot * 0.6;
    const imponibileIov = quotaIov / (1 + IOVINO_CORP.vatRate);
    const ivaIov = quotaIov - imponibileIov;

    totaleImponibileSS += imponibileSS;
    totaleIvaSS += ivaSS;
    totaleLordoSS += quotaSS;

    totaleImponibileIovino += imponibileIov;
    totaleIvaIovino += ivaIov;
    totaleLordoIovino += quotaIov;

    const acconto1 = q.importo_caparra != null ? Number(q.importo_caparra) : Math.min(1500, tot);
    const acconto2 =
      q.importo_secondo_acconto != null
        ? Number(q.importo_secondo_acconto)
        : Math.min(3000, Math.max(0, tot - acconto1));

    if (q.status === "firmato") {
      totaleAcconti1IncassatiSS += acconto1;
    }
    totaleAcconti2PrevistiIovino += acconto2;
  });

  const residuoSaldiSS = Math.max(0, totaleLordoSS - totaleAcconti1IncassatiSS);
  const residuoSaldiIovino = Math.max(0, totaleLordoIovino - totaleAcconti2PrevistiIovino);

  return (
    <div style={{ maxWidth: "1250px", margin: "0 auto", fontFamily: "'Outfit', sans-serif" }}>
      {/* Intestazione */}
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
          REGIA FINANZIARIA & CASSA SOCIETARIA
        </span>
        <h1
          style={{
            margin: "0.3rem 0 0 0",
            color: "#514d48",
            fontSize: "2.2rem",
            fontFamily: "serif",
          }}
        >
          💰 Controllo Cassa, Eventi & Flussi Societari
        </h1>
        <p style={{ margin: 0, color: "#777" }}>
          Supervisione dei flussi di cassa separati per <strong>{SANTO_STEFANO_CORP.ragioneSociale}</strong> (IVA 22%) e{" "}
          <strong>{IOVINO_CORP.ragioneSociale}</strong> (IVA 10%).
        </p>
      </div>

      {/* Dual Corporate Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* Card Santo Stefano S.r.l. */}
        <div
          className="premium-card"
          style={{
            padding: "2rem",
            background: "linear-gradient(135deg, #ffffff 0%, #fffbf5 100%)",
            border: "1px solid #fed7aa",
            borderLeft: "6px solid #ea580c",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  background: "#ffedd5",
                  color: "#c2410c",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                QUOTA STRUTTURA & VILLA (40% - IVA 22%)
              </span>
              <h3 style={{ margin: "0.4rem 0 0.2rem 0", color: "#1e1b18", fontSize: "1.4rem" }}>
                {SANTO_STEFANO_CORP.ragioneSociale}
              </h3>
              <small style={{ color: "#78716c" }}>
                P.IVA: <strong>{SANTO_STEFANO_CORP.piva}</strong> • Rappr. Legale: {SANTO_STEFANO_CORP.legalRep}
              </small>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ea580c" }}>
                € {Math.round(totaleLordoSS).toLocaleString("it-IT")}
              </span>
              <small style={{ display: "block", color: "#78716c" }}>Totale Lordo SS</small>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.8rem",
              background: "#ffffff",
              padding: "1rem",
              borderRadius: "12px",
              border: "1px solid #fed7aa",
              fontSize: "0.88rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <span style={{ color: "#78716c", display: "block" }}>Imponibile Struttura</span>
              <strong style={{ fontSize: "1.1rem", color: "#1e1b18" }}>
                € {Math.round(totaleImponibileSS).toLocaleString("it-IT")}
              </strong>
            </div>
            <div>
              <span style={{ color: "#78716c", display: "block" }}>IVA 22% a Debito</span>
              <strong style={{ fontSize: "1.1rem", color: "#ea580c" }}>
                € {Math.round(totaleIvaSS).toLocaleString("it-IT")}
              </strong>
            </div>
            <div>
              <span style={{ color: "#78716c", display: "block" }}>1° Acconti Incassati (€1.500)</span>
              <strong style={{ fontSize: "1.1rem", color: "#16a34a" }}>
                € {totaleAcconti1IncassatiSS.toLocaleString("it-IT")}
              </strong>
            </div>
            <div>
              <span style={{ color: "#78716c", display: "block" }}>Saldi SS da Incassare</span>
              <strong style={{ fontSize: "1.1rem", color: "#0284c7" }}>
                € {Math.round(residuoSaldiSS).toLocaleString("it-IT")}
              </strong>
            </div>
          </div>

          <div style={{ fontSize: "0.8rem", color: "#78716c", borderTop: "1px dashed #fed7aa", paddingTop: "0.6rem" }}>
            🏦 Coordinate: <strong>{SANTO_STEFANO_CORP.banca}</strong> <br />
            IBAN: <code style={{ color: "#ea580c" }}>{SANTO_STEFANO_CORP.iban}</code>
          </div>
        </div>

        {/* Card Iovino Banquetting S.r.l. */}
        <div
          className="premium-card"
          style={{
            padding: "2rem",
            background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
            border: "1px solid #bbf7d0",
            borderLeft: "6px solid #16a34a",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  background: "#dcfce7",
                  color: "#15803d",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                QUOTA SOMMINISTRAZIONE & BANQUETING (60% - IVA 10%)
              </span>
              <h3 style={{ margin: "0.4rem 0 0.2rem 0", color: "#1e1b18", fontSize: "1.4rem" }}>
                {IOVINO_CORP.ragioneSociale}
              </h3>
              <small style={{ color: "#78716c" }}>
                P.IVA: <strong>{IOVINO_CORP.piva}</strong> • Rappr. Legale: {IOVINO_CORP.legalRep}
              </small>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#16a34a" }}>
                € {Math.round(totaleLordoIovino).toLocaleString("it-IT")}
              </span>
              <small style={{ display: "block", color: "#78716c" }}>Totale Lordo Iovino</small>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.8rem",
              background: "#ffffff",
              padding: "1rem",
              borderRadius: "12px",
              border: "1px solid #bbf7d0",
              fontSize: "0.88rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <span style={{ color: "#78716c", display: "block" }}>Imponibile Catering</span>
              <strong style={{ fontSize: "1.1rem", color: "#1e1b18" }}>
                € {Math.round(totaleImponibileIovino).toLocaleString("it-IT")}
              </strong>
            </div>
            <div>
              <span style={{ color: "#78716c", display: "block" }}>IVA 10% Somministrazione</span>
              <strong style={{ fontSize: "1.1rem", color: "#16a34a" }}>
                € {Math.round(totaleIvaIovino).toLocaleString("it-IT")}
              </strong>
            </div>
            <div>
              <span style={{ color: "#78716c", display: "block" }}>2° Acconti (-6 Mesi)</span>
              <strong style={{ fontSize: "1.1rem", color: "#b45309" }}>
                € {totaleAcconti2PrevistiIovino.toLocaleString("it-IT")}
              </strong>
            </div>
            <div>
              <span style={{ color: "#78716c", display: "block" }}>Saldi Iovino da Incassare</span>
              <strong style={{ fontSize: "1.1rem", color: "#0284c7" }}>
                € {Math.round(residuoSaldiIovino).toLocaleString("it-IT")}
              </strong>
            </div>
          </div>

          <div style={{ fontSize: "0.8rem", color: "#78716c", borderTop: "1px dashed #bbf7d0", paddingTop: "0.6rem" }}>
            🏦 Coordinate: <strong>{IOVINO_CORP.banca}</strong> <br />
            IBAN: <code style={{ color: "#16a34a" }}>{IOVINO_CORP.iban}</code>
          </div>
        </div>
      </div>

      {/* Control Bar con Filtri */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setFilterType("tutti")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              background: filterType === "tutti" ? "#1e1b18" : "#f1f5f9",
              color: filterType === "tutti" ? "#fff" : "#475569",
            }}
          >
            Tutti gli Eventi ({confirmedQuotes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("wedding")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              background: filterType === "wedding" ? "#ea580c" : "#f1f5f9",
              color: filterType === "wedding" ? "#fff" : "#475569",
            }}
          >
            Wedding 💍
          </button>
          <button
            type="button"
            onClick={() => setFilterType("eventi")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              background: filterType === "eventi" ? "#0284c7" : "#f1f5f9",
              color: filterType === "eventi" ? "#fff" : "#475569",
            }}
          >
            Privati 🎉
          </button>
        </div>

        <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
          Visualizzazione di <strong>{displayQuotes.length}</strong> contratti attivi
        </div>
      </div>

      {/* Tabella Registro Finanziario Eventi */}
      <div className="premium-card" style={{ padding: "2rem", overflowX: "auto" }}>
        <h2 style={{ marginTop: 0, color: "#1e1b18", fontSize: "1.3rem", marginBottom: "1rem" }}>
          📑 Ripartizione Fiscale & Stato Cassa per Evento
        </h2>

        {displayQuotes.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#94a3b8" }}>
            Nessun evento risponde ai criteri di filtro selezionati.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #e2e8f0",
                  textAlign: "left",
                  color: "#64748b",
                  fontSize: "0.82rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <th style={{ padding: "0.8rem" }}>Cliente / Evento</th>
                <th style={{ padding: "0.8rem" }}>Data</th>
                <th style={{ padding: "0.8rem" }}>Totale</th>
                <th style={{ padding: "0.8rem", color: "#c2410c" }}>Quota Santo Stefano (22%)</th>
                <th style={{ padding: "0.8rem", color: "#15803d" }}>Quota Iovino (10%)</th>
                <th style={{ padding: "0.8rem" }}>1° Acconto SS</th>
                <th style={{ padding: "0.8rem" }}>2° Acconto Iovino</th>
                <th style={{ padding: "0.8rem" }}>Saldo SS</th>
                <th style={{ padding: "0.8rem" }}>Saldo Iovino</th>
                <th style={{ padding: "0.8rem" }}>Stato</th>
              </tr>
            </thead>
            <tbody>
              {displayQuotes.map((q) => {
                const tot = Number(q.totale_calcolato || 0);
                const isFirmato = q.status === "firmato";

                const quotaSS = Math.round(tot * 0.4);
                const quotaIovino = tot - quotaSS;

                const acconto1 = q.importo_caparra != null ? Number(q.importo_caparra) : Math.min(1500, tot);
                const acconto2 =
                  q.importo_secondo_acconto != null
                    ? Number(q.importo_secondo_acconto)
                    : Math.min(3000, Math.max(0, tot - acconto1));

                const saldoSS = Math.max(0, quotaSS - acconto1);
                const saldoIovino = Math.max(0, quotaIovino - acconto2);

                return (
                  <tr key={q.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "0.9rem" }}>
                    <td style={{ padding: "1rem 0.8rem" }}>
                      <strong style={{ color: "#1e1b18", display: "block" }}>
                        {q.clients?.nome} {q.clients?.cognome}
                      </strong>
                      <small style={{ color: "#64748b" }}>
                        {q.tipo_evento === "wedding" ? "Matrimonio" : "Evento Privato"}
                      </small>
                    </td>

                    <td style={{ padding: "1rem 0.8rem" }}>
                      {q.data_evento ? format(new Date(q.data_evento), "dd/MM/yyyy") : "TBD"}
                    </td>

                    <td style={{ padding: "1rem 0.8rem" }}>
                      <strong style={{ color: "#ea580c" }}>€ {tot.toLocaleString("it-IT")}</strong>
                    </td>

                    {/* Quota SS */}
                    <td style={{ padding: "1rem 0.8rem", color: "#c2410c" }}>
                      <strong>€ {quotaSS.toLocaleString("it-IT")}</strong>
                      <small style={{ display: "block", color: "#9a3412" }}>
                        Imp: € {Math.round(quotaSS / 1.22).toLocaleString("it-IT")}
                      </small>
                    </td>

                    {/* Quota Iovino */}
                    <td style={{ padding: "1rem 0.8rem", color: "#15803d" }}>
                      <strong>€ {quotaIovino.toLocaleString("it-IT")}</strong>
                      <small style={{ display: "block", color: "#166534" }}>
                        Imp: € {Math.round(quotaIovino / 1.10).toLocaleString("it-IT")}
                      </small>
                    </td>

                    {/* 1° Acconto */}
                    <td style={{ padding: "1rem 0.8rem" }}>
                      <span
                        style={{
                          padding: "0.2rem 0.5rem",
                          borderRadius: "6px",
                          background: isFirmato ? "#dcfce7" : "#fef3c7",
                          color: isFirmato ? "#166534" : "#92400e",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                        }}
                      >
                        € {acconto1.toLocaleString("it-IT")}
                      </span>
                    </td>

                    {/* 2° Acconto */}
                    <td style={{ padding: "1rem 0.8rem" }}>
                      <span
                        style={{
                          padding: "0.2rem 0.5rem",
                          borderRadius: "6px",
                          background: "#fef3c7",
                          color: "#92400e",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                        }}
                      >
                        € {acconto2.toLocaleString("it-IT")}
                      </span>
                    </td>

                    {/* Saldo SS */}
                    <td style={{ padding: "1rem 0.8rem", fontWeight: 600, color: "#ea580c" }}>
                      € {saldoSS.toLocaleString("it-IT")}
                    </td>

                    {/* Saldo Iovino */}
                    <td style={{ padding: "1rem 0.8rem", fontWeight: 600, color: "#16a34a" }}>
                      € {saldoIovino.toLocaleString("it-IT")}
                    </td>

                    {/* Stato */}
                    <td style={{ padding: "1rem 0.8rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.6rem",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: isFirmato ? "#dcfce7" : "#e0f2fe",
                          color: isFirmato ? "#166534" : "#0369a1",
                        }}
                      >
                        {isFirmato ? "Firmato ✓" : "Inviato"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
