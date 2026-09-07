interface StorePurchaseEmailProps {
  productName: string;
  format: string;
  claimUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function storePurchaseEmail({
  productName,
  format,
  claimUrl,
}: StorePurchaseEmailProps): { subject: string; html: string } {
  const safeName = escapeHtml(productName);
  const safeFormat = escapeHtml(format);
  // claimUrl is built server-side from NEXT_PUBLIC_APP_URL plus a base64url
  // token, so it contains no user input — escaped anyway for consistency.
  const safeUrl = escapeHtml(claimUrl);

  return {
    subject: `Your download is ready: ${productName}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="only dark" />
  <meta name="supported-color-schemes" content="only dark" />
  <title>Your download is ready</title>
  <style>:root { color-scheme: only dark; }</style>
</head>
<body style="margin:0;padding:0;background-color:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0b0b0b;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px 32px;">
          <tr>
            <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#f43f5e;">Payment received</p>
              <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;color:#ffffff;font-weight:700;">${safeName} is yours.</h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.62);">
                ${safeFormat}. The link below opens your download page with every file in this purchase — keep this email, it works whenever you need them again.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="border-radius:999px;background-color:#f43f5e;">
                    <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Open my download</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.40);">
                Button not working? Paste this into your browser:
              </p>
              <p style="margin:0 0 28px;font-size:13px;line-height:1.6;word-break:break-all;">
                <a href="${safeUrl}" style="color:#f43f5e;text-decoration:none;">${safeUrl}</a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.32);">
                This link is private — anyone who has it can download your files, so don't forward it. Questions? Just reply to this email.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:rgba(255,255,255,0.28);">BlindfoldDate</p>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}
