import { getAllAppointmentsLocal, getQuickCalendarOptionsLocal } from "@/lib/localDb";
import { getActiveReservations } from "@/lib/slotAvailability";
import SegreteriaClient from "./SegreteriaClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function SegreteriaPage() {
  // Warm-up del DB locale: garantisce che lo store (e il seed dimostrativo
  // degli appuntamenti) esista anche su runtime serverless prima della lettura.
  const appointments = getAllAppointmentsLocal();
  // Disponibilità della location calcolata in modo puro e deterministico a
  // partire da prenotazioni attive e opzioni rapide da calendario.
  const reservations = getActiveReservations(new Date());
  const quickOptions = getQuickCalendarOptionsLocal();

  return (
    <SegreteriaClient
      initialAppointments={appointments}
      initialReservations={reservations}
      initialQuickOptions={quickOptions}
    />
  );
}
