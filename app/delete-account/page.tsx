import type { Metadata } from "next";
import DeleteRequestForm from "@/components/account/DeleteRequestForm";

export const metadata: Metadata = {
  title: "Delete Account | BlindfoldDate",
  description: "Request permanent deletion of your BlindfoldDate account and all associated data.",
  robots: { index: false },
};

export default function DeleteAccountPage() {
  return <DeleteRequestForm />;
}
