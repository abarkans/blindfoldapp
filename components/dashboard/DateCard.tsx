"use client";

import { motion } from "framer-motion";
import { Lock, Sparkles, Calendar, Clock } from "lucide-react";
import Button from "@/components/ui/Button";

interface DateCardProps {
  partnerNames: { partner1: string; partner2: string };
  nextDateDate?: string;
}

export default function DateCard({ partnerNames, nextDateDate }: DateCardProps) {
  const formattedDate = nextDateDate
    ? new Date(nextDateDate).toLocaleDateString("en-GB", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "Coming soon...";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-sm"
    >
      {/* Glow effect */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-semibold text-pink-400 uppercase tracking-widest">
              Mystery Date
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
            <Clock className="w-3 h-3 text-white/50" />
            <span className="text-xs text-white/50">{formattedDate}</span>
          </div>
        </div>

        {/* Blurred mystery content */}
        <div className="relative rounded-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-br from-pink-500/20 to-purple-600/20 p-6 text-center">
            {/* Fake blurred content lines */}
            <div className="flex flex-col items-center gap-3 blur-sm select-none pointer-events-none">
              <div className="h-6 w-48 rounded-full bg-white/20" />
              <div className="h-4 w-36 rounded-full bg-white/15" />
              <div className="h-4 w-44 rounded-full bg-white/10" />
            </div>
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm"
            >
              <Lock className="w-6 h-6 text-pink-300" />
            </motion.div>
            <p className="text-white/60 text-sm font-medium">Your next date is a mystery</p>
            <p className="text-white/30 text-xs">
              {partnerNames.partner1} &amp; {partnerNames.partner2}&apos;s surprise awaits
            </p>
          </div>
        </div>

        {/* Date hint chips */}
        <div className="flex gap-2 mb-6">
          {["Outdoor", "€20–50", "2–3 hrs"].map((hint) => (
            <div
              key={hint}
              className="px-3 py-1 rounded-full bg-white/8 border border-white/10 text-xs text-white/40 blur-[2px]"
            >
              {hint}
            </div>
          ))}
        </div>

        <Button size="lg" className="w-full" disabled>
          <Calendar className="w-4 h-4 mr-2" />
          Reveal on Date Day
        </Button>
      </div>
    </motion.div>
  );
}
