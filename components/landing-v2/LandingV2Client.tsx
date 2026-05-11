"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import LinkButton from "@/components/ui/LinkButton";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Heart,
  Sparkles,
  ArrowRight,
  Star,
  Lock,
  MapPin,
  Check,
  Timer,
  Wallet,
  Menu,
  X,

} from "lucide-react";
import { PLANS } from "@/lib/plans";

const STEPS = [
  {
    number: "01",
    icon: Heart,
    title: "Tell us your taste",
    body: "Your interests, budget, and how far you'll travel. Two minutes, done once. Never fill it in again.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "We do the planning",
    body: "AI scours real nearby venues, picks the highest-rated hidden gem, and writes a date story just for you two.",
  },
  {
    number: "03",
    icon: Lock,
    title: "Reveal. Go. Enjoy.",
    body: "Hit reveal when you're ready. The destination unlocks, navigation opens, and the only thing left is to enjoy.",
  },
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
    image: "/features/feat-1.jpg",
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
    image: "/features/feat-3.jpg",
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
    image: "/features/feat-6.jpg",
  },
];

const NAV_LINKS = [
  { label: "Home", href: "#", scroll: true },
  { label: "How it works", href: "#how-it-works", scroll: false },
  { label: "Features", href: "#features", scroll: false },
  { label: "Pricing", href: "#plans", scroll: false },
];

const HERO_VIDEOS = [
  {
    poster: "/hero-video-poster.jpg",
    webm: "/hero-video.webm",
    mp4: "/hero-video-small.mp4",
  },
  {
    poster: "/hero-video2-poster.jpg",
    webm: "/hero-video2.webm",
    mp4: "/hero-video2-small.mp4",
  },
];

export default function LandingV2Client() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [heroVideo, setHeroVideo] = useState<(typeof HERO_VIDEOS)[number] | null>(null);
  const [heroVideoReady, setHeroVideoReady] = useState(false);

  useEffect(() => {
    setHeroVideoReady(false);
    setHeroVideo(HERO_VIDEOS[Math.floor(Math.random() * HERO_VIDEOS.length)]);
  }, []);

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
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const activeHeroVideo = heroVideo ?? HERO_VIDEOS[0];

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
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
        <div className="absolute inset-0 bg-black/72 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/[0.12] shadow-[0_1px_0_rgba(255,255,255,0.04),0_18px_60px_rgba(0,0,0,0.45)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.055] to-transparent pointer-events-none" />
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
                className="inline-flex items-center gap-2 text-sm text-white font-semibold bg-rose-500 hover:bg-rose-400 px-5 h-10 rounded-full transition-all"
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
                  className="inline-flex items-center gap-2 text-sm text-white font-semibold bg-rose-500 hover:bg-rose-400 px-5 h-10 rounded-full transition-all"
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
          className={`md:hidden fixed inset-0 z-50 bg-black/98 backdrop-blur-2xl flex flex-col px-6 pb-8 transition-[opacity,transform] duration-200 ease-out ${
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
              <LinkButton href="/dashboard" size="lg" className="w-full gap-2" onClick={() => setMenuOpen(false)}>
                <ArrowRight className="w-4 h-4 text-rose-200" />
                Go to Dashboard
              </LinkButton>
            ) : (
              <LinkButton href="/register" size="lg" className="w-full gap-2" onClick={() => setMenuOpen(false)}>
                Get started free
                <ArrowRight className="w-4 h-4 text-rose-200" />
              </LinkButton>
            )}
          </div>
        </div>
      </header>

      <main id="main">
        {/* ── Hero ── */}
        <section
          className="relative overflow-hidden border-b border-white/[0.07] bg-black"
        >
          <Image
            src={activeHeroVideo.poster}
            alt=""
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 object-cover opacity-70"
            aria-hidden="true"
          />
          {heroVideo && (
            <video
              key={heroVideo.webm}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                heroVideoReady ? "opacity-85" : "opacity-0"
              }`}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={heroVideo.poster}
              aria-hidden="true"
              onLoadedData={() => setHeroVideoReady(true)}
              onCanPlay={() => setHeroVideoReady(true)}
            >
              <source src={heroVideo.webm} type="video/webm" />
              <source src={heroVideo.mp4} type="video/mp4" />
            </video>
          )}
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.42)_44%,rgba(0,0,0,0.14)_78%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/38 via-transparent to-black/76" />

          <div className="relative mx-auto flex min-h-[76dvh] max-w-[1280px] flex-col items-start justify-end px-6 pb-14 pt-[120px] text-left md:px-10 md:pb-[72px] md:pt-[96px] lg:pb-24">
            <div className="w-full max-w-[720px]">
            {/* Hero headline — Bumble-bold scale */}
            <h1 className="text-[52px] sm:text-[64px] lg:text-[80px] font-black leading-[1.04] tracking-tight mb-7 md:mb-8 [filter:drop-shadow(0_6px_24px_rgba(0,0,0,0.88))]">
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
            <p className="max-w-[560px] text-white/78 text-base md:text-xl leading-[1.7] mb-9 md:mb-10 [text-shadow:0_3px_18px_rgba(0,0,0,0.9)]">
              Tell us what you like once. We find real venues near you, write your
              date story, and handle every detail.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-start gap-3">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="group relative inline-flex items-center justify-center text-white font-bold px-8 h-14 md:h-16 rounded-full text-base md:text-lg transition-all overflow-hidden bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-500/25"
                >
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="group relative inline-flex items-center justify-center text-white font-bold px-8 h-14 md:h-16 rounded-full text-base md:text-lg transition-all overflow-hidden bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-500/25"
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Plan our next date
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center font-semibold text-base text-white px-8 h-14 md:h-16 rounded-full border border-white/15 hover:border-white/30 hover:bg-white/5 backdrop-blur-sm transition-all"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>

            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="px-6 md:px-10 pt-14 pb-28 md:pt-20 md:pb-44 max-w-[1280px] mx-auto">
          <div className="text-center mb-10 md:mb-16">
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
                className="relative rounded-3xl border border-white/16 bg-[#030303] p-8 md:p-10 overflow-hidden group transition-all duration-300 hover:border-white/28 hover:bg-white/[0.035] hover:shadow-[0_28px_80px_rgba(255,255,255,0.06)]"
              >
                <div className="relative flex items-start gap-5 mb-6 md:mb-8">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/[0.045] border border-white/18 flex items-center justify-center shrink-0 transition-colors duration-300 group-hover:bg-white/[0.075] group-hover:border-white/30">
                    <step.icon className="w-6 h-6 md:w-7 md:h-7 text-white/68 transition-colors duration-300 group-hover:text-white" />
                  </div>
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
        <section id="features" className="relative border-y border-white/[0.07] bg-black">
          <div className="px-6 md:px-10 py-28 md:py-44 max-w-[1280px] mx-auto">
            <div className="text-left mb-10 md:mb-16">
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
                className="md:col-start-1 md:col-span-2 md:row-start-1 md:row-span-2 min-h-[220px] md:min-h-0 rounded-3xl border border-white/14 bg-[#030303] p-7 md:p-10 flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:border-white/26 hover:shadow-[0_28px_80px_rgba(255,255,255,0.06)]"
              >
                <Image fill priority sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 66vw" className="object-cover grayscale opacity-70" src="/features/feat-1.jpg" alt="Mystery date planning" />
                <div className="absolute inset-0 bg-black/82 transition-colors duration-300 group-hover:bg-black/74" />
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
                  <div className="flex items-center gap-1.5 bg-white/10 border border-white/18 rounded-xl px-3 py-1.5">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span className="text-xs text-white/60">Within 50 km</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 border border-white/18 rounded-xl px-3 py-1.5">
                    <Star className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-white/60">Rating ≥ 4.0</span>
                  </div>
                </div>
              </div>

              {/* Written for you */}
              <div
                className="md:col-start-3 md:row-start-1 min-h-[150px] md:min-h-0 rounded-3xl border border-white/14 bg-[#030303] p-6 md:p-7 flex flex-col overflow-hidden relative group transition-all duration-300 hover:border-white/26 hover:shadow-[0_28px_80px_rgba(255,255,255,0.06)]"
              >
                <Image fill sizes="33vw" className="object-cover grayscale opacity-70" src="/features/feat-2.jpg" alt="Written for you" />
                <div className="absolute inset-0 bg-black/82 transition-colors duration-300 group-hover:bg-black/74" />
                <div className="relative z-10">
                  <h3 className="font-bold text-white text-base md:text-lg mb-2">Written for you two</h3>
                  <p className="text-white/55 text-sm leading-[1.65]">AI writes the date like a friend who&apos;s been there.</p>
                </div>
              </div>

              {/* Budget-aware */}
              <div
                className="md:col-start-3 md:row-start-2 min-h-[150px] md:min-h-0 rounded-3xl border border-white/14 bg-[#030303] p-6 md:p-7 flex flex-col overflow-hidden relative group transition-all duration-300 hover:border-white/26 hover:shadow-[0_28px_80px_rgba(255,255,255,0.06)]"
              >
                <Image fill sizes="33vw" className="object-cover grayscale opacity-70" src="/features/feat-3.jpg" alt="Budget aware" />
                <div className="absolute inset-0 bg-black/82 transition-colors duration-300 group-hover:bg-black/74" />
                <div className="relative z-10">
                  <h3 className="font-bold text-white text-base md:text-lg mb-2">Fits your wallet</h3>
                  <p className="text-white/55 text-sm leading-[1.65]">Set a max spend — every suggestion lands inside it.</p>
                </div>
              </div>

              {/* One tap */}
              <div
                className="md:col-start-1 md:row-start-3 min-h-[150px] md:min-h-0 rounded-3xl border border-white/14 bg-[#030303] p-6 md:p-7 flex flex-col overflow-hidden relative group transition-all duration-300 hover:border-white/26 hover:shadow-[0_28px_80px_rgba(255,255,255,0.06)]"
              >
                <Image fill sizes="33vw" className="object-cover grayscale opacity-70" src="/features/feat-4.jpg" alt="One tap" />
                <div className="absolute inset-0 bg-black/82 transition-colors duration-300 group-hover:bg-black/74" />
                <div className="relative z-10">
                  <h3 className="font-bold text-white text-base md:text-lg mb-2">One tap to get there</h3>
                  <p className="text-white/55 text-sm leading-[1.65]">Photo, vibe, directions — waiting the moment you reveal.</p>
                </div>
              </div>

              {/* Grow together — large */}
              <div
                className="md:col-start-2 md:col-span-2 md:row-start-3 md:row-span-2 min-h-[220px] md:min-h-0 rounded-3xl border border-white/14 bg-[#030303] p-7 md:p-10 flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:border-white/26 hover:shadow-[0_28px_80px_rgba(255,255,255,0.06)]"
              >
                <Image fill sizes="66vw" className="object-cover grayscale opacity-70" src="/features/feat-5.jpg" alt="Grow together" />
                <div className="absolute inset-0 bg-black/82 transition-colors duration-300 group-hover:bg-black/74" />
                <div className="relative z-10">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Grow together</h3>
                  <p className="text-white/55 text-sm md:text-base leading-[1.65] max-w-sm">
                    Earn XP and unlock milestone badges for every date you complete.
                  </p>
                </div>
                <div className="relative z-10 flex items-center gap-2 flex-wrap mt-6 md:mt-0">
                  {["🌟 First Spark", "⚡ Triple Threat", "🖐 High Five", "🔟 Perfect Ten"].map((badge) => (
                    <div key={badge} className="flex items-center bg-white/10 border border-white/18 rounded-xl px-3 py-1.5">
                      <span className="text-xs text-white/60">{badge}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Countdown */}
              <div
                className="md:col-start-1 md:row-start-4 min-h-[150px] md:min-h-0 rounded-3xl border border-white/14 bg-[#030303] p-6 md:p-7 flex flex-col overflow-hidden relative group transition-all duration-300 hover:border-white/26 hover:shadow-[0_28px_80px_rgba(255,255,255,0.06)]"
              >
                <Image fill sizes="33vw" className="object-cover grayscale opacity-70" src="/features/feat-6.jpg" alt="Anticipation" />
                <div className="absolute inset-0 bg-black/82 transition-colors duration-300 group-hover:bg-black/74" />
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
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-[36px] md:text-[56px] font-black leading-[1.08] tracking-tight">
              Dates like these,
              <br />
              <span className="text-white/35">crafted for <em>you.</em></span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SAMPLE_DATES.map((date) => (
              <div
                key={date.title}
                className="group rounded-3xl border border-white/14 bg-[#030303] overflow-hidden transition-all duration-300 hover:border-white/26 hover:shadow-[0_28px_80px_rgba(255,255,255,0.06)]"
              >
                <div className="relative h-56 overflow-hidden bg-black">
                  <Image
                    src={date.image}
                    alt={date.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover grayscale opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/32 to-black/18" />
                  <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full border border-white/18 bg-black/64 px-2.5 py-1 backdrop-blur-sm">
                    <Star className="w-3 h-3 text-white/72 fill-white/72" />
                    <span className="text-xs font-bold text-white">{date.rating}</span>
                  </div>
                  <div className="absolute top-4 left-4 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-white/62" />
                    <span className="text-[10px] font-bold text-white/62 uppercase tracking-widest">Mystery Date</span>
                  </div>
                </div>

                <div className="p-7 md:p-8">
                  <h3 className="text-lg font-bold text-white mb-1">{date.title}</h3>
                  <p className="text-sm text-white/52 font-semibold mb-3">{date.vibe}</p>
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
                      <div key={label} className="flex items-center gap-2.5 bg-white/[0.035] border border-white/16 rounded-xl p-3">
                        <Icon className="w-3.5 h-3.5 text-white/60 shrink-0" />
                        <div>
                          <p className="text-[10px] text-white/45">{label}</p>
                          <p className="text-xs font-bold text-white">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {date.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-full border border-white/18 bg-white/[0.035] text-[11px] font-medium text-white/58">
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
        <section id="plans" className="relative border-t border-white/[0.07] bg-black">
        <div className="px-6 md:px-10 py-28 md:py-44 max-w-[1280px] mx-auto">
          <div className="text-left md:text-center mb-10 md:mb-14">
            <h2 className="text-[36px] md:text-[56px] font-black leading-[1.08] tracking-tight">
              Simple, honest pricing.
              <br />
              <span className="text-white/35">No surprises on the bill.</span>
            </h2>
          </div>

          {/* Billing interval toggle — desktop only; mobile version renders between cards */}
          <div className="hidden md:flex justify-center mb-8 md:mb-10">
            <div className="flex items-center gap-0.5 bg-white/5 border border-white/16 rounded-2xl p-1">
              <button
                type="button"
                onClick={() => setBillingInterval("monthly")}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  billingInterval === "monthly"
                    ? "bg-white/15 text-white shadow"
                    : "text-white/45 hover:text-white/70"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval("yearly")}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  billingInterval === "yearly"
                    ? "bg-white/15 text-white shadow"
                    : "text-white/45 hover:text-white/70"
                }`}
              >
                Yearly
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.5 rounded-full leading-none">
                  -44%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 max-w-sm md:max-w-[840px] mx-auto">
            {PLANS.map((plan, i) => (
              <React.Fragment key={plan.id}>
                {i === 1 && (
                  <div className="md:hidden flex justify-center">
                    <div className="flex items-center gap-0.5 bg-white/5 border border-white/16 rounded-2xl p-1">
                      <button
                        type="button"
                        onClick={() => setBillingInterval("monthly")}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                          billingInterval === "monthly"
                            ? "bg-white/15 text-white shadow"
                            : "text-white/45 hover:text-white/70"
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingInterval("yearly")}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                          billingInterval === "yearly"
                            ? "bg-white/15 text-white shadow"
                            : "text-white/45 hover:text-white/70"
                        }`}
                      >
                        Yearly
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.5 rounded-full leading-none">
                          -44%
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              <div
                className={[
                  "relative flex flex-col gap-8 rounded-3xl border p-8 md:p-10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_80px_rgba(255,255,255,0.06)]",
                  plan.highlighted
                    ? "bg-[#050202] border-rose-400/45 hover:border-rose-300/70"
                    : "bg-[#030303] border-white/14 hover:border-white/26",
                ].join(" ")}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-8">
                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-violet-600 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg shadow-pink-500/25">
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
                  {plan.highlighted ? (
                    billingInterval === "yearly" ? (
                      <>
                        <p className="text-4xl md:text-[42px] font-black mb-0.5 text-white">€{plan.yearlyPrice}</p>
                        <p className="text-sm text-white/55">per year</p>
                        <p className="text-xs text-emerald-400/80 mb-3">~€{((plan.yearlyPrice ?? 0) / 12).toFixed(2)}/mo · cancel anytime</p>
                      </>
                    ) : (
                      <>
                        <p className="text-4xl md:text-[42px] font-black mb-0.5 text-white">€{plan.introPrice}</p>
                        <p className="text-sm text-white/55">first month</p>
                        <p className="text-xs text-pink-300/70 mb-3">then €{plan.price}/mo · cancel anytime</p>
                      </>
                    )
                  ) : (
                    <>
                      <p className="text-4xl md:text-[42px] font-black mb-1 text-white/50">
                        {plan.priceLine.split("/")[0].trim()}
                      </p>
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
                    "w-full text-center py-4 md:py-5 rounded-full text-sm font-bold transition-all",
                    plan.highlighted
                      ? "bg-rose-500 text-white hover:bg-rose-400 shadow-lg shadow-rose-500/20"
                      : "bg-white/8 text-white/60 border border-white/10 hover:bg-white/12 hover:text-white",
                  ].join(" ")}
                >
                  {plan.cta}
                </Link>
              </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-black">
          <div className="relative max-w-[1280px] mx-auto px-6 md:px-10 text-left py-32 md:py-52">
            <div className="w-20 h-20 md:w-28 md:h-28 mb-10 md:mb-12">
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
              className="group relative inline-flex items-center gap-3 font-bold px-10 py-5 md:px-14 md:py-6 rounded-full text-base md:text-xl transition-all overflow-hidden bg-rose-500 text-white hover:bg-rose-400 shadow-2xl shadow-rose-500/30 focus-visible:outline-none"
            >
              Book my first mystery date
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
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
