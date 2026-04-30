"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Utensils, Music, TreePine, Palette, Dumbbell, Film,
  BookOpen, Coffee, Waves, Camera, Gamepad2, Heart,
  Sparkles, ArrowRight,
} from "lucide-react";
import { FREE_INTERESTS, type PlanId } from "@/lib/plans";

const INTERESTS = [
  { id: "food", label: "Food & Dining", icon: Utensils },
  { id: "music", label: "Live Music", icon: Music },
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
    onCanContinueChange(selected.length > 0);
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
    if (selected.length === 0) {
      setError("Pick at least one interest");
      return;
    }
    onNext({ interests: selected });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">What do you love?</h2>
        <p className="text-white/50 text-sm">
          {isFree
            ? "Your Starter plan includes these 3 categories — upgrade anytime."
            : "Pick what you love — we'll use it to find your perfect date."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {visibleInterests.map(({ id, label, icon: Icon }) => {
          const isSelected = selected.includes(id);
          return (
            <motion.button
              key={id}
              type="button"
              whileTap={{ scale: 0.93 }}
              onClick={() => toggle(id)}
              className={[
                "flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all duration-200",
                isSelected
                  ? "bg-gradient-to-br from-pink-500/30 to-rose-500/20 border-pink-500 text-white"
                  : "bg-white/5 border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200",
              ].join(" ")}
            >
              <Icon className={`w-5 h-5 ${isSelected ? "text-pink-400" : "text-slate-400"}`} />
              <span className="text-xs font-medium leading-tight">{label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Upgrade card — free plan only */}
      {isFree && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gradient-to-br from-pink-500/15 to-violet-500/10 border border-pink-500/40 rounded-2xl p-4 flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            </div>
            <p className="text-sm font-bold text-white">Unlock every date category</p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white text-xs font-bold shadow-lg shadow-pink-500/20 hover:from-pink-400 hover:to-violet-500 transition-all active:scale-[0.98]"
          >
            Switch to Plus
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
