import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getPostsForPage } from "@/lib/blog";
import PostCard from "@/components/blog/PostCard";
import FeaturedPostCard from "@/components/blog/FeaturedPostCard";
import Pagination from "@/components/blog/Pagination";
import PublicPageShell from "@/components/ui/PublicPageShell";
import PublicNav from "@/components/ui/PublicNav";

const SITE_URL = "https://blindfolddate.com";

export const metadata: Metadata = {
  title: "Blog | BlindfoldDate",
  description: "Date night ideas, relationship advice, and tips for couples who want better evenings together.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: "Blog | BlindfoldDate",
    description: "Date night ideas, relationship advice, and tips for couples who want better evenings together.",
    url: `${SITE_URL}/blog`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | BlindfoldDate",
    description: "Date night ideas, relationship advice, and tips for couples who want better evenings together.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function BlogPage() {
  const { featured, posts: rest, totalPages } = getPostsForPage(1);

  return (
    <PublicPageShell>
      <PublicNav />

      <div className="max-w-[1100px] mx-auto px-6 md:px-10 pb-16">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-1.5 text-sm">
            <li><Link href="/" className="text-white/40 hover:text-white transition-colors">BlindfoldDate</Link></li>
            <li className="text-white/20"><ChevronRight className="w-3.5 h-3.5" /></li>
            <li className="text-white/70">Ideas</li>
          </ol>
        </nav>

        {!featured && rest.length === 0 ? (
          <p className="text-white/40 text-base">No posts yet.</p>
        ) : (
          <div className="flex flex-col gap-20">
            {featured && <FeaturedPostCard post={featured} />}

            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                {rest.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </div>
        )}

        <Pagination currentPage={1} totalPages={totalPages} />

        <div className="mt-16 pt-6 border-t border-white/10 flex gap-6 text-sm text-white/30">
          <Link href="/legal/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-white/60 transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
