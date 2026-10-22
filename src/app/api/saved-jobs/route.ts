import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Create an account or sign in to save opportunities." }, { status: 401 });
  if (user.role !== "candidate") return NextResponse.json({ error: "Candidate accounts can save opportunities." }, { status: 403 });
  let body: { jobId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Choose a valid opportunity." }, { status: 400 });
  }
  if (!body.jobId || typeof body.jobId !== "string") return NextResponse.json({ error: "Choose a valid opportunity." }, { status: 400 });
  const db = getDb();
  const job = db.prepare("SELECT id FROM jobs WHERE id = ? AND status = 'published'").get(body.jobId);
  if (!job) return NextResponse.json({ error: "This opportunity is no longer available." }, { status: 404 });
  db.prepare("INSERT OR IGNORE INTO saved_jobs (candidate_id, job_id, created_at) VALUES (?, ?, ?)")
    .run(user.id, body.jobId, new Date().toISOString());
  return NextResponse.json({ ok: true, saved: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage saved opportunities." }, { status: 401 });
  if (user.role !== "candidate") return NextResponse.json({ error: "Candidate access required." }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { jobId?: string };
  if (!body.jobId || typeof body.jobId !== "string") return NextResponse.json({ error: "Choose a valid opportunity." }, { status: 400 });
  getDb().prepare("DELETE FROM saved_jobs WHERE candidate_id = ? AND job_id = ?").run(user.id, body.jobId);
  return NextResponse.json({ ok: true, saved: false });
}