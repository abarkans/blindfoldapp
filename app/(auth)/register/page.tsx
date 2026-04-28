import type { Metadata } from "next";
import RegisterClient from "@/components/auth/RegisterClient";

export const metadata: Metadata = {
  title: "Create Account — BlindfoldDate",
  robots: { index: false },
};

export default function RegisterPage() {
  return <RegisterClient />;
}
