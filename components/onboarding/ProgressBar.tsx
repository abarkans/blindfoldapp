"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  current: number;
  total: number;
  labels?: string[];
}

export default function ProgressBar({ current, total, labels }: ProgressBarProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center">
        <span className="text-xs text-white/40 font-medium uppercase tracking-widest">
          Step {current} of {total}
        </span>
        {labels && labels[current - 1] && (
          <span className="text-xs text-rose-400 font-semibold">
            {labels[current - 1]}
          </span>
        )}
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-violet-600"
              initial={{ width: i < current - 1 ? "100%" : "0%" }}
              animate={{ width: i < current ? "100%" : "0%" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
