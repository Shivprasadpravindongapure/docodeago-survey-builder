import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { User } from "../../../web/src/types";
import { getSessionUser } from "../lib/db";
import type { AppEnv } from "../types";

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const path = new URL(c.req.url).pathname;

  // Skip auth for public and auth paths
  if (path.startsWith("/api/auth") || path.startsWith("/api/public")) {
    await next();
    return;
  }

  const token = getCookie(c, "session");
  if (!token) {
    c.res = c.json({ ok: false, error: "Unauthorized" } as const, 401);
    return;
  }

  const user: User | null = await getSessionUser(c.env.DB, token);
  if (!user) {
    c.res = c.json({ ok: false, error: "Unauthorized" } as const, 401);
    return;
  }

  c.set("user", user);
  await next();
};
