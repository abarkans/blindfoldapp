"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Star, ArrowRight } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";
import confetti, { type CreateTypes } from "canvas-confetti";
import Link from "next/link";
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
      ? "border-t border-white/16 pt-4 mt-2 mb-4"
      : "border-b border-white/16 pb-4 mb-4";
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
              className="w-full bg-white/[0.035] border border-white/16 rounded-xl px-3 py-2.5 text-[16px] text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/20 transition-colors"
            />
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="mt-2 w-full py-2.5 rounded-full bg-white/[0.06] border border-white/15 text-sm font-semibold text-white hover:bg-white/[0.09] transition-colors disabled:opacity-50"
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
  "Subscriber": "/badges/Subscriber.png",
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
  dateIdeaId: string;
  trialExpired?: boolean;
  onClose: () => void;
  onGoToProgress: () => void;
}

export default function CompleteDateModal({
  isOpen,
  xpGained,
  newTotalXp,
  newLevel,
  newBadges,
  dateIdeaId,
  trialExpired,
  onClose,
  onGoToProgress,
}: CompleteDateModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [inCapacitor, setInCapacitor] = useState(false);
  useEffect(() => { if ((window as any).Capacitor) setInCapacitor(true) }, []);

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
    const colors = ["#f97316", "#f59e0b", "#ec4899", "#a855f7", "#ffffff", "#34d399"];
    const duration = 3000;
    const end = Date.now() + duration;

    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      fire({
        particleCount: 6,
        spread: 55,
        origin: { x: Math.random(), y: 0 },
        startVelocity: 18 + Math.random() * 10,
        gravity: 0.75,
        ticks: 220,
        scalar: 0.85,
        colors,
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 z-50 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <div className="min-h-full flex items-center justify-center p-4">
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-[#030303] border border-white/14 rounded-3xl p-6 text-center shadow-2xl shadow-black/60">
              <div className="absolute top-4 right-4">
                <CloseButton onClick={handleClose} />
              </div>


              <h2 className="text-xl font-bold text-white mb-1">Date Complete!</h2>
              <p className="text-white/55 text-sm mb-5">Another one in the books.</p>

              {/* XP gained */}
              <motion.div
                className="p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <p className="text-xs text-white/55 mb-1">Earned</p>
                <div className="flex items-center justify-center">
                  <span className="text-2xl font-black text-white">+{xpGained} XP</span>
                </div>
              </motion.div>

              {/* Newly unlocked badges */}
              {newBadges.length > 0 && (
                <motion.div
                  className="mb-5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 }}
                >
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
                        <div className="flex-1">
                          <p className="text-xs text-white/55 mb-0.5">Unlocked</p>
                          <p className="text-sm font-bold text-white">{badge.name}</p>
                        </div>
                        <button
                          onClick={onGoToProgress}
                          className="text-xs text-white/45 hover:text-white transition-colors flex-shrink-0"
                        >
                          View
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Trial → Starter downgrade notice */}
              {trialExpired && (
                <motion.div
                  className="border border-white/12 rounded-2xl p-4 mb-4 text-left"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-sm font-semibold text-white mb-1">You&apos;ve switched to Starter</p>
                  <p className="text-xs text-white/50 mb-3">Next date picks from food, nature, or romance — one per month.</p>
                  {inCapacitor ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const { Browser } = await import('@capacitor/browser')
                        await Browser.open({ url: 'https://blindfolddate.com/dashboard?tab=settings' })
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-colors"
                    >
                      Subscribe at blindfolddate.com
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <Link
                      href="/dashboard?upgrade=1"
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-colors"
                    >
                      Upgrade to Plus
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
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

              <div className="flex flex-col gap-2">
                <Button size="lg" className="w-full" onClick={handleClose}>
                  Awesome!
                </Button>
                <Button variant="ghost" size="lg" className="w-full" onClick={onGoToProgress}>
                  My progress
                </Button>
              </div>
            </div>
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


