import type { Metadata } from "next";
import LandingV3Client from "@/components/landing-v3/LandingV3Client";

const SITE_URL = "https://blindfolddate.com";

export const metadata: Metadata = {
  title: "BlindfoldDate — Stop Planning. Just Show Up.",
  description: "AI-powered mystery date planning. Tell us your interests once — we find real nearby venues, write your date story, and handle every detail. You just show up.",
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  openGraph: {
    title: "BlindfoldDate — Stop Planning. Just Show Up.",
    description: "AI-powered mystery date planning. Tell us your interests once — we find real nearby venues, write your date story, and handle every detail. You just show up.",
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    type: "website",
  },
};

export default function HomePage() {
  return <LandingV3Client />;
}
