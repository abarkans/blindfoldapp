"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, Clock, Unlock, MapPin, Timer, Wallet, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { revealDate } from "@/app/actions/reveal";
import { completeDate } from "@/app/actions/complete-date";
import type { CompleteDateResult } from "@/lib/types";
import CompleteDateModal from "@/components/dashboard/CompleteDateModal";

const LOADING_MESSAGES = [
  "Consulting the stars for your perfect night...",
  "Sprinkling a little magic on your evening...",
  "Whispering to the city about your vibes...",
  "Crafting something deliciously unexpected...",
  "Personalising your next adventure...",
  "The universe is planning something special...",
  "Reading your love language...",
  "Mixing mystery with a dash of romance...",
];

interface DateIdea {
  title: string;
  description: string;
  emoji: string;
  vibe: string;
  duration: string;
  budget_range: string;
  tags: string[];
}

interface DateCardProps {
  partnerNames: { partner1: string; partner2: string };
  cadence: string;
  revealedAt: string | null;
  dateIdea: DateIdea | null;
  isDateCompleted: boolean;
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
      className="relative w-full h-12 rounded-2xl overflow-hidden select-none cursor-pointer"
      style={{ WebkitUserSelect: "none", touchAction: "none" }}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Track background */}
      <div className="absolute inset-0 rounded-2xl bg-orange-500/15 border border-orange-500/30" />
      {/* Fill — reveals gradient from left via clip-path */}
      <div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 shadow-md shadow-orange-500/30"
        style={{
          clipPath: `inset(0 ${(1 - progress) * 100}% 0 0 round 16px)`,
        }}
      />
      {/* Label */}
      <div className="relative z-10 flex items-center justify-center gap-2 h-full px-4">
        <CheckCircle2
          className={`w-4 h-4 transition-colors duration-150 ${
            progress > 0.5 ? "text-white" : "text-orange-400"
          }`}
        />
        <span
          className={`text-sm font-semibold transition-colors duration-150 ${
            progress > 0.5 ? "text-white" : "text-orange-300"
          }`}
        >
          {label}
        </span>
      </div>
    </button>
  );
}

export default function DateCard({
  partnerNames,
  cadence,
  revealedAt,
  dateIdea,
  isDateCompleted,
}: DateCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isCompletePending, startCompleteTransition] = useTransition();
  const [error, setError] = useState("");
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [revealed, setRevealed] = useState(
    !!dateIdea && !!revealedAt && !isRevealAvailable(revealedAt, cadence)
  );
  const [completed, setCompleted] = useState(isDateCompleted);
  const [modalData, setModalData] = useState<CompleteDateResult | null>(null);

  const canReveal = isRevealAvailable(revealedAt, cadence);
  const nextRevealDate = revealedAt ? getNextRevealDate(revealedAt, cadence) : null;

  useEffect(() => {
    if (!isPending) return;
    setLoadingMsgIndex(Math.floor(Math.random() * LOADING_MESSAGES.length));
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isPending]);

  function handleReveal() {
    setError("");
    startTransition(async () => {
      try {
        await revealDate();
        setRevealed(true);
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-sm"
      >
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-semibold text-pink-400 uppercase tracking-widest">
                Mystery Date
              </span>
            </div>
            {nextRevealDate && !canReveal && (
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                <Clock className="w-3 h-3 text-white/50" />
                <span className="text-xs text-white/50">
                  Next {formatRelative(nextRevealDate)}
                </span>
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
                {/* Emoji + title */}
                <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/10 rounded-2xl p-5 mb-4 text-center border border-pink-500/20">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                    className="text-5xl mb-3"
                  >
                    {dateIdea.emoji}
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-1">{dateIdea.title}</h3>
                  <p className="text-xs text-pink-300 font-medium">{dateIdea.vibe}</p>
                </div>

                {/* Description */}
                <p className="text-white/60 text-sm leading-relaxed mb-4">
                  {dateIdea.description}
                </p>

                {/* Details row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { icon: Timer, value: dateIdea.duration },
                    { icon: Wallet, value: dateIdea.budget_range },
                    { icon: MapPin, value: dateIdea.tags[0] ?? "Anywhere" },
                  ].map(({ icon: Icon, value }) => (
                    <div
                      key={value}
                      className="flex flex-col items-center gap-1 bg-white/5 rounded-2xl p-3 border border-white/8"
                    >
                      <Icon className="w-3.5 h-3.5 text-pink-400" />
                      <span className="text-xs text-white/60 text-center leading-tight">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {dateIdea.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs text-pink-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Complete Date button / completed state */}
                {error && (
                  <p className="text-xs text-red-400 mb-3 text-center">{error}</p>
                )}
                {completed ? (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/8 text-white/40 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Date completed!</span>
                  </div>
                ) : isCompletePending ? (
                  <div className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30">
                    <motion.div
                      className="w-3.5 h-3.5 rounded-full border-2 border-orange-400/40 border-t-orange-400"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="text-sm font-semibold text-orange-300">Saving...</span>
                  </div>
                ) : (
                  <HoldToCompleteButton onComplete={handleComplete} />
                )}

                {/* Next date available footer */}
                {nextRevealDate && (
                  <div className="text-center py-3 mt-3 border-t border-white/8">
                    <p className="text-xs text-white/30">
                      Next mystery date available{" "}
                      <span className="text-white/50 font-medium">
                        {nextRevealDate.toLocaleDateString("en-GB", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              /* ── LOCKED STATE ── */
              <motion.div
                key="locked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Blurred preview */}
                <div className="relative rounded-2xl overflow-hidden mb-5">
                  <div className="bg-gradient-to-br from-pink-500/20 to-purple-600/20 p-6 text-center">
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
                      {canReveal ? (
                        <Unlock className="w-6 h-6 text-pink-300" />
                      ) : (
                        <Lock className="w-6 h-6 text-white/40" />
                      )}
                    </motion.div>
                    <p className="text-white/60 text-sm font-medium">
                      {canReveal ? "Ready to reveal!" : "Your date is brewing…"}
                    </p>
                    <p className="text-white/30 text-xs">
                      {partnerNames.partner1} &amp; {partnerNames.partner2}
                    </p>
                  </div>
                </div>

                {/* Hint chips (blurred) */}
                <div className="flex gap-2 mb-5">
                  {["Surprise", "??–?? hrs", "€??"].map((hint) => (
                    <div
                      key={hint}
                      className="px-3 py-1 rounded-full bg-white/8 border border-white/10 text-xs text-white/30 blur-[2px]"
                    >
                      {hint}
                    </div>
                  ))}
                </div>

                {error && (
                  <p className="text-xs text-red-400 mb-3 text-center">{error}</p>
                )}

                {isPending ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-pink-400"
                          animate={{ y: [0, -8, 0] }}
                          transition={{
                            duration: 0.9,
                            repeat: Infinity,
                            delay: i * 0.18,
                            ease: "easeInOut",
                          }}
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
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={!canReveal}
                    onClick={canReveal ? handleReveal : undefined}
                  >
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

      {/* Success modal — rendered outside the card so it can cover full screen */}
      {modalData && (
        <CompleteDateModal
          isOpen={!!modalData}
          xpGained={modalData.xpGained}
          newTotalXp={modalData.newTotalXp}
          newLevel={modalData.newLevel}
          newBadges={modalData.newBadges}
          onClose={() => setModalData(null)}
        />
      )}
    </>
  );
}
