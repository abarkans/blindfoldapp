"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
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
import { MysteryCardBold } from "./MysteryCardBold";

import DateCarousel from "@/components/landing/DateCarousel";

const STEPS = [
  {
    number: "01",
    icon: Heart,
    title: "Tell us your taste",
    body: "Your interests, budget, and how far you'll travel. Two minutes, done once. Never fill it in again.",
    accent: "rose",
    border: "border-rose-500/20",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-400",
    glow: "bg-rose-500/8",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "We do the planning",
    body: "AI scours real nearby venues, picks the highest-rated hidden gem, and writes a date story just for you two.",
    accent: "violet",
    border: "border-violet-500/20",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-400",
    glow: "bg-violet-500/8",
  },
  {
    number: "03",
    icon: Lock,
    title: "Reveal. Go. Enjoy.",
    body: "Hit reveal when you're ready. The destination unlocks, navigation opens, and the only thing left is to enjoy.",
    accent: "amber",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    glow: "bg-amber-500/8",
  },
];

const STATS = [
  { icon: Zap, value: "2 min", label: "Setup — done once, forever" },
  { icon: MapPin, value: "50 km", label: "Venue search radius" },
  { icon: Star, value: "4.0+", label: "Minimum venue rating" },
  { icon: Wallet, value: "€0", label: "To get started" },
];

const SAMPLE_DATES = [
  {
    emoji: "📸",
    title: "Golden Hour Walk",
    vibe: "Romantic & Creative",
    venue: "Botanical Garden, Old Town",
    description: "A mystery route timed perfectly for golden hour. Camera required — you'll want to remember this one.",
    rating: 4.8,
    duration: "2 hrs",
    budget: "€0–15",
    tags: ["Outdoor", "Romantic"],
    photoBg: "from-amber-900/60 to-orange-900/40",
    tagStyle: "bg-amber-500/10 border-amber-500/25 text-amber-300",
  },
  {
    emoji: "🍷",
    title: "Blind Tasting Night",
    vibe: "Playful & Sophisticated",
    venue: "La Cave Wine Bar, City Centre",
    description: "A curated flight of wines at a hidden wine bar. Guess what you're drinking — loser picks next time.",
    rating: 4.7,
    duration: "2 hrs",
    budget: "€30–60",
    tags: ["Evening", "Food & Drink"],
    photoBg: "from-purple-900/60 to-rose-900/40",
    tagStyle: "bg-purple-500/10 border-purple-500/25 text-purple-300",
  },
  {
    emoji: "🎬",
    title: "Surprise Cinema Date",
    vibe: "Spontaneous & Fun",
    venue: "Forum Cinemas, City Centre",
    description: "Show up and see whatever starts next. No trailers, no reviews — pure surprise and shared reactions.",
    rating: 4.6,
    duration: "3 hrs",
    budget: "€20–30",
    tags: ["Indoor", "Cosy"],
    photoBg: "from-blue-900/60 to-indigo-900/40",
    tagStyle: "bg-blue-500/10 border-blue-500/25 text-blue-300",
  },
];

const NAV_LINKS = [
  { label: "Home", href: "#", scroll: true },
  { label: "How it works", href: "#how-it-works", scroll: false },
  { label: "Features", href: "#features", scroll: false },
  { label: "Pricing", href: "#plans", scroll: false },
];

export default function LandingV3Client() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (document.cookie.includes("onboarding_complete=1")) {
        setIsLoggedIn(true);
        return;
      }

      // Fallback for existing users without the cookie yet — one-time DB call.
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", session.user.id)
        .single();

      if (profile?.onboarding_complete) {
        const secure = location.protocol === "https:" ? "; secure" : "";
        document.cookie = `onboarding_complete=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax${secure}`;
        setIsLoggedIn(true);
      }
    })();
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:bg-violet-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      {/* Subtle grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* ── Nav ── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-[#08080f]/95 backdrop-blur-2xl border-b border-white/[0.05]" />
        <nav className="relative flex items-center justify-between px-6 md:px-14 h-[68px] max-w-[1440px] mx-auto">
          <button
            onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setMenuOpen(false); }}
            className="flex items-center gap-2.5 group"
            aria-label="BlindfoldDate — scroll to top"
          >
            <Image src="/logo.png" alt="BlindfoldDate" width={180} height={44} priority className="object-contain group-hover:opacity-75 transition-opacity" />
          </button>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href, scroll }) =>
              scroll ? (
                <button
                  key={label}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="text-sm text-white/55 hover:text-white transition-colors font-medium"
                >
                  {label}
                </button>
              ) : (
                <a
                  key={label}
                  href={href}
                  className="text-sm text-white/55 hover:text-white transition-colors font-medium"
                >
                  {label}
                </a>
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-white font-semibold bg-rose-500 hover:bg-rose-400 px-5 h-10 rounded-2xl transition-all"
              >
                Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-white/40 hover:text-white transition-colors font-medium">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-sm text-white font-semibold bg-rose-500 hover:bg-rose-400 px-5 h-10 rounded-2xl transition-all"
                >
                  Get started free
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/20 transition-all"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </nav>

        {/* Mobile menu — CSS transition, always in DOM */}
        <div
          className={`md:hidden fixed inset-0 z-50 bg-[#08080f]/98 backdrop-blur-2xl flex flex-col px-6 pb-8 transition-[opacity,transform] duration-200 ease-out ${
            menuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-3 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between h-[68px] shrink-0">
            <button onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setMenuOpen(false); }} className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="BlindfoldDate" width={180} height={44} className="object-contain" />
            </button>
            <button onClick={() => setMenuOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/20 transition-all" aria-label="Close menu">
              <X className="w-4 h-4" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 flex-1 pt-4">
            {NAV_LINKS.map(({ label, href, scroll }) =>
              scroll ? (
                <button key={label} onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setMenuOpen(false); }} className="flex items-center h-14 text-xl font-semibold text-white/70 hover:text-white transition-colors text-left border-b border-white/[0.06]">
                  {label}
                </button>
              ) : (
                <a key={label} href={href} onClick={() => setMenuOpen(false)} className="flex items-center h-14 text-xl font-semibold text-white/70 hover:text-white transition-colors border-b border-white/[0.06]">
                  {label}
                </a>
              )
            )}
            {!isLoggedIn && (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center h-14 text-xl font-semibold text-white/70 hover:text-white transition-colors border-b border-white/[0.06]">
                Sign in
              </Link>
            )}
          </nav>
          <div className="pt-4">
            {isLoggedIn ? (
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="w-full flex items-center justify-center gap-2 text-base font-bold text-white bg-rose-500 hover:bg-rose-400 h-14 rounded-2xl transition-all">
                <ArrowRight className="w-4 h-4 text-rose-200" />
                Go to Dashboard
              </Link>
            ) : (
              <Link href="/register" onClick={() => setMenuOpen(false)} className="w-full flex items-center justify-center gap-2 text-base font-bold text-white bg-rose-500 hover:bg-rose-400 h-14 rounded-2xl transition-all">
                <Sparkles className="w-4 h-4 text-rose-200" />
                Plan our next date
              </Link>
            )}
          </div>
        </div>
      </header>

      <main id="main">
        {/* ── Hero ── */}
        <section
          className="relative md:min-h-[88dvh] pt-[120px] md:pt-[68px] pb-24 md:pb-20 max-w-[1440px] mx-auto px-6 md:px-14 flex flex-col md:block"
        >
          {/* Background glow orbs — radial-gradient avoids GPU blur layers on mobile */}
          <div className="absolute top-1/4 right-0 w-[600px] h-[600px] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(225,29,72,0.07) 0%, transparent 70%)" }} />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(124,58,237,0.08) 0%, transparent 70%)" }} />
          <div className="absolute bottom-1/4 right-1/6 w-[300px] h-[300px] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(147,51,234,0.06) 0%, transparent 70%)" }} />

          {/* Left — text content */}
          <div className="w-full md:max-w-[420px] lg:max-w-[640px] xl:max-w-[700px] flex flex-col justify-center md:min-h-[calc(88dvh-88px)]">
            {/* Hero headline — Bumble-bold scale */}
            <h1 className="text-[52px] sm:text-[64px] lg:text-[80px] font-black leading-[1.04] tracking-tight mb-8 md:mb-10">
              <span className="block">
                Stop planning.
              </span>
              <span
                className="block bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #fb7185 0%, #c026d3 45%, #8b5cf6 100%)" }}
              >
                Just show up.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-white/50 text-base md:text-xl leading-[1.7] mb-10 md:mb-12 max-w-[480px]">
              Tell us what you like once. We find real venues near you, write your
              date story, and handle every detail.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 md:mb-8">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="group relative inline-flex items-center justify-center text-white font-bold px-8 h-14 md:h-16 rounded-2xl text-base md:text-lg transition-all overflow-hidden bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-500/25"
                >
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="group relative inline-flex items-center justify-center text-white font-bold px-8 h-14 md:h-16 rounded-2xl text-base md:text-lg transition-all overflow-hidden bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-500/25"
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Plan our next date
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center font-semibold text-base text-white px-8 h-14 md:h-16 rounded-2xl border border-white/15 hover:border-white/30 hover:bg-white/5 backdrop-blur-sm transition-all"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>

            {/* Trust line */}
            <p className="text-white/35 text-sm">
              Free to start · No credit card · Cancel anytime
            </p>
          </div>

          {/* Right — visual: abstract glows + bold card */}
          <div
            className="hidden md:block absolute -right-24 lg:-right-10 xl:right-0 top-1/2 -translate-y-1/2 w-[360px] lg:w-[400px]"
          >
            {/* Abstract gradient orb cluster behind card */}
            <div className="absolute inset-0 -m-16 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-1/4 w-64 h-64 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(244,63,94,0.12) 0%, transparent 70%)", opacity: 0.8 }} />
              <div className="absolute bottom-0 right-1/4 w-56 h-56 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.10) 0%, transparent 70%)", opacity: 0.7 }} />
            </div>

            {/* Floating chips — desktop only */}
            <div className="hidden md:block absolute -left-24 top-10 z-10 bg-[#1a1025]/96 border border-violet-500/30 rounded-2xl px-4 py-3 shadow-xl shadow-black/60 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/25 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-white leading-none">Date generated</p>
                  <p className="text-[10px] text-white/50 mt-0.5">Just now · Near you</p>
                </div>
              </div>
            </div>

            <div className="hidden md:block absolute -right-20 bottom-28 z-10 bg-[#1a1025]/96 border border-emerald-500/30 rounded-2xl px-4 py-3 shadow-xl shadow-black/60 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/25 flex items-center justify-center shrink-0">
                  <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-white leading-none">+100 XP earned</p>
                  <p className="text-[10px] text-white/50 mt-0.5">Date completed 🎉</p>
                </div>
              </div>
            </div>

            <div className="hidden md:block absolute -left-14 bottom-40 z-10 bg-[#1a1025]/96 border border-amber-500/30 rounded-2xl px-3.5 py-2.5 shadow-xl shadow-black/60 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <p className="text-[11px] font-medium text-white/65">Real venue · Rating 4.9</p>
              </div>
            </div>

            <MysteryCardBold />
          </div>
        </section>

        {/* ── Stats strip ── */}
        <div className="relative border-y border-white/[0.05] bg-white/[0.015]">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-10 md:py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-white/[0.07]">
              {STATS.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center md:px-10 text-center gap-2"
                >
                  <p className="text-2xl md:text-3xl font-black text-white">{value}</p>
                  <p className="text-xs md:text-sm text-white/45 font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── How it works ── */}
        <section id="how-it-works" className="px-6 md:px-10 py-28 md:py-44 max-w-[1280px] mx-auto">
          <div className="text-center mb-16 md:mb-28">
            <p className="text-xs text-violet-400 font-medium uppercase tracking-[0.14em] mb-5">
              The ritual
            </p>
            <h2 className="text-[36px] md:text-[56px] font-black leading-[1.08] tracking-tight">
              Three steps,
              <br />
              <span className="text-white/35">then just show up.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className={`relative rounded-3xl border ${step.border} p-8 md:p-10 overflow-hidden group hover:-translate-y-1 transition-transform duration-300`}
              >
                {/* Background glow */}
                <div className={`absolute inset-0 ${step.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />

                <div className="relative flex items-start gap-5 mb-6 md:mb-8">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${step.iconBg} border ${step.border} flex items-center justify-center shrink-0`}>
                    <step.icon className={`w-6 h-6 md:w-7 md:h-7 ${step.iconColor}`} />
                  </div>
                  <span className="text-5xl md:text-6xl font-black text-white/[0.04] font-mono leading-none select-none mt-1">
                    {step.number}
                  </span>
                </div>
                <h3 className="relative font-bold text-white text-lg md:text-xl mb-4 leading-snug">
                  {step.title}
                </h3>
                <p className="relative text-white/55 text-sm md:text-base leading-[1.7]">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="relative border-y border-white/[0.04] bg-white/[0.01]">
          <div className="px-6 md:px-10 py-28 md:py-44 max-w-[1280px] mx-auto">
            <div className="text-center mb-16 md:mb-28">
              <p className="text-xs text-amber-400 font-medium uppercase tracking-[0.14em] mb-5">
                Everything included
              </p>
              <h2 className="text-[36px] md:text-[56px] font-black leading-[1.08] tracking-tight">
                No more &ldquo;I don&apos;t know,
                <br />
                <span className="text-white/35">what do you want to do?&rdquo;</span>
              </h2>
            </div>

            <style>{`
              @media (min-width: 768px) {
                .bento-grid-v3 { grid-template-rows: repeat(4, 164px); }
              }
            `}</style>

            <div className="bento-grid-v3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {/* Real places — large */}
              <div
                className="md:col-start-1 md:col-span-2 md:row-start-1 md:row-span-2 min-h-[220px] md:min-h-0 rounded-3xl border border-white/8 p-7 md:p-10 flex flex-col justify-between overflow-hidden relative group"
              >
                <Image fill priority sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 66vw" className="object-cover transition-transform duration-700 group-hover:scale-105" src="/features/feat-1.jpg" alt="Mystery date planning" />
                <div className="absolute inset-0 bg-[#08080f]/88" />
                <div className="relative z-10">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                    Real places. No Googling.
                  </h3>
                  <p className="text-white/55 text-sm md:text-base leading-[1.65] max-w-sm">
                    Every suggestion is a real, top-rated venue near you — picked, vetted,
                    and ready to go.
                  </p>
                </div>
                <div className="relative z-10 flex items-center gap-2.5 mt-6 md:mt-0">
                  <div className="flex items-center gap-1.5 bg-white/10 border border-white/12 rounded-xl px-3 py-1.5">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span className="text-xs text-white/60">Within 50 km</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 border border-white/12 rounded-xl px-3 py-1.5">
                    <Star className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-white/60">Rating ≥ 4.0</span>
                  </div>
                </div>
              </div>

              {/* Written for you */}
              <div
                className="md:col-start-3 md:row-start-1 min-h-[150px] md:min-h-0 rounded-3xl border border-white/8 p-6 md:p-7 flex flex-col overflow-hidden relative group"
              >
                <Image fill sizes="33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" src="/features/feat-2.jpg" alt="Written for you" />
                <div className="absolute inset-0 bg-[#08080f]/88" />
                <div className="relative z-10">
                  <h3 className="font-bold text-white text-base md:text-lg mb-2">Written for you two</h3>
                  <p className="text-white/55 text-sm leading-[1.65]">AI writes the date like a friend who&apos;s been there.</p>
                </div>
              </div>

              {/* Budget-aware */}
              <div
                className="md:col-start-3 md:row-start-2 min-h-[150px] md:min-h-0 rounded-3xl border border-white/8 p-6 md:p-7 flex flex-col overflow-hidden relative group"
              >
                <Image fill sizes="33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" src="/features/feat-3.jpg" alt="Budget aware" />
                <div className="absolute inset-0 bg-[#08080f]/88" />
                <div className="relative z-10">
                  <h3 className="font-bold text-white text-base md:text-lg mb-2">Fits your wallet</h3>
                  <p className="text-white/55 text-sm leading-[1.65]">Set a max spend — every suggestion lands inside it.</p>
                </div>
              </div>

              {/* One tap */}
              <div
                className="md:col-start-1 md:row-start-3 min-h-[150px] md:min-h-0 rounded-3xl border border-white/8 p-6 md:p-7 flex flex-col overflow-hidden relative group"
              >
                <Image fill sizes="33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" src="/features/feat-4.jpg" alt="One tap" />
                <div className="absolute inset-0 bg-[#08080f]/88" />
                <div className="relative z-10">
                  <h3 className="font-bold text-white text-base md:text-lg mb-2">One tap to get there</h3>
                  <p className="text-white/55 text-sm leading-[1.65]">Photo, vibe, directions — waiting the moment you reveal.</p>
                </div>
              </div>

              {/* Grow together — large */}
              <div
                className="md:col-start-2 md:col-span-2 md:row-start-3 md:row-span-2 min-h-[220px] md:min-h-0 rounded-3xl border border-white/8 p-7 md:p-10 flex flex-col justify-between overflow-hidden relative group"
              >
                <Image fill sizes="66vw" className="object-cover transition-transform duration-700 group-hover:scale-105" src="/features/feat-5.jpg" alt="Grow together" />
                <div className="absolute inset-0 bg-[#08080f]/88" />
                <div className="relative z-10">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Grow together</h3>
                  <p className="text-white/55 text-sm md:text-base leading-[1.65] max-w-sm">
                    Earn XP and unlock milestone badges for every date you complete.
                  </p>
                </div>
                <div className="relative z-10 flex items-center gap-2 flex-wrap mt-6 md:mt-0">
                  {["🌟 First Spark", "⚡ Triple Threat", "🖐 High Five", "🔟 Perfect Ten"].map((badge) => (
                    <div key={badge} className="flex items-center bg-white/10 border border-white/12 rounded-xl px-3 py-1.5">
                      <span className="text-xs text-white/60">{badge}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Countdown */}
              <div
                className="md:col-start-1 md:row-start-4 min-h-[150px] md:min-h-0 rounded-3xl border border-white/8 p-6 md:p-7 flex flex-col overflow-hidden relative group"
              >
                <Image fill sizes="33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" src="/features/feat-6.jpg" alt="Anticipation" />
                <div className="absolute inset-0 bg-[#08080f]/88" />
                <div className="relative z-10">
                  <h3 className="font-bold text-white text-base md:text-lg mb-2">Anticipation built in</h3>
                  <p className="text-white/55 text-sm leading-[1.65]">A live countdown builds excitement between reveals.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Sample dates ── */}
        <section className="px-6 md:px-10 py-28 md:py-44 max-w-[1280px] mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <p className="text-xs text-rose-400 font-medium uppercase tracking-[0.14em] mb-5">
              Sneak peek
            </p>
            <h2 className="text-[36px] md:text-[56px] font-black leading-[1.08] tracking-tight">
              Dates like these,
              <br />
              <span className="text-white/35">crafted for <em>you.</em></span>
            </h2>
          </div>

          <div className="md:hidden">
            <DateCarousel />
          </div>

          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {SAMPLE_DATES.map((date) => (
              <div
                key={date.title}
                className="rounded-3xl border border-white/8 bg-[#0e0c1a] overflow-hidden hover:border-white/16 hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className={`relative h-56 bg-gradient-to-br ${date.photoBg} flex items-center justify-center overflow-hidden`}>
                  <span className="text-7xl relative z-10">{date.emoji}</span>
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-white">{date.rating}</span>
                  </div>
                  <div className="absolute top-4 left-4 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span className="text-[10px] font-bold text-pink-300 uppercase tracking-widest">Mystery Date</span>
                  </div>
                </div>

                <div className="p-7 md:p-8">
                  <h3 className="text-lg font-bold text-white mb-1">{date.title}</h3>
                  <p className="text-sm text-pink-300 font-semibold mb-3">{date.vibe}</p>
                  <div className="flex items-center gap-1.5 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    <p className="text-sm text-white/50 truncate">{date.venue}</p>
                  </div>
                  <p className="text-white/55 text-sm leading-[1.65] mb-6 line-clamp-2">{date.description}</p>

                  <div className="grid grid-cols-2 gap-2.5 mb-5">
                    {[
                      { icon: Timer, value: date.duration, label: "Duration" },
                      { icon: Wallet, value: date.budget, label: "Budget" },
                    ].map(({ icon: Icon, value, label }) => (
                      <div key={label} className="flex items-center gap-2.5 bg-white/[0.04] border border-white/8 rounded-xl p-3">
                        <Icon className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-white/45">{label}</p>
                          <p className="text-xs font-bold text-white">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {date.tags.map((tag) => (
                      <span key={tag} className={`px-2.5 py-1 rounded-full border text-[11px] font-medium ${date.tagStyle}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="hidden md:block text-center text-white/40 text-sm mt-12">
            Your actual dates will always be a surprise ✨
          </p>
        </section>

        {/* ── Pricing ── */}
        <section id="plans" className="relative border-t border-white/[0.04] bg-white/[0.015]">
        <div className="px-6 md:px-10 py-28 md:py-44 max-w-[1280px] mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <p className="text-xs text-rose-400 font-medium uppercase tracking-[0.14em] mb-5">
              Pricing
            </p>
            <h2 className="text-[36px] md:text-[56px] font-black leading-[1.08] tracking-tight">
              Simple, honest pricing.
              <br />
              <span className="text-white/35">No surprises on the bill.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 max-w-sm md:max-w-[840px] mx-auto">
            {PLANS.map((plan, i) => (
              <div
                key={plan.id}
                className={[
                  "relative flex flex-col gap-8 rounded-3xl border p-8 md:p-10",
                  plan.highlighted
                    ? "bg-gradient-to-br from-pink-500/15 to-violet-500/10 border-pink-500/50"
                    : "bg-white/[0.025] border-white/8",
                ].join(" ")}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-8">
                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-violet-600 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg shadow-pink-500/25">
                      <Zap className="w-2.5 h-2.5" />
                      Most popular
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={["w-11 h-11 rounded-2xl flex items-center justify-center", plan.highlighted ? "bg-pink-500/20" : "bg-white/8"].join(" ")}>
                      {plan.highlighted ? <Sparkles className="w-5 h-5 text-pink-400" /> : <Lock className="w-5 h-5 text-white/40" />}
                    </div>
                    <p className="font-bold text-white text-lg">{plan.name}</p>
                  </div>
                  {plan.introPrice !== null ? (
                    <>
                      <p className="text-4xl md:text-[42px] font-black mb-0.5 text-white">€{plan.introPrice}</p>
                      <p className="text-sm text-white/55">first month</p>
                      <p className="text-xs text-pink-300/70 mb-3">then €{plan.price}/mo · cancel anytime</p>
                    </>
                  ) : (
                    <>
                      <p className={`text-4xl md:text-[42px] font-black mb-1 ${plan.highlighted ? "text-white" : "text-white/50"}`}>
                        {plan.priceLine.split("/")[0].trim()}
                      </p>
                      {plan.highlighted && (
                        <p className="text-sm text-white/55 mb-3">per month · cancel anytime</p>
                      )}
                    </>
                  )}
                  <p className="text-sm md:text-base text-white/55 mt-3">{plan.tagline}</p>
                </div>

                <ul className="flex flex-col gap-3.5 flex-1">
                  {plan.features.map((feat) => {
                    const isKey = feat.includes("Full customization") || feat.includes("Weekly");
                    return (
                      <li key={feat} className="flex items-start gap-3">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isKey && plan.highlighted ? "text-pink-400" : "text-emerald-400/70"}`} />
                        <span className={`text-sm ${isKey && plan.highlighted ? "text-white font-semibold" : "text-white/55"}`}>{feat}</span>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  href={`/register?plan=${plan.id}`}
                  className={[
                    "w-full text-center py-4 md:py-5 rounded-2xl text-sm font-bold transition-all",
                    plan.highlighted
                      ? "bg-rose-500 text-white hover:bg-rose-400 shadow-lg shadow-rose-500/20"
                      : "bg-white/8 text-white/60 border border-white/10 hover:bg-white/12 hover:text-white",
                  ].join(" ")}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative overflow-hidden">
          {/* Full-bleed gradient background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 100% at 50% 50%, #2d0a3e 0%, transparent 70%)" }} />
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 70% at 50% 130%, #7f1d1d 0%, transparent 70%)" }} />
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 40% 50% at 20% 50%, #1e0a3e 0%, transparent 60%)" }} />
          </div>

          <div className="relative max-w-[720px] mx-auto px-6 text-center py-32 md:py-52">
            <div className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-10 md:mb-12">
              <Image src="/icon.png" alt="Blindfold" width={112} height={112} className="w-full h-full object-contain" />
            </div>

            <h2 className="text-[40px] sm:text-[56px] md:text-[72px] font-black mb-7 md:mb-8 leading-[1.05] tracking-tight">
              Your next great date
              <br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #fb7185, #c026d3, #8b5cf6)" }}>
                is one tap away.
              </span>
            </h2>

            <p className="text-white/55 text-base md:text-xl mb-12 md:mb-16 leading-[1.7]">
              Join couples who stopped arguing about what to do
              <br className="hidden sm:block" />
              — and started actually doing it.
            </p>

            <Link
              href="/register"
              className="group relative inline-flex items-center gap-3 text-white font-bold px-10 py-5 md:px-14 md:py-6 rounded-2xl text-base md:text-xl transition-all overflow-hidden bg-rose-500 hover:bg-rose-400 shadow-2xl shadow-rose-500/30"
            >
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-rose-200" />
              Book my first mystery date
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mt-8">
              <span className="text-white/40 text-sm">Free to start</span>
              <span className="text-white/20 hidden sm:inline">·</span>
              <span className="text-white/40 text-sm">No credit card needed</span>
              <span className="text-white/20 hidden sm:inline">·</span>
              <span className="text-white/40 text-sm">Cancel anytime</span>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.05] px-6 md:px-10 pt-14 pb-10">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 pb-10 border-b border-white/[0.05]">
            <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
              <Image src="/logo.png" alt="BlindfoldDate" width={120} height={30} className="object-contain opacity-45" />
              <p className="text-white/35 text-sm leading-relaxed max-w-[220px]">
                Date nights, planned for you. Tell us once — we handle the rest.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Product</p>
              {[{ label: "How it works", href: "#how-it-works" }, { label: "Features", href: "#features" }, { label: "Pricing", href: "#plans" }].map(({ label, href }) => (
                <a key={label} href={href} className="text-sm text-white/50 hover:text-white transition-colors">{label}</a>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Account</p>
              <Link href="/register" className="text-sm text-white/50 hover:text-white transition-colors">Get started free</Link>
              <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors">Sign in</Link>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Legal</p>
              <Link href="/legal/privacy" className="text-sm text-white/50 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/legal/terms" className="text-sm text-white/50 hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/legal/accessibility" className="text-sm text-white/50 hover:text-white transition-colors">Accessibility</Link>
              <a href="mailto:info@blindfolddate.com" className="text-sm text-white/50 hover:text-white transition-colors">Contact us</a>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/20 text-xs">© {new Date().getFullYear()} BlindfoldDate. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link href="/legal/privacy" className="text-xs text-white/20 hover:text-white/50 transition-colors">Privacy</Link>
              <Link href="/legal/terms" className="text-xs text-white/20 hover:text-white/50 transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
