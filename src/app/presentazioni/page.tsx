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
    url: "https://ecosistema.laterradegliaranci.it/presentazioni",
    siteName: "La Terra degli Aranci",
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "https://ecosistema.laterradegliaranci.it/og-presentazioni.jpg",
        width: 1200,
        height: 630,
        alt: "La Terra degli Aranci - Presentazioni Ufficiali",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Presentazioni Ufficiali | La Terra degli Aranci",
    description:
      "Esplora i format, gli spazi e le esperienze esclusive di Villa La Terra degli Aranci attraverso le presentazioni interattive dedicate.",
    images: ["https://ecosistema.laterradegliaranci.it/og-presentazioni.jpg"],
  },
};

export default function PresentazioniHubPage() {
  const presentations = getAllPresentations();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#EFEAE1",
        color: "#2B2B2B",
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "48px 24px 80px 24px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        .tda-pres-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          width: 100%;
        }
        @media (min-width: 640px) {
          .tda-pres-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .tda-pres-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .tda-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .tda-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 36px rgba(81, 77, 72, 0.12) !important;
          border-color: rgba(197, 160, 89, 0.5) !important;
        }
        .tda-card:hover .tda-card-cta {
          color: #B8860B !important;
        }
      `}</style>

      <div style={{ maxWidth: "1380px", margin: "0 auto" }}>
        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "#8C6A28",
              backgroundColor: "rgba(197, 160, 89, 0.16)",
              padding: "6px 18px",
              borderRadius: "20px",
              marginBottom: "16px",
              border: "1px solid rgba(197, 160, 89, 0.35)",
            }}
          >
            La Terra degli Aranci
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 3.5vw, 2.85rem)",
              fontWeight: 500,
              fontFamily: "Georgia, 'Times New Roman', serif",
              letterSpacing: "-0.02em",
              color: "#242220",
              margin: "0 0 14px 0",
              lineHeight: 1.2,
            }}
          >
            Presentazioni Ufficiali
          </h1>
          <p
            style={{
              fontSize: "clamp(0.95rem, 1.5vw, 1.05rem)",
              color: "#66625B",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Sfoglia i format, gli spazi e le esperienze esclusive della nostra tenuta
            attraverso il visualizzatore interattivo a tutto schermo.
          </p>
        </header>

        {/* Griglia a 4 Box su Singola Riga Desktop */}
        <div className="tda-pres-grid">
          {presentations.map((p) => (
            <Link
              key={p.slug}
              href={`/presentazioni/${p.slug}`}
              className="tda-card"
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#FFFFFF",
                borderRadius: "18px",
                overflow: "hidden",
                border: "1px solid rgba(197, 160, 89, 0.22)",
                boxShadow: "0 8px 24px rgba(81, 77, 72, 0.06)",
              }}
            >
              {/* Anteprima Copertina 16:9 */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16 / 9",
                  backgroundColor: "#E6E1D8",
                  overflow: "hidden",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
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
                      top: "10px",
                      right: "10px",
                      backgroundColor: "rgba(33, 31, 28, 0.88)",
                      backdropFilter: "blur(6px)",
                      color: "#E2C37A",
                      border: "1px solid rgba(226, 195, 122, 0.3)",
                      fontSize: "10px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "4px 9px",
                      borderRadius: "10px",
                    }}
                  >
                    {p.badge}
                  </span>
                )}
                {/* Pill Slide Count */}
                <span
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    left: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.92)",
                    backdropFilter: "blur(6px)",
                    color: "#2C2A27",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  {p.totalSlides} slide
                </span>
              </div>

              {/* Informazioni Card */}
              <div
                style={{
                  padding: "18px 20px 20px 20px",
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      color: "#2B2B2B",
                      margin: "0 0 6px 0",
                      lineHeight: 1.35,
                    }}
                  >
                    {p.title}
                  </h2>
                  <p
                    style={{
                      fontSize: "0.84rem",
                      color: "#6E6A63",
                      margin: "0 0 16px 0",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
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
                    justifyContent: "flex-start",
                    paddingTop: "12px",
                    borderTop: "1px solid rgba(0, 0, 0, 0.06)",
                  }}
                >
                  <span
                    className="tda-card-cta"
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "#C5A059",
                      letterSpacing: "0.02em",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "color 0.2s ease",
                    }}
                  >
                    Sfoglia presentazione
                    <svg
                      width="13"
                      height="13"
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
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
