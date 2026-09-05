import { getQuotesFast } from "@/lib/dataHelper";
import { listPdfsInR2 } from "@/lib/r2";
import CrmClient from "./CrmClient";

export const revalidate = 0;

export default async function CrmPage() {
  const [quotes, signedPdfs] = await Promise.all([
    getQuotesFast(),
    Promise.all([
      listPdfsInR2("contratti/wedding/"),
      listPdfsInR2("contratti/eventi/")
    ]).then(([w, e]) => [...(w || []), ...(e || [])]).catch(() => [])
  ]);

  return <CrmClient quotes={quotes} signedPdfs={signedPdfs} />;
}
