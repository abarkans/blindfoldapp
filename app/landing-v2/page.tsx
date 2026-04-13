import { redirect } from "next/navigation";

// This design is now the main landing page at /
export default function LandingV2Redirect() {
  redirect("/");
}
