import { getStatisticheDashboard } from "@/lib/statisticheEngine";
import { getQuotesFast } from "@/lib/dataHelper";
import { getOpenDayAdminData } from "@/lib/openDayCloudSync";
import { getStore } from "@/lib/localDb";
import StatisticheClient from "./StatisticheClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function StatistichePage() {
  const [data, quotes, openDayData] = await Promise.all([
    getStatisticheDashboard(2026),
    getQuotesFast().catch(() => []),
    getOpenDayAdminData().catch(() => ({ stats: { totalScans: 0 }, openDayClients: [] })),
  ]);
  const store = getStore();

  return (
    <div className="container" style={{ paddingTop: "2rem" }}>
      <StatisticheClient
        initialData={data}
        rawQuotes={quotes || []}
        appointments={store.appointments || []}
        openDayData={openDayData}
      />
    </div>
  );
}
