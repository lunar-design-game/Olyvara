"use client";

import { FormEvent, useState } from "react";

type Preferences = { keywords: string; location: string; arrangement: string; currency: string; minimumSalary: number };

export function JobPreferencesForm({ initialPreferences }: { initialPreferences: Preferences }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/job-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords: form.get("keywords"),
        location: form.get("location"),
        arrangement: form.get("arrangement"),
        currency: form.get("currency"),
        minimumSalary: Number(form.get("minimumSalary") || 0),
      }),
    });
    const result = await response.json();
    setBusy(false);
    setError(!response.ok);
    setMessage(response.ok ? result.message : result.error ?? "Preferences could not be saved.");
    if (response.ok) window.location.assign("/jobs");
  }

  return <form className="job-preferences-form" onSubmit={submit}>
    <label>Job titles or skills<input name="keywords" maxLength={100} defaultValue={initialPreferences.keywords} placeholder="e.g. product design" /></label>
    <label>Location<input name="location" maxLength={100} defaultValue={initialPreferences.location} placeholder="City or country" /></label>
    <label>Work arrangement<select name="arrangement" defaultValue={initialPreferences.arrangement}><option value="">Any arrangement</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option><option value="On-site">On-site</option></select></label>
    <div className="preference-salary"><label>Currency<select name="currency" defaultValue={initialPreferences.currency}><option value="">Any</option><option value="KES">KES</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></label><label>Minimum monthly<input name="minimumSalary" type="number" min="0" max="10000000" step="1000" defaultValue={initialPreferences.minimumSalary || ""} /></label></div>
    {message && <p className={error ? "notice-error" : "notice-success"} role={error ? "alert" : "status"}>{message}</p>}
    <button className="button button-primary button-wide" disabled={busy}>{busy ? "Saving..." : "Save preferences"}</button>
    <p className="field-hint">Matches use the job details employers publish, not a hiring score.</p>
  </form>;
}