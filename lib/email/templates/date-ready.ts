interface DateReadyEmailProps {
  partner1: string;
  partner2: string;
}

export function dateReadyEmail({ partner1, partner2 }: DateReadyEmailProps): {
  subject: string;
  html: string;
} {
  return {
    subject: "Your next date is ready to reveal 💝",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your date is ready</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d14;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:400px;">

          <!-- Logo / wordmark -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:28px;font-weight:700;background:linear-gradient(to right,#ec4899,#f43f5e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#ec4899;">
                blindfold
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px 28px;">

              <!-- Emoji -->
              <p style="margin:0 0 16px;text-align:center;font-size:48px;">💝</p>

              <!-- Heading -->
              <h1 style="margin:0 0 12px;text-align:center;font-size:22px;font-weight:700;color:#ffffff;">
                Your date is ready, ${partner1} &amp; ${partner2}!
              </h1>

              <!-- Body -->
              <p style="margin:0 0 28px;text-align:center;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.6);">
                A mystery date has been lined up for you. Head over to Blindfold to reveal where the night takes you.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://blindfoldapp.vercel.app"}/dashboard"
                       style="display:inline-block;padding:14px 32px;background:linear-gradient(to right,#ec4899,#f43f5e);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px;">
                      Reveal my date
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
                You're receiving this because you have a Blindfold account.<br />
                © ${new Date().getFullYear()} Blindfold
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
