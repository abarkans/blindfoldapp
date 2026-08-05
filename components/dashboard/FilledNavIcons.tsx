"use client";

import { useId } from "react";

// Lucide icons only expose one fill/stroke to the whole shape — these hand-built
// "filled" variants exist for the sidebar/bottom-nav active state, where Camera's
// lens and Settings' center hole need to stay genuinely open. A circle drawn on
// top with fill="none" only makes the circle itself transparent — it doesn't
// erase the solid path underneath, so it silently no-ops. An SVG mask (white =
// keep, black = punch through) is what actually cuts the hole, regardless of
// whatever's behind the icon.

interface IconProps {
  className?: string;
}

export function SparklesFilled({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none">
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="4" cy="20" r="2" />
    </svg>
  );
}

export function MedalFilled({ className }: IconProps) {
  const maskId = useId();
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <mask id={maskId}>
        <rect width="24" height="24" fill="white" />
        <path d="M12 18v-2h-.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </mask>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
        <path d="M11 12 5.12 2.2" />
        <path d="m13 12 5.88-9.8" />
        <path d="M8 7h8" />
      </g>
      <circle cx="12" cy="17" r="5" fill="currentColor" stroke="none" mask={`url(#${maskId})`} />
    </svg>
  );
}

export function CameraFilled({ className }: IconProps) {
  const maskId = useId();
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <mask id={maskId}>
        <rect width="24" height="24" fill="white" />
        <circle cx="12" cy="13" r="3" fill="black" />
      </mask>
      <path
        d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

export function SettingsFilled({ className }: IconProps) {
  const maskId = useId();
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <mask id={maskId}>
        <rect width="24" height="24" fill="white" />
        <circle cx="12" cy="12" r="3" fill="black" />
      </mask>
      <path
        d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}
