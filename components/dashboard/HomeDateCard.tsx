"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Timer, Wallet, PackageCheck, Target, Check } from "lucide-react";
import { type UnitSystem, formatBudgetRange } from "@/lib/units";

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

interface HomeDateCardProps {
  idea: HomeDateIdea;
  unitSystem?: UnitSystem;
  bothSkipped?: boolean;
}

export default function HomeDateCard({
  idea,
  unitSystem = "metric",
  bothSkipped = false,
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
        <h3 className="text-2xl font-bold text-[rgb(var(--fg))] leading-tight mb-1">{idea.title}</h3>
        {idea.description && (
          <p className="text-sm text-[rgb(var(--fg)/0.6)] leading-relaxed">{idea.description}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[rgb(var(--fg)/0.45)] mt-3">
          {idea.duration && (
            <span className="inline-flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-[rgb(var(--fg)/0.55)]" />
              {idea.duration}
            </span>
          )}
          {idea.budget_range && (
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-[rgb(var(--fg)/0.55)]" />
              {formatBudgetRange(idea.budget_range, unitSystem)}
            </span>
          )}
        </div>
      </div>

      {/* Mission */}
      {!bothSkipped && idea.mission && (
        <div className="rounded-2xl bg-[rgb(var(--fg)/0.045)] border border-[rgb(var(--fg)/0.12)] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--fg)/0.4)] mb-2">Your mission</p>
          <p className="text-sm leading-relaxed text-[rgb(var(--fg)/0.8)]">{idea.mission}</p>
        </div>
      )}

      {/* What You'll Need */}
      {!bothSkipped && idea.preparation_list && idea.preparation_list.length > 0 && (
        <div className="bg-[rgb(var(--fg)/0.035)] border border-[rgb(var(--fg)/0.16)] rounded-2xl hover:border-[rgb(var(--fg)/0.28)] transition-colors overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("preparation")}
            className="flex items-center gap-4 w-full px-4 py-3 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[rgb(var(--fg)/0.07)] flex items-center justify-center shrink-0">
              <PackageCheck className="w-4 h-4 text-[rgb(var(--fg)/0.65)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">What you&apos;ll need</p>
            </div>
            <span className="flex items-center justify-center w-5 h-5 text-[rgb(var(--fg)/0.4)] text-lg leading-none shrink-0">
              {expandedSection === "preparation" ? "−" : "+"}
            </span>
          </button>
          <motion.div
            initial={false}
            animate={{ height: expandedSection === "preparation" ? "auto" : 0, opacity: expandedSection === "preparation" ? 1 : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-2 pt-3 border-t border-[rgb(var(--fg)/0.07)]">
              {idea.preparation_list.map((item, i) => {
                const checked = checkedItems.has(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleItem(i)}
                    className="flex items-start gap-3 text-left w-full"
                  >
                    <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${checked ? "bg-amber-500 border-amber-500" : "border-[rgb(var(--fg)/0.3)] bg-[rgb(var(--fg)/0.05)]"}`}>
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className={`text-sm leading-relaxed transition-colors ${checked ? "line-through text-[rgb(var(--fg)/0.3)]" : "text-[rgb(var(--fg)/0.7)]"}`}>{item}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* The Plan */}
      {!bothSkipped && idea.steps && idea.steps.length > 0 && (
        <div className="bg-[rgb(var(--fg)/0.035)] border border-[rgb(var(--fg)/0.16)] rounded-2xl hover:border-[rgb(var(--fg)/0.28)] transition-colors overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("steps")}
            className="flex items-center gap-4 w-full px-4 py-3 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[rgb(var(--fg)/0.07)] flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-[rgb(var(--fg)/0.65)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">The plan</p>
            </div>
            <span className="flex items-center justify-center w-5 h-5 text-[rgb(var(--fg)/0.4)] text-lg leading-none shrink-0">
              {expandedSection === "steps" ? "−" : "+"}
            </span>
          </button>
          <motion.div
            initial={false}
            animate={{ height: expandedSection === "steps" ? "auto" : 0, opacity: expandedSection === "steps" ? 1 : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-3 pt-3 border-t border-[rgb(var(--fg)/0.07)]">
              {idea.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[rgb(var(--fg)/0.07)] border border-[rgb(var(--fg)/0.12)] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-[rgb(var(--fg)/0.6)]">{i + 1}</span>
                  </span>
                  <p className="text-sm text-[rgb(var(--fg)/0.7)] leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
