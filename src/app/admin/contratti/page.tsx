import { listPdfsInR2 } from "@/lib/r2";
import LinkGenerator from "./LinkGenerator";
import ContrattiClientList from "./ContrattiClientList";

export const revalidate = 0; // Disabilita la cache per questa pagina, vogliamo i file in tempo reale

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
    error = err.message || "Errore di connessione a Cloudflare R2. Controlla le credenziali nel file .env";
  }

  return (
    <div className="container">
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
