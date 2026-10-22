"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConnectionAction({ targetId, status }: { targetId: string; status: "none" | "incoming" | "outgoing" | "connected" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(action: string) {
    setBusy(true);
    setError("");
    const response = await fetch("/api/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId, action }) });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setError(result.error ?? "Connection action failed.");
    router.refresh();
  }

  return <div className="connection-actions">
    {status === "connected" ? <><span className="status-pill">Connected</span><Link className="button button-small button-primary" href={`/messages?with=${targetId}`}>Message</Link><button className="button button-small" type="button" disabled={busy} onClick={() => act("remove")}>Remove</button></> : status === "incoming" ? <><button className="button button-small button-primary" type="button" disabled={busy} onClick={() => act("accept")}>Accept</button><button className="button button-small" type="button" disabled={busy} onClick={() => act("decline")}>Decline</button></> : status === "outgoing" ? <button className="button button-small" type="button" disabled={busy} onClick={() => act("cancel")}>Request sent · Cancel</button> : <button className="button button-small button-primary" type="button" disabled={busy} onClick={() => act("request")}>{busy ? "Sending..." : "Connect"}</button>}
    {error && <span className="notice-error" role="alert">{error}</span>}
  </div>;
}