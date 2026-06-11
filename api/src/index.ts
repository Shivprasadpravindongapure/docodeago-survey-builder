import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/auth";
import { authRouter } from "./routes/auth";
import { publicRouter } from "./routes/public";
import { responsesRouter } from "./routes/responses";
import { surveysRouter } from "./routes/surveys";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

// CORS — allow the Vite dev server and production domain
app.use(
  "/api/*",
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      "https://docodeago-survey-builder.pages.dev",
    ],
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

// Global auth middleware — skips /api/auth and /api/public paths internally
app.use("/api/*", authMiddleware);

// Route mounts
app.route("/api/auth", authRouter);
app.route("/api/public", publicRouter);
app.route("/api/surveys", surveysRouter);
app.route("/api/surveys", responsesRouter);

// Health check
app.get("/", (c) => c.json({ ok: true, service: "survey-builder-api" }));

export default app;
