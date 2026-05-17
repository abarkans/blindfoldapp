import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientAndUser } from "@/lib/supabase/get-client-and-user";
import { getCoupleAccess } from "@/lib/partner-invites";
import { r2, R2_BUCKET } from "@/lib/r2";
import { checkPresignRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { user } = await getClientAndUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await checkPresignRateLimit(user.id);
  } catch {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const dateIdeaId: unknown = body?.dateIdeaId;
  if (typeof dateIdeaId !== "string" || !dateIdeaId) {
    return NextResponse.json({ error: "Missing dateIdeaId" }, { status: 400 });
  }

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  const { data: profile } = await admin
    .from("profiles")
    .select("checkin_owner_at, checkin_partner_at, checkin_owner_skipped, checkin_partner_skipped")
    .eq("id", access.profileId)
    .single();

  if (!profile?.checkin_owner_at || !profile?.checkin_partner_at) {
    return NextResponse.json({ error: "Dual check-in required" }, { status: 403 });
  }

  const mySkipped =
    access.role === "owner" ? profile.checkin_owner_skipped : profile.checkin_partner_skipped;
  if (mySkipped) {
    return NextResponse.json({ error: "Check-in required to upload photo" }, { status: 403 });
  }

  const { data: idea } = await admin
    .from("date_ideas")
    .select("id")
    .eq("id", dateIdeaId)
    .eq("user_id", access.profileId)
    .single();

  if (!idea) return NextResponse.json({ error: "Date not found" }, { status: 404 });

  const { data: existing } = await admin
    .from("date_photos")
    .select("id")
    .eq("date_idea_id", dateIdeaId)
    .eq("uploader_user_id", user.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Photo already uploaded" }, { status: 409 });

  const key = `photos/${access.profileId}/${dateIdeaId}/${user.id}_${Date.now()}.jpg`;

  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: "image/jpeg",
    }),
    { expiresIn: 60 }
  );

  return NextResponse.json({ uploadUrl, key });
}
