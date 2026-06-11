// ─── Core Entity Types ─────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Session {
  token: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface MagicLink {
  token: string;
  email: string;
  expires_at: string;
  used: number;
  created_at: string;
}

export type QuestionType = "short_text" | "multiple_choice" | "rating";

export interface Survey {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  brand_color: string;
  logo_url: string | null;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  survey_id: string;
  type: QuestionType;
  label: string;
  options: string[] | null;
  position: number;
  required: number;
  created_at: string;
}

export interface Response {
  id: string;
  survey_id: string;
  submitted_at: string;
}

export interface ResponseAnswer {
  id: string;
  response_id: string;
  question_id: string;
  value: string;
}

// ─── API Response Wrapper ──────────────────────────────────────────────────

export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

// ─── Composite / View Types ────────────────────────────────────────────────

export interface SurveyWithQuestions extends Survey {
  questions: Question[];
}

export interface ResponseWithAnswers extends Response {
  answers: ResponseAnswer[];
}

export interface SurveyWithResponseCount extends Survey {
  question_count: number;
  response_count: number;
}

// ─── Public-facing types (no user_id exposed) ─────────────────────────────

export type PublicSurvey = {
  id: string;
  title: string;
  description: string | null;
  brand_color: string;
  logo_url: string | null;
  questions: PublicQuestion[];
};

export type PublicQuestion = {
  id: string;
  type: QuestionType;
  label: string;
  options: string[] | null;
  position: number;
  required: number;
};

// ─── Request Body Types ────────────────────────────────────────────────────

export interface CreateSurveyBody {
  title: string;
}

export interface UpdateSurveyBody {
  title?: string;
  description?: string;
  brand_color?: string;
  logo_url?: string;
  is_published?: number;
}

export interface CreateQuestionBody {
  type: QuestionType;
  label: string;
  options?: string[];
  position: number;
  required?: number;
}

export interface UpdateQuestionBody {
  type?: QuestionType;
  label?: string;
  options?: string[];
  position?: number;
  required?: number;
}

export interface SubmitResponseBody {
  answers: { questionId: string; value: string }[];
}
