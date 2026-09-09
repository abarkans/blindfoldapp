// Server-only: importing this from a client component pulls the Stripe SDK
// (and Node built-ins) into the browser bundle and fails the build. Catalogue
// data that the client may read lives in products.ts.
import { stripe } from "@/lib/stripe";
import type { StoreProduct } from "@/lib/store/products";

/**
 * Resolve a product's Stripe price by lookup key.
 *
 * Throws rather than falling back: a missing price means the product exists in
 * the catalogue but not in Stripe (or the lookup key was never set on it), and
 * creating a session against `undefined` fails at Stripe with a far less
 * obvious error. More than one active match means two prices claim the same
 * key, which Stripe forbids — but check anyway rather than charge an arbitrary
 * one of them.
 */
export async function resolvePriceId(product: StoreProduct): Promise<string> {
  const { data } = await stripe.prices.list({
    lookup_keys: [product.id],
    active: true,
    limit: 2,
  });

  if (data.length === 0) {
    throw new Error(
      `No active Stripe price with lookup_key "${product.id}" — set it on the price in this mode`
    );
  }
  if (data.length > 1) {
    throw new Error(`Multiple active Stripe prices share lookup_key "${product.id}"`);
  }
  return data[0].id;
}
