"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Save, User, Tag, Sliders, Calendar, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fullOnboardingSchema, type FullOnboardingData } from "@/lib/schemas/onboarding";
import type { Profile } from "@/lib/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Slider from "@/components/ui/Slider";
import CadenceSelect, { type CadenceValue } from "@/components/ui/CadenceSelect";

const INTERESTS_LIST = [
  "food", "music", "nature", "art", "fitness", "cinema",
  "books", "coffee", "beach", "photography", "gaming", "romance",
];

const INTEREST_LABELS: Record<string, string> = {
  food: "Food & Dining", music: "Live Music", nature: "Nature",
  art: "Art & Culture", fitness: "Fitness", cinema: "Cinema",
  books: "Books", coffee: "Coffee", beach: "Beach", photography: "Photography",
  gaming: "Gaming", romance: "Romance",
};


interface SettingsPanelProps {
  profile: Profile;
}

export default function SettingsPanel({ profile }: SettingsPanelProps) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FullOnboardingData>({
    resolver: zodResolver(fullOnboardingSchema),
    defaultValues: {
      partner1: profile.partner_names.partner1,
      partner2: profile.partner_names.partner2,
      interests: profile.interests,
      budget_max: profile.constraints.budget_max,
      has_car: profile.constraints.has_car,
      prefers_walking: profile.constraints.prefers_walking,
      cadence: profile.cadence as FullOnboardingData["cadence"],
    },
  });

  const interests = watch("interests");
  const hasCar = watch("has_car");
  const prefersWalking = watch("prefers_walking");
  const selectedCadence = watch("cadence");

  function toggleInterest(id: string) {
    const next = interests.includes(id)
      ? interests.filter((i) => i !== id)
      : [...interests, id];
    setValue("interests", next);
  }

  async function onSubmit(values: FullOnboardingData) {
    setSaving(true);
    setError("");
    setSaved(false);
    const supabase = createClient();

    const { error: updateError } = await supabase.from("profiles").update({
      partner_names: { partner1: values.partner1, partner2: values.partner2 },
      interests: values.interests,
      constraints: {
        budget_max: values.budget_max,
        has_car: values.has_car,
        prefers_walking: values.prefers_walking,
      },
      cadence: values.cadence,
    }).eq("id", profile.id);

    if (updateError) {
      setError("Failed to save. Please try again.");
    } else {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Partner Names */}
      <Section icon={<User className="w-4 h-4" />} title="Partners">
        <div className="flex flex-col gap-3">
          <Input label="Partner 1" error={errors.partner1?.message} {...register("partner1")} />
          <Input label="Partner 2" error={errors.partner2?.message} {...register("partner2")} />
        </div>
      </Section>

      {/* Interests */}
      <Section icon={<Tag className="w-4 h-4" />} title="Interests">
        <div className="grid grid-cols-3 gap-2">
          {INTERESTS_LIST.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => toggleInterest(id)}
              className={[
                "py-2 px-2 rounded-xl border text-xs font-medium transition-all",
                interests?.includes(id)
                  ? "bg-pink-500/20 border-pink-500 text-pink-300"
                  : "bg-white/5 border-white/10 text-white/50 hover:border-white/30",
              ].join(" ")}
            >
              {INTEREST_LABELS[id]}
            </button>
          ))}
        </div>
        {errors.interests && (
          <p className="text-xs text-red-400 mt-1">{errors.interests.message}</p>
        )}
      </Section>

      {/* Logistics */}
      <Section icon={<Sliders className="w-4 h-4" />} title="Logistics">
        <div className="flex flex-col gap-4">
          <Controller
            name="budget_max"
            control={control}
            render={({ field }) => (
              <Slider
                label="Max Budget"
                value={field.value}
                onChange={field.onChange}
                min={10}
                max={200}
                step={5}
                formatValue={(v) => `€${v}`}
              />
            )}
          />
          <div className="flex gap-3">
            {[
              { key: "has_car" as const, label: "Have a car", val: hasCar },
              { key: "prefers_walking" as const, label: "Love walking", val: prefersWalking },
            ].map(({ key, label, val }) => (
              <button
                key={key}
                type="button"
                onClick={() => setValue(key, !val)}
                className={[
                  "flex-1 py-3 px-4 rounded-2xl border text-sm font-medium transition-all",
                  val
                    ? "bg-pink-500/20 border-pink-500 text-pink-300"
                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/30",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Frequency */}
      <Section icon={<Calendar className="w-4 h-4" />} title="Frequency">
        <CadenceSelect
          value={selectedCadence as CadenceValue}
          onChange={(v) => setValue("cadence", v)}
        />
      </Section>

      <motion.div
        animate={saved ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Button type="submit" size="lg" className="w-full" loading={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </motion.div>

      <button
        type="button"
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all text-sm"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </form>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-pink-400">{icon}</span>
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}
