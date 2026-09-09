"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import CookieSettingsLink from "@/components/CookieSettingsLink";
import { publicNavHref } from "@/lib/nav-links";

// The one footer for every public page — landing, store, blog, and anything
// else that renders PublicNav. Lifted out of LandingV4Client so the marketing
// surface has a single definition of its links, socials and legal row, the same
// way PublicNav and NAV_LINKS work.
//
// Client component only because CookieSettingsLink is one; nothing here holds
// state of its own.
//
// Section links run through publicNavHref() so "#plans" becomes "/#plans" and
// still works from /store or a blog post, where those sections do not exist.
export default function PublicFooter() {
  return (
    <footer className="border-t border-white/[0.05] px-6 md:px-10 pt-14 pb-10">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 pb-10 border-b border-white/[0.05]">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <Image src="/logo.png" alt="BlindfoldDate" width={120} height={30} className="object-contain opacity-45" />
            <p className="text-white/50 text-sm leading-relaxed max-w-[220px]">
              Date night, decided. You just enjoy it.
            </p>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Follow us on</p>
            <div className="flex items-center gap-5">
              <a href="https://www.instagram.com/blindfold.date" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="opacity-80 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24">
                  <defs>
                    <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
                      <stop offset="0%" stopColor="#fdf497"/>
                      <stop offset="5%" stopColor="#fdf497"/>
                      <stop offset="45%" stopColor="#fd5949"/>
                      <stop offset="60%" stopColor="#d6249f"/>
                      <stop offset="90%" stopColor="#285AEB"/>
                    </radialGradient>
                  </defs>
                  <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.332 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              </a>
              <a href="https://www.youtube.com/@BlindfoldDate" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="opacity-80 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24">
                  <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
                  <path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="https://www.facebook.com/people/BlindfoldDate/61590657718834/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="opacity-80 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="12" fill="#1877F2"/>
                  <path fill="#fff" d="M16.671 15.469l.532-3.469h-3.328v-2.25c0-.949.465-1.875 1.956-1.875h1.513V4.922S16.001 4.688 14.71 4.688c-2.695 0-4.457 1.634-4.457 4.594V12H7.202v3.469h3.051V23.85a12.13 12.13 0 0 0 3.75 0v-8.381h2.668z"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Product</p>
            {[{ label: "Features", href: "#features" }, { label: "Pricing", href: "#plans" }].map(({ label, href }) => (
              <Link key={label} href={publicNavHref(href)} className="text-base text-white/50 hover:text-white hover:underline transition-colors">{label}</Link>
            ))}
            <Link href="/blog" className="text-base text-white/50 hover:text-white hover:underline transition-colors">Blog</Link>
            <Link href="/store" className="text-base text-white/50 hover:text-white hover:underline transition-colors">Store</Link>
            <Link href="/about" className="text-base text-white/50 hover:text-white hover:underline transition-colors">About</Link>
            <a href="https://play.google.com/store/apps/details?id=com.blindfolddate.app" target="_blank" rel="noopener noreferrer" className="text-base text-white/50 hover:text-white hover:underline transition-colors">Android App</a>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Account</p>
            <Link href="/register" className="text-base text-white/50 hover:text-white hover:underline transition-colors">Get started free</Link>
            <Link href="/login" className="text-base text-white/50 hover:text-white hover:underline transition-colors">Sign in</Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Legal</p>
            <Link href="/legal/privacy" className="text-base text-white/50 hover:text-white hover:underline transition-colors">Privacy Policy</Link>
            <Link href="/legal/terms" className="text-base text-white/50 hover:text-white hover:underline transition-colors">Terms of Service</Link>
            <Link href="/legal/accessibility" className="text-base text-white/50 hover:text-white hover:underline transition-colors">Accessibility</Link>
            <CookieSettingsLink className="text-base text-white/50 hover:text-white hover:underline transition-colors text-left cursor-pointer" />
            <a href="mailto:info@blindfolddate.com" className="text-base text-white/50 hover:text-white hover:underline transition-colors">Contact us</a>
          </div>
        </div>
        <div className="pt-8">
          <Script
            src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
            strategy="lazyOnload"
          />
          <div
            className="trustpilot-widget [&>iframe]:!mx-0"
            data-locale="en-US"
            data-template-id="56278e9abfbbba0bdcd568bc"
            data-businessunit-id="6a3e801c55ed47ab58b28cdf"
            data-style-height="52px"
            data-style-width="100%"
            data-token="2e94904c-a507-4efe-b726-a6296286fd32"
          >
            <a href="https://www.trustpilot.com/review/blindfolddate.com" target="_blank" rel="noopener noreferrer">
              Trustpilot
            </a>
          </div>
        </div>
        <div className="pt-6">
          <p className="text-white/40 text-sm text-center sm:text-left">© {new Date().getFullYear()} BlindfoldDate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
