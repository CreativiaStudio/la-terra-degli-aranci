import crypto from 'crypto';

const SECRET_PHRASE = process.env.ENCRYPTION_SECRET || "LaTerraDegliAranci-SuperSecretKey-2026";
const ENCRYPTION_KEY = crypto.scryptSync(SECRET_PHRASE, 'salt', 32); // Creates a secure 32-byte key
const IV_LENGTH = 16;

export function encryptPayload(data: object): string {
  const text = JSON.stringify(data);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return Buffer.from(iv.toString('hex') + ':' + encrypted.toString('hex')).toString('base64url');
}

export function decryptPayload(token: string): any {
  try {
    const decodedToken = Buffer.from(token, 'base64url').toString('utf-8');
    const textParts = decodedToken.split(':');
    if (textParts.length !== 2) return null;
    
    const iv = Buffer.from(textParts.shift() as string, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return JSON.parse(decrypted.toString());
  } catch (error) {
    return null;
  }
}

export function generateSignature(prezzo: string, preventivo: string) {
  return crypto.createHmac('sha256', SECRET_PHRASE)
    .update(`${prezzo}:${preventivo}`)
    .digest('hex')
    .slice(0, 10);
}
