import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import {
  consumeMagicLink,
  createMagicLink,
  createSession,
  deleteSession,
  getSessionUser,
  upsertUser,
} from "../lib/db";
import { sendMagicLinkEmail } from "../lib/email";
import type { AppEnv } from "../types";

const authRouter = new Hono<AppEnv>();

// POST /magic-link
authRouter.post(
  "/magic-link",
  zValidator("json", z.object({ email: z.string().email("Invalid email address") })),
  async (c) => {
    const { email } = c.req.valid("json");

    const token = await createMagicLink(c.env.DB, email);
    await sendMagicLinkEmail(email, token, c.env);

    // Build the verify URL. When called from workers.dev (CORS request from Pages),
    // redirect to the Pages frontend URL.
    const requestOrigin = new URL(c.req.url).origin;
    const frontendOrigin = requestOrigin.includes("workers.dev")
      ? "https://docodeago-survey-builder.pages.dev"
      : requestOrigin;
    const verifyUrl = `${frontendOrigin}/verify?token=${token}`;

    // Return inside `data` so it matches ApiResponse<{verifyUrl:string}> shape
    return c.json({ ok: true, data: { verifyUrl } });
  },
);

// POST /verify
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

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const sessionToken = await createSession(c.env.DB, user.id, expiresAt);
    const isHttps = new URL(c.req.url).protocol === "https:";

    setCookie(c, "session", sessionToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "Lax",
      path: "/",
      expires: expiresAt,
    });

    return c.json({ ok: true, data: user });
  },
);

// GET /me
authRouter.get("/me", async (c) => {
  const token = getCookie(c, "session");
  if (!token) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  const user = await getSessionUser(c.env.DB, token);
  if (!user) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  return c.json({ ok: true, data: user });
});

// POST /logout
authRouter.post("/logout", async (c) => {
  const token = getCookie(c, "session");
  if (token) {
    await deleteSession(c.env.DB, token);
  }

  deleteCookie(c, "session", { path: "/" });
  return c.json({ ok: true });
});

export { authRouter };
