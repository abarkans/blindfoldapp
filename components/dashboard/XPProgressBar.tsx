"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { xpProgress } from "@/lib/utils";

interface XPProgressBarProps {
  totalXp: number;
}

export default function XPProgressBar({ totalXp }: XPProgressBarProps) {
  const { level, current, required, percentage } = xpProgress(totalXp);
  const xpToNext = required - current;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/30">
            <Zap className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="text-sm font-bold text-white">Level {level}</span>
        </div>
        <span className="text-xs text-white/40">
          {totalXp} XP · {xpToNext} XP to level up
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500 shadow-sm shadow-orange-400/40"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(percentage, 6)}%` }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-white/25">Lv {level}</span>
        <span className="text-[10px] text-white/25">Lv {level + 1}</span>
      </div>
    </div>
  );
}
