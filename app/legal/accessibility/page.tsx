import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility - BlindfoldDate",
  description: "BlindfoldDate accessibility statement.",
  robots: { index: true, follow: true },
};

export default function AccessibilityPage() {
  return (
    <>
      <h1>Accessibility</h1>
      <p className="!text-white/35 !text-xs !mb-8">Last updated: May 2026</p>

      <div className="space-y-8">
        <p>
          We are committed to making BlindfoldDate accessible to everyone,
          including people with disabilities.
        </p>

        <div>
          <h2>Current status</h2>
          <p>
            We are actively working to improve the accessibility of this application.
            This includes ensuring compatibility with screen readers, keyboard navigation,
            sufficient colour contrast, and support for reduced-motion preferences.
          </p>
        </div>

        <div>
          <h2>What we are working on</h2>
          <ul>
            <li>Full keyboard navigation across all flows</li>
            <li>WCAG 2.1 AA colour contrast compliance</li>
            <li>Screen reader labels and ARIA roles throughout the app</li>
            <li>Reduced-motion support for all animations</li>
            <li>Accessible form validation and error messaging</li>
          </ul>
        </div>

        <div>
          <h2>Feedback</h2>
          <p>
            If you experience any accessibility barriers or have suggestions,
            please contact us at{" "}
            <a href="mailto:info@blindfolddate.com">info@blindfolddate.com</a>.
            We aim to respond within 5 business days.
          </p>
        </div>
      </div>
    </>
  );
}
