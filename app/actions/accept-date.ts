"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function acceptDate(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // date_accepted_at is protected by the lockdown trigger from migration 015,
  // so the admin client is required after the explicit auth check above.
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ date_accepted_at: new Date().toISOString() })
    .eq("id", user.id);

  revalidatePath("/dashboard");
}
