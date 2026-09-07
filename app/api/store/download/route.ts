import { NextRequest, NextResponse } from "next/server";
import { getStoreFile, getStoreProduct } from "@/lib/store/products";
import { verifyStoreAccess, STORE_ACCESS_COOKIE } from "@/lib/store/access-token";
import { getPurchaseById, presignDownloadUrl, recordDownload } from "@/lib/store/purchases";
import { getClientAndUser } from "@/lib/supabase/get-client-and-user";
import { checkStoreDownloadRateLimit } from "@/lib/rate-limit";
import { isAllowedOrigin } from "@/lib/origin";
import { safeLogValue } from "@/lib/log";

// POST, not GET: the response is a presigned R2 URL, and a GET would be
// prefetchable by the browser and link-preview crawlers, burning download URLs
// nobody asked for.
//
// Two ways to be authorised for a purchase, checked in this order:
//   1. the HttpOnly access cookie set by /api/store/claim or the success page
//   2. a signed-in session whose user ID or email matches the purchase row
// Both are verified server-side against the row; the body only names which
// purchase is wanted.
export async function POST(req: NextRequest) {
  // The access cookie is SameSite=Lax, which does not cover cross-site POSTs, but
  // the origin allowlist makes that explicit rather than implicit. A cross-site
  // caller could not read the JSON body anyway (no CORS headers), yet it could
  // still burn a victim's download quota without this.
  if (!isAllowedOrigin(req.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")?.trim()
    ?? "unknown";

  try {
    await checkStoreDownloadRateLimit(ip);
  } catch {
    return NextResponse.json({ error: "Too many downloads. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const purchaseId = typeof body.purchaseId === "string" ? body.purchaseId : null;
  if (!purchaseId) return NextResponse.json({ error: "Missing purchaseId" }, { status: 400 });
  // fileId names one entry in the product's catalogue definition. It is looked
  // up by exact match, never joined onto a key, so it cannot escape the prefix.
  const fileId = body.fileId;

  const purchase = await getPurchaseById(purchaseId);
  if (!purchase) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cookieGrantsThis = verifyStoreAccess(req.cookies.get(STORE_ACCESS_COOKIE)?.value) === purchase.id;

  let accountGrantsThis = false;
  if (!cookieGrantsThis) {
    const { user } = await getClientAndUser();
    accountGrantsThis = !!user && (
      purchase.user_id === user.id ||
      purchase.email === user.email?.trim().toLowerCase()
    );
  }

  if (!cookieGrantsThis && !accountGrantsThis) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const product = getStoreProduct(purchase.product_id);
  if (!product) {
    // Row references a product that has since left the catalogue. The buyer paid;
    // this needs a human, not a 404 they can't act on.
    console.error(`[audit] store/download: purchase=${purchase.id} references missing product=${safeLogValue(purchase.product_id)}`);
    return NextResponse.json({ error: "This product is unavailable. Please contact support." }, { status: 410 });
  }

  // Single-file products stay callable without a fileId.
  const file = fileId === undefined && product.files.length === 1
    ? product.files[0]
    : getStoreFile(product, fileId);

  if (!file) return NextResponse.json({ error: "Unknown file" }, { status: 400 });

  let url: string;
  try {
    url = await presignDownloadUrl(file);
  } catch (err) {
    console.error(`[store/download] presign failed purchase=${purchase.id} err=${safeLogValue(err)}`);
    return NextResponse.json({ error: "Download failed. Please try again." }, { status: 500 });
  }

  await recordDownload(purchase);
  return NextResponse.json({ url, fileName: file.fileName });
}
