import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID || "cdc3d1bfef17f23cb453fe2737b2ede8";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "a15ba732cf75ed7cb171a095e794a479";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "b064d22ca4c9d49bd04da248a2fdc7ae41a54a63fd198203325fe50f0aa8642f";

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

export async function uploadPdfToR2(buffer: Buffer, fileName: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: "application/pdf",
  });

  await r2Client.send(command);
  return `${PUBLIC_R2_URL}/${fileName}`;
}

export async function uploadJsonToR2(jsonObject: any, fileName: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: JSON.stringify(jsonObject),
    ContentType: "application/json",
  });

  await r2Client.send(command);
  return `${PUBLIC_R2_URL}/${fileName}`;
}

export async function listPdfsInR2(prefix: string) {
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

  return items.sort((a, b) => {
    if (!a.lastModified || !b.lastModified) return 0;
    return b.lastModified.getTime() - a.lastModified.getTime();
  });
}
