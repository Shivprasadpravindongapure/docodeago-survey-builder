import { type CSSProperties, useState } from "react";
import type { Question, Survey } from "../../types";
import { DropdownQuestion } from "../questions/DropdownQuestion";
import {
  CheckboxQuestion,
  DateQuestion,
  EmailQuestion,
  PhoneQuestion,
} from "../questions/ExtraQuestions";
import { LongTextQuestion } from "../questions/LongTextQuestion";
import { MultipleChoiceQuestion } from "../questions/MultipleChoiceQuestion";
import { NpsQuestion } from "../questions/NpsQuestion";
import { RatingQuestion } from "../questions/RatingQuestion";
import { ScaleQuestion } from "../questions/ScaleQuestion";
import { ShortTextQuestion } from "../questions/ShortTextQuestion";
import { YesNoQuestion } from "../questions/YesNoQuestion";

interface SurveyPreviewProps {
  survey: Survey;
  questions: Question[];
}

export function SurveyPreview({ survey, questions }: SurveyPreviewProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const wrapperStyle: CSSProperties & Record<string, string> = {
    "--brand": survey.brand_color,
    "--brand-light": `color-mix(in srgb, ${survey.brand_color} 15%, white)`,
    "--brand-dark": `color-mix(in srgb, ${survey.brand_color} 80%, black)`,
    "--brand-glow": `color-mix(in srgb, ${survey.brand_color} 30%, transparent)`,
    minHeight: "100%",
    background: "var(--bg)",
  };

  const sorted = [...questions].sort((a, b) => a.position - b.position);
  const answered = sorted.filter((q) => (answers[q.id] ?? "").trim() !== "").length;
  const progress = sorted.length > 0 ? Math.round((answered / sorted.length) * 100) : 0;

  const handleChange = (id: string, v: string) => setAnswers((prev) => ({ ...prev, [id]: v }));

  const handlePreviewSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setAnswers({});
    }, 2200);
  };

  const opts = (q: Question) => q.options ?? [];
  const val = (q: Question) => answers[q.id] ?? (q.type === "scale" ? "5" : "");
  const props = (q: Question) => ({
    label: q.label,
    required: q.required === 1,
    value: val(q),
    onChange: (v: string) => handleChange(q.id, v),
  });

  return (
    <div style={wrapperStyle}>
      {/* Brand header mini */}
      <div
        className="preview-brand-bar"
        style={{
          background: `linear-gradient(135deg, ${survey.brand_color}, color-mix(in srgb, ${survey.brand_color} 65%, #8b5cf6))`,
        }}
      >
        {survey.logo_url && (
          <img
            src={survey.logo_url}
            alt="logo"
            className="preview-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <h2 className="preview-title">{survey.title || "Untitled Survey"}</h2>
        {survey.description && <p className="preview-desc">{survey.description}</p>}
      </div>

      {/* Progress bar */}
      {sorted.length > 0 && (
        <div className="pub-progress-wrap" style={{ height: 3 }}>
          <div
            className="pub-progress-bar"
            style={{ width: `${progress}%`, background: survey.brand_color }}
          />
          <span className="pub-progress-label" style={{ fontSize: 10 }}>
            {answered}/{sorted.length}
          </span>
        </div>
      )}

      <div style={{ padding: "20px 20px 32px" }}>
        {sorted.length === 0 ? (
          <div className="preview-empty">
            <span style={{ fontSize: 32 }}>✏️</span>
            <p>Add questions to see a live preview</p>
          </div>
        ) : submitted ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12, animation: "bounceIn 0.4s" }}>🎉</div>
            <p style={{ fontWeight: 700, color: "var(--text)", fontSize: 16 }}>
              Preview submitted!
            </p>
            <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 4 }}>
              Resetting in a moment…
            </p>
          </div>
        ) : (
          <>
            {sorted.map((q, idx) => (
              <div
                key={q.id}
                className="preview-q-card"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <span className="pub-q-num" style={{ width: 22, height: 22, fontSize: 11 }}>
                  {idx + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {q.type === "short_text" && <ShortTextQuestion {...props(q)} />}
                  {q.type === "long_text" && <LongTextQuestion {...props(q)} />}
                  {q.type === "multiple_choice" && (
                    <MultipleChoiceQuestion {...props(q)} options={opts(q)} />
                  )}
                  {q.type === "rating" && <RatingQuestion {...props(q)} />}
                  {q.type === "yes_no" && <YesNoQuestion {...props(q)} />}
                  {q.type === "nps" && <NpsQuestion {...props(q)} />}
                  {q.type === "dropdown" && <DropdownQuestion {...props(q)} options={opts(q)} />}
                  {q.type === "scale" && <ScaleQuestion {...props(q)} />}
                  {q.type === "date" && <DateQuestion {...props(q)} />}
                  {q.type === "email" && <EmailQuestion {...props(q)} />}
                  {q.type === "phone" && <PhoneQuestion {...props(q)} />}
                  {q.type === "checkbox" && <CheckboxQuestion {...props(q)} options={opts(q)} />}
                </div>
              </div>
            ))}

            <button
              type="button"
              className="pub-submit-btn"
              style={{
                background: survey.brand_color,
                marginTop: 16,
                fontSize: 14,
                padding: "13px",
              }}
              onClick={handlePreviewSubmit}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 12l5 5L19 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Submit (Preview)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
