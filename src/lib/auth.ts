import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

const scrypt = promisify(scryptCallback);
const sessionCookie = "olyvara_session";
const sessionLifetime = 7 * 24 * 60 * 60 * 1000;

export type User = { id: string; email: string; name: string; role: "candidate" | "employer" | "admin" };

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionLifetime).toISOString();
  getDb().prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(createHash("sha256").update(token).digest("hex"), userId, expiresAt);
  (await cookies()).set(sessionCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(sessionCookie)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token_hash = ?")
    .run(createHash("sha256").update(token).digest("hex"));
  jar.delete(sessionCookie);
}

export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const row = getDb().prepare(`
    SELECT users.id, users.email, users.name, users.role, sessions.expires_at
    FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ?
  `).get(tokenHash) as (User & { expires_at: string }) | undefined;
  if (!row) return null;
  if (Date.parse(row.expires_at) <= Date.now()) {
    getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    return null;
  }
  const { id, email, name, role } = row;
  return { id, email, name, role };
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}