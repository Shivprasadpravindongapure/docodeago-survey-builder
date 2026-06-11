import type { Bindings } from "../types";

const APP_NAME = "Survey-Builders";
const PAGES_URL = "https://docodeago-survey-builder.pages.dev";
const SENDER_EMAIL = "prasaddongapure7660@gmail.com";

// ── Brevo (primary — 300 emails/day free, any recipient) ──────────────────
async function sendViaBrevo(
  to: string,
  subject: string,
  html: string,
  apiKey: string,
): Promise<boolean> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: APP_NAME, email: SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error(`[email] Brevo error ${res.status}: ${err}`);
  }
  return res.ok || res.status === 201;
}

// ── Resend (fallback — 100 emails/day, only own email on free tier) ────────
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
      from: `${APP_NAME} <onboarding@resend.dev>`,
      to: [to],
      subject,
      html,
    }),
  });
  return res.ok;
}

// ── Email HTML template ────────────────────────────────────────────────────
function buildHtml(to: string, verifyUrl: string): string {
  return `<!DOCTYPE html>
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

        <tr><td style="background:linear-gradient(135deg,#6c63ff 0%,#4a40d4 100%);padding:36px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px">
            📋 ${APP_NAME}
          </h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:13px">Branded Survey Builder</p>
        </td></tr>

        <tr><td style="padding:40px">
          <h2 style="margin:0 0 12px;color:#fff;font-size:20px;font-weight:700">Your sign-in link ✨</h2>
          <p style="margin:0 0 28px;color:#a0a0c0;font-size:15px;line-height:1.7">
            Click the button below to sign in to <strong style="color:#fff">${APP_NAME}</strong>.
            This link expires in <strong style="color:#fff">15 minutes</strong> and can only be used once.
          </p>

          <div style="text-align:center;margin:32px 0">
            <a href="${verifyUrl}"
               style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#4a40d4);
                      color:#fff;text-decoration:none;font-weight:700;font-size:16px;
                      padding:18px 48px;border-radius:14px;letter-spacing:0.3px;
                      box-shadow:0 8px 32px rgba(108,99,255,0.35)">
              Sign in to ${APP_NAME} →
            </a>
          </div>

          <p style="margin:24px 0 0;color:#606080;font-size:12px;line-height:1.8">
            Button not working? Copy and paste:<br/>
            <a href="${verifyUrl}" style="color:#6c63ff;word-break:break-all">${verifyUrl}</a>
          </p>

          <hr style="border:none;border-top:1px solid #2a2a4a;margin:28px 0"/>
          <p style="margin:0;color:#505070;font-size:12px">
            Requested for <strong style="color:#707090">${to}</strong>. Didn't request this? Ignore safely.
          </p>
        </td></tr>

        <tr><td style="background:#111128;padding:16px 40px;text-align:center">
          <p style="margin:0;color:#404060;font-size:11px">© 2025 ${APP_NAME}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Main export ────────────────────────────────────────────────────────────
export async function sendMagicLinkEmail(
  to: string,
  token: string,
  env: Bindings,
): Promise<void> {
  const verifyUrl = `${PAGES_URL}/verify?token=${token}`;
  const subject = `Sign in to ${APP_NAME}`;
  const html = buildHtml(to, verifyUrl);

  // 1. Brevo — primary (free, any recipient, 300/day)
  if (env.BREVO_API_KEY) {
    const sent = await sendViaBrevo(to, subject, html, env.BREVO_API_KEY);
    if (sent) {
      console.log(`[email] ✅ Sent via Brevo → ${to}`);
      return;
    }
    console.warn("[email] Brevo failed, trying Resend...");
  }

  // 2. Resend — fallback (free but only own email without domain)
  if (env.RESEND_API_KEY) {
    const sent = await sendViaResend(to, subject, html, env.RESEND_API_KEY);
    if (sent) {
      console.log(`[email] ✅ Sent via Resend → ${to}`);
      return;
    }
    console.warn("[email] Resend failed.");
  }

  // 3. Always log — visible in Cloudflare Worker logs
  console.log(`[email] 🔗 MAGIC LINK for ${to} → ${verifyUrl}`);
}
