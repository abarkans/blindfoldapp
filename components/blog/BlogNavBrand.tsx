"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

// Once you are into the article, the wordmark is the least useful thing in the
// bar — a route back to the index is. Both states stay mounted in one grid cell
// so the swap is a crossfade rather than a width jump.
const SWAP_AFTER_PX = 160;

export default function BlogNavBrand() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SWAP_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative grid items-center">
      <Link
        href="/"
        aria-hidden={scrolled}
        tabIndex={scrolled ? -1 : undefined}
        className={`[grid-area:1/1] flex items-center group transition-opacity duration-200 ${
          scrolled ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <Image
          src="/logo.png"
          alt="BlindfoldDate"
          width={180}
          height={44}
          className="hidden min-[992px]:block object-contain group-hover:opacity-75 transition-opacity"
        />
        <Image
          src="/icon.png"
          alt="BlindfoldDate"
          width={44}
          height={44}
          className="min-[992px]:hidden object-contain group-hover:opacity-75 transition-opacity"
        />
      </Link>

      <Link
        href="/blog"
        // "Back" alone does not say where to; the label keeps the destination
        // available to screen readers without lengthening the visible text.
        aria-label="Back to blog"
        aria-hidden={!scrolled}
        tabIndex={scrolled ? undefined : -1}
        className={`[grid-area:1/1] flex items-center gap-1.5 h-11 pr-2 text-sm font-semibold text-white/70 hover:text-white transition-[opacity,color] duration-200 ${
          scrolled ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
    </div>
  );
}
