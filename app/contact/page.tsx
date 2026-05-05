import type { Metadata } from "next";
import ContactClient from "@/components/contact/ContactClient";

export const metadata: Metadata = {
  title: "Contact — BlindfoldDate",
  description: "Get in touch with the BlindfoldDate team.",
};

export default function ContactPage() {
  return <ContactClient />;
}
