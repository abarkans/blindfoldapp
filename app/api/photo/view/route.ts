import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientAndUser } from "@/lib/supabase/get-client-and-user";
import { getCoupleAccess } from "@/lib/partner-invites";
import { r2, R2_BUCKET } from "@/lib/r2";
import { isPlusPlan } from "@/lib/plans";

// GET /api/photo/view?key=photos/{profileId}/{dateIdeaId}/{filename}
export async function GET(req: NextRequest) {
  const { user } = await getClientAndUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = req.nextUrl.searchParams.get("key");
  if (!key || !key.startsWith("photos/")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  // key format: photos/{profileId}/{dateIdeaId}/{filename}
  const parts = key.split("/");
  if (parts.length < 4) return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  const profileId = parts[1];

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  if (access.profileId !== profileId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("plan_type")
    .eq("id", profileId)
    .single();

  if (!isPlusPlan(profile?.plan_type)) {
    return NextResponse.json({ error: "Plus required" }, { status: 403 });
  }

  const { data: photo } = await admin
    .from("date_photos")
    .select("id")
    .eq("r2_key", key)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let obj;
  try {
    obj = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!obj.Body) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Stream directly instead of buffering the entire object into memory.
  // transformToWebStream() returns a Web ReadableStream compatible with NextResponse.
  const stream = obj.Body.transformToWebStream();
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
