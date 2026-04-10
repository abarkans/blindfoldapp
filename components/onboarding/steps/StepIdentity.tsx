"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "lucide-react";
import { identitySchema, type IdentityFormData } from "@/lib/schemas/onboarding";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface StepIdentityProps {
  defaultValues?: Partial<IdentityFormData>;
  onNext: (data: IdentityFormData) => void;
}

export default function StepIdentity({ defaultValues, onNext }: StepIdentityProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IdentityFormData>({
    resolver: zodResolver(identitySchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">Who&apos;s on this adventure?</h2>
        <p className="text-white/50 text-sm">Enter both partners&apos; names so we can personalise your dates.</p>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="My name"
          placeholder="e.g. Alex"
          icon={<User className="w-4 h-4" />}
          error={errors.partner1?.message}
          {...register("partner1")}
        />
        <Input
          label="Partner name"
          placeholder="e.g. Jamie"
          icon={<User className="w-4 h-4" />}
          error={errors.partner2?.message}
          {...register("partner2")}
        />
      </div>

      <Button type="submit" size="lg" className="w-full mt-2">
        Continue
      </Button>
    </form>
  );
}
