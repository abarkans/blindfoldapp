"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  Check,
  Sparkles,
  Lock,
  X,
  MapPin,
  Wallet,
  Home,
  Building2,
  ChevronRight,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { getCurrencySymbol, type UnitSystem } from "@/lib/units";

const LOOP_SEQUENCE = [
  "\"What do you want to do?\"",
  "\"I don't know, what do you want?\"",
  "\"Either is fine with me.\"",
  "\"Let's just stay in.\"",
];

const NAV_LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#plans" },
  { label: "Blog", href: "/blog" },
];

const PROBLEM_STEPS = [
  { label: "One of you suggests something", ok: false },
  { label: "The other isn't feeling it", ok: false },
  { label: "You \"don't mind either way\"", ok: false },
  { label: "Scrolling restaurants for 20 minutes", ok: false },
  { label: "\"Let's just stay in.\"", ok: false },
];

const HOW_STEPS = [
  {
    n: "01",
    title: "Tell us two things",
    body: "Your budget and whether you want to go out or stay in. That's it. Those two constraints decide everything — and now you agree on them before you disagree about anything else.",
    icon: Wallet,
  },
  {
    n: "02",
    title: "We find a real place near you",
    body: "Not a list. Not \"top 10 options.\" One venue, picked from real places near you, rated 4.0 or above. Or a full night-in plan if you're staying home. Written like a friend who's been there.",
    icon: MapPin,
  },
  {
    n: "03",
    title: "You say yes. You go.",
    body: "Reveal the plan when you're ready. Navigation opens automatically. The only thing left is to actually show up — which, it turns out, is the part that matters.",
    icon: ArrowRight,
  },
];

export default function LandingV3Client({ unitSystem = "metric" }: { unitSystem?: UnitSystem }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [loopIndex, setLoopIndex] = useState(0);
  const [loopVisible, setLoopVisible] = useState(true);

  // Auth check — client only, non-blocking
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
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

  // The negotiation loop animation
  useEffect(() => {
    const interval = setInterval(() => {
      setLoopVisible(false);
      setTimeout(() => {
        setLoopIndex((i) => (i + 1) % LOOP_SEQUENCE.length);
        setLoopVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:bg-violet-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      {/* ── Nav ── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl border-b border-white/[0.08]" />
        <nav className="relative flex items-center justify-between px-6 min-[992px]:px-14 h-[68px] max-w-[1440px] mx-auto">
          <button
            onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setMenuOpen(false); }}
            className="flex items-center gap-2.5"
            aria-label="BlindfoldDate — scroll to top"
          >
            <Image src="/logo.png" alt="BlindfoldDate" width={160} height={40} priority className="object-contain opacity-90 hover:opacity-100 transition-opacity" />
          </button>

          <div className="hidden min-[992px]:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <a key={label} href={href} className="text-sm text-white/50 hover:text-white transition-colors font-medium">
                {label}
              </a>
            ))}
          </div>

          <div className="hidden min-[992px]:flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white font-semibold bg-rose-500 hover:bg-rose-400 px-5 h-10 rounded-full transition-colors duration-150">
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-white/40 hover:text-white transition-colors font-medium">Sign in</Link>
                <Link href="/register" className="inline-flex items-center gap-2 text-sm text-white font-semibold bg-rose-500 hover:bg-rose-400 px-5 h-10 rounded-full transition-colors duration-150">
                  Get started free <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          <button
            className="min-[992px]:hidden w-11 h-11 flex items-center justify-center rounded-xl text-white/75 hover:text-white transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="w-6 h-6" /> : (
              <span className="flex w-6 flex-col gap-1.5" aria-hidden="true">
                <span className="h-0.5 w-full rounded-full bg-current" />
                <span className="h-0.5 w-full rounded-full bg-current" />
              </span>
            )}
          </button>
        </nav>

        {/* Mobile menu */}
        <div className={`min-[992px]:hidden fixed inset-0 z-50 bg-black/98 backdrop-blur-2xl flex flex-col px-6 pb-8 transition-[opacity,transform] duration-200 ease-out ${menuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-3 pointer-events-none"}`}>
          <div className="flex items-center justify-between h-[68px] shrink-0">
            <button onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setMenuOpen(false); }} className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="BlindfoldDate" width={160} height={40} className="object-contain" />
            </button>
            <button onClick={() => setMenuOpen(false)} className="w-11 h-11 flex items-center justify-center rounded-xl text-white/75 hover:text-white transition-colors" aria-label="Close menu">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 flex-1 pt-4">
            {NAV_LINKS.map(({ label, href }) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)} className="flex items-center h-14 text-xl font-semibold text-white/70 hover:text-white transition-colors border-b border-white/[0.06]">
                {label}
              </a>
            ))}
            {!isLoggedIn && (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center h-14 text-xl font-semibold text-white/70 hover:text-white transition-colors border-b border-white/[0.06]">
                Sign in
              </Link>
            )}
          </nav>
          <div className="pt-4">
            <Link href="/register" onClick={() => setMenuOpen(false)} className="w-full flex items-center justify-center gap-2 text-white font-bold py-4 rounded-full bg-rose-500 hover:bg-rose-400 transition-colors">
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main">

        {/* ── Hero ── */}
        <section className="relative min-h-[100dvh] flex flex-col justify-center border-b border-white/[0.07] overflow-hidden">
          {/* Background texture */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(244,63,94,0.08),transparent)]" aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_60%,rgba(139,92,246,0.06),transparent)]" aria-hidden="true" />

          <div className="relative max-w-[1280px] mx-auto px-6 md:px-10 pt-[100px] pb-20 lg:pb-28 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center w-full">

            {/* Text */}
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-400/90 tracking-widest uppercase mb-8 border border-rose-500/20 bg-rose-500/[0.07] px-3.5 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                Based on real couple feedback
              </div>

              <h1 className="text-[46px] sm:text-[58px] lg:text-[68px] font-black leading-[1.03] tracking-tight mb-7">
                <span className="block text-white">You don&rsquo;t</span>
                <span className="block text-white">need more</span>
                <span className="block bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #fb7185 0%, #c026d3 55%, #8b5cf6 100%)" }}>
                  date ideas.
                </span>
              </h1>

              <p className="text-white/65 text-lg md:text-xl leading-[1.65] mb-4 max-w-[480px]">
                You need <strong className="text-white font-semibold">one plan you&rsquo;ll actually agree on</strong> — budget set, venue picked, story written. No options to debate. Just a date to say yes to.
              </p>

              <p className="text-white/35 text-sm mb-10 max-w-[380px]">
                Tell us what you can spend and whether you want to go out or stay in. We handle everything else.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                {isLoggedIn ? (
                  <Link href="/dashboard" className="group inline-flex items-center justify-center gap-2 text-white font-bold px-8 h-14 rounded-full bg-rose-500 hover:bg-rose-400 transition-colors shadow-lg shadow-rose-500/25">
                    Go to Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link href="/register" className="group inline-flex items-center justify-center gap-2 text-white font-bold px-8 h-14 rounded-full bg-rose-500 hover:bg-rose-400 transition-colors shadow-lg shadow-rose-500/25">
                      Plan our next date <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link href="/login" className="inline-flex items-center justify-center px-8 h-14 rounded-full text-white/60 hover:text-white font-semibold border border-white/12 hover:border-white/25 transition-colors bg-white/[0.03]">
                      Sign in
                    </Link>
                  </>
                )}
              </div>

              <p className="text-white/25 text-xs">No credit card · 2-minute setup · Free to start</p>
            </div>

            {/* The Negotiation Loop card */}
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-violet-500/10 rounded-3xl blur-2xl scale-110" aria-hidden="true" />

              <div className="relative rounded-3xl border border-white/12 bg-white/[0.025] backdrop-blur-sm p-8 md:p-10">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-6">Every. Single. Time.</p>

                {/* The loop */}
                <div className="space-y-3 mb-8">
                  {LOOP_SEQUENCE.map((line, i) => (
                    <div
                      key={line}
                      className={`flex items-start gap-3 transition-all duration-300 ${
                        i === loopIndex && loopVisible ? "opacity-100" : i < loopIndex ? "opacity-30" : "opacity-15"
                      }`}
                    >
                      <span className="mt-1 w-2 h-2 shrink-0 rounded-full bg-white/30" />
                      <p className={`text-base font-medium leading-snug ${i === loopIndex && loopVisible ? "text-white" : "text-white/50"}`}>
                        {line}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Result */}
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                    <Home className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">You end up on the couch.</p>
                    <p className="text-xs text-white/40 mt-0.5">Again. For the fourth week in a row.</p>
                  </div>
                </div>

                {/* Bottom label */}
                <div className="mt-6 pt-6 border-t border-white/[0.07] flex items-center justify-between">
                  <p className="text-xs text-white/30">The problem isn&rsquo;t ideas. It&rsquo;s the loop.</p>
                  <a href="#how" className="text-xs text-rose-400/80 hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors">
                    Break it <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── The real problem ── */}
        <section className="px-6 md:px-10 py-24 md:py-40 max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Problem steps */}
            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-8">What actually happens</p>
              <div className="space-y-4">
                {PROBLEM_STEPS.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-4">
                    <div className="w-8 h-8 shrink-0 rounded-full border border-white/12 bg-white/[0.03] flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-white/25" />
                    </div>
                    <p className={`text-base leading-snug ${i === PROBLEM_STEPS.length - 1 ? "text-white font-semibold" : "text-white/55"}`}>
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* The insight */}
            <div>
              <h2 className="text-[36px] md:text-[48px] font-black leading-[1.07] tracking-normal mb-6">
                You can think of ideas.
                <br />
                <span className="text-white/30">You can&rsquo;t agree on one.</span>
              </h2>
              <p className="text-white/55 text-base md:text-lg leading-[1.7] mb-6">
                Every couple hits this. It&rsquo;s not a creativity problem — it&rsquo;s a commitment problem. Options create debate. More options create more debate. The negotiation loop doesn&rsquo;t end with a winner.
              </p>
              <p className="text-white/55 text-base md:text-lg leading-[1.7] mb-8">
                The only fix is removing the options entirely. <strong className="text-white font-semibold">One plan. Take it or leave it.</strong> When there&rsquo;s nothing to negotiate, you&rsquo;re just deciding whether you want to go.
              </p>
              <a
                href="#how"
                className="inline-flex items-center gap-2 text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors"
              >
                See how we do it <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="relative border-y border-white/[0.07] bg-[#030303]">
          <div className="px-6 md:px-10 py-24 md:py-40 max-w-[1280px] mx-auto">
            <div className="max-w-[600px] mb-14 md:mb-20">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-5">How it works</p>
              <h2 className="text-[36px] md:text-[52px] font-black leading-[1.07] tracking-normal mb-5">
                Not a list.
                <br />
                <span className="text-white/30">A decision.</span>
              </h2>
              <p className="text-white/55 text-base md:text-lg leading-[1.7]">
                Other tools give you options. Options require agreement. Agreement is the exact problem you came here to solve.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
              {HOW_STEPS.map((step) => (
                <div key={step.n} className="bg-[#030303] p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-bold text-white/20 tracking-widest">{step.n}</span>
                    <step.icon className="w-5 h-5 text-rose-400/70" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-3 leading-snug">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-[1.7]">{step.body}</p>
                </div>
              ))}
            </div>

            {/* In or out toggle illustration */}
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white/70 mb-1">The two filters that settle everything</p>
                <p className="text-white/40 text-sm leading-relaxed">Budget and in-vs-out are the constraints that end every argument. Set them once — every plan we generate lands inside both.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-rose-400" />
                  </div>
                  <span className="text-xs font-semibold text-white/50">Go out</span>
                </div>
                <div className="text-white/20 font-bold text-sm">or</div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/12 flex items-center justify-center">
                    <Home className="w-7 h-7 text-white/40" />
                  </div>
                  <span className="text-xs font-semibold text-white/50">Stay in</span>
                </div>
                <div className="ml-4 flex flex-col gap-2">
                  <div className="w-28 h-2 rounded-full bg-white/[0.04] border border-white/10 relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-2/3 rounded-full bg-rose-500/50" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30">€0</span>
                    <span className="text-[10px] text-white/30">€100+</span>
                  </div>
                  <p className="text-[10px] text-white/40">Budget limit</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── The routine ── */}
        <section className="px-6 md:px-10 py-24 md:py-40 max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-5">Why couples come back</p>
              <h2 className="text-[36px] md:text-[52px] font-black leading-[1.07] tracking-normal mb-6">
                A good date once
                <br />
                <span className="text-white/30">is just a good night.</span>
              </h2>
              <p className="text-white/55 text-base md:text-lg leading-[1.7] mb-5">
                Couples who actually go on dates don&rsquo;t think of better ideas — they have a ritual. A standing Wednesday dinner. A monthly \"mystery night.\" The event in the calendar that doesn&rsquo;t get bumped.
              </p>
              <p className="text-white/55 text-base md:text-lg leading-[1.7] mb-8">
                That&rsquo;s what Plus does. Weekly, biweekly, or monthly — a new plan drops automatically, already tailored, already decided. You don&rsquo;t have to remember to plan. <strong className="text-white font-semibold">You just have to remember to go.</strong>
              </p>
              <a href="#plans" className="inline-flex items-center gap-2 text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors">
                See Plus features <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Cadence illustration */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-7 md:p-9">
              <p className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-6">Your date calendar — automatically</p>
              <div className="space-y-3">
                {[
                  { week: "This week", label: "New date plan ready", status: "ready", dot: "bg-emerald-400" },
                  { week: "Next week", label: "Auto-generating...", status: "soon", dot: "bg-white/20" },
                  { week: "In 2 weeks", label: "Plan drops Friday", status: "upcoming", dot: "bg-white/10" },
                ].map((item) => (
                  <div key={item.week} className={`flex items-center gap-4 rounded-xl px-4 py-3.5 border ${item.status === "ready" ? "bg-emerald-500/[0.06] border-emerald-500/20" : "bg-white/[0.02] border-white/[0.07]"}`}>
                    <span className={`w-2 h-2 shrink-0 rounded-full ${item.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/35 mb-0.5">{item.week}</p>
                      <p className={`text-sm font-semibold ${item.status === "ready" ? "text-white" : "text-white/40"}`}>{item.label}</p>
                    </div>
                    {item.status === "ready" && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">Reveal</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/25 mt-5 leading-relaxed">
                Plus members set their cadence once. Every plan arrives tailored — location, budget, interests — with no repeat venues.
              </p>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="plans" className="relative border-t border-white/[0.07] bg-[#030303]">
          <div className="px-6 md:px-10 py-24 md:py-40 max-w-[1280px] mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-[36px] md:text-[52px] font-black leading-[1.07] tracking-normal mb-4">
                Stop talking about it.
                <br />
                <span className="text-white/30">Start doing it.</span>
              </h2>
              <p className="text-white/45 text-base md:text-lg max-w-md mx-auto leading-relaxed">
                Free to try. Less than a coffee to make it a habit.
              </p>
            </div>

            {/* Billing toggle */}
            <div className="flex justify-center mb-10">
              <div className="flex items-center gap-0.5 bg-white/5 border border-white/12 rounded-2xl p-1">
                {(["monthly", "yearly"] as const).map((interval) => (
                  <button
                    key={interval}
                    type="button"
                    onClick={() => setBillingInterval(interval)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      billingInterval === interval
                        ? "bg-white/12 text-white shadow"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {interval.charAt(0).toUpperCase() + interval.slice(1)}
                    {interval === "yearly" && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.5 rounded-full leading-none">-44%</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-sm md:max-w-[840px] mx-auto">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={[
                    "relative flex flex-col gap-7 rounded-3xl border p-8 md:p-10 transition-[border-color,box-shadow] duration-200",
                    plan.highlighted
                      ? "bg-[#060103] border-rose-400/40 hover:border-rose-300/60 hover:shadow-[0_20px_60px_rgba(244,63,94,0.08)]"
                      : "bg-[#030303] border-white/10 hover:border-white/20",
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
                      <div className={["w-10 h-10 rounded-xl flex items-center justify-center", plan.highlighted ? "bg-rose-500/20" : "bg-white/8"].join(" ")}>
                        {plan.highlighted ? <Sparkles className="w-5 h-5 text-rose-400" /> : <Lock className="w-5 h-5 text-white/35" />}
                      </div>
                      <p className="font-bold text-white text-lg">{plan.name}</p>
                    </div>

                    {plan.highlighted ? (
                      billingInterval === "yearly" ? (
                        <>
                          <p className="text-4xl font-black text-white mb-0.5">{getCurrencySymbol(unitSystem)}{plan.yearlyPrice}</p>
                          <p className="text-sm text-white/45">per year · ~{getCurrencySymbol(unitSystem)}{((plan.yearlyPrice ?? 0) / 12).toFixed(2)}/mo</p>
                        </>
                      ) : (
                        <>
                          <p className="text-4xl font-black text-white mb-0.5">{getCurrencySymbol(unitSystem)}{plan.introPrice}</p>
                          <p className="text-sm text-white/45">first month · then {getCurrencySymbol(unitSystem)}{plan.price}/mo</p>
                        </>
                      )
                    ) : (
                      <p className="text-4xl font-black text-white/45 mb-1">Free</p>
                    )}
                    <p className="text-sm text-white/45 mt-3">{plan.tagline}</p>
                  </div>

                  <ul className="flex flex-col gap-3 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-3">
                        <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400/70" />
                        <span className="text-sm text-white/50">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/register?plan=${plan.id}`}
                    rel="nofollow"
                    className={[
                      "w-full text-center py-4 rounded-full text-sm font-bold transition-colors duration-150",
                      plan.highlighted
                        ? "bg-rose-500 text-white hover:bg-rose-400 shadow-lg shadow-rose-500/20"
                        : "bg-white/6 text-white/55 border border-white/10 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-center text-white/25 text-xs mt-8">Cancel anytime · No surprise charges · Works as a couple or solo</p>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative border-t border-white/[0.07] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(244,63,94,0.07),transparent)]" aria-hidden="true" />
          <div className="relative max-w-[1280px] mx-auto px-6 md:px-10 text-center py-32 md:py-52">
            <h2 className="text-[40px] sm:text-[56px] md:text-[68px] font-black mb-6 leading-[1.05]">
              You&rsquo;ve been saying
              <br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #fb7185, #c026d3, #8b5cf6)" }}>
                &ldquo;we should do something.&rdquo;
              </span>
            </h2>
            <p className="text-white/45 text-base md:text-xl mb-12 md:mb-14 max-w-md mx-auto leading-relaxed">
              This is something. Two minutes to set up. One plan delivered. The couch can wait.
            </p>
            <Link
              href="/register"
              className="group inline-flex items-center gap-3 font-bold px-10 py-5 md:px-14 md:py-6 rounded-full text-base md:text-xl bg-rose-500 text-white hover:bg-rose-400 transition-colors shadow-2xl shadow-rose-500/25"
            >
              Plan our next date
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-white/20 text-xs mt-6">Free to start. No card needed.</p>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.05] px-6 md:px-10 pt-12 pb-10">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Image src="/logo.png" alt="BlindfoldDate" width={120} height={30} className="object-contain opacity-35" />
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {[
              { label: "Privacy", href: "/legal/privacy" },
              { label: "Terms", href: "/legal/terms" },
              { label: "Blog", href: "/blog" },
              { label: "Contact", href: "mailto:info@blindfolddate.com" },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className="text-xs text-white/25 hover:text-white/60 transition-colors">{label}</Link>
            ))}
          </div>
          <p className="text-white/15 text-xs">© {new Date().getFullYear()} BlindfoldDate</p>
        </div>
      </footer>
    </div>
  );
}
