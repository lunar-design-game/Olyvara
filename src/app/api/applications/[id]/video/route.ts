import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const videoTypes: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime" };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to view this video." }, { status: 401 });
  const { id } = await params;
  const application = getDb().prepare(`
    SELECT applications.candidate_id, applications.video_path, organizations.owner_id
    FROM applications JOIN jobs ON jobs.id = applications.job_id
    JOIN organizations ON organizations.id = jobs.organization_id
    WHERE applications.id = ?
  `).get(id) as { candidate_id: string; video_path: string; owner_id: string | null } | undefined;
  if (!application || (application.candidate_id !== user.id && application.owner_id !== user.id)) {
    return NextResponse.json({ error: "This video is not available to your account." }, { status: 404 });
  }
  const filename = basename(application.video_path);
  const extension = filename.split(".").at(-1) ?? "";
  if (!filename || filename !== application.video_path || !videoTypes[extension]) {
    return NextResponse.json({ error: "No video introduction was attached." }, { status: 404 });
  }
  try {
    const video = await readFile(resolve(process.env.OLYVARA_UPLOAD_DIR ?? "./data/private-uploads", filename));
    return new NextResponse(video, { headers: { "Content-Type": videoTypes[extension], "Content-Length": String(video.byteLength), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "This video is no longer available." }, { status: 404 });
  }
}