"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

// Static list mirrors the milestones seeded in migration 004
const ALL_MILESTONES = [
  {
    name: "First Spark",
    description: "Complete your first mystery date",
    icon_emoji: "✨",
    image: "/badges/First_Spark.png",
    required_dates: 1,
  },
  {
    name: "Triple Threat",
    description: "Complete 3 mystery dates",
    icon_emoji: "🔥",
    image: "/badges/Triple_Threat.png",
    required_dates: 3,
  },
  {
    name: "High Five",
    description: "Complete 5 mystery dates",
    icon_emoji: "🖐️",
    image: "/badges/High_Five.png",
    required_dates: 5,
  },
  {
    name: "Perfect 10",
    description: "Complete 10 mystery dates",
    icon_emoji: "💎",
    image: "/badges/Perfect_Ten.png",
    required_dates: 10,
  },
];

interface EarnedBadge {
  name: string;
  earned_at: string;
}

interface BadgeGridProps {
  earnedBadges: EarnedBadge[];
}

export default function BadgeGrid({ earnedBadges }: BadgeGridProps) {
  const earnedNames = new Set(earnedBadges.map((b) => b.name));

  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
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
              className="relative p-4 text-center"
            >
              {/* Badge image — blurred + lock icon when locked */}
              <motion.div
                className="relative w-32 h-32 mx-auto mb-2"
                animate={earned ? { scale: [1, 1.12, 1] } : {}}
                transition={{ duration: 0.5, delay: i * 0.07 + 0.1 }}
              >
                <Image
                  src={milestone.image}
                  alt={milestone.name}
                  width={128}
                  height={128}
                  className={`w-full h-full object-contain transition-all duration-500 ${
                    earned ? "" : "grayscale opacity-40"
                  }`}
                  style={earned ? {} : { filter: "grayscale(1) blur(2px)" }}
                />
                {!earned && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <Lock className="w-4 h-4 text-white/70" />
                    </div>
                  </div>
                )}
              </motion.div>

              <p
                className={`text-xs font-semibold mb-0.5 ${
                  earned ? "text-white" : "text-white/25"
                }`}
              >
                {milestone.name}
              </p>
              <p
                className={`text-[10px] leading-tight ${
                  earned ? "text-white/45" : "text-white/18"
                }`}
              >
                {earned
                  ? milestone.description
                  : `${milestone.required_dates} date${milestone.required_dates > 1 ? "s" : ""}`}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
