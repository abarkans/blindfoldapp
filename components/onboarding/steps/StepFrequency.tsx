"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Calendar, CalendarDays, CalendarRange, Sparkles, ArrowLeft } from "lucide-react";
import { frequencySchema, type FrequencyFormData } from "@/lib/schemas/onboarding";
import Button from "@/components/ui/Button";

const OPTIONS = [
  {
    value: "weekly",
    label: "Weekly",
    sublabel: "Every week, a new surprise",
    icon: Calendar,
  },
  {
    value: "biweekly",
    label: "Bi-weekly",
    sublabel: "Every two weeks",
    icon: CalendarDays,
  },
  {
    value: "monthly",
    label: "Monthly",
    sublabel: "One special date a month",
    icon: CalendarRange,
  },
  {
    value: "spontaneous",
    label: "Spontaneous",
    sublabel: "Surprise me anytime!",
    icon: Sparkles,
  },
] as const;

interface StepFrequencyProps {
  defaultValues?: Partial<FrequencyFormData>;
  onNext: (data: FrequencyFormData) => void;
  onBack: () => void;
  loading?: boolean;
}

export default function StepFrequency({ defaultValues, onNext, onBack, loading }: StepFrequencyProps) {
  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FrequencyFormData>({
    resolver: zodResolver(frequencySchema),
    defaultValues,
  });

  const selected = watch("cadence");

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">How often?</h2>
        <p className="text-white/50 text-sm">How frequently should we reveal a new mystery date?</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {OPTIONS.map(({ value, label, sublabel, icon: Icon }) => (
          <motion.button
            key={value}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setValue("cadence", value)}
            className={[
              "flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200",
              selected === value
                ? "bg-gradient-to-r from-pink-500/20 to-rose-500/10 border-pink-500 text-white"
                : "bg-white/5 border-white/10 text-white/50 hover:border-white/30 hover:text-white/80",
            ].join(" ")}
          >
            <div className={`p-2 rounded-xl ${selected === value ? "bg-pink-500/30" : "bg-white/10"}`}>
              <Icon className={`w-5 h-5 ${selected === value ? "text-pink-300" : ""}`} />
            </div>
            <div>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs opacity-60">{sublabel}</p>
            </div>
            {selected === value && (
              <div className="ml-auto w-2 h-2 rounded-full bg-pink-400" />
            )}
          </motion.button>
        ))}
      </div>

      {errors.cadence && (
        <p className="text-xs text-red-400">{errors.cadence.message}</p>
      )}

      <div className="flex gap-3 mt-2">
        <Button type="button" variant="secondary" size="lg" className="w-14 shrink-0 px-0" onClick={onBack} aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button type="submit" size="lg" className="flex-1" loading={loading}>
          Finish Setup
        </Button>
      </div>
    </form>
  );
}
