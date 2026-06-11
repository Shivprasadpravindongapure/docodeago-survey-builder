import type { User } from "../../web/src/types";

export interface Bindings {
  DB: D1Database;
  SESSIONS: KVNamespace;
  SMTP_EMAIL: string;
  SMTP_PASS: string;
  GEMINI_API_KEY: string;
}

export interface Variables {
  user: User;
}

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
