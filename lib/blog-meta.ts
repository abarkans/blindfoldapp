// Pure blog metadata: types, the category taxonomy, and formatting helpers.
// Kept free of `fs` so client components (PostCard, BlogIndex) can import it
// without pulling Node built-ins into the browser bundle. Server-side loading
// lives in lib/blog.ts, which re-exports everything here.

export type BlogCategoryId =
  | "date-ideas"
  | "mystery-games"
  | "short-on-time"
  | "relationship-advice";

export const BLOG_CATEGORIES: {
  id: BlogCategoryId;
  label: string;
  description: string;
}[] = [
  {
    id: "date-ideas",
    label: "Date ideas",
    description:
      "Date night ideas for couples — at home, on a budget, for a first date, or out exploring your own city.",
  },
  {
    id: "mystery-games",
    label: "Mystery & games",
    description:
      "Mystery dates, blindfold challenges, and games that make an evening together feel unpredictable again.",
  },
  {
    id: "short-on-time",
    label: "Short on time",
    description:
      "Date ideas for tired, busy couples — last-minute plans and nights built around a fixed sitter window.",
  },
  {
    id: "relationship-advice",
    label: "Relationship advice",
    description:
      "Why date nights matter: spotting a rut, the case for novelty, and the psychology behind planning paralysis.",
  },
];

export function getCategory(id: BlogCategoryId) {
  return BLOG_CATEGORIES.find((c) => c.id === id);
}

// Categories live here rather than in each post's frontmatter so the whole
// taxonomy is reviewable in one place and a new post can never render with an
// undefined category. Unmapped slugs fall back to "date-ideas".
const POST_CATEGORIES: Record<string, BlogCategoryId> = {
  "date-night-ideas-to-try-this-weekend": "date-ideas",
  "romantic-date-ideas-for-couples": "date-ideas",
  "first-date-ideas-not-dinner": "date-ideas",
  "cheap-date-ideas-under-30": "date-ideas",
  "tourist-in-your-own-city": "date-ideas",
  "anniversary-date-ideas": "date-ideas",
  "date-night-ideas-at-home": "date-ideas",

  "blindfold-date-ideas-ultimate-guide": "mystery-games",
  "mystery-date-ideas-for-couples": "mystery-games",
  "surprise-date-night-ideas": "mystery-games",
  "date-night-challenges-for-couples": "mystery-games",

  "date-ideas-when-tired": "short-on-time",
  "last-minute-date-night-ideas": "short-on-time",
  "2-hour-date-night-ideas-for-parents": "short-on-time",

  "signs-relationship-rut": "relationship-advice",
  "why-couples-who-try-new-things": "relationship-advice",
  "why-you-hate-planning-dates": "relationship-advice",
};

const DEFAULT_CATEGORY: BlogCategoryId = "date-ideas";

export function getCategoryLabel(id: BlogCategoryId): string {
  return BLOG_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function isBlogCategoryId(value: string): value is BlogCategoryId {
  return BLOG_CATEGORIES.some((c) => c.id === value);
}

export function getPostCategory(slug: string): BlogCategoryId {
  return POST_CATEGORIES[slug] ?? DEFAULT_CATEGORY;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  category: BlogCategoryId;
  readingTime: number;
  image?: string;
}

export interface BlogHeading {
  text: string;
  slug: string;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
  headings: BlogHeading[];
}

// "Sep 1, 2026" -- used where the byline stacks under the author name.
export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
