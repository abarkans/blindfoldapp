function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function contactEmail({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}): { subject: string; html: string } {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

  return {
    subject: `Contact: ${safeName}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="only dark" />
  <meta name="supported-color-schemes" content="only dark" />
  <title>Contact form submission</title>
  <style>:root { color-scheme: only dark; }</style>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL ?? "https://blindfolddate.com"}/logo.png" alt="blindfold" width="140" height="28" style="display:block;border:0;outline:none;text-decoration:none;" />
            </td>
          </tr>

          <tr>
            <td style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.16);border-radius:24px;box-shadow:0 28px 80px rgba(0,0,0,0.45);padding:28px;">

              <h1 style="margin:0 0 20px;font-size:18px;font-weight:700;color:#ffffff;">
                New contact form message
              </h1>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px;">
                    <span style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.4);">From</span><br />
                    <span style="font-size:15px;color:#ffffff;">${safeName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:20px;">
                    <span style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.4);">Reply to</span><br />
                    <a href="mailto:${safeEmail}" style="font-size:15px;color:#ec4899;text-decoration:none;">${safeEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;">
                    <span style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.4);">Message</span><br />
                    <p style="margin:8px 0 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.85);">${safeMessage}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);">
                BlindfoldDate contact form · ${new Date().getFullYear()}
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
