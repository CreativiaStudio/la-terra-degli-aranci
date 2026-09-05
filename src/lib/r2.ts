import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID || "cdc3d1bfef17f23cb453fe2737b2ede8";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "a15ba732cf75ed7cb171a095e794a479";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "4f09e1eb767175bf174301dfb41ea4c38c9aac8648aafb78d9914239d6a6093f";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const BUCKET_NAME = process.env.R2_BUCKET_NAME || "la-terra-degli-aranci";
export const PUBLIC_R2_URL = "https://pub-ace85c0d97114c1a980199bf8afb379b.r2.dev";

// Cache in memoria (60 secondi) per evitare chiamate ripetute su R2 durante i click nel menu
let r2Cache: { [key: string]: { data: any[], timestamp: number } } = {};

export async function uploadPdfToR2(buffer: Buffer, fileName: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: "application/pdf",
  });

  await r2Client.send(command);
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

  await r2Client.send(command);
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

  await r2Client.send(command);
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

      const response = await r2Client.send(command);
      const items = response.Contents?.map(item => ({
        key: item.Key,
        lastModified: item.LastModified,
        size: item.Size,
        url: `${PUBLIC_R2_URL}/${item.Key}`
      })) || [];

      const sorted = items.sort((a, b) => {
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
