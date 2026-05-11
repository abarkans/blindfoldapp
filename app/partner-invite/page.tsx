import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashInviteToken } from "@/lib/partner-invites";
import PartnerInviteAcceptButton from "@/components/partner-invite/PartnerInviteAcceptButton";
import PublicPageShell from "@/components/ui/PublicPageShell";

export const metadata: Metadata = {
  title: "Partner Invite - BlindfoldDate",
  robots: { index: false },
};

export default async function PartnerInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token || !/^[A-Za-z0-9_-]{20,256}$/.test(token)) {
    return (
      <InviteShell
        icon={<XCircle className="h-8 w-8 text-rose-400" />}
        title="Invite link is invalid"
        body="Ask your partner to send a fresh invitation from Settings."
      />
    );
  }

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("partner_invites")
    .select("invited_email")
    .eq("token_hash", hashInviteToken(token))
    .maybeSingle();
  const emailParam = invite?.invited_email
    ? `&email=${encodeURIComponent(invite.invited_email)}`
    : "";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <InviteShell
        icon={<Mail className="h-8 w-8 text-rose-400" />}
        title="Join your partner"
        body="Create an account or sign in with the invited email to connect your BlindfoldDate dashboard."
      >
        <div className="flex flex-col gap-3">
          <Link
            href={`/register?invite=${encodeURIComponent(token)}${emailParam}`}
            className="inline-flex h-12 items-center justify-center rounded-full bg-rose-500 px-6 text-sm font-bold text-white transition hover:bg-rose-400"
          >
            Create account
          </Link>
          <Link
            href={`/login?invite=${encodeURIComponent(token)}`}
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/18 bg-white/5 px-6 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </InviteShell>
    );
  }

  return (
    <InviteShell
      icon={<CheckCircle2 className="h-8 w-8 text-emerald-400" />}
      title="Accept partner invite"
      body={`You're signed in as ${user.email}. We'll connect this account if it matches the invited email.`}
    >
      <PartnerInviteAcceptButton token={token} />
    </InviteShell>
  );
}

function InviteShell({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <PublicPageShell>
    <main className="min-h-dvh px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-sm flex-col justify-center">
        <div className="rounded-3xl border border-white/16 bg-[#030303]/88 p-6 text-center shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/18 bg-white/[0.06]">
            {icon}
          </div>
          <h1 className="mb-2 text-2xl font-bold">{title}</h1>
          <p className="mb-6 text-sm leading-relaxed text-white/55">{body}</p>
          {children}
        </div>
      </div>
    </main>
    </PublicPageShell>
  );
}
