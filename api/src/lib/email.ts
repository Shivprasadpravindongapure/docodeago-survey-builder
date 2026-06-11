import type { Bindings } from "../types";

const APP_NAME = "Survey-Builders";
const PAGES_URL = "https://docodeago-survey-builder.pages.dev";

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  apiKey: string,
): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // onboarding@resend.dev works on free tier without domain verification
      from: `${APP_NAME} <onboarding@resend.dev>`,
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error(`[email] Resend error ${res.status}: ${err}`);
  }
  return res.ok;
}

async function sendViaMailChannels(
  to: string,
  subject: string,
  html: string,
  senderEmail: string,
): Promise<boolean> {
  const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: senderEmail, name: APP_NAME },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });
  return res.ok || res.status === 202;
}

export async function sendMagicLinkEmail(
  to: string,
  token: string,
  env: Bindings,
): Promise<void> {
  const verifyUrl = `${PAGES_URL}/verify?token=${token}`;
  const subject = `Sign in to ${APP_NAME}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Sign in to ${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:48px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background:#1a1a2e;border-radius:20px;border:1px solid #2a2a4a;overflow:hidden;max-width:560px;width:100%">

        <!-- Header gradient -->
        <tr><td style="background:linear-gradient(135deg,#6c63ff 0%,#4a40d4 100%);padding:36px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px">
            📋 ${APP_NAME}
          </h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:13px;letter-spacing:0.3px">
            Branded Survey Builder
          </p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px">
          <h2 style="margin:0 0 12px;color:#fff;font-size:20px;font-weight:700">
            Your sign-in link ✨
          </h2>
          <p style="margin:0 0 28px;color:#a0a0c0;font-size:15px;line-height:1.7">
            Click the button below to sign in to <strong style="color:#fff">${APP_NAME}</strong>.
            This link expires in <strong style="color:#fff">15 minutes</strong> and can only be used once.
          </p>

          <!-- CTA button -->
          <div style="text-align:center;margin:32px 0">
            <a href="${verifyUrl}"
               style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#4a40d4);
                      color:#fff;text-decoration:none;font-weight:700;font-size:16px;
                      padding:18px 48px;border-radius:14px;letter-spacing:0.3px;
                      box-shadow:0 8px 32px rgba(108,99,255,0.35)">
              Sign in now →
            </a>
          </div>

          <!-- Fallback URL -->
          <p style="margin:24px 0 0;color:#606080;font-size:13px;line-height:1.8">
            Button not working? Copy and paste this link into your browser:<br/>
            <a href="${verifyUrl}" style="color:#6c63ff;word-break:break-all;font-size:12px">${verifyUrl}</a>
          </p>

          <hr style="border:none;border-top:1px solid #2a2a4a;margin:32px 0"/>
          <p style="margin:0;color:#505070;font-size:12px;line-height:1.6">
            This sign-in link was requested for <strong style="color:#707090">${to}</strong>.
            If you didn't request this, you can safely ignore it.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#111128;padding:20px 40px;text-align:center">
          <p style="margin:0;color:#404060;font-size:11px">
            © 2025 ${APP_NAME} — Powered by FormCraft
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // 1. Try Resend (primary — free tier, reliable in Workers)
  if (env.RESEND_API_KEY) {
    const sent = await sendViaResend(to, subject, html, env.RESEND_API_KEY);
    if (sent) {
      console.log(`[email] ✅ Sent via Resend to ${to}`);
      return;
    }
    console.warn("[email] Resend failed, falling back to MailChannels...");
  }

  // 2. Fallback to MailChannels
  if (env.SMTP_EMAIL) {
    const sent = await sendViaMailChannels(to, subject, html, env.SMTP_EMAIL);
    if (sent) {
      console.log(`[email] ✅ Sent via MailChannels to ${to}`);
      return;
    }
    console.warn("[email] MailChannels also failed.");
  }

  // 3. Always log the link — visible in Cloudflare Worker logs dashboard
  console.log(`[email] 🔗 MAGIC LINK for ${to} → ${verifyUrl}`);
}
