import Link from "next/link";
import { getQuotesFast } from "@/lib/dataHelper";
import { deriveEventStage } from "@/lib/eventStage";
import { getTurnoTime } from "@/lib/eventStage";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function formatDate(iso?: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "Da definire";
}

function formulaLabel(quote: any): string {
  const raw = String(quote.formula_opzione ?? quote.tipo_esclusiva ?? "").toLowerCase();
  if (raw === "esclusiva") return "Esclusiva";
  if (raw.includes("tufo")) return "Sala Tufo";
  if (raw.includes("bianca")) return "Sala Bianca";
  return raw === "semi_esclusiva" ? "Semi-Esclusiva" : "—";
}

export default async function EventiPage() {
  const quotes = await getQuotesFast();

  const events = quotes
    .filter((q: any) => q && q.id)
    .map((q: any) => ({ quote: q, stage: deriveEventStage(q) }))
    .sort((a: any, b: any) =>
      String(b.quote.data_evento || b.quote.created_at || "").localeCompare(
        String(a.quote.data_evento || a.quote.created_at || "")
      )
    );

  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ marginBottom: "1.8rem" }}>
        <span style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.8rem", color: "#e58c2c", fontWeight: 800 }}>
          PILASTRO EVENTI
        </span>
        <h1 style={{ margin: "0.3rem 0 0", fontFamily: "serif", fontSize: "2.1rem", color: "#1e1b18", textAlign: "left" }}>
          💍 Tutti gli Eventi
        </h1>
        <p style={{ margin: "0.3rem 0 0", color: "#6a6764" }}>
          {events.length} eventi in pipeline. Apri la Scheda Regia 360° per gestire contratti, servizi, cassa e ospiti.
        </p>
      </div>

      <div style={{ display: "grid", gap: "0.8rem" }}>
        {events.map(({ quote, stage }: any) => {
          const client = quote.clients ?? {};
          return (
            <Link
              key={quote.id}
              href={`/admin/eventi/${quote.id}`}
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto",
                gap: "1rem",
                alignItems: "center",
                background: "#fff",
                border: "1px solid #efe7db",
                borderRadius: "14px",
                padding: "1rem 1.3rem",
                textDecoration: "none",
                color: "#2c2a27",
                boxShadow: "0 8px 26px rgba(0,0,0,0.03)",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>
                  {client.nome ?? "Cliente"} {client.cognome ?? ""}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9a948c" }}>
                  TDA-{String(quote.id).slice(0, 8).toUpperCase()}
                </div>
              </div>
              <div style={{ fontSize: "0.9rem" }}>📅 {formatDate(quote.data_evento)}</div>
              <div style={{ fontSize: "0.9rem" }}>
                {getTurnoTime(quote.turno).isPranzo ? "☀️" : "🌙"} {getTurnoTime(quote.turno).label}
              </div>
              <div style={{ fontSize: "0.9rem" }}>🏛️ {formulaLabel(quote)}</div>
              <span
                style={{
                  background: stage.badgeColor,
                  color: "#fff",
                  padding: "0.3rem 0.8rem",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {stage.label}
              </span>
            </Link>
          );
        })}

        {events.length === 0 && (
          <div style={{ background: "#fff", border: "1px dashed #e0ddd9", borderRadius: "14px", padding: "2.5rem", textAlign: "center", color: "#9a948c" }}>
            Nessun evento in archivio. Crea un preventivo o registra un&apos;opzione dal calendario.
          </div>
        )}
      </div>
    </div>
  );
}
