import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Olyvara | Work, made clearer", template: "%s | Olyvara" },
  description: "Explore opportunities, show the work behind your skills, and follow every application in one place.",
  icons: { icon: "/olyvara-mark.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteHeader />{children}</body></html>;
}