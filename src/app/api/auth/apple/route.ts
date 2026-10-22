import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getPublicOrigin } from "@/lib/public-url";

export const runtime = "nodejs";

function setupRedirect(request: Request, flow: string | null) {
  const page = flow === "login" ? "/sign-in?apple=setup" : "/register?apple=setup";
  return NextResponse.redirect(new URL(page, getPublicOrigin(request)));
}

export async function GET(request: Request) {
  const flow = new URL(request.url).searchParams.get("flow");
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId || !process.env.APPLE_TEAM_ID || !process.env.APPLE_KEY_ID || !process.env.APPLE_PRIVATE_KEY) {
    return setupRedirect(request, flow);
  }

  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const origin = getPublicOrigin(request);
  const redirectUri = process.env.APPLE_REDIRECT_URI ?? new URL("/api/auth/apple/callback", origin).toString();
  const authorizationUrl = new URL("https://appleid.apple.com/auth/authorize");
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code id_token",
    response_mode: "form_post",
    scope: "name email",
    state,
    nonce,
  }).toString();
  const response = NextResponse.redirect(authorizationUrl);
  for (const [name, value] of [["olyvara_apple_state", state], ["olyvara_apple_nonce", nonce], ["olyvara_apple_flow", flow === "login" ? "login" : "register"]]) {
    response.cookies.set(name, value, { httpOnly: true, secure: true, sameSite: "none", path: "/api/auth/apple", maxAge: 600 });
  }
  return response;
}