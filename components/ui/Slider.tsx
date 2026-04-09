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
          <span className="text-sm font-medium text-white/70">{label}</span>
          <span className="text-sm font-bold text-pink-400">
            {formatValue ? formatValue(value) : value}
          </span>
        </div>
      )}
      <div
        ref={trackRef}
        className="relative h-11 flex items-center cursor-pointer select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        {/* Track */}
        <div className="relative w-full h-2 rounded-full bg-white/10">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Thumb */}
        <div
          className="absolute w-6 h-6 rounded-full bg-white shadow-lg shadow-pink-500/40 border-2 border-pink-500 pointer-events-none"
          style={{ left: `calc(${pct}% - 12px)` }}
        />
      </div>
    </div>
  );
}
