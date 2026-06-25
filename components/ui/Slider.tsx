"use client";

import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  formatValue?: (value: number) => string;
  className?: string;
  tone?: "rose" | "neutral";
}

export default function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  formatValue,
  className,
  tone = "rose",
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = ((value - min) / (max - min)) * 100;

  const getValueFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return value;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = min + ratio * (max - min);
      const stepped = Math.round(raw / step) * step;
      return Math.max(min, Math.min(max, stepped));
    },
    [min, max, step, value]
  );

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(getValueFromPointer(e.clientX));
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons === 0) return;
    onChange(getValueFromPointer(e.clientX));
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[rgb(var(--fg)/0.7)]">{label}</span>
          <span className={cn("text-sm font-bold", tone === "neutral" ? "text-[rgb(var(--fg)/0.78)]" : "text-pink-400")}>
            {formatValue ? formatValue(value) : value}
          </span>
        </div>
      )}
      <div
        className="relative h-11 flex items-center cursor-pointer select-none touch-none px-3"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        {/* Track — ref here so getValueFromPointer measures the actual track width */}
        <div ref={trackRef} className="relative w-full h-2 rounded-full bg-[rgb(var(--fg)/0.1)] overflow-visible">
          <div
            className={cn(
              "absolute left-0 top-0 h-full rounded-full",
              tone === "neutral" ? "bg-[rgb(var(--fg)/0.75)]" : "bg-gradient-to-r from-pink-500 to-rose-500"
            )}
            style={{ width: `${pct}%` }}
          />
          {/* Thumb — positioned relative to track; px-3 on parent absorbs ±12px overhang */}
          <div
            className={cn(
              "absolute top-1/2 w-6 h-6 -translate-y-1/2 rounded-full bg-white shadow-lg border-2 pointer-events-none",
              tone === "neutral" ? "border-[rgb(var(--fg))] shadow-[rgb(var(--fg)/0.2)]" : "border-pink-500 shadow-pink-500/40"
            )}
            style={{ left: `calc(${pct}% - 12px)` }}
          />
        </div>
      </div>
    </div>
  );
}
