export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.blindfolddate.app";

export function isCapacitor(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as { Capacitor?: unknown }).Capacitor;
}

// Explicit "rate us" entry points must deep-link the store directly — the native
// In-App Review API is quota-throttled and silently no-ops, which makes a button
// feel broken. Only use requestNativeReview() for unobtrusive, automatic prompts.
export async function openStoreListing() {
  if (isCapacitor()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: PLAY_STORE_URL });
  } else {
    window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
  }
}

// Best-effort native review prompt for automatic, in-context moments (e.g. after
// a positive date completion). The OS decides whether to actually show a dialog
// and never reports back — never gate user-visible UI on this resolving.
export async function requestNativeReview() {
  if (!isCapacitor()) return;
  try {
    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
  } catch (err) {
    console.warn("[app-review] native review request failed", err);
  }
}
