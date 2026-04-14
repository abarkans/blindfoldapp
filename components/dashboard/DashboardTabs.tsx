"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Medal, Settings, Heart, Zap, CalendarCheck } from "lucide-react";
import DateCard from "@/components/dashboard/DateCard";
import XPProgressBar from "@/components/dashboard/XPProgressBar";
import BadgeGrid from "@/components/dashboard/BadgeGrid";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import type { Profile } from "@/lib/types";
import { xpProgress } from "@/lib/utils";

type Tab = "date" | "progress" | "settings";

interface EarnedBadge {
  name: string;
  earned_at: string;
}

interface DashboardTabsProps {
  profile: Profile;
  earnedBadges: EarnedBadge[];
  isDateCompleted: boolean;
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "date", label: "Date", icon: Sparkles },
  { id: "progress", label: "Progress", icon: Medal },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function DashboardTabs({
  profile,
  earnedBadges,
  isDateCompleted,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("date");
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("dashboard-tab");
    // Never restore "settings" — users should always land on Date after login
    if (stored === "date" || stored === "progress") {
      setActiveTab(stored);
    }
  }, []);

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    // Don't persist settings — it's not needed (no server reloads happen there)
    if (tab !== "settings") {
      localStorage.setItem("dashboard-tab", tab);
    }
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Sticky header — logo + names on both breakpoints; tab nav injected on desktop */}
      <header className="sticky top-0 z-30 bg-[#08080f]/90 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center shadow-md shadow-rose-500/40">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">BlindfoldDate</p>
              <p className="text-sm font-bold text-white leading-tight">
                {profile.partner_names.partner1} &amp; {profile.partner_names.partner2}
              </p>
            </div>
          </div>

          {/* Desktop tab navigation — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                className={`relative pb-0.5 text-sm font-medium transition-colors duration-150 ${
                  activeTab === id ? "text-white" : "text-white/35 hover:text-white/65"
                }`}
              >
                {label}
                {activeTab === id && (
                  <motion.div
                    layoutId="desktop-tab-underline"
                    className="absolute -bottom-[13px] left-0 right-0 h-px bg-gradient-to-r from-rose-500 to-violet-600"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Tab content — wider container on desktop */}
      <main ref={mainRef} className="flex-1 overflow-y-auto px-4 pt-5 pb-28 md:pb-8">
        <div className="max-w-sm md:max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {activeTab === "date" && (
                <DateTabContent
                  profile={profile}
                  isDateCompleted={isDateCompleted}
                  onGoToProgress={() => switchTab("progress")}
                />
              )}
              {activeTab === "progress" && (
                <ProgressTabContent profile={profile} earnedBadges={earnedBadges} />
              )}
              {activeTab === "settings" && (
                <SettingsTabContent profile={profile} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08080f]/95 backdrop-blur-xl border-t border-white/8"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="max-w-sm mx-auto flex items-stretch h-16">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 group active:scale-95 transition-transform"
            >
              {activeTab === id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-gradient-to-r from-rose-500 to-violet-600"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors duration-150 ${
                  activeTab === id ? "text-rose-400" : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              <span
                className={`text-[10px] font-semibold tracking-wide transition-colors duration-150 ${
                  activeTab === id ? "text-rose-400" : "text-slate-400 group-hover:text-slate-200"
                }`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ─── Date Tab ────────────────────────────────────────────────────────────────

function DateTabContent({
  profile,
  isDateCompleted,
  onGoToProgress,
}: {
  profile: Profile;
  isDateCompleted: boolean;
  onGoToProgress: () => void;
}) {
  const cadenceLabel: Record<string, string> = {
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">Your next adventure</h2>
        <p className="text-white/40 text-sm mt-1">A mystery date is waiting for you two.</p>
      </div>

      <DateCard
        partnerNames={profile.partner_names}
        cadence={profile.cadence}
        revealedAt={profile.revealed_at ?? null}
        dateIdea={profile.date_idea as Parameters<typeof DateCard>[0]["dateIdea"]}
        isDateCompleted={isDateCompleted}
        onGoToProgress={onGoToProgress}
      />
    </div>
  );
}

// ─── Progress Tab ─────────────────────────────────────────────────────────────

function ProgressTabContent({
  profile,
  earnedBadges,
}: {
  profile: Profile;
  earnedBadges: EarnedBadge[];
}) {
  const totalXp = profile.total_xp ?? 0;
  const datesCompleted = profile.dates_completed_count ?? 0;
  const { level } = xpProgress(totalXp);

  const NEXT_MILESTONES = [
    { threshold: 1, name: "First Spark" },
    { threshold: 3, name: "Triple Threat" },
    { threshold: 5, name: "High Five" },
    { threshold: 10, name: "Perfect 10" },
  ];
  const nextMilestone = NEXT_MILESTONES.find((m) => m.threshold > datesCompleted);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">Your progress</h2>
        <p className="text-white/40 text-sm mt-1">Every date counts.</p>
      </div>

      <XPProgressBar totalXp={totalXp} />

      {/* Next milestone nudge */}
      {nextMilestone && (
        <div className="bg-white/4 border border-white/8 rounded-2xl p-3.5 mb-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center text-base flex-shrink-0">
            🎯
          </div>
          <div>
            <p className="text-xs font-semibold text-white">
              {nextMilestone.threshold - datesCompleted} date
              {nextMilestone.threshold - datesCompleted !== 1 ? "s" : ""} until{" "}
              <span className="text-rose-400">{nextMilestone.name}</span>
            </p>
            <p className="text-[10px] text-white/35 mt-0.5">Keep going — you&apos;re on a roll!</p>
          </div>
        </div>
      )}

      <BadgeGrid earnedBadges={earnedBadges} />
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTabContent({ profile }: { profile: Profile }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-white/40 text-sm mt-1">Update your preferences.</p>
      </div>
      <SettingsPanel profile={profile} />
    </div>
  );
}
