"use server";

import { revalidatePath } from "next/cache";
import {
  getOrSeedGCalEvents,
  associateGCalEventToClient,
  parseGCalEvent,
  ParsedGCalEventInput,
} from "@/lib/calendarSyncEngine";
import { getGoogleCalendarEventsLocal, saveGoogleCalendarEventsLocal } from "@/lib/localDb";

export async function syncGCalAction() {
  const events = getOrSeedGCalEvents();
  revalidatePath("/admin/calendario");
  return { success: true, count: events.length, events };
}

export async function associateGCalAction(
  eventId: string,
  clientData: {
    nome: string;
    cognome: string;
    email: string;
    telefono: string;
    note?: string;
  }
) {
  const result = associateGCalEventToClient(eventId, clientData);
  revalidatePath("/admin/calendario");
  revalidatePath("/admin/clienti");
  return result;
}

export async function addGCalEventAction(input: ParsedGCalEventInput) {
  const parsed = parseGCalEvent(input);
  const events = getGoogleCalendarEventsLocal();
  events.push(parsed);
  saveGoogleCalendarEventsLocal(events);
  revalidatePath("/admin/calendario");
  return { success: true, event: parsed };
}

export async function deleteGCalEventAction(eventId: string) {
  const events = getGoogleCalendarEventsLocal();
  const filtered = events.filter((e) => e.id !== eventId && e.gcal_id !== eventId);
  saveGoogleCalendarEventsLocal(filtered);
  revalidatePath("/admin/calendario");
  return { success: true };
}
