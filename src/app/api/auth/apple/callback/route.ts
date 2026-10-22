import { randomBytes, randomUUID } from "node:crypto";
import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from "jose";
import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getPublicOrigin } from "@/lib/public-url";

export const runtime = "nodejs";

const appleKeys = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

function readCookie(request: Request, name: string) {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.split("=").slice(1).join("=") ?? "";
}

function callbackRedirect(request: Request, result: "setup" | "failed") {
  const page = readCookie(request, "olyvara_apple_flow") === "login" ? "/sign-in" : "/register";
  const response = NextResponse.redirect(new URL(`${page}?apple=${result}`, getPublicOrigin(request)));
  response.cookies.delete("olyvara_apple_state");
  response.cookies.delete("olyvara_apple_nonce");
  response.cookies.delete("olyvara_apple_flow");
  return response;
}

export async function POST(request: Request) {
  const clientId = process.env.APPLE_CLIENT_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY;
  if (!clientId || !teamId || !keyId || !privateKey) {
    return callbackRedirect(request, "setup");
  }
  try {
    const form = await request.formData();
    const state = form.get("state");
    const code = form.get("code");
    const expectedState = readCookie(request, "olyvara_apple_state");
    const nonce = readCookie(request, "olyvara_apple_nonce");
    if (typeof state !== "string" || !expectedState || state !== expectedState || typeof code !== "string" || !nonce) {
      return callbackRedirect(request, "failed");
    }

    const redirectUri = process.env.APPLE_REDIRECT_URI ?? new URL("/api/auth/apple/callback", getPublicOrigin(request)).toString();
    const signingKey = await importPKCS8(privateKey.replaceAll("\\n", "\n"), "ES256");
    const clientSecret = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: keyId })
      .setIssuer(teamId)
      .setSubject(clientId)
      .setAudience("https://appleid.apple.com")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(signingKey);
    const tokenResponse = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri }),
    });
    if (!tokenResponse.ok) return callbackRedirect(request, "failed");
    const tokens = await tokenResponse.json() as { id_token?: string };
    if (!tokens.id_token) return callbackRedirect(request, "failed");

    const { payload } = await jwtVerify(tokens.id_token, appleKeys, { issuer: "https://appleid.apple.com", audience: clientId });
    if (payload.nonce !== nonce) return callbackRedirect(request, "failed");
    const subject = payload.sub;
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const verified = payload.email_verified === true || payload.email_verified === "true";
    if (!subject || (email && !verified)) return callbackRedirect(request, "failed");

    const db = getDb();
    let user = db.prepare(`SELECT users.id FROM oauth_accounts JOIN users ON users.id = oauth_accounts.user_id
      WHERE oauth_accounts.provider = 'apple' AND oauth_accounts.provider_user_id = ?`).get(subject) as { id: string } | undefined;
    if (!user && email) user = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: string } | undefined;
    if (!user && email) {
      const id = randomUUID();
      const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
      let name = email.split("@")[0];
      const userValue = form.get("user");
      if (typeof userValue === "string") {
        try {
          const appleUser = JSON.parse(userValue) as { name?: { firstName?: string; lastName?: string } };
          name = [appleUser.name?.firstName, appleUser.name?.lastName].filter(Boolean).join(" ").slice(0, 100) || name;
        } catch {
          // Apple may omit the one-time name field on later sign-ins.
        }
      }
      db.prepare("INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, 'candidate', ?)")
        .run(id, email, name, passwordHash, new Date().toISOString());
      user = { id };
    }
    if (!user) return callbackRedirect(request, "failed");
    db.prepare("INSERT OR IGNORE INTO oauth_accounts (provider, provider_user_id, user_id) VALUES ('apple', ?, ?)").run(subject, user.id);
    await createSession(user.id);
    const response = NextResponse.redirect(new URL("/dashboard", getPublicOrigin(request)));
    response.cookies.delete("olyvara_apple_state");
    response.cookies.delete("olyvara_apple_nonce");
    response.cookies.delete("olyvara_apple_flow");
    return response;
  } catch {
    return callbackRedirect(request, "failed");
  }
}