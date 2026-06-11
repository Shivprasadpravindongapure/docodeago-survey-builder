export interface EmailBindings {
  SMTP_EMAIL: string;
  SMTP_PASS: string;
}

/**
 * Send a magic link email.
 *
 * In production (Cloudflare Workers): Uses MailChannels API (free, CF partner).
 * In local dev: Falls back to console logging since MailChannels requires a live Worker.
 *
 * Gmail App Password stored as SMTP_PASS secret, Gmail address as SMTP_EMAIL.
 */
export async function sendMagicLinkEmail(
  email: string,
  token: string,
  env: EmailBindings,
): Promise<void> {
  const verifyUrl = `https://docodeago-survey-builder.pages.dev/verify?token=${token}`;
  const fromEmail = env.SMTP_EMAIL ?? "prasaddongapure7660@gmail.com";
  const fromName = "FormCraft Survey Builder";

  const subject = "Your FormCraft magic sign-in link";
  const htmlBody = buildEmailHtml(verifyUrl, token);
  const textBody = `Sign in to FormCraft\n\nClick this link to sign in:\n${verifyUrl}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this, ignore this email.`;

  // Log in all environments for local dev debugging
  console.log("=================================================");
  console.log("📧 MAGIC LINK EMAIL");
  console.log(`To: ${email}`);
  console.log(`Token: ${token}`);
  console.log(`Verify URL: ${verifyUrl}`);
  console.log("=================================================");

  // Try MailChannels (works in deployed CF Workers)
  try {
    const payload = {
      personalizations: [
        {
          to: [{ email }],
        },
      ],
      from: {
        email: fromEmail,
        name: fromName,
      },
      reply_to: {
        email: fromEmail,
        name: fromName,
      },
      subject,
      content: [
        { type: "text/plain", value: textBody },
        { type: "text/html", value: htmlBody },
      ],
    };

    const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("MailChannels error:", res.status, err);
    } else {
      console.log(`✅ Email sent to ${email} via MailChannels`);
    }
  } catch (err) {
    console.error("Email send failed (MailChannels):", err);
    // In dev, the URL is still logged above so the user can manually verify
  }
}

function buildEmailHtml(verifyUrl: string, token: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to FormCraft</title>
</head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background:#0f0f13;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" role="presentation"
          style="background:#17171f;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:32px 40px;text-align:center;">
              <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0;letter-spacing:-0.02em;">
                FormCraft
              </h1>
              <p style="color:rgba(255,255,255,0.75);font-size:14px;margin:6px 0 0;">
                Survey Builder
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#f0f0f5;font-size:20px;font-weight:700;margin:0 0 12px;">
                Your magic sign-in link ✨
              </h2>
              <p style="color:#a0a0b8;font-size:15px;line-height:1.6;margin:0 0 28px;">
                Click the button below to sign in to your FormCraft account.
                This link expires in <strong style="color:#f0f0f5;">15 minutes</strong>.
              </p>

              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="border-radius:10px;background:#6366f1;">
                    <a href="${verifyUrl}"
                      style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;
                             font-weight:600;text-decoration:none;border-radius:10px;">
                      Sign in to FormCraft →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#6b6b85;font-size:13px;margin:28px 0 0;line-height:1.5;">
                Or copy this link into your browser:<br/>
                <span style="color:#6366f1;word-break:break-all;">${verifyUrl}</span>
              </p>

              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:28px 0;"/>

              <p style="color:#6b6b85;font-size:12px;margin:0;line-height:1.5;">
                For local dev — token: <code style="background:#1e1e2a;padding:2px 6px;border-radius:4px;color:#6366f1;">${token}</code><br/>
                If you didn't request this sign-in link, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f0f13;padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="color:#6b6b85;font-size:12px;margin:0;">
                © 2026 FormCraft · Powered by Cloudflare Workers
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
