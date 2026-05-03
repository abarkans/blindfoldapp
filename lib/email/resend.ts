import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// Prod must set RESEND_FROM_ADDRESS to a verified-domain sender.
// The resend.dev fallback is sandbox-only — Resend rejects it for any
// recipient other than the account owner, which silently breaks
// transactional flows (delete-account confirmation etc) for real users.
export const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ?? "BlindfoldDate <onboarding@resend.dev>";
