"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Compass,
  Eye,
  MapPin,
  Menu,
  Moon,
  Sparkles,
  Star,
  Timer,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PLANS } from "@/lib/plans";

const NAV_LINKS = [
  { label: "How it works", href: "#ritual" },
  { label: "Inside", href: "#inside" },
  { label: "Pricing", href: "#pricing" },
];

const RITUAL = [
  {
    step: "01",
    icon: Moon,
    title: "Set the mood once",
    body: "Tell BlindfoldDate your tastes, budget, location, and how adventurous you feel.",
  },
  {
    step: "02",
    icon: Compass,
    title: "Let the system disappear",
    body: "We search real places nearby, weigh the fit, and shape a date around your preferences.",
  },
  {
    step: "03",
    icon: Eye,
    title: "Reveal only when ready",
    body: "The plan stays hidden until date night. Then the route, story, and venue unlock.",
  },
];

const FEATURE_PANELS = [
  {
    title: "Real venues, not vague prompts",
    body: "Every reveal points to an actual nearby destination, with distance, budget, and timing considered before it reaches you.",
    image: "/features/feat-1.jpg",
    meta: "Live place search",
  },
  {
    title: "A date that feels composed",
    body: "The plan arrives as a short story with a clear rhythm, so it feels less like an errand and more like an evening.",
    image: "/features/feat-4.jpg",
    meta: "Custom date script",
  },
  {
    title: "Controlled suspense",
    body: "Reveal when you are ready, reroll once if the vibe is off, then show up with the details in hand.",
    image: "/features/feat-6.jpg",
    meta: "Mystery reveal",
  },
];

const SIGNALS = [
  "No endless group chat",
  "No spreadsheet planning",
  "No generic list of ideas",
  "No credit card to start",
];

export default function LandingV2Client() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
      >
        Skip to content
      </a>

      <div className="fixed inset-0 pointer-events-none opacity-[0.055]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.32) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage: "linear-gradient(to bottom, black, transparent 72%)",
          }}
        />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-black/78 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="BlindfoldDate home">
            <Image src="/logo.png" alt="BlindfoldDate" width={150} height={37} priority className="object-contain" />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-medium text-white/48 transition-colors hover:text-white">
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center gap-2 border border-white/16 bg-white px-4 text-sm font-bold text-black transition-colors hover:bg-white/86"
              >
                Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-white/48 transition-colors hover:text-white">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center gap-2 border border-white/16 bg-white px-4 text-sm font-bold text-black transition-colors hover:bg-white/86"
                >
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center border border-white/12 text-white/70 transition-colors hover:border-white/28 hover:text-white md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        <div
          className={`fixed inset-0 z-40 flex min-h-dvh flex-col bg-black px-5 pb-6 pt-16 transition duration-200 md:hidden ${
            menuOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex flex-1 flex-col border-t border-white/10 pt-4">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex h-16 items-center border-b border-white/8 text-xl font-semibold text-white/72"
              >
                {item.label}
              </a>
            ))}
            {!isLoggedIn && (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex h-16 items-center border-b border-white/8 text-xl font-semibold text-white/72"
              >
                Sign in
              </Link>
            )}
          </div>
          <Link
            href={isLoggedIn ? "/dashboard" : "/register"}
            onClick={() => setMenuOpen(false)}
            className="inline-flex h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-bold text-black"
          >
            {isLoggedIn ? "Open dashboard" : "Start free"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main id="main">
        <section className="relative min-h-[94dvh] overflow-hidden border-b border-white/8 bg-black">
          <Image
            src="/features/feat-2.jpg"
            alt="A dark atmospheric date-night venue"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-42"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_0%,rgba(0,0,0,0.86)_36%,rgba(0,0,0,0.44)_70%,#000_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#000_0%,rgba(0,0,0,0.22)_34%,#000_92%)]" />

          <div className="relative mx-auto flex min-h-[94dvh] max-w-7xl flex-col justify-center px-5 pb-20 pt-28 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="max-w-4xl"
            >
              <h1 className="max-w-5xl text-[clamp(2.85rem,7.4vw,7.2rem)] font-black leading-[0.92] tracking-normal text-white">
                The date stays hidden.
                <span className="block text-white/36">The spark does not.</span>
              </h1>

              <p className="mt-8 max-w-2xl text-base leading-8 text-white/62 md:text-xl md:leading-9">
                BlindfoldDate plans real date nights around your taste, then keeps the destination sealed until you are ready to reveal it.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={isLoggedIn ? "/dashboard" : "/register"}
                  className="inline-flex h-14 items-center justify-center gap-3 bg-white px-7 text-sm font-black text-black transition-colors hover:bg-white/86"
                >
                  {isLoggedIn ? "Open dashboard" : "Plan the first reveal"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#ritual"
                  className="inline-flex h-14 items-center justify-center border border-white/14 bg-black/36 px-7 text-sm font-bold text-white/78 backdrop-blur-md transition-colors hover:border-white/32 hover:text-white"
                >
                  See the ritual
                </a>
              </div>
            </motion.div>

            <div className="absolute bottom-0 left-5 right-5 translate-y-1/2 border border-white/10 bg-black/82 backdrop-blur-xl md:left-8 md:right-8">
              <div className="grid grid-cols-2 divide-x divide-y divide-white/8 md:grid-cols-4 md:divide-y-0">
                {[
                  ["Setup", "2 min"],
                  ["Reveal type", "Locked"],
                  ["Search radius", "Up to 50 km"],
                  ["Start", "Free"],
                ].map(([label, value]) => (
                  <div key={label} className="min-h-24 p-4 md:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/28">{label}</p>
                    <p className="mt-3 text-xl font-black text-white md:text-2xl">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="ritual" className="mx-auto max-w-7xl px-5 pb-24 pt-36 md:px-8 md:pb-36 md:pt-44">
          <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300/80">How it works</p>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-normal md:text-6xl">
                A quiet system for better nights out.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-8 text-white/52 md:justify-self-end md:text-lg">
              The interface stays simple because the hard work happens underneath: preference matching, venue selection, timing, and reveal logic.
            </p>
          </div>

          <div className="mt-14 grid gap-3 md:grid-cols-3">
            {RITUAL.map(({ step, icon: Icon, title, body }) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45 }}
                className="min-h-72 border border-white/10 bg-white/[0.025] p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white/32">{step}</span>
                  <span className="flex h-10 w-10 items-center justify-center border border-white/10 bg-black">
                    <Icon className="h-4 w-4 text-white/68" />
                  </span>
                </div>
                <h3 className="mt-16 text-2xl font-black tracking-normal text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/50">{body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="inside" className="border-y border-white/8 bg-[#030303]">
          <div className="mx-auto grid max-w-7xl gap-0 px-5 py-24 md:grid-cols-3 md:px-8 md:py-36">
            {FEATURE_PANELS.map((panel) => (
              <article key={panel.title} className="group border border-white/10 bg-black md:-ml-px">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={panel.image}
                    alt={panel.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover opacity-68 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <span className="absolute bottom-4 left-4 border border-white/12 bg-black/70 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/52 backdrop-blur">
                    {panel.meta}
                  </span>
                </div>
                <div className="p-5 md:p-7">
                  <h3 className="text-2xl font-black tracking-normal">{panel.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/50">{panel.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-24 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-36">
          <div className="relative min-h-[560px] overflow-hidden border border-white/10 bg-black">
            <Image src="/features/feat-3.jpg" alt="An intimate evening table" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/54 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
              <div className="border border-white/12 bg-black/78 p-5 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/36">Current reveal</p>
                    <h3 className="mt-3 text-2xl font-black tracking-normal">The candlelit detour</h3>
                  </div>
                  <div className="flex items-center gap-1 border border-amber-400/20 bg-amber-400/8 px-2 py-1 text-xs font-bold text-amber-200">
                    <Star className="h-3 w-3 fill-amber-200" />
                    4.8
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {[
                    [MapPin, "12 min away"],
                    [Timer, "2.5 hours"],
                    [Sparkles, "Romantic"],
                    [Eye, "Hidden until reveal"],
                  ].map(([Icon, label]) => {
                    const LucideIcon = Icon as typeof MapPin;
                    return (
                      <div key={label as string} className="flex items-center gap-2 border border-white/8 bg-white/[0.03] px-3 py-3 text-xs font-semibold text-white/58">
                        <LucideIcon className="h-3.5 w-3.5 text-rose-200" />
                        {label as string}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">The difference</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-normal md:text-6xl">
              Less deciding. More arriving.
            </h2>
            <p className="mt-6 text-base leading-8 text-white/54 md:text-lg">
              BlindfoldDate narrows the universe for you. It turns preferences into one confident plan, then lets suspense do the rest.
            </p>
            <div className="mt-10 grid gap-2 sm:grid-cols-2">
              {SIGNALS.map((signal) => (
                <div key={signal} className="flex items-center gap-3 border border-white/10 bg-white/[0.025] px-4 py-3 text-sm font-semibold text-white/64">
                  <Check className="h-4 w-4 text-emerald-300" />
                  {signal}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="border-t border-white/8 bg-[#030303]">
          <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-36">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300/80">Pricing</p>
                <h2 className="mt-5 text-4xl font-black leading-tight tracking-normal md:text-6xl">Start quietly. Upgrade when it clicks.</h2>
              </div>
              <div className="flex w-fit border border-white/10 bg-black p-1">
                <button
                  type="button"
                  onClick={() => setBillingInterval("monthly")}
                  className={`h-9 px-4 text-sm font-bold transition-colors ${
                    billingInterval === "monthly" ? "bg-white text-black" : "text-white/48 hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval("yearly")}
                  className={`h-9 px-4 text-sm font-bold transition-colors ${
                    billingInterval === "yearly" ? "bg-white text-black" : "text-white/48 hover:text-white"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>

            <div className="mt-14 grid gap-3 md:grid-cols-2">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`border p-5 md:p-8 ${
                    plan.highlighted ? "border-white/24 bg-white/[0.055]" : "border-white/10 bg-black"
                  }`}
                >
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-2xl font-black tracking-normal">{plan.name}</p>
                      <p className="mt-2 text-sm text-white/48">{plan.tagline}</p>
                    </div>
                    {plan.highlighted && (
                      <span className="border border-rose-300/22 bg-rose-300/10 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-rose-100">
                        Plus
                      </span>
                    )}
                  </div>

                  <div className="mt-9">
                    {plan.highlighted ? (
                      billingInterval === "yearly" ? (
                        <>
                          <p className="text-5xl font-black tracking-normal">EUR {plan.yearlyPrice}</p>
                          <p className="mt-2 text-sm text-white/45">per year, cancel anytime</p>
                        </>
                      ) : (
                        <>
                          <p className="text-5xl font-black tracking-normal">EUR {plan.introPrice}</p>
                          <p className="mt-2 text-sm text-white/45">first month, then EUR {plan.price}/mo</p>
                        </>
                      )
                    ) : (
                      <>
                        <p className="text-5xl font-black tracking-normal">Free</p>
                        <p className="mt-2 text-sm text-white/45">no card needed</p>
                      </>
                    )}
                  </div>

                  <ul className="mt-9 grid gap-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm leading-6 text-white/58">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/register?plan=${plan.id}`}
                    className={`mt-9 inline-flex h-12 w-full items-center justify-center gap-2 text-sm font-black transition-colors ${
                      plan.highlighted ? "bg-white text-black hover:bg-white/86" : "border border-white/12 text-white/68 hover:border-white/28 hover:text-white"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative min-h-[72dvh] overflow-hidden bg-black">
          <Image src="/features/feat-5.jpg" alt="A couple's evening experience" fill sizes="100vw" className="object-cover opacity-32" />
          <div className="absolute inset-0 bg-black/72" />
          <div className="relative mx-auto flex min-h-[72dvh] max-w-7xl flex-col justify-center px-5 py-24 md:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Ready</p>
            <h2 className="mt-5 max-w-4xl text-5xl font-black leading-[0.96] tracking-normal md:text-8xl">
              Give the night a secret.
            </h2>
            <div className="mt-10">
              <Link
                href={isLoggedIn ? "/dashboard" : "/register"}
                className="inline-flex h-14 items-center justify-center gap-3 bg-white px-7 text-sm font-black text-black transition-colors hover:bg-white/86"
              >
                {isLoggedIn ? "Go to dashboard" : "Start the first mystery"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8 bg-black px-5 py-10 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-white/36 md:flex-row md:items-center md:justify-between">
          <Image src="/logo.png" alt="BlindfoldDate" width={124} height={30} className="object-contain opacity-45" />
          <div className="flex flex-wrap gap-5">
            <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-white">Terms</Link>
            <Link href="/legal/accessibility" className="hover:text-white">Accessibility</Link>
            <a href="mailto:info@blindfolddate.com" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
