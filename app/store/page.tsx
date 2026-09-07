import { cookies } from "next/headers";
import { LOGGED_IN_HINT_COOKIE } from "@/lib/hooks/useLoggedIn";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PublicPageShell from "@/components/ui/PublicPageShell";
import PublicNav from "@/components/ui/PublicNav";
import BuyButton from "@/components/store/BuyButton";
import { STORE_PRODUCTS } from "@/lib/store/products";

const SITE_URL = "https://blindfolddate.com";

export const metadata: Metadata = {
  title: "Store - BlindfoldDate",
  description:
    "Instant-download guides from BlindfoldDate. Buy once, download forever — no account needed.",
  alternates: { canonical: `${SITE_URL}/store` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "BlindfoldDate Store",
    description: "Instant-download guides from BlindfoldDate. Buy once, download forever.",
    url: `${SITE_URL}/store`,
    siteName: "BlindfoldDate",
    type: "website",
  },
};

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;

  // Cookie hint only — the nav uses it to draw Dashboard instead of Get started
  // on the first paint. useLoggedIn() confirms against the real session on mount.
  const loggedInHint = (await cookies()).get(LOGGED_IN_HINT_COOKIE)?.value === "1";

  return (
    <PublicPageShell decorate>
      <PublicNav initialLoggedIn={loggedInHint} />
      <div className="max-w-[1100px] mx-auto px-6 md:px-10 pb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Store</h1>
        <p className="text-white/55 text-lg max-w-xl mb-4">
          Things worth doing together, ready the moment you buy them.
          Pay once, download straight away, no account needed.
        </p>
        {checkout === "cancelled" && (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
            Checkout cancelled — nothing was charged.
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2 mt-10">
          {STORE_PRODUCTS.map((product) => (
            <article
              key={product.id}
              className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden"
            >
              <div className="relative aspect-[4/3] bg-white/[0.03]">
                {product.coverImage ? (
                  <Image
                    src={product.coverImage}
                    alt={product.name}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  // No artwork yet: the rose gradient stands in for it. Kept off
                  // the container itself so it never tints a transparent PNG.
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-500/25 via-rose-500/5 to-transparent px-8 text-center text-2xl font-bold leading-tight text-white/85">
                    {product.name}
                  </div>
                )}
                <span className="absolute top-4 left-4 rounded-full bg-black/60 backdrop-blur px-3 py-1 text-xs font-medium text-white/80">
                  {product.format}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-xl font-semibold text-white">{product.name}</h2>
                <p className="mt-1 text-sm text-rose-300">{product.tagline}</p>
                <p className="mt-4 text-sm leading-relaxed text-white/55">{product.description}</p>

                <div className="mt-auto pt-6">
                  <BuyButton productId={product.id} label={`Buy · ${product.priceLine}`} />
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-sm text-white/40">
          Already bought something?{" "}
          <Link href="/store/downloads" className="text-rose-300 hover:text-rose-200 underline underline-offset-4">
            Get your download links
          </Link>
          .
        </p>
      </div>
    </PublicPageShell>
  );
}
