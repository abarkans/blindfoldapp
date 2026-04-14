import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, FROM_ADDRESS } from "@/lib/email/resend";
import { dateReadyEmail } from "@/lib/email/templates/date-ready";

// Cadence → cooldown in days (mirrors reveal.ts)
const CADENCE_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  spontaneous: 3,
};

export async function GET(request: Request) {
  // Verify the request comes from Vercel Cron (or an authorised caller)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch all profiles that have completed at least one date
  // (revealed_at is set) and haven't been notified for the current cycle.
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, partner_names, cadence, revealed_at, notification_sent_at")
    .not("revealed_at", "is", null)
    .is("notification_sent_at", null);

  if (error) {
    console.error("[cron/notify-dates] query error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const now = Date.now();
  let sent = 0;
  const errors: string[] = [];

  for (const profile of profiles) {
    const cadenceDays = CADENCE_DAYS[profile.cadence ?? "weekly"] ?? 7;
    const revealedAt = new Date(profile.revealed_at as string).getTime();
    const nextAvailable = revealedAt + cadenceDays * 24 * 60 * 60 * 1000;

    // Not ready yet — skip
    if (now < nextAvailable) continue;

    // Resolve the user's email from auth.users via the admin API
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(profile.id as string);

    if (userError || !userData?.user?.email) {
      errors.push(`uid=${profile.id} reason=no_email`);
      continue;
    }

    const names = profile.partner_names as { partner1: string; partner2: string } | null;
    const partner1 = names?.partner1 ?? "there";
    const partner2 = names?.partner2 ?? "your partner";

    const { subject, html } = dateReadyEmail({ partner1, partner2 });

    const { error: sendError } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: userData.user.email,
      subject,
      html,
    });

    if (sendError) {
      errors.push(`uid=${profile.id} reason=${sendError.message}`);
      continue;
    }

    // Mark as notified so we don't send again this cycle
    await supabase
      .from("profiles")
      .update({ notification_sent_at: new Date().toISOString() })
      .eq("id", profile.id as string);

    sent++;
  }

  console.info(`[cron/notify-dates] sent=${sent} errors=${errors.length}`);
  if (errors.length) console.warn("[cron/notify-dates] errors:", errors);

  return NextResponse.json({ sent, errors });
}
