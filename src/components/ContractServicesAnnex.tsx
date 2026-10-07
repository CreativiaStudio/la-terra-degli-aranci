"use client";

import React from "react";
import { SERVICES_CATALOG, type ServiceCatalogItem } from "@/lib/servicesCatalog";
import { formatEuro } from "@/lib/contractPayments";

type Lang = "it" | "en";

/** Identificatori delle categorie merceologiche mostrate nell'Allegato A. */
type MacroGroupId = "banqueting" | "allestimenti" | "musica" | "speciali";

/**
 * Mappa le categorie interne del catalogo (SERVICES_CATALOG) nelle 4
 * categorie ufficiali del tariffario consultabile dal Cliente.
 */
const CATEGORY_MAP: Record<string, MacroGroupId> = {
  "Ricevimento": "banqueting",
  "Extra ricevimento": "banqueting",
  "Angoli extra ricevimento": "banqueting",
  "Antipasto / pranzo in giardino": "banqueting",
  "Allestimenti": "allestimenti",
  "Strutture e coreografie": "allestimenti",
  "Rito in villa": "allestimenti",
  "Service luci e palchi": "musica",
  "After Party": "speciali",
  "Servizi personalizzati": "speciali",
  "Servizi da quotare": "speciali",
};

/**
 * Categorie interne da NON pubblicare nell'Allegato A (segnaposto operativi
 * di uso interno privi di valore per il Cliente).
 */
const HIDDEN_CATEGORIES = new Set(["Servizi ulteriori"]);

const MACRO_GROUPS: Array<{
  id: MacroGroupId;
  icon: string;
  it: string;
  en: string;
}> = [
  { id: "banqueting", icon: "🍽️", it: "Banqueting & Ricevimento", en: "Banqueting & Reception" },
  { id: "allestimenti", icon: "🏛️", it: "Allestimenti & Scenografie", en: "Set-ups & Scenography" },
  { id: "musica", icon: "🎶", it: "Musica & Intrattenimento", en: "Music & Entertainment" },
  { id: "speciali", icon: "✨", it: "Servizi Speciali / After dinner", en: "Special Services / After dinner" },
];

/** Decodifica le entità HTML presenti nei nomi del catalogo (&gt;, &lt;, &amp;). */
function decodeEntities(value: string): string {
  return value
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

interface AnnexRow {
  id: string;
  nome: string;
  prezzo: number;
  unitaLabel: string;
}

interface AnnexGroup {
  id: MacroGroupId;
  icon: string;
  label: string;
  rows: AnnexRow[];
}

/** Raggruppa il catalogo ufficiale nelle macro-categorie dell'Allegato A. */
function buildGroups(lang: Lang): AnnexGroup[] {
  return MACRO_GROUPS.map((macro) => {
    const items = SERVICES_CATALOG.filter((item: ServiceCatalogItem) => {
      if (HIDDEN_CATEGORIES.has(item.categoria)) return false;
      return CATEGORY_MAP[item.categoria] === macro.id;
    }).sort((a, b) => {
      if (a.prezzo_unitario === b.prezzo_unitario) return a.nome.localeCompare(b.nome);
      return a.prezzo_unitario - b.prezzo_unitario;
    });

    return {
      id: macro.id,
      icon: macro.icon,
      label: lang === "it" ? macro.it : macro.en,
      rows: items.map((item) => ({
        id: item.id,
        nome: decodeEntities(item.nome),
        prezzo: item.prezzo_unitario,
        unitaLabel: decodeEntities(item.unitaLabel),
      })),
    };
  }).filter((group) => group.rows.length > 0);
}

function priceLabel(row: AnnexRow, lang: Lang): string {
  if (row.prezzo > 0) {
    return lang === "it"
      ? `da ${formatEuro(row.prezzo)} + IVA`
      : `from ${formatEuro(row.prezzo)} + VAT`;
  }
  return lang === "it" ? "Da quotare" : "To be quoted";
}

// ---- Stili coerenti con l'identità visiva de La Terra degli Aranci ----

const rootStyle: React.CSSProperties = {
  border: "1px solid #e7ddcc",
  borderRadius: "12px",
  background: "#fffdfa",
  overflow: "hidden",
  margin: "2rem 0",
};

const bannerStyle: React.CSSProperties = {
  background: "#fdf7ef",
  borderBottom: "1px solid #e7ddcc",
  padding: "1.25rem 1.5rem",
};

const bannerTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#8a6a2f",
  fontSize: "1.05rem",
  fontWeight: 800,
  letterSpacing: "0.01em",
};

const bannerTextStyle: React.CSSProperties = {
  margin: "0.75rem 0 0",
  color: "#4a4136",
  fontSize: "0.9rem",
  lineHeight: 1.6,
};

const annexHeaderStyle: React.CSSProperties = {
  padding: "1rem 1.5rem 0.5rem",
};

const annexTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#1e1b18",
  fontSize: "1rem",
  fontWeight: 800,
};

const noteStyle: React.CSSProperties = {
  background: "#fff7ed",
  border: "1.5px solid #e58c2c",
  borderRadius: "10px",
  padding: "0.85rem 1rem",
  margin: "0.75rem 0 0",
  color: "#7c5a22",
  fontSize: "0.85rem",
  lineHeight: 1.55,
  fontWeight: 600,
};

const listWrapStyle: React.CSSProperties = {
  maxHeight: "440px",
  overflowY: "auto",
  padding: "0.5rem 1.5rem 1.25rem",
};

const groupTitleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  margin: "1rem 0 0.5rem",
  color: "#8a6a2f",
  fontWeight: 800,
  fontSize: "0.9rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "1px solid #e7ddcc",
  paddingBottom: "0.4rem",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: "1rem",
  padding: "0.45rem 0",
  borderBottom: "1px dashed #f0e8d8",
  fontSize: "0.85rem",
};

const rowNameStyle: React.CSSProperties = {
  color: "#3a342c",
  lineHeight: 1.4,
};

const rowPriceStyle: React.CSSProperties = {
  color: "#1e1b18",
  fontWeight: 700,
  whiteSpace: "nowrap",
  textAlign: "right",
};

const rowUnitStyle: React.CSSProperties = {
  display: "block",
  color: "#807261",
  fontWeight: 400,
  fontSize: "0.72rem",
};

/**
 * Sezione esplicativa dei servizi accessori + Allegato A (Tariffario dei servizi).
 *
 * Viene mostrata per SOLA PRESA VISIONE nel form di firma dei contratti:
 * nessun servizio è addebitato alla firma, il corrispettivo definitivo dei
 * servizi viene quantificato nella Scheda di Conferma dei Servizi (Art. 4-bis).
 */
export default function ContractServicesAnnex({ lang = "it" }: { lang?: Lang }) {
  const isIt = lang === "it";
  const groups = React.useMemo(() => buildGroups(lang), [lang]);

  return (
    <section style={rootStyle} aria-labelledby="contract-services-annex-title">
      {/* Banner informativo in evidenza */}
      <div style={bannerStyle}>
        <h3 id="contract-services-annex-title" style={bannerTitleStyle}>
          📌 {isIt ? "Oggetto del Contratto: Blocco Data & Concessione Location" : "Subject of the Contract: Date Lock & Venue Concession"}
        </h3>

        {isIt ? (
          <>
            <p style={bannerTextStyle}>
              La presente scrittura privata formalizza il blocco definitivo della location e della data
              concordata con la direzione (<strong>Santo Stefano S.r.l.</strong>) e l&apos;affidamento dei
              servizi banqueting a <strong>Iovino Banqueting S.r.l.</strong>
            </p>
            <p style={bannerTextStyle}>
              Tutti i servizi accessori (menù food &amp; beverage, allestimenti, open bar, confettata,
              intrattenimento musicale, animazione, ecc.) e il numero definitivo degli ospiti verranno
              definiti e concordati nei mesi successivi con l&apos;assistenza della direzione e della
              Wedding Planner.
            </p>
            <p style={{ ...bannerTextStyle, marginBottom: 0 }}>
              Il corrispettivo complessivo dei servizi è <strong>DINAMICO</strong> e verrà quantificato
              definitivamente <strong>fino a 10 giorni dall&apos;evento</strong> mediante apposita{" "}
              <strong>Scheda di Conferma dei Servizi (Art. 4-bis)</strong>.
            </p>
          </>
        ) : (
          <>
            <p style={bannerTextStyle}>
              This private agreement formalises the definitive lock of the venue and the agreed date with
              management (<strong>Santo Stefano S.r.l.</strong>) and the entrusting of banqueting services
              to <strong>Iovino Banqueting S.r.l.</strong>
            </p>
            <p style={bannerTextStyle}>
              All ancillary services (food &amp; beverage menus, set-ups, open bar, confectionery corner,
              musical entertainment, animation, etc.) and the final number of guests will be defined and
              agreed in the following months with the assistance of management and the Wedding Planner.
            </p>
            <p style={{ ...bannerTextStyle, marginBottom: 0 }}>
              The overall consideration for the services is <strong>DYNAMIC</strong> and will be finally
              quantified <strong>up to 10 days before the event</strong> by means of a specific Service
              Confirmation Schedule (<strong>Art. 4-bis</strong>).
            </p>
          </>
        )}
      </div>

      {/* Allegato A — Tariffario Ufficiale dei Servizi */}
      <div style={annexHeaderStyle}>
        <h4 style={annexTitleStyle}>
          📄 {isIt ? "Allegato A — Tariffario Ufficiale dei Servizi" : "Annex A — Official Services Price List"}
        </h4>
        <p style={{ margin: "0.35rem 0 0", color: "#807261", fontSize: "0.8rem" }}>
          {isIt ? "Preso in visione dal Cliente" : "Acknowledged for information by the Client"}
        </p>
      </div>

      <div style={noteStyle}>
        {isIt
          ? "La consultazione e sottoscrizione del presente Allegato avviene per SOLA PRESA VISIONE e non comporta l'automatica prenotazione di alcun servizio. Saranno dovuti esclusivamente i servizi che verranno espressamente confermati nella Scheda di Conferma dei Servizi a -10 giorni dall'evento."
          : "The consultation and signing of this Annex is for INFORMATION ONLY and does not entail the automatic booking of any service. Only the services expressly confirmed in the Service Confirmation Schedule 10 days before the event shall be due."}
      </div>

      <div style={listWrapStyle}>
        {groups.map((group) => (
          <div key={group.id}>
            <div style={groupTitleStyle}>
              <span aria-hidden="true">{group.icon}</span>
              <span>{group.label}</span>
            </div>
            {group.rows.map((row) => (
              <div key={row.id} style={rowStyle}>
                <span style={rowNameStyle}>{row.nome}</span>
                <span style={rowPriceStyle}>
                  {priceLabel(row, lang)}
                  {row.prezzo > 0 && row.unitaLabel && row.unitaLabel !== "da quotare" && (
                    <span style={rowUnitStyle}>{row.unitaLabel}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
