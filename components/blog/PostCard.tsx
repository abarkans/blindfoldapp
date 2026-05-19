import Link from "next/link";
import Image from "next/image";
import { BlogPostMeta, formatDate } from "@/lib/blog";

export default function PostCard({ post }: { post: BlogPostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:bg-white/[0.02] transition-all duration-200"
    >
      {post.image && (
        <div className="w-full aspect-[16/7] overflow-hidden">
          <Image
            src={post.image}
            alt={post.title}
            width={720}
            height={315}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs text-rose-400/80 bg-rose-400/10 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-white/90 transition-colors leading-snug">
          {post.title}
        </h2>

        <p className="text-base text-white/50 leading-relaxed mb-4 line-clamp-3">
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
