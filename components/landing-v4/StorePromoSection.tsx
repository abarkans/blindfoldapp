"use client";

import Image from "next/image";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { Download, ArrowRight } from "lucide-react";
import { STORE_PRODUCTS } from "@/lib/store/products";

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
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-rose-500/[0.12] via-rose-500/[0.03] to-transparent">
          <div className="grid gap-10 md:gap-14 lg:grid-cols-2 items-center p-6 sm:p-10 md:p-14">
            {/* Covers. Tilted and overlapped so they read as objects you own
                rather than another screenshot of the product. */}
            <div className="relative flex justify-center lg:justify-start">
              {products.map((product, i) => (
                <div
                  key={product.id}
                  className={[
                    "relative w-full max-w-[420px] aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50",
                    i === 0 ? "rotate-[-2deg]" : "hidden sm:block -ml-16 rotate-[3deg]",
                  ].join(" ")}
                >
                  {product.coverImage ? (
                    <Image
                      src={product.coverImage}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 90vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-500/25 via-rose-500/5 to-transparent px-8 text-center text-xl font-bold text-white/85">
                      {product.name}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col items-start">
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-400 mb-4">
                Printable date packs
              </p>

              <h2
                id="printables-heading"
                className="text-[32px] md:text-[40px] lg:text-[44px] xl:text-[50px] font-black leading-[1.15] tracking-normal text-white"
              >
                Not an app person?
              </h2>

              <p className="mt-4 text-white/50 text-base md:text-lg leading-[1.7] max-w-[520px]">
                We also make printable date packs you download once and keep. No account,
                no subscription — pay once and it&rsquo;s yours.
              </p>

              <ul className="mt-8 flex flex-col gap-3 w-full max-w-[460px]">
                {products.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{product.name}</p>
                      <p className="text-sm text-white/40 truncate">{product.format}</p>
                    </div>
                    <span className="shrink-0 text-lg font-bold text-white">
                      {product.priceLine}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-[460px]">
                <Link
                  href="/store"
                  onClick={() => ph?.capture("landing_store_click", { action: "browse" })}
                  className="inline-flex w-full shrink-0 sm:flex-1 items-center justify-center gap-2 h-14 px-7 rounded-full bg-rose-500 hover:bg-rose-400 text-white text-base font-bold transition-[background-color] duration-150"
                >
                  Browse the store
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>

                {products[0].sampleFile && (
                  // Plain <a>: /api/store/sample is a route handler that redirects
                  // to a presigned R2 URL, so client-side routing has no part in it.
                  <a
                    href={`/api/store/sample?product=${products[0].id}`}
                    onClick={() =>
                      ph?.capture("landing_store_click", {
                        action: "sample",
                        product_id: products[0].id,
                      })
                    }
                    className="inline-flex w-full shrink-0 sm:flex-1 items-center justify-center gap-2 h-14 px-7 rounded-full border border-white/15 text-white/80 hover:text-white hover:border-white/30 hover:bg-white/[0.04] text-base font-bold transition-[color,background-color,border-color] duration-150"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Free sample
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
