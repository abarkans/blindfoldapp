"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess } from "@/lib/partner-invites";
import { safeLogValue } from "@/lib/log";

export async function updateEmailNotifications(enabled: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  const { error } = await admin
    .from("profiles")
    .update({ email_notifications: enabled })
    .eq("id", access.profileId);

  if (error) {
    console.error(
      `[audit] update-email-notifications: failed uid=${safeLogValue(user.id)} msg=${safeLogValue(error.message)}`
    );
    return { error: "Failed to update preference." };
  }

  revalidatePath("/dashboard");
  return {};
}
