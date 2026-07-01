interface WelcomeEmailProps {
  partner1: string;
  partner2: string | null | undefined;
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

export function welcomeEmail({
  partner1,
  partner2,
  unsubscribeUrl,
}: WelcomeEmailProps): { subject: string; html: string } {
  const safePartner1 = escapeHtml(partner1);
  const hasPartner = Boolean(partner2?.trim());
  const safePartner2 = hasPartner ? escapeHtml(partner2!.trim()) : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://blindfolddate.com";

  const heading = hasPartner
    ? `${safePartner1} &amp; ${safePartner2}, your first mystery date is ready.`
    : `${safePartner1}, your first mystery date is ready.`;

  return {
    subject: `${partner1}, your first mystery date is ready 🎭`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="only dark" />
  <meta name="supported-color-schemes" content="only dark" />
  <title>Your first mystery date is ready</title>
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
            <td style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.16);border-radius:24px;box-shadow:0 28px 80px rgba(0,0,0,0.45);padding:32px 28px;">

              <!-- Emoji -->
              <p style="margin:0 0 16px;font-size:42px;text-align:center;">&#127917;</p>

              <!-- Heading -->
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;line-height:1.25;color:#ffffff;text-align:center;">
                ${heading}
              </h1>

              <!-- Intro -->
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.62);text-align:center;">
                We've planned something for you — it's waiting in the app. Here's how it all works.
              </p>

              <!-- Feature: Reveal -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                <tr>
                  <td width="36" valign="top" style="padding-top:2px;font-size:20px;">&#128269;</td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#ffffff;">Reveal when you're ready</p>
                    <p style="margin:0;font-size:13px;line-height:1.5;color:rgba(255,255,255,0.5);">Your date is blurred until you tap Reveal. No spoilers — the surprise is the point.</p>
                  </td>
                </tr>
              </table>

              <!-- Feature: Complete -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                <tr>
                  <td width="36" valign="top" style="padding-top:2px;font-size:20px;">&#128248;</td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#ffffff;">Capture the moment</p>
                    <p style="margin:0;font-size:13px;line-height:1.5;color:rgba(255,255,255,0.5);">Check in with a photo to complete your date — whether you're out or staying in. You'll earn XP and unlock badges along the way.</p>
                  </td>
                </tr>
              </table>

              <!-- Feature: Cadence -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="36" valign="top" style="padding-top:2px;font-size:20px;">&#128197;</td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#ffffff;">Dates on a schedule</p>
                    <p style="margin:0;font-size:13px;line-height:1.5;color:rgba(255,255,255,0.5);">Complete a date and a new mystery is planned for you automatically — no thinking required.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/dashboard"
                       style="display:inline-block;padding:14px 28px;background:#f43f5e;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:999px;">
                      Reveal your first date
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">
                You're receiving this because you just joined BlindfoldDate.<br />
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
