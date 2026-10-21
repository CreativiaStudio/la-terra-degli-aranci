"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitOpenDayEntryAction, trackOpenDayScanAction } from "./actions";
import { normalizePhoneNumber } from "@/lib/phoneHelper";

export default function OpenDayWelcomePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [nomiSposi, setNomiSposi] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dataSognata, setDataSognata] = useState("");
  const [periodoSognato, setPeriodoSognato] = useState("Primavera / Estate 2027");
  const [useSpecificDate, setUseSpecificDate] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tracciamento automatico della scansione QR all'atterraggio
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const src = urlParams.get("src") || urlParams.get("utm_source") || "qr";
      trackOpenDayScanAction(src, navigator.userAgent);
    } catch {
      // ignore
    }
  }, []);

  // Normalizzazione preview live del telefono
  const phonePreview = telefono.trim() ? normalizePhoneNumber(telefono) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nomiSposi.trim()) {
      setErrorMsg("Inserite i vostri nomi (es: Sofia & Marco).");
      return;
    }

    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      setErrorMsg("Inserite un indirizzo email valido per salvare il diario.");
      return;
    }

    if (!telefono.trim() || (phonePreview && !phonePreview.valid)) {
      setErrorMsg(phonePreview?.error || "Inserite un numero di cellulare valido.");
      return;
    }

    startTransition(async () => {
      const res = await submitOpenDayEntryAction({
        nomiSposi: nomiSposi.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        dataSognata: useSpecificDate ? dataSognata : undefined,
        periodoSognato: !useSpecificDate ? periodoSognato : undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Si è verificato un errore. Riprova.");
      } else if (res.redirectUrl) {
        router.push(res.redirectUrl);
      }
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #FAF8F5 0%, #F5EFE6 50%, #ECE3D4 100%)",
        color: "#2B2B2B",
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "1.5rem 1rem 3rem 1rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Brand Header */}
      <header
        style={{
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          marginTop: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "80px",
            height: "80px",
            marginBottom: "0.75rem",
            background: "#ffffff",
            borderRadius: "50%",
            padding: "8px",
            boxShadow: "0 8px 24px rgba(45, 90, 39, 0.12)",
            border: "1.5px solid rgba(229, 140, 44, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="/tda-simbolo.png"
            alt="La Terra degli Aranci"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>

        <span
          style={{
            fontSize: "0.78rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#2D5A27",
            fontWeight: 700,
            marginBottom: "0.3rem",
          }}
        >
          Open Day • La Terra degli Aranci
        </span>

        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            lineHeight: 1.25,
            color: "#2B2B2B",
            margin: "0 0 0.5rem 0",
          }}
        >
          Il Vostro Wedding Diary
        </h1>

        <p
          style={{
            fontSize: "0.95rem",
            color: "#514D48",
            lineHeight: 1.5,
            margin: 0,
            maxWidth: "380px",
          }}
        >
          Mentre passeggiate tra il parco botanico e le sale, componete i desideri del vostro matrimonio da sogno.
        </p>
      </header>

      {/* Main Form Card */}
      <main
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "1.75rem 1.5rem",
          boxShadow: "0 16px 40px rgba(81, 77, 72, 0.08), 0 2px 8px rgba(0,0,0,0.04)",
          border: "1px solid rgba(229, 140, 44, 0.15)",
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          
          {/* Nomi Sposi */}
          <div>
            <label
              htmlFor="nomiSposi"
              style={{
                display: "block",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "#2B2B2B",
                marginBottom: "0.4rem",
              }}
            >
              💍 I Vostri Nomi
            </label>
            <input
              id="nomiSposi"
              type="text"
              required
              placeholder="es. Sofia & Marco"
              value={nomiSposi}
              onChange={(e) => setNomiSposi(e.target.value)}
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                borderRadius: "14px",
                border: "1.5px solid #E8E2D8",
                background: "#FAF8F5",
                fontSize: "1rem",
                color: "#2B2B2B",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#E58C2C";
                e.target.style.boxShadow = "0 0 0 3px rgba(229, 140, 44, 0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E8E2D8";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Email */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
              <label
                htmlFor="email"
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "#2B2B2B",
                }}
              >
                ✉️ Indirizzo Email
              </label>
              <span style={{ fontSize: "0.74rem", color: "#8E8880" }}>Custodisce il vostro diario</span>
            </div>
            <input
              id="email"
              type="email"
              required
              placeholder="nome@esempio.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                borderRadius: "14px",
                border: "1.5px solid #E8E2D8",
                background: "#FAF8F5",
                fontSize: "1rem",
                color: "#2B2B2B",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#E58C2C";
                e.target.style.boxShadow = "0 0 0 3px rgba(229, 140, 44, 0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E8E2D8";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Cellulare WhatsApp */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
              <label
                htmlFor="telefono"
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "#2B2B2B",
                }}
              >
                📱 Cellulare / WhatsApp
              </label>
              {phonePreview?.valid && (
                <span style={{ fontSize: "0.74rem", color: "#2D5A27", fontWeight: 600 }}>
                  ✓ {phonePreview.display}
                </span>
              )}
            </div>
            <input
              id="telefono"
              type="tel"
              required
              placeholder="es. 333 1234567"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                borderRadius: "14px",
                border: `1.5px solid ${phonePreview?.valid ? "#2D5A27" : "#E8E2D8"}`,
                background: "#FAF8F5",
                fontSize: "1rem",
                color: "#2B2B2B",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#E58C2C";
                e.target.style.boxShadow = "0 0 0 3px rgba(229, 140, 44, 0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = phonePreview?.valid ? "#2D5A27" : "#E8E2D8";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Periodo o Data Sognata */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <label
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "#2B2B2B",
                }}
              >
                🌿 Periodo o Data Desiderata
              </label>
              <button
                type="button"
                onClick={() => setUseSpecificDate(!useSpecificDate)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "0.76rem",
                  color: "#E58C2C",
                  cursor: "pointer",
                  fontWeight: 600,
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                {useSpecificDate ? "Scegli periodo generico" : "Hai già una data precisa?"}
              </button>
            </div>

            {useSpecificDate ? (
              <input
                type="date"
                value={dataSognata}
                onChange={(e) => setDataSognata(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.85rem 1rem",
                  borderRadius: "14px",
                  border: "1.5px solid #E8E2D8",
                  background: "#FAF8F5",
                  fontSize: "0.95rem",
                  color: "#2B2B2B",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            ) : (
              <select
                value={periodoSognato}
                onChange={(e) => setPeriodoSognato(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.85rem 1rem",
                  borderRadius: "14px",
                  border: "1.5px solid #E8E2D8",
                  background: "#FAF8F5",
                  fontSize: "0.95rem",
                  color: "#2B2B2B",
                  outline: "none",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
              >
                <option value="Primavera / Estate 2027">Primavera / Estate 2027</option>
                <option value="Autunno / Inverno 2027">Autunno / Inverno 2027</option>
                <option value="Primavera / Estate 2028">Primavera / Estate 2028</option>
                <option value="Anno 2026 (Date residue)">Anno 2026 (Date residue)</option>
                <option value="Periodo ancora da definire">Periodo ancora da definire</option>
              </select>
            )}
          </div>

          {/* Errore */}
          {errorMsg && (
            <div
              style={{
                background: "#FDEDEC",
                color: "#C0392B",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                fontSize: "0.88rem",
                lineHeight: 1.4,
                border: "1px solid #FADBD8",
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            style={{
              width: "100%",
              padding: "1rem 1.4rem",
              background: "linear-gradient(135deg, #E58C2C 0%, #D47B1E 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "16px",
              fontSize: "1.05rem",
              fontWeight: 700,
              cursor: isPending ? "wait" : "pointer",
              boxShadow: "0 8px 20px rgba(229, 140, 44, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "transform 0.15s, box-shadow 0.15s",
              marginTop: "0.5rem",
              opacity: isPending ? 0.8 : 1,
            }}
          >
            {isPending ? (
              <span>⏳ Apertura del vostro Diario...</span>
            ) : (
              <span>🌿 Inizia il Vostro Wedding Diary</span>
            )}
          </button>

          {/* Text Note Riformulata (Direzione TDA) */}
          <p
            style={{
              fontSize: "0.82rem",
              color: "#514D48",
              textAlign: "center",
              lineHeight: 1.5,
              margin: "0.2rem 0 0 0",
            }}
          >
            Le vostre preferenze verranno salvate e condivise con la Direzione de La Terra degli Aranci, potrete sempre modificarle nella vostra Area.
          </p>
        </form>
      </main>

      {/* Footer Branding */}
      <footer
        style={{
          marginTop: "2rem",
          textAlign: "center",
          fontSize: "0.8rem",
          color: "#8E8880",
        }}
      >
        <p style={{ margin: 0, fontWeight: 500 }}>
          La Terra degli Aranci • Napoli
        </p>
        <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.74rem" }}>
          Un Giardino di Emozioni nel Cuore di Napoli
        </p>
      </footer>
    </div>
  );
}
