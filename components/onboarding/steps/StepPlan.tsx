"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Sparkles, Zap } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/plans";
import { CADENCE_OPTIONS } from "@/components/ui/CadenceSelect";

interface StepPlanProps {
  onNext: (data: { plan_type: PlanId; cadence: string }) => void;
  onSubscribeNow: (cadence: string) => void;
  continueTrigger: number;
  onCanContinueChange: (can: boolean) => void;
  onContinueLabelChange: (label: string) => void;
  onOverrideBack: (fn: (() => void) | null) => void;
}

type SubStep = "plan" | "frequency";

const PLAN_ICONS = {
  free: Lock,
  subscription: Sparkles,
};

export default function StepPlan({
  onNext,
  onSubscribeNow,
  continueTrigger,
  onCanContinueChange,
  onContinueLabelChange,
  onOverrideBack,
}: StepPlanProps) {
  const [subStep, setSubStep] = useState<SubStep>("plan");
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [selectedCadence, setSelectedCadence] = useState<"weekly" | "biweekly" | "monthly" | null>(null);
  const mountTrigger = useRef(continueTrigger);

  // Report validity based on current sub-step
  useEffect(() => {
    if (subStep === "plan") {
      onCanContinueChange(selectedPlan !== null);
    } else {
      onCanContinueChange(selectedCadence !== null);
    }
  }, [subStep, selectedPlan, selectedCadence, onCanContinueChange]);

  // Handle continue trigger
  useEffect(() => {
    if (continueTrigger <= mountTrigger.current) return;
    if (subStep === "plan") {
      if (!selectedPlan) return;
      if (selectedPlan === "free") {
        onNext({ plan_type: "free", cadence: "monthly" });
      } else {
        // Transition to frequency sub-step
        setSubStep("frequency");
        onContinueLabelChange("Subscribe & Continue");
        onCanContinueChange(false);
        onOverrideBack(() => {
          setTimeout(() => {
            setSubStep("plan");
            onContinueLabelChange("Continue");
            onCanContinueChange(selectedPlan !== null);
            onOverrideBack(null);
          }, 0);
        });
      }
    } else {
      if (!selectedCadence) return;
      onSubscribeNow(selectedCadence);
    }
  }, [continueTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6 pt-4">
      <AnimatePresence mode="wait">
        {subStep === "plan" && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-white">Choose your plan</h2>
              <p className="text-white/50 text-sm">You can change this anytime from settings.</p>
            </div>

            <div className="flex flex-col gap-3">
              {PLANS.map((plan) => {
                const Icon = PLAN_ICONS[plan.id];
                const isSelected = selectedPlan === plan.id;
                return (
                  <motion.button
                    key={plan.id}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={[
                      "relative flex flex-col gap-4 p-5 rounded-3xl border text-left transition-all duration-200",
                      isSelected
                        ? plan.highlighted
                          ? "bg-gradient-to-br from-pink-500/25 to-violet-500/15 border-pink-500"
                          : "bg-white/10 border-white/40"
                        : plan.highlighted
                          ? "bg-gradient-to-br from-pink-500/15 to-violet-500/8 border-pink-500/40"
                          : "bg-white/5 border-white/10 hover:border-white/20",
                    ].join(" ")}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-5">
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-pink-500 to-violet-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg">
                          <Zap className="w-2.5 h-2.5" />
                          Most popular
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={[
                          "w-9 h-9 rounded-xl flex items-center justify-center",
                          plan.highlighted ? "bg-pink-500/20" : "bg-white/8",
                        ].join(" ")}>
                          <Icon className={`w-4 h-4 ${plan.highlighted ? "text-pink-400" : "text-white/50"}`} />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{plan.name}</p>
                          <p className="text-[11px] text-white/40 mt-0.5">{plan.tagline}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className={`font-black text-lg ${plan.highlighted ? "text-white" : "text-white/70"}`}>
                            {plan.priceLine.split(" ")[0]}
                          </p>
                          {plan.highlighted && (
                            <p className="text-[10px] text-white/35 mt-0.5">per month</p>
                          )}
                        </div>
                        {/* Selection indicator */}
                        <div className={[
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                          isSelected
                            ? plan.highlighted ? "border-pink-500 bg-pink-500" : "border-white bg-white"
                            : "border-white/20",
                        ].join(" ")}>
                          {isSelected && <Check className={`w-3 h-3 ${plan.highlighted ? "text-white" : "text-[#0d0d14]"}`} />}
                        </div>
                      </div>
                    </div>

                    <ul className="flex flex-col gap-1.5">
                      {plan.features.map((feat) => {
                        const isKey = feat.includes("Date as often") || feat.includes("Personalized");
                        return (
                          <li key={feat} className="flex items-start gap-2">
                            <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isKey && plan.highlighted ? "text-pink-400" : "text-emerald-400"}`} />
                            <span className={`text-xs ${isKey && plan.highlighted ? "text-white font-semibold" : "text-white/55"}`}>
                              {feat}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {subStep === "frequency" && (
          <motion.div
            key="frequency"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <p className="text-xs text-pink-400 font-semibold uppercase tracking-widest">Plus</p>
              <h2 className="text-2xl font-bold text-white">How often?</h2>
              <p className="text-white/50 text-sm">We&apos;ll reveal a new date on your chosen schedule.</p>
            </div>

            <div className="flex flex-col gap-2.5">
              {CADENCE_OPTIONS.map(({ value, label, sublabel }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedCadence(value)}
                  className={[
                    "flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200",
                    selectedCadence === value
                      ? "bg-gradient-to-r from-pink-500/20 to-rose-500/10 border-pink-500 text-white"
                      : "bg-white/5 border-white/10 text-white/80 hover:border-white/30",
                  ].join(" ")}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{label}</p>
                    <p className={`text-xs mt-0.5 ${selectedCadence === value ? "text-pink-300/70" : "text-white/35"}`}>
                      {sublabel}
                    </p>
                  </div>
                  {selectedCadence === value && <Check className="w-4 h-4 text-pink-400 shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
