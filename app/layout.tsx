import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import PostHogProvider from "@/components/PostHogProvider";
import CapacitorAuthHandler from "@/components/CapacitorAuthHandler";
import CookieConsent from "@/components/CookieConsent";
import GoogleAdsLoader from "@/components/GoogleAdsLoader";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const SITE_URL = "https://blindfolddate.com";

export const metadata: Metadata = {
  title: "BlindfoldDate | Date nights, planned for you",
  description: "Surprise date experiences crafted just for you two. Tell us your preferences once and we handle everything.",
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/apple_icon.png", type: "image/png" },
    ],
    apple: "/apple_icon.png",
  },
  openGraph: {
    title: "BlindfoldDate | Date nights, planned for you",
    description: "Surprise date experiences crafted just for you two. Tell us your preferences once and we handle everything.",
    url: SITE_URL,
    siteName: "BlindfoldDate",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: "BlindfoldDate" }],
    locale: "en_US",
    type: "website",
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "BlindfoldDate",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/logo.png`,
    width: 180,
    height: 44,
  },
  description: "Mystery date night planning for couples. One plan, no debate.",
  sameAs: ["https://www.instagram.com/blindfold.date"],
  contactPoint: {
    "@type": "ContactPoint",
    email: "info@blindfolddate.com",
    contactType: "customer support",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Per-request nonce set by proxy.ts. Must be applied to every inline
  // <script> tag so they pass the strict CSP in production.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  // NODE_ENV (not VERCEL_ENV) so preview deploys also load the tag —
  // that's the only way to verify the CSP beacon domains before they
  // reach production, where a missing domain fails silently.
  const loadGoogleAds = process.env.NODE_ENV === "production" && Boolean(googleAdsId);

  return (
    <html lang="en" className={`${plusJakarta.variable} h-full`}>
      <head>
        <meta name="theme-color" content="#000000" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
      </head>
      <body className="min-h-full bg-black font-sans antialiased">
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {loadGoogleAds && (
          <>
            {/* Stub only — makes no network requests. gtag.js itself is
                fetched by GoogleAdsLoader strictly after consent. */}
            <script
              nonce={nonce}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  window.gtag = gtag;
                  gtag('consent', 'default', {
                    ad_storage: 'denied',
                    ad_user_data: 'denied',
                    ad_personalization: 'denied',
                    analytics_storage: 'denied'
                  });
                  gtag('js', new Date());
                  gtag('config', '${googleAdsId!}');
                `,
              }}
            />
            <GoogleAdsLoader adsId={googleAdsId!} />
          </>
        )}
        <CapacitorAuthHandler />
        <PostHogProvider>{children}</PostHogProvider>
        {process.env.VERCEL_ENV === "production" && <Analytics />}
        {process.env.VERCEL_ENV === "production" && <SpeedInsights />}
        <CookieConsent />
      </body>
    </html>
  );
}
