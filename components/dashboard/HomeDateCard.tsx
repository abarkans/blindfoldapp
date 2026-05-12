"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Timer, Wallet, CheckCircle2, AlertCircle, PackageCheck, Target, Check } from "lucide-react";
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

const HOLD_DURATION = 1300;

function HomeSyncButton({ partnerName, partnerCheckedIn, myCheckedIn, onCompleted }: HomeSyncButtonProps) {
  const [state, setState] = useState<HomeCheckinState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  function startHold(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (state === "checking" || state === "waiting" || myCheckedIn) return;
    setIsPressing(true);
    startTimeRef.current = Date.now();
    const tick = () => {
      if (!startTimeRef.current) return;
      const p = Math.min((Date.now() - startTimeRef.current) / HOLD_DURATION, 1);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        startTimeRef.current = null;
        setIsPressing(false);
        setProgress(0);
        triggerSync();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function cancelHold() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    startTimeRef.current = null;
    setIsPressing(false);
    setProgress(0);
  }

  async function triggerSync() {
    setErrorMsg("");
    setState("checking");
    try {
      const result = await homeCheckIn();
      if (result.status === "waiting") { setState("waiting"); return; }
      if (result.status === "completed") { onCompleted(result.result); return; }
      if (result.status === "error") { setErrorMsg(result.error); setState("error"); return; }
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
          <span className="text-sm font-semibold text-amber-300">Waiting for {partnerName}…</span>
        </div>
        <p className="text-center text-[10px] text-white/30">Both partners must hold to mark as done</p>
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

  const holdLabel = isPressing ? (progress > 0.75 ? "Almost there…" : "Keep holding…") : "Hold to mark as done";

  return (
    <div className="flex flex-col gap-2">
      {partnerCheckedIn && state !== "error" && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-300 font-medium">{partnerName} is done — your turn!</p>
        </div>
      )}
      {state === "error" && errorMsg && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{errorMsg}</p>
        </div>
      )}
      <button
        className="relative w-full h-14 rounded-full overflow-hidden select-none cursor-pointer"
        style={{ WebkitUserSelect: "none", touchAction: "none" }}
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="absolute inset-0 rounded-full bg-green-500/15 border border-green-500/30" />
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-md shadow-green-500/30"
          style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0 round 9999px)` }}
        />
        <div className="relative z-10 flex items-center justify-center gap-2 h-full px-4">
          <CheckCircle2 className={`w-4 h-4 transition-colors duration-150 ${progress > 0.5 ? "text-white" : "text-green-400"}`} />
          <span className={`text-sm font-semibold transition-colors duration-150 ${progress > 0.5 ? "text-white" : "text-green-300"}`}>{holdLabel}</span>
        </div>
      </button>
      <p className="text-center text-xs text-white/50">Press and hold to confirm</p>
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
  const [expandedSection, setExpandedSection] = useState<"steps" | "preparation" | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const toggleSection = (section: "steps" | "preparation") => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const toggleItem = (i: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
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
        <div className="bg-white/[0.035] border border-white/16 rounded-2xl hover:border-white/28 transition-colors overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("preparation")}
            className="flex items-center gap-4 w-full px-4 py-3 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0">
              <PackageCheck className="w-4 h-4 text-white/65" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">What you&apos;ll need</p>
            </div>
            <span className="flex items-center justify-center w-5 h-5 text-white/40 text-lg leading-none shrink-0">
              {expandedSection === "preparation" ? "−" : "+"}
            </span>
          </button>
          <motion.div
            initial={false}
            animate={{ height: expandedSection === "preparation" ? "auto" : 0, opacity: expandedSection === "preparation" ? 1 : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-2 pt-3 border-t border-white/[0.07]">
              {idea.preparation_list.map((item, i) => {
                const checked = checkedItems.has(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleItem(i)}
                    className="flex items-start gap-3 text-left w-full"
                  >
                    <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${checked ? "bg-amber-500 border-amber-500" : "border-white/30 bg-white/[0.05]"}`}>
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className={`text-sm leading-relaxed transition-colors ${checked ? "line-through text-white/30" : "text-white/70"}`}>{item}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* The Plan — collapsible */}
      {idea.steps && idea.steps.length > 0 && (
        <div className="bg-white/[0.035] border border-white/16 rounded-2xl hover:border-white/28 transition-colors overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("steps")}
            className="flex items-center gap-4 w-full px-4 py-3 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-white/65" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">The plan</p>
            </div>
            <span className="flex items-center justify-center w-5 h-5 text-white/40 text-lg leading-none shrink-0">
              {expandedSection === "steps" ? "−" : "+"}
            </span>
          </button>
          <motion.div
            initial={false}
            animate={{ height: expandedSection === "steps" ? "auto" : 0, opacity: expandedSection === "steps" ? 1 : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-3 pt-3 border-t border-white/[0.07]">
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
