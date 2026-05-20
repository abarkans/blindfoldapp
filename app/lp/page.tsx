import type { Metadata } from "next";
import LandingV3Client from "@/components/landing-v3/LandingV3Client";
import { getUnitSystem } from "@/lib/get-unit-system";

export const metadata: Metadata = {
  title: "BlindfoldDate — Stop Debating. We'll Decide.",
  description: "You don't need more date ideas. You need one plan you'll both say yes to. Set your budget, pick in or out — we handle the rest.",
  robots: { index: false, follow: false },
};

export default async function LpPage() {
  const unitSystem = await getUnitSystem();
  return <LandingV3Client unitSystem={unitSystem} />;
}
