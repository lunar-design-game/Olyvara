import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sendUserNotificationEmail } from "@/lib/email";

export const runtime = "nodejs";

function isConnected(userId: string, otherId: string) {
  return Boolean(getDb().prepare(`SELECT 1 FROM connections WHERE status = 'accepted'
    AND ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))`)
    .get(userId, otherId, otherId, userId));
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to view messages." }, { status: 401 });
  const otherId = new URL(request.url).searchParams.get("with");
  if (!otherId || !isConnected(user.id, otherId)) return NextResponse.json({ error: "Messages are only available between accepted connections." }, { status: 403 });
  const db = getDb();
  const messages = db.prepare(`SELECT id, sender_id, recipient_id, body, created_at FROM messages
    WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
    ORDER BY created_at`).all(user.id, otherId, otherId, user.id);
  db.prepare("UPDATE messages SET read_at = ? WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL")
    .run(new Date().toISOString(), otherId, user.id);
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to send messages." }, { status: 401 });
  let body: { recipientId?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a message." }, { status: 400 });
  }
  const recipientId = body.recipientId;
  const message = body.message?.trim() ?? "";
  if (!recipientId || recipientId === user.id || !message || message.length > 4000) {
    return NextResponse.json({ error: "Messages must be 1 to 4,000 characters." }, { status: 400 });
  }
  if (!isConnected(user.id, recipientId)) return NextResponse.json({ error: "Accept a connection request before messaging." }, { status: 403 });
  const recipient = getDb().prepare("SELECT id, name FROM users WHERE id = ?").get(recipientId) as { id: string; name: string } | undefined;
  if (!recipient) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  const now = new Date().toISOString();
  getDb().transaction(() => {
    getDb().prepare("INSERT INTO messages (id, sender_id, recipient_id, body, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(randomUUID(), user.id, recipient.id, message, now);
    getDb().prepare("INSERT INTO notifications (id, user_id, message, created_at) VALUES (?, ?, ?, ?)")
      .run(randomUUID(), recipient.id, `${user.name} sent you a message.`, now);
  })();
  await sendUserNotificationEmail(recipient.id, "You have a new Olyvara message", `${user.name} sent you a message. Sign in to reply.`);
  return NextResponse.json({ ok: true }, { status: 201 });
}