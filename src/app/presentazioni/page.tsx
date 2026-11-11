import type { Metadata } from "next";
import Link from "next/link";
import { getAllPresentations } from "@/lib/presentazioni";

export const metadata: Metadata = {
  title: "Presentazioni Ufficiali | La Terra degli Aranci",
  description:
    "Esplora i format, gli spazi e le esperienze esclusive di Villa La Terra degli Aranci attraverso le presentazioni interattive dedicate: nozze, eventi aziendali e album fotografici.",
  openGraph: {
    title: "Presentazioni Ufficiali | La Terra degli Aranci",
    description:
      "Esplora i format, gli spazi e le esperienze esclusive di Villa La Terra degli Aranci attraverso le presentazioni interattive dedicate.",
    type: "website",
    locale: "it_IT",
  },
};

export default function PresentazioniHubPage() {
  const presentations = getAllPresentations();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0e1015",
        color: "#FAF8F5",
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "48px 20px 80px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#c5a059",
              backgroundColor: "rgba(197, 160, 89, 0.12)",
              padding: "6px 16px",
              borderRadius: "20px",
              marginBottom: "16px",
              border: "1px solid rgba(197, 160, 89, 0.25)",
            }}
          >
            La Terra degli Aranci
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 400,
              fontFamily: "Georgia, 'Times New Roman', serif",
              letterSpacing: "-0.02em",
              color: "#FAF8F5",
              margin: "0 0 16px 0",
            }}
          >
            Presentazioni Ufficiali
          </h1>
          <p
            style={{
              fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)",
              color: "rgba(250, 248, 245, 0.65)",
              maxWidth: "640px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Sfoglia i format, gli spazi e le esperienze esclusive della nostra tenuta
            attraverso il visualizzatore interattivo a tutto schermo.
          </p>
        </header>

        {/* Griglia 4 Card Presentazioni */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "28px",
          }}
        >
          {presentations.map((p) => (
            <Link
              key={p.slug}
              href={`/presentazioni/${p.slug}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#16181f",
                borderRadius: "18px",
                overflow: "hidden",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
                transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
              }}
            >
              {/* Anteprima Copertina 16:9 */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16 / 9",
                  backgroundColor: "#0d0e12",
                  overflow: "hidden",
                }}
              >
                <img
                  src={p.coverImage}
                  alt={p.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                {/* Badge Categoria */}
                {p.badge && (
                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      backgroundColor: "rgba(14, 16, 21, 0.85)",
                      backdropFilter: "blur(8px)",
                      color: "#c5a059",
                      border: "1px solid rgba(197, 160, 89, 0.3)",
                      fontSize: "11px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "4px 10px",
                      borderRadius: "12px",
                    }}
                  >
                    {p.badge}
                  </span>
                )}
                {/* Pill Slide Count */}
                <span
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "12px",
                    backgroundColor: "rgba(0, 0, 0, 0.75)",
                    backdropFilter: "blur(6px)",
                    color: "#FAF8F5",
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "3px 8px",
                    borderRadius: "8px",
                  }}
                >
                  {p.totalSlides} slide
                </span>
              </div>

              {/* Informazioni Card */}
              <div
                style={{
                  padding: "22px 24px 24px 24px",
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      color: "#FAF8F5",
                      margin: "0 0 8px 0",
                      lineHeight: 1.35,
                    }}
                  >
                    {p.title}
                  </h2>
                  <p
                    style={{
                      fontSize: "0.88rem",
                      color: "rgba(250, 248, 245, 0.65)",
                      margin: "0 0 18px 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {p.subtitle}
                  </p>
                </div>

                {/* Call to action button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "14px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#c5a059",
                      letterSpacing: "0.02em",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    Sfoglia presentazione
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "rgba(250, 248, 245, 0.4)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Canva View
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
