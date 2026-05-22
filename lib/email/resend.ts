import { Resend } from "resend";

// Lazy singleton — avoids throwing at module load time when RESEND_API_KEY
// is absent (e.g. preview branch builds without the env var configured).
// The key is validated at call-time instead, where a clear runtime error
// surfaces in logs rather than crashing the build.
let _resend: Resend | null = null;
export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Keep a named export for callsites that destructure { resend }
export const resend = {
  emails: {
    send: (...args: Parameters<Resend["emails"]["send"]>) =>
      getResend().emails.send(...args),
  },
};

// Prod must set RESEND_FROM_ADDRESS to a verified-domain sender.
// The resend.dev fallback is sandbox-only — Resend rejects it for any
// recipient other than the account owner, which silently breaks
// transactional flows (delete-account confirmation etc) for real users.
export const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ?? "BlindfoldDate <onboarding@resend.dev>";
