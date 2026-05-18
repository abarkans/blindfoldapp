"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

export default function Toggle({ checked, onChange, disabled, "aria-label": ariaLabel, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d14]",
        checked ? "bg-rose-500" : "bg-white/15",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <motion.span
        initial={false}
        animate={{ x: checked ? 24 : 4 }}
        transition={{ type: "tween", duration: 0.15, ease: "easeInOut" }}
        className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}
