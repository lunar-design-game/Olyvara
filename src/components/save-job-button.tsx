"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "react";

export function SaveJobButton({ jobId, initialSaved, signedIn, canSave }: { jobId: string; initialSaved: boolean; signedIn: boolean; canSave: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!signedIn) return <Link className="save-job-link" href="/register" aria-label="Create an account to save this opportunity" title="Create an account to save">Sign up to save</Link>;
  if (!canSave) return null;

  async function toggle() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/saved-jobs", { method: saved ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }) });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setError(result.error ?? "Could not update saved jobs.");
    setSaved(!saved);
  }

  return <span className="save-job-control"><button className={`icon-button${saved ? " is-saved" : ""}`} type="button" onClick={toggle} disabled={busy} aria-label={saved ? "Remove saved opportunity" : "Save opportunity"} title={saved ? "Remove saved opportunity" : "Save opportunity"}>{saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}</button>{error && <span className="field-hint" role="alert">{error}</span>}</span>;
}