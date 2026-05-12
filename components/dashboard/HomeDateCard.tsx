"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Timer, Wallet, CheckCircle2, AlertCircle, Home } from "lucide-react";
import Button from "@/components/ui/Button";
import { homeCheckIn } from "@/app/actions/home-checkin";
import type { CompleteDateResult } from "@/lib/types";

interface HomeDateIdea {
  title: string;
  description: string;
  mission?: string;
  vibe: string;
  duration: string;
  budget_range: string;
  tags: string[];
  preparation_list?: string[];
  steps?: string[];
  conversation_starters?: string[];
  location_type: "home";
}

type HomeCheckinState = "idle" | "checking" | "waiting" | "error";

interface HomeSyncButtonProps {
  partnerName: string;
  partnerCheckedIn: boolean;
  myCheckedIn: boolean;
  onCompleted: (result: CompleteDateResult) => void;
}

function HomeSyncButton({ partnerName, partnerCheckedIn, myCheckedIn, onCompleted }: HomeSyncButtonProps) {
  const [state, setState] = useState<HomeCheckinState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSync() {
    if (state === "checking" || state === "waiting") return;
    setErrorMsg("");
    setState("checking");
    try {
      const result = await homeCheckIn();
      if (result.status === "waiting") {
        setState("waiting");
        return;
      }
      if (result.status === "completed") {
        onCompleted(result.result);
        return;
      }
      if (result.status === "error") {
        setErrorMsg(result.error);
        setState("error");
        return;
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setState("error");
    }
  }

  if (state === "waiting" || myCheckedIn) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-center gap-2.5 h-14 rounded-full bg-amber-500/15 border border-amber-500/30">
          <motion.div
            className="w-3.5 h-3.5 rounded-full border-2 border-amber-400/40 border-t-amber-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
          <span className="text-sm font-semibold text-amber-300">
            Waiting for {partnerName}…
          </span>
        </div>
        <p className="text-center text-[10px] text-white/30">
          Both partners tap to start the date
        </p>
      </div>
    );
  }

  if (state === "checking") {
    return (
      <div className="flex items-center justify-center gap-2 h-14 rounded-full bg-white/[0.06] border border-white/16">
        <motion.div
          className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white/60"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
        />
        <span className="text-sm font-semibold text-white/60">Syncing…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {partnerCheckedIn && state !== "error" && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-300 font-medium">
            {partnerName} is ready — your turn!
          </p>
        </div>
      )}

      {state === "error" && errorMsg && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{errorMsg}</p>
        </div>
      )}

      <Button onClick={handleSync} size="lg" className="w-full gap-2">
        <Home className="w-5 h-5" />
        We&apos;re Ready!
      </Button>
    </div>
  );
}

interface HomeDateCardProps {
  idea: HomeDateIdea;
  partnerName: string;
  myCheckedIn: boolean;
  partnerCheckedIn: boolean;
  onCompleted: (result: CompleteDateResult) => void;
  onHoldComplete: () => void;
  showComplete: boolean;
}

export default function HomeDateCard({
  idea,
  partnerName,
  myCheckedIn,
  partnerCheckedIn,
  onCompleted,
  onHoldComplete,
  showComplete,
}: HomeDateCardProps) {
  const [expandedSection, setExpandedSection] = useState<"steps" | "starters" | null>(null);

  const toggleSection = (section: "steps" | "starters") => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300">
            <Home className="w-3 h-3" />
            Night In
          </span>
          {idea.vibe && (
            <span className="rounded-full bg-white/[0.07] border border-white/12 px-2.5 py-1 text-xs font-medium text-white/70">
              {idea.vibe}
            </span>
          )}
        </div>

        <h3 className="text-2xl font-bold text-white leading-tight mb-1">{idea.title}</h3>
        {idea.description && (
          <p className="text-sm text-white/60 leading-relaxed">{idea.description}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45 mt-3">
          {idea.duration && (
            <span className="inline-flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-white/55" />
              {idea.duration}
            </span>
          )}
          {idea.budget_range && (
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-white/55" />
              {idea.budget_range}
            </span>
          )}
        </div>
      </div>

      {/* Mission */}
      {idea.mission && (
        <div className="rounded-2xl bg-white/[0.045] border border-white/12 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">Your mission</p>
          <p className="text-sm leading-relaxed text-white/80">{idea.mission}</p>
        </div>
      )}

      {/* What You'll Need */}
      {idea.preparation_list && idea.preparation_list.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-3">What you&apos;ll need</p>
          <ul className="flex flex-col gap-2">
            {idea.preparation_list.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-amber-400">{i + 1}</span>
                </span>
                <span className="text-sm text-white/70 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* How It Goes — collapsible */}
      {idea.steps && idea.steps.length > 0 && (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("steps")}
            className="w-full flex items-center justify-between px-4 py-4 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">How it goes</p>
            <motion.span
              animate={{ rotate: expandedSection === "steps" ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-white/30 text-xs"
            >
              ▾
            </motion.span>
          </button>

          <motion.div
            initial={false}
            animate={{ height: expandedSection === "steps" ? "auto" : 0, opacity: expandedSection === "steps" ? 1 : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-3 pt-2">
              {idea.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/[0.07] border border-white/12 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-white/60">{i + 1}</span>
                  </span>
                  <p className="text-sm text-white/70 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Conversation Starters — collapsible */}
      {idea.conversation_starters && idea.conversation_starters.length > 0 && (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("starters")}
            className="w-full flex items-center justify-between px-4 py-4 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Tonight&apos;s questions</p>
            <motion.span
              animate={{ rotate: expandedSection === "starters" ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-white/30 text-xs"
            >
              ▾
            </motion.span>
          </button>

          <motion.div
            initial={false}
            animate={{ height: expandedSection === "starters" ? "auto" : 0, opacity: expandedSection === "starters" ? 1 : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-3 pt-2">
              {idea.conversation_starters.map((q, i) => (
                <div key={i} className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-3">
                  <p className="text-[10px] font-semibold text-amber-400/80 mb-1 uppercase tracking-wider">Ask:</p>
                  <p className="text-sm text-white/70 leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Tags */}
      {idea.tags && idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {idea.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/[0.05] border border-white/10 px-3 py-1 text-xs font-medium text-white/50">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Sync check-in or complete */}
      {showComplete ? (
        <div className="text-center text-xs text-white/40 py-2">
          Use the hold button below to mark your date complete.
        </div>
      ) : (
        <HomeSyncButton
          partnerName={partnerName}
          partnerCheckedIn={partnerCheckedIn}
          myCheckedIn={myCheckedIn}
          onCompleted={onCompleted}
        />
      )}
    </div>
  );
}
