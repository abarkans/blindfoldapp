"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Heart,
  Sparkles,
  ArrowRight,
  Star,
  Lock,
  MapPin,
  Zap,
  Check,
  Trophy,
  Timer,
  Wallet,
  Menu,
  X,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { MysteryCard } from "@/components/landing-v2/MysteryCard";
import DateCarousel from "@/components/landing/DateCarousel";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease: EASE, delay },
});

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: EASE, delay },
});

const STEPS = [
  {
    number: "01",
    icon: Heart,
    title: "Tell us your taste",
    body: "Your interests, budget, and how far you'll travel. Two minutes, done once. Never fill it in again.",
    color: "from-rose-500/15 to-pink-500/5",
    border: "border-rose-500/20",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-400",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "We do the planning",
    body: "AI scours real nearby venues, picks the highest-rated hidden gem, and writes a date story just for you two.",
    color: "from-violet-500/15 to-purple-500/5",
    border: "border-violet-500/20",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-400",
  },
  {
    number: "03",
    icon: Lock,
    title: "Reveal. Go. Enjoy.",
    body: "Hit reveal when you're both ready. The destination unlocks, navigation opens, and the only thing left is to enjoy.",
    color: "from-amber-500/15 to-orange-500/5",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
  },
];

const SAMPLE_DATES = [
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
    tags: ["Outdoor", "Romantic"],
    photoBg: "from-amber-900/50 to-orange-900/30",
    tagStyle: "bg-amber-500/10 border-amber-500/25 text-amber-300",
  },
  {
    emoji: "🍷",
    title: "Blind Tasting Night",
    vibe: "Playful & Sophisticated",
    venue: "La Cave Wine Bar, City Centre",
    description:
      "A curated flight of wines at a hidden wine bar. Guess what you're drinking — loser picks next time.",
    rating: 4.7,
    duration: "2 hrs",
    budget: "€30–60",
    tags: ["Evening", "Food & Drink"],
    photoBg: "from-purple-900/50 to-rose-900/30",
    tagStyle: "bg-purple-500/10 border-purple-500/25 text-purple-300",
  },
  {
    emoji: "🎬",
    title: "Surprise Cinema Date",
    vibe: "Spontaneous & Fun",
    venue: "Forum Cinemas, City Centre",
    description:
      "Show up and see whatever starts next. No trailers, no reviews — pure surprise and shared reactions.",
    rating: 4.6,
    duration: "3 hrs",
    budget: "€20–30",
    tags: ["Indoor", "Cosy"],
    photoBg: "from-blue-900/50 to-indigo-900/30",
    tagStyle: "bg-blue-500/10 border-blue-500/25 text-blue-300",
  },
];

const MARQUEE_ITEMS = [
  "📸 Golden Hour Walk",
  "🍷 Wine Tasting Night",
  "🎭 Theatre Experience",
  "🌅 Sunrise Hike",
  "🎨 Pottery Class",
  "🚤 Sunset Boat Ride",
  "🍣 Sushi Omakase",
  "🎸 Live Music Night",
  "🌿 Botanical Stroll",
  "🍕 Hidden Pizzeria",
  "🎪 Street Art Tour",
  "🧁 Baking Together",
];

const NAV_LINKS = [
  { label: "Home", href: "#", scroll: true },
  { label: "How it works", href: "#how-it-works", scroll: false },
  { label: "Features", href: "#features", scroll: false },
  { label: "Pricing", href: "#plans", scroll: false },
];

export default function LandingDesktopClient() {
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.018]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* ── Nav ── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-[#08080f]/85 backdrop-blur-2xl border-b border-white/[0.06]" />
        <nav className="relative flex items-center justify-between px-6 md:px-14 h-16 max-w-[1440px] mx-auto">
          {/* Logo */}
          <button
            onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setMenuOpen(false); }}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:brightness-110 transition-all">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-white text-[15px] tracking-tight group-hover:text-white/80 transition-colors">
              BlindfoldDate
            </span>
          </button>

          {/* Desktop center links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href, scroll }) =>
              scroll ? (
                <button
                  key={label}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="text-sm text-white/45 hover:text-white transition-colors font-medium"
                >
                  {label}
                </button>
              ) : (
                <a
                  key={label}
                  href={href}
                  className="text-sm text-white/45 hover:text-white transition-colors font-medium"
                >
                  {label}
                </a>
              )
            )}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-white/45 hover:text-white transition-colors font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm text-white font-semibold bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 px-5 h-9 rounded-xl transition-all shadow-lg shadow-rose-500/20"
            >
              Get started free
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/20 transition-all"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span
                  key="x"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-4 h-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="w-4 h-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </nav>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="md:hidden absolute top-full left-0 right-0 bg-[#08080f]/95 backdrop-blur-xl border-b border-white/[0.08] px-6 py-4 flex flex-col gap-1"
            >
              {NAV_LINKS.map(({ label, href, scroll }) =>
                scroll ? (
                  <button
                    key={label}
                    onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setMenuOpen(false); }}
                    className="flex items-center h-11 text-sm font-medium text-white/60 hover:text-white transition-colors text-left"
                  >
                    {label}
                  </button>
                ) : (
                  <a
                    key={label}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center h-11 text-sm font-medium text-white/60 hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                )
              )}
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center h-11 text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <div className="pt-2 pb-1">
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-violet-600 h-11 rounded-xl shadow-lg shadow-rose-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                  Get started free
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative flex flex-col md:flex-row items-center pt-24 pb-16 md:pt-[180px] md:pb-[212px] gap-10 md:gap-16 max-w-[1440px] mx-auto px-6 md:px-14"
      >
        {/* Background glows */}
        <div className="absolute top-1/3 -left-20 w-[400px] md:w-[600px] h-[400px] md:h-[500px] bg-rose-600/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-violet-600/6 rounded-full blur-3xl pointer-events-none" />

        {/* Left — content */}
        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="w-full md:flex-1 md:max-w-[580px] md:pr-8"
        >
          {/* Badge */}
          <motion.div {...fadeUp(0)} className="mb-7 md:mb-8">
            <div className="inline-flex items-center gap-2 md:gap-2.5 bg-violet-500/10 border border-violet-400/20 rounded-full px-4 md:px-5 py-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-rose-400 shrink-0"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <span className="text-xs text-violet-200 font-medium">
                Never plan a date again — we do it for you
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeUp(0.1)}
            className="text-[40px] sm:text-5xl lg:text-[62px] font-black leading-[1.03] tracking-tight mb-6 md:mb-7"
          >
            Stop planning.
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #fb7185 0%, #c026d3 50%, #8b5cf6 100%)",
              }}
            >
              Just show up.
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            {...fadeUp(0.2)}
            className="text-white/50 text-base md:text-xl leading-relaxed mb-8 md:mb-10 max-w-full md:max-w-[460px]"
          >
            Tell us what you like once. We find real venues near you, write your
            date story, and handle every detail. You just show up and enjoy.
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...fadeUp(0.3)}
            className="flex flex-row items-center gap-3 mb-10 md:mb-12"
          >
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center text-white font-bold px-7 py-4 rounded-2xl text-base transition-all overflow-hidden shadow-2xl shadow-rose-500/25"
              style={{ background: "linear-gradient(135deg, #e11d48 0%, #9333ea 100%)" }}
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              Get started free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center font-semibold text-base text-white px-7 py-4 rounded-2xl border border-rose-500 hover:border-rose-400 hover:bg-rose-500/10 backdrop-blur-sm transition-all duration-200"
            >
              Sign in
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div {...fadeUp(0.4)} className="flex flex-wrap gap-6 md:gap-10">
            {[
              { icon: Zap, value: "2 min", label: "Setup time" },
              { icon: Star, value: "★ 4.9", label: "Avg date rating" },
              { icon: MapPin, value: "50 km", label: "Always nearby" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">{value}</p>
                  <p className="text-[11px] text-white/30">{label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right — visual (full width centered on mobile, fixed width on desktop) */}
        <motion.div
          style={{ y: visualY }}
          {...fadeUp(0.35)}
          className="w-full max-w-[340px] mx-auto md:mr-0 md:ml-auto md:max-w-none md:w-[400px] md:flex-shrink-0 relative mt-6 md:mt-0"
        >
          {/* Halo */}
          <div className="absolute inset-0 -m-12 md:-m-16 bg-rose-500/8 rounded-full blur-3xl pointer-events-none" />

          {/* Floating chips — desktop only */}
          <motion.div
            className="hidden md:block absolute -left-20 top-14 z-10 bg-[#1a1025]/95 border border-violet-500/30 rounded-2xl px-4 py-3 shadow-xl shadow-black/50 backdrop-blur-sm"
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white leading-none">Date generated</p>
                <p className="text-[10px] text-white/30 mt-0.5">Just now · Near you</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hidden md:block absolute -right-16 bottom-24 z-10 bg-[#1a1025]/95 border border-emerald-500/30 rounded-2xl px-4 py-3 shadow-xl shadow-black/50 backdrop-blur-sm"
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white leading-none">+100 XP earned</p>
                <p className="text-[10px] text-white/30 mt-0.5">Date completed 🎉</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hidden md:block absolute -left-10 bottom-36 z-10 bg-[#1a1025]/95 border border-amber-500/30 rounded-2xl px-3.5 py-2 shadow-xl shadow-black/50 backdrop-blur-sm"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <p className="text-[11px] font-medium text-white/70">Real venue · Rating 4.9</p>
            </div>
          </motion.div>

          <div className="md:scale-[0.98] md:origin-center">
            <MysteryCard />
          </div>
        </motion.div>
      </section>

      {/* ── Marquee ── */}
      <div className="overflow-hidden border-y border-white/[0.05] py-4 bg-white/[0.008]">
        <motion.div
          className="flex gap-8 md:gap-10 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        >
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="text-xs md:text-sm text-white/22 font-medium whitespace-nowrap shrink-0">
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── How it works ── */}
      <section id="how-it-works" className="px-6 md:px-10 py-20 md:py-32 max-w-[1280px] mx-auto">
        <motion.div {...inView()} className="text-center mb-12 md:mb-20">
          <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-3 md:mb-4">
            The ritual
          </p>
          <h2 className="text-4xl md:text-5xl font-black leading-tight">
            Three steps, then
            <br />
            <span className="text-white/25">just show up</span>
          </h2>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Connector in gap 1 (between step 1 and step 2) */}
          <div
            className="absolute hidden lg:block h-px pointer-events-none"
            style={{
              top: "3.75rem",
              left: "calc((100% - 3rem) / 3)",
              width: "1.5rem",
              background: "linear-gradient(to right, rgba(244,63,94,0.4), rgba(139,92,246,0.4))",
            }}
          />
          {/* Connector in gap 2 (between step 2 and step 3) */}
          <div
            className="absolute hidden lg:block h-px pointer-events-none"
            style={{
              top: "3.75rem",
              left: "calc((100% - 3rem) / 3 * 2 + 1.5rem)",
              width: "1.5rem",
              background: "linear-gradient(to right, rgba(139,92,246,0.4), rgba(245,158,11,0.4))",
            }}
          />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              {...inView(i * 0.12)}
              className={`relative rounded-3xl border ${step.border} bg-gradient-to-br ${step.color} p-7 md:p-9`}
            >
              <div className="flex items-center gap-4 mb-5 md:mb-7">
                <div
                  className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl ${step.iconBg} border ${step.border} flex items-center justify-center shrink-0`}
                >
                  <step.icon className={`w-5 h-5 md:w-6 md:h-6 ${step.iconColor}`} />
                </div>
                <span className="text-4xl md:text-5xl font-black text-white/[0.05] font-mono leading-none select-none">
                  {step.number}
                </span>
              </div>
              <h3 className="font-bold text-white text-lg md:text-xl mb-2 md:mb-3 leading-tight">
                {step.title}
              </h3>
              <p className="text-white/45 text-sm md:text-base leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Feature bento ── */}
      <section id="features" className="px-6 md:px-10 py-16 md:py-20 max-w-[1280px] mx-auto">
        <motion.div {...inView()} className="text-center mb-12 md:mb-20">
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-3 md:mb-4">
            Everything included
          </p>
          <h2 className="text-4xl md:text-5xl font-black">
            No more &ldquo;I don&apos;t know,
            <br />
            <span className="text-white/25">
              what do you want to do?&rdquo;
            </span>
          </h2>
        </motion.div>

        {/* Desktop bento row heights injected via style tag */}
        <style>{`
          @media (min-width: 768px) {
            .bento-grid { grid-template-rows: repeat(4, 160px); }
          }
        `}</style>

        <div className="bento-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

          {/* Real places — large (desktop: col 1-2, row 1-2) */}
          <motion.div
            {...inView(0)}
            className="md:col-start-1 md:col-span-2 md:row-start-1 md:row-span-2 min-h-[220px] md:min-h-0 rounded-3xl border border-rose-500/15 bg-gradient-to-br from-rose-500/10 to-pink-500/5 p-7 md:p-9 flex flex-col justify-between overflow-hidden relative"
          >
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-rose-500/8 rounded-full blur-3xl pointer-events-none" />
            <div>
              <span className="text-3xl md:text-4xl mb-4 md:mb-5 block">🔮</span>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">
                Real places. No Googling.
              </h3>
              <p className="text-white/45 text-sm md:text-base leading-relaxed max-w-sm">
                Every suggestion is a real, top-rated venue near you — picked, vetted,
                and ready to go. No research required.
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-2.5 mt-5 md:mt-0">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                <MapPin className="w-3 h-3 text-rose-400" />
                <span className="text-xs text-white/50">Within 50 km</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                <Star className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-white/50">Rating ≥ 4.0</span>
              </div>
            </div>
          </motion.div>

          {/* Written for you — small (desktop: col 3, row 1) */}
          <motion.div
            {...inView(0.08)}
            className="md:col-start-3 md:row-start-1 min-h-[150px] md:min-h-0 rounded-3xl border border-violet-500/15 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-6 flex flex-col"
          >
            <span className="text-3xl mb-3 block">💌</span>
            <h3 className="font-bold text-white text-lg mb-1.5">Written for you two</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              AI writes the date like a friend who&apos;s been there.
            </p>
          </motion.div>

          {/* Budget-aware — small (desktop: col 3, row 2) */}
          <motion.div
            {...inView(0.12)}
            className="md:col-start-3 md:row-start-2 min-h-[150px] md:min-h-0 rounded-3xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-6 flex flex-col"
          >
            <span className="text-3xl mb-3 block">💸</span>
            <h3 className="font-bold text-white text-lg mb-1.5">Fits your wallet</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Set a max spend — every suggestion lands inside it.
            </p>
          </motion.div>

          {/* One tap — small (desktop: col 1, row 3) */}
          <motion.div
            {...inView(0.16)}
            className="md:col-start-1 md:row-start-3 min-h-[150px] md:min-h-0 rounded-3xl border border-blue-500/15 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-6 flex flex-col"
          >
            <span className="text-3xl mb-3 block">🗺️</span>
            <h3 className="font-bold text-white text-lg mb-1.5">One tap to get there</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Photo, vibe, directions — waiting the moment you reveal.
            </p>
          </motion.div>

          {/* Grow together — large (desktop: col 2-3, row 3-4) */}
          <motion.div
            {...inView(0.2)}
            className="md:col-start-2 md:col-span-2 md:row-start-3 md:row-span-2 min-h-[220px] md:min-h-0 rounded-3xl border border-amber-500/15 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-7 md:p-9 flex flex-col justify-between overflow-hidden relative"
          >
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
            <div>
              <span className="text-3xl md:text-4xl mb-4 md:mb-5 block">🏆</span>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">Grow together</h3>
              <p className="text-white/45 text-sm md:text-base leading-relaxed max-w-sm">
                Earn XP and unlock milestone badges for every date you complete. Love
                as a shared adventure.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-5 md:mt-0">
              {["🌟 First Spark", "⚡ Triple Threat", "🖐 High Five", "🔟 Perfect Ten"].map(
                (badge) => (
                  <div
                    key={badge}
                    className="flex items-center bg-white/5 border border-white/8 rounded-xl px-3 py-1.5"
                  >
                    <span className="text-xs text-white/50">{badge}</span>
                  </div>
                )
              )}
            </div>
          </motion.div>

          {/* Countdown — small (desktop: col 1, row 4) */}
          <motion.div
            {...inView(0.24)}
            className="md:col-start-1 md:row-start-4 min-h-[150px] md:min-h-0 rounded-3xl border border-pink-500/15 bg-gradient-to-br from-pink-500/10 to-rose-500/5 p-6 flex flex-col"
          >
            <span className="text-3xl mb-3 block">⏳</span>
            <h3 className="font-bold text-white text-lg mb-1.5">Anticipation built in</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              A live countdown builds excitement between reveals.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Sample dates ── */}
      <section className="px-6 md:px-10 py-16 md:py-20 max-w-[1280px] mx-auto">
        <motion.div {...inView()} className="text-center mb-12 md:mb-16">
          <p className="text-xs text-rose-400 font-semibold uppercase tracking-widest mb-3 md:mb-4">
            Sneak peek
          </p>
          <h2 className="text-4xl md:text-5xl font-black">
            Dates like these,
            <br />
            <span className="text-white/25">
              crafted for <em>you</em>
            </span>
          </h2>
        </motion.div>

        {/* Mobile: swipeable carousel (same as homepage) */}
        <div className="md:hidden">
          <DateCarousel />
        </div>

        {/* Desktop: 3-column static grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {SAMPLE_DATES.map((date, i) => (
            <motion.div
              key={date.title}
              {...inView(i * 0.1)}
              className="rounded-3xl border border-white/8 bg-[#121220] overflow-hidden hover:border-white/16 hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`relative h-52 bg-gradient-to-br ${date.photoBg} flex items-center justify-center overflow-hidden`}
              >
                <span className="text-6xl relative z-10">{date.emoji}</span>
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-white">{date.rating}</span>
                </div>
                <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-[10px] font-semibold text-pink-300 uppercase tracking-widest">
                    Mystery Date
                  </span>
                </div>
              </div>

              <div className="p-7">
                <h3 className="text-lg font-bold text-white mb-1">{date.title}</h3>
                <p className="text-sm text-pink-300 font-medium mb-2.5">{date.vibe}</p>
                <div className="flex items-center gap-1.5 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-white/25 shrink-0" />
                  <p className="text-sm text-white/30 truncate">{date.venue}</p>
                </div>
                <p className="text-white/45 text-sm leading-relaxed mb-5 line-clamp-2">
                  {date.description}
                </p>

                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  {[
                    { icon: Timer, value: date.duration, label: "Duration" },
                    { icon: Wallet, value: date.budget, label: "Budget" },
                  ].map(({ icon: Icon, value, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2.5 bg-white/[0.04] border border-white/8 rounded-xl p-3"
                    >
                      <Icon className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-white/30">{label}</p>
                        <p className="text-xs font-semibold text-white">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {date.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2.5 py-1 rounded-full border text-[11px] font-medium ${date.tagStyle}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="hidden md:block text-center text-white/20 text-sm mt-10">
          Your actual dates will always be a surprise ✨
        </p>
      </section>

      {/* ── Pricing ── */}
      <section id="plans" className="px-6 md:px-10 py-20 md:py-28 max-w-[1280px] mx-auto">
        <motion.div {...inView()} className="text-center mb-12 md:mb-16">
          <p className="text-xs text-rose-400 font-semibold uppercase tracking-widest mb-3 md:mb-4">
            Pricing
          </p>
          <h2 className="text-4xl md:text-5xl font-black">
            Simple, honest pricing.
            <br />
            <span className="text-white/25">No surprises on the bill.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 max-w-sm md:max-w-[820px] mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              {...inView(i * 0.12)}
              className={[
                "relative flex flex-col gap-7 md:gap-8 rounded-3xl border p-7 md:p-10",
                plan.highlighted
                  ? "bg-gradient-to-br from-pink-500/15 to-violet-500/10 border-pink-500/50"
                  : "bg-white/[0.025] border-white/8",
              ].join(" ")}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-7">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-violet-600 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg shadow-pink-500/25">
                    <Zap className="w-2.5 h-2.5" />
                    Most popular
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-4 md:mb-5">
                  <div
                    className={[
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      plan.highlighted ? "bg-pink-500/20" : "bg-white/8",
                    ].join(" ")}
                  >
                    {plan.highlighted ? (
                      <Sparkles className="w-5 h-5 text-pink-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                  <p className="font-bold text-white text-lg md:text-xl">{plan.name}</p>
                </div>
                <p
                  className={`text-3xl md:text-4xl font-black mb-1 ${
                    plan.highlighted ? "text-white" : "text-white/55"
                  }`}
                >
                  {plan.priceLine.split("/")[0].trim()}
                </p>
                {plan.highlighted && (
                  <p className="text-xs md:text-sm text-white/35 mb-3">
                    per month · cancel anytime
                  </p>
                )}
                <p className="text-sm md:text-base text-white/40 mt-2 md:mt-3">{plan.tagline}</p>
              </div>

              <ul className="flex flex-col gap-3 md:gap-3.5 flex-1">
                {plan.features.map((feat) => {
                  const isKey =
                    feat.includes("Full customization") || feat.includes("Weekly");
                  return (
                    <li key={feat} className="flex items-start gap-2.5 md:gap-3">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isKey && plan.highlighted ? "text-pink-400" : "text-emerald-400/70"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          isKey && plan.highlighted
                            ? "text-white font-semibold"
                            : "text-white/55"
                        }`}
                      >
                        {feat}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <Link
                href="/register"
                className={[
                  "w-full text-center py-3.5 md:py-4 rounded-2xl text-sm font-bold transition-all",
                  plan.highlighted
                    ? "bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-xl shadow-pink-500/20 hover:from-pink-400 hover:to-violet-500"
                    : "bg-white/8 text-white/65 border border-white/10 hover:bg-white/12 hover:text-white",
                ].join(" ")}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative px-6 md:px-10 py-28 md:py-44 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 90% at 50% 50%, #2d0a3e 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 50% 60% at 50% 120%, #7f1d1d 0%, transparent 70%)",
            }}
          />
        </div>

        <motion.div
          {...inView()}
          className="relative max-w-[680px] mx-auto text-center"
        >
          <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-8 md:mb-10">
            <motion.div
              className="absolute inset-0 rounded-3xl bg-rose-500/30"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-rose-500/50">
              <Heart className="w-9 h-9 md:w-11 md:h-11 text-white fill-white" />
            </div>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-5 md:mb-6 leading-tight">
            Your next great date
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #fb7185, #c026d3, #8b5cf6)",
              }}
            >
              is one tap away.
            </span>
          </h2>

          <p className="text-white/40 text-base md:text-xl mb-10 md:mb-12 leading-relaxed">
            Join couples who stopped arguing about what to do
            <br className="hidden sm:block" />
            — and started actually doing it.
          </p>

          <Link
            href="/register"
            className="group relative inline-flex items-center gap-3 text-white font-black px-8 py-5 md:px-12 md:py-6 rounded-2xl text-lg md:text-xl transition-all overflow-hidden shadow-2xl shadow-rose-500/40"
            style={{ background: "linear-gradient(135deg, #e11d48 0%, #9333ea 100%)" }}
          >
            <motion.span
              className="absolute inset-0 bg-white/10"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
            />
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-rose-200" />
            Book my first mystery date
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mt-7 md:mt-8">
            <span className="text-white/20 text-xs md:text-sm">Free to start</span>
            <span className="text-white/15 hidden sm:inline">·</span>
            <span className="text-white/20 text-xs md:text-sm">No credit card needed</span>
            <span className="text-white/15 hidden sm:inline">·</span>
            <span className="text-white/20 text-xs md:text-sm">Cancel anytime</span>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.05] px-6 md:px-10 py-10 md:py-12">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-0 md:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="text-white/30 text-sm font-medium">BlindfoldDate</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:gap-8">
            {[
              { label: "How it works", href: "#how-it-works" },
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#plans" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm text-white/22 hover:text-white/55 transition-colors"
              >
                {label}
              </a>
            ))}
            <Link
              href="/login"
              className="text-sm text-white/22 hover:text-white/55 transition-colors"
            >
              Sign in
            </Link>
          </div>

          <p className="text-white/15 text-xs">Mystery dates for curious couples</p>
        </div>
      </footer>
    </div>
  );
}
