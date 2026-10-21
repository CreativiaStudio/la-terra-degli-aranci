import { getQuotesFast } from "@/lib/dataHelper";
import { listPdfsInR2 } from "@/lib/r2";
import { getOpenDayAdminData } from "@/lib/openDayCloudSync";
import CrmClient from "./CrmClient";

export const revalidate = 0;

export default async function CrmPage() {
  const [quotes, signedPdfs, openDayData] = await Promise.all([
    getQuotesFast(),
    Promise.all([
      listPdfsInR2("contratti/wedding/"),
      listPdfsInR2("contratti/eventi/")
    ]).then(([w, e]) => [...(w || []), ...(e || [])]).catch(() => []),
    getOpenDayAdminData().catch(() => ({ openDayClients: [] }))
  ]);

  return (
    <CrmClient
      quotes={quotes}
      signedPdfs={signedPdfs}
      openDayClients={openDayData?.openDayClients || []}
    />
  );
}
