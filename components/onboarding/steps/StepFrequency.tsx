"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { frequencySchema, type FrequencyFormData } from "@/lib/schemas/onboarding";
import Button from "@/components/ui/Button";
import CadenceSelect, { type CadenceValue } from "@/components/ui/CadenceSelect";

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

      <CadenceSelect
        value={selected as CadenceValue}
        onChange={(v) => setValue("cadence", v, { shouldValidate: true })}
      />

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
