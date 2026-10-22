import { getDb } from "@/lib/db";

type OpportunityEmail = { title: string; slug: string; organization_name: string; location: string; work_arrangement: string };

async function sendEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.error(`Email delivery failed with status ${response.status}.`);
  } catch {
    console.error("Email delivery could not reach the provider.");
  }
}

export async function sendUserNotificationEmail(userId: string, subject: string, message: string) {
  const recipient = getDb().prepare("SELECT email FROM users WHERE id = ?").get(userId) as { email: string } | undefined;
  if (recipient) await sendEmail(recipient.email, subject, `${message}\n\nOpen your Olyvara workspace: ${process.env.APP_BASE_URL ?? "http://localhost:3000"}/dashboard`);
}

export async function sendOpportunityAlertEmails(opportunity: OpportunityEmail) {
  const subscribers = getDb().prepare(`
    SELECT users.email FROM candidate_profiles JOIN users ON users.id = candidate_profiles.user_id
    WHERE candidate_profiles.email_job_alerts = 1 AND users.role = 'candidate'
  `).all() as { email: string }[];
  const url = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/jobs/${opportunity.slug}`;
  await Promise.all(subscribers.map(({ email }) => sendEmail(
    email,
    `New Olyvara opportunity: ${opportunity.title}`,
    `${opportunity.title} at ${opportunity.organization_name}\n${opportunity.location} · ${opportunity.work_arrangement}\n\nView this opportunity: ${url}\n\nYou can turn off opportunity emails from your candidate workspace.`,
  )));
}