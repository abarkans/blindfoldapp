import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkPlacePhotoRateLimit, checkPlacePhotoIpRateLimit } from "@/lib/rate-limit";
import { verifyPlacePhotoToken } from "@/lib/place-photo-token";

function clientIp(req: NextRequest): string {
  // x-forwarded-for can be a comma-separated list — take the first hop,
  // which on Vercel is the real client IP. Fall back to x-real-ip then a
  // sentinel so the rate-limit key is still bounded if no header present.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return "unknown";
}

// Allowlist: Google Places API (New) photo names are always in this shape
const PHOTO_REF_PATTERN = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) return new Response("Missing ref", { status: 400 });

  // Validate ref against the known pattern before injecting into URL.
  // Done before any auth work so attackers can't probe auth state with
  // arbitrary input.
  if (!PHOTO_REF_PATTERN.test(ref)) {
    return new Response("Invalid ref", { status: 400 });
  }

  // Two access paths:
  //   1. Signed HMAC token (used by RSC-rendered <Image> URLs). The
  //      Next.js image optimizer fetches /api/place-photo as its own
  //      outbound request without forwarding cookies, so cookie-based
  //      auth is impossible here. The token proves the URL was issued
  //      by our server within the last 24h. Tokens are shareable for
  //      that window — acceptable since photos aren't sensitive.
  //   2. Session cookie fallback (direct browser fetch / debugging).
  //      Rate-limited per user.
  const exp = request.nextUrl.searchParams.get("exp");
  const sig = request.nextUrl.searchParams.get("sig");

  if (sig) {
    if (!verifyPlacePhotoToken(ref, exp, sig)) {
      return new Response("Invalid or expired token", { status: 401 });
    }
    // Token is valid — skip session auth, but still cap by source IP.
    // A signed URL is shareable for the TTL window (2h). Without an IP
    // cap a leaked URL could burn unbounded Google Places quota.
    try {
      await checkPlacePhotoIpRateLimit(clientIp(request));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Rate limited";
      return new Response(msg, { status: 429 });
    }
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    try {
      await checkPlacePhotoRateLimit(user.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Rate limited";
      return new Response(msg, { status: 429 });
    }
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return new Response("Not configured", { status: 500 });

  // Use header instead of query param so the key never appears in server logs
  const photoUrl = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=800`;
  const res = await fetch(photoUrl, {
    headers: { "X-Goog-Api-Key": apiKey },
  });

  if (!res.ok) return new Response("Photo not found", { status: 404 });

  const buffer = await res.arrayBuffer();

  // Allowlist the content type — never blindly forward an arbitrary value from
  // a third party (e.g. text/html would allow XSS if the browser renders it).
  const rawType = res.headers.get("Content-Type") ?? "";
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const contentType = ALLOWED_IMAGE_TYPES.includes(rawType) ? rawType : "image/jpeg";

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
