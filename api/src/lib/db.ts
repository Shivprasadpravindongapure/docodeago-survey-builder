import type {
  MagicLink,
  Question,
  Response,
  ResponseAnswer,
  Survey,
  SurveyWithResponseCount,
  User,
} from "../../../web/src/types";
import { newId } from "./id";

// ─── Users ─────────────────────────────────────────────────────────────────

export async function upsertUser(db: D1Database, email: string): Promise<User> {
  const existing = await db
    .prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first<User>();

  if (existing) {
    return existing;
  }

  const id = newId();
  const now = new Date().toISOString();
  await db
    .prepare("INSERT INTO users (id, email, name, created_at) VALUES (?, ?, NULL, ?)")
    .bind(id, email, now)
    .run();

  const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<User>();

  if (!user) {
    throw new Error("Failed to create user");
  }

  return user;
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  return db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<User>() ?? null;
}

export async function getUserByEmail(
  db: D1Database,
  email: string,
): Promise<(User & { password_hash: string | null }) | null> {
  return (
    db
      .prepare("SELECT * FROM users WHERE email = ?")
      .bind(email)
      .first<User & { password_hash: string | null }>() ?? null
  );
}

export async function setUserPassword(
  db: D1Database,
  userId: string,
  passwordHash: string,
): Promise<void> {
  await db
    .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .bind(passwordHash, userId)
    .run();
}

// ─── Sessions ──────────────────────────────────────────────────────────────

export async function createSession(
  db: D1Database,
  userId: string,
  expiresAt: Date,
): Promise<string> {
  const token = newId();
  await db
    .prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(token, userId, expiresAt.toISOString())
    .run();
  return token;
}

export async function getSessionUser(db: D1Database, token: string): Promise<User | null> {
  const row = await db
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?
         AND s.expires_at > datetime('now')`,
    )
    .bind(token)
    .first<User>();
  return row ?? null;
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}

// ─── Magic Links ───────────────────────────────────────────────────────────

export async function createMagicLink(db: D1Database, email: string): Promise<string> {
  const token = newId();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await db
    .prepare("INSERT INTO magic_links (token, email, expires_at, used) VALUES (?, ?, ?, 0)")
    .bind(token, email, expiresAt.toISOString())
    .run();
  return token;
}

export async function consumeMagicLink(db: D1Database, token: string): Promise<string | null> {
  const link = await db
    .prepare(
      `SELECT * FROM magic_links
       WHERE token = ?
         AND used = 0
         AND expires_at > datetime('now')`,
    )
    .bind(token)
    .first<MagicLink>();

  if (!link) {
    return null;
  }

  await db.prepare("UPDATE magic_links SET used = 1 WHERE token = ?").bind(token).run();

  return link.email;
}

// ─── Surveys ───────────────────────────────────────────────────────────────

export async function createSurvey(db: D1Database, userId: string, title: string): Promise<Survey> {
  const id = newId();
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO surveys (id, user_id, title, brand_color, is_published, created_at, updated_at)
       VALUES (?, ?, ?, '#6366f1', 0, ?, ?)`,
    )
    .bind(id, userId, title, now, now)
    .run();

  const survey = await db.prepare("SELECT * FROM surveys WHERE id = ?").bind(id).first<Survey>();

  if (!survey) {
    throw new Error("Failed to create survey");
  }

  return survey;
}

export async function getSurveyById(db: D1Database, id: string): Promise<Survey | null> {
  return db.prepare("SELECT * FROM surveys WHERE id = ?").bind(id).first<Survey>() ?? null;
}

export async function listSurveysForUser(
  db: D1Database,
  userId: string,
): Promise<SurveyWithResponseCount[]> {
  const { results } = await db
    .prepare(
      `SELECT s.*,
              COUNT(DISTINCT q.id) AS question_count,
              COUNT(DISTINCT r.id) AS response_count
       FROM surveys s
       LEFT JOIN questions q ON q.survey_id = s.id
       LEFT JOIN responses r ON r.survey_id = s.id
       WHERE s.user_id = ?
       GROUP BY s.id
       ORDER BY s.updated_at DESC`,
    )
    .bind(userId)
    .all<SurveyWithResponseCount>();
  return results;
}

export async function updateSurvey(
  db: D1Database,
  id: string,
  fields: Partial<{
    title: string;
    description: string;
    brand_color: string;
    logo_url: string;
    is_published: number;
  }>,
): Promise<void> {
  const now = new Date().toISOString();
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);

  if (entries.length === 0) {
    return;
  }

  const setClauses = entries.map(([k]) => `${k} = ?`).join(", ");
  const values = entries.map(([, v]) => v);

  await db
    .prepare(`UPDATE surveys SET ${setClauses}, updated_at = ? WHERE id = ?`)
    .bind(...values, now, id)
    .run();
}

export async function deleteSurvey(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM surveys WHERE id = ?").bind(id).run();
}

// ─── Questions ─────────────────────────────────────────────────────────────

export async function getQuestionsForSurvey(db: D1Database, surveyId: string): Promise<Question[]> {
  const { results } = await db
    .prepare("SELECT * FROM questions WHERE survey_id = ? ORDER BY position ASC")
    .bind(surveyId)
    .all<Question & { options: string | null }>();

  return results.map((q) => ({
    ...q,
    options: q.options ? (JSON.parse(q.options) as string[]) : null,
  }));
}

export async function createQuestion(
  db: D1Database,
  surveyId: string,
  data: {
    type: string;
    label: string;
    options?: string[];
    position: number;
    required?: number;
  },
): Promise<Question> {
  const id = newId();
  const optionsJson = data.options ? JSON.stringify(data.options) : null;
  await db
    .prepare(
      `INSERT INTO questions (id, survey_id, type, label, options, position, required)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, surveyId, data.type, data.label, optionsJson, data.position, data.required ?? 0)
    .run();

  const question = await db
    .prepare("SELECT * FROM questions WHERE id = ?")
    .bind(id)
    .first<Question & { options: string | null }>();

  if (!question) {
    throw new Error("Failed to create question");
  }

  return {
    ...question,
    options: question.options ? (JSON.parse(question.options) as string[]) : null,
  };
}

export async function updateQuestion(
  db: D1Database,
  id: string,
  fields: Partial<{
    type: string;
    label: string;
    options: string[];
    position: number;
    required: number;
  }>,
): Promise<void> {
  const dbFields: Record<string, unknown> = { ...fields };
  if (fields.options !== undefined) {
    dbFields.options = JSON.stringify(fields.options);
  }

  const entries = Object.entries(dbFields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    return;
  }

  const setClauses = entries.map(([k]) => `${k} = ?`).join(", ");
  const values = entries.map(([, v]) => v);

  await db
    .prepare(`UPDATE questions SET ${setClauses} WHERE id = ?`)
    .bind(...values, id)
    .run();
}

export async function deleteQuestion(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM questions WHERE id = ?").bind(id).run();
}

export async function getQuestionById(db: D1Database, id: string): Promise<Question | null> {
  const q = await db
    .prepare("SELECT * FROM questions WHERE id = ?")
    .bind(id)
    .first<Question & { options: string | null }>();

  if (!q) {
    return null;
  }

  return {
    ...q,
    options: q.options ? (JSON.parse(q.options) as string[]) : null,
  };
}

export async function reorderQuestions(db: D1Database, orderedIds: string[]): Promise<void> {
  const stmts = orderedIds.map((id, index) =>
    db.prepare("UPDATE questions SET position = ? WHERE id = ?").bind(index, id),
  );
  await db.batch(stmts);
}

// ─── Responses ─────────────────────────────────────────────────────────────

export async function createResponse(
  db: D1Database,
  surveyId: string,
  answers: { questionId: string; value: string }[],
): Promise<Response> {
  const responseId = newId();
  const now = new Date().toISOString();

  await db
    .prepare("INSERT INTO responses (id, survey_id, submitted_at) VALUES (?, ?, ?)")
    .bind(responseId, surveyId, now)
    .run();

  if (answers.length > 0) {
    const stmts = answers.map((a) =>
      db
        .prepare(
          "INSERT INTO response_answers (id, response_id, question_id, value) VALUES (?, ?, ?, ?)",
        )
        .bind(newId(), responseId, a.questionId, a.value),
    );
    await db.batch(stmts);
  }

  return { id: responseId, survey_id: surveyId, submitted_at: now };
}

export async function getResponsesForSurvey(
  db: D1Database,
  surveyId: string,
): Promise<(Response & { answers: ResponseAnswer[] })[]> {
  const { results: responses } = await db
    .prepare("SELECT * FROM responses WHERE survey_id = ? ORDER BY submitted_at DESC")
    .bind(surveyId)
    .all<Response>();

  if (responses.length === 0) {
    return [];
  }

  const { results: answers } = await db
    .prepare(
      `SELECT * FROM response_answers
       WHERE response_id IN (${responses.map(() => "?").join(",")})`,
    )
    .bind(...responses.map((r) => r.id))
    .all<ResponseAnswer>();

  return responses.map((r) => ({
    ...r,
    answers: answers.filter((a) => a.response_id === r.id),
  }));
}
