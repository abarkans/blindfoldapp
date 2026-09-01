import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getPostsByCategory } from "@/lib/blog";
import { getCategory, type BlogCategoryId } from "@/lib/blog-meta";
import BlogCategoryChips from "@/components/blog/BlogCategoryChips";
import PostCard from "@/components/blog/PostCard";
import BlogPromoBanner from "@/components/blog/BlogPromoBanner";
import PublicPageShell from "@/components/ui/PublicPageShell";
import PublicNav from "@/components/ui/PublicNav";

const SITE_URL = "https://blindfolddate.com";

export function categoryMetadata(id: BlogCategoryId): Metadata {
  const meta = getCategory(id);
  if (!meta) return {};

  const title = `${meta.label} - BlindfoldDate Blog`;
  const url = `${SITE_URL}/blog/${id}`;

  return {
    title,
    description: meta.description,
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: {
      title,
      description: meta.description,
      url,
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: meta.description,
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}

export default function CategoryPageView({ id }: { id: BlogCategoryId }) {
  const meta = getCategory(id);
  if (!meta) notFound();

  const posts = getPostsByCategory(id);

  return (
    <PublicPageShell>
      <PublicNav />

      <div className="max-w-[1100px] mx-auto px-6 md:px-10 pb-16">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-1.5 text-sm">
            <li><Link href="/" className="text-white/40 hover:text-white transition-colors">BlindfoldDate</Link></li>
            <li className="text-white/20"><ChevronRight className="w-3.5 h-3.5" /></li>
            <li><Link href="/blog" className="text-white/40 hover:text-white transition-colors">Blog</Link></li>
            <li className="text-white/20"><ChevronRight className="w-3.5 h-3.5" /></li>
            <li className="text-white/70">{meta.label}</li>
          </ol>
        </nav>

        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{meta.label}</h1>
          <p className="text-white/50 text-base max-w-xl">{meta.description}</p>
        </header>

        <BlogCategoryChips active={id} />

        {posts.length === 0 ? (
          <p className="text-white/40 text-base">No posts in this category yet.</p>
        ) : (
          <div className="flex flex-col gap-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              {posts.slice(0, 2).map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>

            {posts.length > 2 && <BlogPromoBanner />}

            {posts.length > 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                {posts.slice(2).map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-16 pt-6 border-t border-white/10 flex gap-6 text-sm text-white/30">
          <Link href="/legal/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-white/60 transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
