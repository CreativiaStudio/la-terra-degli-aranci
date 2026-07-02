const { S3Client, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME;

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

async function run() {
  try {
    const cmd = new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: "" });
    const res = await r2Client.send(cmd);
    
    if (!res.Contents || res.Contents.length === 0) {
      console.log("Nessun file trovato nel bucket.");
      return;
    }

    console.log(`Trovati ${res.Contents.length} file in totale. Controllo quali eliminare...`);

    let deletedCount = 0;
    for (const item of res.Contents) {
      if (!item.Key.startsWith("contratti/")) {
        console.log(`Eliminazione del vecchio file: ${item.Key}`);
        await r2Client.send(new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: item.Key
        }));
        deletedCount++;
      } else {
        console.log(`Mantenuto il nuovo file: ${item.Key}`);
      }
    }
    console.log(`Pulizia completata! Eliminati ${deletedCount} vecchi file.`);
  } catch(e) {
    console.error("Errore durante la pulizia:", e);
  }
}
run();
