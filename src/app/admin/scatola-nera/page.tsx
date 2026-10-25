import { getBlackboxEntriesUnified, getBlackboxStatsUnified } from "@/lib/blackbox";
import BlackboxClient from "./BlackboxClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * 📟 Scatola Nera — Registro Attività & Errori.
 * Unifica in tempo reale il ledger locale (con rotazione 30gg) e il ring-buffer
 * cloud su Cloudflare R2 (`blackbox/recent_feed.json`, max 500 eventi), così
 * anche su istanze serverless Vercel nessuna attività Open Day va persa.
 */
export default async function ScatolaNeraPage() {
  const [entries, stats] = await Promise.all([
    getBlackboxEntriesUnified({ days: 30, limit: 300 }),
    getBlackboxStatsUnified(),
  ]);

  return <BlackboxClient entries={entries} stats={stats} />;
}
