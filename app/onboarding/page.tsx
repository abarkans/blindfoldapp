import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_complete) redirect("/dashboard");

  // Pre-fill partner1 from Google OAuth metadata if available
  const meta = user.user_metadata as Record<string, string> | undefined;
  const firstName =
    meta?.given_name ||
    meta?.full_name?.split(" ")[0] ||
    meta?.name?.split(" ")[0] ||
    "";

  return (
    <div className="min-h-screen bg-[#0d0d14] flex items-start pt-10 md:items-center md:pt-0 justify-center p-4">
      <div className="w-full max-w-sm">
        <OnboardingFlow initialPartner1={firstName} />
      </div>
    </div>
  );
}
