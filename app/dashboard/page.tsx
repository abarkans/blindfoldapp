import { redirect } from "next/navigation";
import { getClientAndUser } from "@/lib/supabase/get-client-and-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCoupleAccess, getPartnerInviteStatus } from "@/lib/partner-invites";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import { getUnitSystem } from "@/lib/get-unit-system";
import { signPlacePhotoUrl } from "@/lib/place-photo-token";
import DevPanel from "@/components/dev/DevPanel";
import { getDateHistory } from "@/app/actions/photo";

export default async function DashboardPage() {
  const { supabase, user } = await getClientAndUser();

  if (!user) redirect("/login");
  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  // Fetch profile + date idea in parallel (needed to render the home tab immediately).
  // Badges are only needed for the Progress tab — fire the query without awaiting so
  // the page shell can stream while badges resolve in the background.
  const [{ data: profile }, { data: latestDateIdea }] = await Promise.all([
    admin.from("profiles").select("id, partner_names, interests, constraints, plan_type, cadence, date_idea, date_teaser, last_lat, last_long, preferred_radius, onboarding_complete, revealed_at, total_rerolls_used, current_date_rerolled, date_accepted_at, reveal_owner_ready_at, reveal_partner_ready_at, partner_ping_sent_at, total_xp, dates_completed_count, subscription_ends_at, notification_sent_at, reminder_sent_at, checkin_owner_at, checkin_partner_at, checkin_owner_skipped, checkin_partner_skipped, total_checkins, email_notifications, created_at, updated_at").eq("id", access.profileId).single(),
    admin
      .from("date_ideas")
      .select("id, status")
      .eq("user_id", access.profileId)
      .in("status", ["pending", "revealed", "completed"])
      .order("revealed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const historyPromise = getDateHistory();

  const earnedBadgesPromise = (async () => {
    try {
      const { data } = await admin
        .from("user_badges")
        .select("earned_at, milestones(name, icon_emoji)")
        .eq("user_id", access.profileId)
        .order("earned_at", { ascending: true });
      return (data ?? []).map((row) => {
        const m = row.milestones as { name: string; icon_emoji: string } | null;
        return { name: m?.name ?? "", earned_at: row.earned_at };
      });
    } catch {
      return [] as { name: string; earned_at: string }[];
    }
  })();

  if (!profile?.onboarding_complete) redirect("/onboarding");
  const partnerInviteStatus = await getPartnerInviteStatus(admin, access.profileId);

  // Inject a short-lived signed URL for the place photo so the
  // <Image> optimizer can fetch /api/place-photo without a session
  // cookie (it doesn't forward cookies on its outbound fetches).
  // Failure here must not 500 the dashboard — log + skip so the
  // page still renders without the image.
  const dateIdea = profile.date_idea as { type?: string; photo_name?: string | null } | null;
  if (dateIdea && dateIdea.type === "venue" && dateIdea.photo_name) {
    try {
      (profile.date_idea as Record<string, unknown>).signed_photo_url = signPlacePhotoUrl(dateIdea.photo_name);
    } catch (err) {
      console.error(`[dashboard] sign place photo failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const unitSystem = await getUnitSystem();

  return (
    <>
      <DashboardTabs
        profile={profile}
        earnedBadgesPromise={earnedBadgesPromise}
        historyPromise={historyPromise}
        isDateCompleted={latestDateIdea?.status === "completed" || (!profile.date_idea && !latestDateIdea)}
        dateIdeaId={latestDateIdea?.id ?? null}
        myUserId={user.id}
        profileId={access.profileId}
        unitSystem={unitSystem}
        memberRole={access.role}
        partnerInviteStatus={partnerInviteStatus}
      />
      <DevPanel />
    </>
  );
}
