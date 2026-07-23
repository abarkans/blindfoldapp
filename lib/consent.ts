// Single bundled consent choice (analytics + ads together) stored client-side.
// Kept binary — Accept/Reject with equal prominence — rather than granular
// per-category toggles, since PostHog + Google Ads are the only two
// non-essential trackers and both are gated by the same choice.
export type ConsentChoice = "granted" | "denied";

const STORAGE_KEY = "bf_consent_v1";
export const CONSENT_EVENT = "bf-consent-change";

export function getStoredConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function setStoredConsent(choice: ConsentChoice) {
  window.localStorage.setItem(STORAGE_KEY, choice);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}
