import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsPanel from "@/components/dashboard/SettingsPanel";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_complete) redirect("/onboarding");

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-white/40 text-sm mt-1">Update your preferences.</p>
      </div>
      <SettingsPanel profile={profile} />
    </div>
  );
}
