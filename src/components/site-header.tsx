import Link from "next/link";
import { ArrowUpRight, Bell } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { LogoutButton } from "@/components/logout-button";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unreadCount = user ? (getDb().prepare("SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL").get(user.id) as { count: number }).count : 0;
  return <header className="site-header">
    <Link className="brand" href="/" aria-label="Olyvara home"><img className="brand-symbol" src="/olyvara-mark.svg" alt="" /><span>Olyvara</span></Link>
    <nav className="primary-nav" aria-label="Main navigation">
      <Link href="/">Home</Link>
      <Link href="/jobs">Find work</Link>
      {user && user.role !== "admin" && <Link href="/network">My network</Link>}
      {user && user.role !== "admin" && <Link href="/messages">Messages</Link>}
      {user?.role === "candidate" && <Link href="/dashboard">Job tracker</Link>}
      <a href="/#how-it-works">How it works</a>
      <a href="/#for-employers">For employers</a>
    </nav>
    <div className="header-actions">
      {user ? <><Link className="nav-notifications" href="/notifications" aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"} title="Notifications"><Bell size={17} />{unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}</Link><Link className="nav-dashboard" href={user.role === "admin" ? "/admin" : "/dashboard"}>{user.role === "admin" ? "Review queue" : "My workspace"} <ArrowUpRight size={15} /></Link><span className="header-user">{user.name}</span><LogoutButton /></> : <><Link className="nav-signin" href="/sign-in">Sign in</Link><Link className="button button-dark button-small" href="/register">Get started <ArrowUpRight size={15} /></Link></>}
    </div>
  </header>;
}