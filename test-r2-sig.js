const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME;

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
  // forcePathStyle: true,
});

async function run() {
  try {
    const cmd = new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: "" });
    const res = await r2Client.send(cmd);
    console.log("SUCCESS! Found", res.Contents?.length || 0, "objects");
  } catch(e) {
    console.error("ERROR WITHOUT forcePathStyle:", e.message);
    console.log("Trying WITH forcePathStyle...");
    
    const r2Client2 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
    try {
      const cmd2 = new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: "" });
      const res2 = await r2Client2.send(cmd2);
      console.log("SUCCESS WITH forcePathStyle! Found", res2.Contents?.length || 0, "objects");
    } catch(e2) {
      console.error("ERROR WITH forcePathStyle:", e2.message);
    }
  }
}
run();
