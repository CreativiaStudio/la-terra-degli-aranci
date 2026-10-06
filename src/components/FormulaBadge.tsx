import { normalizeTipoEsclusiva } from "@/lib/contractMeta";

interface FormulaBadgeProps {
  /** Valore grezzo di `tipo_esclusiva`; se assente il badge non viene mostrato. */
  tipoEsclusiva?: string | null;
  spaziRiservati?: string[];
  lang?: "it" | "en";
}

export function parseSpazi(...sources: Array<string | string[] | null | undefined>): string[] {
  const flat = sources.flatMap((s) => (Array.isArray(s) ? s : typeof s === "string" ? s.split(",") : []));
  return flat.map((s) => s.trim()).filter(Boolean);
}

export default function FormulaBadge({ tipoEsclusiva, spaziRiservati = [], lang = "it" }: FormulaBadgeProps) {
  if (!tipoEsclusiva) return null;

  const isEsclusiva = normalizeTipoEsclusiva(tipoEsclusiva) === "esclusiva";

  const title =
    lang === "it"
      ? isEsclusiva
        ? "Formula: Uso Esclusivo dell'intera struttura"
        : "Formula: Semi-esclusiva"
      : isEsclusiva
        ? "Formula: Exclusive use of the entire venue"
        : "Formula: Semi-exclusive";

  const spaziLabel = lang === "it" ? "Spazi riservati" : "Reserved spaces";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.4rem",
        marginBottom: "1.5rem",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1.1rem",
          borderRadius: "999px",
          background: "#fff7ed",
          border: "1px solid #c9a24b",
          color: "#8a5a14",
          fontWeight: 600,
          fontSize: "0.95rem",
        }}
      >
        <span aria-hidden="true">{isEsclusiva ? "🏛️" : "🌿"}</span>
        {title}
      </span>
      {!isEsclusiva && spaziRiservati.length > 0 && (
        <span style={{ fontSize: "0.88rem", color: "var(--text-light)", textAlign: "center" }}>
          {spaziLabel}: {spaziRiservati.join(", ")}
        </span>
      )}
    </div>
  );
}
