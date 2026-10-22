"use client";

import { useState } from "react";

export function AccountDeletion({ role }: { role: "candidate" | "employer" }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function deleteAccount() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(result.error ?? "Your account could not be deleted.");
      return;
    }
    window.location.assign("/?account=deleted");
  }

  return <>
    <section className="dashboard-panel danger-zone">
      <h2>Delete account</h2>
      <p>{role === "employer" ? "Deleting your account also removes your organization and its vacancies." : "Deleting your account removes your profile, applications, connections, and messages."}</p>
      <button className="button button-danger button-small" type="button" onClick={() => setOpen(true)}>Delete my account</button>
    </section>
    {open && <div className="confirm-backdrop" role="presentation">
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title" aria-describedby="delete-account-description">
        <p className="eyebrow">This cannot be undone</p>
        <h2 id="delete-account-title">Delete your Olyvara account?</h2>
        <p id="delete-account-description">Your account data will be removed and you will be signed out immediately. To continue, type <strong>DELETE</strong> below.</p>
        <label htmlFor="delete-account-confirmation">Confirmation<input id="delete-account-confirmation" autoFocus value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="confirm-actions"><button className="button button-small" type="button" onClick={() => { setOpen(false); setConfirmation(""); setError(""); }}>Cancel</button><button className="button button-danger button-small" type="button" disabled={busy || confirmation !== "DELETE"} onClick={deleteAccount}>{busy ? "Deleting..." : "Delete account and sign out"}</button></div>
      </section>
    </div>}
  </>;
}