import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";

interface Props {
  searchParams: Promise<{ uid?: string; token?: string }>;
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const { uid, token } = await searchParams;

  let status: "success" | "already" | "error" = "error";

  if (uid && token && verifyUnsubscribeToken(uid, token)) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("email_notifications")
      .eq("id", uid)
      .single();

    if (profile) {
      if (!profile.email_notifications) {
        status = "already";
      } else {
        const { error } = await admin
          .from("profiles")
          .update({ email_notifications: false })
          .eq("id", uid);
        status = error ? "error" : "success";
      }
    }
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://blindfoldapp.vercel.app";

  return (
    <div
      style={{
        margin: 0,
        backgroundColor: "#0d0d14",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
      }}
    >
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <p
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#ec4899",
            marginBottom: 32,
          }}
        >
          blindfold
        </p>

        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 18,
            padding: "32px 28px",
          }}
        >
          {status === "success" && (
            <>
              <p style={{ fontSize: 44, margin: "0 0 16px" }}>✅</p>
              <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>
                Unsubscribed
              </h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
                You won&apos;t receive date-ready notification emails. You can re-enable them anytime in Settings.
              </p>
            </>
          )}

          {status === "already" && (
            <>
              <p style={{ fontSize: 44, margin: "0 0 16px" }}>✓</p>
              <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>
                Already unsubscribed
              </h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
                Email notifications are already off for your account.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <p style={{ fontSize: 44, margin: "0 0 16px" }}>❌</p>
              <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>
                Invalid link
              </h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
                This unsubscribe link is invalid or has expired. Sign in to manage notification preferences in Settings.
              </p>
            </>
          )}

          <a
            href={`${APP_URL}/dashboard`}
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.75)",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              borderRadius: 999,
            }}
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
