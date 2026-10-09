"use client";

import React, { useState, useTransition } from "react";
import { updateClientTagsAction } from "./actions";

/* ------------------------------------------------------------------ */
/* Etichette ufficiali del CRM                                         */
/* ------------------------------------------------------------------ */

export interface TagStyle {
  bg: string;
  color: string;
  border: string;
}

/** Stili delle etichette ufficiali (condivisi tra rubrica e scheda cliente). */
export const TAG_STYLES: Record<string, TagStyle> = {
  "VIP Club TDA": { bg: "#f6c177", color: "#1e1b18", border: "#e0a83f" },
  Sposi: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
  Privato: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "Cliente Storico": { bg: "#166534", color: "#ffffff", border: "#166534" },
  Nuovo: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  Aziendale: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
};

/** Etichette predefinite proposte come toggle rapido nel modale. */
export const TAG_PRESETS: string[] = [
  "VIP Club TDA",
  "Sposi",
  "Privato",
  "Cliente Storico",
  "Nuovo",
  "Aziendale",
];

const FALLBACK_STYLE: TagStyle = { bg: "#f5f5f4", color: "#57534e", border: "#e7e5e4" };

export function tagStyle(tag: string): TagStyle {
  return TAG_STYLES[tag] || FALLBACK_STYLE;
}

export function TagBadge({ tag, size = "sm" }: { tag: string; size?: "sm" | "md" }) {
  const s = tagStyle(tag);
  return (
    <span
      style={{
        fontSize: size === "md" ? "0.76rem" : "0.7rem",
        fontWeight: 800,
        padding: size === "md" ? "0.22rem 0.7rem" : "0.18rem 0.6rem",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {tag}
    </span>
  );
}

/** Normalizza un elenco di tag: trim, scarto dei vuoti e dedup case-insensitive. */
function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags || []) {
    const value = String(raw ?? "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Modale di modifica etichette                                        */
/* ------------------------------------------------------------------ */

interface TagEditorModalProps {
  clientId: string;
  clientName?: string;
  initialTags: string[];
  onClose: () => void;
  onSaved?: () => void;
}

export default function TagEditorModal({
  clientId,
  clientName,
  initialTags,
  onClose,
  onSaved,
}: TagEditorModalProps) {
  const [selected, setSelected] = useState<string[]>(() => normalizeTags(initialTags));
  const [custom, setCustom] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const isActive = (tag: string) => selected.some((t) => t.toLowerCase() === tag.toLowerCase());

  const toggle = (tag: string) => {
    setError("");
    setSelected((prev) =>
      prev.some((t) => t.toLowerCase() === tag.toLowerCase())
        ? prev.filter((t) => t.toLowerCase() !== tag.toLowerCase())
        : [...prev, tag]
    );
  };

  const addCustom = () => {
    const value = custom.trim();
    if (!value) return;
    setError("");
    setSelected((prev) =>
      prev.some((t) => t.toLowerCase() === value.toLowerCase()) ? prev : [...prev, value]
    );
    setCustom("");
  };

  const remove = (tag: string) => {
    setError("");
    setSelected((prev) => prev.filter((t) => t !== tag));
  };

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      const res = await updateClientTagsAction(clientId, selected);
      if (res.success) {
        onSaved?.();
        onClose();
      } else {
        setError(res.error || "Impossibile salvare le etichette.");
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: "580px",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          padding: "2.2rem",
          position: "relative",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          disabled={pending}
          style={{
            position: "absolute",
            top: "1.2rem",
            right: "1.2rem",
            background: "#f0eee9",
            border: "none",
            fontSize: "1.05rem",
            width: 36,
            height: 36,
            borderRadius: "50%",
            cursor: pending ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          ✕
        </button>

        <span
          style={{
            fontSize: "0.76rem",
            textTransform: "uppercase",
            letterSpacing: "2px",
            color: "#e58c2c",
            fontWeight: 700,
          }}
        >
          Etichette Cliente
        </span>
        <h2
          style={{
            margin: "0.3rem 0 1.4rem 0",
            color: "#514d48",
            fontSize: "1.5rem",
            fontFamily: "serif",
          }}
        >
          {clientName ? `Etichette di ${clientName}` : "Modifica etichette"}
        </h2>

        {/* Preset a toggle rapido */}
        <div style={{ marginBottom: "0.6rem", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "1px", color: "#8a847c", fontWeight: 700 }}>
          Preset rapidi
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.4rem" }}>
          {TAG_PRESETS.map((tag) => {
            const s = tagStyle(tag);
            const active = isActive(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                disabled={pending}
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  padding: "0.4rem 0.8rem",
                  borderRadius: 999,
                  cursor: pending ? "not-allowed" : "pointer",
                  background: active ? s.bg : "#fff",
                  color: active ? s.color : "#8a847c",
                  border: `1px solid ${active ? s.border : "#e0dcd4"}`,
                  boxShadow: active ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.12s ease",
                }}
              >
                {active ? "✓ " : "+ "}
                {tag}
              </button>
            );
          })}
        </div>

        {/* Tag personalizzato */}
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            fontSize: "0.85rem",
            color: "#514d48",
            fontWeight: 600,
            marginBottom: "1.4rem",
          }}
        >
          Aggiungi un tag personalizzato
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder="Es. Wedding Planner, Fornitore..."
              style={{
                flex: 1,
                padding: "0.65rem 0.8rem",
                borderRadius: 8,
                border: "1px solid #ddd",
                fontSize: "0.95rem",
                fontFamily: "inherit",
              }}
            />
            <button
              type="button"
              onClick={addCustom}
              disabled={pending || !custom.trim()}
              style={{
                padding: "0.65rem 1rem",
                borderRadius: 8,
                border: "none",
                background: custom.trim() ? "#1e1b18" : "#d6d2cc",
                color: custom.trim() ? "#f6c177" : "#8a847c",
                fontWeight: 700,
                cursor: pending || !custom.trim() ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              + Aggiungi
            </button>
          </div>
        </label>

        {/* Etichette selezionate */}
        <div style={{ marginBottom: "1.4rem" }}>
          <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "1px", color: "#8a847c", fontWeight: 700, marginBottom: "0.6rem" }}>
            Etichette selezionate ({selected.length})
          </div>
          {selected.length === 0 ? (
            <span style={{ fontSize: "0.82rem", color: "#a8a29e" }}>
              Nessuna etichetta selezionata.
            </span>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {selected.map((tag) => (
                <span
                  key={tag}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                >
                  <TagBadge tag={tag} />
                  <button
                    type="button"
                    onClick={() => remove(tag)}
                    disabled={pending}
                    title={`Rimuovi ${tag}`}
                    aria-label={`Rimuovi ${tag}`}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#b91c1c",
                      fontWeight: 800,
                      cursor: pending ? "not-allowed" : "pointer",
                      fontSize: "0.85rem",
                      lineHeight: 1,
                      padding: "0.1rem 0.25rem",
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              color: "#b91c1c",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "0.6rem 0.8rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.4rem" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            style={{
              flex: 1,
              padding: "0.85rem",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              color: "#555",
              fontWeight: 600,
              cursor: pending ? "not-allowed" : "pointer",
            }}
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            style={{
              flex: 2,
              padding: "0.85rem",
              borderRadius: 10,
              border: "none",
              background: pending ? "#d6c3ac" : "linear-gradient(135deg, #e58c2c 0%, #d17a22 100%)",
              color: "#fff",
              fontWeight: 700,
              cursor: pending ? "not-allowed" : "pointer",
            }}
          >
            {pending ? "Salvataggio..." : "💾 Salva Etichette"}
          </button>
        </div>
      </div>
    </div>
  );
}
