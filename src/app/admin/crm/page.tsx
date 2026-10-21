import { getQuotesFast, getWeddingDiariesFast } from "@/lib/dataHelper";
import { listPdfsInR2 } from "@/lib/r2";
import { getOpenDayAdminData } from "@/lib/openDayCloudSync";
import { getStore } from "@/lib/localDb";
import CrmClient from "./CrmClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function CrmPage() {
  const store = getStore();

  const [quotes, signedPdfs, openDayData, cloudDiaries] = await Promise.all([
    getQuotesFast().catch(() => []),
    Promise.all([
      listPdfsInR2("contratti/wedding/"),
      listPdfsInR2("contratti/eventi/"),
    ])
      .then(([w, e]) => [...(w || []), ...(e || [])])
      .catch(() => []),
    getOpenDayAdminData().catch(() => ({ stats: { totalScans: 0 }, openDayClients: [] })),
    getWeddingDiariesFast().catch(() => []),
  ]);

  return (
    <CrmClient
      clients={store.clients || []}
      diaries={[...(store.wedding_diaries || []), ...(cloudDiaries || [])]}
      quotes={quotes || []}
      signedPdfs={signedPdfs || []}
      openDayClients={openDayData?.openDayClients || []}
    />
  );
}
