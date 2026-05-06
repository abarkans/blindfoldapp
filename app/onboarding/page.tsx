import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import type { PlanId } from "@/lib/plans";
import { getUnitSystem } from "@/lib/get-unit-system";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; plan?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete, plan_type, partner_names, cadence")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_complete) redirect("/dashboard");

  // Pre-fill partner1: prefer saved DB value (set during partial save before Stripe),
  // fall back to Google OAuth metadata.
  const meta = user.user_metadata as Record<string, string> | undefined;
  const firstName =
    meta?.given_name ||
    meta?.full_name?.split(" ")[0] ||
    meta?.name?.split(" ")[0] ||
    "";

  const names = profile?.partner_names as { partner1?: string; partner2?: string } | null;
  const savedPartner1 = names?.partner1 || firstName;
  const savedPartner2 = names?.partner2 ?? "";
  const savedPlanType = (profile?.plan_type as PlanId | null) ?? undefined;
  const savedCadence = (profile?.cadence as string | null) ?? undefined;

  const { checkout, plan } = await searchParams;
  const planFromUrl = plan === "free" || plan === "subscription" ? (plan as PlanId) : undefined;

  // Step to start on:
  //   - Stripe cancel return with names saved → step 2 (plan selection, fresh)
  //   - DB-confirmed subscriber → step 3 (plan already done)
  //   - Landing CTA with ?plan=subscription → explicit step 1 to prevent subscription skip
  const initialStep =
    checkout === "cancelled" && !!savedPartner1 ? 2 :
    savedPlanType === "subscription" ? 3 :
    planFromUrl === "subscription" ? 1 :
    undefined;

  // Plan to pre-select in step 2:
  //   - Stripe cancel return → nothing (user chooses fresh)
  //   - DB subscription → pass it (skip logic above handles the step)
  //   - URL param → use it (landing CTA intent)
  //   - DB "free" default → don't pre-select (not an explicit choice)
  const resolvedPlanType: PlanId | undefined = checkout === "cancelled"
    ? undefined
    : savedPlanType === "subscription"
      ? "subscription"
      : planFromUrl;
  const unitSystem = await getUnitSystem();

  return (
    <OnboardingFlow
      initialPartner1={savedPartner1}
      initialPartner2={savedPartner2}
      initialPlanType={resolvedPlanType}
      initialCadence={savedCadence}
      initialStep={initialStep}
      unitSystem={unitSystem}
      fromCancelledCheckout={checkout === "cancelled"}
    />
  );
}
