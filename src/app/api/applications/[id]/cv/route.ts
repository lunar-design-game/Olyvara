import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const cvTypes: Record<string, string> = { pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to view this CV." }, { status: 401 });
  const { id } = await params;
  const application = getDb().prepare(`
    SELECT applications.candidate_id, applications.cv_path, organizations.owner_id
    FROM applications JOIN jobs ON jobs.id = applications.job_id
    JOIN organizations ON organizations.id = jobs.organization_id
    WHERE applications.id = ?
  `).get(id) as { candidate_id: string; cv_path: string; owner_id: string | null } | undefined;
  if (!application || (application.candidate_id !== user.id && application.owner_id !== user.id)) {
    return NextResponse.json({ error: "This CV is not available to your account." }, { status: 404 });
  }
  const filename = basename(application.cv_path);
  const extension = filename.split(".").at(-1) ?? "";
  if (!filename || filename !== application.cv_path || !cvTypes[extension]) {
    return NextResponse.json({ error: "No CV was attached to this application." }, { status: 404 });
  }
  try {
    const cv = await readFile(resolve(process.env.OLYVARA_UPLOAD_DIR ?? "./data/private-uploads", filename));
    return new NextResponse(cv, { headers: { "Content-Type": cvTypes[extension], "Content-Length": String(cv.byteLength), "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "This CV is no longer available." }, { status: 404 });
  }
}