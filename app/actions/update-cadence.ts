"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeLogValue } from "@/lib/log";

const cadenceSchema = z.enum(["weekly", "biweekly", "monthly"]);

// Plus-only mutation. Free users would otherwise call
//   supabase.from('profiles').update({ cadence: 'weekly' })
// directly from devtools and shorten their reveal cooldown 4x. The lockdown
// trigger now reverts client-side cadence writes; legitimate Plus users go
// through this action.
export async function updateCadence(value: unknown): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = cadenceSchema.safeParse(value);
  if (!parsed.success) return { error: "Invalid cadence" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_type")
    .eq("id", user.id)
    .single();

  if (profile?.plan_type !== "subscription") {
    console.warn(`[audit] update-cadence: free-tier attempt uid=${safeLogValue(user.id)}`);
    return { error: "Plus subscription required" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ cadence: parsed.data })
    .eq("id", user.id);

  if (error) {
    console.error(`[audit] update-cadence: uid=${safeLogValue(user.id)} msg=${safeLogValue(error.message)}`);
    return { error: "Failed to save" };
  }

  revalidatePath("/dashboard");
  return {};
}
