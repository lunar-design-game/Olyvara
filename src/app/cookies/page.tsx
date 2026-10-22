import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiePolicyPage() {
  return <main className="page-shell policy-page">
    <header className="page-heading"><p className="eyebrow">Olyvara legal information</p><h1>Cookie Policy</h1><p><strong>Last updated:</strong> 20 October 2026</p></header>
    <section className="policy-section"><h2>Essential session cookie</h2><p>Olyvara uses an essential, HTTP-only session cookie to keep registered users signed in and to protect access to account features. The cookie is not used for advertising.</p><p>Signing out removes the session cookie. You can also manage cookies through your browser settings, but blocking the session cookie will prevent sign-in and use of protected features.</p></section>
    <section className="policy-section"><h2>Analytics and advertising</h2><p>Olyvara does not currently enable analytics or advertising cookies in this application. If optional cookies are introduced, this page and the relevant controls will be updated before they are used.</p></section>
    <section className="policy-section"><h2>Contact</h2><p>For questions about cookies, contact [Insert monitored privacy email address]. Complete this placeholder before publication.</p></section>
  </main>;
}