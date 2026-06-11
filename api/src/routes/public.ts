import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { PublicSurvey } from "../../../web/src/types";
import { createResponse, getQuestionsForSurvey, getSurveyById } from "../lib/db";
import type { AppEnv } from "../types";

const publicRouter = new Hono<AppEnv>();

// GET /:surveyId — public survey view
publicRouter.get("/:surveyId", async (c) => {
  const surveyId = c.req.param("surveyId");

  const survey = await getSurveyById(c.env.DB, surveyId);
  if (!survey) {
    return c.json({ ok: false, error: "Survey not found" }, 404);
  }

  const questions = await getQuestionsForSurvey(c.env.DB, surveyId);

  const publicSurvey: PublicSurvey = {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    brand_color: survey.brand_color,
    logo_url: survey.logo_url,
    questions: questions.map((q) => ({
      id: q.id,
      type: q.type,
      label: q.label,
      options: q.options,
      position: q.position,
      required: q.required,
    })),
  };

  return c.json({ ok: true, data: publicSurvey });
});

// POST /:surveyId/respond — submit a response
publicRouter.post(
  "/:surveyId/respond",
  zValidator(
    "json",
    z.object({
      answers: z
        .array(
          z.object({
            questionId: z.string().min(1),
            value: z.string(),
          }),
        )
        .min(0),
    }),
  ),
  async (c) => {
    const surveyId = c.req.param("surveyId");

    const survey = await getSurveyById(c.env.DB, surveyId);
    if (!survey) {
      return c.json({ ok: false, error: "Survey not found" }, 404);
    }

    const questions = await getQuestionsForSurvey(c.env.DB, surveyId);
    const { answers } = c.req.valid("json");

    // Validate required questions are answered
    const answeredIds = new Set(answers.map((a) => a.questionId));
    const requiredQuestions = questions.filter((q) => q.required === 1);
    const missing = requiredQuestions.filter((q) => !answeredIds.has(q.id));

    if (missing.length > 0) {
      return c.json(
        {
          ok: false,
          error: `Required questions not answered: ${missing.map((q) => q.label).join(", ")}`,
        },
        400,
      );
    }

    await createResponse(c.env.DB, surveyId, answers);
    return c.json({ ok: true });
  },
);

export { publicRouter };
