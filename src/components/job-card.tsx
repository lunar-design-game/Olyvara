import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Job } from "@/lib/db";
import { SaveJobButton } from "@/components/save-job-button";

function salary(job: Job) {
  if (job.salary_min == null || job.salary_max == null || !job.currency) return "Compensation not provided";
  return `${job.currency} ${job.salary_min.toLocaleString()}–${job.salary_max.toLocaleString()} / month`;
}

export function JobCard({ job, canSave = false, signedIn = false, initialSaved = false }: { job: Job; canSave?: boolean; signedIn?: boolean; initialSaved?: boolean }) {
  return <article className="job-card">
    <div className="job-card-top"><div className="company-monogram" aria-hidden="true">{job.organization_name.slice(0, 1)}</div><div><p className="company-name">{job.organization_name}</p><p className="job-location"><MapPin size={13} /> {job.location}</p></div>{job.is_demo ? <span className="demo-tag">Demo listing</span> : null}<SaveJobButton jobId={job.id} initialSaved={initialSaved} signedIn={signedIn} canSave={canSave} /></div>
    <Link className="job-title-link" href={`/jobs/${job.slug}`}><h3>{job.title}</h3></Link>
    <p className="job-summary">{job.description}</p>
    <div className="job-tags"><span>{job.work_arrangement}</span><span>{job.employment_type}</span><span>{salary(job)}</span></div>
    <div className="job-card-bottom"><span>{job.verification_status === "verified" ? "Employer verified" : "Employer not verified"}</span><Link href={`/jobs/${job.slug}`} aria-label={`View ${job.title}`}><ArrowUpRight size={18} /></Link></div>
  </article>;
}