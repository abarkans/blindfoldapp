"use client";

import { useEffect, useState } from "react";
import type { BlogHeading } from "@/lib/blog";

export default function BlogToc({ headings }: { headings: BlogHeading[] }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    const elements = headings
      .map((h) => document.getElementById(h.slug))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const firstVisible = headings.find((h) => visible.has(h.slug));
        if (firstVisible) setActiveSlug(firstVisible.slug);
      },
      { rootMargin: "-112px 0px -70% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  return (
    <ul className="space-y-2.5 text-sm mb-10 border-l border-white/10 pl-4">
      {headings.map((h) => {
        const isActive = h.slug === activeSlug;
        return (
          <li key={h.slug} className="relative">
            {isActive && (
              <span className="absolute -left-4 top-0 bottom-0 w-px bg-rose-400" aria-hidden="true" />
            )}
            <a
              href={`#${h.slug}`}
              className={`block transition-colors ${isActive ? "text-white font-medium" : "text-white/50 hover:text-white"}`}
            >
              {h.text}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
