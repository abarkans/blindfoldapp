import type { Metadata } from "next";
import LandingV3Client from "@/components/landing-v3/LandingV3Client";
import { getUnitSystem } from "@/lib/get-unit-system";

const SITE_URL = "https://blindfolddate.com";

export const metadata: Metadata = {
  title: "BlindfoldDate — One Date Plan. Picked For You.",
  description: "You don't need more date ideas. You need one plan you'll actually agree on. Set your budget and go-out vs stay-in — we handle the rest.",
  alternates: { canonical: `${SITE_URL}/lp` },
  robots: { index: false, follow: false },
  openGraph: {
    title: "BlindfoldDate — One Date Plan. Picked For You.",
    description: "You don't need more date ideas. You need one plan you'll actually agree on.",
    url: `${SITE_URL}/lp`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    type: "website",
  },
};

export default async function LpPage() {
  const unitSystem = await getUnitSystem();
  return <LandingV3Client unitSystem={unitSystem} />;
}
