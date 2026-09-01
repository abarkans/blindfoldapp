import Link from "next/link";
import Image from "next/image";
import { BlogPostMeta, formatDate, getCategoryLabel } from "@/lib/blog-meta";

export default function FeaturedPostCard({ post }: { post: BlogPostMeta }) {
  return (
    // Stretched-link pattern — see PostCard for why the card is not one <a>.
    <article className="group relative grid md:grid-cols-[3fr_2fr] gap-0 rounded-2xl overflow-hidden transition-all duration-200">
      {post.image && (
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[360px] overflow-hidden md:rounded-r-2xl">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            priority
          />
        </div>
      )}

      <div className="flex flex-col justify-center p-8 md:p-10">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-block text-xs font-medium text-rose-400/80 bg-rose-400/10 px-2.5 py-1 rounded-full w-fit">
            Featured
          </span>
          <Link
            href={`/blog/${post.category}`}
            className="relative z-10 text-xs text-white/60 border border-white/15 px-2.5 py-1 rounded-full hover:text-white hover:border-white/35 transition-colors"
          >
            {getCategoryLabel(post.category)}
          </Link>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-snug">
          <Link
            href={`/blog/${post.slug}`}
            className="after:absolute after:inset-0 group-hover:underline transition-colors"
          >
            {post.title}
          </Link>
        </h2>

        <p className="text-base text-white/50 leading-relaxed mb-6 line-clamp-2">
          {post.description}
        </p>

        <div className="flex items-center gap-3 text-sm text-white/30">
          <span>{formatDate(post.date)}</span>
          <span>·</span>
          <span>{post.readingTime} min read</span>
        </div>
      </div>
    </article>
  );
}
