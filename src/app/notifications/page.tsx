import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/register");
  const db = getDb();
  const items = db.prepare("SELECT id, message, created_at, read_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100")
    .all(user.id) as { id: string; message: string; created_at: string; read_at: string | null }[];
  db.prepare("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL").run(new Date().toISOString(), user.id);
  return <main className="page-shell">
    <div className="page-heading"><p className="eyebrow"><Bell size={14} /> Updates</p><h1>Notifications</h1><p>Application changes, connection requests, and messages.</p></div>
    <section className="notification-list">{items.length ? items.map((item) => <article className={`notification-row${item.read_at ? "" : " is-unread"}`} key={item.id}><span className="notification-dot" /><div><p>{item.message}</p><time>{new Date(item.created_at).toLocaleString()}</time></div></article>) : <div className="empty-state"><h2>You're all caught up.</h2><p>Updates will appear here when something changes.</p></div>}</section>
  </main>;
}