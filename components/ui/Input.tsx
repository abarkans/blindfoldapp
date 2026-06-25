"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const resolvedType = isPassword && showPassword ? "text" : type;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[rgb(var(--fg)/0.7)]">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--fg)/0.4)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={resolvedType}
            className={cn(
              "w-full h-12 rounded-2xl bg-[rgb(var(--fg)/0.1)] border border-[rgb(var(--fg)/0.2)] text-[rgb(var(--fg))] placeholder-[rgb(var(--fg)/0.3)] px-4 text-base",
              "focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all",
              icon && "pl-10",
              isPassword && "pr-11",
              error && "border-red-400 focus:border-red-400 focus:ring-red-400/30",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--fg)/0.35)] hover:text-[rgb(var(--fg)/0.7)] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400 mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
