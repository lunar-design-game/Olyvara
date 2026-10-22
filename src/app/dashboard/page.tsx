import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Bell, BriefcaseBusiness, CircleCheck, Clock3 } from "lucide-react";
import { ApplicationStatus } from "@/components/application-status";
import { NewJobForm } from "@/components/new-job-form";
import { ProfileForm } from "@/components/profile-form";
import { AccountDeletion } from "@/components/account-deletion";
import { ConfirmVacancyButton } from "@/components/confirm-vacancy-button";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "My workspace" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ applied?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/register");
  const db = getDb();
  const params = await searchParams;
  const notifications = db.prepare("SELECT message, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 6")
    .all(user.id) as { message: string; created_at: string }[];

  if (user.role === "employer") {
    const jobs = db.prepare(`
      SELECT jobs.id, jobs.title, jobs.status, jobs.deadline, jobs.published_at, jobs.last_confirmed_at, jobs.slug, COUNT(applications.id) AS application_count
      FROM jobs JOIN organizations ON organizations.id = jobs.organization_id
      LEFT JOIN applications ON applications.job_id = jobs.id
      WHERE organizations.owner_id = ? GROUP BY jobs.id ORDER BY jobs.published_at DESC LIMIT 30
    `).all(user.id) as { id: string; title: string; status: string; deadline: string | null; published_at: string; last_confirmed_at: string; slug: string; application_count: number }[];
    const applications = db.prepare(`
      SELECT applications.id, applications.status, applications.created_at, applications.note, applications.screening_response,
        applications.video_path, applications.cv_path, applications.project_url, applications.candidate_skills,
        users.name AS candidate_name, candidate_profiles.headline AS candidate_headline, jobs.title AS job_title,
        jobs.required_skills AS role_required_skills, jobs.responsibilities AS role_responsibilities,
        jobs.application_question AS role_application_question
      FROM applications JOIN jobs ON jobs.id = applications.job_id
      JOIN organizations ON organizations.id = jobs.organization_id
      JOIN users ON users.id = applications.candidate_id
      LEFT JOIN candidate_profiles ON candidate_profiles.user_id = users.id
      WHERE organizations.owner_id = ? ORDER BY applications.updated_at DESC LIMIT 50
    `).all(user.id) as { id: string; status: string; created_at: string; note: string; screening_response: string; video_path: string; cv_path: string; project_url: string; candidate_name: string; candidate_headline: string | null; candidate_skills: string; job_title: string; role_required_skills: string; role_responsibilities: string; role_application_question: string }[];
    return <main className="page-shell">
      <div className="dashboard-top"><div><p className="eyebrow">Employer workspace</p><h1>Good to see you, {user.name.split(" ")[0]}.</h1><p>Manage your vacancies and review the activity recorded in your workspace.</p></div><Link className="text-link" href="/jobs">View public jobs <ArrowUpRight size={15} /></Link></div>
      <div className="dashboard-grid"><div className="dashboard-column">
        <section className="dashboard-panel"><h2><BriefcaseBusiness size={17} /> Your vacancies</h2>{jobs.length ? jobs.map((job) => <div className="application-row" key={job.id}><div><h3>{job.title}</h3><p>{job.application_count} applications · Last confirmed {new Date(job.last_confirmed_at).toLocaleDateString()}</p>{job.status === "published" && <ConfirmVacancyButton jobId={job.id} />}</div><span className="status-pill">{job.status.replaceAll("_", " ")}</span></div>) : <p>No vacancies yet. Create one to start a reviewable listing.</p>}</section>
        <section className="dashboard-panel"><h2>Applications to review</h2><p className="review-guidance">Use the same job-related criteria for every applicant: the required skills and responsibilities published with the vacancy. Candidate profile skills are self-reported, not verified. Optional video presence should not affect selection.</p>{applications.length ? applications.map((application) => <div className="application-row employer-application" key={application.id}><div className="employer-application-main"><h3>{application.candidate_name}</h3><p>{application.job_title} · {new Date(application.created_at).toLocaleDateString()}</p>{application.candidate_headline && <p><strong>Profile:</strong> {application.candidate_headline}</p>}<div className="review-criteria"><strong>Published role criteria</strong><p><b>Required skills:</b> {application.role_required_skills || "None listed"}</p><p><b>Responsibilities:</b> {application.role_responsibilities || "None listed"}</p></div>{application.candidate_skills && <p className="candidate-evidence"><strong>Candidate profile skills at application time:</strong> {application.candidate_skills}</p>}{application.role_application_question && <p className="candidate-evidence"><strong>{application.role_application_question}</strong><br />{application.screening_response || "No response submitted"}</p>}{application.note && <p className="candidate-evidence"><strong>Candidate note:</strong> {application.note}</p>}<div className="application-materials">{application.cv_path && <Link className="text-link" href={`/api/applications/${application.id}/cv`}>Download CV</Link>}{application.project_url && <a className="text-link" href={application.project_url} target="_blank" rel="noreferrer">View project or portfolio</a>}</div>{application.video_path && <video className="application-video" controls preload="none" src={`/api/applications/${application.id}/video`} aria-label={`Optional video introduction from ${application.candidate_name}`} />}</div><ApplicationStatus applicationId={application.id} initialStatus={application.status} /></div>) : <p>Applications will appear here after a candidate submits to one of your published vacancies.</p>}</section>
      </div><aside className="dashboard-column"><section className="dashboard-panel"><h2>Create a vacancy</h2><NewJobForm /></section><section className="dashboard-panel"><h2><Bell size={16} /> Notifications</h2>{notifications.length ? notifications.map((item, index) => <div className="notification-item" key={`${item.created_at}-${index}`}>{item.message}<time>{new Date(item.created_at).toLocaleString()}</time></div>) : <p>No new notifications.</p>}</section><AccountDeletion role="employer" /></aside></div>
    </main>;
  }

  if (user.role === "admin") return <main className="page-shell"><div className="empty-state"><h1>Administrator account</h1><p>The review console is not part of this MVP yet. This account has no regular candidate or employer workspace.</p></div></main>;

  const applications = db.prepare(`
    SELECT applications.id, applications.status, applications.created_at, applications.updated_at, applications.video_path, applications.cv_path, applications.project_url,
      jobs.title, jobs.slug, organizations.name AS organization_name
    FROM applications JOIN jobs ON jobs.id = applications.job_id
    JOIN organizations ON organizations.id = jobs.organization_id
    WHERE applications.candidate_id = ? ORDER BY applications.updated_at DESC LIMIT 50
  `).all(user.id) as { id: string; status: string; created_at: string; updated_at: string; video_path: string; cv_path: string; project_url: string; title: string; slug: string; organization_name: string }[];
  const recentEvents = applications.length ? db.prepare(`
    SELECT application_events.status, application_events.note, application_events.created_at, jobs.title
    FROM application_events JOIN applications ON applications.id = application_events.application_id
    JOIN jobs ON jobs.id = applications.job_id
    WHERE applications.candidate_id = ? ORDER BY application_events.created_at DESC LIMIT 8
  `).all(user.id) as { status: string; note: string; created_at: string; title: string }[] : [];
  const profile = db.prepare("SELECT headline, location, skills, about, experience, education, website, email_job_alerts, network_visible FROM candidate_profiles WHERE user_id = ?")
    .get(user.id) as { headline: string; location: string; skills: string; about: string; experience: string; education: string; website: string; email_job_alerts: number; network_visible: number } | undefined;
  const savedJobs = db.prepare(`
    SELECT jobs.id, jobs.slug, jobs.title, jobs.location, jobs.work_arrangement, organizations.name AS organization_name
    FROM saved_jobs JOIN jobs ON jobs.id = saved_jobs.job_id
    JOIN organizations ON organizations.id = jobs.organization_id
    WHERE saved_jobs.candidate_id = ? AND jobs.status = 'published'
    ORDER BY saved_jobs.created_at DESC LIMIT 20
  `).all(user.id) as { id: string; slug: string; title: string; location: string; work_arrangement: string; organization_name: string }[];

  return <main className="page-shell">
    <div className="dashboard-top"><div><p className="eyebrow">Candidate workspace</p><h1>Your search, in one place.</h1><p>Hi {user.name}. Here are the application updates actually recorded in your account.</p></div><Link className="button button-primary" href="/jobs">Explore opportunities <ArrowUpRight size={15} /></Link></div>
    {params.applied === "1" && <p className="notice-success" role="status"><CircleCheck size={15} /> Application saved. Its receipt is now in your tracker.</p>}
    <div className="dashboard-grid"><div className="dashboard-column">
      <section className="dashboard-panel"><h2><BriefcaseBusiness size={17} /> Applications</h2>{applications.length ? applications.map((application) => <div className="application-row" key={application.id}><div><Link href={`/jobs/${application.slug}`}><h3>{application.title}</h3></Link><p>{application.organization_name} · Applied {new Date(application.created_at).toLocaleDateString()}</p><div className="application-materials">{application.cv_path && <Link className="text-link" href={`/api/applications/${application.id}/cv`}>View your CV</Link>}{application.project_url && <a className="text-link" href={application.project_url} target="_blank" rel="noreferrer">View your project link</a>}{application.video_path && <Link className="text-link" href={`/api/applications/${application.id}/video`}>View your video introduction</Link>}</div></div><span className="status-pill">{application.status.replaceAll("_", " ")}</span></div>) : <div className="empty-state"><h3>Your application tracker is ready.</h3><p>When you apply to an Olyvara vacancy, its receipt and any employer-provided updates will appear here.</p><Link className="text-link" href="/jobs">Browse jobs <ArrowUpRight size={15} /></Link></div>}</section>
      <section className="dashboard-panel"><h2><Clock3 size={17} /> Recent activity</h2>{recentEvents.length ? <ol className="timeline">{recentEvents.map((event, index) => <li key={`${event.created_at}-${index}`}><strong>{event.status.replaceAll("_", " ")} · {event.title}</strong><span>{event.note} · {new Date(event.created_at).toLocaleString()}</span></li>)}</ol> : <p>No application events have been recorded yet.</p>}</section>
    </div><aside className="dashboard-column"><section className="dashboard-panel"><h2>Your professional profile</h2><ProfileForm headline={profile?.headline ?? ""} location={profile?.location ?? ""} skills={profile?.skills ?? ""} about={profile?.about ?? ""} experience={profile?.experience ?? ""} education={profile?.education ?? ""} website={profile?.website ?? ""} emailJobAlerts={profile?.email_job_alerts === 1} networkVisible={profile?.network_visible !== 0} /></section><section className="dashboard-panel"><h2>Saved opportunities</h2>{savedJobs.length ? savedJobs.map((job) => <div className="saved-job-row" key={job.id}><Link href={`/jobs/${job.slug}`}><strong>{job.title}</strong><span>{job.organization_name} · {job.location} · {job.work_arrangement}</span></Link></div>) : <p>Save an opportunity from search to keep it here.</p>}<Link className="text-link" href="/jobs">Find more work <ArrowUpRight size={15} /></Link></section><section className="dashboard-panel"><h2><Bell size={16} /> Notifications</h2>{notifications.length ? notifications.map((item, index) => <div className="notification-item" key={`${item.created_at}-${index}`}>{item.message}<time>{new Date(item.created_at).toLocaleString()}</time></div>) : <p>No notifications yet.</p>}</section><section className="dashboard-panel"><h2>Keep your search clear</h2><p>Olyvara shows employer-provided status changes. It cannot see activity outside the platform or promise a response time.</p><Link className="text-link" href="/jobs">Find your next role <ArrowUpRight size={15} /></Link></section><AccountDeletion role="candidate" /></aside></div>
  </main>;
}