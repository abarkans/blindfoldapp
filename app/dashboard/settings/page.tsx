import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import { ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_complete) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-[#0d0d14] p-4">
      <div className="max-w-sm mx-auto">
        {/* Nav */}
        <div className="flex items-center gap-3 mb-8 pt-2">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-pink-500/40">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Settings</h1>
              <p className="text-white/40 text-xs">Update your preferences</p>
            </div>
          </div>
        </div>

        <SettingsPanel profile={profile} />
      </div>
    </div>
  );
}
