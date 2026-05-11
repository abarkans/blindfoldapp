import type { Metadata } from "next";
import LandingV2Client from "@/components/landing-v2/LandingV2Client";

const SITE_URL = "https://blindfolddate.com";

export const metadata: Metadata = {
  title: "BlindfoldDate - Stop Planning. Just Show Up.",
  description:
    "AI-powered mystery date planning. Tell us your interests once, then we find real nearby venues, write your date story, and handle every detail.",
  alternates: { canonical: `${SITE_URL}/landing-v2` },
  robots: { index: false, follow: true },
  openGraph: {
    title: "BlindfoldDate - Stop Planning. Just Show Up.",
    description:
      "AI-powered mystery date planning with real venues, sealed reveals, and date nights planned for two.",
    url: `${SITE_URL}/landing-v2`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    type: "website",
  },
};

export default function LandingV2Page() {
  return <LandingV2Client />;
}
