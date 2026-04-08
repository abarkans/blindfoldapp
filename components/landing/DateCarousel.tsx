"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Sparkles } from "lucide-react";

const CARDS = [
  {
    emoji: "📸",
    title: "Golden Hour Walk",
    vibe: "Romantic & Creative",
    description:
      "A mystery route through the city timed perfectly for golden hour. Camera required — you'll want to remember this one.",
    details: ["2 hrs", "€0–15", "Outdoor"],
  },
  {
    emoji: "🍷",
    title: "Blind Tasting Night",
    vibe: "Playful & Sophisticated",
    description:
      "A curated flight of wines with small plates at a hidden wine bar. Guess what you're drinking — loser picks next time.",
    details: ["2 hrs", "€30–60", "Evening"],
  },
  {
    emoji: "🎬",
    title: "Blind Cinema Date",
    vibe: "Spontaneous & Fun",
    description:
      "Show up at the cinema and see whatever starts next. No trailers, no reviews — pure surprise and shared reactions.",
    details: ["3 hrs", "€20–30", "Indoor"],
  },
];

const n = CARDS.length;

export default function DateCarousel() {
  const [active, setActive] = useState(0);
  const dragX = useMotionValue(0);

  const prevIdx = (active - 1 + n) % n;
  const nextIdx = (active + 1) % n;

  function goTo(idx: number) {
    setActive(idx);
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -50) goTo(nextIdx);
    else if (info.offset.x > 50) goTo(prevIdx);
    dragX.set(0);
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Carousel track */}
      <div className="relative w-full flex items-center justify-center" style={{ height: 480 }}>

        {/* Left peeking card */}
        <motion.div
          key={`left-${prevIdx}`}
          className="absolute cursor-pointer"
          style={{ width: "72%", left: "-8%", zIndex: 10 }}
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 0.88, opacity: 0.7 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          onClick={() => goTo(prevIdx)}
          whileHover={{ opacity: 0.9 }}
        >
          <CardFace data={CARDS[prevIdx]} />
        </motion.div>

        {/* Right peeking card */}
        <motion.div
          key={`right-${nextIdx}`}
          className="absolute cursor-pointer"
          style={{ width: "72%", right: "-8%", zIndex: 10 }}
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 0.88, opacity: 0.7 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          onClick={() => goTo(nextIdx)}
          whileHover={{ opacity: 0.9 }}
        >
          <CardFace data={CARDS[nextIdx]} />
        </motion.div>

        {/* Center active card */}
        <motion.div
          key={`center-${active}`}
          className="absolute cursor-grab active:cursor-grabbing"
          style={{ width: "80%", zIndex: 20 }}
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={handleDragEnd}
        >
          <CardFace data={CARDS[active]} active />
        </motion.div>
      </div>

      {/* Dots */}
      <div className="flex gap-1.5 mt-4">
        {CARDS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all ${
              i === active
                ? "w-4 h-1.5 bg-pink-400"
                : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      <p className="text-center text-white/20 text-xs mt-3">
        Your actual date will be a surprise ✨
      </p>
    </div>
  );
}

function CardFace({ data, active = false }: { data: (typeof CARDS)[0]; active?: boolean }) {
  return (
    <div className={`relative rounded-3xl border overflow-hidden p-6 ${
      active
        ? "border-white/15 bg-[#1a1a2a] shadow-2xl shadow-black/50"
        : "border-white/8 bg-[#16161f]"
    }`}>
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-semibold text-pink-400 uppercase tracking-widest">
            Mystery Date
          </span>
        </div>
        <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/10 rounded-2xl p-5 text-center border border-pink-500/20 mb-4">
          <div className="text-5xl mb-3">{data.emoji}</div>
          <h3 className="text-xl font-bold text-white mb-1">{data.title}</h3>
          <p className="text-xs text-pink-300 font-medium">{data.vibe}</p>
        </div>
        <p className="text-white/60 text-sm leading-relaxed mb-4">{data.description}</p>
        <div className="grid grid-cols-3 gap-2">
          {data.details.map((v) => (
            <div key={v} className="flex items-center justify-center bg-white/5 rounded-2xl p-3 border border-white/8">
              <span className="text-xs text-white/60 text-center">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
