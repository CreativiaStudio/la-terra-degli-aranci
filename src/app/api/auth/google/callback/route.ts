import { NextRequest, NextResponse } from "next/server";
import { saveGoogleCalendarAuthLocal } from "@/lib/localDb";
import { syncGoogleCalendarLive } from "@/lib/calendarSyncEngine";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/admin/calendario?gcal_error=${encodeURIComponent(error || "no_code")}`, req.url)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/admin/calendario?gcal_error=missing_credentials", req.url)
    );
  }

  try {
    // Scambio code per access_token e refresh_token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Errore scambio token Google:", errText);
      return NextResponse.redirect(
        new URL("/admin/calendario?gcal_error=token_exchange_failed", req.url)
      );
    }

    const tokenData = await tokenRes.json();
    let email = "segreteriatda@gmail.com";

    // Recupera email dell'account loggato
    if (tokenData.access_token) {
      try {
        const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (userinfoRes.ok) {
          const userData = await userinfoRes.json();
          if (userData.email) email = userData.email;
        }
      } catch (e) {
        console.warn("Impossibile recuperare email userinfo:", e);
      }
    }

    // Salva le credenziali permanenti nello store locale
    saveGoogleCalendarAuthLocal({
      connected: true,
      email,
      refresh_token: tokenData.refresh_token,
      access_token: tokenData.access_token,
      expires_at: Date.now() + ((tokenData.expires_in || 3600) * 1000),
      last_synced_at: new Date().toISOString(),
    });

    // Avvia subito il primo sync reale per importare tutti gli eventi!
    try {
      await syncGoogleCalendarLive();
    } catch (syncErr) {
      console.warn("Primo sync live fallito:", syncErr);
    }

    return NextResponse.redirect(new URL("/admin/calendario?gcal_connected=1", req.url));
  } catch (err: any) {
    console.error("Errore OAuth callback Google:", err);
    return NextResponse.redirect(
      new URL(`/admin/calendario?gcal_error=${encodeURIComponent(err.message || "unknown")}`, req.url)
    );
  }
}
