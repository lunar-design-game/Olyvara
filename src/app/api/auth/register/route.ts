import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { name?: string; email?: string; password?: string; role?: string; organization?: string; ageConfirmed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter valid account details." }, { status: 400 });
  }
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const role = body.role === "employer" ? "employer" : "candidate";
  const organization = body.organization?.trim();
  if (!name || name.length > 100 || !email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a name and valid email address." }, { status: 400 });
  }
  if (password.length < 12 || password.length > 128) {
    return NextResponse.json({ error: "Use a password between 12 and 128 characters." }, { status: 400 });
  }
  if (role === "candidate" && body.ageConfirmed !== true) {
    return NextResponse.json({ error: "Candidate accounts are for people aged 18 or older." }, { status: 400 });
  }
  if (role === "employer" && (!organization || organization.length > 160)) {
    return NextResponse.json({ error: "Enter your organization name." }, { status: 400 });
  }

  const db = getDb();
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) {
    return NextResponse.json({ error: "An account already uses that email." }, { status: 409 });
  }
  const userId = randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);
  const create = db.transaction(() => {
    db.prepare("INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(userId, email, name, passwordHash, role, now);
    if (role === "employer") {
      db.prepare("INSERT INTO organizations (id, owner_id, name, created_at) VALUES (?, ?, ?, ?)")
        .run(randomUUID(), userId, organization, now);
    }
  });
  try {
    create();
    await createSession(userId);
    return NextResponse.json({ ok: true, redirect: "/dashboard" }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return NextResponse.json({ error: "An account already uses that email." }, { status: 409 });
    }
    return NextResponse.json({ error: "Account creation failed. Please try again." }, { status: 500 });
  }
}