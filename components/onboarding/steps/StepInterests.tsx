"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Utensils, Martini, TreePine, Palette, Dumbbell, Film,
  BookOpen, Coffee, Waves, Camera, Gamepad2, Heart,
  ArrowRight,
} from "lucide-react";
import { FREE_INTERESTS, MIN_INTEREST_CATEGORIES, type PlanId } from "@/lib/plans";

const INTERESTS = [
  { id: "food", label: "Food & Dining", icon: Utensils },
  { id: "music", label: "Drinks & Nightlife", icon: Martini },
  { id: "nature", label: "Nature", icon: TreePine },
  { id: "art", label: "Art & Culture", icon: Palette },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "cinema", label: "Cinema", icon: Film },
  { id: "books", label: "Books & Learning", icon: BookOpen },
  { id: "coffee", label: "Coffee & Cafés", icon: Coffee },
  { id: "beach", label: "Beach & Water", icon: Waves },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "romance", label: "Romance", icon: Heart },
];

interface StepInterestsProps {
  defaultValues?: string[];
  planType?: PlanId;
  onNext: (data: { interests: string[] }) => void;
  onBack: () => void;
  continueTrigger: number;
  onCanContinueChange: (can: boolean) => void;
}

export default function StepInterests({ defaultValues = [], planType = "free", onNext, onBack, continueTrigger, onCanContinueChange }: StepInterestsProps) {
  const [selected, setSelected] = useState<string[]>(defaultValues);
  const [error, setError] = useState("");
  const mountTrigger = useRef(continueTrigger);

  useEffect(() => {
    onCanContinueChange(selected.length >= MIN_INTEREST_CATEGORIES);
  }, [selected, onCanContinueChange]);

  useEffect(() => {
    if (continueTrigger <= mountTrigger.current) return;
    handleSubmit();
  }, [continueTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const isFree = planType === "free";
  const visibleInterests = isFree
    ? INTERESTS.filter(({ id }) => (FREE_INTERESTS as readonly string[]).includes(id))
    : INTERESTS;

  function toggle(id: string) {
    setError("");
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    if (selected.length < MIN_INTEREST_CATEGORIES) {
      setError(`Pick at least ${MIN_INTEREST_CATEGORIES} categories`);
      return;
    }
    onNext({ interests: selected });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">What kind of dates do you enjoy?</h2>
        <p className="text-white/50 text-sm">
          {isFree
            ? `Pick at least ${MIN_INTEREST_CATEGORIES} — these are your Starter categories.`
            : `Pick at least ${MIN_INTEREST_CATEGORIES} categories so we can keep your dates varied.`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {visibleInterests.map(({ id, label, icon: Icon }) => {
          const isSelected = selected.includes(id);
          return (
            <motion.button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={[
                "flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all duration-200",
                isSelected
                  ? "bg-white/[0.075] border-rose-400/70 text-white"
                  : "bg-white/[0.035] border-white/16 text-white/48 hover:border-white/30 hover:text-white/75",
              ].join(" ")}
            >
              <Icon className={`w-5 h-5 ${isSelected ? "text-rose-300" : "text-white/45"}`} />
              <span className="text-xs font-medium leading-tight">{label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Upgrade card — free plan only */}
      {isFree && (
        <motion.button
          type="button"
          onClick={onBack}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="group border border-white/10 hover:border-white/20 hover:bg-white/[0.03] rounded-2xl p-4 flex items-center justify-between gap-3 w-full transition-colors active:scale-[0.99]"
        >
          <p className="text-xs text-white/50">Plus unlocks every category</p>
          <span className="flex items-center gap-1 text-xs font-semibold text-white/60 group-hover:text-white transition-colors shrink-0">
            Explore Plus
            <ArrowRight className="w-3 h-3" />
          </span>
        </motion.button>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
