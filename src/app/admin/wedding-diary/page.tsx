import { getQuotesFast, getWeddingDiariesFast } from "@/lib/dataHelper";
import { getOpenDayAdminData } from "@/lib/openDayCloudSync";
import { getStore } from "@/lib/localDb";
import WeddingDiaryClient from "./WeddingDiaryClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function WeddingDiaryPage() {
  const store = getStore();
  const [quotes, cloudDiaries, openDayData] = await Promise.all([
    getQuotesFast().catch(() => []),
    getWeddingDiariesFast().catch(() => []),
    getOpenDayAdminData().catch(() => ({ stats: { totalScans: 0 }, openDayClients: [] })),
  ]);

  const allDiaries = [...(store.wedding_diaries || []), ...(cloudDiaries || [])];

  return (
    <WeddingDiaryClient
      quotes={quotes || []}
      diaries={allDiaries}
      openDayClients={openDayData?.openDayClients || []}
    />
  );
}
