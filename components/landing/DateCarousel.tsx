"use client";

import { useState } from "react";
import { motion, useMotionValue, PanInfo } from "framer-motion";
import { Sparkles, Star, Timer, Wallet, Navigation, MapPin } from "lucide-react";

const CARDS = [
  {
    emoji: "📸",
    title: "Golden Hour Walk",
    vibe: "Romantic & Creative",
    venue: "Botanical Garden, Old Town",
    description:
      "A mystery route timed perfectly for golden hour. Camera required — you'll want to remember this one.",
    rating: 4.8,
    duration: "2 hrs",
    budget: "€0–15",
    tags: ["Outdoor", "Romantic", "Photography"],
    gradient: "from-amber-500/20 to-orange-500/10",
    photoBg: "from-amber-900/40 to-orange-900/20",
  },
  {
    emoji: "🍷",
    title: "Blind Tasting Night",
    vibe: "Playful & Sophisticated",
    venue: "La Cave Wine Bar, City Centre",
    description:
      "A curated flight of wines with small plates at a hidden wine bar. Guess what you're drinking — loser picks next time.",
    rating: 4.7,
    duration: "2 hrs",
    budget: "€30–60",
    tags: ["Evening", "Food & Drink", "Playful"],
    gradient: "from-purple-500/20 to-rose-500/10",
    photoBg: "from-purple-900/40 to-rose-900/20",
  },
  {
    emoji: "🎬",
    title: "Surprise Cinema Date",
    vibe: "Spontaneous & Fun",
    venue: "Forum Cinemas, Riga",
    description:
      "Show up and see whatever starts next. No trailers, no reviews — pure surprise and shared reactions.",
    rating: 4.6,
    duration: "3 hrs",
    budget: "€20–30",
    tags: ["Indoor", "Cosy", "Fun"],
    gradient: "from-blue-500/20 to-indigo-500/10",
    photoBg: "from-blue-900/40 to-indigo-900/20",
  },
];

const n = CARDS.length;

export default function DateCarousel() {
  const [active, setActive] = useState(0);
  const dragX = useMotionValue(0);

  const prevIdx = (active - 1 + n) % n;
  const nextIdx = (active + 1) % n;

  function goTo(idx: number) { setActive(idx); }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -50) goTo(nextIdx);
    else if (info.offset.x > 50) goTo(prevIdx);
    dragX.set(0);
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full flex items-center justify-center" style={{ height: 520 }}>

        {/* Left peeking card */}
        <motion.div
          key={`left-${prevIdx}`}
          className="absolute cursor-pointer"
          style={{ width: "72%", left: "-8%", zIndex: 10 }}
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 0.88, opacity: 0.6 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          onClick={() => goTo(prevIdx)}
        >
          <CardFace data={CARDS[prevIdx]} />
        </motion.div>

        {/* Right peeking card */}
        <motion.div
          key={`right-${nextIdx}`}
          className="absolute cursor-pointer"
          style={{ width: "72%", right: "-8%", zIndex: 10 }}
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 0.88, opacity: 0.6 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          onClick={() => goTo(nextIdx)}
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
              i === active ? "w-4 h-1.5 bg-pink-400" : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
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
    <div className={`relative rounded-3xl border overflow-hidden ${
      active
        ? "border-white/15 bg-[#1a1a2a] shadow-2xl shadow-black/50"
        : "border-white/8 bg-[#16161f]"
    }`}>
      {/* Photo placeholder */}
      <div className={`relative h-40 bg-gradient-to-br ${data.photoBg} flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 opacity-30">
          <div className={`absolute inset-0 bg-gradient-to-br ${data.gradient}`} />
        </div>
        <span className="text-5xl relative z-10">{data.emoji}</span>
        {/* Rating badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-xs font-bold text-white">{data.rating}</span>
        </div>
        {/* Sparkles header */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span className="text-[10px] font-semibold text-pink-300 uppercase tracking-widest">Mystery Date</span>
        </div>
      </div>

      <div className="p-4">
        {/* Title + vibe */}
        <div className="mb-2">
          <h3 className="text-base font-bold text-white leading-tight">{data.title}</h3>
          <p className="text-xs text-pink-300 font-medium mt-0.5">{data.vibe}</p>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin className="w-3 h-3 text-white/30 shrink-0" />
          <p className="text-xs text-white/40 truncate">{data.venue}</p>
        </div>

        {/* Description */}
        <p className="text-white/55 text-xs leading-relaxed mb-3 line-clamp-2">{data.description}</p>

        {/* Details row */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {[
            { icon: Timer, value: data.duration },
            { icon: Wallet, value: data.budget },
            { icon: Star, value: `${data.rating} ★` },
          ].map(({ icon: Icon, value }) => (
            <div key={value} className="flex flex-col items-center gap-0.5 bg-white/5 rounded-xl p-2 border border-white/8">
              <Icon className="w-3 h-3 text-pink-400" />
              <span className="text-[10px] text-white/55 text-center leading-tight">{value}</span>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {data.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-[10px] text-pink-300">
              {tag}
            </span>
          ))}
        </div>

        {/* Navigate button (decorative) */}
        <div className="flex items-center justify-center gap-1.5 w-full h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
          <Navigation className="w-3 h-3" />
          Navigate to Date
        </div>
      </div>
    </div>
  );
}
