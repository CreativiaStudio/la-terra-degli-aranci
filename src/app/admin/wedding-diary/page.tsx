import { getQuotesFast, getWeddingDiariesFast } from "@/lib/dataHelper";
import { getOpenDayAdminData } from "@/lib/openDayCloudSync";
import WeddingDiaryClient from "./WeddingDiaryClient";

export const revalidate = 0;

export default async function WeddingDiaryPage() {
  const [quotes, diaries, openDayData] = await Promise.all([
    getQuotesFast(),
    getWeddingDiariesFast(),
    getOpenDayAdminData().catch(() => ({ openDayClients: [] }))
  ]);
  return (
    <WeddingDiaryClient
      quotes={quotes}
      diaries={diaries}
      openDayClients={openDayData?.openDayClients || []}
    />
  );
}
