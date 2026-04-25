"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function acceptDate(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("profiles")
    .update({ date_accepted_at: new Date().toISOString() })
    .eq("id", user.id);

  revalidatePath("/dashboard");
}
