import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — BlindfoldDate",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="!text-white/35 !text-xs !mb-8">Last updated: 26 April 2026</p>

      <p>
        BlindfoldDate (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your personal data.
        This Privacy Policy explains what we collect, how we use it, and your rights under the General Data
        Protection Regulation (GDPR) and other applicable privacy laws.
      </p>

      <hr />

      <h2>1. Who is responsible for your data</h2>
      <p>
        The data controller is <strong>BlindfoldDate</strong>. You can reach us at{" "}
        <a href="mailto:info@blindfolddate.com">info@blindfolddate.com</a> for any
        privacy-related questions or requests.
      </p>

      <h2>2. What data we collect</h2>

      <h3>Account data</h3>
      <p>
        Your email address, collected when you register. If you sign up via Google, we receive
        your email address and name from Google.
      </p>

      <h3>Profile data</h3>
      <p>
        Partner names, interests (up to 10 categories), budget preferences, transport preferences
        (car access, walking preference), and date cadence. You provide this during onboarding and
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

      <h3>Technical data</h3>
      <p>
        Session cookies (used to keep you signed in), IP address, and browser/device type.
        These are collected automatically by our hosting and authentication providers.
      </p>

      <hr />

      <h2>3. How we use your data</h2>
      <ul>
        <li>To create your account and authenticate you</li>
        <li>To generate personalised date suggestions based on your interests, budget, and location</li>
        <li>To avoid repeating suggestions you have already seen</li>
        <li>To track your progress and award gamification milestones</li>
        <li>To send transactional emails (email confirmation, password reset)</li>
        <li>To keep the service secure and prevent abuse</li>
      </ul>

      <h2>4. Lawful basis for processing</h2>
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
          <strong>Legitimate interest (Art. 6(1)(f)):</strong> Technical and security data is
          processed to maintain the integrity and security of the service.
        </li>
      </ul>

      <hr />

      <h2>5. Who we share your data with</h2>
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
            <td>AI-powered date idea generation</td>
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
        </tbody>
      </table>

      <p>
        Transfers to the United States are protected by Standard Contractual Clauses (SCCs)
        as required by GDPR Chapter V.
      </p>

      <hr />

      <h2>6. How long we keep your data</h2>
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

      <h2>7. Your rights</h2>
      <p>Under GDPR you have the right to:</p>
      <ul>
        <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
        <li><strong>Rectification</strong> — correct inaccurate data (most data is editable directly in Settings)</li>
        <li><strong>Erasure</strong> — request deletion of your account and all associated data</li>
        <li><strong>Portability</strong> — receive your data in a machine-readable format (JSON)</li>
        <li><strong>Restriction</strong> — ask us to limit how we process your data</li>
        <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
      </ul>
      <p>
        To exercise any of these rights, email us at{" "}
        <a href="mailto:info@blindfolddate.com">info@blindfolddate.com</a>. We will respond within
        30 days. You also have the right to lodge a complaint with your local data protection
        authority.
      </p>

      <h2>8. Cookies</h2>
      <p>
        We use only strictly necessary session cookies to keep you signed in. We do not use
        advertising cookies, analytics cookies, or third-party tracking cookies.
      </p>

      <h2>9. Children</h2>
      <p>
        BlindfoldDate is intended for adults aged 18 and over. We do not knowingly collect
        personal data from anyone under 18. If you believe a minor has created an account,
        please contact us and we will delete it promptly.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material
        changes by email or by displaying a notice in the app. Continued use of the service
        after changes take effect constitutes acceptance of the revised policy.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions or requests:{" "}
        <a href="mailto:info@blindfolddate.com">info@blindfolddate.com</a>
      </p>
    </>
  );
}
