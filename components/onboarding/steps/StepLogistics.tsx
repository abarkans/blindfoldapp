"use client";

import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { House, MapPin } from "lucide-react";
import { logisticsSchema, type LogisticsFormData } from "@/lib/schemas/onboarding";
import Slider from "@/components/ui/Slider";

interface StepLogisticsProps {
  defaultValues?: Partial<LogisticsFormData>;
  onNext: (data: LogisticsFormData) => void;
  continueTrigger: number;
  onCanContinueChange: (can: boolean) => void;
}

export default function StepLogistics({ defaultValues, onNext, continueTrigger, onCanContinueChange }: StepLogisticsProps) {
  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LogisticsFormData>({
    resolver: zodResolver(logisticsSchema),
    defaultValues: {
      budget_max: defaultValues?.budget_max ?? 50,
      date_outside: defaultValues?.date_outside ?? false,
      date_at_home: defaultValues?.date_at_home ?? false,
    },
  });

  const dateOutside = watch("date_outside");
  const dateAtHome = watch("date_at_home");
  const mountTrigger = useRef(continueTrigger);

  useEffect(() => {
    onCanContinueChange(dateOutside || dateAtHome);
  }, [dateOutside, dateAtHome, onCanContinueChange]);

  useEffect(() => {
    if (continueTrigger <= mountTrigger.current) return;
    handleSubmit(onNext)();
  }, [continueTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">Make it work for you</h2>
        <p className="text-white/50 text-sm">Set your budget and where date night should happen.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Controller
          name="budget_max"
          control={control}
          render={({ field }) => (
            <Slider
              label="Max Budget per Date"
              value={field.value}
              onChange={field.onChange}
              min={10}
              max={200}
              step={5}
              formatValue={(v) => `€${v}`}
            />
          )}
        />
        {errors.budget_max && (
          <p className="text-xs text-red-400">{errors.budget_max.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-white/70">Date style</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setValue("date_outside", !dateOutside, { shouldValidate: true })}
            className={[
              "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200",
              dateOutside
                ? "bg-pink-500/20 border-pink-500 text-white"
                : "bg-white/5 border-white/10 text-white/50 hover:border-white/30",
            ].join(" ")}
          >
            <MapPin className={`w-5 h-5 ${dateOutside ? "text-pink-400" : ""}`} />
            <div className="text-left">
              <p className="text-sm font-semibold">Date night outside home</p>
              <p className="text-xs opacity-60">Use nearby places</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setValue("date_at_home", !dateAtHome, { shouldValidate: true })}
            className={[
              "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200",
              dateAtHome
                ? "bg-pink-500/20 border-pink-500 text-white"
                : "bg-white/5 border-white/10 text-white/50 hover:border-white/30",
            ].join(" ")}
          >
            <House className={`w-5 h-5 ${dateAtHome ? "text-pink-400" : ""}`} />
            <div className="text-left">
              <p className="text-sm font-semibold">Date night at home</p>
              <p className="text-xs opacity-60">Cook, play, make something</p>
            </div>
          </button>
        </div>
        {errors.date_outside && (
          <p className="text-xs text-red-400">{errors.date_outside.message}</p>
        )}
      </div>

    </div>
  );
}
