"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import {
  getStoredConsent,
  setStoredConsent,
  CONSENT_OPEN_EVENT,
  type ConsentChoice,
} from "@/lib/consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function updateGtagConsent(granted: boolean) {
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    ad_storage: granted ? "granted" : "denied",
    ad_user_data: granted ? "granted" : "denied",
    ad_personalization: granted ? "granted" : "denied",
    analytics_storage: granted ? "granted" : "denied",
  });
}

// Withdrawing after PostHog has already initialized: purge its localStorage
// state and reload so no tracker keeps running in the current page session.
function purgeTrackersAndReload() {
  for (const key of Object.keys(window.localStorage)) {
    if (key.startsWith("ph_")) window.localStorage.removeItem(key);
  }
  window.location.reload();
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getStoredConsent() === null);

    const onOpen = () => setVisible(true);
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, []);

  const choose = (choice: ConsentChoice) => {
    const previous = getStoredConsent();
    setStoredConsent(choice);
    updateGtagConsent(choice === "granted");
    setVisible(false);
    if (previous === "granted" && choice === "denied") purgeTrackersAndReload();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 backdrop-blur-sm px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/70">
          We use cookies for product analytics and ad measurement. Choose whether
          we can store non-essential cookies on your device.{" "}
          <a href="/legal/privacy#cookies" className="underline text-white/90 hover:text-rose-400">
            Learn more
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => choose("denied")}>
            Reject
          </Button>
          <Button variant="primary" size="sm" onClick={() => choose("granted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
