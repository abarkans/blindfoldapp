"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MapPin, MapPinOff, Timer, Wallet, CheckCircle2, AlertCircle, Navigation, Star, Shuffle, Check, X, Phone, Mail, ChevronRight, Target, PackageCheck, MessageCircle } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Drawer from "@/components/ui/Drawer";
import Input from "@/components/ui/Input";
import LinkButton from "@/components/ui/LinkButton";
import { revealDate, startDate } from "@/app/actions/reveal";
import { completeDate } from "@/app/actions/complete-date";
import { getCompletionResult } from "@/app/actions/get-completion-result";
import { acceptDate } from "@/app/actions/accept-date";
import { rerollDate } from "@/app/actions/reroll";
import { sendPartnerInvite } from "@/app/actions/partner-invite";
import { skipCheckIn } from "@/app/actions/check-in";
import { dismissDate, resetCheckinSkip } from "@/app/actions/dismiss-date";
import type { CompleteDateResult } from "@/lib/types";
import CompleteDateModal from "@/components/dashboard/CompleteDateModal";
import CheckInButton from "@/components/dashboard/CheckInButton";
import HomeDateCard from "@/components/dashboard/HomeDateCard";
import LocationPickerModal from "@/components/dashboard/LocationPickerModal";
import PhotoChallenge from "@/components/dashboard/PhotoChallenge";
import { getPriceLevelLabel, type VenueAIEnrichment } from "@/lib/places/search";
import { type UnitSystem, getCurrencySymbol, formatBudgetRange } from "@/lib/units";

const LOADING_MESSAGES = [
  "Scanning the city for your perfect spot...",
  "Checking out hidden gems near you...",
  "Finding venues with a little magic...",
  "Crafting something deliciously unexpected...",
  "Personalising this one just for you...",
  "The city has something special planned...",
  "Reading your love language...",
  "Mixing mystery with a dash of romance...",
];

const REROLL_MESSAGES = [
  "Shuffling the deck...",
  "Finding something even better...",
  "Rolling the dice...",
  "Conjuring a new mystery...",
  "Searching for the perfect swap...",
];

const HOME_LOADING_MESSAGES = [
  "Planning your perfect night in...",
  "Crafting something cosy and unexpected...",
  "Setting the scene at home...",
  "Designing your evening together...",
  "Mixing mood, mission, and magic...",
  "Building a night you'll actually remember...",
  "Putting together your home date guide...",
];

// AI-generated idea shape
interface AIDateIdea {
  title: string;
  description: string;
  mission?: string;
  vibe: string;
  preparation?: string;
  conversation_starter?: string;
  duration: string;
  budget_range: string;
  tags: string[];
  // Home date fields
  location_type?: "outside" | "home";
  preparation_list?: string[];
  steps?: string[];
  conversation_starters?: string[];
}

// Google Places venue shape
interface VenueDateIdea {
  type: "venue";
  place_id: string;
  display_name: string;
  formatted_address: string;
  short_formatted_address?: string | null;
  national_phone_number?: string | null;
  international_phone_number?: string | null;
  photo_name: string | null;
  // Signed `/api/place-photo?ref=...&exp=...&sig=...` URL injected by
  // the dashboard RSC so the Next.js image optimizer can fetch the
  // proxy without a session cookie. See lib/place-photo-token.ts.
  signed_photo_url?: string | null;
  rating: number;
  price_level: string;
  location?: { latitude: number; longitude: number } | null;
  ai: VenueAIEnrichment | null;
}

type DateIdea = AIDateIdea | VenueDateIdea;
type DateTeaser = {
  vibe: string;
  activity_level: string;
  price: string;
  hook: string;
};

function isVenue(idea: DateIdea): idea is VenueDateIdea {
  return (idea as VenueDateIdea).type === "venue";
}

function getShortAddress(venue: VenueDateIdea): string {
  if (venue.short_formatted_address) return venue.short_formatted_address;

  const parts = venue.formatted_address.split(",").map((part) => part.trim());
  return parts.slice(0, 2).join(", ") || venue.formatted_address;
}

interface DateCardProps {
  partnerNames: { partner1: string; partner2: string };
  cadence: string;
  revealedAt: string | null;
  dateIdea: DateIdea | null;
  dateTeaser: DateTeaser | null;
  isDateCompleted: boolean;
  dateIdeaId: string | null;
  myUserId: string;
  profileId: string;
  onGoToProgress: () => void;
  planType: string;
  totalRerollsUsed: number;
  currentDateRerolled: boolean;
  dateAcceptedAt: string | null;
  memberRole: "owner" | "partner";
  ownerReadyAt: string | null;
  partnerReadyAt: string | null;
  hasAcceptedPartner: boolean;
  partnerInviteState: "none" | "pending" | "expired" | "accepted";
  partnerInvitedEmail?: string | null;
  checkinOwnerAt: string | null;
  checkinPartnerAt: string | null;
  checkinOwnerSkipped: boolean;
  checkinPartnerSkipped: boolean;
  dateOutside: boolean;
  dateAtHome: boolean;
  unitSystem?: UnitSystem;
}

function getNextRevealDate(revealedAt: string, cadence: string): Date {
  const cadenceDays: Record<string, number> = {
    weekly: 7,
    biweekly: 14,
    monthly: 30,
  };
  const days = cadenceDays[cadence] ?? 7;
  const next = new Date(revealedAt);
  next.setDate(next.getDate() + days);
  return next;
}

function isRevealAvailable(revealedAt: string | null, cadence: string): boolean {
  if (!revealedAt) return true;
  return new Date() >= getNextRevealDate(revealedAt, cadence);
}

function formatRelative(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return `in ${diffDays} days`;
}

const HOLD_DURATION = 1300;

function HoldToCompleteButton({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function startHold(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setIsPressing(true);
    startTimeRef.current = Date.now();

    const tick = () => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(elapsed / HOLD_DURATION, 1);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        startTimeRef.current = null;
        setIsPressing(false);
        setProgress(0);
        onComplete();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function cancelHold() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startTimeRef.current = null;
    setIsPressing(false);
    setProgress(0);
  }

  const label = isPressing
    ? progress > 0.75
      ? "Almost there…"
      : "Keep holding…"
    : "Hold to mark as done";

  return (
    <button
      className="relative w-full h-14 rounded-full overflow-hidden select-none cursor-pointer"
      style={{ WebkitUserSelect: "none", touchAction: "none" }}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="absolute inset-0 rounded-full bg-green-500/15 border border-green-500/30" />
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-md shadow-green-500/30"
        style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0 round 9999px)` }}
      />
      <div className="relative z-10 flex items-center justify-center gap-2 h-full px-4">
        <CheckCircle2
          className={`w-4 h-4 transition-colors duration-150 ${progress > 0.5 ? "text-white" : "text-green-400"}`}
        />
        <span className={`text-sm font-semibold transition-colors duration-150 ${progress > 0.5 ? "text-white" : "text-green-300"}`}>
          {label}
        </span>
      </div>
    </button>
  );
}

function useCountdown(target: Date | null) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const targetMs = target?.getTime() ?? null;

  useEffect(() => {
    if (!targetMs) return;
    function update() {
      const diff = targetMs! - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return timeLeft;
}

function BothSkippedScreen({
  onReset,
  onDismiss,
}: {
  onReset: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-white/[0.05] border border-white/12 px-4 py-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.07] flex items-center justify-center mx-auto mb-3">
          <MapPinOff className="w-6 h-6 text-white/55" />
        </div>
        <p className="text-sm font-semibold text-white mb-1">Looks like you both skipped check-in</p>
        <p className="text-xs text-white/55 leading-relaxed">
          No worries — date nights don&apos;t always go to plan. You can head to the venue now and check in, or close this one out and look forward to the next.
        </p>
      </div>
      <Button variant="primary" size="lg" className="w-full gap-2" onClick={onReset}>
        <MapPin className="w-4 h-4" />
        Take us to check-in
      </Button>
      <Button variant="secondary" size="lg" className="w-full" onClick={onDismiss}>
        We&apos;re done for tonight
      </Button>
    </div>
  );
}

function getPartnerInviteCopy(
  state: DateCardProps["partnerInviteState"],
  partnerName: string
) {
  if (state === "pending") {
    return {
      title: `Waiting for ${partnerName}`,
      subtitle:
        "They need to accept the invite before you can start date nights together. After that, both of you tap reveal to unlock the full plan.",
      button: "Manage invite",
    };
  }

  if (state === "expired") {
    return {
      title: "Invite expired",
      subtitle:
        "Send a fresh invite when you're ready. Dates unlock after your partner accepts and both of you tap reveal.",
      button: "Send new invite",
    };
  }

  return {
    title: `Invite ${partnerName}`,
    subtitle:
      "Dates unlock after your partner accepts the invite. Then both of you tap reveal when you're ready for the full plan.",
    button: "Invite partner",
  };
}

export default function DateCard({
  partnerNames,
  cadence,
  revealedAt,
  dateIdea,
  dateTeaser,
  isDateCompleted,
  dateIdeaId,
  myUserId,
  profileId,
  onGoToProgress,
  planType,
  totalRerollsUsed,
  currentDateRerolled,
  dateAcceptedAt,
  memberRole,
  ownerReadyAt,
  partnerReadyAt,
  hasAcceptedPartner,
  partnerInviteState,
  partnerInvitedEmail,
  checkinOwnerAt,
  checkinPartnerAt,
  checkinOwnerSkipped,
  checkinPartnerSkipped,
  dateOutside,
  dateAtHome,
  unitSystem = "metric",
}: DateCardProps) {
  const ph = usePostHog();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCompletePending, startCompleteTransition] = useTransition();
  const [isRerollPending, startRerollTransition] = useTransition();
  const [isSkipPending, startSkipTransition] = useTransition();
  const [isDismissPending, startDismissTransition] = useTransition();
  const [isResetCheckinPending, startResetCheckinTransition] = useTransition();
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [revealed, setRevealed] = useState(
    !!dateIdea && !!dateAcceptedAt
  );
  const [completed, setCompleted] = useState(isDateCompleted);
  const wasCompletedOnMountRef = useRef(isDateCompleted);
  const completionFetchedRef = useRef(false);
  const wasDismissedRef = useRef(false);
  const [accepted, setAccepted] = useState(!!dateAcceptedAt);
  const [rerollModalOpen, setRerollModalOpen] = useState(false);
  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);
  const [partnerInviteModalOpen, setPartnerInviteModalOpen] = useState(false);
  const [partnerInviteEmail, setPartnerInviteEmail] = useState(partnerInvitedEmail ?? "");
  const [partnerInviteSending, setPartnerInviteSending] = useState(false);
  const [partnerInviteError, setPartnerInviteError] = useState("");
  const [partnerInviteMessage, setPartnerInviteMessage] = useState("");
  const [modalData, setModalData] = useState<CompleteDateResult | null>(null);
  const [localRevealReady, setLocalRevealReady] = useState(false);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<"description" | "mission" | "preparation" | "conversation" | null>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [pendingLocationType, setPendingLocationType] = useState<"outside" | "home" | "auto" | null>(null);

  // Sync local reveal state when the server updates after the other partner is ready.
  useEffect(() => {
    const nextRevealed = !!dateIdea && !!dateAcceptedAt;
    setAccepted(!!dateAcceptedAt);
    setRevealed(nextRevealed);
    if (nextRevealed || !dateIdea) setLocalRevealReady(false);
  }, [dateIdea, dateAcceptedAt]);
  useEffect(() => {
    setCompleted(isDateCompleted);
  }, [isDateCompleted]);
  useEffect(() => {
    if (!isDateCompleted) return;
    if (wasCompletedOnMountRef.current) return;
    if (completionFetchedRef.current) return;
    if (wasDismissedRef.current) return;
    completionFetchedRef.current = true;
    // Direct completer already set modalData before this effect fires via RSC revalidation.
    // Waiting partner sees isDateCompleted go true without modalData — fetch it for them.
    getCompletionResult().then((result) => {
      if (result) setModalData((prev) => prev ?? result);
    });
  }, [isDateCompleted]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (dateTeaser) setSuccessMessage("");
  }, [dateTeaser]);
  useEffect(() => {
    setPartnerInviteEmail(partnerInvitedEmail ?? "");
  }, [partnerInvitedEmail]);
  useEffect(() => {
    if (!partnerInviteModalOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [partnerInviteModalOpen]);
  useEffect(() => {
    if (!activeSheet) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [activeSheet]);

  const isFree = planType !== "subscription";
  const canReroll = isFree ? totalRerollsUsed < 1 : !currentDateRerolled;

  const myDecided = memberRole === "owner" ? !!checkinOwnerAt : !!checkinPartnerAt;
  const mySkippedCheckIn = memberRole === "owner" ? checkinOwnerSkipped : checkinPartnerSkipped;
  const myCheckedIn = myDecided && !mySkippedCheckIn;
  const partnerDecided = memberRole === "owner" ? !!checkinPartnerAt : !!checkinOwnerAt;
  const partnerSkippedCheckIn = memberRole === "owner" ? checkinPartnerSkipped : checkinOwnerSkipped;
  const partnerCheckedIn = partnerDecided && !partnerSkippedCheckIn;
  const hasVenueLocation =
    dateIdea && isVenue(dateIdea) && !!dateIdea.location?.latitude;
  const isHomeDateIdea =
    dateIdea && !isVenue(dateIdea) && (dateIdea as AIDateIdea).location_type === "home";
  // Poll any time the check-in flow is active so either partner's check-in arrives without a manual refresh.
  const showCheckinFlow = revealed && accepted && !completed && (hasVenueLocation || !!isHomeDateIdea);

  const canReveal = isRevealAvailable(revealedAt, cadence);
  const prevCanRevealRef = useRef(canReveal);
  useEffect(() => {
    if (canReveal && !prevCanRevealRef.current) router.refresh();
    prevCanRevealRef.current = canReveal;
  }, [canReveal, router]);

  const currentUserReady = localRevealReady || (memberRole === "owner" ? !!ownerReadyAt : !!partnerReadyAt);
  const otherPartnerReady = memberRole === "owner" ? !!partnerReadyAt : !!ownerReadyAt;
  const nextRevealDate = revealedAt ? getNextRevealDate(revealedAt, cadence) : null;
  const showCompletedCooldown = completed && !canReveal;
  const countdown = useCountdown(showCompletedCooldown && nextRevealDate ? nextRevealDate : null);
  const venuePhoneNumber =
    dateIdea && isVenue(dateIdea)
      ? dateIdea.international_phone_number ?? dateIdea.national_phone_number ?? null
      : null;
  const venuePhoneHref = venuePhoneNumber
    ? `tel:${venuePhoneNumber.replace(/[^\d+]/g, "")}`
    : null;
  const venueShortAddress =
    dateIdea && isVenue(dateIdea) ? getShortAddress(dateIdea) : null;
  const partnerInviteCopy = getPartnerInviteCopy(
    partnerInviteState,
    partnerNames.partner2 || "your partner"
  );
  const waitingForPartnerReveal =
    !!dateIdea && !!dateTeaser && !revealed && currentUserReady && !accepted;

  const isLoading = isPending || isRerollPending;

  useEffect(() => {
    if (!isLoading) return;
    const messages = isRerollPending
      ? REROLL_MESSAGES
      : pendingLocationType === "home"
      ? HOME_LOADING_MESSAGES
      : LOADING_MESSAGES;
    setLoadingMsgIndex(Math.floor(Math.random() * messages.length));
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading, isRerollPending, pendingLocationType]);

  useEffect(() => {
    if (!waitingForPartnerReveal) return;
    let timeout: number | null = null;
    let cancelled = false;
    const scheduleRefresh = () => {
      timeout = window.setTimeout(() => {
        if (cancelled) return;
        router.refresh();
        scheduleRefresh();
      }, 12_000 + Math.floor(Math.random() * 6_000));
    };
    scheduleRefresh();
    return () => {
      cancelled = true;
      if (timeout) window.clearTimeout(timeout);
    };
  }, [waitingForPartnerReveal, router]);

  useEffect(() => {
    if (!showCheckinFlow) return;
    let timeout: number | null = null;
    let cancelled = false;
    const scheduleRefresh = () => {
      timeout = window.setTimeout(() => {
        if (cancelled) return;
        router.refresh();
        scheduleRefresh();
      }, 12_000 + Math.floor(Math.random() * 6_000));
    };
    scheduleRefresh();
    return () => {
      cancelled = true;
      if (timeout) window.clearTimeout(timeout);
    };
  }, [showCheckinFlow, router]);

  function handleStartDate() {
    if (dateOutside && dateAtHome) {
      setLocationPickerOpen(true);
      return;
    }
    executeStartDate(dateAtHome ? "home" : "outside");
  }

  function executeStartDate(locationType: "outside" | "home" | "auto") {
    setLocationPickerOpen(false);
    setPendingLocationType(locationType);
    setError("");
    setSuccessMessage("");
    startTransition(async () => {
      try {
        const result = await startDate(locationType);
        if (result.status === "error") {
          setError(result.error);
          return;
        }
        setCompleted(false);
        setSuccessMessage(
          result.status === "started" && result.warning
            ? result.warning
            : "Date started. The teaser is ready."
        );
        router.refresh();
        ph?.capture("date_started", { plan_type: planType, location_type: locationType });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setPendingLocationType(null);
      }
    });
  }

  function handleReveal() {
    setError("");
    setSuccessMessage("");
    startTransition(async () => {
      try {
        const result = await revealDate();
        if (result.status === "error") {
          setError(result.error);
          return;
        }
        if (result.status === "waiting") {
          setLocalRevealReady(true);
          setSuccessMessage("You're ready. Waiting for your partner to reveal too.");
          router.refresh();
          return;
        }
        setRevealed(true);
        setCompleted(false);
        setAccepted(true);
        router.refresh();
        ph?.capture("date_revealed", { plan_type: planType });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleAccept() {
    setError("");
    setAccepted(true);
    startTransition(async () => {
      try {
        await acceptDate();
      } catch (e) {
        setAccepted(false);
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleRerollConfirm() {
    if (otherPartnerReady) {
      setRerollModalOpen(false);
      setError("Your partner already accepted this date.");
      return;
    }

    setRerollModalOpen(false);
    setError("");
    setSuccessMessage("");
    startRerollTransition(async () => {
      try {
        await rerollDate();
        ph?.capture("date_rerolled", { plan_type: planType });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        const PASSTHROUGH = [
          "Your partner already accepted this date.",
          "No re-rolls remaining on the basic plan",
          "Already re-rolled this date",
          "No active date to re-roll.",
          "No venues found nearby. Try increasing your search radius in Settings.",
          "Profile not found",
          "Profile setup incomplete",
          "Too many requests",
          "Service temporarily unavailable",
        ];
        setError(PASSTHROUGH.some((s) => msg.startsWith(s))
          ? msg
          : "Couldn't find a new date. Your original date is still saved.");
      }
    });
  }

  function handleComplete() {
    setError("");
    setSuccessMessage("");
    startCompleteTransition(async () => {
      try {
        const result = await completeDate();
        setCompleted(true);
        setModalData(result);
        ph?.capture("date_completed", { plan_type: planType });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  async function handlePhotoComplete() {
    const result = await getCompletionResult();
    if (result) setModalData((prev) => prev ?? result);
    router.refresh();
  }

  function handleSkipCheckIn() {
    setSkipDialogOpen(false);
    startSkipTransition(async () => {
      await skipCheckIn();
      router.refresh();
    });
  }

  async function handlePartnerInvite() {
    setPartnerInviteSending(true);
    setPartnerInviteError("");
    setPartnerInviteMessage("");
    const result = await sendPartnerInvite(partnerInviteEmail);
    setPartnerInviteSending(false);
    if (result.error) {
      setPartnerInviteError(result.error);
      return;
    }
    setPartnerInviteMessage("Invite sent. It expires in 24 hours.");
    router.refresh();
  }

  return (
    <>
      {/* Countdown card — shown first when date is completed */}
      {showCompletedCooldown && countdown && nextRevealDate && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Next mystery date</p>
          <div className="grid grid-cols-4 gap-2">
          {[
            { value: countdown.days, label: "Days" },
            { value: countdown.hours, label: "Hours" },
            { value: countdown.minutes, label: "Mins" },
            { value: countdown.seconds, label: "Secs" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white rounded-2xl py-3 text-center">
              <p className="text-4xl font-black text-zinc-900 tabular-nums">{String(value).padStart(2, "0")}</p>
              <p className="text-xs font-medium text-zinc-500 mt-0.5">{label}</p>
            </div>
          ))}
          </div>
        </div>
      )}

      {!!dateIdea && !!dateTeaser && !revealed && (
        <p className="text-xs font-semibold text-white/65 uppercase tracking-widest mb-3">The teaser</p>
      )}

      <div
        className={completed ? "" : "relative overflow-hidden rounded-3xl border border-white/16 bg-white/[0.035] backdrop-blur-sm"}
      >
        <div className={completed ? "" : "relative p-6"}>
          {/* Header — hidden when date is active and not yet completed */}
          {!(revealed && !completed) && !(!!dateIdea && !!dateTeaser && !revealed) && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white/65 uppercase tracking-widest">
                  {(revealed && completed && dateIdea) ? "Previous date" : "Getting started"}
                </span>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ── REVEALED STATE ── */}
            {revealed && dateIdea && !(completed && canReveal) ? (
              <motion.div
                key="revealed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {completed ? (
                  /* ── COMPLETED: collapsed card ── */
                  <div className="flex items-center gap-4 bg-white/[0.035] border border-white/16 rounded-2xl px-4 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">
                        {isVenue(dateIdea) ? dateIdea.display_name : dateIdea.title}
                      </p>
                      <p className="text-xs text-white/55 mt-0.5">
                        {isVenue(dateIdea) ? getShortAddress(dateIdea) : dateIdea.vibe}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                      {checkinOwnerSkipped && checkinPartnerSkipped ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-white/40" />
                          <span className="text-xs font-semibold text-white/40">Incomplete</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400">Done</span>
                        </>
                      )}
                    </div>
                  </div>

                ) : isRerollPending ? (
                  /* ── REROLLING: loading state ── */
                  <div className="flex flex-col items-center gap-3 py-8">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-white/70"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={loadingMsgIndex}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.4 }}
                        className="text-sm text-white/50 text-center px-4"
                      >
                        {REROLL_MESSAGES[loadingMsgIndex % REROLL_MESSAGES.length]}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                ) : !accepted ? (
                  /* ── ACCEPT / RE-ROLL CHOICE ── */
                  <motion.div
                    key="choice"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-4"
                  >
                    {/* Peek preview */}
                    <div className="bg-white/[0.045] border border-white/16 rounded-2xl p-4 text-center">
                      {isVenue(dateIdea) ? (
                        <>
                          <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
                            <MapPin className="w-6 h-6 text-white/65" />
                          </div>
                          <p className="text-base font-bold text-white mb-1">{dateIdea.display_name}</p>
                          <div className="flex items-center justify-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-xs text-white/50">{dateIdea.rating.toFixed(1)}</span>
                            {dateIdea.ai?.vibe && (
                              <>
                                <span className="text-white/20">·</span>
                                <span className="text-xs text-white/70">{dateIdea.ai.vibe}</span>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-bold text-white mb-1">{dateIdea.title}</p>
                          <p className="text-xs text-white/70">{dateIdea.vibe}</p>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-white/55 text-center">
                      Unlock the full surprise — or swap for something else.
                    </p>

                    {error && <p className="text-xs text-red-400 text-center">{error}</p>}

                    <div className="flex flex-col gap-3">
                      {/* Accept button — primary */}
                      <Button
                        size="md"
                        className="w-full"
                        onClick={() => canReroll ? setAcceptConfirmOpen(true) : handleAccept()}
                      >
                        Accept & Reveal
                      </Button>

                      {/* Re-roll button — secondary */}
                      <Button
                        size="md"
                        variant={canReroll ? "outline" : "outline"}
                        disabled={!canReroll}
                        onClick={() => canReroll && setRerollModalOpen(true)}
                        className="w-full"
                      >
                        Try another
                      </Button>
                    </div>
                  </motion.div>

                ) : isVenue(dateIdea) ? (
                  /* ── ACCEPTED VENUE ── */
                  <>
                    {/* Full-bleed image — negative margins cancel the parent p-6 */}
                    <div className="relative -mx-6 -mt-6 h-60 overflow-hidden">
                      {dateIdea.photo_name && dateIdea.signed_photo_url ? (
                        <Image
                          src={dateIdea.signed_photo_url}
                          alt={dateIdea.display_name}
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          loading="eager"
                          priority
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/[0.035]">
                          <MapPin className="w-10 h-10 text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
                      {/* Vibe tag (left) + action buttons (right) at top of image */}
                      <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                        {dateIdea.ai?.vibe && (
                          <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#17131f] shadow-lg shadow-black/20 max-w-[9rem] truncate block">
                            {dateIdea.ai.vibe}
                          </span>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                          <LinkButton
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dateIdea.display_name)}&query_place_id=${dateIdea.place_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="ghost"
                            size="sm"
                            aria-label="Get directions"
                            title="Get directions"
                            className="h-10 w-10 rounded-full bg-rose-500 text-white p-0 shadow-lg shadow-black/25 hover:bg-rose-400 hover:text-white"
                          >
                            <Navigation className="h-[18px] w-[18px]" />
                          </LinkButton>
                          {venuePhoneHref && (
                            <LinkButton
                              href={venuePhoneHref}
                              variant="ghost"
                              size="sm"
                              aria-label="Call venue"
                              title="Call venue"
                              className="h-10 w-10 rounded-full bg-rose-500 text-white p-0 shadow-lg shadow-black/25 hover:bg-rose-400 hover:text-white"
                            >
                              <Phone className="h-[18px] w-[18px]" />
                            </LinkButton>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Title + Rating on same row */}
                    <div className="flex items-start justify-between gap-3 mt-4 mb-1.5">
                      <h3 className="text-xl font-bold text-white leading-tight">
                        {dateIdea.ai?.title || dateIdea.display_name}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0 mt-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold text-white">{dateIdea.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Metadata row */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45 mb-4">
                      {dateIdea.ai?.duration && (
                        <span className="inline-flex items-center gap-1.5">
                          <Timer className="h-3.5 w-3.5 text-white/55" />
                          {dateIdea.ai.duration}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5 text-white/55" />
                        {formatBudgetRange(dateIdea.ai?.budget_range || getPriceLevelLabel(dateIdea.price_level, getCurrencySymbol(unitSystem)), unitSystem)}
                      </span>
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-white/55" />
                        <span className="truncate">{venueShortAddress}</span>
                      </span>
                    </div>

                    {/* Detail rows — bottom sheet on mobile, accordion on desktop */}
                    {!(mySkippedCheckIn && partnerSkippedCheckIn) && (dateIdea.ai?.description || dateIdea.ai?.mission || (!isFree && (dateIdea.ai?.preparation || dateIdea.ai?.conversation_starter))) && (
                      <div className="mb-4 flex flex-col gap-2">
                        {dateIdea.ai?.description && (
                          <p className="text-sm leading-relaxed text-white/70 mb-2">{dateIdea.ai.description}</p>
                        )}
                        {dateIdea.ai?.mission && (
                          <div className="bg-white/[0.035] border border-white/16 rounded-2xl hover:border-white/28 transition-colors overflow-hidden active:scale-[0.98] md:active:scale-100">
                            <button
                              onClick={() => setActiveSheet(activeSheet === "mission" ? null : "mission")}
                              className="flex items-center gap-4 w-full px-4 py-1.5 md:p-4 text-left"
                            >
                              <div className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0">
                                <Target className="w-4 h-4 text-white/65" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white">Mission</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-white/35 shrink-0 md:hidden" />
                              <span className="hidden md:flex items-center justify-center w-5 h-5 text-white/40 text-lg leading-none shrink-0">
                                {activeSheet === "mission" ? "−" : "+"}
                              </span>
                            </button>
                            <div className={`hidden md:grid transition-[grid-template-rows] duration-200 ease-out ${activeSheet === "mission" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                              <div className="overflow-hidden">
                                <p className="px-4 pb-4 text-sm leading-relaxed text-white/75 border-t border-white/[0.07] pt-3">{dateIdea.ai.mission}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {!isFree && dateIdea.ai?.preparation && (
                          <div className="bg-white/[0.035] border border-white/16 rounded-2xl hover:border-white/28 transition-colors overflow-hidden active:scale-[0.98] md:active:scale-100">
                            <button
                              onClick={() => setActiveSheet(activeSheet === "preparation" ? null : "preparation")}
                              className="flex items-center gap-4 w-full px-4 py-1.5 md:p-4 text-left"
                            >
                              <div className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0">
                                <PackageCheck className="w-4 h-4 text-white/65" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white">Before you go</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-white/35 shrink-0 md:hidden" />
                              <span className="hidden md:flex items-center justify-center w-5 h-5 text-white/40 text-lg leading-none shrink-0">
                                {activeSheet === "preparation" ? "−" : "+"}
                              </span>
                            </button>
                            <div className={`hidden md:grid transition-[grid-template-rows] duration-200 ease-out ${activeSheet === "preparation" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                              <div className="overflow-hidden">
                                <p className="px-4 pb-4 text-sm leading-relaxed text-white/70 border-t border-white/[0.07] pt-3">{dateIdea.ai.preparation}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {!isFree && dateIdea.ai?.conversation_starter && (
                          <div className="bg-white/[0.035] border border-white/16 rounded-2xl hover:border-white/28 transition-colors overflow-hidden active:scale-[0.98] md:active:scale-100">
                            <button
                              onClick={() => setActiveSheet(activeSheet === "conversation" ? null : "conversation")}
                              className="flex items-center gap-4 w-full px-4 py-1.5 md:p-4 text-left"
                            >
                              <div className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0">
                                <MessageCircle className="w-4 h-4 text-white/65" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white">Conversation starter</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-white/35 shrink-0 md:hidden" />
                              <span className="hidden md:flex items-center justify-center w-5 h-5 text-white/40 text-lg leading-none shrink-0">
                                {activeSheet === "conversation" ? "−" : "+"}
                              </span>
                            </button>
                            <div className={`hidden md:grid transition-[grid-template-rows] duration-200 ease-out ${activeSheet === "conversation" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                              <div className="overflow-hidden border-t border-white/[0.07]">
                                <div className="px-4 pb-4 pt-3">
                                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">Ask:</p>
                                  <p className="text-sm leading-relaxed text-white/70">{dateIdea.ai.conversation_starter}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {error && <p className="text-xs text-red-400 mb-3 text-center">{error}</p>}
                    {showCheckinFlow ? (
                      mySkippedCheckIn && partnerSkippedCheckIn ? (
                        isDismissPending || isResetCheckinPending ? (
                          <div className="flex items-center justify-center gap-2 h-14 rounded-full bg-white/[0.06] border border-white/16">
                            <motion.div
                              className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white/60"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                            />
                            <span className="text-sm font-semibold text-white/60">One moment…</span>
                          </div>
                        ) : (
                          <BothSkippedScreen
                            onReset={() => startResetCheckinTransition(async () => {
                              const result = await resetCheckinSkip();
                              if (result.error) setError(result.error);
                              else router.refresh();
                            })}
                            onDismiss={() => startDismissTransition(async () => {
                              wasDismissedRef.current = true;
                              const result = await dismissDate();
                              if (result.error) {
                                wasDismissedRef.current = false;
                                setError(result.error);
                              } else {
                                router.refresh();
                              }
                            })}
                          />
                        )
                      ) : myCheckedIn && partnerDecided ? (
                        dateIdeaId ? (
                          <PhotoChallenge
                            dateIdeaId={dateIdeaId}
                            profileId={profileId}
                            myUserId={myUserId}
                            dateName={dateIdea.display_name}
                            planType={planType}
                            onComplete={handlePhotoComplete}
                          />
                        ) : null
                      ) : mySkippedCheckIn && partnerDecided ? (
                        <div className="flex items-center justify-center gap-2.5 h-14 rounded-full bg-amber-500/10 border border-amber-500/25">
                          <motion.div
                            className="w-3.5 h-3.5 rounded-full border-2 border-amber-400/40 border-t-amber-400"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                          />
                          <span className="text-sm font-semibold text-amber-300">
                            Waiting for {(memberRole === "owner" ? partnerNames.partner2 : partnerNames.partner1) || "partner"} to capture the moment…
                          </span>
                        </div>
                      ) : myDecided && !partnerDecided ? (
                        <div className="flex items-center justify-center gap-2.5 h-14 rounded-full bg-amber-500/10 border border-amber-500/25">
                          <motion.div
                            className="w-3.5 h-3.5 rounded-full border-2 border-amber-400/40 border-t-amber-400"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                          />
                          <span className="text-sm font-semibold text-amber-300">
                            Waiting for {(memberRole === "owner" ? partnerNames.partner2 : partnerNames.partner1) || "partner"}…
                          </span>
                        </div>
                      ) : isSkipPending ? (
                        <div className="flex items-center justify-center gap-2 h-14 rounded-full bg-white/[0.06] border border-white/16">
                          <motion.div
                            className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white/60"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                          />
                          <span className="text-sm font-semibold text-white/60">Recording…</span>
                        </div>
                      ) : (
                        <>
                          <CheckInButton
                            partnerName={(memberRole === "owner" ? partnerNames.partner2 : partnerNames.partner1) || "partner"}
                            partnerCheckedIn={partnerCheckedIn}
                            partnerSkipped={partnerDecided && partnerSkippedCheckIn}
                            unitSystem={unitSystem}
                          />
                          <Button variant="ghost" size="lg" className="w-full mt-1" onClick={() => setSkipDialogOpen(true)}>
                            Skip
                          </Button>
                        </>
                      )
                    ) : dateIdeaId ? (
                      <PhotoChallenge
                        dateIdeaId={dateIdeaId}
                        profileId={profileId}
                        myUserId={myUserId}
                        dateName={dateIdea.display_name}
                        planType={planType}
                        onComplete={() => router.refresh()}
                      />
                    ) : isCompletePending ? (
                      <div className="flex items-center justify-center gap-2 h-14 rounded-full bg-green-500/20 border border-green-500/30">
                        <motion.div
                          className="w-3.5 h-3.5 rounded-full border-2 border-green-400/40 border-t-green-400"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="text-sm font-semibold text-green-300">Saving...</span>
                      </div>
                    ) : (
                      <>
                        <HoldToCompleteButton onComplete={handleComplete} />
                        <p className="text-center text-xs text-white/50 mt-1.5">Press and hold to confirm</p>
                      </>
                    )}
                  </>

                ) : isHomeDateIdea ? (
                  /* ── ACCEPTED HOME DATE ── */
                  <>
                    {myCheckedIn && partnerDecided ? (
                      dateIdeaId ? (
                        <PhotoChallenge
                          dateIdeaId={dateIdeaId}
                          profileId={profileId}
                          myUserId={myUserId}
                          dateName={(dateIdea as AIDateIdea).title}
                          planType={planType}
                          onComplete={handlePhotoComplete}
                        />
                      ) : null
                    ) : (
                      <HomeDateCard
                        idea={dateIdea as AIDateIdea & { location_type: "home" }}
                        partnerName={(memberRole === "owner" ? partnerNames.partner2 : partnerNames.partner1) || "partner"}
                        myCheckedIn={myCheckedIn}
                        partnerCheckedIn={partnerCheckedIn}
                        unitSystem={unitSystem}
                      />
                    )}
                    {error && <p className="text-xs text-red-400 mt-3 text-center">{error}</p>}
                  </>

                ) : (
                  /* ── ACCEPTED AI ── */
                  <>
                    <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.025] rounded-2xl p-5 mb-4 text-center border border-white/16">
                      <h3 className="text-xl font-bold text-white mb-1">{dateIdea.title}</h3>
                      <p className="text-xs text-white/70 font-medium">{dateIdea.vibe}</p>
                    </div>

                    <p className="text-white/60 text-sm leading-relaxed mb-4">{dateIdea.description}</p>

                    {dateIdea.mission && (
                      <div className="bg-white/[0.035] border border-white/16 rounded-2xl px-4 py-3 mb-4">
                        <p className="text-xs font-semibold text-white/65 uppercase tracking-wider mb-1">The plan</p>
                        <p className="text-sm text-white/70 leading-relaxed">{dateIdea.mission}</p>
                      </div>
                    )}

                    {!isFree && dateIdea.preparation && (
                      <div className="bg-white/[0.035] border border-white/16 rounded-2xl px-4 py-3 mb-4">
                        <p className="text-xs font-semibold text-white/65 uppercase tracking-wider mb-1">Before you go</p>
                        <p className="text-sm text-white/70 leading-relaxed">{dateIdea.preparation}</p>
                      </div>
                    )}

                    {!isFree && dateIdea.conversation_starter && (
                      <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl px-4 py-3 mb-4">
                        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Conversation starter</p>
                        <p className="text-sm text-white/70 leading-relaxed">{dateIdea.conversation_starter}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { icon: Timer, value: dateIdea.duration },
                        { icon: Wallet, value: formatBudgetRange(dateIdea.budget_range, unitSystem) },
                        { icon: MapPin, value: dateIdea.tags[0] ?? "Anywhere" },
                      ].map(({ icon: Icon, value }) => (
                        <div key={value} className="flex flex-col items-center gap-1 bg-white/[0.035] rounded-2xl p-3 border border-white/16">
                          <Icon className="w-3.5 h-3.5 text-white/65" />
                          <span className="text-xs text-white/60 text-center leading-tight">{value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {dateIdea.tags.map((tag) => (
                        <span key={tag} className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/16 text-xs text-white/70">{tag}</span>
                      ))}
                    </div>

                    {error && <p className="text-xs text-red-400 mb-3 text-center">{error}</p>}
                    {dateIdeaId ? (
                      <PhotoChallenge
                        dateIdeaId={dateIdeaId}
                        profileId={profileId}
                        myUserId={myUserId}
                        dateName={(dateIdea as AIDateIdea).title}
                        planType={planType}
                        onComplete={() => router.refresh()}
                      />
                    ) : isCompletePending ? (
                      <div className="flex items-center justify-center gap-2 h-14 rounded-full bg-green-500/20 border border-green-500/30">
                        <motion.div
                          className="w-3.5 h-3.5 rounded-full border-2 border-green-400/40 border-t-green-400"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="text-sm font-semibold text-green-300">Saving...</span>
                      </div>
                    ) : (
                      <>
                        <HoldToCompleteButton onComplete={handleComplete} />
                        <p className="text-center text-xs text-white/50 mt-1.5">Press and hold to confirm</p>
                      </>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              /* ── LOCKED STATE ── */
              <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {!(dateIdea && dateTeaser && !revealed) && successMessage && (
                  <p className="text-xs text-emerald-300 mb-3 text-center">{successMessage}</p>
                )}
                {!(dateIdea && dateTeaser && !revealed) && error && (
                  <p className="text-xs text-red-400 mb-3 text-center">{error}</p>
                )}

                {dateIdea && dateTeaser && !revealed ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { icon: Sparkles, label: "Vibe", value: dateTeaser.vibe },
                          { icon: Timer, label: "Activity level", value: dateTeaser.activity_level },
                          { icon: Wallet, label: "Price", value: formatBudgetRange(dateTeaser.price, unitSystem) },
                          { icon: MapPin, label: "The hook", value: dateTeaser.hook },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="flex items-center gap-3 py-1.5">
                            <Icon className="h-4 w-4 shrink-0 text-white/60" />
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">{label}</p>
                              <p className="mt-0.5 text-sm font-semibold leading-snug text-white/80 line-clamp-2">{label === "The hook" ? `${value}…` : value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {successMessage && <p className="text-xs text-emerald-300 text-center">{successMessage}</p>}
                    {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                    <Button size="lg" className="w-full" disabled={currentUserReady} onClick={!currentUserReady ? handleReveal : undefined}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {currentUserReady ? "Waiting for partner" : "I'm ready"}
                    </Button>
                    {!currentUserReady && (
                      <Button
                        size="md"
                        variant="outline"
                        disabled={!canReroll}
                        onClick={() => {
                          if (!canReroll) return;
                          if (otherPartnerReady) {
                            setError("Your partner already accepted this date.");
                            return;
                          }
                          setRerollModalOpen(true);
                        }}
                        className="w-full"
                      >
                        Not feeling it?
                      </Button>
                    )}
                  </div>
                ) : !hasAcceptedPartner ? (
                  <div className="rounded-2xl bg-white/[0.035] border border-white/16 p-5 flex flex-col gap-4">
                    <div>
                      <p className="text-base font-bold text-white mb-1">
                        {partnerInviteCopy.title}
                      </p>
                      <p className="text-sm text-white/60 leading-relaxed">
                        {partnerInviteCopy.subtitle}
                      </p>
                    </div>
                    <Button size="lg" className="w-full" onClick={() => setPartnerInviteModalOpen(true)}>
                      {partnerInviteCopy.button}
                    </Button>
                  </div>
                ) : isPending ? (
                  <div className="rounded-2xl bg-white/[0.035] border border-white/16 p-5 flex flex-col items-center gap-3 py-8">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-white/70"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={loadingMsgIndex}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.4 }}
                        className="text-sm text-white/50 text-center px-4"
                      >
                        {(isRerollPending
                          ? REROLL_MESSAGES
                          : pendingLocationType === "home"
                          ? HOME_LOADING_MESSAGES
                          : LOADING_MESSAGES)[loadingMsgIndex % (isRerollPending
                            ? REROLL_MESSAGES.length
                            : pendingLocationType === "home"
                            ? HOME_LOADING_MESSAGES.length
                            : LOADING_MESSAGES.length)]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/[0.035] border border-white/16 p-5 flex flex-col gap-4">
                    <div>
                      <p className="text-base font-bold text-white mb-1">Ready for your next date night?</p>
                      <p className="text-sm text-white/60 leading-relaxed">
                        Initiate a date night to get a private teaser. When both of you are ready, the full plan will reveal.
                      </p>
                    </div>
                    <Button size="lg" className="w-full" disabled={!canReveal} onClick={canReveal ? handleStartDate : undefined}>
                      {canReveal
                        ? "Initiate date night"
                        : nextRevealDate
                        ? `Available ${formatRelative(nextRevealDate)}`
                        : "Not available yet"}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Location picker modal — shown when both outside + home prefs are enabled */}
      <LocationPickerModal
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onSelect={executeStartDate}
      />

      {/* Skip check-in confirmation dialog */}
      <Dialog open={skipDialogOpen} onClose={() => setSkipDialogOpen(false)} className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-5 h-5 text-rose-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Skip check-in?</h3>
        <p className="text-sm text-white/55 mb-6">Checking in at the venue proves you made it — skip and you&apos;ll miss out on [placeholder: bonus XP, streak credit, etc.].</p>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" onClick={() => setSkipDialogOpen(false)} className="w-full">
            Never mind
          </Button>
          <Button type="button" variant="ghost" onClick={handleSkipCheckIn} className="w-full">
            Skip anyway
          </Button>
        </div>
      </Dialog>

      {/* Bottom sheet — venue date details */}
      {dateIdea && isVenue(dateIdea) && dateIdea.ai && (
        <Drawer
          open={!!activeSheet}
          onClose={() => setActiveSheet(null)}
          title={
            activeSheet === "description" ? "Description" :
            activeSheet === "mission" ? "Your mission" :
            activeSheet === "preparation" ? "Before you go" :
            "Conversation starter"
          }
        >
          {activeSheet === "description" && (
            <p className="text-sm leading-relaxed text-white/70">{dateIdea.ai.description}</p>
          )}
          {activeSheet === "mission" && (
            <p className="text-sm leading-relaxed text-white/75">{dateIdea.ai.mission}</p>
          )}
          {activeSheet === "preparation" && (
            <p className="text-sm leading-relaxed text-white/70">{dateIdea.ai.preparation}</p>
          )}
          {activeSheet === "conversation" && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">Ask:</p>
              <p className="text-sm leading-relaxed text-white/70">{dateIdea.ai.conversation_starter}</p>
            </div>
          )}
        </Drawer>
      )}

      {/* Partner invite modal */}
      <Dialog open={partnerInviteModalOpen} onClose={() => setPartnerInviteModalOpen(false)}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-2xl bg-white/[0.045] border border-white/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-white/65" />
          </div>
          <button
            type="button"
            onClick={() => setPartnerInviteModalOpen(false)}
            className="w-8 h-8 rounded-xl bg-white/[0.035] flex items-center justify-center hover:bg-white/[0.075] transition-colors"
            aria-label="Close partner invite dialog"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-white mb-3">Partner access</h3>

        {partnerInviteState === "accepted" ? (
          <p className="text-xs leading-relaxed text-emerald-300">
            Your partner is connected and can use Date, Progress, and date settings.
          </p>
        ) : memberRole === "owner" ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs leading-relaxed text-white/50">
              Invite your partner to create an account. Dates unlock once both of you tap reveal.
            </p>
            {partnerInviteState !== "none" && partnerInvitedEmail && (
              <p className="text-xs text-white/45">
                Current invite: {partnerInvitedEmail}
                {partnerInviteState === "expired" ? " (expired)" : ""}
              </p>
            )}
            <Input
              label="Partner email"
              type="email"
              value={partnerInviteEmail}
              onChange={(e) => setPartnerInviteEmail(e.target.value)}
              placeholder="partner@example.com"
            />
            {partnerInviteError && <p className="text-xs text-red-400">{partnerInviteError}</p>}
            {partnerInviteMessage && <p className="text-xs text-emerald-300">{partnerInviteMessage}</p>}
            <Button
              type="button"
              loading={partnerInviteSending}
              onClick={handlePartnerInvite}
              className="w-full"
            >
              {partnerInviteState === "none" ? "Send invite" : "Send new invite"}
            </Button>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-white/50">
            Ask the account owner to send a partner invite.
          </p>
        )}
      </Dialog>

      {/* Re-roll confirmation modal */}
      <Dialog open={rerollModalOpen} onClose={() => setRerollModalOpen(false)}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-2xl bg-white/[0.045] border border-white/10 flex items-center justify-center">
            <Shuffle className="w-5 h-5 text-white/65" />
          </div>
          <button
            type="button"
            onClick={() => setRerollModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/[0.035] flex items-center justify-center hover:bg-white/[0.075] transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-white mb-2">Try a different date?</h3>

        {isFree ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-3 py-2.5 mb-4">
            <p className="text-xs text-amber-300 leading-relaxed">
              <span className="font-semibold">Starter plan:</span>{" "}
              <span className="font-bold">1 re-roll total — use it wisely.</span> Once gone, dates are final.
            </p>
          </div>
        ) : (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-3 py-2.5 mb-4">
            <p className="text-xs text-blue-300 leading-relaxed">
              You get <span className="font-bold">1 swap per date</span>. We&apos;ll find you something different.
            </p>
          </div>
        )}

        <p className="text-xs text-white/55 mb-5">
          The current date idea will be saved so you won&apos;t see it again.
        </p>

        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={handleRerollConfirm}>
            {isFree ? "Yes, try another" : "Find another date"}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setRerollModalOpen(false)}>
            Keep this date
          </Button>
        </div>
      </Dialog>

      {/* Accept confirmation modal */}
      <Dialog open={acceptConfirmOpen} onClose={() => setAcceptConfirmOpen(false)}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-2xl bg-white/[0.045] border border-white/10 flex items-center justify-center">
            <Check className="w-5 h-5 text-white/65" />
          </div>
          <button
            type="button"
            onClick={() => setAcceptConfirmOpen(false)}
            className="w-8 h-8 rounded-xl bg-white/[0.035] flex items-center justify-center hover:bg-white/[0.075] transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-white mb-2">Reveal this date?</h3>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-3 py-2.5 mb-4">
          <p className="text-xs text-amber-300 leading-relaxed">
            Once revealed, you <span className="font-bold">won&apos;t be able to swap</span> this date.
            {isFree && " You still have your 1 lifetime swap — you can use it on this date or save it for a future one."}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={() => { setAcceptConfirmOpen(false); handleAccept(); }}>
            Reveal it
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setAcceptConfirmOpen(false)}>
            Let me think
          </Button>
        </div>
      </Dialog>

      {/* Success modal */}
      {modalData && (
        <CompleteDateModal
          isOpen={!!modalData}
          xpGained={modalData.xpGained}
          newTotalXp={modalData.newTotalXp}
          newLevel={modalData.newLevel}
          newBadges={modalData.newBadges}
          gated={modalData.gated}
          dateIdeaId={modalData.dateIdeaId}
          onClose={() => setModalData(null)}
          onGoToProgress={() => { setModalData(null); onGoToProgress(); }}
        />
      )}
    </>
  );
}


