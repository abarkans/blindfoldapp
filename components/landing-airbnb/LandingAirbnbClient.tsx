"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Star,
  MapPin,
  Sparkles,
  Globe,
  Shield,
  ArrowRight,
  Timer,
  Wallet,
  Menu,
  User,
} from "lucide-react";

const SAMPLE_DATES = [
  {
    id: 1,
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
    photoBg: "from-amber-100 to-orange-50",
    tagStyle: "bg-amber-50 border-amber-200 text-amber-700",
    badge: "Guest favourite",
  },
  {
    id: 2,
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
    photoBg: "from-purple-100 to-rose-50",
    tagStyle: "bg-purple-50 border-purple-200 text-purple-700",
    badge: null,
  },
  {
    id: 3,
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
    photoBg: "from-blue-100 to-indigo-50",
    tagStyle: "bg-blue-50 border-blue-200 text-blue-700",
    badge: null,
  },
];

const TRUST_STATS = [
  { stat: "50k+", label: "Couples matched" },
  { stat: "4.97", label: "Average rating" },
  { stat: "200+", label: "Cities covered" },
  { stat: "98%", label: "Would go again" },
];

const HOW_STEPS = [
  {
    number: "1",
    title: "Share your preferences",
    body: "Tell us your budget, interests, and how far you'll travel. Takes two minutes.",
    icon: "🎯",
  },
  {
    number: "2",
    title: "We curate your date",
    body: "Our AI finds real top-rated venues near you and crafts a personalised date story.",
    icon: "✨",
  },
  {
    number: "3",
    title: "Reveal & go",
    body: "Hit reveal when you're both ready. Navigation opens, the mystery unfolds.",
    icon: "🗺️",
  },
];

const REVIEWS = [
  {
    quote:
      "We've been together 6 years and this completely reignited our date nights. Every reveal feels like a little gift.",
    author: "Emma & Luca",
    location: "Riga, Latvia",
  },
  {
    quote:
      "I'm terrible at planning. BlindfoldDate means I always show up with something amazing prepared. My partner loves it.",
    author: "Marcus",
    location: "Tallinn, Estonia",
  },
  {
    quote:
      "Discovered a jazz bar we'd walked past a hundred times. Would never have gone in without this app.",
    author: "Sophie & Tom",
    location: "Vilnius, Lithuania",
  },
];

export default function LandingAirbnbClient() {
  const [liked, setLiked] = useState<number[]>([]);

  const toggleLike = (id: number) => {
    setLiked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-white text-[#222222]">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#DDDDDD]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "#FF385C" }}
            >
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span
              className="font-bold text-lg tracking-tight hidden sm:block"
              style={{ color: "#FF385C" }}
            >
              BlindfoldDate
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <Link
              href="/register"
              className="hidden md:block text-sm font-semibold text-[#222222] hover:bg-[#F7F7F7] px-3 py-2 rounded-full transition-colors"
            >
              Become a member
            </Link>
            <Link
              href="/login"
              className="hidden md:block text-sm font-medium text-[#222222] hover:bg-[#F7F7F7] px-3 py-2 rounded-full transition-colors"
            >
              Log in
            </Link>
            <div className="flex items-center gap-2 border border-[#DDDDDD] rounded-full px-3 py-2 hover:shadow-md transition-shadow cursor-pointer">
              <Menu className="w-4 h-4 text-[#222222]" />
              <div className="w-7 h-7 rounded-full bg-[#717171] flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #fff5f5 0%, #fdf2ff 50%, #f0f7ff 100%)",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-20 md:pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 border border-[#DDDDDD] bg-white rounded-full px-4 py-2 mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" style={{ color: "#FF385C" }} />
              <span className="text-xs font-medium text-[#717171]">
                Over 50,000 mystery dates planned
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[70px] font-black text-[#222222] leading-[1.05] tracking-tight mb-5 md:mb-6">
              Your next perfect date,
              <br />
              <span style={{ color: "#FF385C" }}>planned by AI.</span>
            </h1>

            <p className="text-[#717171] text-lg md:text-xl max-w-[560px] mx-auto mb-8 md:mb-10 leading-relaxed">
              Real top-rated venues near you. AI-crafted date stories. Complete
              surprise — you just show up.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2.5 font-bold text-base text-white px-8 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl hover:brightness-95 active:scale-95"
                style={{ background: "#FF385C" }}
              >
                <Sparkles className="w-4 h-4" />
                Start for free
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 font-semibold text-base text-[#222222] px-8 py-4 rounded-full border border-[#DDDDDD] bg-white hover:border-[#222222] transition-all"
              >
                How it works
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-6 md:gap-12 mt-14 md:mt-16 pt-10 md:pt-12 border-t border-[#EBEBEB]"
          >
            {TRUST_STATS.map(({ stat, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl md:text-3xl font-black text-[#222222]">
                  {stat}
                </p>
                <p className="text-xs md:text-sm text-[#717171] mt-0.5">
                  {label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Sample date cards ── */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-10 py-14 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 md:mb-12"
        >
          <p className="text-sm font-semibold mb-2" style={{ color: "#FF385C" }}>
            Sneak peek
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-[#222222]">
            Dates like these,
            <br />
            <span className="text-[#717171] font-normal">crafted for you</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {SAMPLE_DATES.map((date, i) => (
            <motion.div
              key={date.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group cursor-pointer rounded-3xl border border-[#DDDDDD] bg-white overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* Photo area */}
              <div
                className={`relative h-52 bg-gradient-to-br ${date.photoBg} flex items-center justify-center overflow-hidden`}
              >
                <span className="text-6xl relative z-10">{date.emoji}</span>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

                {/* Rating badge */}
                <div className="absolute top-3.5 right-12 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
                  <Star className="w-3 h-3 fill-[#222222] text-[#222222]" />
                  <span className="text-xs font-bold text-[#222222]">{date.rating}</span>
                </div>

                {/* Like button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLike(date.id); }}
                  className="absolute top-3 right-3 p-1.5 rounded-full hover:scale-110 transition-transform"
                >
                  <Heart
                    className={`w-5 h-5 drop-shadow transition-colors ${
                      liked.includes(date.id)
                        ? "fill-[#FF385C] text-[#FF385C]"
                        : "text-[#717171] fill-white/80"
                    }`}
                  />
                </button>

                {/* Guest favourite badge */}
                {date.badge && (
                  <div className="absolute top-3.5 left-3.5 bg-white rounded-full px-3 py-1 shadow-sm">
                    <span className="text-[11px] font-semibold text-[#222222]">{date.badge}</span>
                  </div>
                )}

                {/* Mystery badge */}
                {!date.badge && (
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
                    <Sparkles className="w-3 h-3" style={{ color: "#FF385C" }} />
                    <span className="text-[11px] font-semibold text-[#222222]">Mystery Date</span>
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-[#222222] text-base leading-snug flex-1">
                    {date.title}
                  </h3>
                </div>

                <p className="text-sm font-medium mb-2" style={{ color: "#FF385C" }}>
                  {date.vibe}
                </p>

                <div className="flex items-center gap-1.5 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-[#717171] shrink-0" />
                  <p className="text-sm text-[#717171] truncate">{date.venue}</p>
                </div>

                <p className="text-sm text-[#717171] leading-relaxed mb-4 line-clamp-2">
                  {date.description}
                </p>

                {/* Duration / budget chips */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {[
                    { icon: Timer, value: date.duration, label: "Duration" },
                    { icon: Wallet, value: date.budget, label: "Budget" },
                  ].map(({ icon: Icon, value, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 bg-[#F7F7F7] border border-[#EBEBEB] rounded-xl p-3"
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "#FF385C" }} />
                      <div>
                        <p className="text-[10px] text-[#717171]">{label}</p>
                        <p className="text-xs font-semibold text-[#222222]">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tags */}
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

        <p className="text-center text-[#717171] text-xs md:text-sm mt-8 md:mt-10">
          Your actual dates will always be a surprise ✨
        </p>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-[#F7F7F7] py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 md:mb-16"
          >
            <p className="text-sm font-semibold mb-3" style={{ color: "#FF385C" }}>
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-[#222222]">
              Your mystery date,
              <br />
              in three easy steps
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {HOW_STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <div className="text-4xl mb-5">{step.icon}</div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold text-[#717171] border border-[#DDDDDD] rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                    {step.number}
                  </span>
                  <h3 className="font-bold text-[#222222] text-lg">{step.title}</h3>
                </div>
                <p className="text-[#717171] text-sm md:text-base leading-relaxed">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why BlindfoldDate + Reviews ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-sm font-semibold mb-3" style={{ color: "#FF385C" }}>
                Why couples love it
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-[#222222] mb-6 leading-tight">
                No more "what do
                <br />
                you want to do?"
              </h2>
              <p className="text-[#717171] text-base md:text-lg leading-relaxed mb-8">
                We handle the planning — from finding the perfect venue to writing
                your date story. All you need to do is show up and enjoy each other.
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: MapPin,
                    title: "Real venues near you",
                    body: "Top-rated hidden gems, never generic suggestions.",
                  },
                  {
                    icon: Shield,
                    title: "Budget-aware every time",
                    body: "Set your limit — every date lands within it.",
                  },
                  {
                    icon: Sparkles,
                    title: "AI-written date story",
                    body: "Each reveal comes with a personalised narrative.",
                  },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "#FFF0F2" }}
                    >
                      <Icon className="w-4 h-4" style={{ color: "#FF385C" }} />
                    </div>
                    <div>
                      <p className="font-semibold text-[#222222] text-sm">{title}</p>
                      <p className="text-[#717171] text-sm mt-0.5">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Reviews */}
            <div className="space-y-4">
              {REVIEWS.map((review, i) => (
                <motion.div
                  key={review.author}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white border border-[#DDDDDD] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-[#222222] text-[#222222]" />
                    ))}
                  </div>
                  <p className="text-[#222222] text-sm leading-relaxed mb-4">
                    &ldquo;{review.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: "#FF385C" }}
                    >
                      {review.author[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#222222]">{review.author}</p>
                      <p className="text-xs text-[#717171]">{review.location}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 md:py-24 bg-[#F7F7F7]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-[680px] mx-auto px-6 text-center"
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: "#FF385C" }}
          >
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-[#222222] mb-4 leading-tight">
            Your next great date
            <br />
            is one tap away.
          </h2>
          <p className="text-[#717171] text-base md:text-lg mb-8 leading-relaxed">
            Join thousands of couples who handed the planning to us — and got
            their spark back.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-3 font-bold text-lg text-white px-10 py-4 rounded-full shadow-xl hover:brightness-95 hover:shadow-2xl transition-all active:scale-95"
            style={{ background: "#FF385C" }}
          >
            <Sparkles className="w-5 h-5" />
            Book my first mystery date
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mt-5">
            <span className="text-xs text-[#717171]">Free to start</span>
            <span className="hidden sm:inline text-[#DDDDDD]">·</span>
            <span className="text-xs text-[#717171]">No credit card needed</span>
            <span className="hidden sm:inline text-[#DDDDDD]">·</span>
            <span className="text-xs text-[#717171]">Cancel anytime</span>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#DDDDDD] py-10 md:py-12">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {[
              {
                title: "BlindfoldDate",
                links: [
                  { label: "How it works", href: "#how-it-works" },
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#plans" },
                ],
              },
              {
                title: "Support",
                links: [
                  { label: "Help centre", href: "#" },
                  { label: "Contact us", href: "mailto:info@blindfolddate.com" },
                ],
              },
              {
                title: "Legal",
                links: [
                  { label: "Privacy Policy", href: "/legal/privacy" },
                  { label: "Terms of Service", href: "/legal/terms" },
                ],
              },
              {
                title: "Account",
                links: [
                  { label: "Sign in", href: "/login" },
                  { label: "Create account", href: "/register" },
                ],
              },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="text-xs font-bold text-[#222222] uppercase tracking-wider mb-3">
                  {title}
                </p>
                <ul className="space-y-2.5">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="text-sm text-[#717171] hover:text-[#222222] hover:underline transition-colors"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-[#DDDDDD] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: "#FF385C" }}
              >
                <Heart className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="text-sm font-semibold text-[#222222]">BlindfoldDate</span>
              <span className="text-sm text-[#717171]">· © 2026</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#717171]">
              <Globe className="w-3.5 h-3.5" />
              <span>English (EN)</span>
              <span className="mx-2 text-[#DDDDDD]">·</span>
              <span>€ EUR</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
