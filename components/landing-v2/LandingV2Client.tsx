"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Sparkles,
  ArrowRight,
  Star,
  Lock,
  MapPin,
  Zap,
  ChevronDown,
  Check,
  Menu,
  X,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { MysteryCard, CountdownBadge } from "@/components/landing-v2/MysteryCard";
import DateCarousel from "@/components/landing/DateCarousel";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE, delay },
});

const TESTIMONIALS = [
  {
    quote: "We've been together 4 years and it felt like a first date again. I had no idea where we were going — butterflies the whole way.",
    names: "Mia & Jonas",
    location: "Amsterdam",
    dates: "12 mystery dates",
    emoji: "🥂",
  },
  {
    quote: "He's terrible at planning and I always end up choosing. BlindfoldDate fixed us. I literally gasped when it revealed a rooftop jazz bar.",
    names: "Sofia & Luca",
    location: "Milan",
    dates: "7 mystery dates",
    emoji: "🎷",
  },
  {
    quote: "We set it to spontaneous mode and had our best Sunday in years. A wine tasting we never would have picked ourselves.",
    names: "Anya & Raf",
    location: "Riga",
    dates: "9 mystery dates",
    emoji: "🍷",
  },
];

const STEPS = [
  {
    number: "I",
    icon: Heart,
    title: "Tell us your secret ingredients",
    body: "Your interests, budget, how far you'll travel, and how often you want that flutter of excitement. Two minutes, once.",
    color: "from-rose-500/20 to-pink-500/10",
    border: "border-rose-500/20",
    iconColor: "text-rose-400",
  },
  {
    number: "II",
    icon: Sparkles,
    title: "We do the magic",
    body: "Our AI scours real venues near you, picks the highest-rated hidden gem, and crafts a date story written just for you two.",
    color: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    number: "III",
    icon: Lock,
    title: "Reveal. Go. Adore.",
    body: "Hit reveal when the moment's right. The destination unlocks, navigation opens, and the only thing left to do is enjoy.",
    color: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
  },
];

const FEATURES = [
  { emoji: "🔮", title: "Real places, real magic", body: "Every suggestion is a live, top-rated venue near you — never a generic idea you'll Google and forget." },
  { emoji: "💌", title: "Written for you two", body: "The AI knows your interests and writes the date like a friend who's been there. Intimate, specific, yours." },
  { emoji: "⏳", title: "The wait is half the fun", body: "A live countdown builds anticipation between dates. When it hits zero — the next adventure unlocks." },
  { emoji: "💸", title: "Fits your wallet", body: "Set a max spend and every suggestion lands inside it. Zero bill anxiety, full romantic energy." },
  { emoji: "🗺️", title: "One tap to get there", body: "Photo, vibe, directions — all waiting the moment you reveal. No scrambling, just excitement." },
  { emoji: "🏆", title: "Grow together", body: "Earn XP and unlock milestone badges for every date you complete. Love as a shared adventure." },
];

export default function LandingV2Client() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      {/* Subtle grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Nav ── */}
      <div className="sticky top-0 z-50">
        <div className="absolute inset-0 bg-[#08080f]/80 backdrop-blur-xl border-b border-white/5" />
        <nav className="relative flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center shadow-lg shadow-rose-500/40">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">BlindfoldDate</span>
          </div>

          {/* Desktop nav items */}
          <div className="hidden sm:flex items-center gap-7">
            <a href="#plans" className="text-sm text-white/60 hover:text-white transition-colors font-medium">
              Plans
            </a>
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors font-medium">
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm text-white font-semibold bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 px-5 h-9 inline-flex items-center rounded-xl transition-all shadow-lg shadow-rose-500/20"
            >
              Get started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden relative w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/20 transition-all"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="w-4 h-4" />
                </motion.span>
              ) : (
                <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
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
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="sm:hidden absolute top-full left-0 right-0 bg-[#08080f]/95 backdrop-blur-xl border-b border-white/8 px-6 py-4 flex flex-col gap-1"
            >
              <a
                href="#plans"
                onClick={() => setMenuOpen(false)}
                className="flex items-center h-11 text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                Plans
              </a>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center h-11 text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <div className="pt-2 pb-1">
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 h-11 rounded-xl transition-all shadow-lg shadow-rose-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                  Get started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Hero ── */}
      <section className="relative px-6 pt-20 pb-16 max-w-5xl mx-auto text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div {...fadeUp(0)} className="mb-6">
          <CountdownBadge />
        </motion.div>

        <motion.h1 {...fadeUp(0.1)} className="text-5xl sm:text-7xl font-black leading-[1.05] tracking-tight mb-6">
          Stop planning.
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #fb7185 0%, #c026d3 50%, #8b5cf6 100%)" }}
          >
            Start surprising.
          </span>
        </motion.h1>

        <motion.p {...fadeUp(0.2)} className="text-white/50 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          BlindfoldDate plans your perfect mystery date — real venues, AI-crafted story, complete surprise.
          You just show up and fall in love all over again.
        </motion.p>

        <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <Link
            href="/register"
            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all overflow-hidden shadow-2xl shadow-rose-500/30"
            style={{ background: "linear-gradient(135deg, #e11d48 0%, #9333ea 100%)" }}
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="w-4 h-4 text-rose-200" />
            Unlock my mystery date
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto text-sm text-white/50 hover:text-white font-medium px-6 py-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all"
          >
            Already have an account →
          </Link>
        </motion.div>

        <motion.p {...fadeUp(0.4)} className="text-white/20 text-xs">
          Free forever · No credit card · Surprise included
        </motion.p>

        <motion.div
          className="mt-12 flex flex-col items-center gap-2 text-white/20"
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </section>

      {/* ── Mystery card preview ── */}
      <section className="px-6 py-16 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
        >
          <MysteryCard />
        </motion.div>
        <p className="text-center text-white/20 text-xs mt-6">
          Your date is sealed until you&apos;re both ready ✨
        </p>
      </section>

      {/* ── Social proof strip ── */}
      <section className="px-6 py-10 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "2 min", label: "Setup time", icon: Zap },
            { value: "★ 4.9", label: "Avg date rating", icon: Star },
            { value: "50 km", label: "Search radius", icon: MapPin },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center bg-white/[0.03] border border-white/8 rounded-2xl p-5">
              <Icon className="w-4 h-4 text-rose-400 mx-auto mb-2" />
              <p className="text-xl font-black text-white">{value}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-xs text-rose-400 font-semibold uppercase tracking-widest mb-3">Real couples, real surprises</p>
          <h2 className="text-3xl sm:text-4xl font-black">
            They stopped planning.
            <br />
            <span className="text-white/40">They started loving.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.names}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 flex flex-col gap-4"
            >
              <span className="text-3xl">{t.emoji}</span>
              <p className="text-white/70 text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3 h-3 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="font-bold text-white text-sm">{t.names}</p>
                <p className="text-white/30 text-xs">{t.location} · {t.dates}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-3">The ritual</p>
          <h2 className="text-3xl sm:text-4xl font-black">Three steps to a night<br />you&apos;ll never forget</h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`relative rounded-3xl border ${step.border} bg-gradient-to-br ${step.color} p-7`}
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`w-10 h-10 rounded-xl bg-white/5 border ${step.border} flex items-center justify-center`}>
                  <step.icon className={`w-5 h-5 ${step.iconColor}`} />
                </div>
                <span className="text-4xl font-black text-white/5 font-mono">{step.number}</span>
              </div>
              <h3 className="font-bold text-white text-lg mb-2 leading-tight">{step.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Sample dates carousel ── */}
      <section className="px-6 py-16 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-xs text-rose-400 font-semibold uppercase tracking-widest mb-3">Sneak peek</p>
          <h2 className="text-2xl font-black">Dates like these,<br />crafted for <em>you</em></h2>
        </motion.div>
        <DateCarousel />
      </section>

      {/* ── Features grid ── */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-3">Everything included</p>
          <h2 className="text-3xl sm:text-4xl font-black">No more &ldquo;I don&apos;t know,<br />what do <em>you</em> want to do?&rdquo;</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="group bg-white/[0.03] hover:bg-white/[0.055] border border-white/8 hover:border-white/14 rounded-3xl p-6 transition-all"
            >
              <span className="text-3xl mb-3 block">{f.emoji}</span>
              <h3 className="font-bold text-white mb-1.5">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="plans" className="px-6 py-20 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs text-rose-400 font-semibold uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-black">
            Simple, honest pricing.
            <br />
            <span className="text-white/40">No surprises on the bill.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className={[
                "relative flex flex-col gap-6 rounded-3xl border p-7",
                plan.highlighted
                  ? "bg-gradient-to-br from-pink-500/15 to-violet-500/10 border-pink-500/50"
                  : "bg-white/[0.03] border-white/8",
              ].join(" ")}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-6">
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-pink-500 to-violet-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                    <Zap className="w-2.5 h-2.5" />
                    Most popular
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={[
                    "w-8 h-8 rounded-xl flex items-center justify-center",
                    plan.highlighted ? "bg-pink-500/20" : "bg-white/8",
                  ].join(" ")}>
                    {plan.highlighted
                      ? <Sparkles className="w-4 h-4 text-pink-400" />
                      : <Lock className="w-4 h-4 text-white/40" />}
                  </div>
                  <p className="font-bold text-white text-lg">{plan.name}</p>
                </div>
                <p className={`text-3xl font-black ${plan.highlighted ? "text-white" : "text-white/70"}`}>
                  {plan.priceLine.split("/")[0].trim()}
                </p>
                {plan.highlighted && (
                  <p className="text-xs text-white/35 mt-1">per month · cancel anytime</p>
                )}
                <p className="text-sm text-white/40 mt-2">{plan.tagline}</p>
              </div>

              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map((feat) => {
                  const isKey = feat.includes("Full customization") || feat.includes("Weekly");
                  return (
                    <li key={feat} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isKey && plan.highlighted ? "text-pink-400" : "text-emerald-400/70"}`} />
                      <span className={`text-sm ${isKey && plan.highlighted ? "text-white font-semibold" : "text-white/55"}`}>
                        {feat}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <Link
                href="/register"
                className={[
                  "w-full text-center py-3 rounded-2xl text-sm font-bold transition-all",
                  plan.highlighted
                    ? "bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-lg shadow-pink-500/25 hover:from-pink-400 hover:to-violet-500"
                    : "bg-white/8 text-white/70 border border-white/10 hover:bg-white/12 hover:text-white",
                ].join(" ")}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 80% at 50% 50%, #2d0a3e 0%, transparent 70%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 50% at 50% 120%, #7f1d1d 0%, transparent 70%)" }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative max-w-lg mx-auto text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-8">
            <motion.div
              className="absolute inset-0 rounded-3xl bg-rose-500/30"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-rose-500/50">
              <Heart className="w-9 h-9 text-white fill-white" />
            </div>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            Your next great date
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #fb7185, #c026d3, #8b5cf6)" }}
            >
              is one tap away.
            </span>
          </h2>

          <p className="text-white/40 text-lg mb-10 leading-relaxed">
            Join couples who&apos;ve handed the planning to us
            and got their spark back in return.
          </p>

          <Link
            href="/register"
            className="group relative inline-flex items-center gap-3 text-white font-black px-10 py-5 rounded-2xl text-lg transition-all overflow-hidden shadow-2xl shadow-rose-500/40"
            style={{ background: "linear-gradient(135deg, #e11d48 0%, #9333ea 100%)" }}
          >
            <motion.span
              className="absolute inset-0 bg-white/10"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.5 }}
            />
            <Sparkles className="w-5 h-5 text-rose-200" />
            Book my first mystery date
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <div className="flex items-center justify-center gap-6 mt-6">
            <p className="text-white/20 text-xs">Free to start</p>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <p className="text-white/20 text-xs">No credit card needed</p>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <p className="text-white/20 text-xs">Cancel anytime</p>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/6 px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center">
              <Heart className="w-3 h-3 text-white fill-white" />
            </div>
            <span className="text-white/30 text-sm font-medium">BlindfoldDate</span>
          </div>
          <p className="text-white/15 text-xs">Mystery dates for curious couples</p>
        </div>
      </footer>
    </div>
  );
}
