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
    <div className="mb-10">
      <h3 className="text-xs font-semibold text-[rgb(var(--fg)/0.6)] uppercase tracking-widest mb-3">
        Level
      </h3>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-md shadow-violet-500/30">
            <Zap className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="text-sm font-bold text-[rgb(var(--fg))]">Level {level}</span>
        </div>
        <span className="text-xs text-[rgb(var(--fg)/0.5)]">
          {totalXp} XP · {xpToNext} XP to level up
        </span>
      </div>
      <div className="h-2 rounded-full bg-[rgb(var(--fg)/0.075)] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 shadow-sm shadow-violet-500/30"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(percentage, 2)}%` }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-[rgb(var(--fg)/0.55)]">Lv {level}</span>
        <span className="text-[10px] text-[rgb(var(--fg)/0.55)]">Lv {level + 1}</span>
      </div>
    </div>
  );
}

