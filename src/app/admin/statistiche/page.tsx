import { getStatisticheDashboard } from "@/lib/statisticheEngine";
import StatisticheClient from "./StatisticheClient";

export const revalidate = 0;

export default async function StatistichePage() {
  const data = getStatisticheDashboard(2026);

  return (
    <div className="container" style={{ paddingTop: "2rem" }}>
      <StatisticheClient initialData={data} />
    </div>
  );
}
