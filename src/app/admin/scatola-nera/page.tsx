import { getBlackboxEntries, getBlackboxStats } from "@/lib/blackbox";
import BlackboxClient from "./BlackboxClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * 📟 Scatola Nera — Registro Attività & Errori.
 * Legge il ledger attivo (30 giorni) e le statistiche delle ultime 24 ore.
 */
export default function ScatolaNeraPage() {
  const entries = getBlackboxEntries({ days: 30, limit: 300 });
  const stats = getBlackboxStats();

  return <BlackboxClient entries={entries} stats={stats} />;
}
