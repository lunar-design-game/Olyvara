import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { MessageComposer } from "@/components/message-composer";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ with?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/register");
  if (user.role === "admin") redirect("/admin");
  const db = getDb();
  const contacts = db.prepare(`
    SELECT users.id, users.name, candidate_profiles.headline,
      MAX(messages.created_at) AS last_message_at,
      SUM(CASE WHEN messages.recipient_id = ? AND messages.read_at IS NULL THEN 1 ELSE 0 END) AS unread_count
    FROM connections
    JOIN users ON users.id = CASE WHEN connections.sender_id = ? THEN connections.recipient_id ELSE connections.sender_id END
    LEFT JOIN candidate_profiles ON candidate_profiles.user_id = users.id
    LEFT JOIN messages ON (messages.sender_id = ? AND messages.recipient_id = users.id) OR (messages.sender_id = users.id AND messages.recipient_id = ?)
    WHERE connections.status = 'accepted' AND (connections.sender_id = ? OR connections.recipient_id = ?)
    GROUP BY users.id ORDER BY last_message_at DESC, users.name COLLATE NOCASE
  `).all(user.id, user.id, user.id, user.id, user.id, user.id) as { id: string; name: string; headline: string | null; last_message_at: string | null; unread_count: number }[];
  const { with: otherId } = await searchParams;

  if (!otherId) return <main className="page-shell network-page">
    <div className="page-heading"><p className="eyebrow"><MessageCircle size={14} /> Direct communication</p><h1>Messages</h1><p>Message accepted connections. No unsolicited mass outreach.</p></div>
    <div className="message-layout"><aside className="message-contacts">{contacts.length ? contacts.map((contact) => <Link className="message-contact" key={contact.id} href={`/messages?with=${contact.id}`}><span className="jobs-avatar">{contact.name.slice(0, 1).toUpperCase()}</span><span><strong>{contact.name}</strong><small>{contact.headline || "Olyvara member"}</small></span>{contact.unread_count > 0 && <span className="unread-count">{contact.unread_count}</span>}</Link>) : <div className="empty-state"><h3>No conversations yet</h3><p>Accept a connection request to start a conversation.</p><Link className="text-link" href="/network">Find people <ArrowLeft size={14} /></Link></div>}</aside><section className="message-thread-empty"><MessageCircle size={24} /><h2>Your conversations</h2><p>Choose a connection to read or send a message.</p></section></div>
  </main>;

  const connected = contacts.find((contact) => contact.id === otherId);
  if (!connected) redirect("/messages");
  db.prepare("UPDATE messages SET read_at = ? WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL")
    .run(new Date().toISOString(), otherId, user.id);
  const messages = db.prepare(`SELECT id, sender_id, body, created_at FROM messages
    WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?) ORDER BY created_at`)
    .all(user.id, otherId, otherId, user.id) as { id: string; sender_id: string; body: string; created_at: string }[];

  return <main className="page-shell network-page">
    <div className="page-heading"><p className="eyebrow"><MessageCircle size={14} /> Direct communication</p><h1>Messages</h1><p>Message accepted connections. No unsolicited mass outreach.</p></div>
    <div className="message-layout"><aside className="message-contacts">{contacts.map((contact) => <Link className={`message-contact${contact.id === otherId ? " is-active" : ""}`} key={contact.id} href={`/messages?with=${contact.id}`}><span className="jobs-avatar">{contact.name.slice(0, 1).toUpperCase()}</span><span><strong>{contact.name}</strong><small>{contact.headline || "Olyvara member"}</small></span>{contact.unread_count > 0 && <span className="unread-count">{contact.unread_count}</span>}</Link>)}</aside><section className="message-thread"><header className="message-thread-header"><Link className="text-link" href="/network"><ArrowLeft size={14} /> Network</Link><h2>{connected.name}</h2><p>{connected.headline || "Olyvara member"}</p></header><div className="message-history">{messages.length ? messages.map((message) => <article className={`message-bubble${message.sender_id === user.id ? " is-mine" : ""}`} key={message.id}><p>{message.body}</p><time>{new Date(message.created_at).toLocaleString()}</time></article>) : <p className="field-hint">Start the conversation with a thoughtful note.</p>}</div><MessageComposer recipientId={otherId} /></section></div>
  </main>;
}