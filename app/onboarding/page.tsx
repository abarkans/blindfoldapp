import { redirect } from "next/navigation";
import { getClientAndUser } from "@/lib/supabase/get-client-and-user";
import { createAdminClient } from "@/lib/supabase/admin";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import type { PlanId } from "@/lib/plans";
import { getUnitSystem } from "@/lib/get-unit-system";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; plan?: string; cadence?: string; session_id?: string }>;
}) {
  const { supabase, user } = await getClientAndUser();

  if (!user) redirect("/login");

  const { data: profileFromRLS, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_complete, plan_type, partner_names, cadence")
    .eq("id", user.id)
    .single();

  // RLS policies on this table can return 500 for some users (policy evaluation
  // error). Fall back to admin client which bypasses RLS — safe here since
  // user.id is verified via auth and we only query their own row.
  const profile = profileError
    ? (await createAdminClient()
        .from("profiles")
        .select("onboarding_complete, plan_type, partner_names, cadence")
        .eq("id", user.id)
        .single()).data
    : profileFromRLS;

  if (profile?.onboarding_complete) redirect("/dashboard");

  // Pre-fill partner1: prefer saved DB value (set during partial save before Stripe),
  // fall back to Google OAuth metadata.
  const meta = user.user_metadata as Record<string, string> | undefined;
  const firstName =
    meta?.given_name ||
    meta?.full_name?.split(" ")[0] ||
    meta?.name?.split(" ")[0] ||
    "";

  const names = profile?.partner_names as { partner1?: string; partner2?: string; partner_email?: string } | null;
  const savedPartner1 = names?.partner1 || firstName;
  const savedPartner2 = names?.partner2 ?? "";
  const savedPartnerEmail = names?.partner_email ?? "";
  const savedPlanType = (profile?.plan_type as PlanId | null) ?? undefined;
  const savedCadence = (profile?.cadence as string | null) ?? undefined;

  const { checkout, plan, cadence, session_id } = await searchParams;
  const planFromUrl = plan === "free" || plan === "subscription" ? (plan as PlanId) : undefined;
  const isCancelReturn = checkout === "cancelled";
  let isVerifiedCompletedCheckout = false;
  let verifiedCheckoutCadence: string | undefined;
  if (checkout === "completed" && session_id && savedPlanType !== "subscription") {
    try {
      const { stripe } = await import("@/lib/stripe");
      const session = await stripe.checkout.sessions.retrieve(session_id);
      isVerifiedCompletedCheckout =
        session.status === "complete" &&
        session.mode === "subscription" &&
        session.metadata?.user_id === user.id;
      const rawCadence = session.metadata?.cadence;
      verifiedCheckoutCadence =
        rawCadence === "weekly" || rawCadence === "biweekly" || rawCadence === "monthly"
          ? rawCadence
          : undefined;
    } catch (error) {
      console.error(`[onboarding] checkout verification failed uid=${user.id} msg=${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const cadenceFromUrl =
    cadence === "weekly" || cadence === "biweekly" || cadence === "monthly"
      ? cadence
      : undefined;

  // initialPlanType drives step-skip and data.plan_type init.
  // DB "free" default is not a meaningful choice, so don't pass it.
  // A completed Stripe return is only used after verifying the Checkout
  // session server-side, so users cannot unlock Plus setup via query params.
  const initialPlanType: PlanId | undefined =
    savedPlanType === "subscription" || isVerifiedCompletedCheckout
      ? "subscription"
      : undefined;

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
      initialPartnerEmail={savedPartnerEmail}
      initialPlanType={initialPlanType}
      initialSelectedPlan={initialSelectedPlan}
      initialCadence={savedCadence ?? verifiedCheckoutCadence ?? cadenceFromUrl}
      initialStep={initialStep}
      unitSystem={unitSystem}
      fromCancelledCheckout={isCancelReturn}
      checkoutSessionId={isVerifiedCompletedCheckout ? session_id : undefined}
    />
  );
}
