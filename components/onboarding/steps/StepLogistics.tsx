"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Car, Footprints } from "lucide-react";
import { logisticsSchema, type LogisticsFormData } from "@/lib/schemas/onboarding";
import Slider from "@/components/ui/Slider";
import Button from "@/components/ui/Button";

interface StepLogisticsProps {
  defaultValues?: Partial<LogisticsFormData>;
  onNext: (data: LogisticsFormData) => void;
  onBack: () => void;
}

export default function StepLogistics({ defaultValues, onNext, onBack }: StepLogisticsProps) {
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
      has_car: defaultValues?.has_car ?? false,
      prefers_walking: defaultValues?.prefers_walking ?? false,
    },
  });

  const hasCar = watch("has_car");
  const prefersWalking = watch("prefers_walking");

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">Let&apos;s set the scene</h2>
        <p className="text-white/50 text-sm">Help us tailor dates to your budget and how you get around.</p>
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
        <p className="text-sm font-medium text-white/70">Transport</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setValue("has_car", !hasCar)}
            className={[
              "flex-1 flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200",
              hasCar
                ? "bg-pink-500/20 border-pink-500 text-white"
                : "bg-white/5 border-white/10 text-white/50 hover:border-white/30",
            ].join(" ")}
          >
            <Car className={`w-5 h-5 ${hasCar ? "text-pink-400" : ""}`} />
            <div className="text-left">
              <p className="text-sm font-semibold">Have a car</p>
              <p className="text-xs opacity-60">We can include drives</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setValue("prefers_walking", !prefersWalking)}
            className={[
              "flex-1 flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200",
              prefersWalking
                ? "bg-pink-500/20 border-pink-500 text-white"
                : "bg-white/5 border-white/10 text-white/50 hover:border-white/30",
            ].join(" ")}
          >
            <Footprints className={`w-5 h-5 ${prefersWalking ? "text-pink-400" : ""}`} />
            <div className="text-left">
              <p className="text-sm font-semibold">Love walking</p>
              <p className="text-xs opacity-60">Walkable dates preferred</p>
            </div>
          </button>
        </div>
      </div>

      <div className="flex gap-3 mt-2">
        <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" size="lg" className="flex-1">
          Continue
        </Button>
      </div>
    </form>
  );
}
