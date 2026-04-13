"use client";

import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";

// Pre-computed static positions — no Math.random() at render time (prevents SSR hydration mismatch)
const STARS = [
  { w: 1.8, h: 2.3, l: "32%", t: "1%", dur: 2.1, delay: 0 },
  { w: 2.4, h: 1.5, l: "68%", t: "11%", dur: 3.0, delay: 0.4 },
  { w: 1.2, h: 2.3, l: "85%", t: "58%", dur: 2.5, delay: 0.8 },
  { w: 1.3, h: 2.7, l: "9%",  t: "28%", dur: 1.8, delay: 0.2 },
  { w: 1.8, h: 1.0, l: "31%", t: "39%", dur: 2.8, delay: 1.0 },
  { w: 2.0, h: 2.1, l: "85%", t: "60%", dur: 2.2, delay: 1.3 },
  { w: 2.9, h: 2.1, l: "96%", t: "27%", dur: 1.9, delay: 0.7 },
  { w: 2.0, h: 1.6, l: "10%", t: "8%",  dur: 3.2, delay: 1.5 },
  { w: 2.5, h: 1.1, l: "70%", t: "80%", dur: 2.0, delay: 0.3 },
  { w: 2.6, h: 1.7, l: "43%", t: "82%", dur: 2.6, delay: 0.9 },
  { w: 2.7, h: 2.0, l: "60%", t: "85%", dur: 1.7, delay: 0.5 },
  { w: 1.4, h: 2.6, l: "63%", t: "6%",  dur: 2.3, delay: 1.1 },
  { w: 2.5, h: 2.2, l: "77%", t: "26%", dur: 2.9, delay: 0.6 },
  { w: 1.1, h: 2.0, l: "23%", t: "78%", dur: 1.6, delay: 1.4 },
  { w: 2.7, h: 2.0, l: "0%",  t: "96%", dur: 2.4, delay: 0.1 },
  { w: 2.5, h: 2.7, l: "88%", t: "90%", dur: 3.1, delay: 0.8 },
  { w: 1.9, h: 1.1, l: "20%", t: "24%", dur: 2.7, delay: 1.2 },
  { w: 2.9, h: 1.1, l: "88%", t: "22%", dur: 1.5, delay: 0.4 },
];

const FLOAT_PARTICLES = [
  { x: "15%", y: "20%", delay: 0, size: 3 },
  { x: "80%", y: "15%", delay: 0.4, size: 2 },
  { x: "25%", y: "70%", delay: 0.8, size: 4 },
  { x: "70%", y: "65%", delay: 1.2, size: 2 },
  { x: "50%", y: "10%", delay: 0.6, size: 3 },
  { x: "90%", y: "45%", delay: 1.0, size: 2 },
  { x: "10%", y: "50%", delay: 1.4, size: 3 },
];

export function MysteryCard() {
  return (
    <div className="relative mx-auto" style={{ maxWidth: 320 }}>
      {/* Glow halo */}
      <div className="absolute inset-0 rounded-3xl bg-rose-600/20 blur-3xl scale-110 pointer-events-none" />

      {/* Floating particles */}
      {FLOAT_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-rose-400/60"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
          animate={{ y: [-6, 6, -6], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.8 + i * 0.3, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Card */}
      <motion.div
        className="relative rounded-3xl border border-rose-500/20 bg-gradient-to-b from-[#16101e] to-[#0e0b16] shadow-2xl shadow-black/60 overflow-hidden"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Top ribbon */}
        <div className="relative h-44 bg-gradient-to-br from-violet-900/60 via-rose-900/40 to-purple-900/60 flex flex-col items-center justify-center overflow-hidden">
          {/* Star field — static positions to avoid SSR/CSR hydration mismatch */}
          {STARS.map((s, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{ width: s.w, height: s.h, left: s.l, top: s.t }}
              animate={{ opacity: [0.1, 0.8, 0.1] }}
              transition={{ duration: s.dur, delay: s.delay, repeat: Infinity }}
            />
          ))}

          <motion.div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/30 to-violet-600/30 border border-rose-400/30 flex items-center justify-center backdrop-blur-sm"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Lock className="w-7 h-7 text-rose-300" />
          </motion.div>

          <div className="flex items-center gap-1.5 mt-3">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-widest">Mystery Date</span>
            <Sparkles className="w-3 h-3 text-amber-400" />
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Blurred title */}
          <div className="mb-3">
            <div className="h-5 w-40 bg-white/10 rounded-lg blur-sm mb-1.5" />
            <div className="h-3 w-24 bg-rose-400/20 rounded-lg blur-sm" />
          </div>

          {/* Blurred venue */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-white/10" />
            <div className="h-3 w-36 bg-white/8 rounded-lg blur-sm" />
          </div>

          {/* Blurred description lines */}
          <div className="space-y-1.5 mb-4">
            <div className="h-2.5 w-full bg-white/8 rounded blur-sm" />
            <div className="h-2.5 w-4/5 bg-white/8 rounded blur-sm" />
            <div className="h-2.5 w-3/5 bg-white/8 rounded blur-sm" />
          </div>

          {/* Blurred detail chips */}
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-white/5 border border-white/8 blur-[2px]" />
            ))}
          </div>

          {/* Reveal button */}
          <motion.div
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-rose-600 to-violet-600 flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <Lock className="w-3.5 h-3.5 text-white" />
            <span className="text-sm font-bold text-white relative">Reveal Your Date</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export function CountdownBadge() {
  return (
    <motion.div
      className="inline-flex items-center gap-2.5 bg-violet-500/10 border border-violet-400/20 rounded-full px-5 py-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <motion.div
        className="w-2 h-2 rounded-full bg-rose-400"
        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      <span className="text-xs text-violet-200 font-medium">Your mystery date is waiting to be revealed</span>
    </motion.div>
  );
}
