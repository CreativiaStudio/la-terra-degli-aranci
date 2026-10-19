import crypto from "crypto";
import { cookies } from "next/headers";
import { getStore } from "./localDb";

export interface MagicLinkRecord {
  token: string;
  otpCode: string;
  email: string;
  clientId?: string;
  expiresAt: number;
  used: boolean;
  createdAt: number;
}

// Registro in memoria dei magic link attivi (15 minuti di validità)
const activeMagicLinks: Map<string, MagicLinkRecord> = new Map();

const SESSION_COOKIE_NAME = "tda_client_session";
const MAGIC_SECRET = process.env.MAGIC_SECRET || "tda_magic_link_secret_key_2026";
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minuti

/**
 * Genera un nuovo Magic Link crittograficamente sicuro e un codice OTP a 6 cifre di backup
 */
export function createMagicLink(email: string, clientId?: string): {
  token: string;
  otpCode: string;
  expiresAt: number;
} {
  const normalizedEmail = email.trim().toLowerCase();

  // Genera token esadecimale sicuro a 64 caratteri (256-bit)
  const token = crypto.randomBytes(32).toString("hex");

  // Genera codice OTP numerico a 6 cifre come fallback
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  const now = Date.now();
  const expiresAt = now + TOKEN_TTL_MS;

  const record: MagicLinkRecord = {
    token,
    otpCode,
    email: normalizedEmail,
    clientId,
    expiresAt,
    used: false,
    createdAt: now,
  };

  // Salva sia per token che per codice OTP per lookup O(1)
  activeMagicLinks.set(token, record);
  activeMagicLinks.set(otpCode, record);

  // Pulizia periodica token scaduti
  cleanupExpiredTokens();

  return { token, otpCode, expiresAt };
}

/**
 * Verifica un token Magic Link o un codice numerico OTP a 6 cifre
 */
export function verifyMagicLink(tokenOrOtp: string, email?: string): {
  valid: boolean;
  error?: string;
  email?: string;
  clientId?: string;
} {
  const query = tokenOrOtp.trim();
  const record = activeMagicLinks.get(query);

  if (!record) {
    return { valid: false, error: "Link o codice di accesso non valido o scaduto." };
  }

  if (Date.now() > record.expiresAt) {
    activeMagicLinks.delete(record.token);
    activeMagicLinks.delete(record.otpCode);
    return { valid: false, error: "Il link o codice è scaduto (validità massima 15 minuti)." };
  }

  if (record.used) {
    return { valid: false, error: "Questo link o codice è già stato utilizzato per l'accesso." };
  }

  if (email && email.trim().toLowerCase() !== record.email) {
    return { valid: false, error: "L'indirizzo email non corrisponde al link generato." };
  }

  // Contrassegna come utilizzato
  record.used = true;
  activeMagicLinks.delete(record.token);
  activeMagicLinks.delete(record.otpCode);

  return {
    valid: true,
    email: record.email,
    clientId: record.clientId,
  };
}

/**
 * Firma una sessione client protetta
 */
export function signClientSession(email: string, clientId?: string): string {
  const payload = JSON.stringify({
    email,
    clientId,
    role: "client",
    iat: Date.now(),
  });
  const b64 = Buffer.from(payload).toString("base64url");
  const hmac = crypto.createHmac("sha256", MAGIC_SECRET).update(b64).digest("base64url");
  return `${b64}.${hmac}`;
}

/**
 * Valida la firma del cookie di sessione client
 */
export function verifyClientSessionToken(cookieValue: string): { email: string; clientId?: string } | null {
  try {
    const [b64, signature] = cookieValue.split(".");
    if (!b64 || !signature) return null;
    const expected = crypto.createHmac("sha256", MAGIC_SECRET).update(b64).digest("base64url");
    if (signature !== expected) return null;
    const json = Buffer.from(b64, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Imposta il cookie di sessione autenticata per l'Area Cliente
 */
export async function setClientSessionCookie(email: string, clientId?: string) {
  const cookieStore = await cookies();
  const sessionToken = signClientSession(email, clientId);
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 giorni
  });
}

/**
 * Recupera la sessione client autenticata dai cookie
 */
export async function getClientSessionFromCookie() {
  const cookieStore = await cookies();
  const c = cookieStore.get(SESSION_COOKIE_NAME);
  if (!c?.value) return null;
  return verifyClientSessionToken(c.value);
}

/**
 * Cancella la sessione client (Logout)
 */
export async function clearClientSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Rimuove i token scaduti
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [key, rec] of activeMagicLinks.entries()) {
    if (now > rec.expiresAt || rec.used) {
      activeMagicLinks.delete(key);
    }
  }
}
