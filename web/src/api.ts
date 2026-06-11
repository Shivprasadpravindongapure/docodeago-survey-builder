import type {
  ApiResponse,
  CreateQuestionBody,
  CreateSurveyBody,
  PublicSurvey,
  Question,
  Response,
  ResponseAnswer,
  Survey,
  SurveyWithQuestions,
  SurveyWithResponseCount,
  UpdateQuestionBody,
  UpdateSurveyBody,
  User,
} from "./types";

// In local dev, Vite proxies /api/* → Worker (see vite.config.ts)
// In production Pages, VITE_API_BASE_URL must point to the live Worker
const BASE = `${import.meta.env.VITE_API_BASE_URL ?? ""}/api`;

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        error: (json as { error?: string }).error ?? `HTTP ${res.status}`,
      };
    }

    return json as ApiResponse<T>;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

// ─── Auth API ──────────────────────────────────────────────────────────────
export const authApi = {
  checkEmail: (email: string): Promise<ApiResponse<{ exists: boolean; hasPassword: boolean }>> =>
    request<{ exists: boolean; hasPassword: boolean }>("/auth/check-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  magicLink: (email: string): Promise<ApiResponse<{ verifyUrl: string }>> =>
    request<{ verifyUrl: string }>("/auth/magic-link", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  login: (email: string, password: string): Promise<ApiResponse<User>> =>
    request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  verify: (token: string): Promise<ApiResponse<User & { hasPassword: boolean }>> =>
    request<User & { hasPassword: boolean }>("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  me: (): Promise<ApiResponse<User>> => request<User>("/auth/me"),

  setPassword: (password: string): Promise<ApiResponse<null>> =>
    request<null>("/auth/set-password", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  logout: (): Promise<ApiResponse<null>> => request<null>("/auth/logout", { method: "POST" }),
};

// ─── Surveys API ───────────────────────────────────────────────────────────
export const surveysApi = {
  list: (): Promise<ApiResponse<SurveyWithResponseCount[]>> =>
    request<SurveyWithResponseCount[]>("/surveys"),

  create: (body: CreateSurveyBody): Promise<ApiResponse<Survey>> =>
    request<Survey>("/surveys", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  get: (id: string): Promise<ApiResponse<SurveyWithQuestions>> =>
    request<SurveyWithQuestions>(`/surveys/${id}`),

  update: (id: string, body: UpdateSurveyBody): Promise<ApiResponse<null>> =>
    request<null>(`/surveys/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (id: string): Promise<ApiResponse<null>> =>
    request<null>(`/surveys/${id}`, { method: "DELETE" }),
};

// ─── Questions API ─────────────────────────────────────────────────────────
export const questionsApi = {
  create: (surveyId: string, body: CreateQuestionBody): Promise<ApiResponse<Question>> =>
    request<Question>(`/surveys/${surveyId}/questions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (questionId: string, body: UpdateQuestionBody): Promise<ApiResponse<null>> =>
    request<null>(`/surveys/questions/${questionId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (questionId: string): Promise<ApiResponse<null>> =>
    request<null>(`/surveys/questions/${questionId}`, { method: "DELETE" }),

  reorder: (surveyId: string, orderedIds: string[]): Promise<ApiResponse<null>> =>
    request<null>(`/surveys/${surveyId}/reorder`, {
      method: "PUT",
      body: JSON.stringify({ orderedIds }),
    }),
};

// ─── Public API ────────────────────────────────────────────────────────────
export const publicApi = {
  getSurvey: (surveyId: string): Promise<ApiResponse<PublicSurvey>> =>
    request<PublicSurvey>(`/public/${surveyId}`),

  respond: (
    surveyId: string,
    answers: { questionId: string; value: string }[],
  ): Promise<ApiResponse<null>> =>
    request<null>(`/public/${surveyId}/respond`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
};

// ─── Responses API ─────────────────────────────────────────────────────────
export const responsesApi = {
  list: (surveyId: string): Promise<ApiResponse<(Response & { answers: ResponseAnswer[] })[]>> =>
    request<(Response & { answers: ResponseAnswer[] })[]>(`/surveys/${surveyId}/responses`),
};
