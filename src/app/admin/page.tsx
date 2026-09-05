import { getQuotesFast } from "@/lib/dataHelper";
import { listPdfsInR2 } from "@/lib/r2";
import EnterpriseDashboardClient from "./EnterpriseDashboardClient";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const [quotes, signedPdfs] = await Promise.all([
    getQuotesFast(),
    Promise.all([
      listPdfsInR2("contratti/wedding/"),
      listPdfsInR2("contratti/eventi/")
    ]).then(([w, e]) => [...(w || []), ...(e || [])]).catch(() => [])
  ]);

  return (
    <div className="container" style={{ maxWidth: "1200px" }}>
      <EnterpriseDashboardClient quotes={quotes} signedPdfs={signedPdfs} />
    </div>
  );
}
