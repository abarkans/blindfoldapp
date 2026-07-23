"use client";

import { openConsentBanner } from "@/lib/consent";

export default function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openConsentBanner} className={className}>
      Cookie settings
    </button>
  );
}
