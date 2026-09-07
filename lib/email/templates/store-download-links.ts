interface StoreDownloadLinksEmailProps {
  items: { productName: string; claimUrl: string }[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sent when a buyer asks for their links again. One email covering every
 * purchase under that address — a separate email per purchase would look like
 * a mail loop to both the recipient and their spam filter.
 */
export function storeDownloadLinksEmail({
  items,
}: StoreDownloadLinksEmailProps): { subject: string; html: string } {
  const rows = items
    .map(({ productName, claimUrl }) => {
      const safeName = escapeHtml(productName);
      const safeUrl = escapeHtml(claimUrl);
      return `<tr>
                <td style="padding:0 0 20px;">
                  <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#ffffff;">${safeName}</p>
                  <a href="${safeUrl}" style="font-size:13px;color:#f43f5e;text-decoration:none;word-break:break-all;">${safeUrl}</a>
                </td>
              </tr>`;
    })
    .join("");

  const plural = items.length === 1 ? "download" : "downloads";

  return {
    subject: `Your BlindfoldDate ${plural}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="only dark" />
  <meta name="supported-color-schemes" content="only dark" />
  <title>Your downloads</title>
  <style>:root { color-scheme: only dark; }</style>
</head>
<body style="margin:0;padding:0;background-color:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0b0b0b;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px 32px;">
          <tr>
            <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#ffffff;font-weight:700;">Here are your ${plural}.</h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.62);">
                Everything bought with this email address. These links replace any older ones we sent — those no longer work.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
              <p style="margin:8px 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.32);">
                Didn't ask for this? Someone typed your address on our site. Nothing was charged and nothing changed — you can ignore this email.
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
