// Single bundled consent choice (analytics + ads together) stored client-side.
// Kept binary — Accept/Reject with equal prominence — rather than granular
// per-category toggles, since PostHog + Google Ads are the only two
// non-essential trackers and both are gated by the same choice.
export type ConsentChoice = "granted" | "denied";

// Stored as JSON { choice, ts, v } so the record carries a timestamp and
// banner version — lightweight Art. 7(1) proof of when consent was given.
// Bump CONSENT_VERSION when the banner text or tracker set changes
// materially; older records are then ignored and the banner re-shows.
const STORAGE_KEY = "bf_consent_v1";
const CONSENT_VERSION = 1;

export const CONSENT_EVENT = "bf-consent-change";
export const CONSENT_OPEN_EVENT = "bf-consent-open";

interface ConsentRecord {
  choice: ConsentChoice;
  ts: string;
  v: number;
}

export function getStoredConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  // Legacy format: bare "granted" / "denied" string.
  if (raw === "granted" || raw === "denied") return raw;
  try {
    const record = JSON.parse(raw) as ConsentRecord;
    if (record.v !== CONSENT_VERSION) return null;
    return record.choice === "granted" || record.choice === "denied" ? record.choice : null;
  } catch {
    return null;
  }
}

export function setStoredConsent(choice: ConsentChoice) {
  const record: ConsentRecord = { choice, ts: new Date().toISOString(), v: CONSENT_VERSION };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}

// Re-opens the banner (listened for in CookieConsent) so consent can be
// withdrawn as easily as it was given (GDPR Art. 7(3)).
export function openConsentBanner() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
