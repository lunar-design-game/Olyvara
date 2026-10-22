import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sendUserNotificationEmail } from "@/lib/email";

export const runtime = "nodejs";
const allowedStatuses = new Set(["under_review", "shortlisted", "interview_invited", "rejected", "position_closed"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage applications." }, { status: 401 });
  if (user.role !== "employer") return NextResponse.json({ error: "Employer access required." }, { status: 403 });
  let body: { status?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Choose a valid status." }, { status: 400 });
  }
  const nextStatus = body.status;
  if (!nextStatus || !allowedStatuses.has(nextStatus) || (body.note?.length ?? 0) > 500) {
    return NextResponse.json({ error: "Choose a valid application status." }, { status: 400 });
  }
  const { id } = await context.params;
  const db = getDb();
  const application = db.prepare(`
    SELECT applications.id, applications.candidate_id, applications.status AS current_status
    FROM applications JOIN jobs ON jobs.id = applications.job_id
    JOIN organizations ON organizations.id = jobs.organization_id
    WHERE applications.id = ? AND organizations.owner_id = ?
  `).get(id, user.id) as { id: string; candidate_id: string; current_status: string } | undefined;
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  if (["hired", "rejected", "withdrawn", "position_closed"].includes(application.current_status)) {
    return NextResponse.json({ error: "This application is already closed." }, { status: 409 });
  }

  const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare("UPDATE applications SET status = ?, updated_at = ? WHERE id = ?").run(nextStatus, now, id);
    db.prepare(`INSERT INTO application_events (id, application_id, actor_id, status, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .run(randomUUID(), id, user.id, nextStatus, body.note?.trim() ?? "Status updated by the employer.", now);
    db.prepare("INSERT INTO notifications (id, user_id, message, created_at) VALUES (?, ?, ?, ?)")
      .run(randomUUID(), application.candidate_id, `Your application status was updated to ${nextStatus.replaceAll("_", " ")}.`, now);
  })();
  await sendUserNotificationEmail(application.candidate_id, "Your Olyvara application was updated", `Your application status was updated to ${nextStatus.replaceAll("_", " ")}.`);
  return NextResponse.json({ ok: true });
}