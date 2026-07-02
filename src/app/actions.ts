"use server";

import { generateSignature } from "@/lib/crypto";

export async function generateSecureToken(prezzo: string, preventivo: string) {
  const sig = generateSignature(prezzo, preventivo);
  return { prezzo, preventivo, sig };
}
