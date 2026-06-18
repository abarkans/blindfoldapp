import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  readingTime: number;
  image?: string;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(".mdx", "");
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title as string,
        description: data.description as string,
        date: data.date as string,
        author: data.author as string,
        tags: (data.tags as string[]) ?? [],
        readingTime: estimateReadingTime(content),
        image: data.image as string | undefined,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const FEATURED_COUNT = 1;
const FIRST_PAGE_GRID_SIZE = 6;
const PAGE_SIZE = 10;

export function getTotalBlogPages(): number {
  const total = getAllPosts().length;
  const remaining = total - FEATURED_COUNT - FIRST_PAGE_GRID_SIZE;
  if (remaining <= 0) return 1;
  return 1 + Math.ceil(remaining / PAGE_SIZE);
}

export function getPostsForPage(page: number): {
  featured: BlogPostMeta | null;
  posts: BlogPostMeta[];
  totalPages: number;
} {
  const all = getAllPosts();
  const totalPages = getTotalBlogPages();
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
    readingTime: estimateReadingTime(content),
    image: data.image as string | undefined,
    content,
  };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
