import { NextRequest, NextResponse } from "next/server";
import { generateBrandedQrPng, generateBrandedQrSvg } from "@/lib/qrBranded";

const BASE_PUBLIC_URL = "https://ecosistema.laterradegliaranci.it";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = (searchParams.get("slug") || "hub").trim();
    const format = (searchParams.get("format") || "png").toLowerCase();
    const download = searchParams.get("download") === "1";

    const targetUrl =
      slug === "hub"
        ? `${BASE_PUBLIC_URL}/presentazioni?src=qr`
        : `${BASE_PUBLIC_URL}/presentazioni/${encodeURIComponent(slug)}?src=qr`;

    const safeName = slug.replace(/[^a-z0-9-_]/gi, "_");

    if (format === "svg") {
      const svg = await generateBrandedQrSvg(targetUrl);
      const headers: Record<string, string> = {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      };
      if (download) {
        headers["Content-Disposition"] = `attachment; filename="qr_${safeName}_tda.svg"`;
      }
      return new NextResponse(svg, { status: 200, headers });
    }

    const sizeParam = Number(searchParams.get("size") || "1200");
    const size = Number.isFinite(sizeParam) ? Math.min(Math.max(sizeParam, 300), 2400) : 1200;
    const pngBuffer = await generateBrandedQrPng(targetUrl, size);

    const headers: Record<string, string> = {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    };
    if (download) {
      headers["Content-Disposition"] = `attachment; filename="qr_${safeName}_tda.png"`;
    }

    return new NextResponse(new Uint8Array(pngBuffer), { status: 200, headers });
  } catch (error: any) {
    console.error("[qr route] Errore:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Errore generazione QR Code" },
      { status: 500 }
    );
  }
}
