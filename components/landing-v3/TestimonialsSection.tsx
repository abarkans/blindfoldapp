"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const TESTIMONIALS = [
  {
    quote: "We used to spend 20 minutes arguing about what to do. Now we just hit reveal and go. Best thing we've done for our relationship.",
    name: "Sarah & Tom",
    together: "Together 3 years",
  },
  {
    quote: "There's something about not knowing where you're going that makes the whole night feel like an adventure. We're hooked.",
    name: "Léa & Marcus",
    together: "Together 18 months",
  },
  {
    quote: "We've done 8 dates through BlindfoldDate. Every single one was better than anything we would have planned ourselves.",
    name: "Emma & Jake",
    together: "Together 5 years",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="px-6 md:px-10 py-28 md:py-40 max-w-[1280px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
        className="text-center mb-14 md:mb-20"
      >
        <p className="text-xs text-violet-400 font-medium uppercase tracking-[0.12em] mb-4 md:mb-5">
          Real couples
        </p>
        <h2 className="text-[28px] md:text-[48px] font-black leading-[1.1] tracking-tight">
          They stopped planning.
          <br />
          <span className="text-white/35">They started connecting.</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE, delay: i * 0.1 }}
            className="relative flex flex-col gap-5 rounded-3xl border border-white/8 bg-white/[0.025] p-7 md:p-8 hover:border-white/14 transition-colors"
          >
            {/* Stars */}
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((s) => (
                <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>

            {/* Quote */}
            <p className="text-white/70 text-sm md:text-base leading-[1.7] flex-1">
              &ldquo;{t.quote}&rdquo;
            </p>

            {/* Identity */}
            <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500/40 to-violet-600/40 border border-rose-400/30 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-rose-300">
                  {t.name[0]}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-white/45">{t.together}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
