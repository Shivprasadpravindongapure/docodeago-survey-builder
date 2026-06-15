import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../lib/crypto";
import {
  consumeMagicLink,
  createMagicLink,
  createSession,
  deleteSession,
  getSessionUser,
  getUserByEmail,
  setUserPassword,
  upsertUser,
} from "../lib/db";
import { sendMagicLinkEmail } from "../lib/email";
import type { AppEnv } from "../types";

const authRouter = new Hono<AppEnv>();

// Shared helper — set a 30-day cross-origin session cookie
async function issueSession(c: Context<AppEnv>, userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const sessionToken = await createSession(c.env.DB, userId, expiresAt);
  setCookie(c, "session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    expires: expiresAt,
  });
  return sessionToken;
}

// ── POST /check-email ── (step 1 of login: detect new vs returning user)
authRouter.post(
  "/check-email",
  zValidator("json", z.object({ email: z.string().email() })),
  async (c) => {
    const { email } = c.req.valid("json");
    const user = await getUserByEmail(c.env.DB, email);
    return c.json({
      ok: true,
      data: {
        exists: !!user,
        hasPassword: !!user?.password_hash,
      },
    });
  },
);

// ── POST /magic-link ── (new users OR returning users without password)
authRouter.post(
  "/magic-link",
  zValidator("json", z.object({ email: z.string().email("Invalid email address") })),
  async (c) => {
    const { email } = c.req.valid("json");
    const token = await createMagicLink(c.env.DB, email);
    await sendMagicLinkEmail(email, token, c.env);

    const requestOrigin = new URL(c.req.url).origin;
    const frontendOrigin = requestOrigin.includes("workers.dev")
      ? "https://docodeago-survey-builder.pages.dev"
      : requestOrigin;
    const verifyUrl = `${frontendOrigin}/verify?token=${token}`;

    return c.json({ ok: true, data: { verifyUrl } });
  },
);

// ── POST /login ── (returning users with a password set)
authRouter.post(
  "/login",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  ),
  async (c) => {
    const { email, password } = c.req.valid("json");
    const user = await getUserByEmail(c.env.DB, email);

    if (!user || !user.password_hash) {
      return c.json({ ok: false, error: "Invalid email or password" }, 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.json({ ok: false, error: "Invalid email or password" }, 401);
    }

    await issueSession(c, user.id);
    // Strip sensitive field
    const { password_hash: _, ...safeUser } = user;
    return c.json({ ok: true, data: safeUser });
  },
);

// ── POST /verify ── (consume magic link token → create session)
authRouter.post(
  "/verify",
  zValidator("json", z.object({ token: z.string().min(1, "Token is required") })),
  async (c) => {
    const { token } = c.req.valid("json");
    const email = await consumeMagicLink(c.env.DB, token);
    if (!email) {
      return c.json({ ok: false, error: "Invalid or expired token" }, 400);
    }

    const user = await upsertUser(c.env.DB, email);
    await issueSession(c, user.id);

    // Tell frontend whether this user has a password yet
    const fullUser = await getUserByEmail(c.env.DB, email);
    return c.json({
      ok: true,
      data: { ...user, hasPassword: !!fullUser?.password_hash },
    });
  },
);

// ── POST /set-password ── (authenticated — called after magic link login)
authRouter.post(
  "/set-password",
  zValidator(
    "json",
    z.object({
      password: z.string().min(8, "Password must be at least 8 characters"),
    }),
  ),
  async (c) => {
    const sessionToken = getCookie(c, "session");
    if (!sessionToken) return c.json({ ok: false, error: "Unauthorized" }, 401);

    const user = await getSessionUser(c.env.DB, sessionToken);
    if (!user) return c.json({ ok: false, error: "Unauthorized" }, 401);

    const hash = await hashPassword(c.req.valid("json").password);
    await setUserPassword(c.env.DB, user.id, hash);

    return c.json({ ok: true });
  },
);

// ── GET /me ──
authRouter.get("/me", async (c) => {
  const token = getCookie(c, "session");
  if (!token) return c.json({ ok: false, error: "Unauthorized" }, 401);

  const user = await getSessionUser(c.env.DB, token);
  if (!user) return c.json({ ok: false, error: "Unauthorized" }, 401);

  // Also return hasPassword so the dashboard can prompt if needed
  const fullUser = await getUserByEmail(c.env.DB, user.email);
  return c.json({ ok: true, data: { ...user, hasPassword: !!fullUser?.password_hash } });
});

// ── POST /logout ──
authRouter.post("/logout", async (c) => {
  const token = getCookie(c, "session");
  if (token) await deleteSession(c.env.DB, token);
  deleteCookie(c, "session", { path: "/" });
  return c.json({ ok: true });
});

export { authRouter };
