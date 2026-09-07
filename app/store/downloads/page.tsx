import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { LOGGED_IN_HINT_COOKIE } from "@/lib/hooks/useLoggedIn";
import PublicPageShell from "@/components/ui/PublicPageShell";
import PublicNav from "@/components/ui/PublicNav";
import DownloadButton from "@/components/store/DownloadButton";
import ResendLinksForm from "@/components/store/ResendLinksForm";
import { getStoreProduct } from "@/lib/store/products";
import { STORE_ACCESS_COOKIE, verifyStoreAccess } from "@/lib/store/access-token";
import {
  getPurchaseById,
  getPurchasesForAccount,
  type StorePurchase,
} from "@/lib/store/purchases";
import { getClientAndUser } from "@/lib/supabase/get-client-and-user";

export const metadata: Metadata = {
  title: "Your downloads - BlindfoldDate",
  // Never indexable: the page lists what a specific visitor has paid for.
  robots: { index: false, follow: false },
};

const NOTICES: Record<string, { tone: "ok" | "warn"; text: string }> = {
  new: { tone: "ok", text: "Payment received. Your download is ready below — we've also emailed you this link." },
  pending: {
    tone: "warn",
    text: "Your payment is still settling with the bank. We'll email your download link the moment it clears — no need to pay again.",
  },
  invalid: { tone: "warn", text: "That link isn't valid any more. Check the most recent email we sent you." },
  throttled: { tone: "warn", text: "Too many attempts. Please wait a few minutes and try your link again." },
};

export default async function StoreDownloadsPage({
  searchParams,
}: {
  searchParams: Promise<{ claim?: string }>;
}) {
  const { claim } = await searchParams;
  const notice = claim ? NOTICES[claim] : undefined;

  // Two independent grants, unioned: the cookie from a claim link (guest path)
  // and, for a signed-in visitor, everything bought under their account or their
  // email address.
  const purchases = new Map<string, StorePurchase>();

  const cookiePurchaseId = verifyStoreAccess((await cookies()).get(STORE_ACCESS_COOKIE)?.value);
  if (cookiePurchaseId) {
    const purchase = await getPurchaseById(cookiePurchaseId);
    if (purchase) purchases.set(purchase.id, purchase);
  }

  const { user } = await getClientAndUser();
  if (user) {
    for (const purchase of await getPurchasesForAccount(user.id, user.email)) {
      purchases.set(purchase.id, purchase);
    }
  }

  const items = [...purchases.values()].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
  );

  // Cookie hint only — the nav uses it to draw Dashboard instead of Get started
  // on the first paint. useLoggedIn() confirms against the real session on mount.
  const loggedInHint = (await cookies()).get(LOGGED_IN_HINT_COOKIE)?.value === "1";

  return (
    <PublicPageShell decorate>
      <PublicNav initialLoggedIn={loggedInHint} />
      <div className="max-w-[1100px] mx-auto px-6 md:px-10 pb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Your downloads</h1>

        {notice && (
          <p
            className={`mb-8 rounded-2xl border px-4 py-3 text-sm ${
              notice.tone === "ok"
                ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
                : "border-white/10 bg-white/[0.03] text-white/60"
            }`}
          >
            {notice.text}
          </p>
        )}

        {items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <p className="text-white/70">Nothing here yet.</p>
            <p className="mt-2 mb-6 text-sm leading-relaxed text-white/50">
              Bought as a guest on another device? Enter the email you used at checkout and
              we&apos;ll send your download links again.
            </p>
            <ResendLinksForm />
            <div className="mt-8 flex flex-wrap gap-3 border-t border-white/8 pt-6">
              <Link
                href="/store"
                className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-rose-500 hover:bg-rose-400 text-white text-sm font-semibold transition-[background-color] duration-150"
              >
                Browse the store
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-white/15 text-white/80 hover:text-white text-sm font-semibold transition-colors"
              >
                Still stuck?
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((purchase) => {
              const product = getStoreProduct(purchase.product_id);
              return (
                <li
                  key={purchase.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <h2 className="text-lg font-semibold text-white">
                    {product?.name ?? purchase.product_id}
                  </h2>
                  <p className="mt-1 text-sm text-white/45">
                    {product?.format ? `${product.format} · ` : ""}
                    Purchased{" "}
                    {new Date(purchase.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>

                  {product ? (
                    // One button per file. A product shipping a copy per partner
                    // gets two labelled buttons rather than a zip the buyer has
                    // to unpack — most of this traffic is phones.
                    <div className="mt-5 flex flex-wrap gap-3">
                      {product.files.map((file) => (
                        <DownloadButton
                          key={file.id}
                          purchaseId={purchase.id}
                          fileId={file.id}
                          label={file.label ? `Download · ${file.label}` : "Download"}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-white/45">
                      Temporarily unavailable —{" "}
                      <Link href="/contact" className="text-rose-300 underline underline-offset-4">
                        contact us
                      </Link>
                      .
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {items.length > 0 && (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold text-white">Need these somewhere else?</p>
            <p className="mt-1 mb-5 text-sm leading-relaxed text-white/50">
              We&apos;ll email your download links to the address you bought with.
            </p>
            <ResendLinksForm />
          </div>
        )}
      </div>
    </PublicPageShell>
  );
}
