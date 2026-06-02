"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence, type MotionValue } from "framer-motion";
import Link from "next/link";
import LinkButton from "@/components/ui/LinkButton";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Wallet,
  Sparkles,
  ArrowRight,
  Star,
  Lock,
  MapPin,
  Check,
  Timer,
  Home,
  X,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { getCurrencySymbol, formatBudgetRange, type UnitSystem } from "@/lib/units";

// "How it works" — 3 icon steps
const HOW_IT_WORKS = [
  {
    number: "01",
    icon: Wallet,
    title: "Pick two things together",
    body: "Your budget cap and whether you want to go out or stay in. Two constraints that end the debating before it starts. That's the whole decision. Everything else we handle.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "We make the call",
    body: "One venue near you, rated 4.0+, inside your budget, or a full night-in plan. Not a list. One plan, written for you two like a friend who's been there.",
  },
  {
    number: "03",
    icon: Home,
    title: "Say yes. Show up.",
    body: "Reveal when you're ready. Going out? Navigation opens. Staying in? Your plan is right there. The only call left is when to start.",
  },
];

// Features section — 4 numbered steps replacing bento
const STEPS = [
  {
    number: "01",
    title: "Set the rules once",
    body: "Your budget cap, your interests, how far you'll travel. Pick going out or staying in. Done in a minute. We remember it for every date after.",
    image: "/how/settings.svg",
  },
  {
    number: "02",
    title: "Nudge your partner",
    body: "Tap to let them know you're in the mood. They say yes or no. No 'what do you want to do?', just a simple signal between two people.",
    image: "/how/message.svg",
  },
  {
    number: "03",
    title: "Unlock together",
    body: "Both of you agree and the plan appears at the same moment. One real venue or a night in, rated and priced within your budget. Not a list. One answer.",
    image: "/how/reveal.svg",
  },
  {
    number: "04",
    title: "Go enjoy it",
    body: "Tap to see the full plan. Go out or stay in and follow it. Mark it done when you're back. We track your history so venues never repeat.",
  },
];

const FAQ_ITEMS = [
  {
    q: "How does BlindfoldDate choose our venue?",
    a: "We search real venues near your location using Google Places: restaurants, bars, galleries, parks, and more. Every suggestion is filtered by your interests, rated 4.0 or above, and priced within your budget cap. Then we write a bespoke date plan around it: what to do when you arrive, what makes it worth going, and why it suits you two specifically.",
  },
  {
    q: "What if we don't like the suggestion?",
    a: "Plus subscribers get one free reroll per date cycle. On the free plan, you get one reroll ever. Use it wisely. If you're not feeling the vibe after the idea is revealed, you can swap it for something different before you've committed to going.",
  },
  {
    q: "Does my partner need an account?",
    a: "Your partner joins via an invite link. No full setup required. They connect their email, accept the invite, and they're in. Once linked, they can also manage shared settings like preferences and travel distance.",
  },
  {
    q: "How often do we get new date ideas?",
    a: "Free users get one date per month. Plus subscribers choose their own cadence (weekly, bi-weekly, or monthly) so the app works around your actual schedule.",
  },
  {
    q: "Is my location data safe?",
    a: "We only use your location to find venues near you. Your coordinates are stored securely and never shared with third parties or used for anything outside of generating your date plan. You can update your location at any time from your profile settings.",
  },
  {
    q: "What's the difference between free and Plus?",
    a: "Free gives you one date per month, limited interest preferences, and a capped travel distance. Plus unlocks your full preference set, a wider travel radius, weekly or bi-weekly scheduling, and access to Saved Memories - your date history over time.",
  },
];

const SPARKLE_CONFIGS = [
  { top: "-12%", left: "10%",   size: 10, delay: 0,    dur: 2.2, rd: 1.2 },
  { top: "20%",  left: "-8%",   size:  8, delay: 0.5,  dur: 1.9, rd: 0.8 },
  { top: "-8%",  left: "65%",   size: 12, delay: 0.3,  dur: 2.4, rd: 1.5 },
  { top: "45%",  left: "105%",  size:  9, delay: 0.8,  dur: 2.0, rd: 1.0 },
  { top: "80%",  left: "15%",   size: 11, delay: 1.2,  dur: 2.1, rd: 0.9 },
  { top: "105%", left: "55%",   size:  7, delay: 0.2,  dur: 1.8, rd: 1.3 },
  { top: "38%",  left: "-6%",   size: 13, delay: 1.0,  dur: 2.3, rd: 0.7 },
  { top: "-5%",  left: "40%",   size:  8, delay: 0.6,  dur: 2.0, rd: 1.1 },
];

function StepSparkle({ top, left, size, delay, dur, rd }: typeof SPARKLE_CONFIGS[0]) {
  return (
    <motion.div
      className="absolute pointer-events-none z-20"
      style={{ top, left, width: size, height: size, transform: "translate(-50%, -50%)" }}
      animate={{ scale: [0, 1, 0.6, 1, 0], opacity: [0, 1, 0.6, 1, 0], rotate: [0, 180] }}
      transition={{ duration: dur, delay, repeat: Infinity, repeatDelay: rd, ease: "easeInOut" }}
    >
      <svg width={size} height={size} viewBox="0 0 10 10" fill="none">
        <path
          d="M5,0 L6.5,3.5 L10,5 L6.5,6.5 L5,10 L3.5,6.5 L0,5 L3.5,3.5 Z"
          fill="rgb(251 113 133 / 0.85)"
          filter="url(#sparkle-glow)"
        />
        <defs>
          <filter id="sparkle-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      </svg>
    </motion.div>
  );
}

const SAMPLE_DATES = [
  {
    emoji: "📸",
    title: "Golden Hour Walk",
    vibe: "Romantic & Creative",
    venue: "Botanical Garden, Old Town",
    description: "A mystery route timed perfectly for golden hour. Camera required. You'll want to remember this one.",
    rating: 4.8,
    duration: "2 hrs",
    budget: "€0–15",
    tags: ["Outdoor", "Romantic"],
    image: "/features/feat-1.jpg",
  },
  {
    emoji: "🕯️",
    title: "Cosy Night In",
    vibe: "Intimate & Relaxed",
    venue: "Your place",
    description: "A proper night in, planned for you. We pick the theme, you enjoy it.",
    rating: null,
    duration: "Your call",
    budget: "€0–20",
    tags: ["Indoor", "Cosy"],
    image: "/features/feat-3.jpg",
  },
  {
    emoji: "🎬",
    title: "Surprise Cinema Date",
    vibe: "Spontaneous & Fun",
    venue: "Forum Cinemas, City Centre",
    description: "Show up and see whatever starts next. No trailers, no reviews. Pure surprise and shared reactions.",
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
  { label: "Pricing", href: "#plans", scroll: false },
  { label: "Blog", href: "/blog", scroll: false },
];

const HERO_VIDEOS = [
  {
    poster: "/hero-video-poster.webp",
    webm: "/hero-video.webm",
    mp4: "/hero-video-small.mp4",
  },
  {
    poster: "/hero-video2-poster.webp",
    webm: "/hero-video2.webm",
    mp4: "/hero-video2-small.mp4",
  },
];

const REVEAL_LINES = [
  "Deciding where to go",
  "is not a date.",
  "Debating the restaurant,",
  "checking reviews,",
  "ordering in and calling it a night...",
  "that's not romance. That's work.",
  "We make the call. You show up.",
];

function ScrollRevealStatement() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "center 0.5"],
  });

  const total = REVEAL_LINES.length;

  return (
    <section ref={ref} aria-label="The problem we solve" className="px-6 md:px-10 py-28 md:py-44 max-w-[1280px] mx-auto">
      <h2 className="sr-only">Why couples stop going on dates</h2>
      <p className="text-[28px] md:text-[42px] font-black leading-[1.15] tracking-normal max-w-[700px] mx-auto">
        {REVEAL_LINES.map((line, i) => {
          const start = (i / total) * 0.9;
          const end = ((i + 1) / total) * 0.9;
          const isLast = i === total - 1;
          const breakAfter = i === 1 || i === 5;
          return (
            <RevealLine
              key={i}
              line={line}
              scrollYProgress={scrollYProgress}
              start={start}
              end={end}
              isLast={isLast}
              breakAfter={breakAfter}
            />
          );
        })}
      </p>
    </section>
  );
}

const YOU_SUFFIXES = ["show up.", "enjoy the date.", "say yes.", "do it again."];
const TYPE_SPEED = 55;
const DELETE_SPEED = 35;
const PAUSE_AFTER_TYPE = 2000;

function CyclingLastLine({
  opacity,
  underlineScaleX,
}: {
  opacity: MotionValue<number>;
  underlineScaleX: MotionValue<number>;
}) {
  const [suffixIndex, setSuffixIndex] = useState(0);
  const [displayed, setDisplayed] = useState(YOU_SUFFIXES[0]);
  const [phase, setPhase] = useState<"typing" | "deleting" | "pausing">("pausing");

  useEffect(() => {
    const target = YOU_SUFFIXES[suffixIndex];

    if (phase === "pausing") {
      const id = setTimeout(() => setPhase("deleting"), PAUSE_AFTER_TYPE);
      return () => clearTimeout(id);
    }

    if (phase === "deleting") {
      if (displayed.length === 0) {
        const next = (suffixIndex + 1) % YOU_SUFFIXES.length;
        setSuffixIndex(next);
        setPhase("typing");
        return;
      }
      const id = setTimeout(() => setDisplayed((d) => d.slice(0, -1)), DELETE_SPEED);
      return () => clearTimeout(id);
    }

    if (phase === "typing") {
      if (displayed.length === target.length) {
        setPhase("pausing");
        return;
      }
      const id = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), TYPE_SPEED);
      return () => clearTimeout(id);
    }
  }, [phase, displayed, suffixIndex]);

  const gradientStyle = { backgroundImage: "linear-gradient(135deg, #fb7185 0%, #c026d3 45%, #8b5cf6 100%)" };

  return (
    <>
      <motion.span style={{ opacity }} className="block text-white">
        We make the call.
      </motion.span>
      <motion.span style={{ opacity }} className="block">
        <span className="relative inline-block bg-clip-text text-transparent" style={gradientStyle}>
          You just {displayed}
          <span className="animate-pulse">|</span>
        </span>
      </motion.span>
      <br />
    </>
  );
}

function RevealLine({
  line,
  scrollYProgress,
  start,
  end,
  isLast,
  breakAfter,
}: {
  line: string;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  start: number;
  end: number;
  isLast: boolean;
  breakAfter: boolean;
}) {
  const opacity = useTransform(scrollYProgress, [start, end], [0.15, 1]);
  const color = useTransform(
    scrollYProgress,
    [start, end],
    isLast ? ["rgba(244,63,94,0.2)", "rgba(244,63,94,1)"] : ["rgba(255,255,255,0.15)", "rgba(255,255,255,1)"]
  );
  const underlineScaleX = useTransform(scrollYProgress, [start, end], [0, 1]);

  if (isLast) {
    return <CyclingLastLine opacity={opacity} underlineScaleX={underlineScaleX} />;
  }

  return (
    <>
      <motion.span style={{ color, opacity }} className="inline">
        {line}
      </motion.span>
      <br />
      {breakAfter && <br />}
    </>
  );
}

export default function LandingV3Client({ unitSystem = "metric" }: { unitSystem?: UnitSystem }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [heroVideo, setHeroVideo] = useState<(typeof HERO_VIDEOS)[number] | null>(null);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const [activeSampleDate, setActiveSampleDate] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const sampleTouchStartX = useRef<number | null>(null);

  const sampleDateCount = SAMPLE_DATES.length;
  const previousSampleDate = (activeSampleDate - 1 + sampleDateCount) % sampleDateCount;
  const nextSampleDate = (activeSampleDate + 1) % sampleDateCount;

  function handleSampleTouchStart(e: React.TouchEvent) {
    sampleTouchStartX.current = e.touches[0].clientX;
  }

  function handleSampleTouchEnd(e: React.TouchEvent) {
    if (sampleTouchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - sampleTouchStartX.current;
    if (diff < -50) setActiveSampleDate(nextSampleDate);
    if (diff > 50) setActiveSampleDate(previousSampleDate);
    sampleTouchStartX.current = null;
  }

  useEffect(() => {
    setHeroVideoReady(false);
    setHeroVideo(HERO_VIDEOS[Math.floor(Math.random() * HERO_VIDEOS.length)]);
  }, []);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        // Stale/invalid refresh token (common after incognito sessions or
        // server-side token invalidation). Sign out silently to clear cookies
        // so subsequent visits don't keep throwing AuthApiError.
        await supabase.auth.signOut();
        return;
      }
      if (!session) return;

      if (document.cookie.includes("onboarding_complete=1")) {
        setIsLoggedIn(true);
        return;
      }

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
      <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-10 pointer-events-none">
        <nav className="relative flex items-center justify-between px-4 min-[992px]:px-5 py-3 max-w-[1440px] mx-auto rounded-full pointer-events-auto bg-black/90 backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.12] shadow-[0_1px_0_rgba(255,255,255,0.04),0_8px_40px_rgba(0,0,0,0.55)]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.055] to-transparent pointer-events-none" />
          <button
            onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setMenuOpen(false); }}
            className="flex items-center gap-2.5 group"
            aria-label="Scroll to top"
          >
            <Image src="/logo.png" alt="BlindfoldDate" width={180} height={44} priority className="object-contain group-hover:opacity-75 transition-opacity" />
          </button>

          <div className="hidden min-[992px]:flex items-center gap-8">
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

          <div className="hidden min-[992px]:flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-white font-semibold bg-rose-500 hover:bg-rose-400 px-5 h-10 rounded-full transition-[background-color] duration-150"
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
                  className="inline-flex items-center gap-2 text-sm text-white font-semibold bg-rose-500 hover:bg-rose-400 px-5 h-10 rounded-full transition-[background-color] duration-150"
                >
                  Get started free
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          <button
            className="min-[992px]:hidden w-11 h-11 flex items-center justify-center rounded-xl text-white/75 hover:text-white hover:bg-white/[0.04] transition-[color,background-color] duration-150"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <span className="flex w-6 flex-col gap-1.5" aria-hidden="true">
                <span className="h-0.5 w-full rounded-full bg-current" />
                <span className="h-0.5 w-full rounded-full bg-current" />
              </span>
            )}
          </button>
        </nav>

        {/* Mobile menu */}
        <div
          aria-hidden={!menuOpen}
          className={`min-[992px]:hidden fixed inset-0 z-50 bg-black/98 backdrop-blur-2xl flex flex-col px-6 pb-8 transition-[opacity,transform] duration-200 ease-out ${
            menuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-3 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between h-[68px] shrink-0">
            <button onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setMenuOpen(false); }} className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="BlindfoldDate" width={180} height={44} className="object-contain" />
            </button>
            <button onClick={() => setMenuOpen(false)} className="w-11 h-11 flex items-center justify-center rounded-xl text-white/75 hover:text-white hover:bg-white/[0.04] transition-[color,background-color] duration-150" aria-label="Close menu">
              <X className="w-6 h-6" />
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
        <section className="relative overflow-hidden border-b border-white/[0.07] bg-black">
          <Image
            src={activeHeroVideo.poster}
            alt="Couple enjoying a surprise date night"
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

          <div className="relative mx-auto flex min-h-[82dvh] max-w-[1280px] flex-col items-start justify-end px-6 pb-16 pt-[120px] text-left md:px-10 md:pb-20 md:pt-[96px] lg:pb-28">
            <div className="w-full max-w-[960px]">
              <h1 className="text-[48px] sm:text-[64px] lg:text-[80px] font-black leading-[1.04] tracking-tight mb-7 md:mb-8 [filter:drop-shadow(0_6px_24px_rgba(0,0,0,0.88))]">
                <span className="block">
                  Date night, decided.
                </span>
                <span
                  className="block bg-clip-text text-transparent pb-2"
                  style={{ backgroundImage: "linear-gradient(135deg, #fb7185 0%, #c026d3 45%, #8b5cf6 100%)" }}
                >
                  Just show up.
                </span>
              </h1>

              <p className="max-w-[560px] text-white/78 text-base md:text-xl leading-[1.7] mb-9 md:mb-10 [text-shadow:0_3px_18px_rgba(0,0,0,0.9)]">
                Tell us your budget and whether you want to go out or stay in. One plan, written for you two. Done.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-start gap-3">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className="group relative inline-flex items-center justify-center text-white font-bold px-8 h-14 md:h-16 rounded-full text-base md:text-lg transition-[background-color] duration-150 overflow-hidden bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-500/25"
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="group relative inline-flex items-center justify-center text-white font-bold px-8 h-14 md:h-16 rounded-full text-base md:text-lg transition-[background-color] duration-150 overflow-hidden bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-500/25"
                    >
                      <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      Get our first date plan
                    </Link>
                    <LinkButton href="/login" variant="secondary" size="lg" className="md:h-16">
                      Sign in
                    </LinkButton>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Problem statement scroll reveal ── */}
        <ScrollRevealStatement />

        <div className="text-center px-6 py-10">
          <p className="text-white/40 text-sm md:text-base">Some nights you don&apos;t want to go anywhere. We plan those too.</p>
        </div>

        {/* ── Features / How it works steps ── */}
        <section id="how-it-works" className="relative border-y border-white/[0.07] bg-black">
          <div className="px-6 md:px-10 py-28 md:py-44 max-w-[1280px] mx-auto">
            <div className="text-left md:text-center mb-12 md:mb-20">
              <h2 className="text-[36px] md:text-[56px] font-black leading-[1.08] tracking-normal">
                How it works
              </h2>
              <p className="text-white/35 text-[36px] md:text-[56px] font-black leading-[1.08]">
                One plan. Zero debate.
              </p>
            </div>

            <div>
              {STEPS.map((step, i) => {
                const isLast = i === STEPS.length - 1;
                return (
                  <div key={step.number} className="flex gap-3 md:gap-5">
                    {/* LEFT: number + full-height line */}
                    <div className="shrink-0 w-16 md:w-20 flex flex-col items-center">
                      <span className="text-4xl md:text-[48px] font-black text-white/25 tabular-nums leading-none">
                        {step.number}
                      </span>
                      {/* Line fills remaining height of the row; 12px gap below number */}
                      {!isLast && (
                        <div className="w-0.5 flex-1 bg-rose-500 mt-6 mb-8" />
                      )}
                    </div>

                    {/* RIGHT: title + desc + image box */}
                    <div className={`flex-1 flex flex-col md:flex-row md:items-start gap-6 md:gap-10 ${!isLast ? "pb-20 md:pb-64" : ""}`}>
                      <div className="w-full md:max-w-[520px]">
                        <h3 className="text-4xl md:text-[48px] font-black text-white leading-none mb-3">
                          {step.title}
                        </h3>
                        <p className="text-white/50 text-base md:text-2xl leading-[1.7]">
                          {step.body}
                        </p>
                      </div>
                      {/* Step viz — mobile */}
                      {step.image && (
                        <div className="relative w-[220px] h-[200px] md:hidden shrink-0">
                          {SPARKLE_CONFIGS.map((cfg, j) => <StepSparkle key={j} {...cfg} />)}
                          <div className="absolute inset-0 rounded-2xl overflow-hidden">
                            <Image src={step.image} alt={step.title} fill className="object-contain" sizes="220px" />
                          </div>
                        </div>
                      )}
                      {/* Step viz — desktop */}
                      {step.image && (
                        <div className="hidden md:block relative shrink-0 ml-auto w-[280px] h-[200px]">
                          {SPARKLE_CONFIGS.map((cfg, j) => <StepSparkle key={j} {...cfg} />)}
                          <div className="absolute inset-0 rounded-2xl overflow-hidden">
                            <Image src={step.image} alt={step.title} fill className="object-contain" sizes="280px" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        {/* ── Sample dates ── */}
        <section className="px-6 md:px-10 py-28 md:py-44 max-w-[1280px] mx-auto">
          <div className="text-left md:text-center mb-10 md:mb-14">
            <h2 className="text-[36px] md:text-[56px] font-black leading-[1.08] tracking-normal">
              One plan like this,
              <br />
              <span className="text-white/35">dropped in your calendar.</span>
            </h2>
          </div>

          <div
            className="relative h-[450px] md:hidden"
            aria-hidden="true"
            onTouchStart={handleSampleTouchStart}
            onTouchEnd={handleSampleTouchEnd}
          >
            <div
              className="absolute left-1/2 top-0 z-20 w-full transition-transform duration-200"
              style={{ transform: "translateX(-50%)" }}
            >
              <DateExampleCard date={SAMPLE_DATES[activeSampleDate]} unitSystem={unitSystem} compact />
            </div>
            <div className="absolute bottom-1 left-0 right-0 z-30 flex justify-center gap-1.5">
              {SAMPLE_DATES.map((date, i) => (
                <button
                  key={date.title}
                  type="button"
                  onClick={() => setActiveSampleDate(i)}
                  aria-label={`View ${date.title}`}
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-150 ${
                    i === activeSampleDate ? "w-5 bg-white" : "w-1.5 bg-[#3f3f3f]"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAMPLE_DATES.map((date, i) => (
              <div key={date.title} className={i === 2 ? "hidden lg:block" : undefined}>
                <DateExampleCard date={date} unitSystem={unitSystem} />
              </div>
            ))}
          </div>

          <p className="hidden md:block text-center text-white/40 text-sm mt-12">
            No lists. No options. Just one plan, personalised to you two ✨
          </p>
        </section>

        {/* ── Pricing ── */}
        <section id="plans" className="relative border-t border-white/[0.07] bg-black">
          <div className="px-6 md:px-10 py-28 md:py-44 max-w-[1280px] mx-auto">
            <div className="text-left md:text-center mb-10 md:mb-14">
              <h2 className="text-[36px] md:text-[56px] font-black leading-[1.08] tracking-normal">
                Stop talking about it.
                <br />
                <span className="text-white/35">Start actually doing it.</span>
              </h2>
            </div>

            {/* Billing toggle — desktop */}
            <div className="hidden md:flex justify-center mb-8 md:mb-10">
              <div className="flex items-center gap-0.5 bg-white/5 border border-white/16 rounded-2xl p-1">
                <button
                  type="button"
                  onClick={() => setBillingInterval("monthly")}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ${
                    billingInterval === "monthly" ? "bg-white/15 text-white shadow" : "text-white/45 hover:text-white/70"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval("yearly")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ${
                    billingInterval === "yearly" ? "bg-white/15 text-white shadow" : "text-white/45 hover:text-white/70"
                  }`}
                >
                  Yearly
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.5 rounded-full leading-none">-44%</span>
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
                          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ${
                            billingInterval === "monthly" ? "bg-white/15 text-white shadow" : "text-white/45 hover:text-white/70"
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingInterval("yearly")}
                          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ${
                            billingInterval === "yearly" ? "bg-white/15 text-white shadow" : "text-white/45 hover:text-white/70"
                          }`}
                        >
                          Yearly
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.5 rounded-full leading-none">-44%</span>
                        </button>
                      </div>
                    </div>
                  )}
                  <div
                    className={[
                      "relative flex flex-col gap-8 rounded-3xl border p-8 md:p-10 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_28px_80px_rgba(255,255,255,0.06)]",
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
                            <p className="text-4xl md:text-[42px] font-black mb-0.5 text-white">{getCurrencySymbol(unitSystem)}{plan.yearlyPrice}</p>
                            <p className="text-sm text-white/55">per year</p>
                            <p className="text-xs text-emerald-400/80 mb-3">~{getCurrencySymbol(unitSystem)}{((plan.yearlyPrice ?? 0) / 12).toFixed(2)}/mo · cancel anytime</p>
                          </>
                        ) : (
                          <>
                            <p className="text-4xl md:text-[42px] font-black mb-0.5 text-white">{getCurrencySymbol(unitSystem)}{plan.introPrice}</p>
                            <p className="text-sm text-white/55">first month</p>
                            <p className="text-xs text-pink-300/70 mb-3">then {getCurrencySymbol(unitSystem)}{plan.price}/mo · cancel anytime</p>
                          </>
                        )
                      ) : (
                        <p className="text-4xl md:text-[42px] font-black mb-1 text-white/50">
                          {plan.priceLine.split("/")[0].trim()}
                        </p>
                      )}
                      <p className="text-sm md:text-base text-white/55 mt-3">{plan.tagline}</p>
                    </div>
                    <ul className="flex flex-col gap-3.5 flex-1">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-3">
                          <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400/70" />
                          <span className="text-sm text-white/55">{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/register?plan=${plan.id}`}
                      rel="nofollow"
                      className={[
                        "w-full text-center py-4 md:py-5 rounded-full text-sm font-bold transition-[background-color,color,border-color] duration-150",
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

        {/* ── FAQ ── */}
        <section className="border-t border-white/[0.07] bg-black">
          <div className="px-6 md:px-10 py-20 md:py-32 max-w-[1280px] mx-auto">
            <h2 className="text-[36px] md:text-[56px] font-black leading-tight mb-10 md:mb-14">
              Frequently asked questions
            </h2>
            <dl className="flex flex-col divide-y divide-white/[0.07]">
              {FAQ_ITEMS.map(({ q, a }, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={q}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-6 py-6 md:py-7 text-left group"
                      aria-expanded={isOpen}
                    >
                      <dt className="text-white font-semibold text-lg md:text-2xl leading-snug">
                        {q}
                      </dt>
                      <span className={[
                        "shrink-0 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center transition-colors duration-200",
                        isOpen ? "bg-white/10 border-white/40" : "group-hover:border-white/35",
                      ].join(" ")}>
                        <X className={`w-4 h-4 transition-[transform,color] duration-200 ${isOpen ? "text-white rotate-0" : "text-white/40 group-hover:text-white/60 -rotate-45"}`} />
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <dd className="text-white/50 text-base md:text-xl leading-[1.75] pb-6 md:pb-8 max-w-[800px]">
                            {a}
                          </dd>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </dl>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-black">
          <div className="relative max-w-[1280px] mx-auto px-6 md:px-10 text-center py-32 md:py-52 flex flex-col items-center">
            <div className="w-20 h-20 md:w-28 md:h-28 mb-10 md:mb-12">
              <Image src="/icon.png" alt="Blindfold" width={112} height={112} className="w-full h-full object-contain" />
            </div>

            <h2 className="text-[40px] sm:text-[56px] md:text-[72px] font-black mb-7 md:mb-8 leading-[1.05] tracking-normal">
              You&rsquo;ve been saying
              <br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #fb7185, #c026d3, #8b5cf6)" }}>
                &ldquo;we should do something.&rdquo;
              </span>
            </h2>

            <p className="text-white/55 text-base md:text-xl mb-12 md:mb-16 leading-[1.7] max-w-lg mx-auto">
              This is something. Set your budget, pick in or out, and we handle the rest: venue, story, navigation. The only thing left to negotiate is when you&rsquo;re leaving.
            </p>

            <Link
              href="/register"
              className="group relative inline-flex items-center gap-3 font-bold px-10 py-5 md:px-14 md:py-6 rounded-full text-base md:text-xl transition-[background-color] duration-150 overflow-hidden bg-rose-500 text-white hover:bg-rose-400 shadow-2xl shadow-rose-500/30 focus-visible:outline-none"
            >
              Start free, no card needed
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
                Date night, decided. You just enjoy it.
              </p>
              <a href="https://www.instagram.com/blindfold.date" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors w-fit">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
                <span className="text-sm">@blindfold.date</span>
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Product</p>
              {[{ label: "How it works", href: "#how-it-works" }, { label: "Pricing", href: "#plans" }].map(({ label, href }) => (
                <a key={label} href={href} className="text-sm text-white/50 hover:text-white transition-colors">{label}</a>
              ))}
              <Link href="/blog" className="text-sm text-white/50 hover:text-white transition-colors">Blog</Link>
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

function DateExampleCard({ date, unitSystem = "metric", compact = false }: { date: (typeof SAMPLE_DATES)[number]; unitSystem?: UnitSystem; compact?: boolean }) {
  return (
    <div className="group flex h-[410px] flex-col rounded-3xl border border-white/14 bg-[#030303] overflow-hidden text-left transition-[transform,box-shadow,border-color] duration-200 ease-out hover:border-white/26 hover:shadow-[0_28px_80px_rgba(255,255,255,0.06)] md:block md:h-auto">
      <div className="relative h-40 shrink-0 overflow-hidden bg-black md:h-56">
        <Image
          src={date.image}
          alt={date.title}
          fill
          sizes="(min-width: 768px) 33vw, 86vw"
          className="object-cover grayscale opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/32 to-black/18" />
        {date.rating !== null && (
          <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full border border-white/18 bg-black/64 px-2.5 py-1 backdrop-blur-sm">
            <Star className="w-3 h-3 text-white/72 fill-white/72" />
            <span className="text-xs font-bold text-white">{date.rating}</span>
          </div>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4 md:block md:p-8">
        <h3 className="text-lg font-bold text-white mb-1">{date.title}</h3>
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0" />
          <p className="text-sm text-white/50 truncate">{date.venue}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {date.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-full border border-white/18 bg-white/[0.035] text-[11px] font-medium text-white/58">
              {tag}
            </span>
          ))}
        </div>
        {!compact && <p className="text-white/55 text-xs leading-[1.55] mb-3 line-clamp-2 md:mb-6 md:text-sm md:leading-[1.65]">{date.description}</p>}
        <div className="grid grid-cols-2 gap-2 mb-3 md:gap-2.5 md:mb-5">
          {[
            { icon: Timer, value: date.duration, label: "Duration" },
            { icon: Wallet, value: formatBudgetRange(date.budget, unitSystem), label: "Budget" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-2 bg-white/[0.035] border border-white/16 rounded-xl px-2.5 py-1.5 md:gap-2.5 md:px-3 md:py-2">
              <Icon className="w-3.5 h-3.5 text-white/60 shrink-0" />
              <div>
                <p className="text-[10px] text-white/45">{label}</p>
                <p className="text-xs font-bold text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
