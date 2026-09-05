import { differenceInCalendarDays } from "date-fns";

export const EDIT_WINDOW_CUTOFF_DAYS = 10;

/**
 * I servizi di un contratto firmato possono essere modificati solo fino a
 * EDIT_WINDOW_CUTOFF_DAYS giorni prima della data dell'evento. Blocco assoluto,
 * valido sia per il cliente che per l'admin: va richiamata sia lato UI (gating)
 * sia dentro le server action (unica vera fonte di enforcement).
 */
export function isWithinEditableWindow(dataEvento?: string | null): boolean {
  if (!dataEvento) return true;
  return differenceInCalendarDays(new Date(dataEvento), new Date()) >= EDIT_WINDOW_CUTOFF_DAYS;
}
