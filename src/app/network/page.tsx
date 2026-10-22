import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Search, UsersRound } from "lucide-react";
import { ConnectionAction } from "@/components/connection-action";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "My network" };

export default async function NetworkPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/register");
  if (user.role === "admin") redirect("/admin");
  const query = (await searchParams).q?.trim().slice(0, 80) ?? "";
  const db = getDb();
  const members = db.prepare(`
    SELECT users.id, users.name, candidate_profiles.headline, candidate_profiles.location,
      candidate_profiles.about, candidate_profiles.experience,
      CASE WHEN sent.status = 'accepted' OR received.status = 'accepted' THEN 'connected'
        WHEN received.status = 'pending' THEN 'incoming'
        WHEN sent.status = 'pending' THEN 'outgoing' ELSE 'none' END AS connection_status
    FROM users LEFT JOIN candidate_profiles ON candidate_profiles.user_id = users.id
    LEFT JOIN connections sent ON sent.sender_id = ? AND sent.recipient_id = users.id
    LEFT JOIN connections received ON received.sender_id = users.id AND received.recipient_id = ?
    WHERE users.id <> ? AND users.role IN ('candidate', 'employer')
      AND coalesce(candidate_profiles.network_visible, 1) = 1
      AND (? = '' OR users.name LIKE ? OR candidate_profiles.headline LIKE ? OR candidate_profiles.skills LIKE ?)
    ORDER BY CASE WHEN connection_status = 'incoming' THEN 0 WHEN connection_status = 'connected' THEN 1 ELSE 2 END,
      users.name COLLATE NOCASE LIMIT 40
  `).all(user.id, user.id, user.id, query, `%${query}%`, `%${query}%`, `%${query}%`) as { id: string; name: string; headline: string | null; location: string | null; about: string | null; experience: string | null; connection_status: "none" | "incoming" | "outgoing" | "connected" }[];

  return <main className="page-shell network-page">
    <div className="page-heading"><p className="eyebrow"><UsersRound size={14} /> Professional network</p><h1>People you can learn and work with.</h1><p>Send a request to connect. Direct messages open after both people accept.</p></div>
    <form className="search-panel network-search" action="/network"><label className="visually-hidden" htmlFor="member-search">Search people by name, role, or skills</label><input id="member-search" name="q" defaultValue={query} placeholder="Name, role, or skill" /><button className="button button-primary"><Search size={15} /> Search members</button></form>
    <div className="network-heading"><h2>{query ? "Search results" : "Members"}</h2><Link className="text-link" href="/messages">Open messages <ArrowUpRight size={14} /></Link></div>
    {members.length ? <div className="member-grid">{members.map((member) => <article className="member-item" key={member.id}><div className="member-title"><span className="jobs-avatar">{member.name.slice(0, 1).toUpperCase()}</span><div><h3>{member.name}</h3><p>{member.headline || "Olyvara member"}</p>{member.location && <small>{member.location}</small>}</div></div>{member.about && <p className="member-about">{member.about}</p>}{member.experience && <p className="member-experience"><strong>Experience</strong><br />{member.experience.split("\n")[0]}</p>}<ConnectionAction targetId={member.id} status={member.connection_status} /></article>)}</div> : <div className="empty-state"><h3>{query ? "No members found" : "No members to show yet"}</h3><p>Try another name, role, or skill. Members control whether they appear in search.</p></div>}
    <p className="field-hint">Members choose whether their profile appears here. Email addresses are never shown in search.</p>
  </main>;
}