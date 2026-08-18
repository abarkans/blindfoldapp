import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PublicPageShell from "@/components/ui/PublicPageShell";
import PublicNav from "@/components/ui/PublicNav";

const SITE_URL = "https://blindfolddate.com";

export const metadata: Metadata = {
  title: "About - BlindfoldDate",
  description:
    "BlindfoldDate is built by Andris Barkans to fix decision fatigue in relationships — one real, planned date at a time.",
  alternates: { canonical: `${SITE_URL}/about` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "About BlindfoldDate",
    description:
      "BlindfoldDate is built by Andris Barkans to fix decision fatigue in relationships — one real, planned date at a time.",
    url: `${SITE_URL}/about`,
    siteName: "BlindfoldDate",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": `${SITE_URL}/about#page`,
      url: `${SITE_URL}/about`,
      name: "About BlindfoldDate",
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
    {
      "@type": "Person",
      name: "Andris Barkans",
      jobTitle: "Founder",
      url: `${SITE_URL}/about`,
      image: `${SITE_URL}/blog/andris.jpg`,
      worksFor: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "BlindfoldDate",
      url: SITE_URL,
      founder: { "@type": "Person", name: "Andris Barkans" },
    },
  ],
};

export default function AboutPage() {
  return (
    <PublicPageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNav />
      <div className="max-w-2xl mx-auto px-6 pb-24">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">About</h1>

        <div className="flex items-center gap-4 mb-10">
          <Image
            src="/blog/andris.jpg"
            alt="Andris Barkans"
            width={64}
            height={64}
            className="rounded-full object-cover w-16 h-16"
          />
          <div>
            <p className="text-white font-semibold">Andris Barkans</p>
            <p className="text-white/45 text-sm">Founder, BlindfoldDate</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none
          [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-10 [&_h2]:mb-4
          [&_p]:text-white/60 [&_p]:text-base [&_p]:leading-[1.8] [&_p]:mb-5
          [&_a]:text-rose-400 [&_a]:underline [&_a]:hover:text-rose-300
          [&_strong]:text-white/80 [&_strong]:font-semibold">

          <p>
            BlindfoldDate started from a boring loop: &ldquo;what do you want to do tonight?&rdquo; &ldquo;I
            don&rsquo;t know, what do you want to do?&rdquo; Not a fight — just friction, the same five minutes of
            nobody-deciding that quietly drains the evening you&rsquo;d both been looking forward to.
          </p>
          <p>
            I built BlindfoldDate to delete that step. You set a budget and whether you&rsquo;re staying in or
            heading out. We handle the rest — the place, the plan, and a playful mission to go with it — and
            neither of you sees it until it&rsquo;s time to go. You find out together.
          </p>

          <h2>How a date gets picked</h2>
          <p>
            When you&rsquo;ve shared your location, we pull real nearby venues through Google Places, filtered by
            your interests and a minimum 4.0 rating, and an AI builds the plan around that specific place — title,
            description, vibe, and the mission. No location? The same engine invents a date from scratch, checked
            against your history so you never get a repeat. Either way, it&rsquo;s one concrete plan — not a list
            to scroll through.
          </p>

          <h2>Who&rsquo;s behind it</h2>
          <p>
            I&rsquo;m Andris, a solo founder building BlindfoldDate full-time. No agency, no ghostwritten blog —
            the <Link href="/blog">posts on this site</Link> are mine, and if something breaks or feels off,{" "}
            <Link href="/contact">you can tell me directly</Link>.
          </p>
        </div>
      </div>
    </PublicPageShell>
  );
}
