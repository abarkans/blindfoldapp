import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ConfirmDeleteClient from "@/components/account/ConfirmDeleteClient";

export const metadata = {
  title: "Confirm account deletion | BlindfoldDate",
  robots: { index: false },
};

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export default async function ConfirmDeletePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Require active session — the email link is only useful to a logged-in
  // user. Show an explicit "log in first" state instead of auto-redirecting
  // so the token in the URL doesn't get swept through a redirect chain.
  if (!user) {
    return (
      <ConfirmDeleteClient
        state="login_required"
        message="Please sign in to confirm your account deletion, then click the link in your email again."
      />
    );
  }

  if (!t || typeof t !== "string" || t.length < 32) {
    return (
      <ConfirmDeleteClient
        state="invalid"
        message="This confirmation link is invalid."
      />
    );
  }

  // Validate the token at render time so an expired or unknown link shows
  // a clear error before the user clicks Confirm. The actual deletion
  // re-validates inside the server action — defense in depth against a
  // race where a token expires between page render and click.
  const admin = createAdminClient();
  const tokenHash = sha256Hex(t);
  const { data: row } = await admin
    .from("account_deletion_tokens")
    .select("user_id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!row) {
    return (
      <ConfirmDeleteClient
        state="invalid"
        message="This confirmation link is invalid or has already been used."
      />
    );
  }

  if (row.user_id !== user.id) {
    // Don't reveal whether the token belongs to a different account vs.
    // doesn't exist. Same generic message as above.
    return (
      <ConfirmDeleteClient
        state="invalid"
        message="This confirmation link is invalid or has already been used."
      />
    );
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return (
      <ConfirmDeleteClient
        state="expired"
        message="This confirmation link has expired. Request a new one from Settings."
      />
    );
  }

  return <ConfirmDeleteClient state="ready" token={t} email={user.email ?? ""} />;
}
