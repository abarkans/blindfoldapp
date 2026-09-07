// Store catalogue. Source of truth for what is purchasable and which R2 object
// each purchase unlocks.
//
// Price IDs live in env vars, not here: a Stripe price ID differs between test
// and live mode, so hardcoding one would silently charge the wrong thing (or
// nothing) on the other. The client only ever sends `id` -- the server resolves
// the price. Never accept an amount or a price ID from the browser.

/** One downloadable file inside a product. A product can ship several. */
export interface StoreFile {
  /** Stable slug. Sent by the client to say which file it wants; never a path. */
  id: string;
  /** Shown on the download button, e.g. "Partner A" — products with one file can omit it. */
  label?: string;
  /** R2 object key. */
  r2Key: string;
  /** Filename the browser saves it as. */
  fileName: string;
  contentType: string;
}

export interface StoreProduct {
  /** Stable slug. Sent to Stripe as metadata.product_id and stored on the purchase row. */
  id: string;
  name: string;
  tagline: string;
  description: string;
  /** Display only. Stripe's price object is what actually charges the card. */
  priceLine: string;
  format: string;
  /** Name of the env var holding this product's Stripe price ID. */
  priceEnvVar: string;
  /**
   * Everything the buyer gets. Key convention is `store/{product id}/{file}.ext`
   * so each product owns a prefix — the daily orphan reaper only touches
   * `photos/`, so anything under `store/` is left alone regardless of nesting.
   *
   * Kept as separate objects rather than one zip:
   * a large share of traffic is the Capacitor mobile app, where unzipping means
   * a trip through Files/Downloads before the buyer sees a single page. A zip
   * can still be shipped — it is just another entry with contentType
   * "application/zip".
   */
  files: StoreFile[];
  /**
   * Optional free teaser, served to anyone without payment via /api/store/sample.
   * Lives in R2 alongside the paid files rather than in /public so it can be
   * swapped without a deploy, and so the route can rate-limit egress.
   */
  sampleFile?: StoreFile;
  /** Path to cover art under /public. Empty string renders a gradient placeholder. */
  coverImage: string;
}

export const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: "ldr-mission-pack",
    name: "LDR Mission Pack",
    tagline: "For the nights you'd rather be on the same sofa",
    description:
      "You both get your own copy, so you're each planning something for the other instead of one of you carrying it. Open them together on your next call and you'll have a date lined up before you hang up.",
    priceLine: "€8.99",
    format: "2 PDFs · one per partner",
    priceEnvVar: "STRIPE_PRICE_LDR_MISSION_PACK",
    files: [
      {
        id: "partner-a",
        label: "Partner A",
        r2Key: "store/date-night-playbook/BlindfoldDate-LDR-partner-A.pdf",
        fileName: "BlindfoldDate-LDR-partner-A.pdf",
        contentType: "application/pdf",
      },
      {
        id: "partner-b",
        label: "Partner B",
        r2Key: "store/date-night-playbook/BlindfoldDate-LDR-partner-B.pdf",
        fileName: "BlindfoldDate-LDR-partner-B.pdf",
        contentType: "application/pdf",
      },
    ],
    sampleFile: {
      id: "sample",
      label: "Free sample",
      r2Key: "store/date-night-playbook/BlindfoldDate-LDR-sample.pdf",
      fileName: "BlindfoldDate-LDR-sample.pdf",
      contentType: "application/pdf",
    },
    // Cached immutably for a year by the next.config image rule — replacing the
    // artwork means a new filename, not a re-upload over this one.
    coverImage: "/store/BlindfoldDate-LDR.jpg",
  },
];

export function getStoreProduct(id: unknown): StoreProduct | null {
  if (typeof id !== "string") return null;
  return STORE_PRODUCTS.find((p) => p.id === id) ?? null;
}

/**
 * Resolve a product's Stripe price ID. Throws rather than falling back: a
 * missing price ID means the env is misconfigured, and creating a checkout
 * session against `undefined` would fail at Stripe with a far less obvious error.
 */
export function resolvePriceId(product: StoreProduct): string {
  const priceId = process.env[product.priceEnvVar];
  if (!priceId) {
    throw new Error(`${product.priceEnvVar} env var not set (product: ${product.id})`);
  }
  return priceId;
}

/** Resolve a file within a product. Returns null for an unknown id — never a path. */
export function getStoreFile(product: StoreProduct, fileId: unknown): StoreFile | null {
  if (typeof fileId !== "string") return null;
  return product.files.find((f) => f.id === fileId) ?? null;
}
