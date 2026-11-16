import { NextRequest, NextResponse } from "next/server";
import { getPresentationAnalytics, recordPresentationScan } from "@/lib/presentazioniCloud";

export async function GET() {
  try {
    const analytics = await getPresentationAnalytics();
    return NextResponse.json({ success: true, analytics });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Errore lettura statistiche" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = typeof body?.slug === "string" && body.slug.trim() ? body.slug.trim() : "hub";
    const source = body?.source === "qr" ? "qr" : "direct";
    const isUnique = body?.isUnique !== false;
    const userAgent = req.headers.get("user-agent") || undefined;

    const analytics = await recordPresentationScan({
      slug,
      source,
      isUnique,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      stats: analytics.bySlug[slug] || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Errore tracciamento" },
      { status: 500 }
    );
  }
}
