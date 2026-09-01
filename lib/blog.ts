import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  isBlogCategoryId,
  getPostCategory,
  type BlogCategoryId,
  type BlogHeading,
  type BlogPost,
  type BlogPostMeta,
} from "./blog-meta";

export * from "./blog-meta";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractHeadings(content: string): BlogHeading[] {
  const slugCounts = new Map<string, number>();
  const headings: BlogHeading[] = [];
  for (const line of content.split("\n")) {
    const match = line.match(/^##\s+(.+)$/);
    if (!match) continue;
    const text = match[1].trim();
    const base = slugify(text);
    const count = slugCounts.get(base) ?? 0;
    slugCounts.set(base, count + 1);
    headings.push({ text, slug: count === 0 ? base : `${base}-${count}` });
  }
  return headings;
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(".mdx", "");
      // Category pages live at /blog/<category>, the same namespace as posts.
      // A colliding slug would be silently shadowed by the static route, so
      // fail the build instead of shipping an unreachable post.
      if (isBlogCategoryId(slug)) {
        throw new Error(
          `Blog post slug "${slug}" collides with a category route at /blog/${slug}. Rename the post file.`
        );
      }
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title as string,
        description: data.description as string,
        date: data.date as string,
        author: data.author as string,
        tags: (data.tags as string[]) ?? [],
        category: getPostCategory(slug),
        readingTime: estimateReadingTime(content),
        image: data.image as string | undefined,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const FEATURED_COUNT = 1;
const FIRST_PAGE_GRID_SIZE = 6;
const PAGE_SIZE = 8;

export function getTotalBlogPages(): number {
  const total = getAllPosts().length;
  const remaining = total - FEATURED_COUNT - FIRST_PAGE_GRID_SIZE;
  if (remaining <= 0) return 1;
  return 1 + Math.ceil(remaining / PAGE_SIZE);
}

export function getPostsByCategory(category: BlogCategoryId): BlogPostMeta[] {
  return getAllPosts().filter((post) => post.category === category);
}

// Tags used by more than this many posts are too generic to signal relatedness
// ("couples" covers 7 of 17), so they are ignored when scoring.
const RARE_TAG_MAX_POSTS = 3;
const SAME_CATEGORY_WEIGHT = 3;
const SHARED_RARE_TAG_WEIGHT = 1;

export function getRelatedPosts(slug: string, limit = 3): BlogPostMeta[] {
  const all = getAllPosts();
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];

  const tagCounts = new Map<string, number>();
  for (const post of all) {
    for (const tag of post.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const rareTags = new Set(
    current.tags.filter((tag) => (tagCounts.get(tag) ?? 0) <= RARE_TAG_MAX_POSTS)
  );

  const candidates = all.filter((p) => p.slug !== slug);
  const scored = candidates
    .map((post) => ({
      post,
      score:
        (post.category === current.category ? SAME_CATEGORY_WEIGHT : 0) +
        post.tags.filter((tag) => rareTags.has(tag)).length * SHARED_RARE_TAG_WEIGHT,
    }))
    // getAllPosts() is already newest first, so a stable sort on score alone
    // leaves the newer post ahead on ties.
    .sort((a, b) => b.score - a.score);

  const related = scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.post);

  // Never render a half-empty section: top up with the newest posts not shown.
  if (related.length < limit) {
    for (const post of candidates) {
      if (related.length >= limit) break;
      if (!related.includes(post)) related.push(post);
    }
  }

  return related;
}

export function getPostsForPage(page: number): {
  featured: BlogPostMeta | null;
  posts: BlogPostMeta[];
  totalPages: number;
} {
  const all = getAllPosts();
  // Derived from `all` rather than calling getTotalBlogPages(), which would
  // re-read every post off disk on a request-rendered page.
  const remaining = all.length - FEATURED_COUNT - FIRST_PAGE_GRID_SIZE;
  const totalPages = remaining <= 0 ? 1 : 1 + Math.ceil(remaining / PAGE_SIZE);
  if (all.length === 0) return { featured: null, posts: [], totalPages };

  const [featured, ...rest] = all;

  if (page <= 1) {
    return { featured, posts: rest.slice(0, FIRST_PAGE_GRID_SIZE), totalPages };
  }

  const afterFirstPage = rest.slice(FIRST_PAGE_GRID_SIZE);
  const start = (page - 2) * PAGE_SIZE;
  return { featured: null, posts: afterFirstPage.slice(start, start + PAGE_SIZE), totalPages };
}

export function getPost(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    date: data.date as string,
    author: data.author as string,
    tags: (data.tags as string[]) ?? [],
    category: getPostCategory(slug),
    readingTime: estimateReadingTime(content),
    image: data.image as string | undefined,
    content,
    headings: extractHeadings(content),
  };
}
