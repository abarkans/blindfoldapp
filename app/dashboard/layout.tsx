import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Minimal layout — only handles auth guard.
// Header + bottom nav are owned by DashboardTabs (client component)
// so tab switching is instant with no server round-trips.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <>{children}</>;
}
