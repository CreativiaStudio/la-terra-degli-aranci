import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      username: payload.username,
      role: payload.role,
      displayName: payload.displayName,
      clientId: payload.clientId,
      clientMode: payload.clientMode,
      defaultRedirect: payload.defaultRedirect,
    },
  });
}
