"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Utensils, Music, TreePine, Palette, Dumbbell, Film,
  BookOpen, Coffee, Waves, Camera, Gamepad2, Heart, ArrowLeft, Lock,
} from "lucide-react";
import Button from "@/components/ui/Button";
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
}

export default function StepInterests({ defaultValues = [], planType = "free", onNext, onBack }: StepInterestsProps) {
  const [selected, setSelected] = useState<string[]>(defaultValues);
  const [error, setError] = useState("");

  const isFree = planType === "free";

  function isLocked(id: string): boolean {
    return isFree && !(FREE_INTERESTS as readonly string[]).includes(id);
  }

  function toggle(id: string) {
    if (isLocked(id)) return;
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
            ? "Free plan includes Food, Nature & Romance. Upgrade for all 12 categories."
            : "Pick interests to help us craft perfect mystery dates."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {INTERESTS.map(({ id, label, icon: Icon }) => {
          const isSelected = selected.includes(id);
          const locked = isLocked(id);
          return (
            <motion.button
              key={id}
              type="button"
              whileTap={locked ? {} : { scale: 0.93 }}
              onClick={() => toggle(id)}
              className={[
                "relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all duration-200",
                locked
                  ? "bg-white/[0.02] border-white/5 cursor-not-allowed opacity-40"
                  : isSelected
                    ? "bg-gradient-to-br from-pink-500/30 to-rose-500/20 border-pink-500 text-white"
                    : "bg-white/5 border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200",
              ].join(" ")}
              disabled={locked}
              aria-label={locked ? `${label} — subscription only` : label}
            >
              {locked && (
                <Lock className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-white/20" />
              )}
              <Icon className={`w-5 h-5 ${locked ? "text-white/20" : isSelected ? "text-pink-400" : "text-slate-400"}`} />
              <span className="text-xs font-medium leading-tight">{label}</span>
            </motion.button>
          );
        })}
      </div>

      {isFree && (
        <p className="text-[11px] text-white/25 text-center -mt-2">
          🔒 9 categories unlocked with Subscription
        </p>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-3 mt-2">
        <Button type="button" variant="secondary" size="lg" className="w-14 shrink-0 px-0" onClick={onBack} aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button type="button" size="lg" className="flex-1" onClick={handleSubmit}>
          Continue ({selected.length})
        </Button>
      </div>
    </div>
  );
}
