import type { Metadata } from "next";
import type React from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPost, formatDate } from "@/lib/blog";
import PublicPageShell from "@/components/ui/PublicPageShell";
import PublicNav from "@/components/ui/PublicNav";
import ShareButtons from "@/components/blog/ShareButtons";
import BlogToc from "@/components/blog/BlogToc";
import { jsonLdSafe } from "@/lib/utils";

const SITE_URL = "https://blindfolddate.com";

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} - BlindfoldDate`,
    description: post.description,
    robots: { index: true, follow: true },
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${SITE_URL}/blog/${slug}`,
      images: [{ url: post.image ? `${SITE_URL}${post.image}` : `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.image ? `${SITE_URL}${post.image}` : `${SITE_URL}/og-image.png`],
    },
  };
}

function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="not-prose my-7">
      <Link
        href={href}
        className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-400 !text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors !no-underline"
      >
        {children}
      </Link>
    </div>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const nonce = (await headers()).get("x-nonce") ?? undefined;
  let headingIndex = 0;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: post.author, url: SITE_URL },
    publisher: { "@type": "Organization", name: "BlindfoldDate", url: SITE_URL },
    url: `${SITE_URL}/blog/${slug}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${slug}` },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${slug}` },
    ],
  };

  return (
    <PublicPageShell>
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdSafe(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdSafe(breadcrumbJsonLd) }}
      />

      <PublicNav />

      <div className="max-w-[1280px] mx-auto px-6 md:px-10 pb-10">
        <div className="lg:flex lg:items-start lg:justify-center lg:gap-16">
          {post.headings.length > 0 && (
            <aside className="hidden lg:block w-[300px] shrink-0 self-start sticky top-28">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">On this page</p>
              <BlogToc headings={post.headings} />

              <div className="relative overflow-hidden text-center border border-white/10 bg-black rounded-2xl p-6">
                <div
                  className="absolute inset-0 opacity-35 blur-2xl"
                  style={{ background: "radial-gradient(circle at 30% 20%, #8b5cf6, transparent 55%), radial-gradient(circle at 75% 75%, #fb7185, transparent 50%), radial-gradient(circle at 20% 85%, #c026d3, transparent 45%)" }}
                />
                <div className="relative">
                  <p className="text-2xl font-bold text-white leading-tight mb-4">
                    Your next date. <span className="text-rose-400">Planned free.</span>
                  </p>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 w-full bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold px-4 py-2.5 rounded-full transition-colors"
                  >
                    Try free
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                  <p className="text-xs text-white/60 mt-3">No card required.</p>
                </div>
              </div>
            </aside>
          )}

        <div className="max-w-[720px] mx-auto lg:mx-0">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-1.5 text-sm flex-wrap">
              <li><Link href="/" className="text-white/40 hover:text-white transition-colors">BlindfoldDate</Link></li>
              <li className="text-white/20"><ChevronRight className="w-3.5 h-3.5" /></li>
              <li><Link href="/blog" className="text-white/40 hover:text-white transition-colors">Blog</Link></li>
              <li className="text-white/20"><ChevronRight className="w-3.5 h-3.5" /></li>
              <li className="text-white/70 truncate max-w-[180px] md:max-w-xs">{post.title}</li>
            </ol>
          </nav>

          <article>
            <header className="mb-10">
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-rose-400/80 bg-rose-400/10 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{post.title}</h1>
              <p className="text-xl text-white/50 leading-relaxed mb-5">{post.description}</p>
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-6 flex-wrap">
                <div className="flex items-center gap-3 text-sm text-white/30">
                  <Image
                    src="/blog/andris.jpg"
                    alt={post.author}
                    width={28}
                    height={28}
                    className="rounded-full object-cover w-7 h-7"
                  />
                  <span>{post.author}</span>
                  <span>·</span>
                  <span>{formatDate(post.date)}</span>
                  <span>·</span>
                  <span>{post.readingTime} min read</span>
                </div>
                <ShareButtons url={`${SITE_URL}/blog/${slug}`} title={post.title} />
              </div>
            </header>

            {post.image && (
              <div className="mb-10 rounded-2xl overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  width={720}
                  height={400}
                  className="w-full object-cover"
                  priority
                />
              </div>
            )}

            <div className="prose prose-invert max-w-none
              [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:scroll-mt-28
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white/80 [&_h3]:mt-7 [&_h3]:mb-3
              [&_p]:text-white/60 [&_p]:text-base [&_p]:leading-[1.8] [&_p]:mb-5
              [&_ul]:text-white/60 [&_ul]:text-base [&_ul]:leading-[1.8] [&_ul]:mb-5 [&_ul]:pl-6 [&_ul]:list-disc
              [&_ol]:text-white/60 [&_ol]:text-base [&_ol]:leading-[1.8] [&_ol]:mb-5 [&_ol]:pl-6 [&_ol]:list-decimal
              [&_li]:mb-2
              [&_a]:text-rose-400 [&_a]:underline [&_a]:hover:text-rose-300
              [&_strong]:text-white/80 [&_strong]:font-semibold
              [&_hr]:border-white/10 [&_hr]:my-10
              [&_blockquote]:border-l-2 [&_blockquote]:border-rose-400/40 [&_blockquote]:pl-5 [&_blockquote]:text-white/40 [&_blockquote]:italic">
              <MDXRemote
                source={post.content}
                components={{
                  CtaButton,
                  h2: (props) => {
                    const id = post.headings[headingIndex]?.slug;
                    headingIndex += 1;
                    return <h2 id={id} {...props} />;
                  },
                  a: ({ href, children, ...props }) => {
                    const isExternal = href?.startsWith("http");
                    return (
                      <a
                        href={href}
                        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              />
            </div>
          </article>

          <div className="mt-14 flex items-start gap-4 border border-white/10 bg-white/[0.02] rounded-2xl p-6">
            <Image
              src="/blog/andris.jpg"
              alt={post.author}
              width={40}
              height={40}
              className="shrink-0 w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-white mb-1">{post.author}</p>
              <p className="text-sm text-white/45">Founder of BlindfoldDate. Writes about dating, relationships, and the small decisions that make evenings memorable.</p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex gap-6 text-sm text-white/30">
            <Link href="/blog" className="hover:text-white/60 transition-colors">All posts</Link>
            <Link href="/legal/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
          </div>
        </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
