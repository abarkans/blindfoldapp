"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check } from "lucide-react";
import { frequencySchema, type FrequencyFormData } from "@/lib/schemas/onboarding";
import Button from "@/components/ui/Button";
import { CADENCE_OPTIONS } from "@/components/ui/CadenceSelect";

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
        {CADENCE_OPTIONS.map(({ value, label, sublabel }) => (
          <button
            key={value}
            type="button"
            onClick={() => setValue("cadence", value, { shouldValidate: true })}
            className={[
              "flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200",
              selected === value
                ? "bg-gradient-to-r from-pink-500/20 to-rose-500/10 border-pink-500 text-white"
                : "bg-white/5 border-white/10 text-white/80 hover:border-white/30",
            ].join(" ")}
          >
            <div className="flex-1">
              <p className="font-semibold text-sm">{label}</p>
              <p className={`text-xs mt-0.5 ${selected === value ? "text-pink-300/70" : "text-white/35"}`}>{sublabel}</p>
            </div>
            {selected === value && (
              <Check className="w-4 h-4 text-pink-400 shrink-0" />
            )}
          </button>
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
