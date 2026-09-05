"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AuthUser {
  username: string;
  role: string;
  displayName: string;
  defaultRedirect: string;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.authenticated && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignora
    }
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return { label: "Direzione", color: "#e58c2c", bg: "#fff7ed" };
      case "segreteria":
        return { label: "Segreteria", color: "#1e3a2f", bg: "#e8f5e9" };
      case "planner":
        return { label: "Planner", color: "#8b5cf6", bg: "#f3e8ff" };
      case "wedding":
        return { label: "Sposi", color: "#ec4899", bg: "#fdf2f8" };
      case "privato":
        return { label: "Privato", color: "#059669", bg: "#ecfdf5" };
      case "storico":
        return { label: "Club TDA", color: "#3b82f6", bg: "#eff6ff" };
      default:
        return { label: role, color: "#6b7280", bg: "#f3f4f6" };
    }
  };

  return (
    <header
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #eae2d6",
        padding: "0.8rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      }}
    >
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "1rem" }}>
        <img
          src="/tda-simbolo.png"
          alt="La Terra degli Aranci"
          style={{ height: "42px", width: "auto", objectFit: "contain" }}
        />
        <div>
          <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "2px", color: "#e58c2c", fontWeight: 700, display: "block" }}>
            ECOSISTEMA GESTIONALE
          </span>
          <span style={{ fontSize: "1.15rem", fontWeight: 600, color: "#1e1b18", fontFamily: "Georgia, serif" }}>
            La Terra degli Aranci
          </span>
        </div>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {!loading && user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background: getRoleBadge(user.role).bg,
                  color: getRoleBadge(user.role).color,
                  border: `1px solid ${getRoleBadge(user.role).color}33`,
                }}
              >
                {getRoleBadge(user.role).label}
              </span>
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#374151" }}>
                {user.displayName}
              </span>
            </div>

            <Link
              href={user.defaultRedirect || "/"}
              style={{
                padding: "0.45rem 0.9rem",
                borderRadius: "8px",
                background: "#e58c2c",
                color: "#ffffff",
                fontSize: "0.82rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Apri Dashboard →
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: "0.45rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid #d6cebf",
                background: "#ffffff",
                color: "#6b7280",
                fontSize: "0.82rem",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Esci ⏻
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            style={{
              padding: "0.55rem 1.2rem",
              borderRadius: "10px",
              background: "linear-gradient(90deg, #e58c2c 0%, #d47b1e 100%)",
              color: "#ffffff",
              fontSize: "0.88rem",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(229,140,44,0.3)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span>🔒</span>
            <span>Accedi all&apos;Ecosistema</span>
          </Link>
        )}
      </div>
    </header>
  );
}
