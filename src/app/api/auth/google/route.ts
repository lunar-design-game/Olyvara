import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getPublicOrigin } from "@/lib/public-url";

export const runtime = "nodejs";

function setupRedirect(request: Request, flow: string | null) {
  const page = flow === "login" ? "/sign-in?google=setup" : "/register?google=setup";
  return NextResponse.redirect(new URL(page, getPublicOrigin(request)));
}

export async function GET(request: Request) {
  const flow = new URL(request.url).searchParams.get("flow");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return setupRedirect(request, flow);

  const state = randomBytes(32).toString("base64url");
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? new URL("/api/auth/google/callback", getPublicOrigin(request)).toString();
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();
  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set("olyvara_google_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  response.cookies.set("olyvara_google_flow", flow === "login" ? "login" : "register", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return response;
}