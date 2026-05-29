import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | BlindfoldDate",
  robots: { index: true, follow: true },
};

const TOC = [
  { href: "#who", label: "1. Who is responsible" },
  { href: "#what", label: "2. What we collect" },
  { href: "#how", label: "3. How we use it" },
  { href: "#basis", label: "4. Lawful basis" },
  { href: "#share", label: "5. Who we share with" },
  { href: "#retention", label: "6. How long we keep it" },
  { href: "#rights", label: "7. Your rights" },
  { href: "#cookies", label: "8. Cookies" },
  { href: "#children", label: "9. Children" },
  { href: "#changes", label: "10. Changes" },
  { href: "#contact", label: "11. Contact" },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="!text-white/35 !text-xs !mb-8">Last updated: 29 May 2026</p>

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
        BlindfoldDate (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your personal data.
        This Privacy Policy explains what we collect, how we use it, and your rights under the General Data
        Protection Regulation (GDPR) and other applicable privacy laws.
      </p>

      <hr />

      <h2 id="who">1. Who is responsible for your data</h2>
      <p>
        The data controller is <strong>BlindfoldDate</strong>. You can reach us at{" "}
        <a href="mailto:info@blindfolddate.com">info@blindfolddate.com</a> for any
        privacy-related questions or requests.
      </p>

      <h2 id="what">2. What data we collect</h2>

      <h3>Account data</h3>
      <p>
        Your email address, collected when you register. If you sign up via Google, we receive
        your email address and name from Google.
      </p>

      <h3>Profile data</h3>
      <p>
        Partner names, interests (up to 12 categories), budget preferences, date style preferences
        (outside home or at home), and date cadence. You provide this during onboarding and
        can update it at any time in Settings.
      </p>

      <h3>Location data</h3>
      <p>
        Your approximate location (city coordinates) and preferred search radius. This is only
        collected after you explicitly grant permission or manually enter a city. We store the
        latitude, longitude, and radius so we can suggest nearby venues on future visits.
      </p>

      <h3>Activity data</h3>
      <p>
        Date ideas generated for you, their status (revealed / completed), timestamps, your XP
        total, and any badges earned. The last 50 date ideas are retained to avoid repeating
        suggestions.
      </p>

      <h3>Analytics &amp; session data</h3>
      <p>
        We use PostHog (EU region) to understand how the app is used. This includes page views,
        feature interactions, and session recordings that capture your on-screen activity (clicks,
        scrolls, and navigation). All form inputs are masked. We never record passwords, email
        addresses, or other text you type. Session data is not linked to a persistent cookie; a
        new session ID is created on each visit. You can opt out at any time by contacting us.
      </p>

      <h3>Technical data</h3>
      <p>
        Session cookies (used to keep you signed in), IP address, and browser/device type.
        These are collected automatically by our hosting and authentication providers.
      </p>

      <hr />

      <h2 id="how">3. How we use your data</h2>
      <ul>
        <li>To create your account and authenticate you</li>
        <li>To generate personalised date suggestions based on your interests, budget, and location</li>
        <li>To avoid repeating suggestions you have already seen</li>
        <li>To track your progress and award gamification milestones</li>
        <li>To send transactional emails (email confirmation, password reset)</li>
        <li>To keep the service secure and prevent abuse</li>
        <li>To analyse how features are used and improve the product (PostHog analytics &amp; session recordings)</li>
      </ul>

      <h2 id="basis">4. Lawful basis for processing</h2>
      <ul>
        <li>
          <strong>Contract performance (Art. 6(1)(b)):</strong> Account data and profile data
          are necessary to deliver the service you signed up for.
        </li>
        <li>
          <strong>Consent (Art. 6(1)(a)):</strong> Location data is only collected after you
          explicitly grant permission. You can withdraw this consent at any time by removing
          your location in Settings.
        </li>
        <li>
          <strong>Legitimate interest (Art. 6(1)(f)):</strong> Technical data, error monitoring
          (Sentry), and analytics are processed to maintain the integrity, security, and quality
          of the service. Session recordings are used to identify usability problems and improve
          the product. We conducted a balancing test: recordings mask all inputs, are not linked
          to persistent identifiers, and our interest in improving the service does not override
          your privacy because the data collected is minimal and anonymised. You have the right to
          object at any time — email{" "}
          <a href="mailto:info@blindfolddate.com">info@blindfolddate.com</a> and we will disable
          recordings for your account.
        </li>
      </ul>

      <hr />

      <h2 id="share">5. Who we share your data with</h2>
      <p>
        We do not sell your data. We share data only with the following service providers
        (&quot;sub-processors&quot;) necessary to operate BlindfoldDate:
      </p>

      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Purpose</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase Inc.</td>
            <td>Database hosting &amp; authentication</td>
            <td>US / EU</td>
          </tr>
          <tr>
            <td>Anthropic PBC</td>
            <td>AI-powered date idea generation. We send only your interests, budget range, and location context (city-level). No name, email, or account identifiers are included in prompts.</td>
            <td>US</td>
          </tr>
          <tr>
            <td>Google LLC</td>
            <td>Venue search &amp; photos (Places API)</td>
            <td>US</td>
          </tr>
          <tr>
            <td>Vercel Inc.</td>
            <td>Application hosting &amp; deployment</td>
            <td>US / EU</td>
          </tr>
          <tr>
            <td>PostHog Inc.</td>
            <td>Product analytics &amp; session recordings (EU region)</td>
            <td>EU</td>
          </tr>
          <tr>
            <td>Functional Software, Inc. (Sentry)</td>
            <td>Error monitoring &amp; crash reporting</td>
            <td>US</td>
          </tr>
        </tbody>
      </table>

      <p>
        Transfers to the United States are protected by Standard Contractual Clauses (SCCs)
        as required by GDPR Chapter V.
      </p>

      <hr />

      <h2 id="retention">6. How long we keep your data</h2>
      <ul>
        <li>
          <strong>Account &amp; profile data:</strong> Kept until you delete your account.
        </li>
        <li>
          <strong>Date history:</strong> The last 50 entries are retained to power the service;
          older entries are automatically pruned.
        </li>
        <li>
          <strong>Session cookies:</strong> Expire when you sign out or after 7 days of inactivity.
        </li>
        <li>
          <strong>Backups:</strong> Purged within 30 days of account deletion.
        </li>
      </ul>

      <h2 id="rights">7. Your rights</h2>
      <p>Under GDPR you have the right to:</p>
      <ul>
        <li><strong>Access</strong>: request a copy of the personal data we hold about you</li>
        <li><strong>Rectification</strong>: correct inaccurate data (most data is editable directly in Settings)</li>
        <li><strong>Erasure</strong>: request deletion of your account and all associated data</li>
        <li><strong>Portability</strong>: receive your data in a machine-readable format (JSON)</li>
        <li><strong>Restriction</strong>: ask us to limit how we process your data</li>
        <li><strong>Objection</strong>: object to processing based on legitimate interests</li>
      </ul>
      <p>
        To exercise any of these rights, email us at{" "}
        <a href="mailto:info@blindfolddate.com">info@blindfolddate.com</a>. We will respond within
        30 days. You also have the right to lodge a complaint with the supervisory authority in
        your country. If you are in Latvia, that is the{" "}
        <a href="https://www.dvi.gov.lv" target="_blank" rel="noopener noreferrer">
          Data State Inspectorate (dvi.gov.lv)
        </a>.
      </p>

      <h2 id="cookies">8. Cookies &amp; local storage</h2>
      <p>
        We use strictly necessary session cookies to keep you signed in. For analytics, PostHog
        runs in memory-only mode. No analytics cookies or persistent identifiers are written to
        your browser. A new anonymous session ID is created on each page load. We do not use
        advertising cookies or third-party tracking cookies.
      </p>

      <h2 id="children">9. Children</h2>
      <p>
        BlindfoldDate is intended for adults aged 18 and over. We do not knowingly collect
        personal data from anyone under 18. If you believe a minor has created an account,
        please contact us and we will delete it promptly.
      </p>

      <h2 id="changes">10. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material
        changes by email or by displaying a notice in the app. Continued use of the service
        after changes take effect constitutes acceptance of the revised policy.
      </p>

      <h2 id="contact">11. Contact</h2>
      <p>
        Questions or requests:{" "}
        <a href="mailto:info@blindfolddate.com">info@blindfolddate.com</a>
      </p>
    </>
  );
}
