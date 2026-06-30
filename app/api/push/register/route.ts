import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkPushRegisterRateLimit } from "@/lib/rate-limit";

const MAX_TOKEN_LENGTH = 4096; // generous upper bound for FCM/APNs device tokens

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await checkPushRegisterRateLimit(user.id);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 429 });
  }

  const { token } = await req.json();
  if (!token || typeof token !== "string" || token.length > MAX_TOKEN_LENGTH) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("couple_members")
    .update({ push_token: token })
    .eq("user_id", user.id);

  if (error) {
    console.error("[push] register token failed:", error.message);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
