"use client";

import { useState, useEffect, useRef, use, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Medal, Settings, CalendarCheck, X, ArrowLeft, MapPin, Target, Camera } from "lucide-react";
import Image from "next/image";
import DateCard from "@/components/dashboard/DateCard";
import XPProgressBar from "@/components/dashboard/XPProgressBar";
import BadgeGrid from "@/components/dashboard/BadgeGrid";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import SubscriberBadgeModal from "@/components/dashboard/SubscriberBadgeModal";
import HistoryTab from "@/components/dashboard/HistoryTab";
import type { Profile } from "@/lib/types";
import type { UnitSystem } from "@/lib/units";
import type { CoupleRole, PartnerInviteStatus } from "@/lib/partner-invites";
import type { CompletedDateWithPhotos } from "@/app/actions/photo";

type Tab = "date" | "progress" | "history" | "settings";
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
  historyPromise: Promise<CompletedDateWithPhotos[]>;
  isDateCompleted: boolean;
  dateIdeaId: string | null;
  myUserId: string;
  profileId: string;
  unitSystem?: UnitSystem;
  memberRole: CoupleRole;
  partnerInviteStatus: PartnerInviteStatus;
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "date", label: "Date", icon: Sparkles },
  { id: "progress", label: "Progress", icon: Medal },
  { id: "history", label: "Memories", icon: Camera },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function DashboardTabs({
  profile,
  earnedBadgesPromise,
  historyPromise,
  isDateCompleted,
  dateIdeaId,
  myUserId,
  profileId,
  unitSystem = "metric",
  memberRole,
  partnerInviteStatus,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("date");
  const [showCancelBanner, setShowCancelBanner] = useState(false);
  const [settingsInitialView, setSettingsInitialView] = useState<SettingsInitialView | undefined>();
  const [showSubscriberBadge, setShowSubscriberBadge] = useState(false);

  const mainRef = useRef<HTMLElement>(null);
  const focusRefreshAtRef = useRef(0);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    function isValidTab(t: string | null): t is Tab {
      return t === "date" || t === "progress" || t === "history" || t === "settings";
    }
    if (searchParams.get("subscriberBadge") === "1") {
      setShowSubscriberBadge(true);
      const tab = searchParams.get("tab");
      setActiveTab(isValidTab(tab) ? tab : "progress");
      window.history.replaceState({}, "", `/dashboard?tab=${tab ?? "progress"}`);
      return;
    }
    if (searchParams.get("checkout") === "cancelled") {
      setShowCancelBanner(true);
      const tab = searchParams.get("tab");
      if (isValidTab(tab)) {
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
    if (isValidTab(tabParam)) {
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
        <div className="w-full md:max-w-2xl md:mx-auto">
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
                  dateIdeaId={dateIdeaId}
                  myUserId={myUserId}
                  profileId={profileId}
                  onGoToProgress={() => switchTab("progress")}
                  memberRole={memberRole}
                  partnerInviteStatus={partnerInviteStatus}
                  unitSystem={unitSystem}
                />
              )}
              {activeTab === "progress" && (
                <Suspense fallback={<ProgressTabSkeleton />}>
                  <ProgressTabContent
                    profile={profile}
                    earnedBadgesPromise={earnedBadgesPromise}
                  />
                </Suspense>
              )}
              {activeTab === "history" && (
                <Suspense fallback={<HistoryTabSkeleton />}>
                  <HistoryTab
                    historyPromise={historyPromise}
                    planType={profile.plan_type ?? "free"}
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

      <SubscriberBadgeModal
        isOpen={showSubscriberBadge}
        onClose={() => setShowSubscriberBadge(false)}
      />

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
  dateIdeaId,
  myUserId,
  profileId,
  onGoToProgress,
  memberRole,
  partnerInviteStatus,
  unitSystem = "metric",
}: {
  profile: Profile;
  isDateCompleted: boolean;
  dateIdeaId: string | null;
  myUserId: string;
  profileId: string;
  onGoToProgress: () => void;
  memberRole: CoupleRole;
  partnerInviteStatus: PartnerInviteStatus;
  unitSystem?: UnitSystem;
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
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white">Your next date</h2>
        <p className="text-white/55 text-sm mt-1">Ready when you are.</p>
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
        dateIdeaId={dateIdeaId}
        myUserId={myUserId}
        profileId={profileId}
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
        checkinOwnerAt={profile.checkin_owner_at ?? null}
        checkinPartnerAt={profile.checkin_partner_at ?? null}
        checkinOwnerSkipped={profile.checkin_owner_skipped ?? false}
        checkinPartnerSkipped={profile.checkin_partner_skipped ?? false}
        dateOutside={profile.constraints.date_outside}
        dateAtHome={profile.constraints.date_at_home}
        unitSystem={unitSystem}
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

function HistoryTabSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-8 w-40 bg-white/[0.075] rounded-full mb-2" />
      <div className="h-4 w-48 bg-white/[0.075] rounded-full mb-5" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-48 bg-white/[0.075] rounded-3xl" />
      ))}
    </div>
  );
}

function StatsGrid({
  datesCompleted,
  totalCheckins,
}: {
  datesCompleted: number;
  totalCheckins: number;
}) {
  const stats = [
    { icon: CalendarCheck, label: "Dates done", value: datesCompleted },
    { icon: MapPin, label: "Check-ins", value: totalCheckins },
  ];

  return (
    <div className="mt-6 mb-8">
      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
        Statistics
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {stats.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="bg-white/[0.035] border border-white/16 rounded-2xl p-3.5 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-white/55" />
            </div>
            <div>
              <p className="text-lg font-bold text-white tabular-nums">{value}</p>
              <p className="text-xs text-white/60">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressTabContent({
  profile,
  earnedBadgesPromise,
}: {
  profile: Profile;
  earnedBadgesPromise: Promise<EarnedBadge[]>;
}) {
  const earnedBadges = use(earnedBadgesPromise);
  const totalXp = profile.total_xp ?? 0;
  const datesCompleted = profile.dates_completed_count ?? 0;
  const totalCheckins = profile.total_checkins ?? 0;
  const dateBadges = badgesFromCompletedCount(
    earnedBadges,
    datesCompleted,
    profile.updated_at ?? profile.created_at
  );
  const subscriberBadge = earnedBadges.find((b) => b.name === "Subscriber");
  const displayBadges = subscriberBadge ? [subscriberBadge, ...dateBadges] : dateBadges;
  const nextMilestone = BADGE_MILESTONES.find((m) => m.threshold > datesCompleted);

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white">Your progress</h2>
        <p className="text-white/55 text-sm mt-1">Every date earns XP and unlocks badges.</p>
      </div>

      <StatsGrid
        datesCompleted={datesCompleted}
        totalCheckins={totalCheckins}
      />

      <XPProgressBar totalXp={totalXp} />

      {nextMilestone && (
        <div className="bg-white/[0.035] border border-white/16 rounded-2xl p-4 mb-2 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-white/65" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {nextMilestone.threshold - datesCompleted} date
              {nextMilestone.threshold - datesCompleted !== 1 ? "s" : ""} until{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">{nextMilestone.name}</span>
            </p>
            <p className="text-xs text-white/55 mt-0.5">
              Complete {nextMilestone.threshold - datesCompleted} more date{nextMilestone.threshold - datesCompleted !== 1 ? "s" : ""} to earn this badge
            </p>
          </div>
        </div>
      )}

      <BadgeGrid earnedBadges={displayBadges} />
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
      <div className="mb-10 overflow-hidden">
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


