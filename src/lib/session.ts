/**
 * session.ts - Edge-Safe Web Crypto Session Token Management for Next.js 16
 * 
 * Uses standard Web Crypto API (crypto.subtle) without any Node.js native crypto modules,
 * making it 100% compatible with both Edge Runtime (middleware.ts) and Node.js runtime.
 */

export type UserRole = 'admin' | 'segreteria' | 'planner' | 'wedding' | 'privato' | 'storico';

export interface TDASessionPayload {
  username: string;
  role: UserRole;
  displayName: string;
  clientId?: string;
  clientMode?: 'wedding' | 'privato' | 'storico';
  defaultRedirect: string;
  iat: number; // Unix timestamp in seconds
  exp: number; // Unix timestamp in seconds
}

export const SESSION_COOKIE_NAME = 'tda_session';
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.ENCRYPTION_SECRET ||
  'LaTerraDegliAranci-SuperSecretSessionKey-2026-EdgeSafe';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secret: string = SESSION_SECRET): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Sign a session token using HMAC-SHA256
 */
export async function signSessionToken(
  user: {
    username: string;
    role: UserRole;
    displayName: string;
    clientId?: string;
    clientMode?: 'wedding' | 'privato' | 'storico';
    defaultRedirect: string;
  },
  maxAgeSeconds: number = SESSION_MAX_AGE,
  secret: string = SESSION_SECRET
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: TDASessionPayload = {
    ...user,
    iat: now,
    exp: now + maxAgeSeconds,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = toBase64Url(encoder.encode(payloadJson));

  const key = await getHmacKey(secret);
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  const sigB64 = toBase64Url(new Uint8Array(sigBuffer));

  return `${payloadB64}.${sigB64}`;
}

/**
 * Verify a session token using HMAC-SHA256 and expiration check
 */
export async function verifySessionToken(
  token: string,
  secret: string = SESSION_SECRET
): Promise<TDASessionPayload | null> {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, sigB64] = parts;
    if (!payloadB64 || !sigB64) return null;

    const key = await getHmacKey(secret);
    const sigBytes = fromBase64Url(sigB64);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      encoder.encode(payloadB64) as unknown as BufferSource
    );

    if (!isValid) return null;

    const payloadBytes = fromBase64Url(payloadB64);
    const payloadJson = decoder.decode(payloadBytes);
    const session = JSON.parse(payloadJson) as TDASessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (session.exp && now > session.exp) {
      return null; // Expired token
    }

    return session;
  } catch {
    return null;
  }
}
