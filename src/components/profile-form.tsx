"use client";

import { FormEvent, useState } from "react";

export function ProfileForm({ headline, location, skills, about, experience, education, website, emailJobAlerts, networkVisible }: { headline: string; location: string; skills: string; about: string; experience: string; education: string; website: string; emailJobAlerts: boolean; networkVisible: boolean }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const response = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ headline: form.get("headline"), location: form.get("location"), skills: form.get("skills"), about: form.get("about"), experience: form.get("experience"), education: form.get("education"), website: form.get("website"), emailJobAlerts: form.get("emailJobAlerts") === "on", networkVisible: form.get("networkVisible") === "on" }) });
    const result = await response.json();
    setBusy(false);
    setError(!response.ok);
    setMessage(response.ok ? result.message : result.error ?? "Profile could not be saved.");
  }

  return <form className="new-job-form" onSubmit={submit}>
    <label>Professional headline<input name="headline" maxLength={140} defaultValue={headline} placeholder="e.g. Customer support specialist" /></label>
    <label>Preferred location<input name="location" maxLength={120} defaultValue={location} placeholder="City, country, or remote" /></label>
    <label>About you<textarea name="about" maxLength={2000} rows={4} defaultValue={about} placeholder="A short introduction to your strengths and the work you want to do" /></label>
    <label>Experience<textarea name="experience" maxLength={4000} rows={5} defaultValue={experience} placeholder="Role, organization, dates, and impact. One position per paragraph." /></label>
    <label>Education<textarea name="education" maxLength={3000} rows={3} defaultValue={education} placeholder="Qualification, institution, and dates" /></label>
    <label>Skills you want to highlight<input name="skills" maxLength={1200} defaultValue={skills} placeholder="Separate skills with commas" /></label>
    <label>Portfolio or personal website<input name="website" type="url" maxLength={500} defaultValue={website} placeholder="https://example.com" /></label>
    <label className="check-label"><input name="networkVisible" type="checkbox" defaultChecked={networkVisible} />Show my profile in Olyvara member search</label>
      <label className="check-label"><input name="emailJobAlerts" type="checkbox" defaultChecked={emailJobAlerts} />Email me when new opportunities are published</label>
    <p className="field-hint">Skills are self-reported, not verified. They are compared only with employer-stated role requirements.</p>
    {message && <p className={error ? "notice-error" : "notice-success"} role={error ? "alert" : "status"}>{message}</p>}
    <button className="button button-primary" disabled={busy}>{busy ? "Saving..." : "Save profile"}</button>
  </form>;
}