import type { User } from "../../web/src/types";

export interface Bindings {
  DB: D1Database;
  SESSIONS: KVNamespace;
}

export interface Variables {
  user: User;
}

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
