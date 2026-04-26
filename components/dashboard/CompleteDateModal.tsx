"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";
import Button from "@/components/ui/Button";

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
  onClose: () => void;
  onGoToProgress: () => void;
}

export default function CompleteDateModal({
  isOpen,
  xpGained,
  newTotalXp,
  newLevel,
  newBadges,
  onClose,
  onGoToProgress,
}: CompleteDateModalProps) {
  // Lock background scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Trigger confetti when the modal opens
  useEffect(() => {
    if (!isOpen) return;
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: 130,
        spread: 80,
        origin: { y: 0.55 },
        colors: ["#f97316", "#f59e0b", "#ec4899", "#a855f7", "#ffffff"],
      });
      // Second burst slightly delayed
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { x: 0.2, y: 0.6 },
          colors: ["#f97316", "#f59e0b", "#ffffff"],
        });
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { x: 0.8, y: 0.6 },
          colors: ["#ec4899", "#a855f7", "#ffffff"],
        });
      }, 350);
    });
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-xs px-4"
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <div className="relative bg-[#13131f] border border-white/10 rounded-3xl p-6 text-center shadow-2xl shadow-black/60">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/25 hover:text-white/60 transition-colors"
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
              <p className="text-white/40 text-sm mb-5">Another one in the books.</p>

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
                <p className="text-xs text-white/40">
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
                            className="w-12 h-12 object-contain flex-shrink-0"
                          />
                        ) : (
                          <span className="text-2xl flex-shrink-0">{badge.icon_emoji}</span>
                        )}
                        <div>
                          <p className="text-sm font-bold text-white">{badge.name}</p>
                          <p className="text-xs text-white/45">{badge.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              <Button size="lg" className="w-full" onClick={onClose}>
                Awesome!
              </Button>
              <button
                onClick={onGoToProgress}
                className="mt-3 w-full text-sm text-white/40 hover:text-white/70 transition-colors duration-150"
              >
                View my progress →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
