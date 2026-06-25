"use client";

import { X } from "lucide-react";

interface CloseButtonProps {
  onClick: () => void;
  label?: string;
}

export default function CloseButton({ onClick, label = "Close" }: CloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 rounded-full bg-[rgb(var(--fg)/0.05)] flex items-center justify-center hover:bg-[rgb(var(--fg)/0.1)] transition-colors"
      aria-label={label}
    >
      <X className="w-4 h-4 text-[rgb(var(--fg)/0.6)]" />
    </button>
  );
}
