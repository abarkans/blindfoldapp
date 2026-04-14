"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ProgressBar from "./ProgressBar";
import StepIdentity from "./steps/StepIdentity";
import StepInterests from "./steps/StepInterests";
import StepLogistics from "./steps/StepLogistics";
import StepLocation from "./steps/StepLocation";
import StepFrequency from "./steps/StepFrequency";
import type { IdentityFormData, LogisticsFormData, FrequencyFormData } from "@/lib/schemas/onboarding";
import type { LocationFormData } from "./steps/StepLocation";

type OnboardingData = {
  partner1?: string;
  partner2?: string;
  interests?: string[];
  budget_max?: number;
  has_car?: boolean;
  prefers_walking?: boolean;
  lat?: number;
  lng?: number;
  preferred_radius?: number;
  cadence?: string;
};

const STEP_LABELS = ["Identity", "Interests", "Logistics", "Location", "Frequency"];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
  }),
};

export default function OnboardingFlow({ initialPartner1 = "" }: { initialPartner1?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>({ partner1: initialPartner1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExitToHome() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  function goNext(newData: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...newData }));
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  async function handleFinish(freq: FrequencyFormData) {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please log in again.");
      setLoading(false);
      return;
    }

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: user.id,
      partner_names: { partner1: data.partner1 ?? "", partner2: data.partner2 ?? "" },
      interests: data.interests ?? [],
      constraints: {
        budget_max: data.budget_max ?? 50,
        has_car: data.has_car ?? false,
        prefers_walking: data.prefers_walking ?? false,
      },
      cadence: freq.cadence,
      last_lat: data.lat ?? null,
      last_long: data.lng ?? null,
      preferred_radius: data.preferred_radius ?? 10000,
      onboarding_complete: true,
    });

    if (upsertError) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    localStorage.setItem("dashboard-tab", "date");
    router.replace("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <button
        onClick={handleExitToHome}
        className="flex items-center gap-3 mb-2 group w-fit"
        aria-label="Go back to home"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center shadow-lg shadow-rose-500/40 group-hover:brightness-110 transition-all">
          <Heart className="w-5 h-5 text-white fill-white" />
        </div>
        <div className="text-left">
          <h1 className="text-base font-bold text-white">BlindfoldDate</h1>
          <p className="text-white/40 text-xs">Let&apos;s set up your dates</p>
        </div>
      </button>

      <ProgressBar current={step} total={5} labels={STEP_LABELS} />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

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
              />
            )}
            {step === 2 && (
              <StepInterests
                defaultValues={data.interests}
                onNext={(d) => goNext({ interests: d.interests })}
                onBack={goBack}
              />
            )}
            {step === 3 && (
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
                onBack={goBack}
              />
            )}
            {step === 4 && (
              <StepLocation
                defaultValues={{
                  lat: data.lat,
                  lng: data.lng,
                  preferred_radius: data.preferred_radius,
                }}
                onNext={(d: LocationFormData) =>
                  goNext({
                    lat: d.lat,
                    lng: d.lng,
                    preferred_radius: d.preferred_radius,
                  })
                }
                onBack={goBack}
              />
            )}
            {step === 5 && (
              <StepFrequency
                defaultValues={{ cadence: data.cadence as FrequencyFormData["cadence"] }}
                onNext={handleFinish}
                onBack={goBack}
                loading={loading}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
