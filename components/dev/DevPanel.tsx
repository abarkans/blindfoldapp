"use client";

import { useState, useCallback } from "react";
import { X } from "lucide-react";
import {
  devResetDate,
  devSetTeaser,
  devSetRevealed,
  devSkipCooldown,
  devSetCountdown1Min,
  devMockMyCheckin,
  devMockPartnerCheckin,
  devMockBothCheckinAndComplete,
  devInstantComplete,
  devSetCompletionCount,
  devResetGamification,
  devTogglePlan,
  devResetRerolls,
} from "@/app/actions/dev";

// ── Scenario Registry ──────────────────────────────────────────────────────────
// To add a new scenario:
//   1. Add a server action to app/actions/dev.ts
//   2. Import it above
//   3. Add one entry to SCENARIOS below

type Category = "Date State" | "Check-in" | "Gamification" | "Plan & Limits";

type Scenario = {
  id: string;
  label: string;
  description: string;
  category: Category;
  dangerous?: boolean;
  fn: () => Promise<{ ok: boolean; message?: string }>;
};

const SCENARIOS: Scenario[] = [
  // ── Date State ─────────────────────────────────────────────────────────────
  {
    id: "reset_date",
    label: "Reset date",
    description: "Clear all date fields → shows Initiate button",
    category: "Date State",
    dangerous: true,
    fn: devResetDate,
  },
  {
    id: "set_teaser",
    label: "Set teaser state",
    description: "Inject stub date + teaser, neither partner ready yet",
    category: "Date State",
    fn: devSetTeaser,
  },
  {
    id: "set_revealed",
    label: "Set revealed state",
    description: "Inject stub date + set accepted → shows full date card",
    category: "Date State",
    fn: devSetRevealed,
  },
  {
    id: "skip_cooldown",
    label: "Skip cooldown",
    description: "Set revealed_at to 8 days ago → countdown expires now",
    category: "Date State",
    fn: devSkipCooldown,
  },
  {
    id: "countdown_1min",
    label: "Countdown → 1 min",
    description: "Watch countdown hit zero + Initiate button unlock",
    category: "Date State",
    fn: devSetCountdown1Min,
  },
  // ── Check-in ───────────────────────────────────────────────────────────────
  {
    id: "mock_my_checkin",
    label: "Mock my check-in",
    description: "Set my check-in timestamp (owner or partner based on role)",
    category: "Check-in",
    fn: devMockMyCheckin,
  },
  {
    id: "mock_partner_checkin",
    label: "Mock partner check-in",
    description: "Set the other side's check-in timestamp",
    category: "Check-in",
    fn: devMockPartnerCheckin,
  },
  {
    id: "mock_both_complete",
    label: "Both check-in + complete",
    description: "Set both timestamps + trigger XP/badge modal",
    category: "Check-in",
    fn: devMockBothCheckinAndComplete,
  },
  // ── Gamification ───────────────────────────────────────────────────────────
  {
    id: "instant_complete",
    label: "Instant complete",
    description: "Skip hold — marks date done + shows XP/badge modal",
    category: "Gamification",
    fn: devInstantComplete,
  },
  {
    id: "xp_milestone_0",
    label: "→ 0 completions",
    description: "Near First Spark badge (need 1)",
    category: "Gamification",
    fn: () => devSetCompletionCount(0),
  },
  {
    id: "xp_milestone_2",
    label: "→ 2 completions",
    description: "Near Triple Threat badge (need 3)",
    category: "Gamification",
    fn: () => devSetCompletionCount(2),
  },
  {
    id: "xp_milestone_4",
    label: "→ 4 completions",
    description: "Near High Five badge (need 5)",
    category: "Gamification",
    fn: () => devSetCompletionCount(4),
  },
  {
    id: "xp_milestone_9",
    label: "→ 9 completions",
    description: "Near Perfect 10 badge (need 10)",
    category: "Gamification",
    fn: () => devSetCompletionCount(9),
  },
  {
    id: "reset_gamification",
    label: "Reset XP + badges",
    description: "Zero XP, count, and delete all earned badges",
    category: "Gamification",
    dangerous: true,
    fn: devResetGamification,
  },
  // ── Plan & Limits ──────────────────────────────────────────────────────────
  {
    id: "toggle_plan",
    label: "Toggle free ↔ subscription",
    description: "Flip plan_type on this profile",
    category: "Plan & Limits",
    fn: devTogglePlan,
  },
  {
    id: "reset_rerolls",
    label: "Reset rerolls",
    description: "Clear current_date_rerolled + total_rerolls_used",
    category: "Plan & Limits",
    fn: devResetRerolls,
  },
];

const CATEGORIES: Category[] = [
  "Date State",
  "Check-in",
  "Gamification",
  "Plan & Limits",
];

type ScenarioState = "idle" | "loading" | "ok" | "error";

export default function DevPanel() {
  const [open, setOpen] = useState(false);
  const [states, setStates] = useState<Record<string, ScenarioState>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  const isEnabled =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEV_PANEL_ENABLED === "true";

  const run = useCallback(async (scenario: Scenario) => {
    setStates((s) => ({ ...s, [scenario.id]: "loading" }));
    setMessages((m) => ({ ...m, [scenario.id]: "" }));
    try {
      const result = await scenario.fn();
      setStates((s) => ({ ...s, [scenario.id]: result.ok ? "ok" : "error" }));
      setMessages((m) => ({ ...m, [scenario.id]: result.message ?? "" }));
    } catch (err) {
      setStates((s) => ({ ...s, [scenario.id]: "error" }));
      setMessages((m) => ({
        ...m,
        [scenario.id]: err instanceof Error ? err.message : "Failed",
      }));
    }
    setTimeout(() => {
      setStates((s) => ({ ...s, [scenario.id]: "idle" }));
    }, 3000);
  }, []);

  if (!isEnabled) return null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[90] bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed bottom-20 right-4 z-[100] w-[320px] max-h-[70vh] flex flex-col rounded-2xl border border-violet-500/30 bg-[#1a1025] shadow-2xl shadow-black/60 transition-all duration-200 ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-violet-400">
              Dev Panel
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>

        {/* Scenarios */}
        <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-4">
          {CATEGORIES.map((cat) => {
            const catScenarios = SCENARIOS.filter((s) => s.category === cat);
            if (!catScenarios.length) return null;
            return (
              <div key={cat}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2 px-1">
                  {cat}
                </p>
                <div className="flex flex-col gap-1">
                  {catScenarios.map((scenario) => {
                    const state = states[scenario.id] ?? "idle";
                    const msg = messages[scenario.id];
                    return (
                      <button
                        key={scenario.id}
                        onClick={() => run(scenario)}
                        disabled={state === "loading"}
                        className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors border ${
                          state === "ok"
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : state === "error"
                            ? "border-red-500/30 bg-red-500/10"
                            : scenario.dangerous
                            ? "border-red-500/15 bg-red-500/5 hover:bg-red-500/10"
                            : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07]"
                        } disabled:opacity-60`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-semibold leading-tight ${
                                state === "ok"
                                  ? "text-emerald-300"
                                  : state === "error"
                                  ? "text-red-300"
                                  : scenario.dangerous
                                  ? "text-red-300"
                                  : "text-white/90"
                              }`}
                            >
                              {scenario.label}
                            </p>
                            <p className="text-[10px] text-white/35 mt-0.5 leading-tight">
                              {msg && (state === "ok" || state === "error")
                                ? msg
                                : scenario.description}
                            </p>
                          </div>
                          <div className="shrink-0 mt-0.5">
                            {state === "loading" ? (
                              <div className="w-3.5 h-3.5 rounded-full border border-white/20 border-t-white/70 animate-spin" />
                            ) : state === "ok" ? (
                              <span className="text-emerald-400 text-xs">✓</span>
                            ) : state === "error" ? (
                              <span className="text-red-400 text-xs">✗</span>
                            ) : (
                              <span className="text-white/20 text-xs">▶</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-4 z-[100] h-7 px-2.5 rounded-full bg-violet-600/90 border border-violet-400/30 text-[10px] font-bold tracking-widest uppercase text-white shadow-lg shadow-violet-900/40 hover:bg-violet-500/90 transition-colors"
        style={{ display: open ? "none" : "flex", alignItems: "center" }}
      >
        DEV
      </button>
    </>
  );
}
