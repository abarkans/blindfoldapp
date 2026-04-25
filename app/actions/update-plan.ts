"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PlanId } from "@/lib/plans";

export async function updatePlanType(planType: PlanId): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // TODO: Integrate Stripe Checkout before setting subscription
  const { error } = await supabase
    .from("profiles")
    .update({ plan_type: planType })
    .eq("id", user.id);

  if (error) return { error: "Failed to update plan" };

  revalidatePath("/dashboard");
  return {};
}
