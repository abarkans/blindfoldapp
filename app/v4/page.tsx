import type { Metadata } from "next";
import LandingV4Client from "@/components/landing-v4/LandingV4Client";
import { getUnitSystem } from "@/lib/get-unit-system";

export const metadata: Metadata = {
  title: "BlindfoldDate - Date Night, Decided. Just Show Up.",
  robots: { index: false, follow: false },
};

export default async function LandingV4Page() {
  const unitSystem = await getUnitSystem();
  return <LandingV4Client unitSystem={unitSystem} />;
}
