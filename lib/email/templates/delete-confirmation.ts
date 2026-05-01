interface DeleteConfirmationEmailProps {
  confirmUrl: string;
  expiresInMinutes: number;
}

export function deleteConfirmationEmail({
  confirmUrl,
  expiresInMinutes,
}: DeleteConfirmationEmailProps): {
  subject: string;
  html: string;
} {
  return {
    subject: "Confirm your BlindfoldDate account deletion",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm account deletion</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d14;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:400px;">

          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:28px;font-weight:700;background:linear-gradient(to right,#ec4899,#f43f5e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#ec4899;">
                blindfold
              </span>
            </td>
          </tr>

          <tr>
            <td style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px 28px;">

              <p style="margin:0 0 16px;text-align:center;font-size:48px;">⚠️</p>

              <h1 style="margin:0 0 12px;text-align:center;font-size:22px;font-weight:700;color:#ffffff;">
                Confirm account deletion
              </h1>

              <p style="margin:0 0 20px;text-align:center;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.6);">
                We received a request to permanently delete your BlindfoldDate account.
                This action cannot be undone — all your data, dates, and progress will be removed.
              </p>

              <p style="margin:0 0 28px;text-align:center;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.45);">
                This link expires in ${expiresInMinutes} minutes.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${confirmUrl}"
                       style="display:inline-block;padding:14px 32px;background:linear-gradient(to right,#ec4899,#f43f5e);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px;">
                      Confirm deletion
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;text-align:center;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.45);">
                If you didn't request this, ignore this email and consider changing your password.
                Your account will remain active.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">
                © ${new Date().getFullYear()} BlindfoldDate
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
