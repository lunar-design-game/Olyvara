import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sendOpportunityAlertEmails, sendUserNotificationEmail } from "@/lib/email";

export const runtime = "nodejs";
const decisions = new Set(["published", "rejected"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Administrator access required." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  let body: { status?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Choose a moderation decision." }, { status: 400 });
  }
  const status = body.status;
  const reason = body.reason?.trim();
  if (!status || !decisions.has(status) || !reason || reason.length > 500) {
    return NextResponse.json({ error: "Choose a decision and record a reason (up to 500 characters)." }, { status: 400 });
  }
  const { id } = await context.params;
  const db = getDb();
  const job = db.prepare(`SELECT jobs.id, jobs.status, jobs.title, jobs.slug, jobs.location, jobs.work_arrangement,
      organizations.owner_id, organizations.name AS organization_name
    FROM jobs JOIN organizations ON organizations.id = jobs.organization_id WHERE jobs.id = ?`)
    .get(id) as { id: string; status: string; title: string; slug: string; location: string; work_arrangement: string; owner_id: string | null; organization_name: string } | undefined;
  if (!job || job.status !== "pending_moderation") return NextResponse.json({ error: "This vacancy is not awaiting review." }, { status: 409 });
  const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare("UPDATE jobs SET status = ?, last_confirmed_at = ? WHERE id = ?").run(status, now, id);
    db.prepare(`INSERT INTO audit_events (id, actor_id, action, record_type, record_id, details, created_at)
      VALUES (?, ?, ?, 'job', ?, ?, ?)`)
      .run(randomUUID(), user.id, `job_${status}`, id, reason, now);
    if (job.owner_id) {
      db.prepare("INSERT INTO notifications (id, user_id, message, created_at) VALUES (?, ?, ?, ?)")
        .run(randomUUID(), job.owner_id, status === "published" ? "Your vacancy passed review and is now published." : "Your vacancy was not approved. Review the decision details with support.", now);
    }
  })();
  if (job.owner_id) {
    await sendUserNotificationEmail(job.owner_id, status === "published" ? "Your Olyvara vacancy is live" : "Update on your Olyvara vacancy", status === "published" ? "Your vacancy passed review and is now published." : "Your vacancy was not approved. Review the decision details with support.");
  }
  if (status === "published") await sendOpportunityAlertEmails(job);
  return NextResponse.json({ ok: true });
}