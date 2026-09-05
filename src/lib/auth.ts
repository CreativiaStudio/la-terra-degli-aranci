import { cookies } from "next/headers";
import {
  UserRole,
  TDASessionPayload,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  signSessionToken,
  verifySessionToken,
} from "./session";

export type { UserRole, TDASessionPayload };
export { SESSION_COOKIE_NAME, SESSION_MAX_AGE, signSessionToken, verifySessionToken };

export interface PredefinedUser {
  username: string;
  passwordPlain: string;
  role: UserRole;
  displayName: string;
  badge: string;
  description: string;
  defaultRedirect: string;
  clientId?: string;
  clientMode?: "wedding" | "privato" | "storico";
}

export interface TDASessionUser {
  username: string;
  role: UserRole;
  displayName: string;
  clientId?: string;
  clientMode?: "wedding" | "privato" | "storico";
  defaultRedirect: string;
}

export const PREDEFINED_USERS: Record<string, PredefinedUser> = {
  admin: {
    username: "admin",
    passwordPlain: "Roberto2026!",
    role: "admin",
    displayName: "Roberto Sola & Rosaria Iovino",
    badge: "Direzione",
    description: "Direzione Generale, Fisco Banqueting 60/40 & Approvazione Blog",
    defaultRedirect: "/admin",
  },
  segreteria: {
    username: "segreteria",
    passwordPlain: "StaffTDA2026!",
    role: "segreteria",
    displayName: "Staff Accoglienza TDA",
    badge: "Tablet Parco",
    description: "Tablet Tour Location & Raccolta Lead (Zero Dati Finanziari)",
    defaultRedirect: "/segreteria",
  },
  planner: {
    username: "planner",
    passwordPlain: "PlannerTDA2026!",
    role: "planner",
    displayName: "Wedding & Event Planner TDA",
    badge: "Subentro -6 Mesi",
    description: "Coordinamento a -6 Mesi & Dossier 360° Sposi",
    defaultRedirect: "/planner",
  },
  "wedding.demo": {
    username: "wedding.demo",
    passwordPlain: "Sposi2027!",
    role: "wedding",
    displayName: "Marco & Sofia (Wedding 2027)",
    badge: "Sposi Attivi",
    description: "Portale Sposi: Wedding Diary, Acconti & AI Concierge",
    defaultRedirect: "/cliente?mode=wedding&id=demo1",
    clientId: "demo1",
    clientMode: "wedding",
  },
  "privato.demo": {
    username: "privato.demo",
    passwordPlain: "Festa2026!",
    role: "privato",
    displayName: "Famiglia Sola (Festa Privata 2026)",
    badge: "Feste & Ricorrenze",
    description: "Portale Evento Privato Snello & Personalizzazioni",
    defaultRedirect: "/cliente?mode=privato&id=demo2",
    clientId: "demo2",
    clientMode: "privato",
  },
  "storico.demo": {
    username: "storico.demo",
    passwordPlain: "ClubTDA2026!",
    role: "storico",
    displayName: "Ospite Club Storico TDA",
    badge: "Club & Ticketing",
    description: "Club Esclusivo Villa, Prevendite 48h & Ticketing (Prezzi Mascherati)",
    defaultRedirect: "/cliente?mode=storico&id=demo4",
    clientId: "demo4",
    clientMode: "storico",
  },
};

/**
 * Autentica le credenziali confrontandole con gli account predefiniti
 */
export function authenticateCredentials(
  username: string,
  passwordPlain: string
): TDASessionUser | null {
  const normalizedUsername = (username || "").trim().toLowerCase();
  const user = PREDEFINED_USERS[normalizedUsername];

  if (!user) return null;
  if (user.passwordPlain !== passwordPlain) return null;

  return {
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    clientId: user.clientId,
    clientMode: user.clientMode,
    defaultRedirect: user.defaultRedirect,
  };
}

/**
 * Helper per mappare ruolo e clientId sulla rotta home corretta
 */
export function getHomeUrlForRole(role: UserRole, clientId?: string): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "segreteria":
      return "/segreteria";
    case "planner":
      return "/planner";
    case "wedding":
      return `/cliente?mode=wedding&id=${clientId || "demo1"}`;
    case "privato":
      return `/cliente?mode=privato&id=${clientId || "demo2"}`;
    case "storico":
      return `/cliente?mode=storico&id=${clientId || "demo4"}`;
    default:
      return "/login";
  }
}

/**
 * Recupera la sessione utente corrente lato server (conforme con Next.js 16 async cookies)
 */
export async function getServerSession(): Promise<TDASessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    const payload = await verifySessionToken(sessionCookie.value);
    if (!payload) return null;

    return {
      username: payload.username,
      role: payload.role,
      displayName: payload.displayName,
      clientId: payload.clientId,
      clientMode: payload.clientMode,
      defaultRedirect: payload.defaultRedirect,
    };
  } catch {
    return null;
  }
}
