import type { CSSProperties } from "react";
import type { Question, Survey } from "../../types";

interface SurveyPreviewProps {
  survey: Survey;
  questions: Question[];
}

function ReadOnlyQuestion({ question }: { question: Question }) {
  switch (question.type) {
    case "short_text":
      return (
        <div className="public-question">
          <p className="public-question-label">
            {question.label}
            {question.required === 1 && <span className="required-star"> *</span>}
          </p>
          <textarea
            placeholder="Your answer…"
            rows={2}
            disabled
            style={{ opacity: 0.6, cursor: "default" }}
            readOnly
          />
        </div>
      );

    case "multiple_choice":
      return (
        <div className="public-question">
          <p className="public-question-label">
            {question.label}
            {question.required === 1 && <span className="required-star"> *</span>}
          </p>
          {question.options && question.options.length > 0 ? (
            question.options.map((opt) => (
              <label key={opt} className="radio-option" style={{ cursor: "default", opacity: 0.8 }}>
                <input type="radio" disabled readOnly />
                {opt}
              </label>
            ))
          ) : (
            <p style={{ color: "var(--text-3)", fontSize: 13, fontStyle: "italic" }}>
              No options yet…
            </p>
          )}
        </div>
      );

    case "rating":
      return (
        <div className="public-question">
          <p className="public-question-label">
            {question.label}
            {question.required === 1 && <span className="required-star"> *</span>}
          </p>
          <div className="rating-buttons">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className="rating-btn" disabled>
                {n}
              </button>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}

export function SurveyPreview({ survey, questions }: SurveyPreviewProps) {
  const wrapperStyle: CSSProperties = {
    "--brand": survey.brand_color,
    "--brand-light": `color-mix(in srgb, ${survey.brand_color} 15%, white)`,
    "--brand-dark": `color-mix(in srgb, ${survey.brand_color} 80%, black)`,
    "--brand-glow": `color-mix(in srgb, ${survey.brand_color} 30%, transparent)`,
    minHeight: "100%",
    padding: "40px 28px",
    background: "var(--bg)",
  } as CSSProperties & Record<string, string>;

  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);

  return (
    <div style={wrapperStyle}>
      {/* Logo */}
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

      {/* Title */}
      <h1 className="public-survey-title" style={{ fontSize: "1.6rem", marginBottom: 6 }}>
        {survey.title || "Untitled Survey"}
      </h1>

      {survey.description && <p className="public-survey-desc">{survey.description}</p>}

      <div style={{ marginTop: 32 }}>
        {sortedQuestions.length === 0 ? (
          <div
            style={{
              border: "2px dashed var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "40px",
              textAlign: "center",
              color: "var(--text-3)",
              fontSize: 14,
            }}
          >
            Add questions to see a preview →
          </div>
        ) : (
          sortedQuestions.map((q) => <ReadOnlyQuestion key={q.id} question={q} />)
        )}
      </div>

      {sortedQuestions.length > 0 && (
        <button type="button" className="public-submit-btn" disabled style={{ marginTop: 24 }}>
          Submit
        </button>
      )}
    </div>
  );
}
