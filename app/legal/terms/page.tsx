import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - BlindfoldDate",
  robots: { index: true, follow: true },
};

const TOC = [
  { href: "#eligibility", label: "1. Eligibility" },
  { href: "#account", label: "2. Your account" },
  { href: "#service", label: "3. The service" },
  { href: "#ai-content", label: "4. AI-generated content" },
  { href: "#plus", label: "5. Plus subscription" },
  { href: "#store", label: "6. Store purchases" },
  { href: "#acceptable-use", label: "7. Acceptable use" },
  { href: "#liability", label: "8. Limitation of liability" },
  { href: "#termination", label: "9. Termination" },
  { href: "#changes", label: "10. Changes to terms" },
  { href: "#law", label: "11. Governing law" },
  { href: "#contact", label: "12. Contact" },
];

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="!text-white/35 !text-xs !mb-8">Last updated: 8 September 2026</p>

      <nav className="!mb-8 not-prose">
        <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Contents</p>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
          {TOC.map(({ href, label }) => (
            <li key={href}>
              <a href={href} className="text-xs text-white/50 hover:text-rose-400 transition-colors">{label}</a>
            </li>
          ))}
        </ol>
      </nav>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of BlindfoldDate
        (&quot;the service&quot;), operated by <strong>BlindfoldDate</strong>. By creating an account,
        or by buying a downloadable product from our store, you agree to these Terms and our{" "}
        <a href="/legal/privacy">Privacy Policy</a>.
      </p>

      <hr />

      <h2 id="eligibility">1. Eligibility</h2>
      <p>
        You must be at least <strong>18 years old</strong> to use BlindfoldDate. By
        registering you confirm that you meet this requirement. We may terminate accounts
        that we have reason to believe belong to minors.
      </p>

      <h2 id="account">2. Your account</h2>
      <ul>
        <li>You are responsible for keeping your password secure and confidential.</li>
        <li>You must provide accurate information when registering.</li>
        <li>One account per couple is intended; you may not share your account with others.</li>
        <li>You may delete your account at any time by contacting us.</li>
      </ul>

      <h2 id="service">3. The service</h2>
      <p>
        BlindfoldDate generates personalized date suggestions for couples using AI and real venue
        data. We do not guarantee the availability, quality, suitability, or accuracy of any
        suggested venue. Always verify that a venue is open and appropriate before visiting.
      </p>

      <h2 id="ai-content">4. AI-generated content</h2>
      <p>
        Date suggestions are created by an AI system (Anthropic Claude) using your preferences
        and publicly available venue data. AI-generated content may occasionally be inaccurate,
        outdated, or unsuitable. Suggestions are for inspiration only. Exercise your own
        judgement before acting on them. We are not liable for any outcome arising from
        following an AI-generated suggestion.
      </p>

      <h2 id="plus">5. Plus subscription</h2>

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

      <h2 id="store">6. Store purchases (digital downloads)</h2>

      <h3>What you are buying</h3>
      <p>
        Our store sells digital products delivered as file downloads. Each product page states
        what is included. You do not need an account to buy; the email address you enter at
        checkout is where we send your download link.
      </p>

      <h3>Delivery</h3>
      <p>
        Delivery is immediate. As soon as your payment is confirmed you are taken to a download
        page, and we email you a private link to the same files. That link remains valid so you
        can download again later. If the email does not arrive, you can request it again from the
        downloads page, which invalidates any link we sent you previously.
      </p>

      <h3>Right of withdrawal (EU) — and your waiver of it</h3>
      <p>
        As an EU consumer you normally have 14 days to withdraw from a purchase of digital
        content and receive a refund. Because our products are delivered immediately, you are
        asked at checkout to expressly request immediate delivery and to acknowledge that you
        therefore lose that right of withdrawal once the download becomes available to you. This
        is permitted under Article 16(m) of Directive 2011/83/EU and the corresponding provisions
        of Latvian consumer law.
      </p>
      <p>
        If you would rather keep your withdrawal right, do not complete the purchase — contact us
        instead and we will arrange delivery after the 14-day period.
      </p>

      <h3>Refunds</h3>
      <p>
        Because of the waiver above we do not offer refunds simply because you changed your mind
        after downloading. We will of course refund you if the files are faulty, if they do not
        match what the product page described, or if a technical problem on our side prevented
        you from downloading them and we cannot fix it. Write to{" "}
        <a href="mailto:info@blindfolddate.com">info@blindfolddate.com</a> and we will sort it out.
        Nothing here limits your statutory rights in respect of defective digital content.
      </p>

      <h3>How you may use the files</h3>
      <p>
        Your purchase is a personal, non-exclusive, non-transferable licence for you and your
        partner. You may print the files and use them privately as often as you like. You may not
        resell them, redistribute them, publish them, or share your download link publicly. The
        copyright remains ours.
      </p>

      <h3>Keeping your link private</h3>
      <p>
        Anyone holding your download link can download the files, so treat it like a receipt you
        would not post publicly. If you believe your link has been shared, request a new one from
        the downloads page — this replaces the old link and disables it.
      </p>

      <h3>Pricing and availability</h3>
      <p>
        Prices are shown in euro and include VAT where applicable. We may change prices or
        withdraw a product at any time; the price you paid at checkout is the price that applies
        to your purchase, and withdrawing a product does not affect downloads you have already
        bought.
      </p>

      <h2 id="acceptable-use">7. Acceptable use</h2>
      <p>You must not:</p>
      <ul>
        <li>Use the service if you are under 18</li>
        <li>Share your account credentials with others</li>
        <li>Use the service for any commercial purpose without our written permission</li>
        <li>Attempt to scrape, reverse-engineer, or disrupt the service</li>
        <li>Provide false information when registering or using the service</li>
      </ul>

      <h2 id="liability">8. Limitation of liability</h2>
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

      <h2 id="termination">9. Termination</h2>
      <p>
        We may suspend or terminate your account if you breach these Terms or if we have reason
        to believe your use of the service is harmful. Where possible we will give you notice
        before doing so. You may stop using the service and request account deletion at any time.
      </p>

      <h2 id="changes">10. Changes to these terms</h2>
      <p>
        We may update these Terms from time to time. We will notify you of material changes by
        email at least 14 days before they take effect. Continued use of the service after the
        effective date constitutes acceptance of the revised Terms.
      </p>

      <h2 id="law">11. Governing law</h2>
      <p>
        These Terms are governed by the laws of the Republic of Latvia. Any disputes that
        cannot be resolved informally will be referred to the courts of Latvia. If you are
        an EU consumer, you may also use the EU Online Dispute Resolution platform at{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>.
      </p>

      <h2 id="contact">12. Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a href="mailto:info@blindfolddate.com">info@blindfolddate.com</a>
      </p>
    </>
  );
}
