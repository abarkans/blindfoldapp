"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Lock, Star } from "lucide-react";
import confetti, { type CreateTypes } from "canvas-confetti";
import Button from "@/components/ui/Button";
import { submitDateFeedback } from "@/app/actions/submit-feedback";

let _fire: CreateTypes | null = null;
function getFire(): CreateTypes {
  if (_fire) return _fire;
  if (typeof document === "undefined") return confetti as unknown as CreateTypes;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;width:100%;height:100%;z-index:9999";
  document.body.appendChild(canvas);
  _fire = confetti.create(canvas, { resize: true, useWorker: true });
  return _fire;
}

function FeedbackSection({
  rating,
  hovered,
  comment,
  onRate,
  onHover,
  onComment,
  onSubmit,
  submitted,
  submitting,
  divider = "bottom",
}: {
  rating: number | null;
  hovered: number | null;
  comment: string;
  onRate: (r: number | null) => void;
  onHover: (r: number | null) => void;
  onComment: (c: string) => void;
  onSubmit: () => void;
  submitted: boolean;
  submitting: boolean;
  divider?: "top" | "bottom";
}) {
  const cls =
    divider === "top"
      ? "border-t border-white/8 pt-4 mt-2 mb-4"
      : "border-b border-white/8 pb-4 mb-4";
  return (
    <motion.div
      className={cls}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.18 }}
    >
      <p className="text-xs text-white/45 text-center mb-3">How was your date?</p>
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !submitted && onRate(star === rating ? null : star)}
            onMouseEnter={() => !submitted && onHover(star)}
            onMouseLeave={() => onHover(null)}
            className="p-1.5 transition-transform active:scale-90 disabled:cursor-default"
            disabled={submitted}
          >
            <Star
              className={`w-7 h-7 transition-colors duration-100 ${
                star <= (hovered ?? rating ?? 0)
                  ? "text-amber-400 fill-amber-400"
                  : "text-white/20"
              }`}
            />
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.p
            key="confirmed"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-xs text-emerald-400 text-center"
          >
            ✓ Thanks for your feedback!
          </motion.p>
        ) : rating !== null ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-3"
          >
            <textarea
              value={comment}
              onChange={(e) => onComment(e.target.value)}
              placeholder="Add a note... (optional)"
              maxLength={500}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[16px] text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/20 transition-colors"
            />
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="mt-2 w-full py-2.5 rounded-xl bg-white/8 border border-white/15 text-sm font-semibold text-white hover:bg-white/12 transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Submit rating"}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

const BADGE_IMAGES: Record<string, string> = {
  "First Spark": "/badges/First_Spark.png",
  "Triple Threat": "/badges/Triple_Threat.png",
  "High Five": "/badges/High_Five.png",
  "Perfect 10": "/badges/Perfect_Ten.png",
};

interface NewBadge {
  name: string;
  description: string;
  icon_emoji: string;
}

interface CompleteDateModalProps {
  isOpen: boolean;
  xpGained: number;
  newTotalXp: number;
  newLevel: number;
  newBadges: NewBadge[];
  gated: boolean;
  dateIdeaId: string;
  onClose: () => void;
  onGoToProgress: () => void;
}

export default function CompleteDateModal({
  isOpen,
  xpGained,
  newTotalXp,
  newLevel,
  newBadges,
  gated,
  dateIdeaId,
  onClose,
  onGoToProgress,
}: CompleteDateModalProps) {
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  function handleClose() {
    onClose();
  }

  async function handleFeedbackSubmit() {
    if (rating === null || feedbackSaved || !dateIdeaId || feedbackSubmitting) return;
    setFeedbackSubmitting(true);
    try {
      await submitDateFeedback(dateIdeaId, rating, comment || undefined);
      setFeedbackSaved(true);
    } catch (e) {
      console.error("[feedback]", e);
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  // Lock background scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Trigger confetti when the modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fire = getFire();
    fire({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.55 },
      ticks: 120,
      scalar: 0.9,
      colors: ["#f97316", "#f59e0b", "#ec4899", "#a855f7", "#ffffff"],
    });
    const t = setTimeout(() => {
      fire({
        particleCount: 40,
        spread: 50,
        origin: { x: 0.2, y: 0.6 },
        ticks: 120,
        scalar: 0.9,
        colors: ["#f97316", "#f59e0b", "#ffffff"],
      });
      fire({
        particleCount: 40,
        spread: 50,
        origin: { x: 0.8, y: 0.6 },
        ticks: 120,
        scalar: 0.9,
        colors: ["#ec4899", "#a855f7", "#ffffff"],
      });
    }, 350);
    return () => clearTimeout(t);
  }, [isOpen]);

  async function handleUpgrade() {
    setUpgradeError("");
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cadence: "monthly", returnPath: "/dashboard?tab=progress" }),
      });
      const { url, error } = await res.json();
      if (error || !url) {
        setUpgradeError("Couldn't start checkout. Try again.");
        setUpgrading(false);
        return;
      }
      window.location.href = url;
    } catch {
      setUpgradeError("Couldn't start checkout. Try again.");
      setUpgrading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 z-50 overflow-y-auto flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="w-full max-w-sm my-4"
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-[#13131f] border border-white/10 rounded-3xl p-6 text-center shadow-2xl shadow-black/60">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Hero emoji */}
              <motion.div
                className="text-5xl mb-3"
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 16, delay: 0.05 }}
              >
                🎉
              </motion.div>

              <h2 className="text-xl font-bold text-white mb-1">Date Complete!</h2>
              <p className="text-white/55 text-sm mb-5">Another one in the books.</p>

              {gated ? (
                <>
                  <FeedbackSection
                    rating={rating}
                    hovered={hovered}
                    comment={comment}
                    onRate={setRating}
                    onHover={setHovered}
                    onComment={setComment}
                    onSubmit={handleFeedbackSubmit}
                    submitted={feedbackSaved}
                    submitting={feedbackSubmitting}
                  />

                  {/* Upsell card */}
                  <motion.div
                    className="bg-gradient-to-br from-violet-500/20 to-rose-500/10 border border-violet-500/25 rounded-2xl p-4 mb-4 text-left"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-4 h-4 text-violet-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white mb-1">
                          Unlock XP & badges
                        </p>
                        <p className="text-xs text-white/60 leading-relaxed">
                          Plus members earn XP, level up, and collect badges for every date.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {upgradeError && (
                    <p className="text-xs text-rose-400 mb-3">{upgradeError}</p>
                  )}

                  <Button
                    size="sm"
                    className="w-full rounded-xl"
                    onClick={handleUpgrade}
                    disabled={upgrading}
                  >
                    {upgrading ? "Loading…" : "Upgrade to Plus"}
                  </Button>
                  <button
                    onClick={handleClose}
                    className="mt-3 w-full text-sm text-white/55 hover:text-white transition-colors duration-150"
                  >
                    Maybe later
                  </button>
                </>
              ) : (
                <>
                  {/* XP gained */}
                  <motion.div
                    className="bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/25 rounded-2xl p-4 mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-2xl font-black text-white">+{xpGained} XP</span>
                    </div>
                    <p className="text-xs text-white/55">
                      Level {newLevel} · {newTotalXp} XP total
                    </p>
                  </motion.div>

                  {/* Newly unlocked badges */}
                  {newBadges.length > 0 && (
                    <motion.div
                      className="mb-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.32 }}
                    >
                      <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-3">
                        🏆 Badge{newBadges.length > 1 ? "s" : ""} Unlocked!
                      </p>
                      <div className="flex flex-col gap-2">
                        {newBadges.map((badge, i) => (
                          <motion.div
                            key={badge.name}
                            className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-left"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              delay: 0.38 + i * 0.1,
                            }}
                          >
                            {BADGE_IMAGES[badge.name] ? (
                              <Image
                                src={BADGE_IMAGES[badge.name]}
                                alt={badge.name}
                                width={48}
                                height={48}
                                unoptimized
                                className="w-12 h-12 object-contain flex-shrink-0"
                              />
                            ) : (
                              <span className="text-2xl flex-shrink-0">{badge.icon_emoji}</span>
                            )}
                            <div>
                              <p className="text-sm font-bold text-white">{badge.name}</p>
                              <p className="text-xs text-white/55">{badge.description}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <FeedbackSection
                    rating={rating}
                    hovered={hovered}
                    comment={comment}
                    onRate={setRating}
                    onHover={setHovered}
                    onComment={setComment}
                    onSubmit={handleFeedbackSubmit}
                    submitted={feedbackSaved}
                    submitting={feedbackSubmitting}
                    divider="top"
                  />

                  <Button size="lg" className="w-full" onClick={handleClose}>
                    Awesome!
                  </Button>
                  <button
                    onClick={onGoToProgress}
                    className="mt-3 w-full text-sm text-white/55 hover:text-white transition-colors duration-150"
                  >
                    View my progress →
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
