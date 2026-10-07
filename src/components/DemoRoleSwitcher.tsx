"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";

interface RoleOption {
  id: string;
  name: string;
  badge: string;
  icon: string;
  user: string;
  pass: string;
  dest: string;
  accent: string;
}

const ROLES: RoleOption[] = [
  {
    id: "admin",
    name: "Direzione Roberto & Rosaria",
    badge: "Proprietari",
    icon: "🏛️",
    user: "admin",
    pass: "Roberto2026!",
    dest: "/admin",
    accent: "#e58c2c",
  },
  {
    id: "segreteria",
    name: "Tablet Segreteria",
    badge: "Tour iPad",
    icon: "📱",
    user: "segreteria",
    pass: "StaffTDA2026!",
    dest: "/segreteria",
    accent: "#1e3a2f",
  },
  {
    id: "planner",
    name: "Wedding Planner",
    badge: "-6 Mesi",
    icon: "💍",
    user: "planner",
    pass: "PlannerTDA2026!",
    dest: "/planner",
    accent: "#8b5cf6",
  },
  {
    id: "wedding_pre",
    name: "Sposi (In Opzione)",
    badge: "Pre-Firma 🔒",
    icon: "⏳",
    user: "wedding.demo",
    pass: "Sposi2027!",
    dest: "/cliente?mode=wedding&id=demo-pre-firma",
    accent: "#d97706",
  },
  {
    id: "wedding_signed",
    name: "Sposi (Firmato)",
    badge: "Area Sbloccata ✨",
    icon: "👰",
    user: "wedding.demo",
    pass: "Sposi2027!",
    dest: "/cliente?mode=wedding&id=demo-firmato",
    accent: "#ec4899",
  },
  {
    id: "privato",
    name: "Festa Privata",
    badge: "Cliente",
    icon: "🎉",
    user: "privato.demo",
    pass: "Festa2026!",
    dest: "/cliente?mode=privato&id=demo2",
    accent: "#059669",
  },
  {
    id: "storico",
    name: "Cliente Storico",
    badge: "Club TDA",
    icon: "⭐",
    user: "storico.demo",
    pass: "ClubTDA2026!",
    dest: "/cliente?mode=storico&id=demo4",
    accent: "#3b82f6",
  },
];

export default function DemoRoleSwitcher() {
  const pathname = usePathname();
  const [minimized, setMinimized] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  // Determina il ruolo attivo dalla rotta o parametri
  const getActiveRoleId = () => {
    if (pathname.startsWith("/admin")) return "admin";
    if (pathname.startsWith("/segreteria")) return "segreteria";
    if (pathname.startsWith("/planner")) return "planner";
    if (pathname.startsWith("/cliente")) {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get("mode");
        const id = params.get("id");
        if (mode === "privato") return "privato";
        if (mode === "storico") return "storico";
        if (id === "demo-pre-firma" || id === "demo1") return "wedding_pre";
        if (id === "demo-firmato" || id === "demo-signed") return "wedding_signed";
      }
      return "wedding_signed";
    }
    return null;
  };

  const activeId = getActiveRoleId();

  const handleSwitchRole = async (role: RoleOption) => {
    setSwitchingTo(role.id);
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: role.user, password: role.pass }),
      });
      window.location.href = role.dest;
    } catch {
      window.location.href = role.dest;
    }
  };

  return (
    <aside
      aria-label="Demo Role Switcher"
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        zIndex: 99999,
        fontFamily: "'Outfit', -apple-system, sans-serif",
      }}
    >
      {minimized ? (
        <button
          type="button"
          onClick={() => setMinimized(false)}
          style={{
            background: "rgba(30, 27, 24, 0.95)",
            color: "#ffffff",
            border: "1px solid rgba(229, 140, 44, 0.4)",
            backdropFilter: "blur(12px)",
            padding: "0.7rem 1.2rem",
            borderRadius: "50px",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <span style={{ fontSize: "1.1rem" }}>🎭</span>
          <span>Simulatore Ruoli</span>
          <span
            style={{
              background: "#e58c2c",
              color: "#fff",
              padding: "0.15rem 0.5rem",
              borderRadius: "12px",
              fontSize: "0.72rem",
              textTransform: "uppercase",
            }}
          >
            {activeId || "Live"}
          </span>
        </button>
      ) : (
        <div
          style={{
            background: "rgba(30, 27, 24, 0.96)",
            color: "#ffffff",
            border: "1px solid rgba(229, 140, 44, 0.35)",
            backdropFilter: "blur(16px)",
            borderRadius: "20px",
            padding: "1rem 1.2rem",
            boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
            maxWidth: "720px",
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          {/* Header Switcher */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              paddingBottom: "0.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.1rem" }}>🎭</span>
              <span
                style={{
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  color: "#e58c2c",
                  fontWeight: 800,
                }}
              >
                Simulatore Esperienza Utente (Consegna Roberto & Rosaria)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMinimized(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "#a8a29e",
                cursor: "pointer",
                fontSize: "1rem",
                padding: "0.2rem 0.4rem",
              }}
              title="Riduci a pillola"
            >
              ✕
            </button>
          </div>

          {/* Bottoni dei 6 Ruoli */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {ROLES.map((r) => {
              const isActive = activeId === r.id;
              const isLoading = switchingTo === r.id;

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSwitchRole(r)}
                  disabled={isLoading}
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)"
                      : "rgba(255,255,255,0.06)",
                    border: isActive
                      ? "1px solid #e58c2c"
                      : "1px solid rgba(255,255,255,0.12)",
                    color: "#ffffff",
                    padding: "0.5rem 0.9rem",
                    borderRadius: "12px",
                    fontSize: "0.82rem",
                    fontWeight: isActive ? 800 : 600,
                    cursor: isLoading ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    boxShadow: isActive
                      ? "0 4px 14px rgba(229,140,44,0.4)"
                      : "none",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>{r.icon}</span>
                  <span>{isLoading ? "Accesso..." : r.name}</span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      background: "rgba(0,0,0,0.25)",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "6px",
                      color: isActive ? "#fff" : "#d6d3d1",
                    }}
                  >
                    {r.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
