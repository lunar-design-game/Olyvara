import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sendUserNotificationEmail } from "@/lib/email";

export const runtime = "nodejs";
const maxVideoBytes = 25 * 1024 * 1024;
const maxCvBytes = 10 * 1024 * 1024;
const allowedVideoTypes: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };
const allowedCvTypes: Record<string, string> = { "application/pdf": "pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx" };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to view applications." }, { status: 401 });
  if (user.role !== "candidate") return NextResponse.json({ error: "Candidate access required." }, { status: 403 });
  const applications = getDb().prepare(`
    SELECT applications.id, applications.status, applications.created_at, applications.updated_at,
      jobs.title, jobs.slug, organizations.name AS organization_name
    FROM applications JOIN jobs ON jobs.id = applications.job_id
    JOIN organizations ON organizations.id = jobs.organization_id
    WHERE applications.candidate_id = ? ORDER BY applications.updated_at DESC LIMIT 100
  `).all(user.id);
  return NextResponse.json({ applications });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before applying." }, { status: 401 });
  if (user.role !== "candidate") return NextResponse.json({ error: "Candidate accounts are required to apply." }, { status: 403 });
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Review the application details and try again." }, { status: 400 });
  }
  const jobId = form.get("jobId");
  const note = form.get("note");
  const screeningResponseValue = form.get("screeningResponse");
  const projectUrlValue = form.get("projectUrl");
  const uploadedVideo = form.get("video");
  const uploadedCv = form.get("cv");
  const video = uploadedVideo instanceof File && uploadedVideo.size > 0 ? uploadedVideo : null;
  const cv = uploadedCv instanceof File && uploadedCv.size > 0 ? uploadedCv : null;
  if (typeof jobId !== "string" || !jobId || (typeof note === "string" && note.length > 2000) || (typeof screeningResponseValue === "string" && screeningResponseValue.length > 1500) || (typeof projectUrlValue === "string" && projectUrlValue.length > 500)) {
    return NextResponse.json({ error: "Application details are invalid." }, { status: 400 });
  }
  if (note !== null && typeof note !== "string") return NextResponse.json({ error: "Application note is invalid." }, { status: 400 });
  if (screeningResponseValue !== null && typeof screeningResponseValue !== "string") return NextResponse.json({ error: "Application answer is invalid." }, { status: 400 });
  const screeningResponse = typeof screeningResponseValue === "string" ? screeningResponseValue.trim() : "";
  if (projectUrlValue !== null && typeof projectUrlValue !== "string") return NextResponse.json({ error: "Project link is invalid." }, { status: 400 });
  const projectUrl = typeof projectUrlValue === "string" ? projectUrlValue.trim() : "";
  if (projectUrl) {
    try {
      const url = new URL(projectUrl);
      if (!new Set(["http:", "https:"]).has(url.protocol)) throw new Error("Unsupported URL protocol.");
    } catch {
      return NextResponse.json({ error: "Enter a valid project link beginning with https:// or http://." }, { status: 400 });
    }
  }
  if (video && (!allowedVideoTypes[video.type] || video.size > maxVideoBytes)) {
    return NextResponse.json({ error: "Use an MP4, WebM, or MOV video no larger than 25 MB." }, { status: 400 });
  }
  if (cv && (!allowedCvTypes[cv.type] || cv.size > maxCvBytes)) {
    return NextResponse.json({ error: "Use a PDF or DOCX CV no larger than 10 MB." }, { status: 400 });
  }
  const db = getDb();
  const job = db.prepare(`SELECT id, organization_id, application_question FROM jobs WHERE id = ? AND status = 'published'
    AND (deadline IS NULL OR deadline >= date('now'))`).get(jobId) as { id: string; organization_id: string; application_question: string } | undefined;
  if (!job) return NextResponse.json({ error: "This vacancy is no longer accepting applications." }, { status: 409 });
  if (job.application_question && !screeningResponse) return NextResponse.json({ error: "Answer the employer's role-related question before applying." }, { status: 400 });
  if (db.prepare("SELECT 1 FROM applications WHERE candidate_id = ? AND job_id = ?").get(user.id, job.id)) {
    return NextResponse.json({ error: "You have already applied for this vacancy." }, { status: 409 });
  }
  const profile = db.prepare("SELECT skills FROM candidate_profiles WHERE user_id = ?").get(user.id) as { skills: string } | undefined;
  const candidateSkills = profile?.skills ?? "";

  const applicationId = randomUUID();
  const createdAt = new Date().toISOString();
  let videoPath = "";
  let cvPath = "";
  const uploadDirectory = resolve(process.env.OLYVARA_UPLOAD_DIR ?? "./data/private-uploads");
  if (video || cv) {
    try {
      await mkdir(uploadDirectory, { recursive: true });
      if (video) {
        videoPath = `${applicationId}-intro.${allowedVideoTypes[video.type]}`;
        await writeFile(resolve(uploadDirectory, videoPath), Buffer.from(await video.arrayBuffer()), { flag: "wx" });
      }
      if (cv) {
        cvPath = `${applicationId}-cv.${allowedCvTypes[cv.type]}`;
        await writeFile(resolve(uploadDirectory, cvPath), Buffer.from(await cv.arrayBuffer()), { flag: "wx" });
      }
    } catch {
      if (videoPath) await rm(resolve(uploadDirectory, videoPath), { force: true });
      if (cvPath) await rm(resolve(uploadDirectory, cvPath), { force: true });
      return NextResponse.json({ error: "The video could not be saved. Please try again." }, { status: 500 });
    }
  }
  try {
    db.transaction(() => {
      db.prepare(`INSERT INTO applications (id, candidate_id, job_id, status, note, video_path, cv_path, project_url, candidate_skills, screening_response, created_at, updated_at)
        VALUES (?, ?, ?, 'received', ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(applicationId, user.id, job.id, typeof note === "string" ? note.trim() : "", videoPath, cvPath, projectUrl, candidateSkills, screeningResponse, createdAt, createdAt);
      db.prepare(`INSERT INTO application_events (id, application_id, actor_id, status, note, created_at)
        VALUES (?, ?, ?, 'received', 'Application received by Olyvara.', ?)`)
        .run(randomUUID(), applicationId, user.id, createdAt);
      db.prepare("INSERT INTO notifications (id, user_id, message, created_at) VALUES (?, ?, ?, ?)")
        .run(randomUUID(), user.id, "Your application was received and added to your tracker.", createdAt);
      const employer = db.prepare("SELECT owner_id FROM organizations WHERE id = ?").get(job.organization_id) as { owner_id: string | null } | undefined;
      if (employer?.owner_id) {
        db.prepare("INSERT INTO notifications (id, user_id, message, created_at) VALUES (?, ?, ?, ?)")
          .run(randomUUID(), employer.owner_id, "A new application arrived for one of your vacancies.", createdAt);
      }
    })();
  } catch (error) {
    if (videoPath) await rm(resolve(uploadDirectory, videoPath), { force: true });
    if (cvPath) await rm(resolve(uploadDirectory, cvPath), { force: true });
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return NextResponse.json({ error: "You have already applied for this vacancy." }, { status: 409 });
    }
    return NextResponse.json({ error: "Your application could not be saved. Please try again." }, { status: 500 });
  }
  const employer = db.prepare("SELECT owner_id FROM organizations WHERE id = ?").get(job.organization_id) as { owner_id: string | null } | undefined;
  await Promise.all([
    sendUserNotificationEmail(user.id, "Your Olyvara application was received", "Your application was received and added to your tracker."),
    ...(employer?.owner_id ? [sendUserNotificationEmail(employer.owner_id, "A new Olyvara application arrived", "A candidate applied for one of your vacancies. Sign in to review the application.")] : []),
  ]);
  return NextResponse.json({ ok: true, applicationId }, { status: 201 });
}