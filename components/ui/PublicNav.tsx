import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

export default function PublicNav({
  showCta = true,
  showBlogLink = true,
  brand,
}: {
  showCta?: boolean;
  // Replaces the logo slot. Blog posts pass a control that swaps to a link
  // back to the index once you have scrolled into the article.
  brand?: ReactNode;
  // Blog routes pass false: the link would point into the section you are
  // already in. Those pages reach the index through the breadcrumb instead.
  showBlogLink?: boolean;
}) {
  return (
    <>
      {/* Spacer pushes content below fixed island — height matches top-4 + py-3 + logo */}
      <div style={{ height: "112px" }} aria-hidden="true" />
      <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-10 pointer-events-none">
        <nav className="liquid-glass relative flex items-center justify-between px-4 md:px-5 py-3 max-w-[1440px] mx-auto rounded-full pointer-events-auto">
{brand ?? (
            <Link href="/" className="relative flex items-center group">
              {/* Wordmark on desktop, icon on mobile — same breakpoint the
                  landing nav uses, so the two navs stay visually consistent. */}
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
          )}
          <div className="relative flex items-center gap-4 md:gap-6">
            {showBlogLink && (
              <Link
                href="/blog"
                className="text-sm text-white/55 hover:text-white font-medium transition-colors"
              >
                Blog
              </Link>
            )}
            {showCta && (
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm text-white font-semibold bg-rose-500 hover:bg-rose-400 px-5 h-10 rounded-full transition-[background-color] duration-150"
              >
                Get started
              </Link>
            )}
          </div>
        </nav>
      </header>
    </>
  );
}
