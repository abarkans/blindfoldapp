"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight, BookOpen, Camera, Check, Clock, Coffee, Copy, Dices, Dumbbell,
  Film, Gamepad2, Heart, House, MapPin, Martini, Palette, Sparkles, TreePine,
  Utensils, Wallet, Waves, type LucideIcon,
} from "lucide-react";
import Button from "@/components/ui/Button";
import {
  BUDGET_LABELS, CATEGORY_LABELS, DATE_IDEAS, SETTING_LABELS,
  type DateIdea, type IdeaBudget, type IdeaCategory, type IdeaSetting,
} from "@/lib/date-generator/ideas";

const CATEGORY_STYLE: Record<IdeaCategory, { icon: LucideIcon; text: string; chip: string; glow: string }> = {
  food:      { icon: Utensils, text: "text-orange-300",  chip: "bg-orange-500/15 border-orange-400/25",   glow: "from-orange-500/25" },
  romance:   { icon: Heart,    text: "text-rose-300",    chip: "bg-rose-500/15 border-rose-400/25",       glow: "from-rose-500/25" },
  nature:    { icon: TreePine, text: "text-emerald-300", chip: "bg-emerald-500/15 border-emerald-400/25", glow: "from-emerald-500/25" },
  culture:   { icon: Palette,  text: "text-purple-300",  chip: "bg-purple-500/15 border-purple-400/25",   glow: "from-purple-500/25" },
  nightlife: { icon: Martini,  text: "text-blue-300",    chip: "bg-blue-500/15 border-blue-400/25",       glow: "from-blue-500/25" },
  coffee:    { icon: Coffee,   text: "text-amber-300",   chip: "bg-amber-500/15 border-amber-400/25",     glow: "from-amber-500/25" },
  cinema:    { icon: Film,     text: "text-sky-300",     chip: "bg-sky-500/15 border-sky-400/25",         glow: "from-sky-500/25" },
  water:     { icon: Waves,    text: "text-cyan-300",    chip: "bg-cyan-500/15 border-cyan-400/25",       glow: "from-cyan-500/25" },
  active:    { icon: Dumbbell, text: "text-lime-300",    chip: "bg-lime-500/15 border-lime-400/25",       glow: "from-lime-500/25" },
  creative:  { icon: Camera,   text: "text-violet-300",  chip: "bg-violet-500/15 border-violet-400/25",   glow: "from-violet-500/25" },
  learning:  { icon: BookOpen, text: "text-teal-300",    chip: "bg-teal-500/15 border-teal-400/25",       glow: "from-teal-500/25" },
  games:     { icon: Gamepad2, text: "text-indigo-300",  chip: "bg-indigo-500/15 border-indigo-400/25",   glow: "from-indigo-500/25" },
  home:      { icon: House,    text: "text-pink-300",    chip: "bg-pink-500/15 border-pink-400/25",       glow: "from-pink-500/25" },
};

type SettingFilter = "any" | IdeaSetting;
type BudgetFilter = "any" | "free" | "cheap" | "splurge";

const SETTING_OPTIONS: { value: SettingFilter; label: string }[] = [
  { value: "any", label: "Surprise me" },
  { value: "out", label: "Going out" },
  { value: "in", label: "Staying in" },
];

const BUDGET_OPTIONS: { value: BudgetFilter; label: string }[] = [
  { value: "any", label: "Any budget" },
  { value: "free", label: "Free" },
  { value: "cheap", label: "Cheap" },
  { value: "splurge", label: "Splurge" },
];

const BUDGET_MATCH: Record<BudgetFilter, (b: IdeaBudget) => boolean> = {
  any: () => true,
  free: (b) => b === "free",
  cheap: (b) => b === "free" || b === "low",
  splurge: (b) => b === "mid" || b === "high",
};

const SHUFFLE_MS = 650;
const SHUFFLE_TICK_MS = 70;

function FilterRow<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap justify-center gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`h-9 px-4 rounded-full text-sm font-semibold border transition-[background-color,border-color,color] duration-150 ${
              active
                ? "bg-white text-gray-900 border-white"
                : "bg-white/[0.04] text-white/60 border-white/12 hover:text-white hover:border-white/25"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function DateGenerator({ initialIdea }: { initialIdea: DateIdea }) {
  const reducedMotion = useReducedMotion();
  const [idea, setIdea] = useState<DateIdea>(initialIdea);
  const [setting, setSetting] = useState<SettingFilter>("any");
  const [budget, setBudget] = useState<BudgetFilter>("any");
  const [shuffling, setShuffling] = useState(false);
  const [shuffleTitle, setShuffleTitle] = useState(initialIdea.title);
  const [copied, setCopied] = useState(false);
  const [spins, setSpins] = useState(0);
  // Slugs already shown in this visit, so a spin never repeats until the
  // filtered pool is exhausted.
  const seen = useRef<Set<string>>(new Set([initialIdea.slug]));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const pool = useMemo(
    () => DATE_IDEAS.filter((i) => (setting === "any" || i.setting === setting) && BUDGET_MATCH[budget](i.budget)),
    [setting, budget],
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function pickNext(): DateIdea | undefined {
    if (pool.length === 0) return undefined;
    let fresh = pool.filter((i) => !seen.current.has(i.slug));
    if (fresh.length === 0) {
      seen.current = new Set([idea.slug]);
      fresh = pool.filter((i) => i.slug !== idea.slug);
      if (fresh.length === 0) fresh = pool;
    }
    return fresh[Math.floor(Math.random() * fresh.length)];
  }

  function reveal(next: DateIdea) {
    seen.current.add(next.slug);
    setIdea(next);
    setShuffling(false);
    setSpins((n) => n + 1);
    // Shareable, without adding a history entry per spin.
    window.history.replaceState(null, "", `?idea=${next.slug}`);
  }

  function spin() {
    if (shuffling) return;
    const next = pickNext();
    if (!next) return;
    setCopied(false);

    if (reducedMotion) {
      reveal(next);
      return;
    }

    setShuffling(true);
    const ticks = Math.floor(SHUFFLE_MS / SHUFFLE_TICK_MS);
    for (let t = 0; t < ticks; t++) {
      timers.current.push(
        setTimeout(() => {
          setShuffleTitle(pool[Math.floor(Math.random() * pool.length)].title);
        }, t * SHUFFLE_TICK_MS),
      );
    }
    timers.current.push(setTimeout(() => reveal(next), SHUFFLE_MS));
  }

  async function copyLink() {
    const url = `${window.location.origin}/random-date-generator?idea=${idea.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      timers.current.push(setTimeout(() => setCopied(false), 2000));
    } catch {
      // Clipboard blocked (permissions / insecure context) — nothing to do.
    }
  }

  const style = CATEGORY_STYLE[idea.category];
  const Icon = style.icon;

  return (
    <div className="w-full max-w-[800px] mx-auto">
      <div className="flex flex-col gap-3 mb-8">
        <FilterRow label="Where" options={SETTING_OPTIONS} value={setting} onChange={setSetting} />
        <FilterRow label="Budget" options={BUDGET_OPTIONS} value={budget} onChange={setBudget} />
      </div>

      {/* Result card */}
      <div className="relative">
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -inset-6 rounded-[40px] bg-gradient-to-b ${style.glow} to-transparent blur-3xl opacity-70 transition-colors duration-500`}
        />
        <div
          className="relative rounded-3xl border border-white/12 bg-white/[0.035] backdrop-blur-xl p-6 md:p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)] min-h-[340px]"
          aria-live="polite"
          aria-busy={shuffling}
        >
          {shuffling ? (
            <div className="flex h-full min-h-[288px] flex-col items-center justify-center text-center">
              <Dices className="w-8 h-8 text-white/40 mb-4 animate-spin [animation-duration:900ms]" aria-hidden="true" />
              <p className="text-2xl md:text-3xl font-black text-white/35 blur-[1px]">{shuffleTitle}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={idea.slug}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full border text-xs font-semibold ${style.chip} ${style.text}`}>
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  {CATEGORY_LABELS[idea.category]}
                </span>

                <h2 className="mt-4 text-3xl md:text-4xl font-black leading-[1.1] text-white">{idea.title}</h2>
                <p className="mt-3 text-lg text-white/65 leading-relaxed">{idea.vibe}</p>

                <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/[0.07] p-4">
                  <p className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-300">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    Your mission
                  </p>
                  <p className="mt-1.5 text-white/85 font-medium">{idea.mission}</p>
                </div>

                <ul className="mt-5 flex flex-wrap justify-center gap-2 text-sm text-white/55">
                  <li className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/[0.05]">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    {SETTING_LABELS[idea.setting]}
                  </li>
                  <li className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/[0.05]">
                    <Wallet className="w-3.5 h-3.5" aria-hidden="true" />
                    {BUDGET_LABELS[idea.budget]}
                  </li>
                  <li className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/[0.05]">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {idea.duration}
                  </li>
                </ul>

                {/* Product promo, tied to the idea rather than a separate ad block */}
                <div className="mt-6 pt-5 border-t border-white/[0.08]">
                  <Link
                    href="/register"
                    className="group inline-flex flex-col sm:flex-row items-center gap-x-1.5 text-sm md:text-base"
                  >
                    <span className="text-white/55">
                      {idea.setting === "out"
                        ? "Want a real place for this, picked near you?"
                        : "Want your next date night planned for you?"}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-400 group-hover:text-rose-300">
                      BlindfoldDate plans it, free
                      <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
        <Button size="lg" onClick={spin} disabled={shuffling || pool.length === 0} className="gap-2 px-10">
          <Dices className="w-5 h-5" aria-hidden="true" />
          {spins === 0 ? "Generate a date" : "Spin again"}
        </Button>
        <Button size="lg" variant="outline" onClick={copyLink} disabled={shuffling} className="gap-2">
          {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
          {copied ? "Link copied" : "Share this idea"}
        </Button>
      </div>

      {pool.length === 0 && (
        <p className="mt-4 text-center text-sm text-white/45">No ideas match both filters. Try another combination.</p>
      )}

      {!shuffling && (
        <p className="mt-5 text-center text-sm">
          <Link href={`/blog/${idea.relatedSlug}`} className="text-rose-400 hover:text-rose-300 hover:underline inline-flex items-center gap-1">
            More ideas like this <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </p>
      )}
    </div>
  );
}
