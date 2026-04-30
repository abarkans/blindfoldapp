import { cookies } from "next/headers";
import type { UnitSystem } from "@/lib/units";

export const UNIT_SYSTEM_COOKIE = "unit_system";

export async function getUnitSystem(): Promise<UnitSystem> {
  const store = await cookies();
  const v = store.get(UNIT_SYSTEM_COOKIE)?.value;
  return v === "imperial" ? "imperial" : "metric";
}
