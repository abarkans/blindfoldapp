"use client";

import { ButtonHTMLAttributes, forwardRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center font-semibold rounded-full transition-[color,background-color,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d14] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]";

const variantMap: Record<ButtonVariant, string> = {
  primary: "bg-rose-500 text-white hover:bg-rose-400",
  secondary: "bg-transparent text-white border border-rose-500 hover:border-rose-400 hover:bg-rose-500/10 backdrop-blur-sm",
  ghost: "text-white/70 hover:text-white hover:bg-white/10",
  danger: "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30",
  outline: "bg-white/5 border border-white/10 text-white/60 hover:border-white/20 hover:text-white/80",
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, variantMap[variant], sizeMap[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingDelay?: number;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, loadingDelay = 200, children, disabled, ...props }, ref) => {
    const [showSpinner, setShowSpinner] = useState(false);
    useEffect(() => {
      if (!loading) { setShowSpinner(false); return; }
      const t = setTimeout(() => setShowSpinner(true), loadingDelay);
      return () => clearTimeout(t);
    }, [loading, loadingDelay]);

    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        disabled={disabled || loading}
        {...props}
      >
        {showSpinner ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
