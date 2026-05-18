"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, User, Info } from "lucide-react";
import { identitySchema, type IdentityFormData } from "@/lib/schemas/onboarding";
import Input from "@/components/ui/Input";

interface StepIdentityProps {
  defaultValues?: Partial<IdentityFormData>;
  onNext: (data: IdentityFormData) => void;
  continueTrigger: number;
  onCanContinueChange: (can: boolean) => void;
}

export default function StepIdentity({ defaultValues, onNext, continueTrigger, onCanContinueChange }: StepIdentityProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IdentityFormData>({
    resolver: zodResolver(identitySchema),
    defaultValues,
  });

  const partner1 = watch("partner1");
  const partner2 = watch("partner2");
  const mountTrigger = useRef(continueTrigger);

  // Report validity as fields change
  useEffect(() => {
    onCanContinueChange(!!(partner1?.trim() && partner2?.trim()));
  }, [partner1, partner2, onCanContinueChange]);

  // Trigger form submission when parent presses Continue
  useEffect(() => {
    if (continueTrigger > mountTrigger.current) {
      handleSubmit(onNext)();
    }
  }, [continueTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">Who are we planning for?</h2>
        <p className="text-white/50 text-sm">We&apos;ll use your names to make dates feel personal.</p>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="My name"
          placeholder="e.g. Alex"
          icon={<User className="w-4 h-4" />}
          error={errors.partner1?.message}
          {...register("partner1")}
        />
        <div className="flex flex-col gap-4 rounded-2xl border border-white/16 bg-white/[0.035] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
            <Mail className="h-4 w-4 text-white/60" />
            <span>Partner details</span>
          </div>
          <Input
            label="Partner name"
            placeholder="e.g. Jamie"
            icon={<User className="w-4 h-4" />}
            error={errors.partner2?.message}
            {...register("partner2")}
          />
          <Input
            label="Partner email (optional)"
            type="email"
            placeholder="jamie@example.com"
            icon={<Mail className="w-4 h-4" />}
            error={errors.partner_email?.message}
            {...register("partner_email")}
          />
          <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-white/50" />
            <p className="text-xs leading-relaxed text-white/60">
              Optional — invite your partner anytime from Settings. Dates unlock when they join.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
