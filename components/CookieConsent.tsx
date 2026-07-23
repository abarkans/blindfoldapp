"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { getStoredConsent, setStoredConsent, type ConsentChoice } from "@/lib/consent";

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

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getStoredConsent() === null);
  }, []);

  const choose = (choice: ConsentChoice) => {
    setStoredConsent(choice);
    updateGtagConsent(choice === "granted");
    setVisible(false);
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
