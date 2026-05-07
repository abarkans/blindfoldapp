import { redirect } from "next/navigation";
import { getClientAndUser } from "@/lib/supabase/get-client-and-user";
import PostHogIdentify from "@/components/dashboard/PostHogIdentify";

// Minimal layout — only handles auth guard.
// Header + bottom nav are owned by DashboardTabs (client component)
// so tab switching is instant with no server round-trips.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getClientAndUser();

  if (!user) redirect("/login");

  return (
    <>
      <PostHogIdentify userId={user.id} />
      {children}
    </>
  );
}
