import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sendUserNotificationEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to connect with members." }, { status: 401 });
  let body: { targetId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Choose a valid connection action." }, { status: 400 });
  }
  const { targetId, action } = body;
  if (!targetId || targetId === user.id || !["request", "accept", "decline", "cancel", "remove"].includes(action ?? "")) {
    return NextResponse.json({ error: "Choose a valid member and connection action." }, { status: 400 });
  }

  const db = getDb();
  const target = db.prepare(`SELECT users.id, users.name FROM users LEFT JOIN candidate_profiles ON candidate_profiles.user_id = users.id
    WHERE users.id = ? AND users.role IN ('candidate', 'employer') AND coalesce(candidate_profiles.network_visible, 1) = 1`)
    .get(targetId) as { id: string; name: string } | undefined;
  if (!target) return NextResponse.json({ error: "That member is not available in the network." }, { status: 404 });

  const now = new Date().toISOString();
  let notification: { userId: string; message: string; subject: string } | null = null;
  if (action === "request") {
    const existing = db.prepare("SELECT sender_id, recipient_id, status FROM connections WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)")
      .get(user.id, target.id, target.id, user.id) as { sender_id: string; recipient_id: string; status: string } | undefined;
    if (existing?.status === "accepted") return NextResponse.json({ error: "You are already connected." }, { status: 409 });
    if (existing) return NextResponse.json({ error: existing.sender_id === target.id ? "This member has already requested to connect. Accept their request." : "Your connection request is already pending." }, { status: 409 });
    db.prepare("INSERT INTO connections (id, sender_id, recipient_id, status, created_at, updated_at) VALUES (?, ?, ?, 'pending', ?, ?)")
      .run(randomUUID(), user.id, target.id, now, now);
    notification = { userId: target.id, message: `${user.name} sent you a connection request.`, subject: "You have a new Olyvara connection request" };
  } else if (action === "accept") {
    const result = db.prepare("UPDATE connections SET status = 'accepted', updated_at = ? WHERE sender_id = ? AND recipient_id = ? AND status = 'pending'")
      .run(now, target.id, user.id);
    if (result.changes !== 1) return NextResponse.json({ error: "That connection request is no longer pending." }, { status: 409 });
    notification = { userId: target.id, message: `${user.name} accepted your connection request. You can now message each other.`, subject: "Your Olyvara connection request was accepted" };
  } else {
    const condition = action === "decline" ? "sender_id = ? AND recipient_id = ? AND status = 'pending'" : action === "cancel" ? "sender_id = ? AND recipient_id = ? AND status = 'pending'" : "((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)) AND status = 'accepted'";
    const result = action === "remove"
      ? db.prepare(`DELETE FROM connections WHERE ${condition}`).run(user.id, target.id, target.id, user.id)
      : db.prepare(`DELETE FROM connections WHERE ${condition}`).run(action === "decline" ? target.id : user.id, action === "decline" ? user.id : target.id);
    if (result.changes !== 1) return NextResponse.json({ error: "That connection is no longer available." }, { status: 409 });
  }

  if (notification) {
    const id = randomUUID();
    db.prepare("INSERT INTO notifications (id, user_id, message, created_at) VALUES (?, ?, ?, ?)").run(id, notification.userId, notification.message, now);
    await sendUserNotificationEmail(notification.userId, notification.subject, notification.message);
  }
  return NextResponse.json({ ok: true });
}