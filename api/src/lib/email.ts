export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  // In production, replace this with a real email service (e.g., Resend, SendGrid).
  // For local dev: copy the token from Wrangler console and visit /verify?token=<token>
  console.log("=================================================");
  console.log("MAGIC LINK EMAIL");
  console.log(`To: ${email}`);
  console.log(`Token: ${token}`);
  console.log(`URL: http://localhost:5173/verify?token=${token}`);
  console.log("=================================================");
}
