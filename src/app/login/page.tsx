"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface DemoAccount {
  role: string;
  label: string;
  badge: string;
  user: string;
  pass: string;
  dest: string;
  icon: string;
  color: string;
  desc: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "admin",
    label: "Amministrazione Direzionale",
    badge: "Direzione",
    user: "admin",
    pass: "Roberto2026!",
    dest: "/admin",
    icon: "🏛️",
    color: "#e58c2c",
    desc: "Roberto Sola & Rosaria Iovino • Split 60/40, Acconti & Cassa",
  },
  {
    role: "segreteria",
    label: "Segreteria & Accoglienza",
    badge: "Tablet Parco",
    user: "segreteria",
    pass: "StaffTDA2026!",
    dest: "/segreteria",
    icon: "📱",
    color: "#1e3a2f",
    desc: "Tour Location iPad • Lead Visit Sheet • Zero Dati Finanziari",
  },
  {
    role: "planner",
    label: "Wedding & Event Planner",
    badge: "Subentro -6 Mesi",
    user: "planner",
    pass: "PlannerTDA2026!",
    dest: "/planner",
    icon: "💍",
    color: "#8b5cf6",
    desc: "Coordinamento Operativo • Dossier 360° Sposi pre-popolato",
  },
  {
    role: "wedding",
    label: "Cliente Wedding",
    badge: "Sposi Attivi",
    user: "wedding.demo",
    pass: "Sposi2027!",
    dest: "/cliente?mode=wedding&id=demo1",
    icon: "👰",
    color: "#ec4899",
    desc: "Marco & Sofia • Wedding Diary, Acconti & AI Concierge",
  },
  {
    role: "privato",
    label: "Cliente Evento Privato",
    badge: "Feste & Ricorrenze",
    user: "privato.demo",
    pass: "Festa2026!",
    dest: "/cliente?mode=privato&id=demo2",
    icon: "🎉",
    color: "#059669",
    desc: "Famiglia Sola • Portale Snello per Feste, Lauree e Compleanni",
  },
  {
    role: "storico",
    label: "Cliente Storico & Club TDA",
    badge: "Club & Ticketing",
    user: "storico.demo",
    pass: "ClubTDA2026!",
    dest: "/cliente?mode=storico&id=demo4",
    icon: "⭐",
    color: "#3b82f6",
    desc: "Post-Evento • Prezzi Mascherati, Prevendite 48h & Ticket Villa",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeRoleLogging, setActiveRoleLogging] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performLogin = async (userToSubmit: string, passToSubmit: string) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userToSubmit, password: passToSubmit }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Credenziali non valide. Riprova.");
        setLoading(false);
        setActiveRoleLogging(null);
        return;
      }

      // Reindirizzamento intelligente:
      // Se redirectParam è presente ed è coerente col ruolo, usalo; altrimenti usa redirectUrl restituito dal server
      let target = data.redirectUrl || "/";
      if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
        // Se il ruolo è compatibile con la rotta richiesta
        const role = data.user?.role;
        if (
          (redirectParam.startsWith("/admin") && role === "admin") ||
          (redirectParam.startsWith("/segreteria") && (role === "segreteria" || role === "admin")) ||
          (redirectParam.startsWith("/planner") && (role === "planner" || role === "admin")) ||
          (redirectParam.startsWith("/cliente") && (["wedding", "privato", "storico", "admin"].includes(role)))
        ) {
          target = redirectParam;
        }
      }

      router.push(target);
      router.refresh();
    } catch {
      setErrorMessage("Errore di connessione con il server. Riprova tra poco.");
      setLoading(false);
      setActiveRoleLogging(null);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Inserisci username e password per accedere.");
      return;
    }
    performLogin(username.trim(), password);
  };

  const handleQuickLogin = (demo: DemoAccount) => {
    setUsername(demo.user);
    setPassword(demo.pass);
    setActiveRoleLogging(demo.role);
    performLogin(demo.user, demo.pass);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e1b18 0%, #2a241d 50%, #171513 100%)",
        color: "#fcfbf9",
        fontFamily: "'Outfit', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
      }}
    >
      {/* Container Centrale Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          background: "rgba(35, 30, 26, 0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(229, 140, 44, 0.3)",
          borderRadius: "20px",
          padding: "2.5rem 2.2rem",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(229,140,44,0.1)",
        }}
      >
        {/* Header con Logo e Titolo di Prestigio */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img
            src="/tda-simbolo.png"
            alt="La Terra degli Aranci"
            style={{
              height: "72px",
              width: "auto",
              objectFit: "contain",
              marginBottom: "1rem",
              filter: "drop-shadow(0 4px 12px rgba(229,140,44,0.3))",
            }}
          />
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: "#e58c2c",
              fontWeight: 700,
              marginBottom: "0.4rem",
            }}
          >
            ECOSISTEMA DIGITALE INTEGRATO
          </div>
          <h1
            style={{
              fontFamily: "Georgia, 'Playfair Display', serif",
              fontSize: "2rem",
              margin: "0 0 0.5rem 0",
              color: "#ffffff",
              fontWeight: 600,
            }}
          >
            La Terra degli Aranci
          </h1>
          <p style={{ color: "#a8a29e", fontSize: "0.95rem", margin: 0 }}>
            Pannello di autenticazione unificato • Seleziona il tuo profilo operativo
          </p>
        </div>

        {/* Banner Notifica Redirect / Errore */}
        {redirectParam && (
          <div
            style={{
              background: "rgba(229, 140, 44, 0.15)",
              border: "1px solid rgba(229, 140, 44, 0.4)",
              borderRadius: "10px",
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              fontSize: "0.85rem",
              color: "#fbd38d",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>🔒</span>
            <span>Questa pagina richiede autenticazione. Accedi per continuare.</span>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "10px",
              padding: "0.85rem 1rem",
              marginBottom: "1.5rem",
              fontSize: "0.9rem",
              color: "#fca5a5",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form di Accesso Diretto */}
        <form onSubmit={handleFormSubmit} style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div>
              <label
                htmlFor="username"
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#d6d3d1",
                  marginBottom: "0.4rem",
                }}
              >
                Nome Utente
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="es. admin, segreteria, planner, wedding.demo..."
                disabled={loading}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  height: "48px",
                  padding: "0 1rem",
                  background: "#171513",
                  border: "1px solid #44403c",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#e58c2c")}
                onBlur={(e) => (e.target.style.borderColor = "#44403c")}
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.4rem",
                }}
              >
                <label
                  htmlFor="password"
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#d6d3d1",
                  }}
                >
                  Password Operativa
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#e58c2c",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    padding: "0 4px",
                  }}
                >
                  {showPassword ? "Nascondi" : "Mostra"}
                </button>
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={loading}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  height: "48px",
                  padding: "0 1rem",
                  background: "#171513",
                  border: "1px solid #44403c",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#e58c2c")}
                onBlur={(e) => (e.target.style.borderColor = "#44403c")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                height: "50px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(90deg, #e58c2c 0%, #d47b1e 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(229,140,44,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                marginTop: "0.5rem",
                transition: "transform 0.15s, box-shadow 0.15s",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading && !activeRoleLogging ? (
                <span>Accesso in corso... ⏳</span>
              ) : (
                <span>Accedi all&apos;Ecosistema →</span>
              )}
            </button>
          </div>
        </form>

        {/* Separatore Decorativo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            margin: "2rem 0 1.5rem 0",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "rgba(229,140,44,0.2)" }} />
          <span
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "#c5a059",
              fontWeight: 700,
            }}
          >
            Accesso Rapido Demo (1-Click)
          </span>
          <div style={{ flex: 1, height: "1px", background: "rgba(229,140,44,0.2)" }} />
        </div>

        <p
          style={{
            fontSize: "0.85rem",
            color: "#a8a29e",
            textAlign: "center",
            marginBottom: "1.2rem",
          }}
        >
          Fai click su uno dei 6 profili operativi predefiniti per accedere istantaneamente con le credenziali preconfigurate:
        </p>

        {/* Griglia 6 Profili Demo 1-Click */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "0.85rem",
          }}
        >
          {DEMO_ACCOUNTS.map((demo) => {
            const isThisLogging = activeRoleLogging === demo.role && loading;
            return (
              <button
                key={demo.role}
                type="button"
                onClick={() => handleQuickLogin(demo)}
                disabled={loading}
                style={{
                  background: "#1a1714",
                  border: "1px solid #38332c",
                  borderRadius: "12px",
                  padding: "0.9rem 1rem",
                  textAlign: "left",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  transition: "all 0.2s ease",
                  opacity: loading && !isThisLogging ? 0.6 : 1,
                  minHeight: "78px",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = "#e58c2c";
                    e.currentTarget.style.background = "#241f1a";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = "#38332c";
                    e.currentTarget.style.background = "#1a1714";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>{demo.icon}</span>
                    <strong style={{ fontSize: "0.92rem", color: "#ffffff" }}>
                      {demo.label}
                    </strong>
                  </div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: "rgba(229,140,44,0.15)",
                      color: "#e58c2c",
                      border: "1px solid rgba(229,140,44,0.3)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isThisLogging ? "Entrando... ⏳" : demo.badge}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "#9ca3af",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "2px",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "230px" }}>
                    {demo.desc}
                  </span>
                  <code
                    style={{
                      fontSize: "0.72rem",
                      background: "#0c0a09",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      color: "#fbbf24",
                    }}
                  >
                    {demo.user}
                  </code>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "#1e1b18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#e58c2c",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Caricamento autenticazione...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
