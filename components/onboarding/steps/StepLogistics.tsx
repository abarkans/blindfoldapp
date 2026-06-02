"use client";

import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { House, MapPin, Check } from "lucide-react";
import { logisticsSchema, type LogisticsFormData } from "@/lib/schemas/onboarding";
import Slider from "@/components/ui/Slider";
import { getCurrencySymbol, type UnitSystem } from "@/lib/units";

interface StepLogisticsProps {
  defaultValues?: Partial<LogisticsFormData>;
  onNext: (data: LogisticsFormData) => void;
  continueTrigger: number;
  onCanContinueChange: (can: boolean) => void;
  unitSystem?: UnitSystem;
}

export default function StepLogistics({ defaultValues, onNext, continueTrigger, onCanContinueChange, unitSystem = "metric" }: StepLogisticsProps) {
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
        <h2 className="text-2xl font-bold text-white">How do you like to date?</h2>
        <p className="text-white/50 text-sm">We&apos;ll only plan dates that fit your budget and style.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Controller
          name="budget_max"
          control={control}
          render={({ field }) => (
            <Slider
              label="Budget per date"
              value={field.value}
              onChange={field.onChange}
              min={10}
              max={200}
              step={5}
              formatValue={(v) => `${getCurrencySymbol(unitSystem)}${v}`}
              tone="neutral"
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
                ? "bg-white/[0.075] border-rose-400/70 text-white"
                : "bg-white/[0.035] border-white/16 text-white/55 hover:border-white/30",
            ].join(" ")}
          >
            <MapPin className={`w-5 h-5 ${dateOutside ? "text-rose-300" : "text-white/45"}`} />
            <div className="text-left flex-1">
              <p className="text-sm font-semibold">A night out</p>
              <p className="text-xs opacity-60">Real venues near you</p>
            </div>
            {dateOutside && <Check className="w-4 h-4 text-rose-300 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => setValue("date_at_home", !dateAtHome, { shouldValidate: true })}
            className={[
              "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200",
              dateAtHome
                ? "bg-white/[0.075] border-rose-400/70 text-white"
                : "bg-white/[0.035] border-white/16 text-white/55 hover:border-white/30",
            ].join(" ")}
          >
            <House className={`w-5 h-5 ${dateAtHome ? "text-rose-300" : "text-white/45"}`} />
            <div className="text-left flex-1">
              <p className="text-sm font-semibold">A night in</p>
              <p className="text-xs opacity-60">Cook, play, make something</p>
            </div>
            {dateAtHome && <Check className="w-4 h-4 text-rose-300 shrink-0" />}
          </button>
        </div>
        {errors.date_outside && (
          <p className="text-xs text-red-400">{errors.date_outside.message}</p>
        )}
      </div>

    </div>
  );
}
