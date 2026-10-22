import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ModerationAction } from "@/components/moderation-action";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "Moderation" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/dashboard");
  const jobs = getDb().prepare(`
    SELECT jobs.id, jobs.title, jobs.description, jobs.location, jobs.work_arrangement, jobs.employment_type,
      jobs.salary_min, jobs.salary_max, jobs.currency, jobs.deadline, jobs.published_at AS created_at, organizations.name AS organization_name
    FROM jobs JOIN organizations ON organizations.id = jobs.organization_id
    WHERE jobs.status = 'pending_moderation' ORDER BY jobs.published_at ASC LIMIT 50
  `).all() as { id: string; title: string; description: string; location: string; work_arrangement: string; employment_type: string; salary_min: number | null; salary_max: number | null; currency: string | null; deadline: string | null; created_at: string; organization_name: string }[];
  return <main className="page-shell">
    <div className="page-heading"><p className="eyebrow">Restricted workspace</p><h1>Vacancy review</h1><p>Review employer-submitted details and record a reason for each publication decision.</p></div>
    {jobs.length ? <div className="moderation-list">{jobs.map((job) => <article className="dashboard-panel moderation-item" key={job.id}><div><p className="eyebrow">{job.organization_name} · {job.location}</p><h2>{job.title}</h2><div className="detail-meta"><span>{job.work_arrangement}</span><span>{job.employment_type}</span><span>{job.salary_min != null && job.salary_max != null ? `${job.currency} ${job.salary_min.toLocaleString()}–${job.salary_max.toLocaleString()}` : "Compensation not provided"}</span></div><p>{job.description}</p><p className="field-hint">Deadline: {job.deadline || "Not provided"} · submitted {new Date(job.created_at).toLocaleString()}</p></div><ModerationAction jobId={job.id} /></article>)}</div> : <div className="empty-state"><h3>No vacancies awaiting review.</h3><p>Employer submissions that have not been reviewed will appear here.</p></div>}
  </main>;
}