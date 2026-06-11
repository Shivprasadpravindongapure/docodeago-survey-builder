import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import {
  createQuestion,
  createSurvey,
  deleteQuestion,
  deleteSurvey,
  getQuestionById,
  getQuestionsForSurvey,
  getSurveyById,
  listSurveysForUser,
  reorderQuestions,
  updateQuestion,
  updateSurvey,
} from "../lib/db";
import type { AppEnv } from "../types";

const surveysRouter = new Hono<AppEnv>();

// GET / — list surveys for authenticated user
surveysRouter.get("/", async (c) => {
  const user = c.get("user");
  const surveys = await listSurveysForUser(c.env.DB, user.id);
  return c.json({ ok: true, data: surveys });
});

// POST / — create survey
surveysRouter.post(
  "/",
  zValidator("json", z.object({ title: z.string().min(1, "Title is required") })),
  async (c) => {
    const user = c.get("user");
    const { title } = c.req.valid("json");
    const survey = await createSurvey(c.env.DB, user.id, title);
    return c.json({ ok: true, data: survey }, 201);
  },
);

// GET /:id — get survey with questions
surveysRouter.get("/:id", async (c) => {
  const user = c.get("user");
  const surveyId = c.req.param("id");

  const survey = await getSurveyById(c.env.DB, surveyId);
  if (!survey) {
    return c.json({ ok: false, error: "Survey not found" }, 404);
  }
  if (survey.user_id !== user.id) {
    return c.json({ ok: false, error: "Forbidden" }, 403);
  }

  const questions = await getQuestionsForSurvey(c.env.DB, surveyId);
  return c.json({ ok: true, data: { ...survey, questions } });
});

// PUT /:id — update survey
surveysRouter.put(
  "/:id",
  zValidator(
    "json",
    z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      brand_color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color")
        .optional(),
      logo_url: z.string().url().or(z.literal("")).optional(),
      is_published: z.number().int().min(0).max(1).optional(),
    }),
  ),
  async (c) => {
    const user = c.get("user");
    const surveyId = c.req.param("id");

    const survey = await getSurveyById(c.env.DB, surveyId);
    if (!survey) {
      return c.json({ ok: false, error: "Survey not found" }, 404);
    }
    if (survey.user_id !== user.id) {
      return c.json({ ok: false, error: "Forbidden" }, 403);
    }

    const body = c.req.valid("json");
    await updateSurvey(c.env.DB, surveyId, body);
    return c.json({ ok: true });
  },
);

// DELETE /:id — delete survey
surveysRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  const surveyId = c.req.param("id");

  const survey = await getSurveyById(c.env.DB, surveyId);
  if (!survey) {
    return c.json({ ok: false, error: "Survey not found" }, 404);
  }
  if (survey.user_id !== user.id) {
    return c.json({ ok: false, error: "Forbidden" }, 403);
  }

  await deleteSurvey(c.env.DB, surveyId);
  return c.json({ ok: true });
});

// POST /:id/questions — create question
surveysRouter.post(
  "/:id/questions",
  zValidator(
    "json",
    z.object({
      type: z.enum(["short_text", "multiple_choice", "rating"]),
      label: z.string().min(1, "Label is required"),
      options: z.array(z.string()).optional(),
      position: z.number().int().min(0),
      required: z.number().int().min(0).max(1).optional(),
    }),
  ),
  async (c) => {
    const user = c.get("user");
    const surveyId = c.req.param("id");

    const survey = await getSurveyById(c.env.DB, surveyId);
    if (!survey) {
      return c.json({ ok: false, error: "Survey not found" }, 404);
    }
    if (survey.user_id !== user.id) {
      return c.json({ ok: false, error: "Forbidden" }, 403);
    }

    const body = c.req.valid("json");
    const question = await createQuestion(c.env.DB, surveyId, body);
    return c.json({ ok: true, data: question }, 201);
  },
);

// PUT /questions/:id — update question
surveysRouter.put(
  "/questions/:id",
  zValidator(
    "json",
    z.object({
      type: z.enum(["short_text", "multiple_choice", "rating"]).optional(),
      label: z.string().min(1).optional(),
      options: z.array(z.string()).optional(),
      position: z.number().int().min(0).optional(),
      required: z.number().int().min(0).max(1).optional(),
    }),
  ),
  async (c) => {
    const user = c.get("user");
    const questionId = c.req.param("id");

    const question = await getQuestionById(c.env.DB, questionId);
    if (!question) {
      return c.json({ ok: false, error: "Question not found" }, 404);
    }

    const survey = await getSurveyById(c.env.DB, question.survey_id);
    if (!survey || survey.user_id !== user.id) {
      return c.json({ ok: false, error: "Forbidden" }, 403);
    }

    const body = c.req.valid("json");
    await updateQuestion(c.env.DB, questionId, body);
    return c.json({ ok: true });
  },
);

// DELETE /questions/:id — delete question
surveysRouter.delete("/questions/:id", async (c) => {
  const user = c.get("user");
  const questionId = c.req.param("id");

  const question = await getQuestionById(c.env.DB, questionId);
  if (!question) {
    return c.json({ ok: false, error: "Question not found" }, 404);
  }

  const survey = await getSurveyById(c.env.DB, question.survey_id);
  if (!survey || survey.user_id !== user.id) {
    return c.json({ ok: false, error: "Forbidden" }, 403);
  }

  await deleteQuestion(c.env.DB, questionId);
  return c.json({ ok: true });
});

// PUT /:id/reorder — reorder questions
surveysRouter.put(
  "/:id/reorder",
  zValidator(
    "json",
    z.object({ orderedIds: z.array(z.string()).min(1, "At least one ID required") }),
  ),
  async (c) => {
    const user = c.get("user");
    const surveyId = c.req.param("id");

    const survey = await getSurveyById(c.env.DB, surveyId);
    if (!survey) {
      return c.json({ ok: false, error: "Survey not found" }, 404);
    }
    if (survey.user_id !== user.id) {
      return c.json({ ok: false, error: "Forbidden" }, 403);
    }

    const { orderedIds } = c.req.valid("json");
    await reorderQuestions(c.env.DB, orderedIds);
    return c.json({ ok: true });
  },
);

export { surveysRouter };
