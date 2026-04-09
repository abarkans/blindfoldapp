import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/dashboard/BottomNav";
import { Heart } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete, partner_names")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_complete) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col">
      {/* Sticky header — shared across all tabs */}
      <header className="sticky top-0 z-30 bg-[#0d0d14]/90 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-sm mx-auto flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-pink-500/40">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Blindfold</p>
            <p className="text-sm font-bold text-white leading-tight">
              {profile.partner_names.partner1} &amp; {profile.partner_names.partner2}
            </p>
          </div>
        </div>
      </header>

      {/* Scrollable tab content */}
      <main className="flex-1 overflow-y-auto px-4 pt-5 pb-28">
        <div className="max-w-sm mx-auto">{children}</div>
      </main>

      <BottomNav />
    </div>
  );
}
