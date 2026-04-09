import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DateCard from "@/components/dashboard/DateCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: currentDateIdea }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("date_ideas")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "revealed")
      .order("revealed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile?.onboarding_complete) redirect("/onboarding");

  const cadenceLabel: Record<string, string> = {
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
    spontaneous: "Spontaneous",
  };

  const isDateCompleted = !currentDateIdea;

  return (
    <div>
      {/* Tab heading */}
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">Your next adventure</h2>
        <p className="text-white/40 text-sm mt-1">
          A mystery date is waiting for you two.
        </p>
      </div>

      {/* Date card */}
      <DateCard
        partnerNames={profile.partner_names}
        cadence={profile.cadence}
        revealedAt={profile.revealed_at ?? null}
        dateIdea={profile.date_idea as Parameters<typeof DateCard>[0]["dateIdea"]}
        isDateCompleted={isDateCompleted}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        {[
          { label: "Budget", value: `€${profile.constraints.budget_max}` },
          {
            label: "Frequency",
            value: cadenceLabel[profile.cadence] ?? profile.cadence,
          },
          { label: "Interests", value: `${profile.interests.length} picks` },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white/5 border border-white/8 rounded-2xl p-3 text-center"
          >
            <p className="text-white font-bold text-sm">{value}</p>
            <p className="text-white/40 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
