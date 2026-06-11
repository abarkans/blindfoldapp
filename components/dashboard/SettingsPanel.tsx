"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Tag, Sliders, Calendar, LogOut, MapPin, Search, Navigation,
  AlertCircle, Utensils, Martini, TreePine, Palette, Dumbbell, Film,
  BookOpen, Coffee, Waves, Camera, Gamepad2, Heart, ChevronRight,
  Sparkles, Lock, Check, CheckCircle, Crown, UserCog, Trash2, Mail, House,
} from "lucide-react";
import { FREE_INTERESTS, PLANS, FREE_MAX_RADIUS_KM, MIN_INTEREST_CATEGORIES, PAID_MAX_RADIUS_KM, type PlanId } from "@/lib/plans";
import { formatRadius, getCurrencySymbol, type UnitSystem } from "@/lib/units";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { fullOnboardingSchema, type FullOnboardingData } from "@/lib/schemas/onboarding";
import type { Profile } from "@/lib/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Slider from "@/components/ui/Slider";
import CadenceSelect, { type CadenceValue, CADENCE_OPTIONS } from "@/components/ui/CadenceSelect";
import Toggle from "@/components/ui/Toggle";
import { requestAccountDeletion } from "@/app/actions/delete-account";
import { sendPartnerInvite } from "@/app/actions/partner-invite";
import { clearSettingsLocation, updateSettings } from "@/app/actions/update-settings";
import { updateEmailNotifications } from "@/app/actions/update-email-notifications";
import type { CoupleRole, PartnerInviteStatus } from "@/lib/partner-invites";

const INTERESTS = [
  { id: "food", label: "Food & Dining", icon: Utensils },
  { id: "music", label: "Drinks & Nightlife", icon: Martini },
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

const CITY_LEVEL_TYPES = new Set([
  "city",
  "town",
  "village",
  "hamlet",
  "suburb",
  "neighbourhood",
  "municipality",
  "borough",
  "quarter",
]);

const nominatimSearchSchema = z.array(
  z.object({
    lat: z.string().regex(/^-?\d{1,3}\.\d+$/),
    lon: z.string().regex(/^-?\d{1,3}\.\d+$/),
    display_name: z.string().max(500),
    addresstype: z.string().optional(),
    type: z.string().optional(),
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

type SettingsView = "list" | "account" | "partners" | "interests" | "logistics" | "location" | "frequency" | "plan";

const VIEW_LABELS: Record<string, string> = {
  account: "Manage account",
  partners: "Partners",
  interests: "Interests",
  logistics: "Logistics",
  location: "Location",
  frequency: "Date frequency",
  plan: "Plan",
};

interface SettingsPanelProps {
  profile: Profile;
  onHeaderChange?: (title: string | null, onBack: (() => void) | null, direction?: number) => void;
  unitSystem?: UnitSystem;
  memberRole: CoupleRole;
  partnerInviteStatus: PartnerInviteStatus;
  initialView?: SettingsView;
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

function settingsLocationChanged(
  current: { lat: number | null; lng: number | null; radiusKm: number },
  saved: { lat: number | null; lng: number | null; radiusKm: number }
) {
  return current.lat !== saved.lat || current.lng !== saved.lng || current.radiusKm !== saved.radiusKm;
}

export default function SettingsPanel({
  profile,
  onHeaderChange,
  unitSystem = "metric",
  memberRole,
  partnerInviteStatus,
  initialView,
}: SettingsPanelProps) {
  const [view, setView] = useState<SettingsView>(initialView ?? "list");
  const [direction, setDirection] = useState(1);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearingLocation, setClearingLocation] = useState(false);
  const [error, setError] = useState("");
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [planType, setPlanType] = useState<PlanId>(
    (profile.plan_type as PlanId) ?? "free"
  );
  const isPlus = planType === "subscription";
  const isTrial = planType === "trial";
  const isStarter = !isPlus && !isTrial;
  const [partnerInviteEmail, setPartnerInviteEmail] = useState(partnerInviteStatus.invitedEmail ?? "");
  const [partnerInviteSending, setPartnerInviteSending] = useState(false);
  const [partnerInviteMessage, setPartnerInviteMessage] = useState("");
  const [partnerInviteCooldown, setPartnerInviteCooldown] = useState(0);
  const inviteCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [inCapacitor, setInCapacitor] = useState(false);
  useEffect(() => { if ((window as any).Capacitor) setInCapacitor(true) }, []);

  // Manage account state
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSent, setDeleteSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(profile.email_notifications ?? true);
  const [togglingEmailNotifications, setTogglingEmailNotifications] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  const router = useRouter();

  useEffect(() => {
    if (!signOutConfirm && !deleteConfirm) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [signOutConfirm, deleteConfirm]);

  const maxRadiusKm = (isPlus || isTrial) ? PAID_MAX_RADIUS_KM : FREE_MAX_RADIUS_KM;
  const initialLat = profile.last_lat ?? null;
  const initialLng = profile.last_long ?? null;
  const initialRadiusKm = Math.min((profile.preferred_radius ?? 10000) / 1000, maxRadiusKm);
  const [savedLocationSettings, setSavedLocationSettings] = useState({
    lat: initialLat,
    lng: initialLng,
    radiusKm: initialRadiusKm,
  });
  const [lat, setLat] = useState<number | null>(initialLat);
  const [lng, setLng] = useState<number | null>(initialLng);
  const [locationLabel, setLocationLabel] = useState("");
  const [radiusKm, setRadiusKm] = useState(initialRadiusKm);
  const [locStatus, setLocStatus] = useState<"idle" | "requesting" | "granted" | "denied" | "search">("idle");
  const [cityInput, setCityInput] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewRef = useRef<SettingsView>(view);
  const onHeaderChangeRef = useRef(onHeaderChange);
  const initialViewRef = useRef(initialView);
  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { onHeaderChangeRef.current = onHeaderChange; }, [onHeaderChange]);
  useEffect(() => {
    if (!initialViewRef.current || initialViewRef.current === "list") return;
    window.history.pushState({ settingsView: initialViewRef.current }, "");
    onHeaderChangeRef.current?.(
      VIEW_LABELS[initialViewRef.current] ?? initialViewRef.current,
      () => window.history.back(),
      1
    );
  }, []);
  useEffect(() => {
    function onPop() {
      if (viewRef.current !== "list") {
        setDirection(-1);
        setView("list");
        onHeaderChangeRef.current?.(null, null, -1);
      }
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

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
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=10&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const raw = await res.json();
        const parsed = nominatimSearchSchema.safeParse(raw);
        if (!parsed.success) { setSuggestions([]); return; }
        const filtered = parsed.data.filter((r) => CITY_LEVEL_TYPES.has(r.addresstype ?? r.type ?? ""));
        setSuggestions((filtered.length > 0 ? filtered : parsed.data).slice(0, 5));
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

  async function clearLocation() {
    setClearingLocation(true);
    setError("");
    const result = await clearSettingsLocation();
    if (result.error) {
      setError(result.error);
    } else {
      setLat(null);
      setLng(null);
      setSavedLocationSettings((current) => ({ ...current, lat: null, lng: null }));
      setLocationLabel("");
      setLocStatus("idle");
      router.refresh();
    }
    setClearingLocation(false);
  }

  function selectSuggestion(result: NominatimResult) {
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
    formState: { errors, isDirty },
    reset,
  } = useForm<FullOnboardingData>({
    resolver: zodResolver(fullOnboardingSchema),
    defaultValues: {
      partner1: memberRole === "partner" ? profile.partner_names.partner2 : profile.partner_names.partner1,
      partner2: memberRole === "partner" ? profile.partner_names.partner1 : profile.partner_names.partner2,
      interests: profile.interests,
      budget_max: profile.constraints.budget_max,
      date_outside: profile.constraints.date_outside ?? true,
      date_at_home: profile.constraints.date_at_home ?? false,
      cadence: profile.cadence as FullOnboardingData["cadence"],
      partner_email: "",
    },
  });

  const partner1 = watch("partner1");
  const partner2 = watch("partner2");
  const interests = watch("interests");
  const budgetMax = watch("budget_max");
  const dateOutside = watch("date_outside");
  const dateAtHome = watch("date_at_home");
  const selectedCadence = watch("cadence");

  function toggleInterest(id: string) {
    const current = interests ?? [];
    const next = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];
    setValue("interests", next, { shouldValidate: true, shouldDirty: true });
  }

  async function onSubmit(values: FullOnboardingData) {
    setSaving(true);
    setError("");
    setSaved(false);
    const result = await updateSettings({
      ...values,
      partner1: memberRole === "partner" ? values.partner2 : values.partner1,
      partner2: memberRole === "partner" ? values.partner1 : values.partner2,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
      preferred_radius: radiusKm * 1000,
    });

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setSaved(true);
    reset(values);
    setSavedLocationSettings({ lat, lng, radiusKm });
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    if ((window as any).Capacitor) {
      window.location.replace('https://blindfolddate.com/app-intro');
      return;
    }
    router.push("/");
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setError("");
    try {
      await requestAccountDeletion();
      setDeleting(false);
      setDeleteSent(true);
    } catch (err) {
      setDeleting(false);
      setDeleteConfirm(false);
      const msg = err instanceof Error ? err.message : "Failed to send confirmation email. Please try again.";
      setError(msg);
      navigate("account");
    }
  }

  async function handleToggleEmailNotifications() {
    setTogglingEmailNotifications(true);
    const next = !emailNotifications;
    const result = await updateEmailNotifications(next);
    if (!result.error) setEmailNotifications(next);
    setTogglingEmailNotifications(false);
  }

  async function handleUpgradePlan() {
    setUpgradingPlan(true);
    setError("");
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cadence: selectedCadence ?? "monthly", billingInterval, returnPath: "/dashboard?tab=settings" }),
    });
    const { url, error: checkoutError } = await res.json();
    if (checkoutError || !url) {
      setError("Failed to start checkout. Please try again.");
      setUpgradingPlan(false);
      return;
    }
    window.location.href = url;
  }

  async function handleManageSubscription() {
    setManagingSubscription(true);
    setError("");
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url, error: portalError } = await res.json();
    if (portalError || !url) {
      setError("Failed to open subscription management. Please try again.");
      setManagingSubscription(false);
      return;
    }
    window.location.href = url;
  }

  async function handlePartnerInvite() {
    setPartnerInviteSending(true);
    setPartnerInviteMessage("");
    setError("");
    const result = await sendPartnerInvite(partnerInviteEmail);
    setPartnerInviteSending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setPartnerInviteMessage("Invite sent. It expires in 24 hours.");
    setPartnerInviteCooldown(60);
    if (inviteCooldownRef.current) clearInterval(inviteCooldownRef.current);
    inviteCooldownRef.current = setInterval(() => {
      setPartnerInviteCooldown((s) => {
        if (s <= 1) { clearInterval(inviteCooldownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
    router.refresh();
  }

  const interestsSummary = interests?.length > 0
    ? interests.slice(0, 2).map((id) => INTEREST_LABEL[id] ?? id).join(", ") +
      (interests.length > 2 ? ` +${interests.length - 2}` : "")
    : "None selected";

  const logisticsSummary = [
    `${getCurrencySymbol(unitSystem)}${budgetMax}`,
    dateOutside && "Outside home",
    dateAtHome && "At home",
  ].filter(Boolean).join(" · ");

  const hasEnoughInterests = (interests?.length ?? 0) >= MIN_INTEREST_CATEGORIES;
  const hasDateStyle = Boolean(dateOutside || dateAtHome);
  const hasUnsavedLocationSettings = settingsLocationChanged(
    { lat, lng, radiusKm },
    savedLocationSettings
  );
  const hasUnsavedSettingsChanges = isDirty || hasUnsavedLocationSettings;
  const canSaveCurrentView =
    hasUnsavedSettingsChanges &&
    (view !== "interests" || hasEnoughInterests) &&
    (view !== "logistics" || hasDateStyle);

  const ACCOUNT_ROWS: { id: SettingsView; label: string; icon: React.ElementType; summary: string }[] = [
    { id: "account", label: "Manage account", icon: UserCog, summary: userEmail || "Account settings" },
    { id: "plan", label: "Plan", icon: Sparkles, summary: isPlus ? (profile.subscription_ends_at ? `Plus · Active until ${new Date(profile.subscription_ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : "Plus · Active") : isTrial ? "Trial · 1 free Plus date" : "Starter · Upgrade available" },
  ];

  const DATE_ROWS: { id: SettingsView; label: string; icon: React.ElementType; summary: string }[] = [
    { id: "partners", label: "Partners", icon: User, summary: partner2 ? `${partner1} & ${partner2}` : partner1 },
    { id: "interests", label: "Interests", icon: Tag, summary: interestsSummary },
    { id: "logistics", label: "Logistics", icon: Sliders, summary: logisticsSummary },
    { id: "location", label: "Location", icon: MapPin, summary: locationLabel || "Not set" },
    ...(isPlus
      ? [{ id: "frequency" as SettingsView, label: "Date frequency", icon: Calendar, summary: CADENCE_LABEL[selectedCadence] ?? selectedCadence }]
      : []),
  ];

  function navigate(to: SettingsView) {
    const dir = to === "list" ? -1 : 1;
    setDirection(dir);
    setView(to);
    if (to === "list") {
      onHeaderChange?.(null, null, dir);
    } else {
      window.history.pushState({ settingsView: to }, "");
      onHeaderChange?.(VIEW_LABELS[to] ?? to, () => window.history.back(), dir);
    }
  }

  function renderRow({ id, label, icon: Icon, summary }: { id: SettingsView; label: string; icon: React.ElementType; summary: string }) {
    return (
      <button
        key={id}
        type="button"
        onClick={() => navigate(id)}
        className="flex items-center gap-4 p-4 bg-white/[0.035] border border-white/16 rounded-2xl hover:border-white/28 transition-colors active:scale-[0.98]"
      >
        <div className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-white/65" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-white/55 mt-0.5 truncate">{summary}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/50 shrink-0" />
      </button>
    );
  }

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
            {/* Account section */}
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
              Account
            </p>
            <div className="flex flex-col gap-2 mb-5">
              {ACCOUNT_ROWS.filter((row) => memberRole === "owner" || row.id !== "plan").map(renderRow)}
            </div>

            {/* Date section */}
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
              Date
            </p>
            <div className="flex flex-col gap-2">
              {DATE_ROWS.map(renderRow)}
            </div>

            <button
              type="button"
              onClick={() => setSignOutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-white/16 text-white/55 hover:text-white hover:border-white/28 transition-all text-sm mt-6"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>

            {/* Sign-out confirmation modal */}
              <Dialog open={signOutConfirm} onClose={() => setSignOutConfirm(false)} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Sign out?</h3>
                <p className="text-sm text-white/55 mb-6">You can always sign back in to continue your mystery dates.</p>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="danger"
                    loading={signingOut}
                    onClick={handleSignOut}
                    className="w-full"
                  >
                    Yes, sign out
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setSignOutConfirm(false)} className="w-full">
                    Cancel
                  </Button>
                </div>
              </Dialog>
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
            {/* Account management view */}
            {view === "account" && (
              <div className="flex flex-col gap-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {/* Account information */}
                <div className="bg-white/[0.035] border border-white/16 rounded-2xl p-4">
                  <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-3">Account information</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/75 to-white/45 flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {(memberRole === "partner" ? profile.partner_names.partner2 : profile.partner_names.partner1).charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white/40 text-sm font-medium">+</span>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/55 to-white/30 flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {(memberRole === "partner" ? profile.partner_names.partner1 : profile.partner_names.partner2).charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {(() => {
                          const p1 = memberRole === "partner" ? profile.partner_names.partner2 : profile.partner_names.partner1;
                          const p2 = memberRole === "partner" ? profile.partner_names.partner1 : profile.partner_names.partner2;
                          return p2 ? `${p1} & ${p2}` : p1;
                        })()}
                      </p>
                      <p className="text-xs text-white/45 truncate">{userEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Email notifications */}
                <div className="bg-white/[0.035] border border-white/16 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-white/65" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">Email notifications</p>
                      <p className="text-xs text-white/45 mt-0.5">Date-ready reminders</p>
                    </div>
                    <Toggle
                      checked={emailNotifications}
                      onChange={handleToggleEmailNotifications}
                      disabled={togglingEmailNotifications}
                      aria-label={emailNotifications ? "Disable email notifications" : "Enable email notifications"}
                    />
                  </div>
                </div>

                {/* Delete account */}
                <div className="bg-white/[0.035] border border-white/16 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Delete account</p>
                      <p className="text-xs text-white/45 mt-0.5">Permanently removes all your data</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-red-500/10 border border-red-500/20 text-sm text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete my account
                  </button>
                </div>

                {/* Delete confirmation modal */}
                  <Dialog
                    open={deleteConfirm}
                    onClose={() => !deleting && (deleteSent ? (setDeleteConfirm(false), setDeleteSent(false)) : setDeleteConfirm(false))}
                    className="text-center"
                  >
                    {!deleteSent ? (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                          <Trash2 className="w-5 h-5 text-red-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Delete account?</h3>
                        <p className="text-sm text-white/55 mb-2">
                          This permanently deletes your account and all data. This cannot be undone.
                        </p>
                        <p className="text-xs text-white/40 mb-6">
                          We&apos;ll email a confirmation link to {userEmail || "your address"}. The link expires in 15 minutes.
                        </p>
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            variant="danger"
                            loading={deleting}
                            onClick={handleDeleteAccount}
                            className="w-full"
                          >
                            Send confirmation email
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteConfirm(false)}
                            disabled={deleting}
                            className="w-full"
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                          <Trash2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Check your email</h3>
                        <p className="text-sm text-white/55 mb-2">
                          We sent a confirmation link to
                        </p>
                        <p className="text-sm text-white font-semibold mb-6 break-all">{userEmail}</p>
                        <p className="text-xs text-white/40 mb-6">
                          Click the link to permanently delete your account. The link expires in 15 minutes.
                          Your account will remain active until you confirm.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => { setDeleteConfirm(false); setDeleteSent(false); }}
                          className="w-full"
                        >
                          Close
                        </Button>
                      </>
                    )}
                  </Dialog>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              {view !== "account" && error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-sm text-red-400 mb-5">
                  {error}
                </div>
              )}

              {/* Section: Partners */}
              {view === "partners" && (
                <div className="flex flex-col gap-3">
                  <Input label="My name" error={errors.partner1?.message} {...register("partner1")} />
                  <Input label="Your partner" error={errors.partner2?.message} {...register("partner2")} />
                  {partnerInviteStatus.state === "accepted" && (memberRole === "partner" ? partnerInviteStatus.ownerEmail : partnerInviteStatus.invitedEmail) && (
                    <div className="flex items-center gap-1.5 px-1">
                      <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <p className="text-xs text-emerald-400">
                        {memberRole === "partner" ? partnerInviteStatus.ownerEmail : partnerInviteStatus.invitedEmail}
                      </p>
                    </div>
                  )}
                  {partnerInviteStatus.state !== "accepted" && (
                  <div className="mt-2 rounded-2xl border border-white/16 bg-white/[0.04] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-white/65" />
                      <p className="text-sm font-semibold text-white">Partner access</p>
                    </div>
                    {memberRole === "owner" ? (
                      <div className="flex flex-col gap-3">
                        {partnerInviteStatus.state === "none" && (
                          <p className="text-xs leading-relaxed text-white/50">
                            Invite your partner to create an account. Dates unlock once both of you tap reveal.
                          </p>
                        )}
                        <Input
                          label="Partner email"
                          type="email"
                          value={partnerInviteEmail}
                          onChange={(e) => setPartnerInviteEmail(e.target.value)}
                          placeholder="partner@example.com"
                        />
                        {partnerInviteMessage && <p className="text-xs text-emerald-300 text-center">{partnerInviteMessage}</p>}
                        <Button
                          type="button"
                          variant="secondary"
                          loading={partnerInviteSending}
                          disabled={partnerInviteCooldown > 0}
                          onClick={handlePartnerInvite}
                          className="h-auto w-full py-3 text-sm"
                        >
                          {partnerInviteCooldown > 0
                            ? `Wait ${partnerInviteCooldown}s`
                            : partnerInviteStatus.state === "none" ? "Send invite" : "Send new invite"}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed text-white/50">
                        Ask the account owner to send a partner invite.
                      </p>
                    )}
                  </div>
                  )}
                </div>
              )}

              {/* Section: Interests */}
              {view === "interests" && (
                <>
                  {isStarter && (
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-3 py-2.5 mb-3">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <p className="text-xs text-amber-300/80">
                        Starter includes three date vibes. Choose at least {MIN_INTEREST_CATEGORIES}. <button type="button" onClick={() => navigate("plan")} className="underline underline-offset-2 hover:text-amber-200 transition-colors">Upgrade</button> to explore them all.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {(isStarter
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
                              ? "bg-white/[0.075] border-rose-400/70 text-white"
                              : "bg-white/[0.035] border-white/16 text-white/48 hover:border-white/30 hover:text-white/75",
                          ].join(" ")}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? "text-rose-300" : "text-white/45"}`} />
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
                        formatValue={(v) => `${getCurrencySymbol(unitSystem)}${v}`}
                        tone="neutral"
                      />
                    )}
                  />
                  <div className="flex gap-3">
                    {[
                      { key: "date_outside" as const, label: "Outside home", val: dateOutside, icon: MapPin },
                      { key: "date_at_home" as const, label: "At home", val: dateAtHome, icon: House },
                    ].map(({ key, label, val, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setValue(key, !val, { shouldValidate: true, shouldDirty: true })}
                        className={[
                          "flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all duration-200 active:scale-95",
                          val
                            ? "bg-white/[0.075] border-rose-400/70 text-white"
                            : "bg-white/[0.035] border-white/16 text-white/48 hover:border-white/30 hover:text-white/75",
                        ].join(" ")}
                      >
                        <Icon className={`w-5 h-5 ${val ? "text-rose-300" : "text-white/45"}`} />
                        <span className="text-xs font-medium leading-tight">{label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.date_outside && (
                    <p className="text-xs text-red-400">{errors.date_outside.message}</p>
                  )}
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
                        <button
                          type="button"
                          onClick={() => { setLocStatus("search"); setLat(null); setLng(null); setLocationLabel(""); }}
                          className="text-xs font-semibold text-white/65 hover:text-white/70 transition-colors shrink-0 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.06]"
                        >
                          Change
                        </button>
                      </motion.div>
                    ) : locStatus === "requesting" ? (
                      <motion.div key="requesting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <motion.div className="w-4 h-4 rounded-full border-2 border-white/18 border-t-white/75"
                          animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <p className="text-sm text-white/55">Detecting location…</p>
                      </motion.div>
                    ) : (
                      <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col gap-2"
                      >
                        {locStatus === "denied" && (
                          <div className="flex items-center gap-2 text-xs text-amber-400">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Location denied. Search below
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleDetectLocation}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.035] border border-white/16 text-sm text-white/60 hover:border-white/30 transition-colors"
                          >
                            <Navigation className="w-3.5 h-3.5 text-white/65" />
                            Detect
                          </button>
                          <button
                            type="button"
                            onClick={() => setLocStatus("search")}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.035] border border-white/16 text-sm text-white/60 hover:border-white/30 transition-colors"
                          >
                            <Search className="w-3.5 h-3.5 text-white/65" />
                            Search city
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {locStatus === "search" && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
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
                          className="w-full pl-9 pr-9 py-3 rounded-2xl bg-white/[0.035] border border-white/16 text-white text-sm placeholder:text-white/50 focus:outline-none focus:border-white/45 transition-colors"
                          style={{ fontSize: "16px" }}
                        />
                      </div>
                      <AnimatePresence>
                        {suggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className="bg-[#030303] border border-white/16 rounded-2xl overflow-hidden"
                          >
                            {suggestions.map((s, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => selectSuggestion(s)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.035] transition-colors border-b border-white/12 last:border-0"
                              >
                                <MapPin className="w-3.5 h-3.5 text-white/50 shrink-0" />
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
                    max={maxRadiusKm}
                    step={1}
                    formatValue={(v) => formatRadius(v, unitSystem)}
                    tone="neutral"
                  />
                  <div className="flex justify-between text-[10px] text-white/55 px-1 -mt-2">
                    <span>Walking distance</span>
                    <span>{isPlus ? "Long drive / Countryside" : `${formatRadius(FREE_MAX_RADIUS_KM, unitSystem)} max on Starter`}</span>
                  </div>
                  {isStarter && (
                    <button
                      type="button"
                      onClick={() => navigate("plan")}
                      className="text-[11px] text-white/55 hover:text-white/75 transition-colors text-left px-1"
                    >
                      Upgrade to Plus for up to {formatRadius(PAID_MAX_RADIUS_KM, unitSystem)} →
                    </button>
                  )}
                </div>
              )}

              {/* Section: Frequency */}
              {view === "frequency" && (
                <CadenceSelect
                  value={selectedCadence as CadenceValue}
                  onChange={(v) => setValue("cadence", v, { shouldDirty: true })}
                />
              )}

              {/* Section: Plan */}
              {view === "plan" && (
                <div className="flex flex-col gap-3">
                  <div className={[
                    "flex items-center gap-3 rounded-2xl border p-4",
                    isPlus
                      ? "bg-gradient-to-br from-white/[0.045] to-white/[0.025] border-rose-400/45"
                      : "bg-white/[0.035] border-white/16",
                  ].join(" ")}>
                    <div className={[
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      isPlus ? "bg-white/[0.06]" : "bg-white/[0.06]",
                    ].join(" ")}>
                      {isPlus
                        ? <Crown className="w-4 h-4 text-white/65" />
                        : <Lock className="w-4 h-4 text-white/40" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {isPlus ? "Plus" : isTrial ? "Trial" : "Starter"}
                      </p>
                      <p className="text-xs text-white/55 mt-0.5">
                        {isPlus
                          ? profile.subscription_ends_at
                            ? `Active until ${new Date(profile.subscription_ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                            : "Active · Cancel anytime"
                          : isTrial ? "1 free Plus date · Upgrade to keep going" : "1 date/month · Limited categories"}
                      </p>
                    </div>
                    {isPlus && (
                      <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${profile.subscription_ends_at ? "text-amber-400 bg-amber-500/15 border border-amber-500/30" : "text-white/65 bg-white/[0.045] border border-white/18"}`}>
                        {profile.subscription_ends_at ? "Cancels" : "Active"}
                      </span>
                    )}
                  </div>

                  {!isPlus && (
                    <div className="bg-gradient-to-br from-white/[0.045] to-white/[0.025] border border-rose-400/45 rounded-2xl p-5 flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-white/65" />
                        <p className="text-sm font-bold text-white">Unlock Plus</p>
                        <div className="ml-auto text-right">
                          {billingInterval === "yearly" ? (
                            <>
                              <p className="text-base font-black text-white">{getCurrencySymbol(unitSystem)}39.99<span className="text-xs font-normal text-white/60"> / year</span></p>
                              <p className="text-[10px] text-emerald-400">~{getCurrencySymbol(unitSystem)}3.33/mo · save 44%</p>
                            </>
                          ) : (
                            <>
                              <p className="text-base font-black text-white">{getCurrencySymbol(unitSystem)}1.49<span className="text-xs font-normal text-white/60"> first month</span></p>
                              <p className="text-[10px] text-white/40">then {getCurrencySymbol(unitSystem)}5.99/mo</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Billing interval toggle */}
                      <div className="flex items-center gap-0.5 bg-black/20 rounded-xl p-0.5 self-start">
                        <button
                          type="button"
                          onClick={() => setBillingInterval("monthly")}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            billingInterval === "monthly"
                              ? "bg-white/15 text-white"
                              : "text-white/45 hover:text-white/70"
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingInterval("yearly")}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            billingInterval === "yearly"
                              ? "bg-white/15 text-white"
                              : "text-white/45 hover:text-white/70"
                          }`}
                        >
                          Yearly
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-1 py-0.5 rounded-full leading-none">
                            -44%
                          </span>
                        </button>
                      </div>

                      <ul className="flex flex-col gap-2">
                        {PLANS.find((p) => p.id === "subscription")!.features.map((text) => (
                          <li key={text} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/65" />
                            <span className="text-xs text-white font-semibold">{text}</span>
                          </li>
                        ))}
                      </ul>
                      {inCapacitor ? (
                        <button
                          type="button"
                          onClick={async () => {
                            const { Browser } = await import('@capacitor/browser')
                            await Browser.open({ url: 'https://blindfolddate.com/dashboard?tab=settings' })
                          }}
                          className="w-full py-3 rounded-full border border-white/20 text-white/60 text-sm font-semibold"
                        >
                          Get Plus on the web
                        </button>
                      ) : (
                        <Button
                          type="button"
                          variant="primary"
                          loading={upgradingPlan}
                          onClick={handleUpgradePlan}
                          className="w-full h-auto py-3 text-sm font-bold gap-2"
                        >
                          {billingInterval === "yearly" ? `Subscribe · ${getCurrencySymbol(unitSystem)}39.99/year` : `Subscribe · ${getCurrencySymbol(unitSystem)}1.49 first month`}
                        </Button>
                      )}
                    </div>
                  )}

                  {isPlus && (
                    inCapacitor ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const { Browser } = await import('@capacitor/browser')
                          await Browser.open({ url: 'https://blindfolddate.com/dashboard?tab=settings' })
                        }}
                        className="w-full py-2.5 rounded-full border border-white/16 text-white/50 text-sm font-semibold"
                      >
                        Manage via website
                      </button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        loading={managingSubscription}
                        onClick={handleManageSubscription}
                        className="w-full h-auto py-2.5 text-sm text-white/50 hover:text-white/80 border border-white/16 hover:border-white/28"
                      >
                        Manage or cancel subscription
                      </Button>
                    )
                  )}
                </div>
              )}

              {view !== "plan" && view !== "account" && (
                <motion.div
                  animate={saved ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="mt-6"
                >
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    loading={saving}
                    disabled={!canSaveCurrentView}
                  >
                    {saved ? "All set" : "Apply changes"}
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


