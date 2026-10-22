"use client";

import { FormEvent, useState } from "react";

export function NewJobForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage("");
    const form = new FormData(formElement);
    const numeric = (key: string) => form.get(key) ? Number(form.get(key)) : null;
    const response = await fetch("/api/employer/jobs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"), description: form.get("description"), responsibilities: form.get("responsibilities"),
        requiredSkills: form.get("requiredSkills"), preferredSkills: form.get("preferredSkills"), location: form.get("location"),
        workArrangement: form.get("workArrangement"), employmentType: form.get("employmentType"),
        deadline: form.get("deadline"), salaryMin: numeric("salaryMin"), salaryMax: numeric("salaryMax"),
        currency: form.get("currency"), applicationQuestion: form.get("applicationQuestion"),
      }),
    });
    const result = await response.json();
    setBusy(false);
    setError(!response.ok);
    setMessage(response.ok ? result.message : result.error ?? "Vacancy could not be saved.");
    if (response.ok) formElement.reset();
  }

  return <form className="new-job-form" onSubmit={submit}>
    <label>Job title<input name="title" required maxLength={120} /></label>
    <label>Role overview<textarea name="description" required maxLength={5000} /></label>
    <label>Responsibilities<textarea name="responsibilities" required maxLength={3000} /></label>
    <label>Essential skills<input name="requiredSkills" required maxLength={500} placeholder="Separate skills with commas" /></label>
    <label>Preferred skills<input name="preferredSkills" maxLength={500} /></label>
    <label>Location<input name="location" required maxLength={120} /></label>
    <label>Work arrangement<select name="workArrangement"><option>On-site</option><option>Hybrid</option><option>Remote</option></select></label>
    <label>Employment type<select name="employmentType"><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></label>
    <label>Salary currency<select name="currency"><option value="KES">KES</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></label>
    <label>Monthly minimum salary<input name="salaryMin" type="number" min="0" /></label>
    <label>Monthly maximum salary<input name="salaryMax" type="number" min="0" /></label>
    <label>Role-related application question <span className="field-hint">Optional. Applicants must answer it if you add one.</span><textarea name="applicationQuestion" maxLength={300} placeholder="e.g. What is one relevant project you have worked on?" /></label>
    <label>Application deadline<input name="deadline" type="date" /></label>
    {message && <p className={error ? "notice-error" : "notice-success"} role={error ? "alert" : "status"}>{message}</p>}
    <p className="field-hint">New vacancies enter review and stay private until approved. Salary figures are optional; no ranges are invented.</p>
    <button className="button button-primary" disabled={busy}>{busy ? "Submitting..." : "Submit vacancy for review"}</button>
  </form>;
}