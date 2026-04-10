import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Heart, Sparkles, Lock, ArrowRight, MapPin, Trophy, Zap } from "lucide-react";
import DateCarousel from "@/components/landing/DateCarousel";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-pink-500/40">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">blindfold</span>
        </div>
        <Link
          href="/login"
          className="text-sm text-white font-semibold border border-pink-500 hover:border-pink-400 hover:bg-pink-500/10 px-6 h-12 inline-flex items-center rounded-2xl transition-all"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 rounded-full px-4 py-1.5 mb-8">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span className="text-xs text-pink-300 font-medium">AI-curated mystery dates near you</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight mb-6">
          Date nights,
          <br />
          <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
            reinvented.
          </span>
        </h1>

        <p className="text-white/50 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
          Blindfold finds real places near you, crafts a one-of-a-kind date idea,
          and reveals it only when you&apos;re both ready. No planning, no repeats, just surprises.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-semibold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto text-sm text-white font-semibold border border-pink-500 hover:border-pink-400 hover:bg-pink-500/10 px-6 h-12 flex items-center justify-center rounded-2xl transition-all"
          >
            Already have an account
          </Link>
        </div>
      </section>

      {/* Date card carousel preview */}
      <section className="px-6 pb-20 max-w-lg mx-auto">
        <DateCarousel />
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2">How it works</h2>
        <p className="text-white/40 text-center text-sm mb-12">Three steps to your next adventure</p>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: Heart,
              step: "01",
              title: "Tell us about you two",
              description: "Share your interests, budget, location, and how often you want date nights. Setup takes under two minutes.",
            },
            {
              icon: Lock,
              step: "02",
              title: "AI finds the perfect spot",
              description: "We search real venues near you, pick the best-rated match, and wrap it in a personalised date plan.",
            },
            {
              icon: Sparkles,
              step: "03",
              title: "Reveal & go",
              description: "Hit reveal when the moment feels right. A live countdown builds the anticipation until your next one unlocks.",
            },
          ].map(({ icon: Icon, step, title, description }) => (
            <div key={step} className="bg-white/5 border border-white/8 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-pink-400" />
                </div>
                <span className="text-xs text-white/20 font-mono">{step}</span>
              </div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2">Everything a date night needs</h2>
        <p className="text-white/40 text-center text-sm mb-12">No more &ldquo;I don&apos;t know, what do you want to do?&rdquo;</p>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              emoji: "📍",
              title: "Real venues near you",
              description: "Every date is built around a real, highly-rated place close to your location — not a vague suggestion.",
            },
            {
              emoji: "🤖",
              title: "AI-personalised plans",
              description: "Each idea is generated by AI around your shared interests and budget. No two couples get the same date.",
            },
            {
              emoji: "🔄",
              title: "Fresh ideas on your schedule",
              description: "Set weekly, bi-weekly, or monthly cadence. A new mystery date unlocks automatically with a live countdown.",
            },
            {
              emoji: "💰",
              title: "Budget-aware",
              description: "Set your max spend and every suggestion fits within it. No awkward bill surprises.",
            },
            {
              emoji: "🏆",
              title: "XP, levels & badges",
              description: "Earn experience for every date you complete. Level up together and unlock milestone badges along the way.",
            },
            {
              emoji: "🗺️",
              title: "Navigate in one tap",
              description: "Each revealed date comes with a photo, vibe tags, and a direct navigation link to get you there.",
            },
          ].map(({ emoji, title, description }) => (
            <div key={title} className="bg-white/5 border border-white/8 rounded-3xl p-6 flex gap-4">
              <span className="text-2xl shrink-0">{emoji}</span>
              <div>
                <h3 className="font-bold text-white mb-1">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats ribbon */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: MapPin, value: "50 km", label: "Search radius" },
            { icon: Zap, value: "XP", label: "Every date counts" },
            { icon: Trophy, value: "Badges", label: "Unlock milestones" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 text-center">
              <Icon className="w-5 h-5 text-pink-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-white/30 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/40 mx-auto mb-6">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Your next date is{" "}
            <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
              waiting
            </span>
          </h2>
          <p className="text-white/40 mb-8 leading-relaxed">
            Join couples who&apos;ve ditched the &ldquo;where should we go?&rdquo; debate
            and started showing up to surprises instead.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 text-lg"
          >
            Start for free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/20 text-xs mt-4">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 px-6 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <Heart className="w-3 h-3 text-white fill-white" />
            </div>
            <span className="text-white/30 text-sm font-medium">blindfold</span>
          </div>
          <p className="text-white/20 text-xs">Mystery dates for curious couples</p>
        </div>
      </footer>
    </div>
  );
}
