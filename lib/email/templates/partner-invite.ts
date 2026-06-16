interface PartnerInviteEmailProps {
  inviterName: string;
  inviteUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function partnerInviteEmail({
  inviterName,
  inviteUrl,
}: PartnerInviteEmailProps): { subject: string; html: string } {
  const safeInviter = escapeHtml(inviterName || "Your partner");
  const safeUrl = escapeHtml(inviteUrl);

  return {
    subject: `${safeInviter} invited you to BlindfoldDate`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="only dark" />
  <meta name="supported-color-schemes" content="only dark" />
  <title>Join your BlindfoldDate</title>
  <style>:root { color-scheme: only dark; }</style>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;">
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <img src="https://blindfolddate.com/logo.png" alt="blindfold" width="140" height="28" style="display:block;border:0;outline:none;text-decoration:none;" />
            </td>
          </tr>
          <tr>
            <td style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.16);border-radius:24px;box-shadow:0 28px 80px rgba(0,0,0,0.45);padding:32px 28px;">
              <p style="margin:0 0 16px;text-align:center;font-size:44px;">&#128140;</p>
              <h1 style="margin:0 0 12px;text-align:center;font-size:22px;line-height:1.25;font-weight:700;color:#ffffff;">
                ${safeInviter} wants to plan dates with you.
              </h1>
              <p style="margin:0 0 28px;text-align:center;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.62);">
                Join BlindfoldDate to reveal mystery dates together. The invitation expires in 24 hours.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;background:#f43f5e;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:999px;">
                      Accept invitation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:22px;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:rgba(255,255,255,0.3);">
                If you did not expect this invitation, you can ignore this email.<br />
                &copy; ${new Date().getFullYear()} BlindfoldDate
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
