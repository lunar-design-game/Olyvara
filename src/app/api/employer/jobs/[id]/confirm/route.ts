import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to confirm your vacancy." }, { status: 401 });
  if (user.role !== "employer") return NextResponse.json({ error: "Employer access required." }, { status: 403 });
  const { id } = await params;
  const db = getDb();
  const vacancy = db.prepare(`SELECT jobs.id FROM jobs JOIN organizations ON organizations.id = jobs.organization_id
    WHERE jobs.id = ? AND organizations.owner_id = ? AND jobs.status = 'published'`).get(id, user.id);
  if (!vacancy) return NextResponse.json({ error: "Published vacancy not found." }, { status: 404 });
  const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare("UPDATE jobs SET last_confirmed_at = ? WHERE id = ?").run(now, id);
    db.prepare("INSERT INTO notifications (id, user_id, message, created_at) VALUES (?, ?, ?, ?)")
      .run(randomUUID(), user.id, "You confirmed that your vacancy is still open. It will remain visible in search for 30 more days.", now);
  })();
  return NextResponse.json({ ok: true, confirmedAt: now });
}