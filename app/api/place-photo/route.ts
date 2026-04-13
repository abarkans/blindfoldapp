import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Allowlist: Google Places API (New) photo names are always in this shape
const PHOTO_REF_PATTERN = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

export async function GET(request: NextRequest) {
  // Require authentication — prevents using this endpoint as a free Google API proxy
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) return new Response("Missing ref", { status: 400 });

  // Validate ref against the known pattern before injecting into URL
  if (!PHOTO_REF_PATTERN.test(ref)) {
    return new Response("Invalid ref", { status: 400 });
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
  return new Response(buffer, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
