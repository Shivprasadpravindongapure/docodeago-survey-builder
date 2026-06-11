import { Hono } from "hono";
import { getResponsesForSurvey, getSurveyById } from "../lib/db";
import type { AppEnv } from "../types";

const responsesRouter = new Hono<AppEnv>();

// GET /:id/responses — get all responses for a survey
responsesRouter.get("/:id/responses", async (c) => {
  const user = c.get("user");
  const surveyId = c.req.param("id");

  const survey = await getSurveyById(c.env.DB, surveyId);
  if (!survey) {
    return c.json({ ok: false, error: "Survey not found" }, 404);
  }
  if (survey.user_id !== user.id) {
    return c.json({ ok: false, error: "Forbidden" }, 403);
  }

  const responses = await getResponsesForSurvey(c.env.DB, surveyId);
  return c.json({ ok: true, data: responses });
});

export { responsesRouter };
