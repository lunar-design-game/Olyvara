"use client";

import { FormEvent, useState } from "react";

const statuses = [
  ["under_review", "Under review"],
  ["shortlisted", "Shortlisted"],
  ["interview_invited", "Interview invited"],
  ["rejected", "Rejected"],
  ["position_closed", "Position closed"],
];

export function ApplicationStatus({ applicationId, initialStatus }: { applicationId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const terminal = ["hired", "rejected", "withdrawn", "position_closed"].includes(status);

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/employer/applications/${applicationId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: form.get("status") }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(result.error ?? "Status could not be updated.");
    setStatus(String(form.get("status")));
    setMessage("Status updated. The candidate was notified.");
  }

  if (terminal) return <span className="status-label">{status.replaceAll("_", " ")}</span>;
  return <form className="status-form" onSubmit={update}>
    <select name="status" defaultValue={status} aria-label="Application status">
      <option value="received">Received</option>
      {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
    <button className="button button-small" disabled={busy}>{busy ? "Saving" : "Update"}</button>
    {message && <span className="field-hint" role="status">{message}</span>}
  </form>;
}