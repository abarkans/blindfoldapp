import { redirect } from "next/navigation";

// Settings is now a tab inside the dashboard client component.
// Redirect any direct visits back to the dashboard.
export default function SettingsPage() {
  redirect("/dashboard");
}
