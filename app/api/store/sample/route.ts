import { NextRequest, NextResponse } from "next/server";
import { getStoreProduct } from "@/lib/store/products";
import { presignDownloadUrl } from "@/lib/store/purchases";
import { checkStoreSampleRateLimit } from "@/lib/rate-limit";
import { safeLogValue } from "@/lib/log";

// Free teaser download. Deliberately unauthenticated — the whole point is that
// anyone can read it before deciding to buy.
//
// GET rather than POST (the paid route is POST) because this needs to work as a
// plain <a href> from the store card and from anywhere else we want to link it.
// Prefetching is not a concern: it is an /api route, so Next does not prefetch
// it, and a stray fetch costs one signed URL for a file we are giving away.
//
// The redirect hands the browser a short-lived presigned R2 URL rather than
// streaming the PDF through the function, same as the paid path.
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")?.trim()
    ?? "unknown";

  try {
    await checkStoreSampleRateLimit(ip);
  } catch {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const product = getStoreProduct(req.nextUrl.searchParams.get("product"));
  if (!product?.sampleFile) {
    return NextResponse.json({ error: "No sample available" }, { status: 404 });
  }

  let url: string;
  try {
    url = await presignDownloadUrl(product.sampleFile);
  } catch (err) {
    console.error(`[store/sample] presign failed product=${product.id} err=${safeLogValue(err)}`);
    return NextResponse.json({ error: "Download failed. Please try again." }, { status: 500 });
  }

  return NextResponse.redirect(url);
}
