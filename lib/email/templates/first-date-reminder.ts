interface FirstDateReminderEmailProps {
  partner1: string;
  partner2: string;
  unsubscribeUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function firstDateReminderEmail({
  partner1,
  partner2,
  unsubscribeUrl,
}: FirstDateReminderEmailProps): { subject: string; html: string } {
  const safePartner1 = escapeHtml(partner1);
  const safePartner2 = escapeHtml(partner2);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://blindfolddate.com";

  return {
    subject: "Your first mystery date is waiting ✨",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="only dark" />
  <meta name="supported-color-schemes" content="only dark" />
  <title>Your first mystery date is waiting</title>
  <style>:root { color-scheme: only dark; }</style>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="https://blindfolddate.com/logo.png" alt="blindfold" width="140" height="28" style="display:block;border:0;outline:none;text-decoration:none;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.16);border-radius:24px;box-shadow:0 28px 80px rgba(0,0,0,0.45);padding:32px 28px;text-align:center;">

              <!-- Emoji -->
              <p style="margin:0 0 16px;font-size:42px;">&#10024;</p>

              <!-- Heading -->
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;line-height:1.25;color:#ffffff;">
                ${safePartner1} &amp; ${safePartner2}, your first date is waiting!
              </h1>

              <!-- Body -->
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.62);">
                You're all set up — time to let us surprise you. Tap the button and we'll reveal your first mystery date night.
              </p>

              <!-- CTA -->
              <a href="${appUrl}/dashboard"
                 style="display:inline-block;padding:14px 28px;background:#f43f5e;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:999px;">
                Surprise us
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">
                You're receiving this because you have a BlindfoldDate account.<br />
                &copy; ${new Date().getFullYear()} BlindfoldDate &nbsp;&middot;&nbsp;
                <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}
