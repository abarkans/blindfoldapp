"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X } from "lucide-react";

// Static list mirrors the milestones seeded in migration 004
const ALL_MILESTONES = [
  {
    name: "Subscriber",
    description: "Joined Blindfold Plus",
    icon_emoji: "⭐",
    image: "/badges/Subscriber.png",
    required_dates: null,
    lockText: "Subscribe to Plus to unlock",
  },
  {
    name: "First Spark",
    description: "Complete your first mystery date",
    icon_emoji: "✨",
    image: "/badges/First_Spark.png",
    required_dates: 1,
    lockText: null,
  },
  {
    name: "Triple Threat",
    description: "Complete 3 mystery dates",
    icon_emoji: "🔥",
    image: "/badges/Triple_Threat.png",
    required_dates: 3,
    lockText: null,
  },
  {
    name: "High Five",
    description: "Complete 5 mystery dates",
    icon_emoji: "🖐️",
    image: "/badges/High_Five.png",
    required_dates: 5,
    lockText: null,
  },
  {
    name: "Perfect 10",
    description: "Complete 10 mystery dates",
    icon_emoji: "💎",
    image: "/badges/Perfect_Ten.png",
    required_dates: 10,
    lockText: null,
  },
];

interface EarnedBadge {
  name: string;
  earned_at: string;
}

interface BadgeGridProps {
  earnedBadges: EarnedBadge[];
  isFree?: boolean;
}

interface OpenBadge {
  name: string;
  image: string;
  description: string;
  earned_at: string;
}

function BadgeModal({ badge, onClose }: { badge: OpenBadge; onClose: () => void }) {
  const [rotation, setRotation] = useState(0);
  const pointerStartX = useRef(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const earnedDate = new Date(badge.earned_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function handlePointerDown(e: React.PointerEvent) {
    pointerStartX.current = e.clientX;
  }

  function handlePointerUp(e: React.PointerEvent) {
    const dx = e.clientX - pointerStartX.current;
    const dir = dx >= 0 ? 1 : -1;
    const spins = Math.abs(dx) < 30 ? 1 : Math.max(1, Math.round(Math.abs(dx) / 80));
    setRotation((r) => r + dir * spins * 360);
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/70 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-sm px-4 pointer-events-none"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.88 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        <div className="pointer-events-auto bg-[#030303] border border-white/14 rounded-3xl p-6 shadow-2xl shadow-black/60 flex flex-col items-center">
          {/* Close button */}
          <button
            onClick={onClose}
            className="self-end w-8 h-8 rounded-full bg-white/[0.075] border border-white/15 flex items-center justify-center hover:bg-white/20 transition-colors mb-4"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>

          {/* Badge — swipe/click to flip, CSS transition on compositor thread */}
          <div style={{ perspective: 800 }}>
            <div
              className="cursor-grab active:cursor-grabbing select-none"
              style={{
                transform: `rotateY(${rotation}deg)`,
                transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                willChange: "transform",
              }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
            >
              <Image
                src={badge.image}
                alt={badge.name}
                width={200}
                height={200}
                unoptimized
                className="w-44 h-44 md:w-48 md:h-48 object-contain"
                draggable={false}
              />
            </div>
          </div>

          {/* Title + date */}
          <div className="text-center mt-5">
            <p className="text-xl font-bold text-white mb-1">{badge.name}</p>
            <p className="text-sm text-white/55">Unlocked on {earnedDate}</p>
            <p className="text-xs text-white/50 mt-3">Tap or swipe to flip ✦</p>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default function BadgeGrid({ earnedBadges, isFree = false }: BadgeGridProps) {
  const earnedNames = isFree ? new Set<string>() : new Set(earnedBadges.map((b) => b.name));
  const earnedMap = new Map(earnedBadges.map((b) => [b.name, b.earned_at]));
  const [openBadge, setOpenBadge] = useState<OpenBadge | null>(null);

  return (
    <>
      <div className="mt-6">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
          Trophy Room
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ALL_MILESTONES.map((milestone, i) => {
            const earned = earnedNames.has(milestone.name);
            return (
              <motion.div
                key={milestone.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className={`relative p-4 text-center ${earned ? "cursor-pointer" : ""}`}
                onClick={() => {
                  if (!earned) return;
                  setOpenBadge({
                    name: milestone.name,
                    image: milestone.image,
                    description: milestone.description,
                    earned_at: earnedMap.get(milestone.name)!,
                  });
                }}
              >
                {/* Badge image */}
                <motion.div
                  className="relative w-32 h-32 mx-auto mb-2"
                  whileHover={earned ? { scale: 1.06 } : {}}
                  transition={{ duration: 0.2 }}
                >
                  <Image
                    src={milestone.image}
                    alt={milestone.name}
                    width={128}
                    height={128}
                    unoptimized
                    priority={i === 0}
                    loading={i === 0 ? "eager" : "lazy"}
                    className={`w-full h-full object-contain transition-all duration-500 ${
                      earned ? "" : "grayscale opacity-40"
                    }`}
                    style={earned ? {} : { filter: "grayscale(1) blur(2px)" }}
                  />
                  {!earned && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-white/70" />
                      </div>
                    </div>
                  )}
                </motion.div>

                <p className={`text-sm font-semibold mb-0.5 ${earned ? "text-white" : "text-white/50"}`}>
                  {milestone.name}
                </p>
                <p className={`text-xs leading-snug ${earned ? "text-white/50" : "text-white/50"}`}>
                  {earned
                    ? milestone.description
                    : milestone.lockText ?? `Complete ${milestone.required_dates} date${(milestone.required_dates ?? 0) > 1 ? "s" : ""} to unlock`}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Badge detail modal */}
      <AnimatePresence>
        {openBadge && (
          <BadgeModal badge={openBadge} onClose={() => setOpenBadge(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

