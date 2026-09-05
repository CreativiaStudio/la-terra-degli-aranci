export async function getContractSignature(prezzo: string | number, preventivo: string): Promise<string> {
  const secret = "LaTerraDegliAranci-SuperSecretKey-2026";
  const message = `${prezzo}:${preventivo}`;

  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const msgData = encoder.encode(message);

      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, msgData);
      const hashHex = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return hashHex.slice(0, 10);
    }
  } catch (e) {
    console.warn('[Signature Generator Fallback]', e);
  }

  // Known fallback signature for demo sessions
  return "e1c9a53880";
}
