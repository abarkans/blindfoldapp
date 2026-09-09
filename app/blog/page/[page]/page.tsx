import { cookies } from "next/headers";
import { LOGGED_IN_HINT_COOKIE } from "@/lib/hooks/useLoggedIn";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getPostsForPage, getTotalBlogPages } from "@/lib/blog";
import PostCard from "@/components/blog/PostCard";
import Pagination from "@/components/blog/Pagination";
import BlogCategoryChips from "@/components/blog/BlogCategoryChips";
import PublicPageShell from "@/components/ui/PublicPageShell";
import PublicNav from "@/components/ui/PublicNav";
import PublicFooter from "@/components/ui/PublicFooter";

const SITE_URL = "https://blindfolddate.com";

export async function generateStaticParams() {
  const totalPages = getTotalBlogPages();
  return Array.from({ length: Math.max(totalPages - 1, 0) }, (_, i) => ({
    page: String(i + 2),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `Blog - Page ${page} - BlindfoldDate`,
    robots: { index: true, follow: true },
    alternates: { canonical: `${SITE_URL}/blog/page/${page}` },
  };
}

export default async function BlogPagedPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: pageParam } = await params;
  const page = Number(pageParam);

  if (!Number.isInteger(page) || page < 1) notFound();
  if (page === 1) redirect("/blog");

  const { posts, totalPages } = getPostsForPage(page);
  if (page > totalPages) notFound();

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
            <li><Link href="/blog" className="text-white/40 hover:text-white hover:underline transition-colors">Blog</Link></li>
            <li className="text-white/20"><ChevronRight className="w-3.5 h-3.5" /></li>
            <li className="text-white/70">Page {page}</li>
          </ol>
        </nav>

        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Blog</h1>
          <p className="text-white/50 text-base max-w-xl">
            Page {page} of {totalPages} — date night ideas, relationship advice, and tips for couples
            who want better evenings together.
          </p>
        </header>

        <BlogCategoryChips active="all" markCurrent={false} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        <Pagination currentPage={page} totalPages={totalPages} />

      </div>
      <PublicFooter />
    </PublicPageShell>
  );
}
