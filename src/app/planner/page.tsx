import {
  getAllAppointmentsLocal,
  getAllServiceTicketsLocal,
  getAllWeddingDiariesLocal,
  getLocalStore,
} from "@/lib/localDb";
import { getQuotesFast } from "@/lib/dataHelper";
import { getOpenDayAdminData } from "@/lib/openDayCloudSync";
import PlannerClient from "./PlannerClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function PlannerPage() {
  const appointments = getAllAppointmentsLocal();
  const diaries = getAllWeddingDiariesLocal();
  const [quotes, openDayData] = await Promise.all([
    getQuotesFast().catch(() => []),
    getOpenDayAdminData().catch(() => ({ openDayClients: [] })),
  ]);
  const tickets = getAllServiceTicketsLocal();

  const clients = (getLocalStore().clients || [])
    .filter((c: any) => c && c.id)
    .map((c: any) => ({
      id: c.id,
      nome: c.nome || "",
      cognome: c.cognome || "",
      email: c.email || "",
      telefono: c.telefono || "",
    }));

  // Sincronizzazione dinamica dei lead e Wedding Diary registrati all'Open Day (Cloudflare R2)
  const openDayClients = openDayData?.openDayClients || [];
  const allDiaries = [...diaries];
  const allClients = [...clients];

  for (const od of openDayClients) {
    if (!allClients.some((c) => c.id === od.id)) {
      allClients.push({
        id: od.id,
        nome: od.nome || "",
        cognome: od.cognome || "",
        email: od.email || "",
        telefono: od.telefono || "",
      });
    }
    if (od.diaryAnswers && Object.keys(od.diaryAnswers).length > 0) {
      if (!allDiaries.some((d) => d.client_id === od.id)) {
        allDiaries.push({
          id: `diary-od-${od.id}`,
          client_id: od.id,
          answers: od.diaryAnswers,
          completion_rate: od.diaryProgress || 0,
          updated_at: od.updated_at,
        });
      }
    }
  }

  return (
    <PlannerClient
      appointments={appointments}
      diaries={allDiaries}
      quotes={quotes}
      clients={allClients}
      tickets={tickets}
    />
  );
}
