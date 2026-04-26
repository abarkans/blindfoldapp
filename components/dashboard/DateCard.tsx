"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, Clock, Unlock, MapPin, Timer, Wallet, CheckCircle2, CalendarClock, Navigation, Star, Shuffle, Check, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { revealDate } from "@/app/actions/reveal";
import { completeDate } from "@/app/actions/complete-date";
import { acceptDate } from "@/app/actions/accept-date";
import { rerollDate } from "@/app/actions/reroll";
import type { CompleteDateResult } from "@/lib/types";
import CompleteDateModal from "@/components/dashboard/CompleteDateModal";
import { getPriceLevelLabel, type VenueAIEnrichment } from "@/lib/places/search";

const LOADING_MESSAGES = [
  "Scanning the city for your perfect spot...",
  "Checking out hidden gems near you...",
  "Finding venues with a little magic...",
  "Crafting something deliciously unexpected...",
  "Personalising your next adventure...",
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

// AI-generated idea shape
interface AIDateIdea {
  title: string;
  description: string;
  mission?: string;
  emoji: string;
  vibe: string;
  duration: string;
  budget_range: string;
  tags: string[];
}

// Google Places venue shape
interface VenueDateIdea {
  type: "venue";
  place_id: string;
  display_name: string;
  formatted_address: string;
  photo_name: string | null;
  rating: number;
  price_level: string;
  ai: VenueAIEnrichment | null;
}

type DateIdea = AIDateIdea | VenueDateIdea;

function isVenue(idea: DateIdea): idea is VenueDateIdea {
  return (idea as VenueDateIdea).type === "venue";
}

interface DateCardProps {
  partnerNames: { partner1: string; partner2: string };
  cadence: string;
  revealedAt: string | null;
  dateIdea: DateIdea | null;
  isDateCompleted: boolean;
  onGoToProgress: () => void;
  planType: string;
  totalRerollsUsed: number;
  currentDateRerolled: boolean;
  dateAcceptedAt: string | null;
}

function getNextRevealDate(revealedAt: string, cadence: string): Date {
  const cadenceDays: Record<string, number> = {
    weekly: 7,
    biweekly: 14,
    monthly: 30,
    spontaneous: 3,
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
      className="relative w-full h-14 rounded-2xl overflow-hidden select-none cursor-pointer"
      style={{ WebkitUserSelect: "none", touchAction: "none" }}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="absolute inset-0 rounded-2xl bg-green-500/15 border border-green-500/30" />
      <div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-md shadow-green-500/30"
        style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0 round 16px)` }}
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

export default function DateCard({
  partnerNames,
  cadence,
  revealedAt,
  dateIdea,
  isDateCompleted,
  onGoToProgress,
  planType,
  totalRerollsUsed,
  currentDateRerolled,
  dateAcceptedAt,
}: DateCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isCompletePending, startCompleteTransition] = useTransition();
  const [isRerollPending, startRerollTransition] = useTransition();
  const [error, setError] = useState("");
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [revealed, setRevealed] = useState(
    !!dateIdea && !!revealedAt && !isRevealAvailable(revealedAt, cadence)
  );
  const [completed, setCompleted] = useState(isDateCompleted);
  const [accepted, setAccepted] = useState(!!dateAcceptedAt);
  const [rerollModalOpen, setRerollModalOpen] = useState(false);
  const [modalData, setModalData] = useState<CompleteDateResult | null>(null);

  // Sync accepted state when the server updates dateAcceptedAt (after reroll resets it)
  useEffect(() => { setAccepted(!!dateAcceptedAt); }, [dateAcceptedAt]);

  const isFree = planType !== "subscription";
  const canReroll = isFree ? totalRerollsUsed < 1 : !currentDateRerolled;

  const canReveal = isRevealAvailable(revealedAt, cadence);
  const nextRevealDate = revealedAt ? getNextRevealDate(revealedAt, cadence) : null;
  const countdown = useCountdown(completed && nextRevealDate ? nextRevealDate : null);

  const isLoading = isPending || isRerollPending;

  useEffect(() => {
    if (!isLoading) return;
    setLoadingMsgIndex(Math.floor(Math.random() * LOADING_MESSAGES.length));
    const messages = isRerollPending ? REROLL_MESSAGES : LOADING_MESSAGES;
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading, isRerollPending]);

  function handleReveal() {
    setError("");
    startTransition(async () => {
      try {
        await revealDate();
        setRevealed(true);
        setCompleted(false);
        setAccepted(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleAccept() {
    setAccepted(true); // optimistic — server confirms via revalidatePath
    acceptDate().catch(() => setAccepted(false));
  }

  function handleRerollConfirm() {
    setRerollModalOpen(false);
    setError("");
    startRerollTransition(async () => {
      try {
        await rerollDate();
        // dateIdea prop updates via RSC re-render; accepted syncs via useEffect
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleComplete() {
    setError("");
    startCompleteTransition(async () => {
      try {
        const result = await completeDate();
        setCompleted(true);
        setModalData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <>
      {/* Countdown card — shown first when date is completed */}
      {completed && countdown && nextRevealDate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-4 h-4 text-rose-400" />
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Next mystery date</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: countdown.days, label: "Days" },
              { value: countdown.hours, label: "Hours" },
              { value: countdown.minutes, label: "Mins" },
              { value: countdown.seconds, label: "Secs" },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/5 border border-white/8 rounded-2xl py-3 text-center">
                <p className="text-2xl font-black text-white tabular-nums">{String(value).padStart(2, "0")}</p>
                <p className="text-[10px] text-white/35 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/25 text-center mt-3">
            Available on{" "}
            {nextRevealDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-sm"
      >
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">
                {completed ? "Completed Date" : revealed ? "Current Date" : "Mystery Date"}
              </span>
            </div>
            {nextRevealDate && !canReveal && (
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                <Clock className="w-3 h-3 text-white/50" />
                <span className="text-xs text-white/50">Next {formatRelative(nextRevealDate)}</span>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {/* ── REVEALED STATE ── */}
            {revealed && dateIdea ? (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {completed ? (
                  /* ── COMPLETED: collapsed card ── */
                  <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-4">
                    {isVenue(dateIdea) ? (
                      <MapPin className="w-7 h-7 text-pink-400 shrink-0" />
                    ) : (
                      <span className="text-3xl shrink-0">{dateIdea.emoji}</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {isVenue(dateIdea) ? dateIdea.display_name : dateIdea.title}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {isVenue(dateIdea) ? dateIdea.formatted_address : dateIdea.vibe}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400">Done</span>
                    </div>
                  </div>

                ) : isRerollPending ? (
                  /* ── REROLLING: loading state ── */
                  <div className="flex flex-col items-center gap-3 py-8">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-rose-400"
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
                    <div className="bg-gradient-to-br from-rose-500/15 to-violet-600/10 border border-rose-500/20 rounded-2xl p-4 text-center">
                      {isVenue(dateIdea) ? (
                        <>
                          <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center mx-auto mb-3">
                            <MapPin className="w-6 h-6 text-rose-400" />
                          </div>
                          <p className="text-base font-bold text-white mb-1">{dateIdea.display_name}</p>
                          <div className="flex items-center justify-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-xs text-white/50">{dateIdea.rating.toFixed(1)}</span>
                            {dateIdea.ai?.vibe && (
                              <>
                                <span className="text-white/20">·</span>
                                <span className="text-xs text-rose-300">{dateIdea.ai.vibe}</span>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-4xl mb-3">{dateIdea.emoji}</div>
                          <p className="text-base font-bold text-white mb-1">{dateIdea.title}</p>
                          <p className="text-xs text-rose-300">{dateIdea.vibe}</p>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-white/35 text-center">
                      Does this date spark your interest, or shall we roll the dice again?
                    </p>

                    {error && <p className="text-xs text-red-400 text-center">{error}</p>}

                    <div className="grid grid-cols-2 gap-3">
                      {/* Re-roll button */}
                      <button
                        type="button"
                        disabled={!canReroll}
                        onClick={() => canReroll && setRerollModalOpen(true)}
                        className={[
                          "flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border text-sm font-semibold transition-all active:scale-95",
                          canReroll
                            ? "bg-white/5 border-white/15 text-white/70 hover:border-white/30 hover:text-white"
                            : "bg-white/3 border-white/8 text-white/25 cursor-not-allowed",
                        ].join(" ")}
                      >
                        <Shuffle className="w-4 h-4" />
                        Re-roll
                        <span className={`text-[10px] font-normal ${canReroll ? "text-white/35" : "text-white/20"}`}>
                          {isFree
                            ? totalRerollsUsed >= 1 ? "No rolls left" : "1 left (lifetime)"
                            : currentDateRerolled ? "Used for this date" : "1 per date"}
                        </span>
                      </button>

                      {/* Accept button */}
                      <button
                        type="button"
                        onClick={handleAccept}
                        className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border bg-gradient-to-br from-pink-500/20 to-rose-500/10 border-pink-500/50 text-pink-200 text-sm font-semibold hover:from-pink-500/30 hover:border-pink-400/60 transition-all active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        Accept Date
                        <span className="text-[10px] font-normal text-pink-300/50">Let&apos;s do this!</span>
                      </button>
                    </div>
                  </motion.div>

                ) : isVenue(dateIdea) ? (
                  /* ── ACCEPTED VENUE ── */
                  <>
                    <div className="relative rounded-2xl overflow-hidden mb-4 bg-white/5 border border-white/8">
                      {dateIdea.photo_name ? (
                        <img
                          src={`/api/place-photo?ref=${encodeURIComponent(dateIdea.photo_name)}`}
                          alt={dateIdea.display_name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center">
                          <MapPin className="w-10 h-10 text-white/20" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-white">{dateIdea.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    {dateIdea.ai ? (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{dateIdea.ai.emoji}</span>
                          <h3 className="text-xl font-bold text-white">{dateIdea.ai.title}</h3>
                        </div>
                        <p className="text-xs text-rose-300 font-medium mb-1">{dateIdea.ai.vibe}</p>
                        <p className="text-sm text-white/50">{dateIdea.display_name} · {dateIdea.formatted_address}</p>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-white mb-1">{dateIdea.display_name}</h3>
                        <p className="text-sm text-white/50">{dateIdea.formatted_address}</p>
                      </div>
                    )}

                    {dateIdea.ai?.description && (
                      <p className="text-white/60 text-sm leading-relaxed mb-4">{dateIdea.ai.description}</p>
                    )}

                    {dateIdea.ai?.mission && (
                      <div className="bg-violet-500/8 border border-violet-500/20 rounded-2xl px-4 py-3 mb-4">
                        <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-1">Your mission</p>
                        <p className="text-sm text-white/70 leading-relaxed">{dateIdea.ai.mission}</p>
                      </div>
                    )}

                    {dateIdea.ai && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { icon: Timer, value: dateIdea.ai.duration },
                          { icon: Wallet, value: dateIdea.ai.budget_range || getPriceLevelLabel(dateIdea.price_level) },
                          { icon: Star, value: `${dateIdea.rating.toFixed(1)} ★` },
                        ].map(({ icon: Icon, value }) => (
                          <div key={value} className="flex flex-col items-center gap-1 bg-white/5 rounded-2xl p-3 border border-white/8">
                            <Icon className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-xs text-white/60 text-center leading-tight">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {dateIdea.ai?.tags && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {dateIdea.ai.tags.map((tag) => (
                          <span key={tag} className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">{tag}</span>
                        ))}
                      </div>
                    )}

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dateIdea.display_name)}&query_place_id=${dateIdea.place_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl bg-transparent border border-rose-500 text-white text-sm font-semibold mb-4 hover:border-rose-400 hover:bg-rose-500/10 transition-all active:scale-95"
                    >
                      <Navigation className="w-4 h-4" />
                      Navigate to Date
                    </a>

                    {error && <p className="text-xs text-red-400 mb-3 text-center">{error}</p>}
                    {isCompletePending ? (
                      <div className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-green-500/20 border border-green-500/30">
                        <motion.div
                          className="w-3.5 h-3.5 rounded-full border-2 border-green-400/40 border-t-green-400"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="text-sm font-semibold text-green-300">Saving...</span>
                      </div>
                    ) : (
                      <HoldToCompleteButton onComplete={handleComplete} />
                    )}
                  </>

                ) : (
                  /* ── ACCEPTED AI ── */
                  <>
                    <div className="bg-gradient-to-br from-rose-500/20 to-violet-600/10 rounded-2xl p-5 mb-4 text-center border border-rose-500/20">
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                        className="text-5xl mb-3"
                      >
                        {dateIdea.emoji}
                      </motion.div>
                      <h3 className="text-xl font-bold text-white mb-1">{dateIdea.title}</h3>
                      <p className="text-xs text-rose-300 font-medium">{dateIdea.vibe}</p>
                    </div>

                    <p className="text-white/60 text-sm leading-relaxed mb-4">{dateIdea.description}</p>

                    {dateIdea.mission && (
                      <div className="bg-violet-500/8 border border-violet-500/20 rounded-2xl px-4 py-3 mb-4">
                        <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-1">Your mission</p>
                        <p className="text-sm text-white/70 leading-relaxed">{dateIdea.mission}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { icon: Timer, value: dateIdea.duration },
                        { icon: Wallet, value: dateIdea.budget_range },
                        { icon: MapPin, value: dateIdea.tags[0] ?? "Anywhere" },
                      ].map(({ icon: Icon, value }) => (
                        <div key={value} className="flex flex-col items-center gap-1 bg-white/5 rounded-2xl p-3 border border-white/8">
                          <Icon className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-xs text-white/60 text-center leading-tight">{value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {dateIdea.tags.map((tag) => (
                        <span key={tag} className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">{tag}</span>
                      ))}
                    </div>

                    {error && <p className="text-xs text-red-400 mb-3 text-center">{error}</p>}
                    {isCompletePending ? (
                      <div className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-green-500/20 border border-green-500/30">
                        <motion.div
                          className="w-3.5 h-3.5 rounded-full border-2 border-green-400/40 border-t-green-400"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="text-sm font-semibold text-green-300">Saving...</span>
                      </div>
                    ) : (
                      <HoldToCompleteButton onComplete={handleComplete} />
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              /* ── LOCKED STATE ── */
              <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="relative rounded-2xl overflow-hidden mb-5">
                  <div className="bg-gradient-to-br from-rose-500/20 to-violet-600/20 p-6 text-center">
                    <div className="flex flex-col items-center gap-3 blur-sm select-none pointer-events-none">
                      <div className="h-10 w-10 rounded-full bg-white/20" />
                      <div className="h-5 w-40 rounded-full bg-white/20" />
                      <div className="h-3 w-32 rounded-full bg-white/15" />
                      <div className="h-3 w-44 rounded-full bg-white/10" />
                    </div>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <motion.div
                      animate={canReveal ? { y: [0, -5, 0] } : {}}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm"
                    >
                      {canReveal ? <Unlock className="w-6 h-6 text-rose-300" /> : <Lock className="w-6 h-6 text-white/40" />}
                    </motion.div>
                    <p className="text-white/60 text-sm font-medium">
                      {canReveal ? "Ready to reveal!" : "Your date is brewing…"}
                    </p>
                    <p className="text-white/30 text-xs">{partnerNames.partner1} &amp; {partnerNames.partner2}</p>
                  </div>
                </div>

                <div className="flex gap-2 mb-5">
                  {["Surprise", "??–?? hrs", "€??"].map((hint) => (
                    <div key={hint} className="px-3 py-1 rounded-full bg-white/8 border border-white/10 text-xs text-white/30 blur-[2px]">{hint}</div>
                  ))}
                </div>

                {error && <p className="text-xs text-red-400 mb-3 text-center">{error}</p>}

                {isPending ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-rose-400"
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
                        {LOADING_MESSAGES[loadingMsgIndex]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                ) : (
                  <Button size="lg" className="w-full" disabled={!canReveal} onClick={canReveal ? handleReveal : undefined}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {canReveal
                      ? "Reveal Mystery Date"
                      : nextRevealDate
                      ? `Available ${formatRelative(nextRevealDate)}`
                      : "Not available yet"}
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── RE-ROLL CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {rerollModalOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRerollModalOpen(false)}
            />
            <motion.div
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-xs px-4"
              initial={{ opacity: 0, scale: 0.88, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <div className="bg-[#13131f] border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/60">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                    <Shuffle className="w-5 h-5 text-violet-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setRerollModalOpen(false)}
                    className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">Re-roll this date?</h3>

                {isFree ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-3 py-2.5 mb-4">
                    <p className="text-xs text-amber-300 leading-relaxed">
                      <span className="font-semibold">Basic plan:</span> You only get{" "}
                      <span className="font-bold">1 re-roll for life</span>. Once used, future dates can&apos;t be changed.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-white/50 mb-4 leading-relaxed">
                    You get <span className="text-white font-medium">1 re-roll per date</span> as a subscriber. A brand-new mystery date will be generated.
                  </p>
                )}

                <p className="text-xs text-white/30 mb-5">
                  The current date idea will be saved so you won&apos;t see it again.
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleRerollConfirm}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/20 hover:from-violet-400 hover:to-purple-500 transition-all active:scale-[0.98]"
                  >
                    {isFree ? "Use my re-roll" : "Re-roll date"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRerollModalOpen(false)}
                    className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-semibold text-sm hover:border-white/20 transition-colors"
                  >
                    Keep this date
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success modal */}
      {modalData && (
        <CompleteDateModal
          isOpen={!!modalData}
          xpGained={modalData.xpGained}
          newTotalXp={modalData.newTotalXp}
          newLevel={modalData.newLevel}
          newBadges={modalData.newBadges}
          onClose={() => setModalData(null)}
          onGoToProgress={() => { setModalData(null); onGoToProgress(); }}
        />
      )}
    </>
  );
}
