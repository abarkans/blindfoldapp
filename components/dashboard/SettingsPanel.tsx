"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, User, Tag, Sliders, Calendar, LogOut, MapPin, Search, Navigation,
  AlertCircle, Utensils, Music, TreePine, Palette, Dumbbell, Film,
  BookOpen, Coffee, Waves, Camera, Gamepad2, Heart, ChevronRight, ArrowLeft,
  Sparkles, Lock, Check, Zap, Crown,
} from "lucide-react";
import { FREE_INTERESTS, type PlanId } from "@/lib/plans";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { fullOnboardingSchema, type FullOnboardingData } from "@/lib/schemas/onboarding";
import type { Profile } from "@/lib/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Slider from "@/components/ui/Slider";
import CadenceSelect, { type CadenceValue, CADENCE_OPTIONS } from "@/components/ui/CadenceSelect";

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

const INTEREST_LABEL: Record<string, string> = Object.fromEntries(
  INTERESTS.map(({ id, label }) => [id, label])
);

const CADENCE_LABEL: Record<string, string> = Object.fromEntries(
  CADENCE_OPTIONS.map(({ value, label }) => [value, label])
);

// Zod schemas to validate Nominatim API responses before trusting coordinates
// or display names. Prevents malformed/injected data reaching the DB or UI.
const nominatimSearchSchema = z.array(
  z.object({
    lat: z.string().regex(/^-?\d{1,3}\.\d+$/),
    lon: z.string().regex(/^-?\d{1,3}\.\d+$/),
    display_name: z.string().max(500),
  })
);

const nominatimReverseSchema = z.object({
  display_name: z.string().max(500).optional(),
  address: z
    .object({
      city: z.string().max(100).optional(),
      town: z.string().max(100).optional(),
      village: z.string().max(100).optional(),
      county: z.string().max(100).optional(),
    })
    .optional(),
});

type NominatimResult = z.infer<typeof nominatimSearchSchema>[number];

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const raw = await res.json();
    const data = nominatimReverseSchema.parse(raw);
    const a = data.address ?? {};
    return a.city || a.town || a.village || a.county || data.display_name?.split(",")[0] || `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  } catch {
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }
}

type SettingsView = "list" | "partners" | "interests" | "logistics" | "location" | "frequency" | "plan";

interface SettingsPanelProps {
  profile: Profile;
}

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: -dir * 40 }),
};

const noAnimation = {
  enter: { opacity: 1, x: 0 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 0 },
};

export default function SettingsPanel({ profile }: SettingsPanelProps) {
  const [view, setView] = useState<SettingsView>("list");
  const [direction, setDirection] = useState(1);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearingLocation, setClearingLocation] = useState(false);
  const [error, setError] = useState("");
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const [planType, setPlanType] = useState<PlanId>(() => {
    try {
      const stored = localStorage.getItem("user-plan");
      if (stored) return (JSON.parse(stored) as { planType: PlanId }).planType ?? "free";
    } catch {}
    return "free";
  });
  const router = useRouter();

  // Lock background scroll while sign-out confirm is open
  useEffect(() => {
    if (!signOutConfirm) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [signOutConfirm]);

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

  useEffect(() => {
    if (profile.last_lat && profile.last_long) {
      setLocStatus("granted");
      reverseGeocode(profile.last_lat, profile.last_long).then(setLocationLabel);
    }
  }, []);

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
        const raw = await res.json();
        // Validate response shape before trusting lat/lon values
        const parsed = nominatimSearchSchema.safeParse(raw);
        setSuggestions(parsed.success ? parsed.data : []);
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

  // L7: Give users explicit control over their stored location (GDPR data minimisation)
  async function clearLocation() {
    setClearingLocation(true);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ last_lat: null, last_long: null })
      .eq("id", profile.id);
    if (updateError) {
      setError("Failed to clear location. Please try again.");
    } else {
      setLat(null);
      setLng(null);
      setLocationLabel("");
      setLocStatus("idle");
      router.refresh();
    }
    setClearingLocation(false);
  }

  function selectSuggestion(result: NominatimResult) {
    // Nominatim is already validated via nominatimSearchSchema, but parse
    // once more here to be explicit about safe numeric conversion.
    const parsedLat = parseFloat(result.lat);
    const parsedLng = parseFloat(result.lon);
    if (!isFinite(parsedLat) || !isFinite(parsedLng)) return;
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

  const partner1 = watch("partner1");
  const partner2 = watch("partner2");
  const interests = watch("interests");
  const budgetMax = watch("budget_max");
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

  function handleUpgradePlan() {
    // TODO: Integrate Stripe Checkout
    const newPlan = { planType: "subscription" as PlanId, dateFrequency: "monthly" };
    localStorage.setItem("user-plan", JSON.stringify(newPlan));
    setPlanType("subscription");
  }

  // Summary strings shown on the list view
  const interestsSummary = interests?.length > 0
    ? interests.slice(0, 2).map((id) => INTEREST_LABEL[id] ?? id).join(", ") +
      (interests.length > 2 ? ` +${interests.length - 2}` : "")
    : "None selected";

  const logisticsSummary = [
    `€${budgetMax}`,
    hasCar && "Has car",
    prefersWalking && "Loves walking",
  ].filter(Boolean).join(" · ");

  const SETTINGS_ROWS: { id: SettingsView; label: string; icon: React.ElementType; summary: string }[] = [
    { id: "partners", label: "Partners", icon: User, summary: `${partner1} & ${partner2}` },
    { id: "interests", label: "Interests", icon: Tag, summary: interestsSummary },
    { id: "logistics", label: "Logistics", icon: Sliders, summary: logisticsSummary },
    { id: "location", label: "Location", icon: MapPin, summary: locationLabel || "Not set" },
    ...(planType === "subscription"
      ? [{ id: "frequency" as SettingsView, label: "Date frequency", icon: Calendar, summary: CADENCE_LABEL[selectedCadence] ?? selectedCadence }]
      : []),
    { id: "plan", label: "Plan", icon: Sparkles, summary: planType === "subscription" ? "Subscription · €9.99/mo" : "Free · Upgrade available" },
  ];

  function navigate(to: SettingsView) {
    setDirection(to === "list" ? -1 : 1);
    setView(to);
  }

  const currentRow = SETTINGS_ROWS.find((r) => r.id === view);

  return (
    <div className="overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        {view === "list" ? (
          <motion.div
            key="list"
            custom={direction}
            variants={noAnimation}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeInOut" }}
          >
            <div className="flex flex-col gap-2">
              {SETTINGS_ROWS.map(({ id, label, icon: Icon, summary }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(id)}
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/8 rounded-2xl hover:border-white/20 transition-colors active:scale-[0.98]"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-pink-400" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-white/35 mt-0.5 truncate">{summary}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSignOutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all text-sm mt-6"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>

            {/* Sign-out confirmation modal */}
            <AnimatePresence>
              {signOutConfirm && (
                <>
                  <motion.div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSignOutConfirm(false)}
                  />
                  <motion.div
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-xs px-4"
                    initial={{ opacity: 0, scale: 0.88, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  >
                    <div className="bg-[#13131f] border border-white/10 rounded-3xl p-6 text-center shadow-2xl shadow-black/60">
                      <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <LogOut className="w-5 h-5 text-red-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">Sign out?</h3>
                      <p className="text-sm text-white/40 mb-6">You can always sign back in to continue your mystery dates.</p>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full py-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/25 transition-colors"
                        >
                          Yes, sign out
                        </button>
                        <button
                          type="button"
                          onClick={() => setSignOutConfirm(false)}
                          className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-semibold text-sm hover:border-white/20 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key={view}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeInOut" }}
          >
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => navigate("list")}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-white/25 transition-colors shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 text-white/60" />
                </button>
                <h3 className="text-base font-semibold text-white">{currentRow?.label}</h3>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-sm text-red-400 mb-5">
                  {error}
                </div>
              )}

              {/* Section: Partners */}
              {view === "partners" && (
                <div className="flex flex-col gap-3">
                  <Input label="Partner 1" error={errors.partner1?.message} {...register("partner1")} />
                  <Input label="Partner 2" error={errors.partner2?.message} {...register("partner2")} />
                </div>
              )}

              {/* Section: Interests */}
              {view === "interests" && (
                <>
                  {planType === "free" && (
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-3 py-2.5 mb-3">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <p className="text-xs text-amber-300/80">
                        Free plan includes Food, Nature & Romance. <button type="button" onClick={() => navigate("plan")} className="underline underline-offset-2 hover:text-amber-200 transition-colors">Upgrade</button> for all 12.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {(planType === "free"
                      ? INTERESTS.filter(({ id }) => (FREE_INTERESTS as readonly string[]).includes(id))
                      : INTERESTS
                    ).map(({ id, label, icon: Icon }) => {
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
                              : "bg-white/5 border-white/10 text-white/70 hover:border-white/30 hover:text-white",
                          ].join(" ")}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? "text-pink-400" : "text-white/70"}`} />
                          <span className="text-xs font-medium leading-tight">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.interests && (
                    <p className="text-xs text-red-400 mt-2">{errors.interests.message}</p>
                  )}
                </>
              )}

              {/* Section: Logistics */}
              {view === "logistics" && (
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
              )}

              {/* Section: Location */}
              {view === "location" && (
                <div className="flex flex-col gap-4">
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
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => { setLocStatus("search"); setLat(null); setLng(null); setLocationLabel(""); }}
                            className="text-xs text-white/30 hover:text-white/60 transition-colors"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={clearLocation}
                            disabled={clearingLocation}
                            className="text-xs text-red-400/50 hover:text-red-400 transition-colors disabled:opacity-40"
                          >
                            {clearingLocation ? "Clearing…" : "Remove"}
                          </button>
                        </div>
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
                          style={{ fontSize: "16px" }}
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
              )}

              {/* Section: Frequency */}
              {view === "frequency" && (
                <CadenceSelect
                  value={selectedCadence as CadenceValue}
                  onChange={(v) => setValue("cadence", v)}
                />
              )}

              {/* Section: Plan */}
              {view === "plan" && (
                <div className="flex flex-col gap-3">
                  {/* Current plan badge */}
                  <div className={[
                    "flex items-center gap-3 rounded-2xl border p-4",
                    planType === "subscription"
                      ? "bg-gradient-to-br from-pink-500/15 to-violet-500/10 border-pink-500/40"
                      : "bg-white/5 border-white/10",
                  ].join(" ")}>
                    <div className={[
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      planType === "subscription" ? "bg-pink-500/20" : "bg-white/8",
                    ].join(" ")}>
                      {planType === "subscription"
                        ? <Crown className="w-4 h-4 text-pink-400" />
                        : <Lock className="w-4 h-4 text-white/40" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {planType === "subscription" ? "Subscription" : "Free"}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {planType === "subscription"
                          ? "€9.99/month · Cancel anytime"
                          : "1 date/month · Limited categories"}
                      </p>
                    </div>
                    {planType === "subscription" && (
                      <span className="ml-auto text-[10px] font-bold text-pink-400 bg-pink-500/15 border border-pink-500/30 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Upgrade card — free users only */}
                  {planType === "free" && (
                    <div className="bg-gradient-to-br from-pink-500/15 to-violet-500/10 border border-pink-500/40 rounded-2xl p-5 flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                        <p className="text-sm font-bold text-white">Unlock Subscription</p>
                        <span className="ml-auto text-base font-black text-white">€9.99<span className="text-xs font-normal text-white/40">/mo</span></span>
                      </div>
                      <ul className="flex flex-col gap-2">
                        {[
                          { text: "Weekly, Bi-weekly, or Monthly dates", key: true },
                          { text: "All 12 interest categories", key: true },
                          { text: "Full customization", key: true },
                          { text: "Enhanced AI personalization", key: false },
                        ].map(({ text, key }) => (
                          <li key={text} className="flex items-start gap-2">
                            <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${key ? "text-pink-400" : "text-emerald-400/70"}`} />
                            <span className={`text-xs ${key ? "text-white font-semibold" : "text-white/55"}`}>{text}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={handleUpgradePlan}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white text-sm font-bold shadow-lg shadow-pink-500/25 hover:from-pink-400 hover:to-violet-500 transition-all active:scale-[0.98]"
                      >
                        <Zap className="w-4 h-4 text-rose-200" />
                        Subscribe · €9.99/mo
                      </button>
                    </div>
                  )}

                  {/* Subscription active info */}
                  {planType === "subscription" && (
                    <p className="text-xs text-white/30 text-center px-2">
                      To manage or cancel your subscription, visit your account billing settings.
                    </p>
                  )}
                </div>
              )}

              {view !== "plan" && (
                <motion.div
                  animate={saved ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="mt-6"
                >
                  <Button type="submit" size="lg" className="w-full" loading={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saved ? "Saved!" : "Save Changes"}
                  </Button>
                </motion.div>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
