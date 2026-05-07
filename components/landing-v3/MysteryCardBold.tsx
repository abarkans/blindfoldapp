"use client";

import { Lock, Sparkles, MapPin } from "lucide-react";

const STARS = [
  { w: 1.8, h: 2.3, l: "32%", t: "1%"  },
  { w: 2.4, h: 1.5, l: "68%", t: "11%" },
  { w: 1.2, h: 2.3, l: "85%", t: "58%" },
  { w: 1.3, h: 2.7, l: "9%",  t: "28%" },
  { w: 1.8, h: 1.0, l: "31%", t: "39%" },
  { w: 2.0, h: 2.1, l: "85%", t: "60%" },
  { w: 2.9, h: 2.1, l: "96%", t: "27%" },
  { w: 2.0, h: 1.6, l: "10%", t: "8%"  },
  { w: 2.5, h: 1.1, l: "70%", t: "80%" },
  { w: 2.6, h: 1.7, l: "43%", t: "82%" },
  { w: 1.4, h: 2.6, l: "63%", t: "6%"  },
  { w: 2.5, h: 2.2, l: "77%", t: "26%" },
  { w: 1.1, h: 2.0, l: "23%", t: "78%" },
  { w: 2.7, h: 2.0, l: "0%",  t: "96%" },
  { w: 2.5, h: 2.7, l: "88%", t: "90%" },
  { w: 1.9, h: 1.1, l: "20%", t: "24%" },
  { w: 2.9, h: 1.1, l: "88%", t: "22%" },
];

export function MysteryCardBold() {
  return (
    <div className="relative mx-auto" style={{ maxWidth: 380 }}>
      {/* Layered glow halos */}
      <div className="absolute -inset-10 rounded-full bg-rose-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -inset-6 rounded-full bg-violet-600/15 blur-2xl pointer-events-none" />

      {/* Card body */}
      <div className="relative rounded-[2rem] border border-rose-500/35 bg-gradient-to-b from-[#1c1130] to-[#0e0b18] shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Header ribbon */}
        <div className="relative h-56 bg-gradient-to-br from-violet-900/80 via-rose-900/60 to-purple-950/80 flex flex-col items-center justify-center overflow-hidden">
          {STARS.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white opacity-40"
              style={{ width: s.w, height: s.h, left: s.l, top: s.t }}
            />
          ))}

          {/* Lock icon — static */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-500/45 to-violet-600/45 border border-rose-400/40 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-rose-900/40">
            <Lock className="w-11 h-11 text-rose-200" />
          </div>

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
      </div>
    </div>
  );
}
