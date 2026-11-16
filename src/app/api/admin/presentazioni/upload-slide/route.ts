import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { uploadImageToR2 } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const slug = (formData.get("slug") as string | null)?.trim() || "custom";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Nessun file ricevuto" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Ottimizza in WebP 2K Retina (max width 2000px senza upscaling)
    const webpBuffer = await sharp(inputBuffer)
      .resize({ width: 2000, withoutEnlargement: true })
      .webp({ quality: 85, effort: 5 })
      .toBuffer();

    const safeSlug = slug.replace(/[^a-z0-9-_]/gi, "-");
    const key = `presentazioni/${safeSlug}/slide_${Date.now()}.webp`;

    const url = await uploadImageToR2(webpBuffer, key, "image/webp");

    return NextResponse.json({
      success: true,
      url,
      key,
      bytes: webpBuffer.length,
    });
  } catch (error: any) {
    console.error("[upload-slide] Errore:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Errore durante ottimizzazione e upload su R2" },
      { status: 500 }
    );
  }
}
