import type { Metadata } from "next";
import LandingV2Client from "@/components/landing-v2/LandingV2Client";

const SITE_URL = "https://blindfolddate.com";

export const metadata: Metadata = {
  title: "BlindfoldDate - The date stays hidden",
  description:
    "A dark, mystery-led date planning experience. Tell BlindfoldDate your taste once, then reveal a real date plan when you are ready.",
  alternates: { canonical: `${SITE_URL}/landing-v2` },
  robots: { index: false, follow: true },
  openGraph: {
    title: "BlindfoldDate - The date stays hidden",
    description:
      "A dark, mystery-led date planning experience with real venues, sealed reveals, and date nights planned for two.",
    url: `${SITE_URL}/landing-v2`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    type: "website",
  },
};

export default function LandingV2Page() {
  return <LandingV2Client />;
}
