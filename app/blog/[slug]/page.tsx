import type { Metadata } from "next";
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
    title: `${post.title} — BlindfoldDate`,
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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const nonce = (await headers()).get("x-nonce") ?? undefined;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: post.author, url: SITE_URL },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <PublicNav />

      <div className="max-w-[1280px] mx-auto px-6 md:px-10 pb-10">
        <div className="max-w-[720px] mx-auto">
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
              [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-12 [&_h2]:mb-4
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white/80 [&_h3]:mt-7 [&_h3]:mb-3
              [&_p]:text-white/60 [&_p]:text-base [&_p]:leading-[1.8] [&_p]:mb-5
              [&_ul]:text-white/60 [&_ul]:text-base [&_ul]:leading-[1.8] [&_ul]:mb-5 [&_ul]:pl-6 [&_ul]:list-disc
              [&_ol]:text-white/60 [&_ol]:text-base [&_ol]:leading-[1.8] [&_ol]:mb-5 [&_ol]:pl-6 [&_ol]:list-decimal
              [&_li]:mb-2
              [&_a]:text-rose-400 [&_a]:underline [&_a]:hover:text-rose-300
              [&_strong]:text-white/80 [&_strong]:font-semibold
              [&_hr]:border-white/10 [&_hr]:my-10
              [&_blockquote]:border-l-2 [&_blockquote]:border-rose-400/40 [&_blockquote]:pl-5 [&_blockquote]:text-white/40 [&_blockquote]:italic">
              <MDXRemote source={post.content} />
            </div>
          </article>

          <div className="mt-14 border border-white/10 bg-white/[0.02] rounded-2xl p-7">
            <p className="text-base font-semibold text-white mb-1.5">Let us plan your next date.</p>
            <p className="text-base text-white/50 mb-5">Tell us your interests once. We find a real venue nearby and plan everything — you just show up.</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-400 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
            >
              Try BlindfoldDate free
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex gap-6 text-sm text-white/30">
            <Link href="/blog" className="hover:text-white/60 transition-colors">All posts</Link>
            <Link href="/legal/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
