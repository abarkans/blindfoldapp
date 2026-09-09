import { cookies } from "next/headers";
import { LOGGED_IN_HINT_COOKIE } from "@/lib/hooks/useLoggedIn";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getPostsForPage } from "@/lib/blog";
import BlogCategoryChips from "@/components/blog/BlogCategoryChips";
import PostCard from "@/components/blog/PostCard";
import FeaturedPostCard from "@/components/blog/FeaturedPostCard";
import BlogPromoBanner from "@/components/blog/BlogPromoBanner";
import Pagination from "@/components/blog/Pagination";
import PublicPageShell from "@/components/ui/PublicPageShell";
import PublicNav from "@/components/ui/PublicNav";
import PublicFooter from "@/components/ui/PublicFooter";

const SITE_URL = "https://blindfolddate.com";

export const metadata: Metadata = {
  title: "Blog - BlindfoldDate",
  description: "Date night ideas, relationship advice, and tips for couples who want better evenings together.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: "Blog - BlindfoldDate",
    description: "Date night ideas, relationship advice, and tips for couples who want better evenings together.",
    url: `${SITE_URL}/blog`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog - BlindfoldDate",
    description: "Date night ideas, relationship advice, and tips for couples who want better evenings together.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default async function BlogPage() {
  const { featured, posts: rest, totalPages } = getPostsForPage(1);

  // Cookie hint only — the nav uses it to draw Dashboard instead of Get started
  // on the first paint. useLoggedIn() confirms against the real session on mount.
  const loggedInHint = (await cookies()).get(LOGGED_IN_HINT_COOKIE)?.value === "1";

  return (
    <PublicPageShell>
      <PublicNav initialLoggedIn={loggedInHint} />

      <div className="max-w-[1100px] mx-auto px-6 md:px-10 pb-16">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-1.5 text-sm">
            <li><Link href="/" className="text-white/40 hover:text-white hover:underline transition-colors">Home</Link></li>
            <li className="text-white/20"><ChevronRight className="w-3.5 h-3.5" /></li>
            <li className="text-white/70">Blog</li>
          </ol>
        </nav>

        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Blog</h1>
          <p className="text-white/50 text-base max-w-xl">
            Date night ideas, relationship advice, and tips for couples who want better evenings together.
          </p>
        </header>

        <BlogCategoryChips active="all" />

        {!featured && rest.length === 0 ? (
          <p className="text-white/40 text-base">No posts yet.</p>
        ) : (
          <div className="flex flex-col gap-20">
            {featured && <FeaturedPostCard post={featured} />}

            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                {rest.slice(0, 2).map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            )}

            {rest.length > 2 && <BlogPromoBanner />}

            {rest.length > 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                {rest.slice(2).map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </div>
        )}

        <Pagination currentPage={1} totalPages={totalPages} />

      </div>
      <PublicFooter />
    </PublicPageShell>
  );
}
