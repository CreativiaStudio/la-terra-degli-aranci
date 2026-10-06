"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, Mail, QrCode, ShieldCheck, X } from "lucide-react";

interface ContractLinkShareProps {
  url: string;
  qrCodeDataUrl?: string;
  preventivo: string;
  whatsappText?: string;
  intestatari: string;
  prezzo: number;
  onClose?: () => void;
}

const ANTHRACITE = "#1e1b18";
const AMBER = "#e58c2c";
const GOLD = "#c9a24b";
const WARM_WHITE = "#fcfbf9";
const BORDER = "#e0ddd9";

function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export default function ContractLinkShare({
  url,
  qrCodeDataUrl,
  preventivo,
  whatsappText,
  intestatari,
  prezzo,
  onClose,
}: ContractLinkShareProps) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const messageText =
    whatsappText ||
    `Gentili ${intestatari}, ecco il link per firmare il contratto presso La Terra degli Aranci (preventivo ${preventivo}):\n${url}`;

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(messageText)}`;
  const mailSubject = `Il tuo contratto - La Terra degli Aranci (Preventivo ${preventivo})`;
  const mailHref = `mailto:?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(messageText)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      inputRef.current?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2200);
  };

  const actionBase = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.6rem",
    padding: "0.95rem 1.2rem",
    borderRadius: "12px",
    fontWeight: 600,
    fontSize: "1rem",
    textDecoration: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  } as const;

  return (
    <section
      aria-label="Contratto pronto per la firma"
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 18px 50px rgba(30,27,24,0.10)",
        overflow: "hidden",
        marginBottom: "2rem",
      }}
    >
      <header
        style={{
          background: `linear-gradient(135deg, ${ANTHRACITE} 0%, #2e2924 100%)`,
          color: "#f5efe6",
          padding: "1.4rem 1.8rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          borderBottom: `3px solid ${GOLD}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(34,197,94,0.16)",
              border: "1px solid rgba(34,197,94,0.5)",
              color: "#4ade80",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={24} />
          </span>
          <div>
            <div
              style={{
                fontSize: "0.7rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: GOLD,
                fontWeight: 600,
              }}
            >
              Accordo registrato
            </div>
            <h2
              style={{
                margin: 0,
                padding: 0,
                border: "none",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontWeight: 400,
                fontSize: "1.55rem",
                color: "#ffffff",
              }}
            >
              Contratto Pronto per la Firma
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <span
            style={{
              background: "rgba(201,162,75,0.15)",
              border: `1px solid ${GOLD}`,
              color: "#f3d98f",
              padding: "0.4rem 0.9rem",
              borderRadius: "999px",
              fontSize: "0.85rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            Preventivo {preventivo}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi"
              title="Chiudi e crea un nuovo contratto"
              style={{
                background: "transparent",
                border: "1px solid #4a443e",
                color: "#cfc8bf",
                borderRadius: "8px",
                padding: "0.4rem",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      <div style={{ padding: "2rem 1.8rem", background: WARM_WHITE }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 600, color: ANTHRACITE }}>{intestatari}</div>
          <div style={{ color: "#6a6764", marginTop: "0.2rem" }}>
            Prezzo concordato{" "}
            <strong style={{ color: AMBER, fontWeight: 600 }}>{formatEuro(prezzo)}</strong>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
          <div
            style={{
              padding: "1rem",
              background: "#ffffff",
              borderRadius: "18px",
              border: `2px solid ${GOLD}`,
              boxShadow: "0 10px 30px rgba(201,162,75,0.18)",
            }}
          >
            {qrCodeDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrCodeDataUrl}
                alt={`QR Code per la firma del contratto, preventivo ${preventivo}`}
                width={288}
                height={288}
                style={{
                  display: "block",
                  width: "min(288px, 70vw)",
                  height: "auto",
                  aspectRatio: "1 / 1",
                  imageRendering: "pixelated",
                }}
              />
            ) : (
              <div
                style={{
                  width: 288,
                  maxWidth: "70vw",
                  aspectRatio: "1 / 1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  color: "#9a958f",
                  background: "#faf9f7",
                }}
              >
                <QrCode size={64} />
                <span style={{ fontSize: "0.85rem" }}>QR Code non disponibile</span>
              </div>
            )}
          </div>
          <p style={{ marginTop: "0.9rem", color: "#6a6764", fontSize: "0.92rem", textAlign: "center", maxWidth: 380 }}>
            Inquadra il codice con la fotocamera del cellulare: gli sposi possono firmare subito, sul posto.
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="contract-link-input"
            style={{
              display: "block",
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#6a6764",
              marginBottom: "0.4rem",
              fontWeight: 600,
            }}
          >
            Link firmato personale
          </label>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <input
              id="contract-link-input"
              ref={inputRef}
              type="text"
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              style={{
                flex: "1 1 260px",
                minWidth: 0,
                background: "#ffffff",
                color: ANTHRACITE,
                cursor: "text",
                fontSize: "0.88rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            />
            <button
              type="button"
              onClick={handleCopy}
              title={copied ? "Link copiato negli appunti" : "Copia il link negli appunti"}
              style={{
                ...actionBase,
                padding: "0.75rem 1.3rem",
                minWidth: 150,
                border: "none",
                background: copied ? "#16a34a" : ANTHRACITE,
                color: "#ffffff",
                transition: "background 0.2s ease",
              }}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span aria-live="polite">{copied ? "Copiato!" : "Copia Link"}</span>
            </button>
          </div>
        </div>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...actionBase,
            background: "linear-gradient(135deg, #25d366 0%, #128c4a 100%)",
            color: "#ffffff",
            fontSize: "1.15rem",
            padding: "1.1rem 1.4rem",
            boxShadow: "0 10px 24px rgba(18,140,74,0.30)",
            marginBottom: "0.8rem",
          }}
        >
          <WhatsAppIcon size={26} />
          Invia su WhatsApp
        </a>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "0.8rem",
          }}
        >
          <a
            href={mailHref}
            style={{
              ...actionBase,
              background: "#ffffff",
              color: ANTHRACITE,
              border: `1px solid ${BORDER}`,
            }}
          >
            <Mail size={19} />
            Invia Email
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...actionBase,
              background: `linear-gradient(135deg, ${AMBER} 0%, #d17a22 100%)`,
              color: "#ffffff",
              boxShadow: "0 8px 20px rgba(229,140,44,0.30)",
            }}
          >
            <ExternalLink size={19} />
            Apri Contratto Ora
          </a>
        </div>
      </div>
    </section>
  );
}
