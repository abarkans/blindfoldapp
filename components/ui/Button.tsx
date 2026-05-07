"use client";

import { ButtonHTMLAttributes, forwardRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
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

    const base =
      "inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d14] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

    const variants = {
      primary: "bg-rose-500 text-white hover:bg-rose-400",
      secondary: "bg-transparent text-white border border-rose-500 hover:border-rose-400 hover:bg-rose-500/10 backdrop-blur-sm",
      ghost: "text-white/70 hover:text-white hover:bg-white/10",
      danger: "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-12 px-6 text-base",
      lg: "h-14 px-8 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
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
