import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getPublicOrigin } from "@/lib/public-url";

export const runtime = "nodejs";

function registrationRedirect(request: Request, result: "setup" | "failed") {
  const cookies = request.headers.get("cookie") ?? "";
  const flow = cookies.split(";").map((item) => item.trim()).find((item) => item.startsWith("olyvara_google_flow="))?.split("=").at(-1);
  const page = flow === "login" ? "/sign-in" : "/register";
  const response = NextResponse.redirect(new URL(`${page}?google=${result}`, getPublicOrigin(request)));
  response.cookies.delete("olyvara_google_state");
  response.cookies.delete("olyvara_google_flow");
  return response;
}

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return registrationRedirect(request, "setup");

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state") ?? "";
  const cookieState = request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith("olyvara_google_state="))?.split("=").slice(1).join("=") ?? "";
  if (!code || !state || !cookieState || state.length !== cookieState.length || !timingSafeEqual(Buffer.from(state), Buffer.from(cookieState))) {
    return registrationRedirect(request, "failed");
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? new URL("/api/auth/google/callback", getPublicOrigin(request)).toString();
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    if (!tokenResponse.ok) return registrationRedirect(request, "failed");
    const token = await tokenResponse.json() as { access_token?: string };
    if (!token.access_token) return registrationRedirect(request, "failed");

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!profileResponse.ok) return registrationRedirect(request, "failed");
    const profile = await profileResponse.json() as { email?: string; email_verified?: boolean; name?: string };
    const email = profile.email?.trim().toLowerCase();
    if (!email || profile.email_verified !== true) return registrationRedirect(request, "failed");

    const db = getDb();
    let user = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: string } | undefined;
    if (!user) {
      const id = randomUUID();
      const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
      db.prepare("INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, 'candidate', ?)")
        .run(id, email, profile.name?.trim().slice(0, 100) || email.split("@")[0], passwordHash, new Date().toISOString());
      user = { id };
    }
    await createSession(user.id);
    const response = NextResponse.redirect(new URL("/dashboard", getPublicOrigin(request)));
    response.cookies.delete("olyvara_google_state");
    response.cookies.delete("olyvara_google_flow");
    return response;
  } catch {
    return registrationRedirect(request, "failed");
  }
}