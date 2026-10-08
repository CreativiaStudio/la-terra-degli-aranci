import { getAllAppointmentsLocal } from "@/lib/localDb";
import AppuntamentiClient from "./AppuntamentiClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminDashboardPage() {
  // Warm-up del DB locale: garantisce che lo store (e il seed dimostrativo
  // degli appuntamenti) esista anche su runtime serverless prima della lettura.
  const appointments = getAllAppointmentsLocal();

  return <AppuntamentiClient appointments={appointments} />;
}
