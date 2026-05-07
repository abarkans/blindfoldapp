"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Sparkles } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/plans";
import { CADENCE_OPTIONS } from "@/components/ui/CadenceSelect";

interface StepPlanProps {
  onNext: (data: { plan_type: PlanId; cadence: string }) => void;
  onSubscribeNow: (cadence: string, billingInterval: "monthly" | "yearly") => void;
  continueTrigger: number;
  backTrigger: number;
  onCanContinueChange: (can: boolean) => void;
  onContinueLabelChange: (label: string) => void;
  onSubstepChange: (substep: "plan" | "frequency") => void;
  planType?: PlanId;
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
  backTrigger,
  onCanContinueChange,
  onContinueLabelChange,
  onSubstepChange,
  planType,
}: StepPlanProps) {
  const [subStep, setSubStep] = useState<SubStep>("plan");
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(planType ?? null);
  const [selectedCadence, setSelectedCadence] = useState<"weekly" | "biweekly" | "monthly" | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const mountTrigger = useRef(continueTrigger);
  const mountBackTrigger = useRef(backTrigger);

  // Handle continue trigger — only update child state
  useEffect(() => {
    if (continueTrigger <= mountTrigger.current) return;
    if (subStep === "plan") {
      if (!selectedPlan) return;
      if (selectedPlan === "free") {
        onNext({ plan_type: "free", cadence: "monthly" });
      } else {
        // Transition to frequency sub-step
        setSubStep("frequency");
      }
    } else {
      if (!selectedCadence) return;
      onSubscribeNow(selectedCadence, billingInterval);
    }
  }, [continueTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parent-driven back from frequency substep
  useEffect(() => {
    if (backTrigger <= mountBackTrigger.current) return;
    setSubStep("plan");
  }, [backTrigger]);

  // Sync substep changes to parent state (after child render completes)
  useEffect(() => {
    onSubstepChange(subStep);
    if (subStep === "plan") {
      onCanContinueChange(selectedPlan !== null);
    } else {
      // subStep === "frequency"
      onCanContinueChange(selectedCadence !== null);
      onContinueLabelChange("Subscribe & Continue");
    }
  }, [subStep, selectedPlan, selectedCadence, onCanContinueChange, onContinueLabelChange, onSubstepChange]);

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

            <div className="flex flex-col gap-5">
              {PLANS.map((plan) => {
                const Icon = PLAN_ICONS[plan.id];
                const isSelected = selectedPlan === plan.id;
                return (
                  <motion.div
                    key={plan.id}
                    role="button"
                    tabIndex={0}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPlan(plan.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedPlan(plan.id); }}
                    className={[
                      "relative flex flex-col gap-4 p-5 rounded-3xl border text-left transition-all duration-200 cursor-pointer",
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
                          <p className="text-[11px] text-white/55 mt-0.5">{plan.tagline}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          {plan.highlighted ? (
                            billingInterval === "yearly" ? (
                              <>
                                <p className="font-black text-lg text-white">€{plan.yearlyPrice}</p>
                                <p className="text-[10px] text-white/55 mt-0.5">per year</p>
                                <p className="text-[10px] text-emerald-400/80">~€{((plan.yearlyPrice ?? 0) / 12).toFixed(2)}/mo</p>
                              </>
                            ) : (
                              <>
                                <p className="font-black text-lg text-white">€{plan.introPrice}</p>
                                <p className="text-[10px] text-white/55 mt-0.5">first month</p>
                                <p className="text-[10px] text-pink-300/70">then €{plan.price}/mo</p>
                              </>
                            )
                          ) : (
                            <p className="font-black text-lg text-white/70">
                              {plan.priceLine.split(" ")[0]}
                            </p>
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

                    {/* Billing interval toggle — Plus card only */}
                    {plan.highlighted && (
                      <div
                        className="flex items-center gap-0.5 bg-black/20 rounded-xl p-0.5 self-start"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setBillingInterval("monthly")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            billingInterval === "monthly"
                              ? "bg-white/15 text-white"
                              : "text-white/45 hover:text-white/70"
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingInterval("yearly")}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            billingInterval === "yearly"
                              ? "bg-white/15 text-white"
                              : "text-white/45 hover:text-white/70"
                          }`}
                        >
                          Yearly
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-1 py-0.5 rounded-full leading-none">
                            -44%
                          </span>
                        </button>
                      </div>
                    )}

                    <ul className="flex flex-col gap-1.5">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                          <span className="text-xs text-white/55">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
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
                    <p className={`text-xs mt-0.5 ${selectedCadence === value ? "text-pink-300/70" : "text-white/55"}`}>
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
