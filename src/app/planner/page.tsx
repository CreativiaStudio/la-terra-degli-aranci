import {
  getAllAppointmentsLocal,
  getAllWeddingDiariesLocal,
  getLocalStore,
} from "@/lib/localDb";
import { getQuotesFast } from "@/lib/dataHelper";
import PlannerClient from "./PlannerClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function PlannerPage() {
  // Warm-up del DB locale: garantisce che lo store esista anche su runtime
  // serverless prima della lettura.
  const appointments = getAllAppointmentsLocal();
  const diaries = getAllWeddingDiariesLocal();
  const quotes = await getQuotesFast();

  // Anagrafica minimale dei clienti, per risolvere i nomi delle coppie a partire
  // dal `client_id` dei wedding_diaries (senza esporre dati sensibili extra).
  const clients = (getLocalStore().clients || [])
    .filter((c: any) => c && c.id)
    .map((c: any) => ({
      id: c.id,
      nome: c.nome || "",
      cognome: c.cognome || "",
      email: c.email || "",
      telefono: c.telefono || "",
    }));

  return (
    <PlannerClient
      appointments={appointments}
      diaries={diaries}
      quotes={quotes}
      clients={clients}
    />
  );
}
