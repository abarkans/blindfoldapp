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
  <title>Contact form submission</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d14;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:24px;font-weight:700;background:linear-gradient(to right,#ec4899,#f43f5e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#ec4899;">
                blindfold
              </span>
            </td>
          </tr>

          <tr>
            <td style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:28px;">

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
