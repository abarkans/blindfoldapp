import { cookies } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import PublicPageShell from "@/components/ui/PublicPageShell";
import PublicNav from "@/components/ui/PublicNav";
import PublicFooter from "@/components/ui/PublicFooter";
import DateGenerator from "@/components/date-generator/DateGenerator";
import Accordion from "@/components/date-generator/Accordion";
import { LOGGED_IN_HINT_COOKIE } from "@/lib/hooks/useLoggedIn";
import { jsonLdSafe } from "@/lib/utils";
import { DATE_IDEAS, getIdeaBySlug, type DateIdea } from "@/lib/date-generator/ideas";

const SITE_URL = "https://blindfolddate.com";
const PAGE_URL = `${SITE_URL}/random-date-generator`;
const DEFAULT_IDEA_SLUG = "sunset-rooftop-drinks";

const TITLE = "Random Date Idea Generator for Couples - BlindfoldDate";
const DESCRIPTION =
  "Stuck on what to do tonight? Spin the random date generator for a date idea with a playful mission. Filter by going out or staying in, and by budget.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // ?idea= variants all canonicalize here, so 36 shareable links never
  // compete with each other in search.
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Random Date Idea Generator",
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "BlindfoldDate",
    type: "website",
  },
};

const FAQ = [
  {
    q: "How does the random date generator work?",
    a: "Each spin picks a date idea from a hand-picked list, without repeating one until you've seen them all. Every idea comes with a small mission to make the date more playful. You can narrow it down to going out or staying in, and to free, cheap or splurge budgets.",
  },
  {
    q: "Is the random date generator free?",
    a: "Yes. There's no sign-up and no limit on spins.",
  },
  {
    q: "How is this different from BlindfoldDate itself?",
    a: "The generator gives you a general idea. BlindfoldDate plans a real date: it picks an actual venue near you that fits your interests and budget, and keeps it a mystery until it's time to go.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${PAGE_URL}#app`,
      name: "Random Date Idea Generator",
      url: PAGE_URL,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      isPartOf: { "@id": `${SITE_URL}/#website` },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${PAGE_URL}#faq`,
      mainEntity: FAQ.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

function IdeaGrid({ ideas }: { ideas: DateIdea[] }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      {ideas.map((idea) => (
        <li key={idea.slug}>
          <Link href={`/random-date-generator?idea=${idea.slug}`} className="group block">
            <span className="block font-semibold text-white/80 group-hover:text-white">{idea.title}</span>
            <span className="block text-sm text-white/40 group-hover:text-white/60">{idea.vibe}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function RandomDateGeneratorPage({
  searchParams,
}: {
  searchParams: Promise<{ idea?: string }>;
}) {
  const { idea: ideaParam } = await searchParams;
  const initialIdea = getIdeaBySlug(ideaParam) ?? getIdeaBySlug(DEFAULT_IDEA_SLUG) ?? DATE_IDEAS[0];
  const loggedInHint = (await cookies()).get(LOGGED_IN_HINT_COOKIE)?.value === "1";

  const outIdeas = DATE_IDEAS.filter((i) => i.setting === "out");
  const inIdeas = DATE_IDEAS.filter((i) => i.setting === "in");

  return (
    <PublicPageShell decorate>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSafe(jsonLd) }} />
      <PublicNav initialLoggedIn={loggedInHint} />

      <main className="px-6 md:px-10">
        {/* Hero + generator */}
        <section className="max-w-[800px] mx-auto pt-4 md:pt-10 pb-16 md:pb-24 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-rose-300 mb-3">Free tool</p>
          <h1 className="text-[36px] sm:text-[48px] md:text-[56px] font-black leading-[1.1] tracking-tight">
            Random Date Idea{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #fb7185 0%, #c026d3 45%, #8b5cf6 100%)" }}
            >
              Generator
            </span>
          </h1>
          <p className="mt-4 mb-10 text-white/60 text-lg md:text-xl leading-relaxed max-w-xl mx-auto">
            Can&rsquo;t decide what to do tonight? One spin, one date idea, and a mission to make it fun.
          </p>

          <DateGenerator initialIdea={initialIdea} />
        </section>

        {/* Full idea list: collapsed, but server-rendered so it stays indexable */}
        <section className="max-w-[800px] mx-auto pb-16 md:pb-24">
          <h2 className="text-[32px] md:text-[40px] font-black leading-tight mb-3 md:text-center">
            Browse all {DATE_IDEAS.length} date ideas
          </h2>
          <p className="text-white/50 text-base md:text-lg mb-8 md:mb-10 md:text-center">
            Prefer to pick yourself? Here&rsquo;s everything the generator can choose from.
          </p>
          <Accordion
            idPrefix="ideas"
            items={[
              { id: "out", title: `Going out (${outIdeas.length} ideas)`, content: <IdeaGrid ideas={outIdeas} /> },
              { id: "in", title: `Staying in (${inIdeas.length} ideas)`, content: <IdeaGrid ideas={inIdeas} /> },
            ]}
          />
        </section>

        {/* FAQ */}
        <section className="max-w-[800px] mx-auto pb-20 md:pb-28">
          <h2 className="text-[32px] md:text-[40px] font-black leading-tight mb-8 md:mb-10 md:text-center">
            Frequently asked questions
          </h2>
          <Accordion
            idPrefix="faq"
            items={FAQ.map(({ q, a }, i) => ({
              id: String(i),
              title: q,
              content: <p className="text-white/50 text-base md:text-xl leading-[1.75]">{a}</p>,
            }))}
          />
        </section>
      </main>

      <PublicFooter />
    </PublicPageShell>
  );
}
