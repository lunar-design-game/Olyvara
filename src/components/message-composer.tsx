"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function MessageComposer({ recipientId }: { recipientId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    setError("");
    const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientId, message: form.get("message") }) });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setError(result.error ?? "Message could not be sent.");
    formElement.reset();
    router.refresh();
  }

  return <form className="message-composer" onSubmit={submit}>
    <label className="visually-hidden" htmlFor="message-body">Write a message</label>
    <textarea id="message-body" name="message" rows={3} maxLength={4000} required placeholder="Write a thoughtful message..." />
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-primary button-small" disabled={busy}>{busy ? "Sending..." : "Send message"}</button>
  </form>;
}