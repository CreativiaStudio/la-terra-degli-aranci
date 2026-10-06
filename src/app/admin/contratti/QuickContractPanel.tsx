"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2, X } from "lucide-react";
import ContractLinkShare from "@/components/ContractLinkShare";
import { createQuickContract } from "@/app/admin/contratti/quickActions";
import {
  SEMI_ESCLUSIVA_FORMULE,
  SEMI_ESCLUSIVA_PREZZO,
  ESCLUSIVA_TARIFFA_100_PLUS,
  ESCLUSIVA_TARIFFA_70_99,
  type SemiFormulaKey,
} from "@/lib/contractMeta";

type TipoEvento = "wedding" | "eventi";
type Turno = "pranzo" | "cena";
type TipoEsclusiva = "esclusiva" | "semi_esclusiva";
type TipoCliente = "privato" | "azienda";
type EsclusivaTier = "" | "100" | "70";

const CAPARRA_STANDARD = 1500;
const SECONDO_ACCONTO_STANDARD = 3000;

const ANTHRACITE = "#1e1b18";
const AMBER = "#e58c2c";
const GOLD = "#c9a24b";
const BORDER = "#e0ddd9";
const CREAM = "#faf8f5";

/** Importo digitato → numero (virgola o punto), con minimo 0. */
function parseAmount(raw: string): number {
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** "Mario Rossi" → { nome: "Mario", cognome: "Rossi" }; i nomi composti ("A & B") restano interi per verifica manuale. */
function splitNomeCompleto(full: string): { nome: string; cognome: string } {
  const value = full.trim();
  if (!value) return { nome: "", cognome: "" };
  if (/[&]/.test(value)) return { nome: value, cognome: "" };
  const idx = value.indexOf(" ");
  if (idx === -1) return { nome: value, cognome: "" };
  return { nome: value.slice(0, idx), cognome: value.slice(idx + 1).trim() };
}

interface GeneratedContract {
  absoluteUrl: string;
  qrCodeDataUrl: string;
  preventivo: string;
  whatsappText: string;
  intestatari: string;
  prezzo: number;
}

const euro = (value: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const sectionTitle = {
  fontSize: "0.72rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  fontWeight: 700,
  color: "#8a6a2f",
  margin: "0 0 0.8rem 0",
} as const;

const fieldGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
} as const;

function SegmentedButton({
  active,
  onClick,
  children,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        flex: "1 1 160px",
        textAlign: "left",
        padding: "0.8rem 1rem",
        borderRadius: "12px",
        cursor: "pointer",
        fontFamily: "inherit",
        border: `1.5px solid ${active ? AMBER : BORDER}`,
        background: active ? "#fff7ed" : "#ffffff",
        color: ANTHRACITE,
        boxShadow: active ? "0 4px 14px rgba(229,140,44,0.18)" : "none",
        transition: "all 0.15s ease",
      }}
    >
      <div style={{ fontWeight: 600, color: active ? "#b45f0c" : ANTHRACITE }}>{children}</div>
      {hint && <div style={{ fontSize: "0.8rem", color: "#6a6764", marginTop: "0.15rem" }}>{hint}</div>}
    </button>
  );
}

const cashRowStyle = (withBorder: boolean) =>
  ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "0.8rem 1rem",
    padding: "0.6rem 0",
    borderTop: withBorder ? `1px dashed ${BORDER}` : "none",
  }) as const;

function AmountInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
      <span style={{ fontWeight: 700, color: "#8a6a2f" }}>€</span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 130,
          padding: "0.55rem 0.7rem",
          borderRadius: "10px",
          border: `1.5px solid ${AMBER}`,
          background: "#fff7ed",
          color: ANTHRACITE,
          fontWeight: 700,
          fontSize: "1.05rem",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

export default function QuickContractPanel() {
  const searchParams = useSearchParams();

  const [tipoEvento, setTipoEvento] = useState<TipoEvento>("wedding");
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>("privato");
  const [nome, setNome] = useState(() => splitNomeCompleto(searchParams.get("nome") ?? "").nome);
  const [cognome, setCognome] = useState(() => splitNomeCompleto(searchParams.get("nome") ?? "").cognome);
  const [telefono, setTelefono] = useState(() => searchParams.get("telefono") ?? "");
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [partnerNome, setPartnerNome] = useState("");
  const [partnerCognome, setPartnerCognome] = useState("");
  const [ragioneSociale, setRagioneSociale] = useState("");
  const [partitaIva, setPartitaIva] = useState("");
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [sdi, setSdi] = useState("");
  const [pec, setPec] = useState("");
  const [dataEvento, setDataEvento] = useState(() => searchParams.get("data") ?? "");
  const [turno, setTurno] = useState<Turno>(() => (searchParams.get("turno") === "cena" ? "cena" : "pranzo"));
  const [tipoEsclusiva, setTipoEsclusiva] = useState<TipoEsclusiva>(() =>
    searchParams.get("tipo_esclusiva") === "semi_esclusiva" ? "semi_esclusiva" : "esclusiva"
  );
  const [semiFormula, setSemiFormula] = useState<SemiFormulaKey | "">(() => {
    const f = searchParams.get("formula");
    return f === "sala_bianca" || f === "sala_tufo" ? f : "";
  });
  const [esclusivaTier, setEsclusivaTier] = useState<EsclusivaTier>("");
  const [ospitiInput, setOspitiInput] = useState("");
  const [prezzoInput, setPrezzoInput] = useState(() => {
    const f = searchParams.get("formula");
    return f === "sala_bianca" || f === "sala_tufo" ? String(SEMI_ESCLUSIVA_PREZZO) : "";
  });
  // null = valore di default (non toccato da Roberto)
  const [caparraInput, setCaparraInput] = useState<string | null>(null);
  const [secondoInput, setSecondoInput] = useState<string | null>(null);
  const [opzioneId] = useState(() => searchParams.get("opzione") ?? "");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GeneratedContract | null>(null);

  const isWedding = tipoEvento === "wedding";
  const isAzienda = tipoCliente === "azienda";
  const prezzo = parseAmount(prezzoInput);
  const spazi = semiFormula ? SEMI_ESCLUSIVA_FORMULE[semiFormula].spazi : [];

  const cashflow = useMemo(() => {
    const caparra = caparraInput === null ? CAPARRA_STANDARD : parseAmount(caparraInput);
    const secondoAcconto =
      secondoInput === null ? (isWedding ? SECONDO_ACCONTO_STANDARD : 0) : parseAmount(secondoInput);
    const saldo = Math.max(0, prezzo - caparra - secondoAcconto);
    const overflow = prezzo > 0 && caparra + secondoAcconto > prezzo;
    return { caparra, secondoAcconto, saldo, overflow };
  }, [prezzo, caparraInput, secondoInput, isWedding]);

  const selectSemiFormula = (key: SemiFormulaKey) => {
    setSemiFormula(key);
    setPrezzoInput(String(SEMI_ESCLUSIVA_PREZZO));
  };

  const chooseEsclusiva = () => {
    setTipoEsclusiva("esclusiva");
    if (prezzoInput === String(SEMI_ESCLUSIVA_PREZZO)) setPrezzoInput("");
  };

  const applyEsclusivaPricing = (tier: EsclusivaTier, ospiti: string) => {
    const persone = Number(ospiti);
    if (tier && Number.isFinite(persone) && persone > 0) {
      const tariffa = tier === "100" ? ESCLUSIVA_TARIFFA_100_PLUS : ESCLUSIVA_TARIFFA_70_99;
      setPrezzoInput(String(persone * tariffa));
    }
  };

  const selectEsclusivaTier = (tier: Exclude<EsclusivaTier, "">) => {
    const next = esclusivaTier === tier ? "" : tier;
    setEsclusivaTier(next);
    applyEsclusivaPricing(next, ospitiInput);
  };

  const changeOspiti = (value: string) => {
    setOspitiInput(value);
    applyEsclusivaPricing(esclusivaTier, value);
  };

  const resetForm = () => {
    setTipoEvento("wedding");
    setTipoCliente("privato");
    setNome("");
    setCognome("");
    setTelefono("");
    setEmail("");
    setPartnerNome("");
    setPartnerCognome("");
    setRagioneSociale("");
    setPartitaIva("");
    setCodiceFiscale("");
    setSdi("");
    setPec("");
    setDataEvento("");
    setTurno("pranzo");
    setTipoEsclusiva("esclusiva");
    setSemiFormula("");
    setEsclusivaTier("");
    setOspitiInput("");
    setPrezzoInput("");
    setCaparraInput(null);
    setSecondoInput(null);
    setError("");
    setResult(null);
  };

  const validate = (): string => {
    if (isAzienda && !ragioneSociale.trim()) return "Inserisci la Ragione Sociale dell'azienda.";
    if (!nome.trim() || !cognome.trim()) {
      return isAzienda
        ? "Inserisci nome e cognome del referente."
        : "Inserisci nome e cognome del cliente.";
    }
    if (!telefono.trim()) return "Inserisci un numero di telefono.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Inserisci un indirizzo email valido.";
    if (!isAzienda && isWedding && (!partnerNome.trim() || !partnerCognome.trim())) {
      return "Inserisci nome e cognome del/della partner.";
    }
    if (!dataEvento) return "Seleziona la data dell'evento.";
    if (tipoEsclusiva === "semi_esclusiva" && !semiFormula) {
      return "Per la formula semi-esclusiva scegli Sala Bianca o Sala Tufo.";
    }
    if (!(prezzo > 0)) return "Inserisci il prezzo concordato.";
    if (cashflow.overflow) return "La somma di caparra e 2° acconto supera il prezzo: correggi gli importi.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await createQuickContract({
        nome: nome.trim(),
        cognome: cognome.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        partnerNome: isWedding && !isAzienda ? partnerNome.trim() : undefined,
        partnerCognome: isWedding && !isAzienda ? partnerCognome.trim() : undefined,
        tipoEvento,
        dataEvento,
        turno,
        tipoEsclusiva,
        spaziRiservati: tipoEsclusiva === "semi_esclusiva" ? spazi : [],
        prezzo,
        tipoCliente,
        ragioneSociale: isAzienda ? ragioneSociale.trim() : undefined,
        partitaIva: isAzienda ? partitaIva.trim() : undefined,
        codiceFiscale: isAzienda ? codiceFiscale.trim() : undefined,
        sdi: isAzienda ? sdi.trim() : undefined,
        pec: isAzienda ? pec.trim() : undefined,
        caparraPersonalizzata: cashflow.caparra,
        secondoAccontoPersonalizzato: cashflow.secondoAcconto,
        opzioneDaConvertireId: opzioneId || undefined,
      });

      if (!res.success) {
        setError(res.error || "Impossibile generare il contratto. Riprova.");
        return;
      }

      const referente = `${nome.trim()} ${cognome.trim()}`;
      const intestatari = isAzienda
        ? `${ragioneSociale.trim()} (rif. ${referente})`
        : isWedding && partnerNome.trim()
          ? `${referente} & ${partnerNome.trim()} ${partnerCognome.trim()}`
          : referente;

      setResult({
        absoluteUrl: res.absoluteUrl,
        qrCodeDataUrl: res.qrCodeDataUrl,
        preventivo: res.preventivo,
        whatsappText: res.whatsappText,
        intestatari,
        prezzo,
      });
    } catch (err) {
      console.error("Errore generazione contratto rapido:", err);
      setError("Errore di connessione durante la generazione del contratto. Riprova tra qualche istante.");
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <ContractLinkShare
        url={result.absoluteUrl}
        qrCodeDataUrl={result.qrCodeDataUrl}
        preventivo={result.preventivo}
        whatsappText={result.whatsappText}
        intestatari={result.intestatari}
        prezzo={result.prezzo}
        onClose={resetForm}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isLoading}
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 18px 50px rgba(30,27,24,0.08)",
        overflow: "hidden",
        marginBottom: "2rem",
      }}
    >
      <header
        style={{
          background: `linear-gradient(135deg, ${ANTHRACITE} 0%, #2e2924 100%)`,
          padding: "1.4rem 1.8rem",
          borderBottom: `3px solid ${GOLD}`,
        }}
      >
        <div
          style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600 }}
        >
          Accordo diretto · Canale B
        </div>
        <h1
          style={{
            margin: "0.15rem 0 0 0",
            textAlign: "left",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 400,
            fontSize: "1.7rem",
            color: "#ffffff",
          }}
        >
          Contratto Rapido
        </h1>
        <p style={{ margin: "0.3rem 0 0 0", color: "#bdb5aa", fontSize: "0.95rem" }}>
          Compila i dati concordati con gli sposi: il contratto, il link di firma e il QR Code si generano in un solo passaggio.
        </p>
      </header>

      <div style={{ padding: "1.8rem", background: CREAM, display: "grid", gap: "1.8rem" }}>
        {opzioneId && (
          <div
            style={{
              padding: "0.8rem 1rem",
              borderRadius: "12px",
              background: "#fff7ed",
              border: `1px solid ${AMBER}`,
              color: "#92400e",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            ⚡ Stai formalizzando un&apos;opzione rapida: i dati di contatto, la data e la formula sono precompilati.
            Verifica nome e cognome, poi inserisci il prezzo concordato.
          </div>
        )}

        <section>
          <h3 style={sectionTitle}>Tipo di cliente</h3>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            <SegmentedButton active={!isAzienda} onClick={() => setTipoCliente("privato")} hint="Persona fisica">
              👤 Privato
            </SegmentedButton>
            <SegmentedButton
              active={isAzienda}
              onClick={() => setTipoCliente("azienda")}
              hint="Ragione sociale, P.IVA, SDI / PEC"
            >
              🏢 Azienda
            </SegmentedButton>
          </div>
        </section>

        <section>
          <h3 style={sectionTitle}>Tipo di evento</h3>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            <SegmentedButton active={isWedding} onClick={() => setTipoEvento("wedding")} hint="Ricevimento di matrimonio">
              💍 Wedding
            </SegmentedButton>
            <SegmentedButton active={!isWedding} onClick={() => setTipoEvento("eventi")} hint="Eventi privati e aziendali">
              🥂 Eventi
            </SegmentedButton>
          </div>
        </section>

        {isAzienda && (
          <section>
            <h3 style={sectionTitle}>Dati aziendali</h3>
            <div style={fieldGrid}>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="qc-ragione-sociale">Ragione Sociale *</label>
                <input
                  id="qc-ragione-sociale"
                  type="text"
                  autoComplete="organization"
                  value={ragioneSociale}
                  onChange={(e) => setRagioneSociale(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="qc-piva">Partita IVA</label>
                <input id="qc-piva" type="text" inputMode="numeric" value={partitaIva} onChange={(e) => setPartitaIva(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="qc-cf">Codice Fiscale</label>
                <input id="qc-cf" type="text" value={codiceFiscale} onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())} />
              </div>
              <div className="form-group">
                <label htmlFor="qc-sdi">Codice SDI</label>
                <input id="qc-sdi" type="text" maxLength={7} value={sdi} onChange={(e) => setSdi(e.target.value.toUpperCase())} />
              </div>
              <div className="form-group">
                <label htmlFor="qc-pec">PEC</label>
                <input id="qc-pec" type="email" value={pec} onChange={(e) => setPec(e.target.value)} />
              </div>
            </div>
          </section>
        )}

        <section>
          <h3 style={sectionTitle}>
            {isAzienda ? "Referente (legale rappresentante)" : isWedding ? "Intestatario del contratto" : "Cliente"}
          </h3>
          <div style={fieldGrid}>
            <div className="form-group">
              <label htmlFor="qc-nome">{isAzienda ? "Nome referente *" : "Nome *"}</label>
              <input id="qc-nome" type="text" autoComplete="given-name" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="qc-cognome">{isAzienda ? "Cognome referente *" : "Cognome *"}</label>
              <input id="qc-cognome" type="text" autoComplete="family-name" value={cognome} onChange={(e) => setCognome(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="qc-telefono">Telefono *</label>
              <input
                id="qc-telefono"
                type="text"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+39 333 1234567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="qc-email">Email *</label>
              <input id="qc-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        </section>

        {isWedding && !isAzienda && (
          <section>
            <h3 style={sectionTitle}>Partner</h3>
            <div style={fieldGrid}>
              <div className="form-group">
                <label htmlFor="qc-partner-nome">Nome partner *</label>
                <input id="qc-partner-nome" type="text" value={partnerNome} onChange={(e) => setPartnerNome(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="qc-partner-cognome">Cognome partner *</label>
                <input id="qc-partner-cognome" type="text" value={partnerCognome} onChange={(e) => setPartnerCognome(e.target.value)} />
              </div>
            </div>
          </section>
        )}

        <section>
          <h3 style={sectionTitle}>Data e turno</h3>
          <div style={fieldGrid}>
            <div className="form-group">
              <label htmlFor="qc-data">Data evento *</label>
              <input id="qc-data" type="date" min={todayIso()} value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Turno *</label>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <SegmentedButton active={turno === "pranzo"} onClick={() => setTurno("pranzo")}>
                  ☀️ Pranzo
                </SegmentedButton>
                <SegmentedButton active={turno === "cena"} onClick={() => setTurno("cena")}>
                  🌙 Cena
                </SegmentedButton>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 style={sectionTitle}>Formula di concessione</h3>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            <SegmentedButton
              active={tipoEsclusiva === "esclusiva"}
              onClick={chooseEsclusiva}
              hint="Intera location, intera giornata"
            >
              Esclusiva
            </SegmentedButton>
            <SegmentedButton
              active={tipoEsclusiva === "semi_esclusiva"}
              onClick={() => setTipoEsclusiva("semi_esclusiva")}
              hint="Un turno, una sala e i relativi giardini"
            >
              Semi-esclusiva
            </SegmentedButton>
          </div>

          {tipoEsclusiva === "semi_esclusiva" && (
            <div style={{ marginTop: "1rem" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 500, marginBottom: "0.5rem" }}>Formula ufficiale *</div>
              <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                <SegmentedButton
                  active={semiFormula === "sala_bianca"}
                  onClick={() => selectSemiFormula("sala_bianca")}
                  hint={`${SEMI_ESCLUSIVA_FORMULE.sala_bianca.giardino} · € 7.000 fisse`}
                >
                  🏛️ Sala Bianca e relativi giardini
                </SegmentedButton>
                <SegmentedButton
                  active={semiFormula === "sala_tufo"}
                  onClick={() => selectSemiFormula("sala_tufo")}
                  hint={`${SEMI_ESCLUSIVA_FORMULE.sala_tufo.giardino} · € 7.000 fisse`}
                >
                  🏛️ Sala Tufo e relativi giardini
                </SegmentedButton>
              </div>
            </div>
          )}

          {tipoEsclusiva === "esclusiva" && (
            <div style={{ marginTop: "1rem" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                Tariffa base suggerita (+ IVA a persona)
              </div>
              <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                <SegmentedButton active={esclusivaTier === "100"} onClick={() => selectEsclusivaTier("100")}>
                  ≥ 100 persone (€{ESCLUSIVA_TARIFFA_100_PLUS}/persona base)
                </SegmentedButton>
                <SegmentedButton active={esclusivaTier === "70"} onClick={() => selectEsclusivaTier("70")}>
                  70-99 persone (€{ESCLUSIVA_TARIFFA_70_99}/persona base)
                </SegmentedButton>
              </div>
              {esclusivaTier && (
                <div className="form-group" style={{ maxWidth: 320, marginTop: "0.9rem" }}>
                  <label htmlFor="qc-ospiti">
                    Numero ospiti {esclusivaTier === "100" ? "(minimo 100)" : "(da 70 a 99)"}
                  </label>
                  <input
                    id="qc-ospiti"
                    type="number"
                    inputMode="numeric"
                    min={esclusivaTier === "100" ? 100 : 70}
                    max={esclusivaTier === "100" ? undefined : 99}
                    placeholder="Calcola il prezzo in automatico"
                    value={ospitiInput}
                    onChange={(e) => changeOspiti(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        <section>
          <h3 style={sectionTitle}>Condizioni economiche</h3>
          <div className="form-group" style={{ maxWidth: 320 }}>
            <label htmlFor="qc-prezzo">Prezzo concordato (€) *</label>
            <input
              id="qc-prezzo"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder="Es. 15000"
              value={prezzoInput}
              onChange={(e) => setPrezzoInput(e.target.value)}
            />
          </div>

          <div
            style={{
              marginTop: "1.2rem",
              background: "#ffffff",
              border: `1px solid ${BORDER}`,
              borderLeft: `4px solid ${GOLD}`,
              borderRadius: "12px",
              padding: "1rem 1.2rem",
            }}
          >
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#8a6a2f", marginBottom: "0.6rem", letterSpacing: "0.04em" }}>
              Ripartizione Pagamenti (importi modificabili)
            </div>

            <div style={cashRowStyle(false)}>
              <div style={{ flex: "1 1 220px" }}>
                <label htmlFor="qc-caparra" style={{ fontWeight: 600, color: ANTHRACITE }}>
                  Caparra confirmatoria (1° acconto)
                </label>
                <div style={{ fontSize: "0.8rem", color: "#6a6764" }}>Alla firma · bonifico a Santo Stefano S.r.l.</div>
              </div>
              <AmountInput
                id="qc-caparra"
                value={caparraInput ?? String(CAPARRA_STANDARD)}
                onChange={setCaparraInput}
              />
            </div>

            <div style={cashRowStyle(true)}>
              <div style={{ flex: "1 1 220px" }}>
                <label htmlFor="qc-secondo" style={{ fontWeight: 600, color: ANTHRACITE }}>
                  2° Acconto (a -6 mesi dall&apos;evento)
                </label>
                <div style={{ fontSize: "0.8rem", color: "#6a6764" }}>Destinato a Iovino Banqueting S.r.l.</div>
              </div>
              <AmountInput
                id="qc-secondo"
                value={secondoInput ?? String(isWedding ? SECONDO_ACCONTO_STANDARD : 0)}
                onChange={setSecondoInput}
              />
            </div>

            <div style={cashRowStyle(true)}>
              <div style={{ flex: "1 1 220px" }}>
                <div style={{ fontWeight: 600, color: ANTHRACITE }}>Saldo all&apos;evento</div>
                <div style={{ fontSize: "0.8rem", color: "#6a6764" }}>Prezzo − caparra − 2° acconto (ricalcolo immediato)</div>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "1.15rem",
                  color: cashflow.overflow ? "#b91c1c" : "#b45f0c",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {euro(cashflow.saldo)}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: `2px solid ${ANTHRACITE}`,
                marginTop: "0.4rem",
                paddingTop: "0.7rem",
                fontWeight: 700,
              }}
            >
              <span>Totale concordato</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{euro(prezzo)}</span>
            </div>

            {cashflow.overflow && (
              <div role="alert" style={{ marginTop: "0.6rem", fontSize: "0.82rem", fontWeight: 600, color: "#b91c1c" }}>
                ⚠️ La somma di caparra e 2° acconto supera il prezzo concordato.
              </div>
            )}

            <div style={{ marginTop: "0.8rem", paddingTop: "0.6rem", borderTop: `1px solid ${BORDER}`, fontSize: "0.78rem", color: "#6a6764", lineHeight: 1.4 }}>
              💡 <strong>Nota per Roberto:</strong> La caparra e il saldo location vanno al <strong>100% a Santo Stefano S.r.l.</strong>; il 2° acconto a -6 mesi è destinato a <strong>Iovino Banqueting S.r.l.</strong>
            </div>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.7rem",
              padding: "0.9rem 1rem",
              borderRadius: "12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
            }}
          >
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, fontWeight: 500 }}>{error}</div>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Chiudi avviso"
              style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer", display: "flex", padding: 2 }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.7rem",
            width: "100%",
            padding: "1.1rem 1.5rem",
            border: "none",
            borderRadius: "14px",
            fontFamily: "inherit",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#ffffff",
            cursor: isLoading ? "wait" : "pointer",
            opacity: isLoading ? 0.8 : 1,
            background: `linear-gradient(135deg, ${AMBER} 0%, #d17a22 100%)`,
            boxShadow: "0 12px 28px rgba(229,140,44,0.32)",
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={20} style={{ animation: "qc-spin 0.9s linear infinite" }} />
              Generazione in corso…
            </>
          ) : (
            "⚡ Genera Contratto & Link per Roberto"
          )}
        </button>
      </div>

      <style>{`@keyframes qc-spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
