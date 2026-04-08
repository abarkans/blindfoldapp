import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DateCard from "@/components/dashboard/DateCard";
import { Heart, Settings } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_complete) redirect("/onboarding");

  // Calculate next date based on cadence
  const now = new Date();
  const nextDate = new Date(now);
  switch (profile.cadence) {
    case "weekly": nextDate.setDate(now.getDate() + 7); break;
    case "biweekly": nextDate.setDate(now.getDate() + 14); break;
    case "monthly": nextDate.setMonth(now.getMonth() + 1); break;
    default: nextDate.setDate(now.getDate() + Math.floor(Math.random() * 10) + 3);
  }

  return (
    <div className="min-h-screen bg-[#0d0d14] p-4">
      <div className="max-w-sm mx-auto">
        {/* Nav */}
        <div className="flex items-center justify-between mb-8 pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-pink-500/40">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <p className="text-xs text-white/40">Hey there,</p>
              <p className="text-sm font-bold text-white">
                {profile.partner_names.partner1} &amp; {profile.partner_names.partner2}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="w-10 h-10 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>

        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Your next adventure</h2>
          <p className="text-white/40 text-sm mt-1">
            A mystery date is waiting for you two.
          </p>
        </div>

        {/* Date Card */}
        <DateCard
          partnerNames={profile.partner_names}
          nextDateDate={nextDate.toISOString()}
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { label: "Budget", value: `€${profile.constraints.budget_max}` },
            { label: "Frequency", value: profile.cadence.charAt(0).toUpperCase() + profile.cadence.slice(1) },
            { label: "Interests", value: `${profile.interests.length} topics` },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white/5 border border-white/8 rounded-2xl p-3 text-center"
            >
              <p className="text-white font-bold text-sm">{value}</p>
              <p className="text-white/40 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
