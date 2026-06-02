"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Sparkles } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/plans";
import { CADENCE_OPTIONS } from "@/components/ui/CadenceSelect";
import { getCurrencySymbol, type UnitSystem } from "@/lib/units";

interface StepPlanProps {
  onNext: (data: { plan_type: PlanId; cadence: string }) => void;
  onSubscribeNow: (cadence: string, billingInterval: "monthly" | "yearly") => void;
  continueTrigger: number;
  backTrigger: number;
  onCanContinueChange: (can: boolean) => void;
  onContinueLabelChange: (label: string) => void;
  onSubstepChange: (substep: "plan" | "frequency") => void;
  planType?: PlanId;
  unitSystem?: UnitSystem;
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
  unitSystem = "metric",
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
    <div className="flex flex-col gap-6">
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
              <h2 className="text-2xl font-bold text-white">How much should we plan?</h2>
              <p className="text-white/50 text-sm">Start free, upgrade whenever. No card needed to begin.</p>
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
                    onClick={() => setSelectedPlan(plan.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedPlan(plan.id); }}
                    className={[
                      "relative flex flex-col gap-4 p-5 rounded-3xl border text-left transition-all duration-200 cursor-pointer shadow-[0_18px_60px_rgba(0,0,0,0.22)]",
                      isSelected
                        ? plan.highlighted
                          ? "bg-white/[0.075] border-rose-400/70"
                          : "bg-white/[0.075] border-white/45"
                        : plan.highlighted
                          ? "bg-[#050202] border-rose-400/40 hover:border-rose-300/65"
                          : "bg-white/[0.035] border-white/16 hover:border-white/28",
                    ].join(" ")}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-5">
                        <span className="inline-flex items-center gap-1 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg shadow-rose-500/20">
                          Most popular
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={[
                          "w-9 h-9 rounded-xl flex items-center justify-center",
                          plan.highlighted ? "bg-rose-500/15 border border-rose-400/20" : "bg-white/8 border border-white/12",
                        ].join(" ")}>
                          <Icon className={`w-4 h-4 ${plan.highlighted ? "text-rose-300" : "text-white/55"}`} />
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
                                <p className="font-black text-lg text-white">{getCurrencySymbol(unitSystem)}{plan.yearlyPrice}</p>
                                <p className="text-[10px] text-white/55 mt-0.5">per year</p>
                                <p className="text-[10px] text-emerald-400/80">~{getCurrencySymbol(unitSystem)}{((plan.yearlyPrice ?? 0) / 12).toFixed(2)}/mo</p>
                              </>
                            ) : (
                              <>
                                <p className="font-black text-lg text-white">{getCurrencySymbol(unitSystem)}{plan.introPrice}</p>
                                <p className="text-[10px] text-white/55 mt-0.5">first month</p>
                                <p className="text-[10px] text-rose-300/70">then {getCurrencySymbol(unitSystem)}{plan.price}/mo</p>
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
                            ? plan.highlighted ? "border-rose-400 bg-rose-500" : "border-white bg-white"
                            : "border-white/28",
                        ].join(" ")}>
                          {isSelected && <Check className={`w-3 h-3 ${plan.highlighted ? "text-white" : "text-[#0d0d14]"}`} />}
                        </div>
                      </div>
                    </div>

                    {/* Billing interval toggle — Plus card only */}
                    {plan.highlighted && (
                      <div
                        className="flex items-center gap-0.5 bg-white/[0.04] border border-white/16 rounded-xl p-0.5 self-start"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setBillingInterval("monthly")}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
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
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            billingInterval === "yearly"
                              ? "bg-white/15 text-white"
                              : "text-white/45 hover:text-white/70"
                          }`}
                        >
                          Yearly
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1 py-0.5 rounded-full leading-none">
                            -44%
                          </span>
                        </button>
                      </div>
                    )}

                    <ul className="flex flex-col gap-1.5">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/70" />
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
              <p className="text-xs text-white/45 font-semibold uppercase tracking-widest">Plus</p>
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
                      ? "bg-white/[0.075] border-rose-400/70 text-white"
                      : "bg-white/[0.035] border-white/16 text-white/80 hover:border-white/30",
                  ].join(" ")}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{label}</p>
                    <p className={`text-xs mt-0.5 ${selectedCadence === value ? "text-rose-300/70" : "text-white/55"}`}>
                      {sublabel}
                    </p>
                  </div>
                  {selectedCadence === value && <Check className="w-4 h-4 text-rose-300 shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
