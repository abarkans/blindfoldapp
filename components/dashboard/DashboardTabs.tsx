"use client";

import { useState, useEffect, useRef, use, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Medal, Settings, Zap, CalendarCheck, X, ArrowLeft, Lock } from "lucide-react";
import Image from "next/image";
import DateCard from "@/components/dashboard/DateCard";
import XPProgressBar from "@/components/dashboard/XPProgressBar";
import BadgeGrid from "@/components/dashboard/BadgeGrid";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import type { Profile } from "@/lib/types";
import type { UnitSystem } from "@/lib/units";
import type { CoupleRole, PartnerInviteStatus } from "@/lib/partner-invites";

type Tab = "date" | "progress" | "settings";
type SettingsInitialView = "plan";

interface EarnedBadge {
  name: string;
  earned_at: string;
}

const BADGE_MILESTONES = [
  { threshold: 1, name: "First Spark" },
  { threshold: 3, name: "Triple Threat" },
  { threshold: 5, name: "High Five" },
  { threshold: 10, name: "Perfect 10" },
];

function badgesFromCompletedCount(
  earnedBadges: EarnedBadge[],
  datesCompleted: number,
  fallbackEarnedAt: string
) {
  const earnedByName = new Map(earnedBadges.map((badge) => [badge.name, badge.earned_at]));

  return BADGE_MILESTONES
    .filter((milestone) => milestone.threshold <= datesCompleted)
    .map((milestone) => ({
      name: milestone.name,
      earned_at: earnedByName.get(milestone.name) ?? fallbackEarnedAt,
    }));
}

interface DashboardTabsProps {
  profile: Profile;
  earnedBadgesPromise: Promise<EarnedBadge[]>;
  isDateCompleted: boolean;
  unitSystem?: UnitSystem;
  memberRole: CoupleRole;
  partnerInviteStatus: PartnerInviteStatus;
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "date", label: "Date", icon: Sparkles },
  { id: "progress", label: "Progress", icon: Medal },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function DashboardTabs({
  profile,
  earnedBadgesPromise,
  isDateCompleted,
  unitSystem = "metric",
  memberRole,
  partnerInviteStatus,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("date");
  const [showCancelBanner, setShowCancelBanner] = useState(false);
  const [settingsInitialView, setSettingsInitialView] = useState<SettingsInitialView | undefined>();

  const mainRef = useRef<HTMLElement>(null);
  const focusRefreshAtRef = useRef(0);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("checkout") === "cancelled") {
      setShowCancelBanner(true);
      const tab = searchParams.get("tab");
      if (tab === "date" || tab === "progress" || tab === "settings") {
        setActiveTab(tab);
        window.history.replaceState({}, "", `/dashboard?tab=${tab}`);
      } else {
        window.history.replaceState({}, "", "/dashboard");
      }
      return;
    }
    if (searchParams.get("portal") === "return") {
      window.history.replaceState({}, "", "/dashboard?tab=settings");
      setActiveTab("settings");
      setTimeout(() => {
        router.refresh();
      }, 4000);
      return;
    }
    const tabParam = searchParams.get("tab");
    if (tabParam === "date" || tabParam === "progress" || tabParam === "settings") {
      setActiveTab(tabParam);
    }
  }, []);

  useEffect(() => {
    const shouldRefreshOnFocus =
      activeTab === "date" &&
      (
        partnerInviteStatus.state === "pending" ||
        partnerInviteStatus.state === "accepted"
      );
    if (!shouldRefreshOnFocus) return;

    function refreshSharedDateState() {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - focusRefreshAtRef.current < 15_000) return;
      focusRefreshAtRef.current = now;
      router.refresh();
    }

    window.addEventListener("focus", refreshSharedDateState);
    document.addEventListener("visibilitychange", refreshSharedDateState);
    return () => {
      window.removeEventListener("focus", refreshSharedDateState);
      document.removeEventListener("visibilitychange", refreshSharedDateState);
    };
  }, [activeTab, partnerInviteStatus.state, router]);

  function switchTab(tab: Tab) {
    if (tab !== "settings") setSettingsInitialView(undefined);
    setActiveTab(tab);
    window.history.replaceState({}, "", `/dashboard?tab=${tab}`);
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }

  function openPlanSettings() {
    setSettingsInitialView("plan");
    setActiveTab("settings");
    window.history.replaceState({}, "", "/dashboard?tab=settings");
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="min-h-dvh flex flex-col bg-black text-white">
      {/* Sticky header — logo + names on both breakpoints; tab nav injected on desktop */}
      <header className="md:sticky md:top-0 md:z-30 bg-black/72 md:backdrop-blur-2xl md:backdrop-saturate-150 border-b border-white/12 px-4 py-3 md:py-0 md:h-14 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
        <div className="max-w-4xl mx-auto flex items-stretch justify-between gap-4 md:h-full">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0 self-center">
            <Image src="/icon.png" alt="BlindfoldDate" width={48} height={48} loading="eager" priority className="object-contain" />
            <div>
              <p className="text-sm font-bold text-white leading-tight">
                {profile.partner_names.partner1} &amp; {profile.partner_names.partner2}
              </p>
            </div>
          </div>

          {/* Desktop tab navigation — hidden on mobile */}
          <nav className="hidden md:flex self-stretch items-stretch gap-6">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                className={`relative flex items-center text-sm font-medium transition-colors duration-150 ${
                  activeTab === id ? "text-white" : "text-white/55 hover:text-white"
                }`}
              >
                {label}
                {activeTab === id && (
                  <motion.div
                    layoutId="desktop-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-px bg-white/75"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Payment cancelled banner */}
      <AnimatePresence>
        {showCancelBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mx-4 mt-3"
          >
            <div className="max-w-sm md:max-w-2xl mx-auto flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3.5">
              <span className="text-lg leading-none mt-0.5">💳</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Payment didn&apos;t complete.</p>
                <p className="text-xs text-white/50 mt-0.5">No worries — your account is all set! You&apos;re on the Starter plan for now. You can upgrade anytime from Settings.</p>
              </div>
              <button
                onClick={() => setShowCancelBanner(false)}
                className="shrink-0 text-white/55 hover:text-white transition-colors mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Tab content — wider container on desktop */}
      <main ref={mainRef} className="relative flex-1 overflow-y-auto px-4 pt-5 pb-28 md:pb-8">
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
                  memberRole={memberRole}
                  partnerInviteStatus={partnerInviteStatus}
                />
              )}
              {activeTab === "progress" && (
                <Suspense fallback={<ProgressTabSkeleton />}>
                  <ProgressTabContent
                    profile={profile}
                    earnedBadgesPromise={earnedBadgesPromise}
                    onOpenPlanSettings={openPlanSettings}
                  />
                </Suspense>
              )}
              {activeTab === "settings" && (
                <SettingsTabContent
                  profile={profile}
                  unitSystem={unitSystem}
                  memberRole={memberRole}
                  partnerInviteStatus={partnerInviteStatus}
                  initialView={settingsInitialView}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/16"
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
                  className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-white/75"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors duration-150 ${
                  activeTab === id ? "text-[#a6a6a6]" : "text-[#737373] group-hover:text-[#bfbfbf]"
                }`}
              />
              <span
                className={`text-[10px] font-semibold tracking-wide transition-colors duration-150 ${
                  activeTab === id ? "text-[#a6a6a6]" : "text-[#737373] group-hover:text-[#bfbfbf]"
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
  memberRole,
  partnerInviteStatus,
}: {
  profile: Profile;
  isDateCompleted: boolean;
  onGoToProgress: () => void;
  memberRole: CoupleRole;
  partnerInviteStatus: PartnerInviteStatus;
}) {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("blindfold_welcomed")) {
      setShowWelcome(true);
    }
  }, []);

  function dismissWelcome() {
    localStorage.setItem("blindfold_welcomed", "1");
    setShowWelcome(false);
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">Your next date</h2>
        <p className="text-white/55 text-sm mt-1">Tap reveal when you&apos;re both ready.</p>
      </div>

      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="mb-4 bg-gradient-to-br from-white/[0.045] to-white/[0.025] border border-white/16 rounded-3xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white/65" />
                <p className="text-xs font-semibold text-white/65 uppercase tracking-widest">How it works</p>
              </div>
              <button
                onClick={dismissWelcome}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 mb-4">
              {[
                { emoji: "🔓", text: "Reveal your mystery date" },
                { emoji: "💑", text: "Go on the date together" },
                { emoji: "✅", text: "Hold to mark it done" },
                { emoji: "⏳", text: "Your next date unlocks on schedule" },
              ].map(({ emoji, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center leading-none">{emoji}</span>
                  <p className="text-sm text-white/70">{text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={dismissWelcome}
              className="w-full py-2.5 rounded-2xl bg-white/[0.06] border border-white/16 text-sm font-semibold text-white/70 hover:bg-white/[0.09] hover:text-white transition-all active:scale-[0.98]"
            >
              Got it
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <DateCard
        partnerNames={profile.partner_names}
        cadence={profile.cadence}
        revealedAt={profile.revealed_at ?? null}
        dateIdea={profile.date_idea as Parameters<typeof DateCard>[0]["dateIdea"]}
        dateTeaser={profile.date_teaser as Parameters<typeof DateCard>[0]["dateTeaser"]}
        isDateCompleted={isDateCompleted}
        onGoToProgress={onGoToProgress}
        planType={profile.plan_type ?? "free"}
        totalRerollsUsed={profile.total_rerolls_used ?? 0}
        currentDateRerolled={profile.current_date_rerolled ?? false}
        dateAcceptedAt={profile.date_accepted_at ?? null}
        memberRole={memberRole}
        ownerReadyAt={profile.reveal_owner_ready_at ?? null}
        partnerReadyAt={profile.reveal_partner_ready_at ?? null}
        hasAcceptedPartner={partnerInviteStatus.state === "accepted"}
        partnerInviteState={partnerInviteStatus.state}
        partnerInvitedEmail={partnerInviteStatus.invitedEmail}
      />
    </div>
  );
}

// ─── Progress Tab ─────────────────────────────────────────────────────────────

function ProgressTabSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-40 bg-white/[0.075] rounded-full mb-2" />
      <div className="h-4 w-56 bg-white/[0.075] rounded-full mb-5" />
      <div className="h-12 w-full bg-white/[0.075] rounded-2xl mb-4" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white/[0.075] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function ProgressTabContent({
  profile,
  earnedBadgesPromise,
  onOpenPlanSettings,
}: {
  profile: Profile;
  earnedBadgesPromise: Promise<EarnedBadge[]>;
  onOpenPlanSettings: () => void;
}) {
  const earnedBadges = use(earnedBadgesPromise);
  const isFree = (profile.plan_type ?? "free") !== "subscription";

  if (isFree) {
    return (
      <ProgressUpsell
        totalXp={profile.total_xp ?? 0}
        earnedBadges={earnedBadges}
        onOpenPlanSettings={onOpenPlanSettings}
      />
    );
  }

  const totalXp = profile.total_xp ?? 0;
  const datesCompleted = profile.dates_completed_count ?? 0;
  const displayBadges = badgesFromCompletedCount(
    earnedBadges,
    datesCompleted,
    profile.updated_at ?? profile.created_at
  );
  const nextMilestone = BADGE_MILESTONES.find((m) => m.threshold > datesCompleted);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">Your progress</h2>
        <p className="text-white/55 text-sm mt-1">Every date earns XP and unlocks badges.</p>
      </div>

      <XPProgressBar totalXp={totalXp} />

      {/* Next milestone nudge */}
      {nextMilestone && (
        <div className="bg-white/[0.035] border border-white/16 rounded-2xl p-3.5 mb-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center text-base flex-shrink-0">
            🎯
          </div>
          <div>
            <p className="text-xs font-semibold text-white">
              {nextMilestone.threshold - datesCompleted} date
              {nextMilestone.threshold - datesCompleted !== 1 ? "s" : ""} until{" "}
              <span className="text-white/65">{nextMilestone.name}</span>
            </p>
            <p className="text-[10px] text-white/55 mt-0.5">
              Complete {nextMilestone.threshold - datesCompleted} more date{nextMilestone.threshold - datesCompleted !== 1 ? "s" : ""} to earn this badge
            </p>
          </div>
        </div>
      )}

      <BadgeGrid earnedBadges={displayBadges} />
    </div>
  );
}

// ─── Progress Tab — Free Plan Upsell ─────────────────────────────────────────

function ProgressUpsell({
  totalXp,
  earnedBadges,
  onOpenPlanSettings,
}: {
  totalXp: number;
  earnedBadges: EarnedBadge[];
  onOpenPlanSettings: () => void;
}) {
  const hasHistory = totalXp > 0 || earnedBadges.length > 0;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">
          {hasHistory ? "Your progress is paused" : "Track every date. Earn badges."}
        </h2>
        <p className="text-white/55 text-sm mt-1">
          {hasHistory
            ? "Resume earning XP and unlocking badges with Plus."
            : "XP, levels, and badges are part of Plus."}
        </p>
      </div>

      {/* XP preview — real values for users with history, zeroed for new free users */}
      <div className="relative mb-4">
        <div className="pointer-events-none select-none opacity-60 blur-[1px]">
          <XPProgressBar totalXp={totalXp} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/16 flex items-center justify-center">
            <Lock className="w-4 h-4 text-white/80" />
          </div>
        </div>
      </div>

      {/* Badge grid preview — earned badges show through, clipped to a sliver */}
      <div className="relative max-h-44 overflow-hidden">
        <div className="pointer-events-none select-none">
          <BadgeGrid earnedBadges={earnedBadges} />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-black/80 to-black" />
      </div>

      {/* Upgrade CTA — pulled up to overlap badges */}
      <div className="-mt-6 relative z-10 bg-gradient-to-br from-white/[0.06] via-white/[0.04] to-white/[0.025] border border-white/18 rounded-3xl p-5 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-white/65" />
          <p className="text-xs font-semibold text-white uppercase tracking-widest">Plus</p>
        </div>
        <p className="text-base font-bold text-white mb-1">
          {hasHistory ? "Pick up where you left off" : "Unlock XP & badges"}
        </p>
        <p className="text-sm text-white/60 leading-relaxed mb-4">
          {hasHistory
            ? `You've earned ${totalXp} XP${earnedBadges.length > 0 ? ` and ${earnedBadges.length} badge${earnedBadges.length === 1 ? "" : "s"}` : ""}. Resubscribe to keep earning, level up, and unlock unlimited re-rolls.`
            : "Earn 100 XP per date, level up, and collect milestone badges. Plus also includes unlimited re-rolls and a wider reveal radius."}
        </p>

        <button
          type="button"
          onClick={onOpenPlanSettings}
          className="w-full py-3 rounded-full bg-rose-500 text-white font-semibold text-sm hover:bg-rose-400 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          Upgrade to Plus
        </button>
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

const headerSlideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: -dir * 40 }),
};

function SettingsTabContent({
  profile,
  unitSystem,
  memberRole,
  partnerInviteStatus,
  initialView,
}: {
  profile: Profile;
  unitSystem: UnitSystem;
  memberRole: CoupleRole;
  partnerInviteStatus: PartnerInviteStatus;
  initialView?: SettingsInitialView;
}) {
  const [subpageHeader, setSubpageHeader] = useState<{ title: string; onBack: () => void } | null>(null);
  const [headerDir, setHeaderDir] = useState(1);

  function handleHeaderChange(title: string | null, onBack: (() => void) | null, direction = 1) {
    setHeaderDir(direction);
    setSubpageHeader(title && onBack ? { title, onBack } : null);
  }

  return (
    <div>
      <div className="mb-5 overflow-hidden">
        <AnimatePresence mode="wait" custom={headerDir} initial={false}>
          {subpageHeader ? (
            <motion.div
              key={subpageHeader.title}
              custom={headerDir}
              variants={headerSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="flex items-center gap-3"
            >
              <button
                type="button"
                onClick={subpageHeader.onBack}
                className="w-9 h-9 rounded-xl bg-white/[0.035] border border-white/16 flex items-center justify-center hover:border-white/30 transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-white/60" />
              </button>
              <h2 className="text-2xl font-bold text-white">{subpageHeader.title}</h2>
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              custom={headerDir}
              variants={headerSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeInOut" }}
            >
              <h2 className="text-2xl font-bold text-white">Settings</h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <SettingsPanel
        profile={profile}
        onHeaderChange={handleHeaderChange}
        unitSystem={unitSystem}
        memberRole={memberRole}
        partnerInviteStatus={partnerInviteStatus}
        initialView={initialView}
      />
    </div>
  );
}


