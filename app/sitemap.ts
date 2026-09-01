import { MetadataRoute } from "next";
import { getAllPosts, getPostsForPage, getTotalBlogPages } from "@/lib/blog";
import { BLOG_CATEGORIES } from "@/lib/blog-meta";

const SITE_URL = "https://blindfolddate.com";

// Only blog URLs get a lastModified: their content is derived from post dates,
// so the value is real. Static pages change on deploy, and a value of "now" on
// every request is noise that teaches crawlers to distrust the whole file --
// including the post dates, which are accurate. Omitting the field is honest.
function newestDate(posts: { date: string }[]): Date | undefined {
  return posts.length > 0 ? new Date(posts[0].date) : undefined;
}

export default function sitemap(): MetadataRoute.Sitemap {
  // getAllPosts() is sorted newest first, so index 0 is the newest everywhere.
  const posts = getAllPosts();
  const totalPages = getTotalBlogPages();

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const blogPageEntries: MetadataRoute.Sitemap = Array.from(
    { length: Math.max(totalPages - 1, 0) },
    (_, i) => ({
      url: `${SITE_URL}/blog/page/${i + 2}`,
      lastModified: newestDate(getPostsForPage(i + 2).posts),
      changeFrequency: "weekly",
      priority: 0.6,
    })
  );

  const categoryEntries: MetadataRoute.Sitemap = BLOG_CATEGORIES.map((c) => ({
    url: `${SITE_URL}/blog/${c.id}`,
    lastModified: newestDate(posts.filter((p) => p.category === c.id)),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: newestDate(posts),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...categoryEntries,
    ...blogEntries,
    ...blogPageEntries,
    {
      url: `${SITE_URL}/about`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/register`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/legal/privacy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/legal/terms`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/legal/accessibility`,
      changeFrequency: "yearly",
      priority: 0.1,
    },
  ];
}
