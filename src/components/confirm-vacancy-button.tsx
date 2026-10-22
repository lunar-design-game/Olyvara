"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConfirmVacancyButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/employer/jobs/${jobId}/confirm`, { method: "POST" });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setError(result.error ?? "Vacancy could not be confirmed.");
    setMessage("Confirmed just now");
    router.refresh();
  }

  return <div className="vacancy-confirm-control"><button className="button button-small" type="button" disabled={busy} onClick={confirm}>{busy ? "Confirming..." : "Confirm active"}</button>{message && <span className="field-hint" role="status">{message}</span>}{error && <span className="notice-error" role="alert">{error}</span>}</div>;
}