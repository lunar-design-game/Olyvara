import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to create a vacancy." }, { status: 401 });
  if (user.role !== "employer") return NextResponse.json({ error: "Employer access required." }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter valid vacancy details." }, { status: 400 });
  }
  const fields = ["title", "description", "responsibilities", "requiredSkills", "location", "employmentType"] as const;
  const values = Object.fromEntries(fields.map((field) => [field, typeof body[field] === "string" ? body[field].trim() : ""])) as Record<(typeof fields)[number], string>;
  if (!values.title || values.title.length > 120 || !values.description || values.description.length > 5000 ||
      !values.responsibilities || values.responsibilities.length > 3000 || !values.requiredSkills || values.requiredSkills.length > 500 ||
      !values.location || values.location.length > 120 || !values.employmentType || values.employmentType.length > 40) {
    return NextResponse.json({ error: "Complete each required field within the stated limits." }, { status: 400 });
  }
  const arrangement = body.workArrangement;
  if (arrangement !== "Remote" && arrangement !== "Hybrid" && arrangement !== "On-site") {
    return NextResponse.json({ error: "Choose a valid work arrangement." }, { status: 400 });
  }
  const deadline = typeof body.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.deadline) ? body.deadline : null;
  if (body.deadline && (!deadline || deadline < new Date().toISOString().slice(0, 10))) {
    return NextResponse.json({ error: "Choose a valid future application deadline." }, { status: 400 });
  }
  const salaryMin = Number.isInteger(body.salaryMin) && Number(body.salaryMin) >= 0 ? Number(body.salaryMin) : null;
  const salaryMax = Number.isInteger(body.salaryMax) && Number(body.salaryMax) >= 0 ? Number(body.salaryMax) : null;
  if ((salaryMin == null) !== (salaryMax == null) || (salaryMin != null && salaryMax != null && salaryMin > salaryMax)) {
    return NextResponse.json({ error: "Provide both salary bounds, and make sure the minimum is lower." }, { status: 400 });
  }
  const currency = body.currency;
  if (currency !== "KES" && currency !== "USD" && currency !== "EUR" && currency !== "GBP") {
    return NextResponse.json({ error: "Choose a valid salary currency." }, { status: 400 });
  }
  const applicationQuestion = typeof body.applicationQuestion === "string" ? body.applicationQuestion.trim() : "";
  if (applicationQuestion.length > 300) return NextResponse.json({ error: "Keep the application question under 300 characters." }, { status: 400 });
  const db = getDb();
  const organization = db.prepare("SELECT id FROM organizations WHERE owner_id = ?").get(user.id) as { id: string } | undefined;
  if (!organization) return NextResponse.json({ error: "Create an organization before adding a vacancy." }, { status: 409 });
  const id = randomUUID();
  const now = new Date().toISOString();
  const base = values.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 65) || "vacancy";
  const slug = `${base}-${id.slice(0, 8)}`;
  db.prepare(`INSERT INTO jobs (id, organization_id, slug, title, description, responsibilities, required_skills,
    preferred_skills, location, work_arrangement, employment_type, salary_min, salary_max, currency, deadline,
    application_question, published_at, last_confirmed_at, status, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_moderation', 0)`)
    .run(id, organization.id, slug, values.title, values.description, values.responsibilities, values.requiredSkills,
      typeof body.preferredSkills === "string" ? body.preferredSkills.trim().slice(0, 500) : "", values.location,
      arrangement, values.employmentType, salaryMin, salaryMax, salaryMin == null ? null : currency, deadline, applicationQuestion, now, now);
  return NextResponse.json({ ok: true, message: "Vacancy submitted for review. It will not appear in search until approved." }, { status: 201 });
}