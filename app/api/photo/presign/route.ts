import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientAndUser } from "@/lib/supabase/get-client-and-user";
import { getCoupleAccess } from "@/lib/partner-invites";
import { r2, R2_BUCKET } from "@/lib/r2";
import { checkPresignRateLimit } from "@/lib/rate-limit";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB — mirrors savePhoto() in app/actions/photo.ts

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

  // Declared upload size. When present we bake it into the SigV4 signature so
  // R2 rejects any PUT whose Content-Length differs — without it the presigned
  // URL accepts a body of ANY size and the 5 MB cap in savePhoto() only fires
  // after the object is already stored (and never at all if the client simply
  // never calls savePhoto).
  //
  // OPTIONAL for now, deliberately: older browser tabs and un-updated Capacitor
  // app builds don't send this field, and rejecting them would break photo
  // upload mid-session. Absent → legacy unsigned-size path (status quo).
  // Once [presign] legacy_size_client stops appearing in logs, make this
  // required by turning the `undefined` branch into a 400.
  const rawSize: unknown = body?.contentLength;
  let declaredSize: number | undefined;
  if (rawSize !== undefined && rawSize !== null) {
    if (
      typeof rawSize !== "number" ||
      !Number.isInteger(rawSize) ||
      rawSize <= 0 ||
      rawSize > MAX_PHOTO_BYTES
    ) {
      return NextResponse.json({ error: "Invalid contentLength" }, { status: 400 });
    }
    declaredSize = rawSize;
  } else {
    console.info(`[presign] legacy_size_client uid=${user.id}`);
  }

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  const { data: idea } = await admin
    .from("date_ideas")
    .select("id, location_type")
    .eq("id", dateIdeaId)
    .eq("user_id", access.profileId)
    .single();

  if (!idea) return NextResponse.json({ error: "Date not found" }, { status: 404 });

  // Home dates have no GPS check-in step — photo upload is the completion signal.
  if (idea.location_type !== "home") {
    const { data: profile } = await admin
      .from("profiles")
      .select("plan_type, checkin_owner_at, checkin_partner_at, checkin_owner_skipped, checkin_partner_skipped")
      .eq("id", access.profileId)
      .single();

    const isTrial = profile?.plan_type === "trial";
    const myCheckedIn = access.role === "owner" ? !!profile?.checkin_owner_at : !!profile?.checkin_partner_at;

    if (isTrial) {
      if (!myCheckedIn) {
        return NextResponse.json({ error: "Check-in required to upload photo" }, { status: 403 });
      }
    } else {
      if (!profile?.checkin_owner_at || !profile?.checkin_partner_at) {
        return NextResponse.json({ error: "Dual check-in required" }, { status: 403 });
      }
    }

    const mySkipped =
      access.role === "owner" ? profile.checkin_owner_skipped : profile.checkin_partner_skipped;
    if (mySkipped) {
      return NextResponse.json({ error: "Check-in required to upload photo" }, { status: 403 });
    }
  }

  const { data: existing } = await admin
    .from("date_photos")
    .select("id")
    .eq("date_idea_id", dateIdeaId)
    .eq("uploader_user_id", user.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Photo already uploaded" }, { status: 409 });

  const key = `photos/${access.profileId}/${dateIdeaId}/${user.id}_${Date.now()}.jpg`;

  // signableHeaders is what actually binds these values to the signature.
  // Note @aws-sdk/s3-request-presigner's prepareRequest() unconditionally adds
  // "content-type" to unsignableHeaders — listing it here overrides that.
  // "content-length" is not in ALWAYS_UNSIGNABLE_HEADERS, so it is signable.
  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: "image/jpeg",
      ...(declaredSize !== undefined ? { ContentLength: declaredSize } : {}),
    }),
    {
      expiresIn: 60,
      ...(declaredSize !== undefined
        ? { signableHeaders: new Set(["content-length", "content-type"]) }
        : {}),
    }
  );

  return NextResponse.json({ uploadUrl, key });
}
