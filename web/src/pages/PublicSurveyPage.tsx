import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { publicApi } from "../api";
import { MultipleChoiceQuestion } from "../components/questions/MultipleChoiceQuestion";
import { RatingQuestion } from "../components/questions/RatingQuestion";
import { ShortTextQuestion } from "../components/questions/ShortTextQuestion";
import type { PublicSurvey } from "../types";

export function PublicSurveyPage() {
  const { surveyId } = useParams({ from: "/s/$surveyId" });
  const [survey, setSurvey] = useState<PublicSurvey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    publicApi.getSurvey(surveyId).then((res) => {
      if (res.ok) {
        setSurvey(res.data);
        // Inject brand CSS variables onto <html>
        const root = document.documentElement;
        root.style.setProperty("--brand", res.data.brand_color);
        root.style.setProperty(
          "--brand-light",
          `color-mix(in srgb, ${res.data.brand_color} 15%, white)`,
        );
        root.style.setProperty(
          "--brand-dark",
          `color-mix(in srgb, ${res.data.brand_color} 80%, black)`,
        );
        root.style.setProperty(
          "--brand-glow",
          `color-mix(in srgb, ${res.data.brand_color} 30%, transparent)`,
        );
      } else {
        setError("Survey not found.");
      }
      setLoading(false);
    });

    // Reset CSS vars on unmount
    return () => {
      const root = document.documentElement;
      root.style.removeProperty("--brand");
      root.style.removeProperty("--brand-light");
      root.style.removeProperty("--brand-dark");
      root.style.removeProperty("--brand-glow");
    };
  }, [surveyId]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    // Validate required fields
    const errors: Record<string, string> = {};
    for (const q of survey.questions) {
      if (q.required === 1 && !answers[q.id]?.trim()) {
        errors[q.id] = "This question is required.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSubmitting(true);
    const formattedAnswers = Object.entries(answers)
      .filter(([, value]) => value.trim() !== "")
      .map(([questionId, value]) => ({ questionId, value }));

    const res = await publicApi.respond(surveyId, formattedAnswers);
    setSubmitting(false);

    if (res.ok) {
      setSubmitted(true);
    } else {
      setValidationErrors({ _form: res.error });
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="public-survey">
        <div className="public-survey-inner" style={{ textAlign: "center", paddingTop: 100 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>😕</p>
          <h1 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Survey not found</h1>
          <p style={{ color: "var(--text-2)" }}>{error}</p>
        </div>
      </div>
    );
  }

  const sorted = [...survey.questions].sort((a, b) => a.position - b.position);

  if (submitted) {
    return (
      <div className="public-survey">
        <div className="public-survey-inner">
          <div className="thank-you">
            <div className="thank-you-icon">🎉</div>
            <h2>Thank you!</h2>
            <p>Your response has been recorded.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-survey">
      <div className="public-survey-inner">
        {survey.logo_url && (
          <img
            src={survey.logo_url}
            alt="Survey logo"
            className="public-survey-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}

        <h1 className="public-survey-title">{survey.title}</h1>
        {survey.description && <p className="public-survey-desc">{survey.description}</p>}

        <form onSubmit={handleSubmit}>
          {sorted.map((q) => {
            const val = answers[q.id] ?? "";
            const err = validationErrors[q.id];

            return (
              <div key={q.id}>
                {q.type === "short_text" && (
                  <ShortTextQuestion
                    label={q.label}
                    required={q.required === 1}
                    value={val}
                    onChange={(v) => handleAnswerChange(q.id, v)}
                  />
                )}
                {q.type === "multiple_choice" && (
                  <MultipleChoiceQuestion
                    label={q.label}
                    required={q.required === 1}
                    options={q.options ?? []}
                    value={val}
                    onChange={(v) => handleAnswerChange(q.id, v)}
                  />
                )}
                {q.type === "rating" && (
                  <RatingQuestion
                    label={q.label}
                    required={q.required === 1}
                    value={val}
                    onChange={(v) => handleAnswerChange(q.id, v)}
                  />
                )}
                {err && (
                  <p className="text-danger text-sm" style={{ marginTop: -20, marginBottom: 16 }}>
                    {err}
                  </p>
                )}
              </div>
            );
          })}

          {validationErrors._form && (
            <p className="text-danger text-sm" role="alert">
              {validationErrors._form}
            </p>
          )}

          <button
            type="submit"
            className="public-submit-btn"
            disabled={submitting}
            id="public-survey-submit-btn"
          >
            {submitting ? "Submitting…" : "Submit →"}
          </button>
        </form>
      </div>
    </div>
  );
}
