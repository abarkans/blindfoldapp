"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

export const CADENCE_OPTIONS = [
  { value: "weekly", label: "Weekly", sublabel: "Every week, a new surprise" },
  { value: "biweekly", label: "Bi-weekly", sublabel: "Every two weeks" },
  { value: "monthly", label: "Monthly", sublabel: "One special date a month" },
] as const;

export type CadenceValue = (typeof CADENCE_OPTIONS)[number]["value"];

interface CadenceSelectProps {
  value: CadenceValue | undefined;
  onChange: (value: CadenceValue) => void;
}

const SWIPE_CLOSE_THRESHOLD = 80; // px dragged down to trigger close

export default function CadenceSelect({ value, onChange }: CadenceSelectProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);
  const selected = CADENCE_OPTIONS.find((o) => o.value === value);

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sheetOpen]);

  function closeSheet() {
    setDragY(0);
    setSheetOpen(false);
  }

  function select(v: CadenceValue) {
    onChange(v);
    closeSheet();
  }

  function onPointerDown(e: React.PointerEvent) {
    dragStartY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    setDragY(Math.max(0, delta)); // only allow downward drag
  }

  function onPointerUp() {
    if (dragY >= SWIPE_CLOSE_THRESHOLD) {
      closeSheet();
    } else {
      setDragY(0);
    }
    dragStartY.current = null;
  }

  return (
    <>
      {/* ── Mobile: dropdown trigger ── */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
        >
          <div className="text-left">
            {selected ? (
              <>
                <p className="text-sm font-semibold text-white">{selected.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{selected.sublabel}</p>
              </>
            ) : (
              <p className="text-sm text-white/35">Select frequency…</p>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-white/40 shrink-0 ml-2" />
        </button>
      </div>

      {/* ── Desktop: pill buttons ── */}
      <div className="hidden md:grid grid-cols-3 gap-2">
        {CADENCE_OPTIONS.map(({ value: v, label, sublabel }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={[
              "flex flex-col items-start gap-0.5 p-4 rounded-2xl border text-left transition-all duration-200",
              value === v
                ? "bg-pink-500/20 border-pink-500"
                : "bg-white/5 border-white/10 hover:border-white/30",
            ].join(" ")}
          >
            <p className={`font-semibold text-sm ${value === v ? "text-white" : "text-white/80"}`}>{label}</p>
            <p className={`text-xs ${value === v ? "text-pink-300/70" : "text-white/35"}`}>{sublabel}</p>
          </button>
        ))}
      </div>

      {/* ── Mobile bottom sheet ── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            {/* Backdrop — fades out as user drags */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 - dragY / 300 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={closeSheet}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: dragY }}
              exit={{ y: "100%" }}
              transition={dragY > 0
                ? { type: "tween", duration: 0 }          // instant follow while dragging
                : { type: "spring", stiffness: 400, damping: 40 }
              }
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#13131f] border-t border-white/10 rounded-t-3xl px-4"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)", touchAction: "none" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-5">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4 px-1">
                How often?
              </p>

              <div className="flex flex-col gap-2">
                {CADENCE_OPTIONS.map(({ value: v, label, sublabel }) => (
                  <button
                    key={v}
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()} // prevent drag hijack on option tap
                    onClick={() => select(v)}
                    className={[
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-150",
                      value === v
                        ? "bg-pink-500/20 border-pink-500"
                        : "bg-white/5 border-white/8 active:bg-white/10",
                    ].join(" ")}
                  >
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-semibold ${value === v ? "text-white" : "text-white/80"}`}>
                        {label}
                      </p>
                      <p className={`text-xs mt-0.5 ${value === v ? "text-pink-300/70" : "text-white/35"}`}>
                        {sublabel}
                      </p>
                    </div>
                    {value === v && <Check className="w-4 h-4 text-pink-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
