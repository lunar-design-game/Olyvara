import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { NextResponse } from "next/server";
import { clearSession, getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before deleting your account." }, { status: 401 });
  if (user.role === "admin") return NextResponse.json({ error: "Administrator accounts cannot be deleted here." }, { status: 403 });

  let body: { confirmation?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Confirm account deletion to continue." }, { status: 400 });
  }
  if (body.confirmation !== "DELETE") return NextResponse.json({ error: "Type DELETE exactly to confirm account removal." }, { status: 400 });

  const db = getDb();
  const attachments = db.prepare(`
    SELECT video_path, cv_path FROM applications
    WHERE candidate_id = ? OR job_id IN (
      SELECT jobs.id FROM jobs JOIN organizations ON organizations.id = jobs.organization_id
      WHERE organizations.owner_id = ?
    )
  `).all(user.id, user.id) as { video_path: string; cv_path: string }[];
  db.transaction(() => {
    db.prepare("INSERT INTO audit_events (id, actor_id, action, record_type, record_id, details, created_at) VALUES (?, ?, 'account_deleted', 'user', ?, ?, ?)")
      .run(randomUUID(), user.id, user.id, `Account and related data deleted by ${user.role}.`, new Date().toISOString());
    db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
  })();

  const uploadDirectory = resolve(process.env.OLYVARA_UPLOAD_DIR ?? "./data/private-uploads");
  for (const attachment of attachments) {
    for (const filename of [attachment.video_path, attachment.cv_path]) {
      if (!filename || basename(filename) !== filename) continue;
      try {
        await rm(resolve(uploadDirectory, filename), { force: true });
      } catch {
        console.error("An account attachment could not be removed from private storage.");
      }
    }
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}