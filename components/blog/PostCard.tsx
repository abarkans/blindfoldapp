import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { BlogPostMeta, formatDate } from "@/lib/blog";

export default function PostCard({ post }: { post: BlogPostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl transition-all duration-200"
    >
      {post.image && (
        <div className="px-5 pt-5">
          <div className="relative w-full aspect-[2/1] overflow-hidden rounded-xl">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 p-5">
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

        <h2 className="text-xl font-semibold text-white mb-2 group-hover:underline transition-colors leading-snug">
          {post.title}
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
    </Link>
  );
}
