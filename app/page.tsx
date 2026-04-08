import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Heart, Sparkles, Lock, Calendar, ArrowRight, Star } from "lucide-react";
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
          className="text-sm text-white/60 hover:text-white border border-white/20 hover:border-white/40 px-4 py-2 rounded-xl transition-all"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 rounded-full px-4 py-1.5 mb-8">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span className="text-xs text-pink-300 font-medium">AI-powered mystery dates</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight mb-6">
          Stop planning.
          <br />
          <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
            Start surprising.
          </span>
        </h1>

        <p className="text-white/50 text-lg max-w-md mx-auto mb-10 leading-relaxed">
          Blindfold plans your next date for you — personalised to your tastes,
          revealed only when you're ready.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-semibold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="text-sm text-white/60 hover:text-white border border-white/20 hover:border-white/40 px-6 py-3 rounded-2xl transition-all"
          >
            Already have an account →
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
              description: "Share your interests, budget, and how often you want to go on dates. Takes 2 minutes.",
            },
            {
              icon: Lock,
              step: "02",
              title: "We plan the perfect date",
              description: "Our AI crafts a unique date idea tailored specifically to your couple's preferences.",
            },
            {
              icon: Sparkles,
              step: "03",
              title: "Reveal when you're ready",
              description: "Hit reveal and discover your next adventure together. A new one unlocks on your schedule.",
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
        <h2 className="text-2xl font-bold text-center mb-2">Built for real couples</h2>
        <p className="text-white/40 text-center text-sm mb-12">No more "I don't know, what do you want to do?"</p>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              emoji: "🎯",
              title: "Truly personalised",
              description: "Every idea is generated by AI based on your specific interests, budget, and preferences — not a generic list.",
            },
            {
              emoji: "🔄",
              title: "Fresh ideas on your schedule",
              description: "Set weekly, bi-weekly, or monthly cadence. A new mystery date unlocks automatically.",
            },
            {
              emoji: "💰",
              title: "Budget-aware",
              description: "Set your max spend and every suggestion will fit within it. No awkward surprises.",
            },
            {
              emoji: "🚗",
              title: "Logistics sorted",
              description: "Tell us if you have a car or prefer walking and we'll plan accordingly.",
            },
          ].map(({ emoji, title, description }) => (
            <div key={title} className="bg-white/5 border border-white/8 rounded-3xl p-6 flex gap-4">
              <span className="text-2xl">{emoji}</span>
              <div>
                <h3 className="font-bold text-white mb-1">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{description}</p>
              </div>
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
            Join couples who've stopped arguing about where to go and started actually going.
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
