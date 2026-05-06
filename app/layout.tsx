import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import PostHogProvider from "@/components/PostHogProvider";
import CapacitorAuthHandler from "@/components/CapacitorAuthHandler";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const SITE_URL = "https://blindfolddate.com";

export const metadata: Metadata = {
  title: "BlindfoldDate — Date nights, planned for you",
  description: "Surprise date experiences crafted just for you two. Tell us your preferences once and we handle everything.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "BlindfoldDate — Date nights, planned for you",
    description: "Surprise date experiences crafted just for you two. Tell us your preferences once and we handle everything.",
    url: SITE_URL,
    siteName: "BlindfoldDate",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: "BlindfoldDate" }],
    locale: "en_US",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BlindfoldDate",
  applicationCategory: "LifestyleApplication",
  description: "AI-powered mystery date planning. Tell us your interests once — we find real nearby venues and craft your date story.",
  url: SITE_URL,
  offers: [
    { "@type": "Offer", name: "Starter", price: "0", priceCurrency: "EUR" },
    { "@type": "Offer", name: "Plus", price: "5.99", priceCurrency: "EUR", priceSpecification: { "@type": "UnitPriceSpecification", price: "5.99", priceCurrency: "EUR", unitCode: "MON" } },
  ],
  operatingSystem: "Web",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Per-request nonce set by proxy.ts. Must be applied to every inline
  // <script> tag so they pass the strict CSP in production.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" className={`${plusJakarta.variable} h-full`}>
      <body className="min-h-full bg-[#0d0d14] font-sans antialiased">
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <CapacitorAuthHandler />
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
