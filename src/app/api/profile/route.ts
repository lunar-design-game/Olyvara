import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Create an account to build your profile." }, { status: 401 });
  if (user.role !== "candidate") return NextResponse.json({ error: "Candidate access required." }, { status: 403 });
  let body: { headline?: string; location?: string; skills?: string; about?: string; experience?: string; education?: string; website?: string; emailJobAlerts?: boolean; networkVisible?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter valid profile details." }, { status: 400 });
  }
  const headline = body.headline?.trim() ?? "";
  const location = body.location?.trim() ?? "";
  const skills = body.skills?.split(",").map((skill) => skill.trim()).filter(Boolean).slice(0, 30).join(", ") ?? "";
  const about = body.about?.trim() ?? "";
  const experience = body.experience?.trim() ?? "";
  const education = body.education?.trim() ?? "";
  const website = body.website?.trim() ?? "";
  if (headline.length > 140 || location.length > 120 || skills.length > 1200 || about.length > 2000 || experience.length > 4000 || education.length > 3000 || website.length > 500) {
    return NextResponse.json({ error: "One or more profile fields exceed their character limit." }, { status: 400 });
  }
  if (website) {
    try {
      const url = new URL(website);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Unsupported URL protocol.");
    } catch {
      return NextResponse.json({ error: "Enter a valid website URL beginning with https:// or http://." }, { status: 400 });
    }
  }
  getDb().prepare(`INSERT INTO candidate_profiles (user_id, headline, location, skills, about, experience, education, website, email_job_alerts, network_visible, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET headline = excluded.headline,
    location = excluded.location, skills = excluded.skills, about = excluded.about, experience = excluded.experience,
    education = excluded.education, website = excluded.website, email_job_alerts = excluded.email_job_alerts,
    network_visible = excluded.network_visible, updated_at = excluded.updated_at`)
    .run(user.id, headline, location, skills, about, experience, education, website, body.emailJobAlerts === true ? 1 : 0, body.networkVisible === false ? 0 : 1, new Date().toISOString());
  return NextResponse.json({ ok: true, message: "Profile saved. Your original details remain under your control." });
}