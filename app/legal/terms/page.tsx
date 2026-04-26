import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — BlindfoldDate",
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="!text-white/35 !text-xs !mb-8">Last updated: 26 April 2026</p>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of BlindfoldDate
        (&quot;the service&quot;), operated by <strong>BlindfoldDate</strong>. By creating an account
        you agree to these Terms and our{" "}
        <a href="/legal/privacy">Privacy Policy</a>.
      </p>

      <hr />

      <h2>1. Eligibility</h2>
      <p>
        You must be at least <strong>18 years old</strong> to use BlindfoldDate. By
        registering you confirm that you meet this requirement. We may terminate accounts
        that we have reason to believe belong to minors.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You are responsible for keeping your password secure and confidential.</li>
        <li>You must provide accurate information when registering.</li>
        <li>One account per couple is intended; you may not share your account with others.</li>
        <li>You may delete your account at any time by contacting us.</li>
      </ul>

      <h2>3. The service</h2>
      <p>
        BlindfoldDate generates personalised date suggestions for couples using AI and real venue
        data. We do not guarantee the availability, quality, suitability, or accuracy of any
        suggested venue. Always verify that a venue is open and appropriate before visiting.
      </p>

      <h2>4. AI-generated content</h2>
      <p>
        Date suggestions are created by an AI system (Anthropic Claude) using your preferences
        and publicly available venue data. AI-generated content may occasionally be inaccurate,
        outdated, or unsuitable. Suggestions are for inspiration only — exercise your own
        judgement before acting on them. We are not liable for any outcome arising from
        following an AI-generated suggestion.
      </p>

      <h2>5. Plus subscription</h2>

      <h3>Billing</h3>
      <p>
        The Plus plan is billed monthly (or at the frequency you select during sign-up).
        Payments are processed by Stripe. Your subscription renews automatically unless
        cancelled before the renewal date.
      </p>

      <h3>Cancellation</h3>
      <p>
        You may cancel your subscription at any time from the Settings section of your account.
        Access to Plus features continues until the end of the current billing period; no
        partial refunds are issued for unused time.
      </p>

      <h3>Right of withdrawal (EU)</h3>
      <p>
        If you are an EU consumer, you have the right to withdraw from your subscription within
        14 days of purchase without giving a reason and receive a full refund. However, by
        proceeding to subscribe and immediately using Plus features you expressly request
        that we begin providing the service before the withdrawal period expires, and you
        acknowledge that you lose your right of withdrawal once the service has been
        fully performed, or from the moment you first use a Plus-only feature.
      </p>

      <h3>Price changes</h3>
      <p>
        We will notify you by email at least 30 days before any price change. If you do not
        cancel before the change takes effect, your continued subscription constitutes
        acceptance of the new price.
      </p>

      <h2>6. Acceptable use</h2>
      <p>You must not:</p>
      <ul>
        <li>Use the service if you are under 18</li>
        <li>Share your account credentials with others</li>
        <li>Use the service for any commercial purpose without our written permission</li>
        <li>Attempt to scrape, reverse-engineer, or disrupt the service</li>
        <li>Provide false information when registering or using the service</li>
      </ul>

      <h2>7. Limitation of liability</h2>
      <p>
        BlindfoldDate is provided &quot;as is&quot; without warranties of any kind, express or
        implied. To the fullest extent permitted by law, we are not liable for any indirect,
        incidental, or consequential loss arising from your use of the service, including loss
        arising from following AI-generated date suggestions or visiting a suggested venue.
      </p>
      <p>
        Nothing in these Terms limits or excludes liability that cannot be excluded by law
        (including consumer protection rights in your jurisdiction).
      </p>

      <h2>8. Termination</h2>
      <p>
        We may suspend or terminate your account if you breach these Terms or if we have reason
        to believe your use of the service is harmful. Where possible we will give you notice
        before doing so. You may stop using the service and request account deletion at any time.
      </p>

      <h2>9. Changes to these terms</h2>
      <p>
        We may update these Terms from time to time. We will notify you of material changes by
        email at least 14 days before they take effect. Continued use of the service after the
        effective date constitutes acceptance of the revised Terms.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by the laws of the Republic of Latvia. Any disputes that
        cannot be resolved informally will be referred to the courts of Latvia. If you are
        an EU consumer, you may also use the EU Online Dispute Resolution platform at{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a href="mailto:info@blindfolddate.com">info@blindfolddate.com</a>
      </p>
    </>
  );
}
