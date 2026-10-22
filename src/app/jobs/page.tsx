import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Search } from "lucide-react";
import { JobCard } from "@/components/job-card";
import { getDb, listJobs } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { JobPreferencesForm } from "@/components/job-preferences-form";

export const metadata: Metadata = { title: "Find work" };

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ query?: string; location?: string; arrangement?: string; currency?: string; salary?: string; all?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/register");
  const params = await searchParams;
  const db = getDb();
  const explicitSearch = Boolean(params.query || params.location || params.arrangement || params.currency || params.salary);
  const savedPreferences = user?.role === "candidate" ? db.prepare(`SELECT keywords, location, work_arrangement, currency, minimum_salary
    FROM candidate_job_preferences WHERE candidate_id = ?`).get(user.id) as { keywords: string; location: string; work_arrangement: string; currency: string; minimum_salary: number } | undefined : undefined;
  const hasPreferences = Boolean(savedPreferences && (savedPreferences.keywords || savedPreferences.location || savedPreferences.work_arrangement || savedPreferences.currency || savedPreferences.minimum_salary));
  const personalized = Boolean(user?.role === "candidate" && hasPreferences && !explicitSearch && params.all !== "1");
  const query = (personalized ? savedPreferences?.keywords : params.query)?.slice(0, 100) ?? "";
  const location = (personalized ? savedPreferences?.location : params.location)?.slice(0, 100) ?? "";
  const requestedArrangement = personalized ? savedPreferences?.work_arrangement : params.arrangement;
  const arrangement = ["Remote", "Hybrid", "On-site"].includes(requestedArrangement ?? "") ? requestedArrangement! : "";
  const requestedCurrency = personalized ? savedPreferences?.currency : params.currency;
  const currency = ["KES", "USD", "EUR", "GBP"].includes(requestedCurrency ?? "") ? requestedCurrency! : "";
  const requestedSalary = personalized ? savedPreferences?.minimum_salary ?? 0 : Number.parseInt(params.salary ?? "", 10);
  const minimumSalary = currency && Number.isSafeInteger(requestedSalary) && requestedSalary > 0 && requestedSalary <= 10_000_000 ? requestedSalary : 0;
  const jobs = listJobs(query, location, arrangement, currency, minimumSalary);
  const saved = user?.role === "candidate" ? new Set((getDb().prepare("SELECT job_id FROM saved_jobs WHERE candidate_id = ?").all(user.id) as { job_id: string }[]).map((row) => row.job_id)) : new Set<string>();
  const candidateProfile = user?.role === "candidate" ? db.prepare("SELECT headline, location FROM candidate_profiles WHERE user_id = ?").get(user.id) as { headline: string; location: string } | undefined : undefined;
  const preferenceDefaults = {
    keywords: savedPreferences?.keywords ?? "",
    location: savedPreferences?.location ?? "",
    arrangement: savedPreferences?.work_arrangement ?? "",
    currency: savedPreferences?.currency ?? "",
    minimumSalary: savedPreferences?.minimum_salary ?? 0,
  };
  return <main className="page-shell jobs-page">
    <aside className="jobs-sidebar">
      {user?.role === "candidate" && <section className="jobs-profile-panel"><span className="jobs-avatar">{user.name.slice(0, 1).toUpperCase()}</span><h2>{user.name}</h2><p>{candidateProfile?.headline || "Candidate profile"}</p><small>{candidateProfile?.location || "Add your location in your workspace"}</small><Link href="/dashboard">Edit profile <ArrowUpRight size={13} /></Link></section>}
      <section className="jobs-sidebar-panel">
        <details className="jobs-preferences" open={user?.role === "candidate" && !hasPreferences}>
          <summary><span>Preferences</span><span aria-hidden="true">{hasPreferences ? "Edit" : "Add"}</span></summary>
          {user?.role === "candidate" ? <JobPreferencesForm initialPreferences={preferenceDefaults} /> : <p className="field-hint">Sign in as a candidate to save job preferences.</p>}
        </details>
        <Link className="jobs-sidebar-link" href={user?.role === "candidate" ? "/dashboard" : "/sign-in"}>Job tracker <ArrowUpRight size={14} /></Link>
        <Link className="jobs-sidebar-link jobs-post-link" href={user?.role === "employer" ? "/dashboard" : "/register?role=employer"}>Post a free job <ArrowUpRight size={14} /></Link>
      </section>
    </aside>
    <section className="jobs-results">
      <div className="page-heading"><p className="eyebrow">Open opportunities</p><h1>{personalized ? "Jobs based on your preferences" : "Find work that fits."}</h1><p>{personalized ? "Matched to the filters you chose. These are search results, not a hiring score." : "Explore active listings. Check what the employer has confirmed and what they are asking for."}</p></div>
      <form className="search-panel" action="/jobs">
        <label className="visually-hidden" htmlFor="job-query">Job title, skill, or employer</label><input id="job-query" name="query" defaultValue={personalized || explicitSearch ? query : ""} placeholder="Job title, skill, or employer" />
        <label className="visually-hidden" htmlFor="job-location">Location</label><input id="job-location" name="location" defaultValue={personalized || explicitSearch ? location : ""} placeholder="Location or remote" />
        <label className="visually-hidden" htmlFor="job-arrangement">Work arrangement</label><select id="job-arrangement" name="arrangement" defaultValue={personalized || explicitSearch ? arrangement : ""}><option value="">Any arrangement</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option><option value="On-site">On-site</option></select>
        <label className="visually-hidden" htmlFor="job-currency">Salary currency</label><select id="job-currency" name="currency" defaultValue={personalized || explicitSearch ? currency : ""}><option value="">Any currency</option><option value="KES">KES</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select>
        <label className="visually-hidden" htmlFor="job-salary">Minimum monthly salary</label><input id="job-salary" name="salary" type="number" min="1" max="10000000" step="1000" defaultValue={personalized || explicitSearch ? minimumSalary || "" : ""} placeholder="Min. monthly pay" />
        <button className="button button-primary"><Search size={16} /> Search</button>
      </form>
      <div className="jobs-list-heading"><p className="field-hint">Salary filters apply only to disclosed salaries in the selected currency.</p><Link href="/jobs?all=1">Browse all jobs <ArrowUpRight size={13} /></Link></div>
      <p className="result-count">{jobs.length} {jobs.length === 1 ? "opportunity" : "opportunities"}{personalized ? " matching your preferences" : " currently open"}</p>
      {jobs.length ? <div className="job-list">{jobs.map((job) => <JobCard key={job.id} job={job} signedIn={Boolean(user)} canSave={user?.role === "candidate"} initialSaved={saved.has(job.id)} />)}</div> : <div className="empty-state"><h3>{personalized ? "No roles match your saved filters yet." : "No matching opportunities yet."}</h3><p>{personalized ? "Broaden your preferences or browse every open role." : "Try a broader search, remove the location, or check back as employers publish openings."}</p><Link className="text-link" href="/jobs?all=1">Browse all jobs <ArrowUpRight size={15} /></Link></div>}
      <p className="demo-disclosure">Demo listings are fictional and labeled. “Employer verified” indicates a recorded employer review only; it is not a guarantee about an individual job.</p>
    </section>
  </main>;
}