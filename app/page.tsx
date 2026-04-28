import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingDesktopClient from "@/components/landing-desktop/LandingDesktopClient";

const SITE_URL = "https://blindfolddate.com";

export const metadata: Metadata = {
  title: "BlindfoldDate — Stop Planning. Just Show Up.",
  description: "AI-powered mystery date planning. Tell us your interests once — we find real nearby venues, write your date story, and handle every detail. You just show up.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "BlindfoldDate — Stop Planning. Just Show Up.",
    description: "AI-powered mystery date planning. Tell us your interests once — we find real nearby venues, write your date story, and handle every detail. You just show up.",
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    type: "website",
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_complete) redirect("/dashboard");
  }

  return <LandingDesktopClient />;
}
