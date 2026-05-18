"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";

export async function acceptDate(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // date_accepted_at is protected by the lockdown trigger from migration 015,
  // so the admin client is required after the explicit auth check above.
  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);
  const { error } = await admin
    .from("profiles")
    .update({ date_accepted_at: new Date().toISOString() })
    .eq("id", access.profileId);

  if (error) {
    console.error(`[audit] accept-date: write failed uid=${user.id} msg=${error.message}`);
    throw new Error("Failed to accept date. Please try again.");
  }

  revalidatePath("/dashboard");
}
