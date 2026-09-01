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
          {/* z-20 clears the title link's ::after overlay so the category chip
              stays clickable; both chips carry their own scrim. */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-white bg-rose-500/85 backdrop-blur-sm px-2.5 py-1 rounded-full">
              Featured
            </span>
            <Link
              href={`/blog/${post.category}`}
              className="text-xs text-white bg-black/55 backdrop-blur-sm border border-white/20 px-2.5 py-1 rounded-full hover:bg-black/75 hover:border-white/40 transition-colors"
            >
              {getCategoryLabel(post.category)}
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col justify-center p-8 md:p-10">
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
