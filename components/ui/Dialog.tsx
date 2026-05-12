"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export default function Dialog({ open, onClose, children, className }: DialogProps) {
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-sm px-4">
        <div className={cn("bg-[#030303] border border-white/14 rounded-3xl p-6 shadow-2xl shadow-black/60", className)}>
          {children}
        </div>
      </div>
    </>
  );
}
