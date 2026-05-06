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
  const isCancelReturn = checkout === "cancelled";

  // initialPlanType: DB-confirmed value only. Drives step-skip and data.plan_type init.
  // DB "free" default is not a meaningful choice, so don't pass it.
  const initialPlanType: PlanId | undefined = savedPlanType === "subscription" ? "subscription" : undefined;

  // initialSelectedPlan: only for StepPlan pre-selection UI. Does NOT affect step-skip.
  //   - Cancel return → nothing (choose fresh)
  //   - URL param (?plan=subscription from landing CTA) → pre-select it
  const initialSelectedPlan: PlanId | undefined = isCancelReturn ? undefined : planFromUrl;

  // Step to start on:
  //   - Cancel return with names saved → step 2 (fresh plan selection)
  //   - DB-confirmed subscriber → step 3 (plan already done, skip it)
  const initialStep =
    isCancelReturn && !!savedPartner1 ? 2 :
    initialPlanType === "subscription" ? 3 :
    undefined;
  const unitSystem = await getUnitSystem();

  return (
    <OnboardingFlow
      initialPartner1={savedPartner1}
      initialPartner2={savedPartner2}
      initialPlanType={initialPlanType}
      initialSelectedPlan={initialSelectedPlan}
      initialCadence={savedCadence}
      initialStep={initialStep}
      unitSystem={unitSystem}
      fromCancelledCheckout={isCancelReturn}
    />
  );
}
