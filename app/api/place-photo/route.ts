import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) return new Response("Missing ref", { status: 400 });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return new Response("Not configured", { status: 500 });

  const photoUrl = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=800&key=${apiKey}`;

  const res = await fetch(photoUrl);
  if (!res.ok) return new Response("Photo not found", { status: 404 });

  const buffer = await res.arrayBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
