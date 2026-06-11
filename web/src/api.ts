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

const BASE = "/api";

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
  magicLink: (email: string): Promise<ApiResponse<null>> =>
    request<null>("/auth/magic-link", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verify: (token: string): Promise<ApiResponse<User>> =>
    request<User>("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  me: (): Promise<ApiResponse<User>> => request<User>("/auth/me"),

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
