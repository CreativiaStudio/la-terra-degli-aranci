import { getQuotesFast } from "@/lib/dataHelper";
import { listPdfsInR2 } from "@/lib/r2";
import CalendarioClient from "./CalendarioClient";

export const revalidate = 0;

export default async function CalendarioPage() {
  const [quotes, signedPdfs] = await Promise.all([
    getQuotesFast(),
    Promise.all([
      listPdfsInR2("contratti/wedding/"),
      listPdfsInR2("contratti/eventi/")
    ]).then(([w, e]) => [...(w || []), ...(e || [])]).catch(() => [])
  ]);

  return <CalendarioClient quotes={quotes} signedPdfs={signedPdfs} />;
}
