import { listPdfsInR2 } from "@/lib/r2";
import { getPendingContractsLocal } from "@/lib/localDb";
import QuickContractPanel from "./QuickContractPanel";
import PendingContractsList from "./PendingContractsList";
import ContrattiClientList from "./ContrattiClientList";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ContrattiDashboard() {
  let weddingPdfs: any[] = [];
  let eventiPdfs: any[] = [];
  let error = null;

  const pendingContracts = getPendingContractsLocal();

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
      <Suspense fallback={null}>
        <QuickContractPanel />
      </Suspense>

      <PendingContractsList initialContracts={pendingContracts} />

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
