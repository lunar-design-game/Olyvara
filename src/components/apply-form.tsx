"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function ApplyForm({ jobId, signedIn, applicationQuestion }: { jobId: string; signedIn: boolean; applicationQuestion: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    formData.set("jobId", jobId);
    const video = formData.get("video");
    const cv = formData.get("cv");
    const screeningResponse = formData.get("screeningResponse");
    if (applicationQuestion && (typeof screeningResponse !== "string" || !screeningResponse.trim())) {
      setBusy(false);
      return setMessage("Answer the employer's role-related question before applying.");
    }
    if (video instanceof File && video.size > 25 * 1024 * 1024) {
      setBusy(false);
      return setMessage("Choose a video smaller than 25 MB.");
    }
    if (cv instanceof File && cv.size > 10 * 1024 * 1024) {
      setBusy(false);
      return setMessage("Choose a CV smaller than 10 MB.");
    }
    const response = await fetch("/api/applications", {
      method: "POST", body: formData,
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(result.error ?? "Application could not be submitted.");
    router.push("/dashboard?applied=1");
    router.refresh();
  }

  if (!signedIn) return <div className="apply-prompt"><p>Sign in as a candidate to apply and track your application.</p><Link className="button button-primary" href="/sign-in">Sign in to apply</Link></div>;
  return <form className="apply-form" onSubmit={submit}>
    <p className="field-hint">Your saved profile skills are shared with this employer. A video is never required. Apply with your skills, a CV, a work sample, or any combination that suits you.</p>
    <label htmlFor="note">A short note for the hiring team <span className="field-hint">Optional. Only include relevant information you want to share.</span></label>
    <textarea id="note" name="note" maxLength={2000} rows={4} />
    {applicationQuestion && <><label htmlFor="screeningResponse">{applicationQuestion}<span className="field-hint">Required for this role. Keep your answer focused on relevant experience.</span></label><textarea id="screeningResponse" name="screeningResponse" maxLength={1500} rows={4} required /></>}
    <label htmlFor="cv">CV or resume <span className="field-hint">Optional · PDF or DOCX · up to 10 MB. Shared only with this employer.</span></label>
    <input className="video-input" id="cv" name="cv" type="file" accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx" />
    <label htmlFor="projectUrl">Project or portfolio link <span className="field-hint">Optional · include a work sample that is relevant to this role.</span></label>
    <input id="projectUrl" name="projectUrl" type="url" maxLength={500} placeholder="https://example.com/your-work" />
    <label htmlFor="video">Video introduction <span className="field-hint">Optional · MP4, WebM, or MOV · up to 25 MB. Shared only with this employer.</span></label>
    <input className="video-input" id="video" name="video" type="file" accept="video/mp4,video/webm,video/quicktime" />
    {message && <p className="form-error" role="alert">{message}</p>}
    <button className="button button-primary" disabled={busy}>{busy ? "Submitting..." : "Review and submit application"}</button>
    <p className="field-hint">Your application is saved only after the server confirms it.</p>
  </form>;
}