import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getPostsForPage, getTotalBlogPages } from "@/lib/blog";
import PostCard from "@/components/blog/PostCard";
import Pagination from "@/components/blog/Pagination";
import PublicPageShell from "@/components/ui/PublicPageShell";
import PublicNav from "@/components/ui/PublicNav";

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
    title: `Blog | Page ${page} | BlindfoldDate`,
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

  return (
    <PublicPageShell>
      <PublicNav />

      <div className="max-w-[1100px] mx-auto px-6 md:px-10 pb-16">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-1.5 text-sm">
            <li><Link href="/" className="text-white/40 hover:text-white transition-colors">BlindfoldDate</Link></li>
            <li className="text-white/20"><ChevronRight className="w-3.5 h-3.5" /></li>
            <li><Link href="/blog" className="text-white/40 hover:text-white transition-colors">Ideas</Link></li>
            <li className="text-white/20"><ChevronRight className="w-3.5 h-3.5" /></li>
            <li className="text-white/70">Page {page}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        <Pagination currentPage={page} totalPages={totalPages} />

        <div className="mt-16 pt-6 border-t border-white/10 flex gap-6 text-sm text-white/30">
          <Link href="/legal/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-white/60 transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
