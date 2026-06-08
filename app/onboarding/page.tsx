import { redirect } from "next/navigation";
import { getClientAndUser } from "@/lib/supabase/get-client-and-user";
import { createAdminClient } from "@/lib/supabase/admin";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { getUnitSystem } from "@/lib/get-unit-system";

export default async function OnboardingPage() {
  const { supabase, user } = await getClientAndUser();

  if (!user) redirect("/login");

  const { data: profileFromRLS, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_complete, partner_names")
    .eq("id", user.id)
    .single();

  const profile = profileError
    ? (await createAdminClient()
        .from("profiles")
        .select("onboarding_complete, partner_names")
        .eq("id", user.id)
        .single()).data
    : profileFromRLS;

  if (profile?.onboarding_complete) redirect("/dashboard");

  const meta = user.user_metadata as Record<string, string> | undefined;
  const firstName =
    meta?.given_name ||
    meta?.full_name?.split(" ")[0] ||
    meta?.name?.split(" ")[0] ||
    "";

  const names = profile?.partner_names as { partner1?: string } | null;
  const savedPartner1 = names?.partner1 || firstName;

  const unitSystem = await getUnitSystem();

  return (
    <OnboardingFlow
      initialPartner1={savedPartner1}
      initialStep={savedPartner1 ? 2 : 1}
      unitSystem={unitSystem}
    />
  );
}
