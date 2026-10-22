"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AuthForm({ mode, initialRole = "candidate", googleMessage = "", appleMessage = "" }: { mode: "register" | "login"; initialRole?: "candidate" | "employer"; googleMessage?: string; appleMessage?: string }) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [error, setError] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [busy, setBusy] = useState(false);
  const registering = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"), email: form.get("email"), password: form.get("password"), role,
        organization: form.get("organization"), ageConfirmed: form.get("ageConfirmed") === "on",
      }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setError(result.error ?? "Something went wrong. Try again.");
    router.push(result.redirect ?? "/dashboard");
    router.refresh();
  }

  function startProviderSignIn(provider: "google" | "apple") {
    if (registering && role === "candidate" && !(document.querySelector<HTMLInputElement>('input[name="ageConfirmed"]')?.checked)) {
      setGoogleError("Confirm you are 18 or older before creating a candidate account.");
      return;
    }
    window.location.assign(`/api/auth/${provider}?flow=${registering ? "register" : "login"}`);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {registering && <>
        <label>I'm joining as
          <select value={role} onChange={(event) => setRole(event.target.value as "candidate" | "employer")}>
            <option value="candidate">A job seeker</option>
            <option value="employer">An employer</option>
          </select>
        </label>
        <label>Your name<input name="name" autoComplete="name" required maxLength={100} /></label>
        {role === "employer" && <label>Organization name<input name="organization" required maxLength={160} /></label>}
      </>}
      {registering && role === "candidate" && <label className="check-label"><input name="ageConfirmed" type="checkbox" required />I confirm I am 18 or older.</label>}
      {(mode === "login" || role === "candidate") && <div className="auth-providers">
        {googleMessage && <p className="form-error" role="status">{googleMessage}</p>}
        {appleMessage && <p className="form-error" role="status">{appleMessage}</p>}
        {googleError && <p className="form-error" role="alert">{googleError}</p>}
        <button className="button button-provider button-google button-wide" type="button" onClick={() => startProviderSignIn("google")}><img src="/google-g.svg" alt="" width="19" height="19" />Continue with Google</button>
        <button className="button button-provider button-apple button-wide" type="button" onClick={() => startProviderSignIn("apple")}><img src="/apple-mark.svg" alt="" width="19" height="19" />Continue with Apple</button>
        <p className="auth-divider"><span>Or continue with email</span></p>
      </div>}
      <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label>Password<input name="password" type="password" autoComplete={registering ? "new-password" : "current-password"} required minLength={registering ? 12 : 1} maxLength={128} />
        {registering && <span className="field-hint">Use at least 12 characters.</span>}
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary button-wide" disabled={busy}>{busy ? "Please wait..." : registering ? "Create account" : "Sign in"}</button>
      <p className="auth-switch">{registering ? "Already have an account?" : "New to Olyvara?"} <Link href={registering ? "/sign-in" : "/register"}>{registering ? "Sign in" : "Create an account"}</Link></p>
    </form>
  );
}