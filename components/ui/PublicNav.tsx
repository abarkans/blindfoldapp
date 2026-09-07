"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, X } from "lucide-react";
import { NAV_LINKS, publicNavHref } from "@/lib/nav-links";
import { useLoggedIn } from "@/lib/hooks/useLoggedIn";

// Mirrors the landing page nav (components/landing-v4/LandingV4Client.tsx):
// same link set, same 992px breakpoint, same full-screen mobile menu. Both read
// NAV_LINKS from lib/nav-links.ts, so a new section or product page shows up in
// both without touching either component.
//
// Signed-in visitors get the Dashboard CTA, same as the landing page. That state
// comes from useLoggedIn(), which seeds off the onboarding_complete cookie so the
// right button is in the first paint — no getUser() on the server, which
// proxy.ts skips on these routes on purpose.
export default function PublicNav({
  showCta = true,
  brand,
  initialLoggedIn = false,
}: {
  showCta?: boolean;
  // Replaces the logo slot. Blog posts pass a control that swaps to a link
  // back to the index once you have scrolled into the article.
  brand?: ReactNode;
  // Read from the onboarding_complete cookie by the Server Component rendering
  // this nav. Client call sites omit it and correct themselves on mount.
  initialLoggedIn?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = useLoggedIn(initialLoggedIn);

  const ctaClass =
    "inline-flex items-center justify-center gap-2 text-sm leading-none text-white font-semibold bg-rose-500 hover:bg-rose-400 px-5 h-11 rounded-full transition-[background-color] duration-150";

  return (
    <>
      {/* Spacer pushes content below fixed island — height matches top-4 + py-3 + logo */}
      <div style={{ height: "112px" }} aria-hidden="true" />
      <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-10 pointer-events-none">
        <nav className="liquid-glass relative flex items-center justify-between px-4 min-[992px]:px-5 py-3 max-w-[1440px] mx-auto rounded-full pointer-events-auto">
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

          <div className="hidden min-[992px]:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={publicNavHref(href)}
                className="text-sm text-white/55 hover:text-white transition-colors font-medium"
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden min-[992px]:flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className={ctaClass}>
                Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-white/55 hover:text-white transition-colors font-medium"
                >
                  Sign in
                </Link>
                {showCta && (
                  <Link href="/register" className={ctaClass}>
                    Get started
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="min-[992px]:hidden flex items-center gap-2">
            {isLoggedIn ? (
              <Link href="/dashboard" className={ctaClass}>
                Dashboard
              </Link>
            ) : (
              showCta && (
                <Link href="/register" className={ctaClass}>
                  Get started
                </Link>
              )
            )}
            <button
              className="w-11 h-11 flex items-center justify-center rounded-xl text-white/75 hover:text-white hover:bg-white/[0.04] transition-[color,background-color] duration-150"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <span className="flex w-6 flex-col gap-1.5" aria-hidden="true">
                  <span className="h-0.5 w-full rounded-full bg-current" />
                  <span className="h-0.5 w-full rounded-full bg-current" />
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <div
          aria-hidden={!menuOpen}
          inert={!menuOpen}
          className={`min-[992px]:hidden fixed inset-0 z-50 bg-black/98 backdrop-blur-2xl flex flex-col px-6 pt-4 pb-8 transition-[opacity,transform] duration-200 ease-out ${
            menuOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-3 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between h-[68px] shrink-0">
            <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="BlindfoldDate" width={180} height={44} className="object-contain" />
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-white/75 hover:text-white hover:bg-white/[0.04] transition-[color,background-color] duration-150"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 flex-1 pt-4">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={publicNavHref(href)}
                onClick={() => setMenuOpen(false)}
                className="flex items-center h-14 text-xl font-semibold text-white/70 hover:text-white transition-colors border-b border-white/[0.06]"
              >
                {label}
              </Link>
            ))}
            {!isLoggedIn && (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center h-14 text-xl font-semibold text-white/70 hover:text-white transition-colors border-b border-white/[0.06]"
              >
                Sign in
              </Link>
            )}
          </nav>
          {(isLoggedIn || showCta) && (
            <div className="pt-4">
              <Link
                href={isLoggedIn ? "/dashboard" : "/register"}
                onClick={() => setMenuOpen(false)}
                className="inline-flex w-full items-center justify-center gap-2 h-12 px-6 rounded-full bg-rose-500 hover:bg-rose-400 text-white text-sm font-semibold transition-[background-color] duration-150"
              >
                {isLoggedIn ? "Go to Dashboard" : "Get started free"}
                <ArrowRight className="w-4 h-4 text-rose-200" />
              </Link>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
