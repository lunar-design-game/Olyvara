import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ google?: string; apple?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const params = await searchParams;
  const googleMessage = params.google === "setup" ? "Google sign-in is not configured yet. Use your email and password for now." : params.google === "failed" ? "Google sign-in could not be completed. Please try again." : "";
  const appleMessage = params.apple === "setup" ? "Apple sign-in is not configured yet. Use email or Google for now." : params.apple === "failed" ? "Apple sign-in could not be completed. Please try again." : "";
  return <main className="auth-layout"><section className="auth-aside"><div><p className="eyebrow">A hiring process you can follow</p><h1>Your next step, all in one place.</h1><p>Pick up your search, check an application, or get back to the people you are hiring.</p></div><span className="auth-aside-note">Clear updates. No invented progress.</span></section><section className="auth-main"><h2>Welcome back</h2><p>Sign in to continue to your Olyvara workspace.</p><AuthForm mode="login" googleMessage={googleMessage} appleMessage={appleMessage} /></section></main>;
}