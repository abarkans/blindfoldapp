"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hashEmail, isCooldownActive, cooldownExpiry } from "@/lib/deletion-hold";

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();

  // Persist a deletion hold if the user is mid-cooldown so they can't bypass
  // the reveal cadence by deleting and re-registering with the same email.
  if (user.email) {
    const { data: profile } = await admin
      .from("profiles")
      .select("revealed_at, cadence")
      .eq("id", user.id)
      .single();

    if (profile?.revealed_at && profile.cadence && isCooldownActive(profile.revealed_at, profile.cadence)) {
      await admin.from("deletion_holds").upsert({
        id_hash: hashEmail(user.email),
        revealed_at: profile.revealed_at,
        cadence: profile.cadence,
        expires_at: cooldownExpiry(profile.revealed_at, profile.cadence).toISOString(),
      });
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new Error("Failed to delete account");

  await supabase.auth.signOut();
}
