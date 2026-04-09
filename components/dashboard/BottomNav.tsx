"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Trophy, Settings } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Date", icon: Sparkles },
  { href: "/dashboard/progress", label: "Progress", icon: Trophy },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d14]/95 backdrop-blur-xl border-t border-white/8"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="max-w-sm mx-auto flex items-stretch h-16">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 group active:scale-95 transition-transform"
            >
              {/* Sliding top-border indicator */}
              {active && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <Icon
                className={`w-5 h-5 transition-colors duration-200 ${
                  active ? "text-pink-400" : "text-white/30 group-hover:text-white/55"
                }`}
              />
              <span
                className={`text-[10px] font-semibold tracking-wide transition-colors duration-200 ${
                  active ? "text-pink-400" : "text-white/30 group-hover:text-white/55"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
