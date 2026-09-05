"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: "/admin", label: "Pannello Direzionale", icon: "📊" },
    { href: "/admin/eventi-cassa", label: "Controllo Cassa & Eventi", icon: "💰" },
    { href: "/admin/simulatore", label: "Simulatore Fiscale & Eventi", icon: "🧮" },
    { href: "/admin/crm", label: "CRM", icon: "👥" },
    { href: "/admin/articoli", label: "Approvazione Blog", icon: "📰" },
    { href: "/admin/eventi-attivi", label: "Eventi Attivi & Chat", icon: "💬" },
    { href: "/admin/calendario", label: "Calendario Date Villa", icon: "📅" },
    { href: "/admin/acconti", label: "Acconti & Scadenze", icon: "💶" },
    { href: "/admin/wedding-diary", label: "Wedding Diary Sposi", icon: "📖" },
    { href: "/admin/catalogo", label: "Catalogo & Listino TDA", icon: "⚙️" },
  ];

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
          boxShadow: "4px 0 20px rgba(0,0,0,0.15)"
        }}
      >
        {/* Header Sidebar Logo */}
        <div style={{ padding: "1.8rem 1.5rem", borderBottom: "1px solid #332f2b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {!collapsed && (
            <div>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: "bold", display: "block" }}>
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
              borderRadius: "6px"
            }}
            title={collapsed ? "Espandi Menu" : "Riduci Menu"}
          >
            {collapsed ? "➡️" : "⬅️"}
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: "1.5rem 0.8rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.85rem 1rem",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: isActive ? "700" : "500",
                  fontSize: "0.95rem",
                  color: isActive ? "#ffffff" : "#b0aba5",
                  background: isActive ? "linear-gradient(90deg, #e58c2c 0%, #d47b1e 100%)" : "transparent",
                  boxShadow: isActive ? "0 4px 12px rgba(229,140,44,0.3)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                <span style={{ fontSize: "1.3rem" }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar Admin User Profile */}
        <div style={{ padding: "1.2rem 1.5rem", borderTop: "1px solid #332f2b", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.8rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", overflow: "hidden" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#e58c2c", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", flexShrink: 0 }}>
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

      {/* Main Page Area */}
      <main style={{ flex: 1, padding: "2rem 3rem", overflowY: "auto" }}>
        {children}
      </main>

    </div>
  );
}
