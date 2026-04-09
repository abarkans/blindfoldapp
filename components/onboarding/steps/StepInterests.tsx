"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Utensils, Music, TreePine, Palette, Dumbbell, Film,
  BookOpen, Coffee, Waves, Camera, Gamepad2, Heart, ArrowLeft,
} from "lucide-react";
import Button from "@/components/ui/Button";

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
  onNext: (data: { interests: string[] }) => void;
  onBack: () => void;
}

export default function StepInterests({ defaultValues = [], onNext, onBack }: StepInterestsProps) {
  const [selected, setSelected] = useState<string[]>(defaultValues);
  const [error, setError] = useState("");

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
        <p className="text-white/50 text-sm">Pick interests to help us craft perfect mystery dates.</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {INTERESTS.map(({ id, label, icon: Icon }) => {
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
