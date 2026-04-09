import { redirect } from "next/navigation";

// Progress is now a tab inside the dashboard client component.
// Redirect any direct visits back to the dashboard.
export default function ProgressPage() {
  redirect("/dashboard");
}
