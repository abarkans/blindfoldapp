"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { finishOnboarding } from "@/app/actions/finish-onboarding";
import ProgressBar from "./ProgressBar";
import StepIdentity from "./steps/StepIdentity";
import StepPlan from "./steps/StepPlan";
import StepInterests from "./steps/StepInterests";
import StepLogistics from "./steps/StepLogistics";
import StepLocation from "./steps/StepLocation";
import Button from "@/components/ui/Button";
import type { IdentityFormData, LogisticsFormData } from "@/lib/schemas/onboarding";
import type { LocationFormData } from "./steps/StepLocation";
import type { PlanId } from "@/lib/plans";

type OnboardingData = {
  partner1?: string;
  partner2?: string;
  plan_type?: PlanId;
  interests?: string[];
  budget_max?: number;
  has_car?: boolean;
  prefers_walking?: boolean;
  lat?: number;
  lng?: number;
  preferred_radius?: number;
  cadence?: string;
};

const STEP_LABELS = ["Names", "Plan", "Interests", "Budget", "Location"];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

interface OnboardingFlowProps {
  initialPartner1?: string;
  initialPartner2?: string;
  initialPlanType?: PlanId;
  initialCadence?: string;
  initialStep?: number;
}

export default function OnboardingFlow({
  initialPartner1 = "",
  initialPartner2 = "",
  initialPlanType,
  initialCadence,
  initialStep,
}: OnboardingFlowProps) {
  const router = useRouter();

  const startStep = initialStep ?? (initialPlanType === "subscription" ? 3 : 1);

  const [step, setStep] = useState(startStep);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    partner1: initialPartner1,
    partner2: initialPartner2,
    plan_type: initialPlanType,
    cadence: initialCadence,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Nav bar state — lifted out of steps so buttons render outside the motion wrapper
  const [canContinue, setCanContinue] = useState(false);
  const [continueTrigger, setContinueTrigger] = useState(0);
  const [continueLabel, setContinueLabel] = useState("Continue");
  const [planSubStep, setPlanSubStep] = useState<"plan" | "frequency" | null>(null);

  // Reset nav state whenever the step changes
  useEffect(() => {
    setCanContinue(false);
    setContinueLabel(step === 5 ? "Finish Setup" : "Continue");
    setPlanSubStep(null);
  }, [step]);

  async function handleExitToHome() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  function goNext(newData: Partial<OnboardingData>) {
    const merged = { ...data, ...newData };
    setData(merged);
    setDirection(1);
    setStep((s) => {
      if (s === 1 && merged.plan_type === "subscription") return 3;
      return s + 1;
    });
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => {
      if (s === 3 && data.plan_type === "subscription") return 1;
      return s - 1;
    });
  }

  function handleBack() {
    // If on step 2 (Plan) in frequency substep, reset to plan substep
    if (step === 2 && planSubStep === "frequency") {
      setPlanSubStep("plan");
      setContinueLabel("Continue");
      setCanContinue(false);
    } else {
      goBack();
    }
  }

  async function handleSubscribeNow(cadence: string) {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Session expired. Please log in again.");
        setLoading(false);
        return;
      }

      await supabase.from("profiles").upsert({
        id: user.id,
        partner_names: { partner1: data.partner1 ?? "", partner2: data.partner2 ?? "" },
      });

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cadence, returnPath: "/onboarding" }),
      });
      const json = await res.json();
      if (!json.url || json.error) {
        setError(json.error ?? "Couldn't start checkout. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = json.url;
    } catch (err) {
      console.error("[checkout]", err);
      setError("Couldn't start checkout. Please try again.");
      setLoading(false);
    }
  }

  async function handleFinish(loc: LocationFormData) {
    setLoading(true);
    setError("");

    const cadence = (data.cadence ?? "monthly") as "weekly" | "biweekly" | "monthly";
    const result = await finishOnboarding({
      partner1: data.partner1 ?? "",
      partner2: data.partner2 ?? "",
      interests: data.interests ?? [],
      budget_max: data.budget_max ?? 50,
      has_car: data.has_car ?? false,
      prefers_walking: data.prefers_walking ?? false,
      cadence,
      lat: loc.lat,
      lng: loc.lng,
      preferred_radius: loc.preferred_radius,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <div className="h-dvh flex flex-col bg-[#0d0d14]">
      {/* Scrollable step content (header scrolls with content) */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 max-w-sm mx-auto">
          <header className="pt-8 pb-4 flex flex-col gap-5">
            <button
              onClick={handleExitToHome}
              className="flex items-center gap-3 group w-fit"
              aria-label="Go back to home"
            >
              <Image src="/icon.png" alt="Blindfold" width={40} height={40} className="group-hover:brightness-110 transition-all" />
              <div className="text-left">
                <h1 className="text-base font-bold text-white">BlindfoldDate</h1>
                <p className="text-white/55 text-xs">Quick setup — we handle the rest</p>
              </div>
            </button>

            <ProgressBar current={step} total={5} labels={STEP_LABELS} />
          </header>

          {error && (
            <div className="mb-2 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

        <div className="pt-2 pb-6 md:pb-8">
          <div className="overflow-x-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full"
              >
                {step === 1 && (
                  <StepIdentity
                    defaultValues={{ partner1: data.partner1, partner2: data.partner2 }}
                    onNext={(d: IdentityFormData) => goNext({ partner1: d.partner1, partner2: d.partner2 })}
                    continueTrigger={continueTrigger}
                    onCanContinueChange={setCanContinue}
                  />
                )}
                {step === 2 && (
                  <StepPlan
                    onNext={(d) => goNext({ plan_type: d.plan_type, cadence: d.cadence })}
                    onSubscribeNow={handleSubscribeNow}
                    continueTrigger={continueTrigger}
                    onCanContinueChange={setCanContinue}
                    onContinueLabelChange={setContinueLabel}
                    onSubstepChange={setPlanSubStep}
                  />
                )}
                {step === 3 && (
                  <StepInterests
                    defaultValues={data.interests}
                    planType={data.plan_type}
                    onNext={(d) => goNext({ interests: d.interests })}
                    onBack={goBack}
                    continueTrigger={continueTrigger}
                    onCanContinueChange={setCanContinue}
                  />
                )}
                {step === 4 && (
                  <StepLogistics
                    defaultValues={{
                      budget_max: data.budget_max,
                      has_car: data.has_car,
                      prefers_walking: data.prefers_walking,
                    }}
                    onNext={(d: LogisticsFormData) =>
                      goNext({
                        budget_max: d.budget_max,
                        has_car: d.has_car,
                        prefers_walking: d.prefers_walking,
                      })
                    }
                    continueTrigger={continueTrigger}
                    onCanContinueChange={setCanContinue}
                  />
                )}
                {step === 5 && (
                  <StepLocation
                    defaultValues={{
                      lat: data.lat,
                      lng: data.lng,
                      preferred_radius: data.preferred_radius,
                    }}
                    onNext={handleFinish}
                    planType={data.plan_type}
                    continueTrigger={continueTrigger}
                    onCanContinueChange={setCanContinue}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop-only buttons — below content */}
          <div className="hidden md:flex gap-3 mt-8">
            {step > 1 && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-14 shrink-0 px-0"
                onClick={handleBack}
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <Button
              type="button"
              size="lg"
              className="flex-1"
              disabled={!canContinue || loading}
              loading={loading}
              onClick={() => setContinueTrigger((t) => t + 1)}
            >
              {continueLabel}
            </Button>
          </div>
        </div>
        </div>
      </div>

      {/* Fixed bottom nav bar — mobile only, outside motion wrapper to avoid transform stacking context */}
      <nav
        className="md:hidden shrink-0 bg-[#0d0d14] border-t border-white/8 px-4 pt-3"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="max-w-sm mx-auto flex gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-14 shrink-0 px-0"
              onClick={handleBack}
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <Button
            type="button"
            size="lg"
            className="flex-1"
            disabled={!canContinue || loading}
            loading={loading}
            onClick={() => setContinueTrigger((t) => t + 1)}
          >
            {continueLabel}
          </Button>
        </div>
      </nav>
    </div>
  );
}
