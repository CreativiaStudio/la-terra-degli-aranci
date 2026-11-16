import { NextRequest, NextResponse } from "next/server";
import { getPresentationAnalytics, recordPresentationScan } from "@/lib/presentazioniCloud";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, User-Agent",
};

async function isAuthorizedAdmin(req: NextRequest): Promise<boolean> {
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) {
    const session = await verifySessionToken(sessionCookie);
    if (session?.role === "admin") return true;
  }

  const basicAuth = req.headers.get("authorization");
  if (basicAuth && basicAuth.startsWith("Basic ")) {
    try {
      const [user, pwd] = atob(basicAuth.split(" ")[1]).split(":");
      const expectedUser = process.env.ADMIN_USERNAME || "admin";
      const expectedPwd = process.env.ADMIN_PASSWORD || "Roberto2026!";
      if (user === expectedUser && pwd === expectedPwd) return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorizedAdmin(req))) {
    return NextResponse.json(
      { success: false, error: "Accesso Negato: Richiesta autorizzazione amministratore" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  try {
    const analytics = await getPresentationAnalytics();
    return NextResponse.json(
      { success: true, analytics },
      {
        headers: {
          ...CORS_HEADERS,
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Errore lettura statistiche" },
      { status: 500, headers: CORS_HEADERS }
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

    return NextResponse.json(
      {
        success: true,
        stats: analytics.bySlug[slug] || null,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Errore tracciamento" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
