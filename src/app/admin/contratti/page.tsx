import { listPdfsInR2 } from "@/lib/r2";
import LinkGenerator from "./LinkGenerator";
import ContrattiClientList from "./ContrattiClientList";
import Link from "next/link";

export const revalidate = 0;

export default async function ContrattiDashboard() {
  let weddingPdfs: any[] = [];
  let eventiPdfs: any[] = [];
  let error = null;

  try {
    const [wedding, eventi] = await Promise.all([
      listPdfsInR2("contratti/wedding/"),
      listPdfsInR2("contratti/eventi/")
    ]);
    weddingPdfs = wedding;
    eventiPdfs = eventi;
  } catch (err: any) {
    console.warn("R2 Cloud Storage non raggiungibile o offline fallback:", err?.message || err);
  }

  return (
    <div className="container">
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/admin" style={{ color: "#666", textDecoration: "none", fontWeight: "600" }}>
          ← Torna alla Dashboard Direzionale
        </Link>
      </div>

      <LinkGenerator />
      
      <div className="premium-card">
        <header style={{ marginBottom: "2rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
          <h1 style={{ margin: 0, textAlign: "left" }}>Archivio Contratti Firmati</h1>
        </header>

        {error && <p style={{ color: "var(--error)", padding: "1rem", background: "#fee", borderRadius: "8px" }}>{error}</p>}
        
        {!error && (
          <ContrattiClientList eventiPdfs={eventiPdfs} weddingPdfs={weddingPdfs} />
        )}
      </div>
    </div>
  );
}
