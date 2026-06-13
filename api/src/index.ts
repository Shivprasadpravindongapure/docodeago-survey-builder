import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/auth";
import { authRouter } from "./routes/auth";
import { publicRouter } from "./routes/public";
import { responsesRouter } from "./routes/responses";
import { surveysRouter } from "./routes/surveys";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

// ── Public routes (no auth) ────────────────────────────────────────────────
// Health check — required by the starter spec, must be before CORS/auth
app.get("/api/health", (c) => c.json({ status: "ok" }));
app.get("/", (c) => c.json({ ok: true, service: "survey-builder-api" }));

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      if (!origin) return "*";
      if (
        origin.startsWith("http://localhost") ||
        origin.endsWith(".pages.dev") ||
        origin === "https://docodeago-survey-builder.pages.dev"
      ) {
        return origin;
      }
      return null;
    },
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);


// ── Auth middleware ────────────────────────────────────────────────────────
// Skips /api/auth and /api/public paths internally
app.use("/api/*", authMiddleware);

// ── Route mounts ───────────────────────────────────────────────────────────
app.route("/api/auth", authRouter);
app.route("/api/public", publicRouter);
app.route("/api/surveys", surveysRouter);
app.route("/api/surveys", responsesRouter);

export default app;
