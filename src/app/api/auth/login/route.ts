import { NextRequest, NextResponse } from "next/server";
import {
  authenticateCredentials,
  signSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  getHomeUrlForRole,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username e password sono obbligatori." },
        { status: 400 }
      );
    }

    const user = authenticateCredentials(username, password);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Credenziali non valide. Verifica username e password.",
        },
        { status: 401 }
      );
    }

    const token = await signSessionToken(user, SESSION_MAX_AGE);
    const redirectUrl = user.defaultRedirect || getHomeUrlForRole(user.role, user.clientId);

    const response = NextResponse.json({
      success: true,
      user,
      redirectUrl,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Errore interno durante il login." },
      { status: 500 }
    );
  }
}
