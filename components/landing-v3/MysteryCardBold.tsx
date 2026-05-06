"use client";

import { motion } from "framer-motion";
import { Lock, Sparkles, MapPin } from "lucide-react";

const STARS = [
  { w: 1.8, h: 2.3, l: "32%", t: "1%",  dur: 2.1, delay: 0   },
  { w: 2.4, h: 1.5, l: "68%", t: "11%", dur: 3.0, delay: 0.4 },
  { w: 1.2, h: 2.3, l: "85%", t: "58%", dur: 2.5, delay: 0.8 },
  { w: 1.3, h: 2.7, l: "9%",  t: "28%", dur: 1.8, delay: 0.2 },
  { w: 1.8, h: 1.0, l: "31%", t: "39%", dur: 2.8, delay: 1.0 },
  { w: 2.0, h: 2.1, l: "85%", t: "60%", dur: 2.2, delay: 1.3 },
  { w: 2.9, h: 2.1, l: "96%", t: "27%", dur: 1.9, delay: 0.7 },
  { w: 2.0, h: 1.6, l: "10%", t: "8%",  dur: 3.2, delay: 1.5 },
  { w: 2.5, h: 1.1, l: "70%", t: "80%", dur: 2.0, delay: 0.3 },
  { w: 2.6, h: 1.7, l: "43%", t: "82%", dur: 2.6, delay: 0.9 },
  { w: 1.4, h: 2.6, l: "63%", t: "6%",  dur: 2.3, delay: 1.1 },
  { w: 2.5, h: 2.2, l: "77%", t: "26%", dur: 2.9, delay: 0.6 },
  { w: 1.1, h: 2.0, l: "23%", t: "78%", dur: 1.6, delay: 1.4 },
  { w: 2.7, h: 2.0, l: "0%",  t: "96%", dur: 2.4, delay: 0.1 },
  { w: 2.5, h: 2.7, l: "88%", t: "90%", dur: 3.1, delay: 0.8 },
  { w: 1.9, h: 1.1, l: "20%", t: "24%", dur: 2.7, delay: 1.2 },
  { w: 2.9, h: 1.1, l: "88%", t: "22%", dur: 1.5, delay: 0.4 },
];

const PARTICLES = [
  { x: "12%", y: "18%", delay: 0,   size: 4 },
  { x: "82%", y: "12%", delay: 0.4, size: 3 },
  { x: "22%", y: "72%", delay: 0.8, size: 5 },
  { x: "72%", y: "68%", delay: 1.2, size: 3 },
  { x: "50%", y: "8%",  delay: 0.6, size: 4 },
  { x: "92%", y: "42%", delay: 1.0, size: 3 },
  { x: "8%",  y: "52%", delay: 1.4, size: 4 },
  { x: "58%", y: "88%", delay: 0.3, size: 3 },
];

export function MysteryCardBold() {
  return (
    <div className="relative mx-auto" style={{ maxWidth: 380 }}>
      {/* Layered glow halos */}
      <div className="absolute -inset-10 rounded-full bg-rose-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -inset-6 rounded-full bg-violet-600/15 blur-2xl pointer-events-none" />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-rose-400/70"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
          animate={{ y: [-8, 8, -8], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 3 + i * 0.3, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Card body */}
      <motion.div
        className="relative rounded-[2rem] border border-rose-500/35 bg-gradient-to-b from-[#1c1130] to-[#0e0b18] shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Header ribbon */}
        <div className="relative h-56 bg-gradient-to-br from-violet-900/80 via-rose-900/60 to-purple-950/80 flex flex-col items-center justify-center overflow-hidden">
          {STARS.map((s, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{ width: s.w, height: s.h, left: s.l, top: s.t }}
              animate={{ opacity: [0.1, 0.9, 0.1] }}
              transition={{ duration: s.dur, delay: s.delay, repeat: Infinity }}
            />
          ))}

          {/* Animated lock */}
          <motion.div
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-500/45 to-violet-600/45 border border-rose-400/40 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-rose-900/40"
            animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Lock className="w-11 h-11 text-rose-200" />
          </motion.div>

          <div className="flex items-center gap-2 mt-4">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-[0.18em]">Mystery Date</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        {/* Card content */}
        <div className="p-6">
          {/* Blurred title */}
          <div className="mb-4">
            <div className="h-6 w-44 bg-white/12 rounded-xl blur-sm mb-2" />
            <div className="h-3.5 w-28 bg-rose-400/25 rounded-lg blur-sm" />
          </div>

          {/* Blurred venue */}
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-3.5 h-3.5 text-white/25 shrink-0" />
            <div className="h-3.5 w-40 bg-white/8 rounded-lg blur-sm" />
          </div>

          {/* Blurred description */}
          <div className="space-y-2 mb-5">
            <div className="h-3 w-full bg-white/8 rounded blur-sm" />
            <div className="h-3 w-5/6 bg-white/8 rounded blur-sm" />
            <div className="h-3 w-2/3 bg-white/8 rounded blur-sm" />
          </div>

          {/* Blurred detail chips */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded-2xl bg-white/5 border border-white/8 blur-[2px]" />
            ))}
          </div>

          {/* Reveal button */}
          <div className="w-full h-14 rounded-2xl bg-gradient-to-r from-rose-600/50 to-violet-600/50 border border-rose-400/25 flex items-center justify-center gap-2.5 opacity-60 pointer-events-none select-none">
            <Lock className="w-4.5 h-4.5 text-white/65" style={{ width: 18, height: 18 }} />
            <span className="text-base font-bold text-white/65">Reveal Your Date</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
