import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getCategoryLabel, type BlogPostMeta } from "@/lib/blog-meta";

export default function RelatedPosts({ posts }: { posts: BlogPostMeta[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-14 pt-10 border-t border-white/10">
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-5">Read next</h2>

      <ul className="flex flex-col gap-2">
        {posts.map((post) => (
          <li key={post.slug}>
            {/* Compact rows rather than the 2-up card grid: three cards in a
                720px column would leave an orphan in the third slot. */}
            <Link
              href={`/blog/${post.slug}`}
              className="group flex items-center gap-4 rounded-2xl p-3 -mx-3 hover:bg-white/[0.04] transition-colors"
            >
              {post.image && (
                <div className="relative shrink-0 w-24 h-16 overflow-hidden rounded-xl">
                  <Image
                    src={post.image}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-white leading-snug mb-1 group-hover:underline">
                  {post.title}
                </p>
                <p className="text-sm text-white/30">
                  {getCategoryLabel(post.category)} · {post.readingTime} min read
                </p>
              </div>

              <ArrowUpRight className="shrink-0 w-4 h-4 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
