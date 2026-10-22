import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create your account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string; google?: string; apple?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const params = await searchParams;
  const initialRole = params.role === "employer" ? "employer" : "candidate";
  const googleMessage = params.google === "setup" ? "Google sign-in is not configured yet. Use your email and password for now." : params.google === "failed" ? "Google sign-in could not be completed. Please try again." : "";
  const appleMessage = params.apple === "setup" ? "Apple sign-in is not configured yet. Use email or Google for now." : params.apple === "failed" ? "Apple sign-in could not be completed. Please try again." : "";
  return <main className="auth-layout"><section className="auth-aside"><div><p className="eyebrow">Welcome to Olyvara</p><h1>A clearer way to show up for your next opportunity.</h1><p>Create your account once. Keep your work organized and your choices in your hands.</p></div><span className="auth-aside-note">Candidate information stays private unless you choose to share it.</span></section><section className="auth-main"><h2>Create your account</h2><p>Choose how you want to use Olyvara. Candidate accounts are for people 18 and older.</p><AuthForm mode="register" initialRole={initialRole} googleMessage={googleMessage} appleMessage={appleMessage} /></section></main>;
}