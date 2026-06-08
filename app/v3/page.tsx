import type { Metadata } from "next";
import LandingV3Client from "@/components/landing-v3/LandingV3Client";
import { getUnitSystem } from "@/lib/get-unit-system";

export const metadata: Metadata = {
  title: "BlindfoldDate - Date Night, Decided. Just Show Up.",
  robots: { index: false, follow: false },
};

export default async function LandingV3Page() {
  const unitSystem = await getUnitSystem();
  return <LandingV3Client unitSystem={unitSystem} />;
}
