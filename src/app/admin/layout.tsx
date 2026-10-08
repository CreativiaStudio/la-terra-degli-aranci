"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

/**
 * Information Architecture a 5 Pilastri.
 * Le voci operative principali sono separate dalle impostazioni di piattaforma.
 */
const PILLARS: NavItem[] = [
  { href: "/admin", label: "Appuntamenti", icon: "📅" },
  { href: "/admin/eventi", label: "Eventi", icon: "💍" },
  { href: "/admin/contratti", label: "Contratti", icon: "✍️" },
  { href: "/admin/clienti", label: "Clienti & Club TDA", icon: "👥" },
  { href: "/admin/cassa", label: "Cassa", icon: "💶" },
];

const SETTINGS: NavItem[] = [
  { href: "/admin/catalogo", label: "Listino servizi", icon: "⚙️" },
  { href: "/admin/articoli", label: "Blog", icon: "📰" },
  { href: "/admin/scatola-nera", label: "Scatola Nera", icon: "📟" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");

  const isActive = (item: NavItem) =>
    pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

  const renderItem = (item: NavItem) => {
    const active = isActive(item);
    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? item.label : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "0.85rem 1rem",
          borderRadius: "10px",
          textDecoration: "none",
          fontWeight: active ? "700" : "500",
          fontSize: "0.95rem",
          color: active ? "#ffffff" : "#b0aba5",
          background: active ? "linear-gradient(90deg, #e58c2c 0%, #d47b1e 100%)" : "transparent",
          boxShadow: active ? "0 4px 12px rgba(229,140,44,0.3)" : "none",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{item.icon}</span>
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fcfbfa" }}>
      {/* Sidebar Enterprise Navigation */}
      <aside
        style={{
          width: collapsed ? "80px" : "270px",
          background: "#1e1b18",
          color: "#fcfbfa",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 100,
          boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header Sidebar Logo */}
        <div
          style={{
            padding: "1.8rem 1.5rem",
            borderBottom: "1px solid #332f2b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {!collapsed && (
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  color: "#e58c2c",
                  fontWeight: "bold",
                  display: "block",
                }}
              >
                SUITE ENTERPRISE
              </span>
              <h2 style={{ margin: "0.2rem 0 0 0", fontFamily: "serif", fontSize: "1.25rem", color: "#ffffff" }}>
                La Terra degli Aranci
              </h2>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "transparent",
              border: "none",
              color: "#aaa",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "0.4rem",
              borderRadius: "6px",
            }}
            title={collapsed ? "Espandi Menu" : "Riduci Menu"}
          >
            {collapsed ? "➡️" : "⬅️"}
          </button>
        </div>

        {/* Ricerca rapida */}
        {!collapsed && (
          <div style={{ padding: "1rem 1.2rem 0" }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca sposi, data, evento..."
              aria-label="Ricerca rapida"
              style={{
                width: "100%",
                padding: "0.65rem 0.9rem",
                borderRadius: "10px",
                border: "1px solid #3a352f",
                background: "#26221e",
                color: "#fcfbfa",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
          </div>
        )}

        {/* Navigation Items */}
        <nav
          style={{
            padding: "1.2rem 0.8rem",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            overflowY: "auto",
          }}
        >
          {PILLARS.map(renderItem)}

          {/* Separatore Impostazioni */}
          <div
            style={{
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid #332f2b",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {!collapsed && (
              <span
                style={{
                  fontSize: "0.68rem",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  color: "#6f6a64",
                  fontWeight: 700,
                  padding: "0 1rem 0.2rem",
                }}
              >
                Impostazioni
              </span>
            )}
            {SETTINGS.map(renderItem)}
          </div>
        </nav>

        {/* Footer Sidebar Admin User Profile */}
        <div
          style={{
            padding: "1.2rem 1.5rem",
            borderTop: "1px solid #332f2b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.8rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", overflow: "hidden" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#e58c2c",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              RS
            </div>
            {!collapsed && (
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#fff", whiteSpace: "nowrap" }}>
                  Roberto Sola
                </div>
                <small style={{ color: "#888", display: "block" }}>Amministratore TDA</small>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } catch {}
              window.location.href = "/login";
            }}
            title="Disconnetti"
            style={{
              background: "transparent",
              border: "1px solid #44403c",
              color: "#aaa",
              padding: "0.4rem 0.6rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {collapsed ? "⏻" : "Esci ⏻"}
          </button>
        </div>
      </aside>

      {/* Main Page Area — padding-bottom per non coprire contenuti col DemoRoleSwitcher */}
      <main
        style={{
          flex: 1,
          padding: "2rem 3rem",
          paddingBottom: "5rem",
          overflowY: "auto",
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
