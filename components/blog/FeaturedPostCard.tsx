import Link from "next/link";
import Image from "next/image";
import { BlogPostMeta, formatDate } from "@/lib/blog";

export default function FeaturedPostCard({ post }: { post: BlogPostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid md:grid-cols-[3fr_2fr] gap-0 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:bg-white/[0.02] transition-all duration-200"
    >
      {post.image && (
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[360px] overflow-hidden">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            priority
          />
        </div>
      )}

      <div className="flex flex-col justify-center p-8 md:p-10">
        <span className="inline-block text-xs font-medium text-rose-400/80 bg-rose-400/10 px-2.5 py-1 rounded-full mb-4 w-fit">
          Featured
        </span>

        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-snug group-hover:text-white/90 transition-colors">
          {post.title}
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
    </Link>
  );
}
