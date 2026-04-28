import type { Metadata } from "next";
import LoginClient from "@/components/auth/LoginClient";

export const metadata: Metadata = {
  title: "Sign In — BlindfoldDate",
  robots: { index: false },
};

export default function LoginPage() {
  return <LoginClient />;
}
