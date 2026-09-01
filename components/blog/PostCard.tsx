import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { BlogPostMeta, formatDate, getCategoryLabel } from "@/lib/blog-meta";

export default function PostCard({ post }: { post: BlogPostMeta }) {
  return (
    // Stretched-link pattern: the title link's ::after covers the whole card,
    // so the card stays fully clickable while the category link remains a real
    // sibling link. Nesting it inside a card-wide <a> would be invalid HTML.
    <article className="group relative flex flex-col rounded-2xl transition-all duration-200">
      {post.image && (
        <div className="px-5 pt-5">
          <div className="relative w-full aspect-[2/1] overflow-hidden rounded-xl">
            <Image
              src={post.image}
              alt={post.title}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 p-5">
        <div className="flex flex-wrap gap-2 mb-3">
          <Link
            href={`/blog/${post.category}`}
            className="relative z-10 text-xs text-white/60 border border-white/15 px-2.5 py-0.5 rounded-full hover:text-white hover:border-white/35 transition-colors"
          >
            {getCategoryLabel(post.category)}
          </Link>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2 leading-snug">
          <Link
            href={`/blog/${post.slug}`}
            className="after:absolute after:inset-0 group-hover:underline transition-colors"
          >
            {post.title}
          </Link>
        </h2>

        <p className="text-sm text-white/50 leading-relaxed mb-4 line-clamp-2 flex-1">
          {post.description}
        </p>

        <div className="flex items-center justify-between text-sm text-white/30">
          <div className="flex items-center gap-2">
            <span>{formatDate(post.date)}</span>
            <span>·</span>
            <span>{post.readingTime} min read</span>
          </div>
          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity" />
        </div>
      </div>
    </article>
  );
}
