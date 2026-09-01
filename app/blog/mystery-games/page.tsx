import CategoryPageView, { categoryMetadata } from "@/components/blog/CategoryPageView";

// Static segment: takes routing priority over /blog/[slug]. lib/blog.ts throws
// at build time if a post slug ever collides with a category id.
export const metadata = categoryMetadata("mystery-games");

export default function Page() {
  return <CategoryPageView id="mystery-games" />;
}
