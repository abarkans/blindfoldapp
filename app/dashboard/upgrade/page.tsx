import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  if (!session_id) redirect("/dashboard");

  const session = await stripe.checkout.sessions.retrieve(session_id);
  if (session.status !== "complete") redirect("/dashboard");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || session.metadata?.user_id !== user.id) redirect("/dashboard");

  await supabase
    .from("profiles")
    .update({
      plan_type: "subscription",
      stripe_customer_id: session.customer as string,
    })
    .eq("id", user.id);

  redirect("/dashboard");
}
