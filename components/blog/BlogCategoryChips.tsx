import Link from "next/link";
import { BLOG_CATEGORIES, type BlogCategoryId } from "@/lib/blog-meta";

// Plain links, no client JS: each chip is its own crawlable, shareable URL.
// Deliberately not the rose pill style used for post tags — a filter control
// that looks like a tag invites clicks on tags expecting them to filter.
export default function BlogCategoryChips({
  active,
  markCurrent = true,
}: {
  active: BlogCategoryId | "all";
  // Paged routes (/blog/page/2) show "All" as selected but are not the URL the
  // "All" chip points at, so they suppress aria-current rather than claim it.
  markCurrent?: boolean;
}) {
  const chips: { id: BlogCategoryId | "all"; label: string; href: string }[] = [
    { id: "all", label: "All", href: "/blog" },
    ...BLOG_CATEGORIES.map((c) => ({
      id: c.id as BlogCategoryId | "all",
      label: c.label,
      href: `/blog/${c.id}`,
    })),
  ];

  return (
    <nav aria-label="Post categories" className="flex flex-wrap gap-2 mb-12">
      {chips.map((chip) => {
        const isActive = chip.id === active;
        return (
          <Link
            key={chip.id}
            href={chip.href}
            aria-current={isActive && markCurrent ? "page" : undefined}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              isActive
                ? "bg-white border-white text-black"
                : "border-white/10 text-white/50 hover:text-white hover:border-white/30"
            }`}
          >
            {chip.label}
          </Link>
        );
      })}
    </nav>
  );
}
