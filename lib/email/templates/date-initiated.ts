interface DateInitiatedEmailProps {
  partnerName: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function dateInitiatedEmail({
  partnerName,
}: DateInitiatedEmailProps): { subject: string; html: string } {
  const safePartner = escapeHtml(partnerName || "Your partner");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    subject: `${safePartner} initiated a date night`,
    html: `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background-color:#0d0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d14;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;">
        <tr><td style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:32px 28px;text-align:center;">
          <p style="margin:0 0 16px;font-size:42px;">&#10024;</p>
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:#ffffff;">${safePartner} initiated a date night.</h1>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.62);">
            The teaser is ready. Check the vibe, then tap I'm ready when you want the full reveal.
          </p>
          <a href="${appUrl}/dashboard?tab=date" style="display:inline-block;padding:14px 28px;background:#f43f5e;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:999px;">View teaser</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
