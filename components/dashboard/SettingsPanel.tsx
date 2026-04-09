"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Save, User, Tag, Sliders, Calendar, LogOut, MapPin, Search, Navigation, AlertCircle, Utensils, Music, TreePine, Palette, Dumbbell, Film, BookOpen, Coffee, Waves, Camera, Gamepad2, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fullOnboardingSchema, type FullOnboardingData } from "@/lib/schemas/onboarding";
import type { Profile } from "@/lib/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Slider from "@/components/ui/Slider";
import CadenceSelect, { type CadenceValue } from "@/components/ui/CadenceSelect";

const INTERESTS = [
  { id: "food", label: "Food & Dining", icon: Utensils },
  { id: "music", label: "Live Music", icon: Music },
  { id: "nature", label: "Nature", icon: TreePine },
  { id: "art", label: "Art & Culture", icon: Palette },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "cinema", label: "Cinema", icon: Film },
  { id: "books", label: "Books", icon: BookOpen },
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "beach", label: "Beach & Water", icon: Waves },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "romance", label: "Romance", icon: Heart },
];

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const a = data.address ?? {};
    return a.city || a.town || a.village || a.county || data.display_name?.split(",")[0] || `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  } catch {
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }
}

interface SettingsPanelProps {
  profile: Profile;
}

export default function SettingsPanel({ profile }: SettingsPanelProps) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Location state — managed outside react-hook-form since it's async
  const [lat, setLat] = useState<number | null>(profile.last_lat ?? null);
  const [lng, setLng] = useState<number | null>(profile.last_long ?? null);
  const [locationLabel, setLocationLabel] = useState("");
  const [radiusKm, setRadiusKm] = useState((profile.preferred_radius ?? 10000) / 1000);
  const [locStatus, setLocStatus] = useState<"idle" | "requesting" | "granted" | "denied" | "search">("idle");
  const [cityInput, setCityInput] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve existing coords to a label on mount
  useEffect(() => {
    if (profile.last_lat && profile.last_long) {
      setLocStatus("granted");
      reverseGeocode(profile.last_lat, profile.last_long).then(setLocationLabel);
    }
  }, []);

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = cityInput.trim();
    if (trimmed.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=5&featuretype=city`,
          { headers: { "Accept-Language": "en" } }
        );
        setSuggestions(await res.json());
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 350);
  }, [cityInput]);

  function handleDetectLocation() {
    setLocStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        const label = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setLocationLabel(label);
        setLocStatus("granted");
      },
      () => setLocStatus("denied"),
      { timeout: 10000 }
    );
  }

  function selectSuggestion(result: NominatimResult) {
    const parsedLat = parseFloat(result.lat);
    const parsedLng = parseFloat(result.lon);
    setLat(parsedLat);
    setLng(parsedLng);
    setLocationLabel(result.display_name.split(",").slice(0, 2).join(",").trim());
    setCityInput("");
    setSuggestions([]);
    setLocStatus("granted");
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
    const current = interests ?? [];
    const next = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];
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
      last_lat: lat,
      last_long: lng,
      preferred_radius: radiusKm * 1000,
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

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
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
          {INTERESTS.map(({ id, label, icon: Icon }) => {
            const isSelected = interests?.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleInterest(id)}
                className={[
                  "flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all duration-200 active:scale-95",
                  isSelected
                    ? "bg-gradient-to-br from-pink-500/30 to-rose-500/20 border-pink-500 text-white"
                    : "bg-white/5 border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200",
                ].join(" ")}
              >
                <Icon className={`w-5 h-5 ${isSelected ? "text-pink-400" : "text-slate-400"}`} />
                <span className="text-xs font-medium leading-tight">{label}</span>
              </button>
            );
          })}
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

      {/* Location */}
      <Section icon={<MapPin className="w-4 h-4" />} title="Location">
        <div className="flex flex-col gap-4">

          {/* Current location row */}
          <AnimatePresence mode="wait">
            {locStatus === "granted" && lat !== null ? (
              <motion.div
                key="granted"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3"
              >
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-sm text-white/80 flex-1 truncate">{locationLabel}</p>
                <button
                  type="button"
                  onClick={() => { setLocStatus("search"); setLat(null); setLng(null); setLocationLabel(""); }}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors shrink-0"
                >
                  Change
                </button>
              </motion.div>
            ) : locStatus === "requesting" ? (
              <motion.div key="requesting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-4 py-3"
              >
                <motion.div className="w-4 h-4 rounded-full border-2 border-pink-500/30 border-t-pink-500"
                  animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-sm text-white/40">Detecting location…</p>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-2"
              >
                {locStatus === "denied" && (
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Location denied — search below
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/60 hover:border-white/25 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-pink-400" />
                    Detect
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocStatus("search")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/60 hover:border-white/25 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-pink-400" />
                    Search city
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* City search */}
          {locStatus === "search" && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                {suggestionsLoading && (
                  <motion.div
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white/60"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <input
                  type="text"
                  placeholder="Search city or town…"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="w-full pl-9 pr-9 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-pink-500/60 transition-colors"
                />
              </div>
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden"
                  >
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectSuggestion(s)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                      >
                        <MapPin className="w-3.5 h-3.5 text-white/30 shrink-0" />
                        <span className="text-sm text-white/70 truncate">
                          {s.display_name.split(",").slice(0, 3).join(",")}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Radius slider */}
          <Slider
            label="Search Radius"
            value={radiusKm}
            onChange={setRadiusKm}
            min={1}
            max={50}
            step={1}
            formatValue={(v) => `${v} km`}
          />
          <div className="flex justify-between text-[10px] text-white/25 px-1 -mt-2">
            <span>Walking distance</span>
            <span>Long drive / Countryside</span>
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
