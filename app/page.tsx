import type { Metadata } from "next";
import { preload } from "react-dom";
import LandingV4Client from "@/components/landing-v4/LandingV4Client";
import AppIntroOverlay from "@/components/app/AppIntroOverlay";
import { getUnitSystem } from "@/lib/get-unit-system";

const SITE_URL = "https://blindfolddate.com";

export const metadata: Metadata = {
  title: "BlindfoldDate - Mystery Date Night Planner for Couples",
  description:
    "We plan your next date night. A mystery venue or a cozy night in, with a playful challenge built in. Free, no card needed. Stop deciding, start dating.",
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  authors: [{ name: "BlindfoldDate", url: SITE_URL }],
  creator: "BlindfoldDate",
  publisher: "BlindfoldDate",
  openGraph: {
    title: "BlindfoldDate - Mystery Date Night Planner for Couples",
    description:
      "We plan your next date night. A mystery venue or a cozy night in, with a playful challenge built in. Free, no card needed. Stop deciding, start dating.",
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
    title: "BlindfoldDate - Mystery Date Night Planner for Couples",
    description:
      "We plan your next date night. A mystery venue or a cozy night in, with a playful challenge built in. Free, no card needed. Stop deciding, start dating.",
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
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/blog?q={search_term_string}`,
        "query-input": "required name=search_term_string",
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
      author: { "@id": `${SITE_URL}/#organization` },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        description: "Free plan, one date per month",
      },
      featureList: [
        "Budget-aware venue selection",
        "In-home or out date planning",
        "Location-based venue finder",
        "AI-written personalized date stories",
        "Automatic navigation to venue",
        "Date night routine scheduling",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How does BlindfoldDate choose our venue?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You tell us your taste, budget, and whether you're heading out or staying in. We match that to real venues near you and build the whole date night around one. No generic list to scroll, no reviews to second-guess.",
          },
        },
        {
          "@type": "Question",
          name: "What if we don't like the suggestion?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Swap it. Free plans get one swap ever, Plus gets a swap on every date. The point of a mystery date is the surprise, but you're never stuck with something that isn't you.",
          },
        },
        {
          "@type": "Question",
          name: "Does my partner need an account?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "One of you links the other, and both see the same date revealed at the same moment. No coordination, no spoilers, no \"did you book it yet.\"",
          },
        },
        {
          "@type": "Question",
          name: "How often do we get new date ideas?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Free gives you one mystery date a month. Plus lets you set your own frequency, so the date night ideas keep coming as often as you actually go out.",
          },
        },
        {
          "@type": "Question",
          name: "Is my location data safe?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We use your location only to find venues near you and never sell it. You can read exactly what we store in our Privacy Policy.",
          },
        },
        {
          "@type": "Question",
          name: "What's the difference between free and Plus?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Free is one date a month from three categories, nearby venues only. Plus unlocks every category, near-and-far search, double XP, your full photo history, and richer, more creative dates. €0.99 your first month, then €2.99.",
          },
        },
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
