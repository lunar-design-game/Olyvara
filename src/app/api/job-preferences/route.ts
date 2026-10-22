import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to save job preferences." }, { status: 401 });
  if (user.role !== "candidate") return NextResponse.json({ error: "Candidate access required." }, { status: 403 });

  let body: { keywords?: string; location?: string; arrangement?: string; currency?: string; minimumSalary?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter valid job preferences." }, { status: 400 });
  }

  const keywords = body.keywords?.trim() ?? "";
  const location = body.location?.trim() ?? "";
  const arrangement = body.arrangement ?? "";
  const currency = body.currency ?? "";
  const minimumSalary = body.minimumSalary ?? 0;
  if (keywords.length > 100 || location.length > 100) {
    return NextResponse.json({ error: "Keep keywords and location under 100 characters." }, { status: 400 });
  }
  if (arrangement && !["Remote", "Hybrid", "On-site"].includes(arrangement)) {
    return NextResponse.json({ error: "Choose a valid work arrangement." }, { status: 400 });
  }
  if (currency && !["KES", "USD", "EUR", "GBP"].includes(currency)) {
    return NextResponse.json({ error: "Choose a supported salary currency." }, { status: 400 });
  }
  if (!Number.isSafeInteger(minimumSalary) || minimumSalary < 0 || minimumSalary > 10_000_000 || (minimumSalary > 0 && !currency)) {
    return NextResponse.json({ error: "Choose a valid minimum salary and currency." }, { status: 400 });
  }

  getDb().prepare(`INSERT INTO candidate_job_preferences (candidate_id, keywords, location, work_arrangement, currency, minimum_salary, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(candidate_id) DO UPDATE SET keywords = excluded.keywords,
    location = excluded.location, work_arrangement = excluded.work_arrangement, currency = excluded.currency,
    minimum_salary = excluded.minimum_salary, updated_at = excluded.updated_at`)
    .run(user.id, keywords, location, arrangement, currency, minimumSalary, new Date().toISOString());
  return NextResponse.json({ ok: true, message: "Your job preferences are saved." });
}