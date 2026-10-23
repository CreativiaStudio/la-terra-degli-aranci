"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface OpenDayActionsMenuProps {
  clientId: string;
  nome: string;
  partnerNome?: string;
  email?: string;
  telefono?: string;
  dataSognata?: string;
  shareToken?: string;
}

export default function OpenDayActionsMenu({
  clientId,
  nome,
  partnerNome,
  email,
  telefono,
  dataSognata,
  shareToken,
}: OpenDayActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const contractUrl = `/admin/contratti?nome=${encodeURIComponent(nome)}${
    partnerNome ? `&partner_nome=${encodeURIComponent(partnerNome)}` : ""
  }&email=${encodeURIComponent(email || "")}&telefono=${encodeURIComponent(
    telefono || ""
  )}&data=${encodeURIComponent(dataSognata || "")}`;

  const cleanPhone = (telefono || "").replace(/[^0-9]/g, "");
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Gentili ${nome}, grazie per la visita a La Terra degli Aranci! Ecco il vostro Wedding Diary custodito: https://ecosistema.laterradegliaranci.it/openday/diario?id=${clientId}${
          shareToken ? `&share=${shareToken}` : ""
        }`
      )}`
    : "";

  return (
    <div
      ref={menuRef}
      style={{
        position: "relative",
        display: "inline-block",
        textAlign: "left",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "9px",
          border: "1px solid #E8E2D8",
          background: open ? "#FAF8F5" : "#ffffff",
          color: "#2B2B2B",
          fontSize: "1.15rem",
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          letterSpacing: "1px",
          transition: "all 0.15s ease",
          boxShadow: open
            ? "0 3px 10px rgba(0,0,0,0.1)"
            : "0 1px 3px rgba(0,0,0,0.04)",
        }}
        title="Opzioni e azioni rapide"
        aria-expanded={open}
      >
        •••
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            zIndex: 1000,
            minWidth: "220px",
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow:
              "0 12px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.06)",
            border: "1px solid #E8E2D8",
            padding: "0.45rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          {/* Emetti Contratto (in evidenza gradiente arancio) */}
          <Link
            href={contractUrl}
            onClick={() => setOpen(false)}
            style={{
              padding: "0.6rem 0.85rem",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #e58c2c 0%, #c2410c 100%)",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "0.82rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              boxShadow: "0 2px 6px rgba(229,140,44,0.25)",
            }}
          >
            <span>✍️</span>
            <span>Emetti Contratto</span>
          </Link>

          {/* Scheda CRM */}
          <Link
            href={`/admin/clienti/${clientId}`}
            onClick={() => setOpen(false)}
            style={{
              padding: "0.55rem 0.85rem",
              borderRadius: "8px",
              color: "#1e1b18",
              textDecoration: "none",
              fontSize: "0.82rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f4")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <span>👥</span>
            <span>Scheda CRM 360°</span>
          </Link>

          {/* Guarda Diario */}
          <Link
            href={`/openday/diario?id=${clientId}`}
            target="_blank"
            onClick={() => setOpen(false)}
            style={{
              padding: "0.55rem 0.85rem",
              borderRadius: "8px",
              color: "#1e1b18",
              textDecoration: "none",
              fontSize: "0.82rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f4")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <span>👁️</span>
            <span>Guarda Wedding Diary</span>
          </Link>

          {/* WhatsApp */}
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{
                padding: "0.55rem 0.85rem",
                borderRadius: "8px",
                color: "#15803d",
                textDecoration: "none",
                fontSize: "0.82rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f0fdf4")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span>💬</span>
              <span>Invia Diario WhatsApp</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
