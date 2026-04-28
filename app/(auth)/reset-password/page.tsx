import type { Metadata } from "next";
import ResetPasswordClient from "@/components/auth/ResetPasswordClient";

export const metadata: Metadata = {
  title: "Reset Password — BlindfoldDate",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
