"use client";

import { FormEvent, useState } from "react";

export function ModerationAction({ jobId }: { jobId: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function decide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/admin/jobs/${jobId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: fields.get("status"), reason: fields.get("reason") }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(result.error ?? "Decision could not be saved.");
    setMessage("Decision recorded. Refresh to update the queue.");
    form.reset();
  }

  return <form className="moderation-form" onSubmit={decide}>
    <label>Decision reason<input name="reason" maxLength={500} required placeholder="Record the evidence reviewed" /></label>
    <div><select name="status" aria-label="Moderation decision"><option value="published">Approve and publish</option><option value="rejected">Reject</option></select><button className="button button-small" disabled={busy}>{busy ? "Saving..." : "Record decision"}</button></div>
    {message && <p className="field-hint" role="status">{message}</p>}
  </form>;
}