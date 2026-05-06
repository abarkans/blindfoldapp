import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accessibility — BlindfoldDate",
  description: "BlindfoldDate accessibility statement.",
};

export default function AccessibilityPage() {
  return (
    <div className="max-w-[720px] mx-auto px-6 py-20 md:py-32 text-white">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Accessibility</h1>
      <p className="text-white/50 text-sm mb-12">Last updated: May 2026</p>

      <div className="space-y-8 text-white/70 leading-[1.75]">
        <p>
          We are committed to making BlindfoldDate accessible to everyone,
          including people with disabilities.
        </p>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Current status</h2>
          <p>
            We are actively working to improve the accessibility of this application.
            This includes ensuring compatibility with screen readers, keyboard navigation,
            sufficient colour contrast, and support for reduced-motion preferences.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">What we are working on</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Full keyboard navigation across all flows</li>
            <li>WCAG 2.1 AA colour contrast compliance</li>
            <li>Screen reader labels and ARIA roles throughout the app</li>
            <li>Reduced-motion support for all animations</li>
            <li>Accessible form validation and error messaging</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Feedback</h2>
          <p>
            If you experience any accessibility barriers or have suggestions,
            please contact us at{" "}
            <a
              href="mailto:info@blindfolddate.com"
              className="text-rose-400 hover:text-rose-300 transition-colors underline underline-offset-2"
            >
              info@blindfolddate.com
            </a>
            . We aim to respond within 5 business days.
          </p>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-white/[0.07]">
        <Link href="/" className="text-sm text-white/40 hover:text-white transition-colors">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
