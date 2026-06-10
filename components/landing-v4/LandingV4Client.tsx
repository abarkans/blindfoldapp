"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView, type MotionValue } from "framer-motion";
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
  Zap,
  X,
  Utensils,
  Martini,
  TreePine,
  Palette,
  Film,
  Coffee,
  Waves,
  Camera,
  Heart,
  Dumbbell,
  BookOpen,
  Gamepad2,
  Home,
  Users,
  Calendar,
  Bell,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { getCurrencySymbol, formatBudgetRange, type UnitSystem } from "@/lib/units";

const FEATURE_ITEMS = [
  {
    icon: Sparkles,
    title: "Picked for you",
    description: "Tell the app what you're into once. It handles the rest. No scrolling, no debating, no \"you decide.\"",
    blob: "bg-violet-400",
    blobPos: "bottom-0 left-0",
    iconColor: "text-violet-400",
  },
  {
    icon: MapPin,
    title: "Real places near you",
    description: "Every date is built around actual venues in your city, not a generic list of ideas you still have to Google.",
    blob: "bg-blue-400",
    blobPos: "top-0 right-0",
    iconColor: "text-blue-400",
  },
  {
    icon: Home,
    title: "Staying in counts too",
    description: "Not every date needs a reservation. The app plans evenings at home that actually feel chosen.",
    blob: "bg-rose-400",
    blobPos: "top-0 right-0",
    iconColor: "text-rose-400",
  },
  {
    icon: Users,
    title: "Both of you. One date.",
    description: "Link once, and both partners see the same date revealed at the same time. No spoilers, no coordination.",
    blob: "bg-indigo-400",
    blobPos: "bottom-0 left-0",
    iconColor: "text-indigo-400",
  },
  {
    icon: Calendar,
    title: "Your date history",
    description: "Every date you've done lives here. So you actually know it's been three weeks since you left the house.",
    blob: "bg-amber-400",
    blobPos: "bottom-0 right-0",
    iconColor: "text-amber-400",
  },
  {
    icon: Bell,
    title: "A nudge when life gets loud",
    description: "Busy weeks happen. A quiet reminder keeps date night from being the first thing that gets dropped.",
    blob: "bg-teal-400",
    blobPos: "top-0 left-0",
    iconColor: "text-teal-400",
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

const DATE_IDEA_CARDS = [
  // Row 1
  { interest: "Food & Dining",      icon: Utensils, color: "text-orange-300", bg: "bg-orange-500/15", border: "border-orange-400/20", title: "Omakase for Two",          vibe: "A chef's table. No menu. Just trust." },
  { interest: "Romance",            icon: Heart,    color: "text-rose-300",   bg: "bg-rose-500/15",   border: "border-rose-400/20",   title: "Sunset Rooftop Drinks",    vibe: "Golden hour, cold glass, no agenda." },
  { interest: "Nature",             icon: TreePine, color: "text-emerald-300",bg: "bg-emerald-500/15",border: "border-emerald-400/20",title: "Sunrise Hike",             vibe: "Early alarm. Worth every minute." },
  { interest: "Art & Culture",      icon: Palette,  color: "text-purple-300", bg: "bg-purple-500/15", border: "border-purple-400/20", title: "Gallery After Dark",       vibe: "Private viewing night. Wine included." },
  { interest: "Drinks & Nightlife", icon: Martini,  color: "text-blue-300",   bg: "bg-blue-500/15",   border: "border-blue-400/20",   title: "Speakeasy Night",          vibe: "Hidden bar. Secret knock optional." },
  { interest: "Coffee & Cafés",     icon: Coffee,   color: "text-amber-300",  bg: "bg-amber-500/15",  border: "border-amber-400/20",  title: "Third Wave Coffee Tour",   vibe: "Four cafés. Rate them all." },
  { interest: "Cinema",             icon: Film,     color: "text-sky-300",    bg: "bg-sky-500/15",    border: "border-sky-400/20",    title: "Outdoor Film Night",       vibe: "Blanket, popcorn, sky above." },
  { interest: "Beach & Water",      icon: Waves,    color: "text-cyan-300",   bg: "bg-cyan-500/15",   border: "border-cyan-400/20",   title: "Kayak at Dusk",            vibe: "Paddle out. Watch the light change." },
  // Row 2
  { interest: "Fitness",            icon: Dumbbell, color: "text-lime-300",   bg: "bg-lime-500/15",   border: "border-lime-400/20",   title: "Bouldering Date",          vibe: "Trust your partner to catch you." },
  { interest: "Photography",        icon: Camera,   color: "text-violet-300", bg: "bg-violet-500/15", border: "border-violet-400/20", title: "Golden Hour Shoot",        vibe: "You two. Best light of the day." },
  { interest: "Books & Learning",   icon: BookOpen, color: "text-teal-300",   bg: "bg-teal-500/15",   border: "border-teal-400/20",   title: "Bookshop Trawl",           vibe: "£5 each. Find something for the other." },
  { interest: "Gaming",             icon: Gamepad2, color: "text-indigo-300", bg: "bg-indigo-500/15", border: "border-indigo-400/20", title: "Arcade Night",             vibe: "Tokens, competition, bad winners." },
  { interest: "Food & Dining",      icon: Utensils, color: "text-orange-300", bg: "bg-orange-500/15", border: "border-orange-400/20", title: "Street Food Safari",       vibe: "Follow your nose through the market." },
  { interest: "Romance",            icon: Heart,    color: "text-rose-300",   bg: "bg-rose-500/15",   border: "border-rose-400/20",   title: "Candlelit Cinema",         vibe: "Old film. Dark room. Just you two." },
  { interest: "Nature",             icon: TreePine, color: "text-emerald-300",bg: "bg-emerald-500/15",border: "border-emerald-400/20",title: "Botanical Garden Wander",  vibe: "No destination. Just greenery." },
  { interest: "Drinks & Nightlife", icon: Martini,  color: "text-blue-300",   bg: "bg-blue-500/15",   border: "border-blue-400/20",   title: "Cocktail Lab",             vibe: "Build your own drink. Judge each other's." },
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

const FLOATING_INTERESTS = [
  { icon: Utensils, label: "Food",        bg: "bg-orange-500/20",  border: "border-orange-400/30",  color: "text-orange-300",  front: true,  style: { top: "6%",       left: "-18px"  }, delay: 0    },
  { icon: Heart,    label: "Romance",     bg: "bg-rose-500/20",    border: "border-rose-400/30",    color: "text-rose-300",    front: true,  style: { top: "6%",       right: "-18px" }, delay: 0.5  },
  { icon: TreePine, label: "Nature",      bg: "bg-emerald-500/20", border: "border-emerald-400/30", color: "text-emerald-300", front: false, style: { top: "38%",      left: "-22px"  }, delay: 1.0  },
  { icon: Film,     label: "Cinema",      bg: "bg-violet-500/20",  border: "border-violet-400/30",  color: "text-violet-300",  front: false, style: { top: "38%",      right: "-22px" }, delay: 0.3  },
  { icon: Coffee,   label: "Coffee",      bg: "bg-amber-500/20",   border: "border-amber-400/30",   color: "text-amber-300",   front: false, style: { bottom: "8%",    left: "-18px"  }, delay: 0.8  },
  { icon: Waves,    label: "Beach",       bg: "bg-cyan-500/20",    border: "border-cyan-400/30",    color: "text-cyan-300",    front: false, style: { bottom: "8%",    right: "-18px" }, delay: 0.2  },
  { icon: Dumbbell, label: "Fitness",     bg: "bg-red-500/20",     border: "border-red-400/30",     color: "text-red-300",     front: true,  style: { bottom: "-18px", left: "15%"    }, delay: 0.4  },
  { icon: Martini,  label: "Nightlife",   bg: "bg-purple-500/20",  border: "border-purple-400/30",  color: "text-purple-300",  front: true,  style: { bottom: "-18px", right: "15%"   }, delay: 0.9  },
] as const;

const BADGE_PREVIEWS = [
  { name: "First Spark", image: "/badges/First_Spark.png", earned: true },
  { name: "Triple Threat", image: "/badges/Triple_Threat.png", earned: false },
  { name: "High Five", image: "/badges/High_Five.png", earned: false },
];

const FAKE_MEMORIES = [
  { title: "Golden Hour Walk", date: "Mar 12", gradient: "from-rose-300 via-amber-200 to-orange-300",    image: "/memories/golden-hour-walk.jpg" },
  { title: "Cosy Night In",    date: "Feb 24", gradient: "from-violet-300 via-pink-200 to-rose-300",     image: "/memories/cosy-night-in.jpg" },
  { title: "Surprise Cinema",  date: "Feb 8",  gradient: "from-emerald-200 via-cyan-300 to-indigo-300",  image: "/memories/surprise-cinema.jpg" },
  { title: "Jazz Bar Night",   date: "Jan 19", gradient: "from-amber-300 via-orange-200 to-red-300",     image: "/memories/jazz-bar-night.jpg" },
  { title: "Market Morning",   date: "Jan 5",  gradient: "from-purple-300 via-indigo-200 to-blue-300",   image: "/memories/market-morning.jpg" },
  { title: "Rooftop Sunset",   date: "Dec 15", gradient: "from-orange-200 via-rose-300 to-pink-300",     image: "/memories/rooftop-sunset.jpg" },
  { title: "Picnic in Park",   date: "Nov 28", gradient: "from-green-200 via-emerald-300 to-teal-300",   image: "/memories/picnic-in-park.jpg" },
  { title: "Cooking Together", date: "Nov 12", gradient: "from-yellow-200 via-amber-300 to-orange-200",  image: "/memories/cooking-together.jpg" },
  { title: "Night Market",     date: "Oct 31", gradient: "from-indigo-300 via-purple-200 to-violet-300", image: "/memories/night-market.jpg" },
  { title: "Lazy Sunday",      date: "Oct 18", gradient: "from-sky-200 via-blue-300 to-indigo-200",      image: "/memories/lazy-sunday.jpg" },
];

const MEMORY_CARD_CONFIGS = [
  { scatterX:   20,  scatterY:  10,  scatterRot:  -8 },
  { scatterX:  220,  scatterY: -110, scatterRot:  32 },
  { scatterX: -200,  scatterY:  90,  scatterRot: -55 },
  { scatterX:  290,  scatterY:  140, scatterRot:  68 },
  { scatterX: -270,  scatterY: -130, scatterRot: -42 },
  { scatterX:  120,  scatterY:  220, scatterRot:  50 },
  { scatterX: -100,  scatterY: -210, scatterRot: -72 },
  { scatterX:  320,  scatterY:  -40, scatterRot:  22 },
  { scatterX: -310,  scatterY:  160, scatterRot: -28 },
  { scatterX:  170,  scatterY: -190, scatterRot:  62 },
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
    image: "/memories/golden-hour-walk.jpg",
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
    image: "/memories/cosy-night-in.jpg",
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
    image: "/features/feat-4.jpg",
  },
];

const NAV_LINKS = [
  { label: "Benefits", href: "#benefits", scroll: false },
  { label: "Features", href: "#features", scroll: false },
  { label: "Pricing", href: "#plans", scroll: false },
  { label: "FAQ", href: "#faq", scroll: false },
  { label: "Ideas", href: "/blog", scroll: false },
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
  "Neither is debating it, checking reviews, or calling it a night.*",
  "We make the call. You show up.",
];

function MemoryPolaroidCard({
  memory,
  config,
  scrollYProgress,
  index,
  animateRotation,
}: {
  memory: typeof FAKE_MEMORIES[0];
  config: typeof MEMORY_CARD_CONFIGS[0];
  scrollYProgress: MotionValue<number>;
  index: number;
  animateRotation: boolean;
}) {
  const dir = index % 2 === 0 ? 1 : -1;
  const mag = 12 + (index % 3) * 5;
  const rotate = useTransform(
    scrollYProgress,
    [0, 1],
    animateRotation
      ? [config.scatterRot - dir * mag, config.scatterRot + dir * mag]
      : [config.scatterRot, config.scatterRot]
  );

  return (
    <motion.div
      style={{
        rotate,
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -128,
        marginLeft: -80,
        x: config.scatterX,
        y: config.scatterY,
        zIndex: index + 1,
      }}
    >
      <div
        style={{
          width: 160,
          padding: "7px 7px 26px",
          background: "white",
          borderRadius: 12,
          boxShadow: "0 6px 24px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.25)",
          userSelect: "none",
        }}
      >
        <div
          className="relative overflow-hidden"
          style={{ borderRadius: 7, aspectRatio: "3/4" }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${memory.gradient}`} style={{ filter: "blur(18px)", transform: "scale(1.4)" }} />
          <div className={`absolute inset-0 bg-gradient-to-br ${memory.gradient} opacity-60`} />
          <div className="absolute inset-0 bg-black/10" />
          <Image src={memory.image} alt={memory.title} fill sizes="160px" className="object-cover" />
        </div>
        <div style={{ paddingTop: 7 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#1a1215", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {memory.title}
          </p>
          <p style={{ fontSize: 10, color: "#9e8e98", marginTop: 2 }}>{memory.date}</p>
        </div>
      </div>
    </motion.div>
  );
}

function GamificationSection({ unitSystem }: { unitSystem: UnitSystem }) {
  return (
    <section className="relative bg-black overflow-hidden">
      <div className="px-6 md:px-10 pt-16 md:pt-28 pb-16 md:pb-28 max-w-[1280px] mx-auto">

        {/* Title */}
        <div className="text-left md:text-center mb-10 md:mb-14">
          <h2 className="text-[36px] md:text-[44px] lg:text-[48px] xl:text-[54px] 2xl:text-[64px] font-black leading-[1.05] mb-4">
            Dates that leave{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #fb7185 0%, #c026d3 45%, #8b5cf6 100%)" }}
            >
              a mark.
            </span>
          </h2>
          <p className="text-white/55 text-base md:text-lg leading-[1.7]">
            Each completed date earns XP. Level up. Unlock badges.{" "}<br />See where your streak takes you.
          </p>
        </div>

        {/* Cards fading into XP bar */}
        <div className="relative mb-[-180px] md:mb-[-200px]">
          <motion.div className="relative mx-auto max-w-[660px] cursor-pointer" initial="rest" whileHover="hover">
            {/* Left card — behind */}
            <motion.div
              className="absolute inset-0 z-0 pointer-events-none opacity-60"
              style={{ transformOrigin: "bottom center" }}
              variants={{ rest: { x: -110, scale: 0.86, y: 0 }, hover: { x: -110, scale: 0.86, y: -5 } }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <DateExampleCard date={SAMPLE_DATES[2]} unitSystem={unitSystem} />
            </motion.div>
            {/* Right card — behind */}
            <motion.div
              className="absolute inset-0 z-0 pointer-events-none opacity-60"
              style={{ transformOrigin: "bottom center" }}
              variants={{ rest: { x: 110, scale: 0.86, y: 0 }, hover: { x: 110, scale: 0.86, y: -5 } }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <DateExampleCard date={SAMPLE_DATES[1]} unitSystem={unitSystem} />
            </motion.div>
            {/* Center card */}
            <motion.div
              className="relative z-10 mx-auto max-w-[480px]"
              variants={{ rest: { y: 0 }, hover: { y: -12 } }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <DateExampleCard date={SAMPLE_DATES[0]} unitSystem={unitSystem} />
            </motion.div>
            {/* Gradient fades card bottom into XP bar */}
            <div className="absolute bottom-0 h-[300px] md:h-[340px] bg-gradient-to-t from-black from-[60%] to-transparent pointer-events-none z-20" style={{ left: "-120px", right: "-120px" }} />
          </motion.div>
        </div>

        {/* XP + Badges */}
        <div className="relative z-30 max-w-[1000px] mx-auto bg-black">
            {/* XP bar */}
            <div className="mb-8 p-5 bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl text-left">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-md shadow-violet-500/30">
                    <Zap className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                  <span className="text-sm font-bold text-white">Level 3</span>
                </div>
                <span className="text-xs text-white/50">300 XP · 100 XP to level up</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.075] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 shadow-sm shadow-violet-500/30"
                  initial={{ width: "42%" }}
                  whileInView={{ width: "76%" }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 1.4, ease: "easeOut", delay: 0.55 }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-white/55">Lv 3</span>
                <span className="text-[10px] text-white/55">Lv 4</span>
              </div>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-3 gap-3">
              {BADGE_PREVIEWS.map((badge) => (
                <div
                  key={badge.name}
                  className="flex flex-col items-center text-center p-3 rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d]"
                >
                  <div className="relative w-16 h-16 mb-2">
                    <Image
                      src={badge.image}
                      alt={badge.name}
                      width={64}
                      height={64}
                      className={`w-full h-full object-contain ${badge.earned ? "" : "grayscale opacity-35"}`}
                      style={badge.earned ? {} : { filter: "grayscale(1) blur(1.5px)" }}
                    />
                    {!badge.earned && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
                          <Lock className="w-3.5 h-3.5 text-white/70" />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs font-semibold ${badge.earned ? "text-white" : "text-white/40"}`}>
                    {badge.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

    </section>
  );
}

function MemoriesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-black h-screen overflow-hidden flex flex-col">
      {/* Header — z-20 keeps it above cards that drift upward */}
      <div className="relative z-20 px-6 md:px-10 pt-10 md:pt-14 pb-6 md:pb-0 text-left md:text-center shrink-0 bg-black">
        <h2 className="text-[36px] md:text-[44px] lg:text-[48px] xl:text-[54px] 2xl:text-[64px] font-black leading-[1.05] tracking-normal">
          Every date, remembered.
        </h2>
        <p className="text-white/35 text-[36px] md:text-[44px] lg:text-[48px] xl:text-[54px] 2xl:text-[64px] font-black leading-[1.05]">
          Your scrapbook, growing with you.
        </p>
        <p className="text-white/55 text-base md:text-lg leading-[1.7] mt-3">
          Plus subscribers unlock their full scrapbook.{" "}
          <span className="text-white/80 font-semibold">Every memory, always there.</span>
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 relative flex items-center justify-center">
        <div className="relative w-full" style={{ height: 360 }}>
          {FAKE_MEMORIES.map((memory, i) => (
            <MemoryPolaroidCard
              key={memory.title}
              memory={memory}
              config={MEMORY_CARD_CONFIGS[i]}
              scrollYProgress={scrollYProgress}
              index={i}
              animateRotation={isDesktop}
            />
          ))}
        </div>
        {/* Fade top */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent pointer-events-none z-30" />
        {/* Fade bottom */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-30" />
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="bg-black py-16 md:py-24 scroll-mt-20 md:scroll-mt-28">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="flex flex-col items-start md:items-center mb-10 md:mb-16 gap-4">
          <h2 className="text-[36px] md:text-[44px] lg:text-[48px] xl:text-[54px] 2xl:text-[64px] font-black leading-[1.05] tracking-normal text-white md:text-center max-w-[700px]">
            What the app actually does
          </h2>
          <p className="text-white/50 text-base md:text-lg max-w-[520px] leading-[1.7] md:text-center md:mx-auto">
            We handle the parts that usually kill date night. The idea, the venue, the nudge to actually go.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {FEATURE_ITEMS.map(({ icon: Icon, title, description, blob, blobPos, iconColor }) => (
            <div key={title} className="relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.08] p-7 flex flex-col gap-4">
              <div className={`absolute ${blobPos} w-40 h-40 ${blob} opacity-[0.08] rounded-full blur-2xl pointer-events-none`} />
              <div className="relative z-10 w-11 h-11 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0">
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="relative z-10">
                <p className="font-bold text-white text-base mb-1">{title}</p>
                <p className="text-white/45 text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type DateIdeaCard = (typeof DATE_IDEA_CARDS)[number];

function DateIdeaCardItem({ card }: { card: DateIdeaCard }) {
  const Icon = card.icon;
  return (
    <div className={`shrink-0 w-64 rounded-2xl border ${card.border} bg-white/[0.05] p-5 flex flex-col gap-3`}>
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${card.bg} ${card.border} border w-fit`}>
        <Icon className={`w-3.5 h-3.5 ${card.color}`} />
        <span className={`text-xs font-semibold ${card.color}`}>{card.interest}</span>
      </div>
      <div>
        <p className="text-white font-bold text-base leading-snug">{card.title}</p>
        <p className="text-white/45 text-sm mt-1 leading-snug">{card.vibe}</p>
      </div>
    </div>
  );
}

function DateIdeasMarqueeRow({ cards, reverse = false }: { cards: DateIdeaCard[]; reverse?: boolean }) {
  const doubled = [...cards, ...cards];
  return (
    <div className="flex overflow-hidden">
      <motion.div
        className="flex gap-4 pr-4"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((card, i) => (
          <DateIdeaCardItem key={i} card={card} />
        ))}
      </motion.div>
    </div>
  );
}

function DateIdeasSection() {
  const row1 = DATE_IDEA_CARDS.slice(0, 8);
  const row2 = DATE_IDEA_CARDS.slice(8, 16);
  return (
    <section id="benefits" className="bg-black py-16 md:py-24 scroll-mt-20 md:scroll-mt-28">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <h2 className="text-[36px] md:text-[44px] lg:text-[48px] xl:text-[54px] 2xl:text-[64px] font-black leading-[1.05] tracking-normal mb-4 md:text-center">
          No more &ldquo;I don&rsquo;t know,<br className="hidden sm:block" /> what do you want to do?&rdquo;
        </h2>
        <p className="text-white/50 text-base md:text-lg max-w-[520px] leading-[1.7] mb-10 md:mb-14 md:text-center md:mx-auto">
          Tell us what you&rsquo;re into. We handle the rest — venue, vibe, and a little task to make it interesting.
        </p>

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent z-10" />
          <div className="py-2">
            <DateIdeasMarqueeRow cards={row1} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ScrollRevealStatement() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "center 0.5"],
  });

  // Separate scroll tracker for the line — offset starts at 0.75 so progress=0
  // at page load (hero is 82dvh tall, already past the 0.85 threshold at scroll=0)
  const { scrollYProgress: lineScrollProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "center 0.5"],
  });
  const lineScaleY = useTransform(lineScrollProgress, [0, 1], [0, 1]);
  const total = REVEAL_LINES.length;

  return (
    <section ref={ref} aria-label="The problem we solve" className="relative px-6 md:px-10 py-0 pb-16 md:pb-28 max-w-[1280px] mx-auto">
      {/* scroll-fill vertical line — extends up into hero, fills on scroll */}
      <div className="hidden xl:block absolute left-40 top-0 bottom-28 w-px bg-white/10 overflow-hidden">
        <motion.div className="absolute inset-0 bg-white/40 origin-top" style={{ scaleY: lineScaleY }} />
      </div>
      <h2 className="sr-only">Why couples stop going on dates</h2>
      <p className="text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] 2xl:text-[44px] font-black leading-[1.15] tracking-normal max-w-[700px] mx-auto">
        {REVEAL_LINES.map((line, i) => {
          const start = (i / total) * 0.9;
          const end = ((i + 1) / total) * 0.9;
          const isLast = i === total - 1;
          const breakAfter = i === 1 || i === 2;
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
      <p className="text-white/40 text-sm md:text-base mt-6 max-w-[700px] mx-auto">* Some nights you don&apos;t want to go anywhere. We plan those too.</p>
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
  const opacity = useTransform(scrollYProgress, [start, end], [0.3, 1]);
  const color = useTransform(
    scrollYProgress,
    [start, end],
    isLast ? ["rgba(244,63,94,0.35)", "rgba(244,63,94,1)"] : ["rgba(255,255,255,0.3)", "rgba(255,255,255,1)"]
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

export default function LandingV4Client({ unitSystem = "metric" }: { unitSystem?: UnitSystem }) {
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
    if (window.matchMedia("(max-width: 768px)").matches) return;
    setHeroVideoReady(false);
    setHeroVideo(HERO_VIDEOS[Math.floor(Math.random() * HERO_VIDEOS.length)]);
  }, []);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
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
  const [pastHero, setPastHero] = useState(false);
  const heroSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    const el = heroSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
            <Image src="/logo.png" alt="BlindfoldDate" width={180} height={44} priority className="hidden min-[992px]:block object-contain group-hover:opacity-75 transition-opacity" />
            <Image src="/icon.png" alt="BlindfoldDate" width={44} height={44} priority className="min-[992px]:hidden object-contain group-hover:opacity-75 transition-opacity" />
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
                className={`inline-flex items-center justify-center gap-2 text-sm leading-none text-white font-semibold px-5 h-10 rounded-full transition-[color,background-color,border-color] duration-300 ${pastHero ? "bg-rose-500 hover:bg-rose-400 border-2 border-transparent" : "bg-black/90 border-2 border-rose-500/35 hover:border-rose-400/60 hover:bg-black/80 backdrop-blur-sm"}`}
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
                  className={`inline-flex items-center justify-center gap-2 text-sm leading-none text-white font-semibold px-5 h-10 rounded-full transition-[color,background-color,border-color] duration-300 ${pastHero ? "bg-rose-500 hover:bg-rose-400 border-2 border-transparent" : "bg-black/90 border-2 border-rose-500/35 hover:border-rose-400/60 hover:bg-black/80 backdrop-blur-sm"}`}
                >
                  Get started free
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          <div className="min-[992px]:hidden flex items-center gap-2">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className={`inline-flex items-center justify-center gap-2 text-sm leading-none text-white font-semibold px-5 h-10 rounded-full transition-[color,background-color,border-color] duration-300 ${pastHero ? "bg-rose-500 hover:bg-rose-400 border-2 border-transparent" : "bg-black/90 border-2 border-rose-500/35 hover:border-rose-400/60 hover:bg-black/80 backdrop-blur-sm"}`}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/register"
                className={`inline-flex items-center justify-center gap-2 text-sm leading-none text-white font-semibold px-5 h-10 rounded-full transition-[color,background-color,border-color] duration-300 ${pastHero ? "bg-rose-500 hover:bg-rose-400 border-2 border-transparent" : "bg-black/90 border-2 border-rose-500/35 hover:border-rose-400/60 hover:bg-black/80 backdrop-blur-sm"}`}
              >
                Get started
              </Link>
            )}
            <button
              className="w-11 h-11 flex items-center justify-center rounded-xl text-white/75 hover:text-white hover:bg-white/[0.04] transition-[color,background-color] duration-150"
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
          </div>
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
        <section ref={heroSectionRef} className="relative overflow-hidden bg-black">
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
              preload="none"
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
          <div className="absolute inset-0 bg-gradient-to-b from-black/38 via-transparent to-black" />

          <div className="relative mx-auto flex min-h-[82dvh] max-w-[1280px] flex-col items-start justify-end px-6 pb-16 pt-[120px] text-left md:px-10 md:pb-20 md:pt-[96px] lg:pb-28">
            <div className="w-full max-w-[960px]">
              <h1 className="text-[48px] sm:text-[56px] lg:text-[60px] xl:text-[68px] 2xl:text-[80px] font-black leading-[1.04] tracking-tight mb-7 md:mb-8 [filter:drop-shadow(0_6px_24px_rgba(0,0,0,0.88))]">
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
                A mystery date, planned for you both. Free - no card needed.
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
                  <Link
                    href="/register"
                    className="group relative inline-flex items-center justify-center text-white font-bold px-8 h-14 md:h-16 rounded-full text-base md:text-lg transition-[background-color] duration-150 overflow-hidden bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-500/25"
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Plan my mystery date
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Problem statement scroll reveal ── */}
        <ScrollRevealStatement />

        {/* ── Date ideas marquee ── */}
        <DateIdeasSection />

        {/* ── Gamification: date card + XP/badges ── */}
        <GamificationSection unitSystem={unitSystem} />

        {/* ── Memories scatter → pile ── */}
        <MemoriesSection />

        {/* ── Features ── */}
        <FeaturesSection />

        {/* ── Pricing ── */}
        <section id="plans" className="relative bg-black scroll-mt-20 md:scroll-mt-28">
          <div className="px-6 md:px-10 py-16 md:py-28 max-w-[1280px] mx-auto">
            <div className="text-left md:text-center mb-8 md:mb-12">
              <h2 className="text-[36px] md:text-[44px] lg:text-[48px] xl:text-[54px] 2xl:text-[64px] font-black leading-[1.05] tracking-normal">
                The only decision
                <br />
                you have to make.
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
                      <div className="absolute -top-4 left-0 right-0 flex justify-center">
                        <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-violet-600 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg shadow-pink-500/25">
                          Best value
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
                            <p className="text-4xl md:text-[42px] font-black mb-0.5 text-white">
                              {getCurrencySymbol(unitSystem)}{plan.introPrice}
                              <span className="text-lg font-semibold text-white/55 ml-2">first month</span>
                            </p>
                            <p className="text-sm md:text-base text-white/55 mt-2">{getCurrencySymbol(unitSystem)}{plan.price}/mo after. Cancel anytime.</p>
                          </>
                        )
                      ) : (
                        <p className="text-4xl md:text-[42px] font-black mb-1 text-white/50">
                          {plan.priceLine.split("/")[0].trim()}
                        </p>
                      )}
                      {!plan.highlighted && <p className="text-sm md:text-base text-white/55 mt-3">{plan.tagline}</p>}
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
        <section id="faq" className="bg-black scroll-mt-20 md:scroll-mt-28">
          <div className="px-6 md:px-10 py-14 md:py-20 max-w-[800px] mx-auto">
            <h2 className="text-[36px] md:text-[40px] lg:text-[44px] xl:text-[50px] 2xl:text-[56px] font-black leading-tight mb-10 md:mb-14 md:text-center">
              Frequently asked questions
            </h2>
            <dl className="flex flex-col gap-3">
              {FAQ_ITEMS.map(({ q, a }, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={q} className="bg-white/[0.06] rounded-2xl px-6 md:px-8">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-6 py-5 md:py-6 text-left group"
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
                    <motion.div
                      animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                      initial={false}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden"
                      aria-hidden={!isOpen}
                    >
                      <dd className="text-white/50 text-base md:text-xl leading-[1.75] pb-6 md:pb-8 max-w-[800px]">
                        {a}
                      </dd>
                    </motion.div>
                  </div>
                );
              })}
            </dl>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative overflow-hidden bg-black">
          <div className="relative max-w-[1280px] mx-auto px-6 md:px-10 text-center py-20 md:py-36 flex flex-col items-center">
            <div className="w-20 h-20 md:w-28 md:h-28 mb-10 md:mb-12">
              <Image src="/icon.png" alt="Blindfold" width={112} height={112} className="w-full h-full object-contain" />
            </div>

            <h2 className="text-[40px] sm:text-[44px] md:text-[50px] lg:text-[56px] xl:text-[62px] 2xl:text-[72px] font-black mb-7 md:mb-8 leading-[1.05] tracking-normal">
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
              {[{ label: "Features", href: "#features" }, { label: "Pricing", href: "#plans" }].map(({ label, href }) => (
                <a key={label} href={href} className="text-sm text-white/50 hover:text-white transition-colors">{label}</a>
              ))}
              <Link href="/blog" className="text-sm text-white/50 hover:text-white transition-colors">Ideas</Link>
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
    <div className="flex h-[410px] flex-col rounded-3xl border border-white/14 bg-[#030303] overflow-hidden text-left md:block md:h-auto">
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
