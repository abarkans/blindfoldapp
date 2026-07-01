interface DateCompletedEmailProps {
  partner1: string;
  partner2: string | null | undefined;
  datesCompleted: number;
  isTrialExpired: boolean;
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

export function dateCompletedEmail({
  partner1,
  partner2,
  datesCompleted,
  isTrialExpired,
  unsubscribeUrl,
}: DateCompletedEmailProps): { subject: string; html: string } {
  const safePartner1 = escapeHtml(partner1);
  const hasPartner = Boolean(partner2?.trim());
  const safePartner2 = hasPartner ? escapeHtml(partner2!.trim()) : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://blindfolddate.com";

  const heading = hasPartner
    ? `${safePartner1} &amp; ${safePartner2}, you actually did it. &#127881;`
    : `${safePartner1}, you actually did it. &#127881;`;


  const upsellHtml = isTrialExpired
    ? `
          <!-- Plus upsell -->
          <div style="margin:24px 0 0;padding:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:16px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:rgba(255,255,255,0.5);letter-spacing:0.04em;text-transform:uppercase;">Your trial is complete</p>
            <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:rgba(255,255,255,0.6);">Upgrade to Plus for unlimited dates, all interest categories, and a wider radius.</p>
            <a href="${appUrl}/dashboard"
               style="display:inline-block;padding:11px 22px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:999px;">
              Upgrade to Plus
            </a>
          </div>`
    : "";

  return {
    subject: `Date #${datesCompleted} complete &#127881;`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="only dark" />
  <meta name="supported-color-schemes" content="only dark" />
  <title>Date complete!</title>
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

              <!-- Heading -->
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;line-height:1.25;color:#ffffff;">
                ${heading}
              </h1>

              <!-- Body -->
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.62);">
                Date #${datesCompleted} in the books. Your next mystery date is ready whenever you are — keep the momentum going.
              </p>

              <!-- CTA -->
              <a href="${appUrl}/dashboard"
                 style="display:inline-block;padding:14px 28px;background:#f43f5e;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:999px;">
                Plan your next date
              </a>

              ${upsellHtml}

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
