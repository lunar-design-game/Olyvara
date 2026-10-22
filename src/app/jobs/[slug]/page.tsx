import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { ApplyForm } from "@/components/apply-form";
import { SaveJobButton } from "@/components/save-job-button";
import { getCurrentUser } from "@/lib/auth";
import { getDb, getJobBySlug } from "@/lib/db";
import { explainSkillFit } from "@/lib/job-fit";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  return job ? { title: `${job.title} at ${job.organization_name}`, description: job.description } : { title: "Opportunity unavailable" };
}

export default async function JobDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/register");
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) notFound();
  const profile = user?.role === "candidate" ? getDb().prepare("SELECT skills FROM candidate_profiles WHERE user_id = ?").get(user.id) as { skills: string } | undefined : undefined;
  const saved = user?.role === "candidate" && Boolean(getDb().prepare("SELECT 1 FROM saved_jobs WHERE candidate_id = ? AND job_id = ?").get(user.id, job.id));
  const fit = profile ? explainSkillFit(profile.skills, job.required_skills) : null;
  const formatSalary = job.salary_min == null || job.salary_max == null
    ? "Not provided"
    : `${job.currency} ${job.salary_min.toLocaleString()}–${job.salary_max.toLocaleString()} per month`;

  return <main className="page-shell">
    <Link className="text-link" href="/jobs"><ArrowLeft size={15} /> Back to opportunities</Link>
    <div className="job-detail-layout" style={{ marginTop: 18 }}>
      <article className="job-detail-main">
        <div className="detail-employer"><span className="company-monogram">{job.organization_name.slice(0, 1)}</span><span><strong>{job.organization_name}</strong><br /><MapPin size={12} /> {job.location}</span><SaveJobButton jobId={job.id} initialSaved={saved} signedIn={Boolean(user)} canSave={user?.role === "candidate"} /></div>
        <h1 className="detail-title">{job.title}</h1>
        <div className="detail-meta"><span>{job.work_arrangement}</span><span>{job.employment_type}</span><span>{job.is_demo ? "Fictional demo listing" : "Published vacancy"}</span></div>
        <hr />
        <h2>About the role</h2><p>{job.description}</p>
        <h2>What you will do</h2><p>{job.responsibilities}</p>
        <h2>Essential skills</h2><p>{job.required_skills}</p>
        {fit && <section className="fit-explanation"><h2>How your profile relates</h2><p>Compared only against this employer's listed essential skills. This is not a hiring probability or decision.</p>{fit.matched.length > 0 && <p><strong>Listed on your profile:</strong> {fit.matched.join(", ")}</p>}{fit.notListed.length > 0 && <p><strong>Not listed yet:</strong> {fit.notListed.join(", ")}. Missing profile information is unknown, not evidence that you lack a skill.</p>}</section>}
        {job.preferred_skills && <><h2>Useful experience</h2><p>{job.preferred_skills}</p></>}
        <h2>About the employer</h2><p>{job.organization_overview || "No additional organization information has been supplied."}</p>
        <div className="honesty-note"><span className="verification-label">{job.verification_status === "verified" ? "Employer verified" : "Employer not verified"}</span><span>Employer identity review and the status of this specific vacancy are separate. Verification is not a guarantee of employment or job safety.</span></div>
      </article>
      <aside className="detail-sidebar"><div className="content-panel"><h2>Apply for this role</h2><p>Review the role details before you send your application.</p><ApplyForm jobId={job.id} signedIn={Boolean(user && user.role === "candidate")} applicationQuestion={job.application_question} />
        <ul className="sidebar-facts"><li><strong>Compensation</strong>{formatSalary}</li><li><strong>Application deadline</strong>{job.deadline ? new Date(`${job.deadline}T00:00:00`).toLocaleDateString("en-KE", { dateStyle: "medium" }) : "Not provided"}</li><li><strong>Published</strong>{new Date(job.published_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}</li><li><strong>Last employer confirmation</strong>{new Date(job.last_confirmed_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}</li></ul>
      </div><p className="field-hint">Be cautious if anyone requests money to apply or secure an interview. Olyvara does not guarantee an employer or outcome.</p></aside>
    </div>
  </main>;
}