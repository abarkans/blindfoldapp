"use client";

import { useEffect } from "react";
import { getStoredConsent, CONSENT_EVENT } from "@/lib/consent";

// Basic (strictest) Consent Mode implementation: gtag.js is not fetched at
// all until the visitor accepts — no pre-consent pings leave the browser.
// The inline stub in layout.tsx has already queued consent defaults +
// config in dataLayer, so the script picks them up on load.
export default function GoogleAdsLoader({ adsId }: { adsId: string }) {
  useEffect(() => {
    let loaded = false;

    const load = () => {
      if (loaded || getStoredConsent() !== "granted") return;
      loaded = true;
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(adsId)}`;
      document.head.appendChild(script);
    };

    const onConsentChange = (e: Event) => {
      if ((e as CustomEvent<string>).detail === "granted") load();
    };

    window.addEventListener(CONSENT_EVENT, onConsentChange);
    load();
    return () => window.removeEventListener(CONSENT_EVENT, onConsentChange);
  }, [adsId]);

  return null;
}
