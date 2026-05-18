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
  <meta name="color-scheme" content="only dark" />
  <meta name="supported-color-schemes" content="only dark" />
  <title>Confirm account deletion</title>
  <style>:root { color-scheme: only dark; }</style>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:400px;">

          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL ?? "https://blindfolddate.com"}/logo.png" alt="blindfold" width="140" height="28" style="display:block;border:0;outline:none;text-decoration:none;" />
            </td>
          </tr>

          <tr>
            <td style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.16);border-radius:24px;box-shadow:0 28px 80px rgba(0,0,0,0.45);padding:32px 28px;">

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
