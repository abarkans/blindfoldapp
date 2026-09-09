"use client";

import Image from "next/image";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { STORE_PRODUCTS } from "@/lib/store/products";
import { LANDING_CTA } from "@/lib/landing-cta";

// Sits between Pricing and the FAQ on purpose: someone who has just read the
// plans and not clicked "Get started" is exactly the reader this section is
// for. Catching them there turns a bounce into a one-off sale.
//
// Content comes from STORE_PRODUCTS rather than being retyped, so a price or
// name change in the catalogue cannot leave the landing page lying. products.ts
// is pure data (the Stripe calls live in pricing.ts), which is what lets a
// client component read it.
const MAX_PRODUCTS = 2;

export default function StorePromoSection() {
  const ph = usePostHog();
  const products = STORE_PRODUCTS.slice(0, MAX_PRODUCTS);

  if (products.length === 0) return null;

  return (
    <section
      id="printables"
      aria-labelledby="printables-heading"
      className="relative bg-black scroll-mt-20 md:scroll-mt-28"
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-16 md:py-24">
        {/* Same heading rhythm as the Features and Pricing sections, so this
            reads as another section of the page rather than a panel dropped
            into it. */}
        <div className="flex flex-col items-start md:items-center gap-4 mb-10 md:mb-16">
          <h2
            id="printables-heading"
            className="text-[36px] md:text-[44px] lg:text-[48px] xl:text-[54px] 2xl:text-[64px] font-black leading-[1.15] tracking-normal text-white md:text-center"
          >
            We also make things
            <br />
            you can print.
          </h2>
          <p className="text-white/50 text-base md:text-lg max-w-[520px] leading-[1.7] md:text-center md:mx-auto">
            Date packs as PDFs. Pay once, download instantly, keep them forever.
            No account needed — yours or theirs.
          </p>
        </div>

        {/* One product per column. Two fill the row; a third would want this to
            become a 3-col grid rather than a wrapped orphan. */}
        <div className="grid gap-8 md:gap-10 sm:grid-cols-2 max-w-[920px] mx-auto">
          {products.map((product) => (
            <article key={product.id} className="flex flex-col">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]">
                {product.coverImage ? (
                  <Image
                    src={product.coverImage}
                    alt={product.name}
                    fill
                    sizes="(min-width: 640px) 440px, 90vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-500/25 via-rose-500/5 to-transparent px-8 text-center text-xl font-bold text-white/85">
                    {product.name}
                  </div>
                )}
              </div>

              <h3 className="mt-5 text-xl font-bold text-white">{product.name}</h3>
              <p className="mt-1 text-sm text-white/45 leading-relaxed">{product.tagline}</p>
              <p className="mt-3 text-sm text-white/40">
                {product.format} ·{" "}
                <span className="text-white font-semibold">{product.priceLine}</span>
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 md:mt-14 flex justify-center">
          <Link
            href="/store"
            onClick={() => ph?.capture("landing_store_click", { action: "browse" })}
            className={LANDING_CTA}
          >
            Browse the store
          </Link>
        </div>
      </div>
    </section>
  );
}
