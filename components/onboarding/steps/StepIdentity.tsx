"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "lucide-react";
import { z } from "zod";
import Input from "@/components/ui/Input";

const nameOnlySchema = z.object({
  partner1: z
    .string()
    .min(1, "Your name is required")
    .max(50, "Name too long")
    .regex(/^[\p{L}\p{M}\s'\-.]+$/u, "Name contains invalid characters"),
});

type NameOnlyFormData = z.infer<typeof nameOnlySchema>;

interface StepIdentityProps {
  defaultValues?: { partner1?: string };
  onNext: (data: { partner1: string; partner2: string }) => void;
  continueTrigger: number;
  onCanContinueChange: (can: boolean) => void;
}

export default function StepIdentity({ defaultValues, onNext, continueTrigger, onCanContinueChange }: StepIdentityProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NameOnlyFormData>({
    resolver: zodResolver(nameOnlySchema),
    defaultValues: { partner1: defaultValues?.partner1 ?? "" },
  });

  const partner1 = watch("partner1");
  const mountTrigger = useRef(continueTrigger);

  useEffect(() => {
    onCanContinueChange(!!partner1?.trim());
  }, [partner1, onCanContinueChange]);

  useEffect(() => {
    if (continueTrigger > mountTrigger.current) {
      handleSubmit((data) => onNext({ partner1: data.partner1, partner2: "" }))();
    }
  }, [continueTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form onSubmit={handleSubmit((data) => onNext({ partner1: data.partner1, partner2: "" }))} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">What&apos;s your name?</h2>
        <p className="text-white/50 text-sm">We&apos;ll use it to personalise your date ideas.</p>
      </div>

      <Input
        label="Your name"
        placeholder="e.g. Alex"
        icon={<User className="w-4 h-4" />}
        error={errors.partner1?.message}
        {...register("partner1")}
      />
    </form>
  );
}
