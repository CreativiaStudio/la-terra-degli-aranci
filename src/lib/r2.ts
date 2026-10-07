import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

// Credenziali MASTER certificate: funzionano sempre, indipendentemente dalle env di Vercel.
const MASTER_ACCOUNT_ID = "cdc3d1bfef17f23cb453fe2737b2ede8";
const MASTER_ACCESS_KEY_ID = "a15ba732cf75ed7cb171a095e794a479";
const MASTER_SECRET_ACCESS_KEY = "4f09e1eb767175bf174301dfb41ea4c38c9aac8648aafb78d9914239d6a6093f";

// Pulisce le variabili d'ambiente: rimuove spazi, newline e virgolette accidentali
// (spesso incollate per errore nelle impostazioni di Vercel).
function sanitizeEnv(value: string | undefined | null): string {
  if (!value) return "";
  return value.trim().replace(/^["']|["']$/g, "").trim();
}

const envAccountId = sanitizeEnv(process.env.R2_ACCOUNT_ID);
const envAccessKeyId = sanitizeEnv(process.env.R2_ACCESS_KEY_ID);
const envSecretAccessKey = sanitizeEnv(process.env.R2_SECRET_ACCESS_KEY);

const accountId = envAccountId || MASTER_ACCOUNT_ID;
const accessKeyId = envAccessKeyId || MASTER_ACCESS_KEY_ID;
const secretAccessKey = envSecretAccessKey || MASTER_SECRET_ACCESS_KEY;

// Client primario: usa le env (pulite) oppure, in mancanza, le credenziali master.
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

// Client master certificato: rete di sicurezza se le env su Vercel sono disallineate.
const masterR2Client = new S3Client({
  region: "auto",
  endpoint: `https://${MASTER_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: MASTER_ACCESS_KEY_ID,
    secretAccessKey: MASTER_SECRET_ACCESS_KEY,
  },
});

export const BUCKET_NAME = sanitizeEnv(process.env.R2_BUCKET_NAME) || "la-terra-degli-aranci";
export const PUBLIC_R2_URL = "https://pub-ace85c0d97114c1a980199bf8afb379b.r2.dev";

// Riconosce gli errori di autenticazione/firma S3 per attivare il fallback al client master.
function isSignatureAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { name?: string; Code?: string; message?: string };
  const code = `${err.name || ""} ${err.Code || ""}`;
  const message = err.message || "";

  if (
    code.includes("SignatureDoesNotMatch") ||
    code.includes("InvalidAccessKeyId") ||
    code.includes("InvalidSignatureException") ||
    code.includes("AccessDenied")
  ) {
    return true;
  }

  return /SignatureDoesNotMatch|signature we calculated does not match|InvalidAccessKeyId|signing method/i.test(
    message
  );
}

// Esegue un comando R2 provando il client primario e, in caso di errore di firma,
// riprova immediatamente con il client master certificato.
export async function executeR2Command<T = any>(command: any): Promise<T> {
  try {
    return (await r2Client.send(command)) as T;
  } catch (error) {
    if (isSignatureAuthError(error)) {
      console.warn(
        "R2: firma non valida con il client primario, ritento con il client master certificato.",
        error
      );
      return (await masterR2Client.send(command)) as T;
    }
    throw error;
  }
}

// Cache in memoria (60 secondi) per evitare chiamate ripetute su R2 durante i click nel menu
let r2Cache: { [key: string]: { data: any[], timestamp: number } } = {};

export async function uploadPdfToR2(buffer: Buffer, fileName: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: "application/pdf",
  });

  await executeR2Command(command);
  // Invalida cache R2 dopo un nuovo upload
  r2Cache = {};
  return `${PUBLIC_R2_URL}/${fileName}`;
}

export async function uploadImageToR2(buffer: Buffer, fileName: string, contentType: string = "image/jpeg") {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
  });

  await executeR2Command(command);
  r2Cache = {};
  return `${PUBLIC_R2_URL}/${fileName}`;
}

export async function uploadJsonToR2(jsonObject: any, fileName: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: JSON.stringify(jsonObject, null, 2),
    ContentType: "application/json",
  });

  await executeR2Command(command);
  r2Cache = {};
  return `${PUBLIC_R2_URL}/${fileName}`;
}

export async function listPdfsInR2(prefix: string) {
  const now = Date.now();
  if (r2Cache[prefix] && (now - r2Cache[prefix].timestamp < 60000)) {
    return r2Cache[prefix].data;
  }

  const fetchPromise = (async () => {
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
      });

      const response = await executeR2Command<any>(command);
      const items = response.Contents?.map((item: any) => ({
        key: item.Key,
        lastModified: item.LastModified,
        size: item.Size,
        url: `${PUBLIC_R2_URL}/${item.Key}`
      })) || [];

      const sorted = items.sort((a: any, b: any) => {
        if (!a.lastModified || !b.lastModified) return 0;
        return b.lastModified.getTime() - a.lastModified.getTime();
      });

      r2Cache[prefix] = { data: sorted, timestamp: now };
      return sorted;
    } catch (e) {
      console.warn("Avviso lettura R2:", e);
      return r2Cache[prefix] ? r2Cache[prefix].data : [];
    }
  })();

  // Timeout ultra-veloce (150ms): se R2 è in ritardo di rete, risponde con la cache locale o [] senza bloccare il render
  const timeoutPromise = new Promise<any[]>((resolve) => {
    setTimeout(() => {
      resolve(r2Cache[prefix] ? r2Cache[prefix].data : []);
    }, 150);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}
