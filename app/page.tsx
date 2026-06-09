import type { Metadata } from "next";
import { preload } from "react-dom";
import LandingV4Client from "@/components/landing-v4/LandingV4Client";
import AppIntroOverlay from "@/components/app/AppIntroOverlay";
import { getUnitSystem } from "@/lib/get-unit-system";

const SITE_URL = "https://blindfolddate.com";

export const metadata: Metadata = {
  title: "BlindfoldDate - Date Night, Decided. Just Show Up.",
  description:
    "We plan your next date, out at a real venue or a night in, written for you two. No back-and-forth.",
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  authors: [{ name: "BlindfoldDate", url: SITE_URL }],
  creator: "BlindfoldDate",
  publisher: "BlindfoldDate",
  openGraph: {
    title: "BlindfoldDate - Date Night, Decided. Just Show Up.",
    description:
      "We plan your next date, out at a real venue or a night in, written for you two. No back-and-forth.",
    url: SITE_URL,
    siteName: "BlindfoldDate",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "BlindfoldDate - Date night, decided. Just show up.",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlindfoldDate - Date Night, Decided. Just Show Up.",
    description:
      "We plan your next date, out at a real venue or a night in, written for you two. No back-and-forth.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "BlindfoldDate",
      description: "Mystery date planning for couples. One plan, no debate.",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/blog?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
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
      sameAs: ["https://www.instagram.com/blindfold.date"],
      contactPoint: {
        "@type": "ContactPoint",
        email: "info@blindfolddate.com",
        contactType: "customer support",
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: "BlindfoldDate",
      url: SITE_URL,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      description:
        "AI-powered mystery date planning for couples. Set your budget and whether you want to go out or stay in. We find one real nearby venue rated 4.0+ and craft your complete date plan. No lists. No debate.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free plan, one date per month",
      },
      featureList: [
        "Budget-aware venue selection",
        "In-home or out date planning",
        "Location-based venue finder",
        "AI-written personalised date stories",
        "Automatic navigation to venue",
        "Date night routine scheduling",
      ],
    },
  ],
};

export default async function LandingPage() {
  preload("/hero-video-poster.webp", { as: "image", fetchPriority: "high" });
  const unitSystem = await getUnitSystem();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AppIntroOverlay />
      <LandingV4Client unitSystem={unitSystem} />
    </>
  );
}
