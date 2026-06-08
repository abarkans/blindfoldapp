"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { finishOnboarding } from "@/app/actions/finish-onboarding";
import ProgressBar from "./ProgressBar";
import StepIdentity from "./steps/StepIdentity";
import StepInterests from "./steps/StepInterests";
import StepLogistics from "./steps/StepLogistics";
import StepLocation from "./steps/StepLocation";
import Button from "@/components/ui/Button";
import PublicPageShell from "@/components/ui/PublicPageShell";
import type { LogisticsFormData } from "@/lib/schemas/onboarding";
import type { LocationFormData } from "./steps/StepLocation";
import type { UnitSystem } from "@/lib/units";

type OnboardingData = {
  partner1?: string;
  interests?: string[];
  budget_max?: number;
  date_outside?: boolean;
  date_at_home?: boolean;
  lat?: number;
  lng?: number;
  preferred_radius?: number;
};

const STEP_LABELS_FULL = ["Name", "Interests", "Budget", "Location"];
const STEP_LABELS_NO_NAME = ["Interests", "Budget", "Location"];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

interface OnboardingFlowProps {
  initialPartner1?: string;
  initialStep?: number;
  unitSystem?: UnitSystem;
}

export default function OnboardingFlow({
  initialPartner1 = "",
  initialStep,
  unitSystem = "metric",
}: OnboardingFlowProps) {
  const router = useRouter();
  const ph = usePostHog();

  const startStep = initialStep ?? 1;
  const skipNameStep = startStep > 1;
  const stepLabels = skipNameStep ? STEP_LABELS_NO_NAME : STEP_LABELS_FULL;
  const totalSteps = skipNameStep ? 3 : 4;

  const [step, setStep] = useState(startStep);
  const displayStep = skipNameStep ? step - 1 : step;
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>({ partner1: initialPartner1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [canContinue, setCanContinue] = useState(false);
  const [continueTrigger, setContinueTrigger] = useState(0);
  const [continueLabel, setContinueLabel] = useState("Continue");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    ph?.capture("onboarding_started", { start_step: startStep });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setContinueLabel(step === 4 ? "Let's go" : "Continue");
  }, [step]);

  useEffect(() => {
    if (!history.state?.onboardingStep) {
      history.replaceState({ ...history.state, onboardingStep: startStep }, "");
    }
    function onPop(e: PopStateEvent) {
      const target = e.state?.onboardingStep;
      if (typeof target === "number") {
        setStep((current) => {
          setDirection(target > current ? 1 : -1);
          return target;
        });
      }
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [startStep]);

  async function handleExitToHome() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  function goNext(newData: Partial<OnboardingData>) {
    const merged = { ...data, ...newData };
    setData(merged);
    const next = step + 1;
    ph?.capture("onboarding_step_complete", { step });
    setDirection(1);
    setStep(next);
    history.pushState({ ...history.state, onboardingStep: next }, "");
  }

  function goBack() {
    history.back();
  }

  async function handleFinish(loc: LocationFormData) {
    setLoading(true);
    setGenerating(true);
    setError("");

    const result = await finishOnboarding({
      partner1: data.partner1 ?? "",
      partner2: "",
      interests: data.interests ?? [],
      budget_max: data.budget_max ?? 50,
      date_outside: data.date_outside ?? true,
      date_at_home: data.date_at_home ?? false,
      cadence: "monthly",
      lat: loc.lat,
      lng: loc.lng,
      preferred_radius: loc.preferred_radius,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      setGenerating(false);
      return;
    }

    ph?.capture("onboarding_completed");
    router.replace("/dashboard");
  }

  if (generating) {
    return (
      <PublicPageShell className="fixed inset-0" decorate={false}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 flex h-dvh flex-col items-center justify-center gap-8 px-4 text-center"
        >
          <Image src="/icon.png" alt="Blindfold" width={72} height={72} className="opacity-90" />
          <div>
            <p className="text-white text-xl font-semibold">Your mystery date is loading</p>
            <p className="text-white/55 text-sm mt-2">Picking the perfect spot for you...</p>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-white/60"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
          </div>
        </motion.div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell className="fixed inset-0" decorate={false}>
    <div className="relative z-10 flex h-dvh flex-col">
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
                <p className="text-white/55 text-xs">Quick setup. We handle the rest</p>
              </div>
            </button>

            <ProgressBar current={displayStep} total={totalSteps} labels={stepLabels} />
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
                    defaultValues={{ partner1: data.partner1 }}
                    onNext={(d) => goNext({ partner1: d.partner1 })}
                    continueTrigger={continueTrigger}
                    onCanContinueChange={setCanContinue}
                  />
                )}
                {step === 2 && (
                  <StepInterests
                    defaultValues={data.interests}
                    planType="trial"
                    onNext={(d) => goNext({ interests: d.interests })}
                    onBack={goBack}
                    continueTrigger={continueTrigger}
                    onCanContinueChange={setCanContinue}
                  />
                )}
                {step === 3 && (
                  <StepLogistics
                    defaultValues={{
                      budget_max: data.budget_max,
                      date_outside: data.date_outside,
                      date_at_home: data.date_at_home,
                    }}
                    onNext={(d: LogisticsFormData) =>
                      goNext({
                        budget_max: d.budget_max,
                        date_outside: d.date_outside,
                        date_at_home: d.date_at_home,
                      })
                    }
                    continueTrigger={continueTrigger}
                    onCanContinueChange={setCanContinue}
                    unitSystem={unitSystem}
                  />
                )}
                {step === 4 && (
                  <StepLocation
                    defaultValues={{
                      lat: data.lat,
                      lng: data.lng,
                      preferred_radius: data.preferred_radius,
                    }}
                    onNext={handleFinish}
                    planType="trial"
                    continueTrigger={continueTrigger}
                    onCanContinueChange={setCanContinue}
                    unitSystem={unitSystem}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="hidden md:flex gap-3 mt-8">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-14 shrink-0 px-0"
              onClick={step === 1 ? handleExitToHome : goBack}
              aria-label={step === 1 ? "Sign out" : "Back"}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
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

      <nav
        className="md:hidden shrink-0 border-t border-white/16 bg-black/72 px-4 pt-3 shadow-[0_-18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="max-w-sm mx-auto flex gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-14 shrink-0 px-0"
            onClick={step === 1 ? handleExitToHome : goBack}
            aria-label={step === 1 ? "Sign out" : "Back"}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
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
    </PublicPageShell>
  );
}
