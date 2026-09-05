import { getQuotesFast, getWeddingDiariesFast } from "@/lib/dataHelper";
import WeddingDiaryClient from "./WeddingDiaryClient";

export const revalidate = 0;

export default async function WeddingDiaryPage() {
  const [quotes, diaries] = await Promise.all([
    getQuotesFast(),
    getWeddingDiariesFast()
  ]);
  return <WeddingDiaryClient quotes={quotes} diaries={diaries} />;
}
