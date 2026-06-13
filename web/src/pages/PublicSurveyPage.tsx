import { useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { publicApi } from "../api";
import { CheckboxQuestion, DateQuestion, EmailQuestion, PhoneQuestion } from "../components/questions/ExtraQuestions";
import { DropdownQuestion } from "../components/questions/DropdownQuestion";
import { LongTextQuestion } from "../components/questions/LongTextQuestion";
import { MultipleChoiceQuestion } from "../components/questions/MultipleChoiceQuestion";
import { NpsQuestion } from "../components/questions/NpsQuestion";
import { RatingQuestion } from "../components/questions/RatingQuestion";
import { ScaleQuestion } from "../components/questions/ScaleQuestion";
import { ShortTextQuestion } from "../components/questions/ShortTextQuestion";
import { YesNoQuestion } from "../components/questions/YesNoQuestion";
import type { PublicSurvey } from "../types";

function QuestionRenderer({
  q, value, onChange, error,
}: {
  q: PublicSurvey["questions"][0]; value: string; onChange: (v: string) => void; error?: string;
}) {
  const opts = q.options ?? [];
  const props = { label: q.label, required: q.required === 1, value, onChange };
  return (
    <div className="pub-question-wrap">
      {q.type === "short_text"     && <ShortTextQuestion {...props} />}
      {q.type === "long_text"      && <LongTextQuestion {...props} />}
      {q.type === "multiple_choice"&& <MultipleChoiceQuestion {...props} options={opts} />}
      {q.type === "rating"         && <RatingQuestion {...props} />}
      {q.type === "yes_no"         && <YesNoQuestion {...props} />}
      {q.type === "nps"            && <NpsQuestion {...props} />}
      {q.type === "dropdown"       && <DropdownQuestion {...props} options={opts} />}
      {q.type === "scale"          && <ScaleQuestion {...props} />}
      {q.type === "date"           && <DateQuestion {...props} />}
      {q.type === "email"          && <EmailQuestion {...props} />}
      {q.type === "phone"          && <PhoneQuestion {...props} />}
      {q.type === "checkbox"       && <CheckboxQuestion {...props} options={opts} />}
      {error && <p className="pub-field-error">{error}</p>}
    </div>
  );
}

export function PublicSurveyPage() {
  const { surveyId } = useParams({ from: "/s/$surveyId" });
  const [survey, setSurvey] = useState<PublicSurvey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    publicApi.getSurvey(surveyId).then((res) => {
      if (res.ok) {
        setSurvey(res.data);
        const root = document.documentElement;
        const c = res.data.brand_color;
        root.style.setProperty("--brand", c);
        root.style.setProperty("--brand-light", `color-mix(in srgb, ${c} 15%, white)`);
        root.style.setProperty("--brand-dark", `color-mix(in srgb, ${c} 80%, black)`);
        root.style.setProperty("--brand-glow", `color-mix(in srgb, ${c} 30%, transparent)`);
      } else {
        setError("Survey not found.");
      }
      setLoading(false);
    });
    return () => {
      const root = document.documentElement;
      ["--brand","--brand-light","--brand-dark","--brand-glow"].forEach((k) => root.style.removeProperty(k));
    };
  }, [surveyId]);

  const handleChange = (id: string, v: string) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
    setValidationErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;
    const errs: Record<string, string> = {};
    for (const q of survey.questions) {
      if (q.required === 1 && !answers[q.id]?.trim()) {
        errs[q.id] = "This question is required.";
      }
    }
    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      // Scroll to first error
      const firstId = Object.keys(errs)[0];
      document.getElementById(`q-${firstId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    const formatted = Object.entries(answers)
      .filter(([, v]) => v.trim() !== "")
      .map(([questionId, value]) => ({ questionId, value }));
    const res = await publicApi.respond(surveyId, formatted);
    setSubmitting(false);
    if (res.ok) setSubmitted(true);
    else setValidationErrors({ _form: res.error });
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="pub-loading">
        <div className="spinner" />
      </div>
    );
  }

  // ── Not found ──
  if (error || !survey) {
    return (
      <div className="pub-page">
        <div className="pub-inner" style={{ textAlign: "center", paddingTop: 80 }}>
          <p style={{ fontSize: 56, marginBottom: 12 }}>😕</p>
          <h1 style={{ fontSize: "1.6rem", marginBottom: 8 }}>Survey not found</h1>
          <p style={{ color: "var(--text-3)" }}>{error}</p>
        </div>
      </div>
    );
  }

  const sorted = [...survey.questions].sort((a, b) => a.position - b.position);
  const answered = sorted.filter((q) => answers[q.id]?.trim()).length;
  const progress = sorted.length > 0 ? Math.round((answered / sorted.length) * 100) : 0;

  // WhatsApp share URL
  const shareUrl = `${window.location.origin}/s/${surveyId}`;
  const waMsg = encodeURIComponent(`Hey! Please fill out this survey: ${survey.title}\n${shareUrl}`);
  const waUrl = `https://wa.me/?text=${waMsg}`;

  // ── Thank you ──
  if (submitted) {
    return (
      <div className="pub-page">
        <div className="pub-brand-bar" style={{ background: `linear-gradient(135deg, ${survey.brand_color}, color-mix(in srgb, ${survey.brand_color} 70%, #8b5cf6))` }}>
          {survey.logo_url && <img src={survey.logo_url} alt="logo" className="pub-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
          <h1 className="pub-brand-title">{survey.title}</h1>
        </div>
        <div className="pub-inner">
          <div className="pub-thankyou">
            <div className="pub-thankyou-icon">🎉</div>
            <h2 className="pub-thankyou-title">Thank you!</h2>
            <p className="pub-thankyou-sub">Your response has been recorded successfully.</p>

            <div className="pub-thankyou-actions">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="pub-wa-btn"
                id="whatsapp-share-btn"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share this survey on WhatsApp
              </a>
              <a href={shareUrl} className="pub-again-btn">
                Fill out again
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Survey form ──
  return (
    <div className="pub-page">
      {/* Brand header */}
      <div className="pub-brand-bar" style={{ background: `linear-gradient(135deg, ${survey.brand_color}, color-mix(in srgb, ${survey.brand_color} 70%, #8b5cf6))` }}>
        {survey.logo_url && <img src={survey.logo_url} alt="logo" className="pub-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
        <h1 className="pub-brand-title">{survey.title}</h1>
        {survey.description && <p className="pub-brand-desc">{survey.description}</p>}
      </div>

      {/* Progress bar */}
      <div className="pub-progress-wrap">
        <div className="pub-progress-bar" style={{ width: `${progress}%`, background: survey.brand_color }} />
        <span className="pub-progress-label">{answered}/{sorted.length} answered</span>
      </div>

      <div className="pub-inner">
        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          {sorted.map((q, idx) => (
            <div key={q.id} id={`q-${q.id}`} className="pub-question-card"
              style={{ animationDelay: `${idx * 0.04}s` }}>
              <span className="pub-q-num">{idx + 1}</span>
              <QuestionRenderer
                q={q}
                value={answers[q.id] ?? ""}
                onChange={(v) => handleChange(q.id, v)}
                error={validationErrors[q.id]}
              />
            </div>
          ))}

          {validationErrors._form && (
            <p className="pub-field-error" role="alert" style={{ marginBottom: 16 }}>
              {validationErrors._form}
            </p>
          )}

          <button
            type="submit"
            className="pub-submit-btn"
            disabled={submitting}
            id="public-survey-submit-btn"
            style={{ background: survey.brand_color }}
          >
            {submitting ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="btn-spinner" style={{ borderTopColor: "#fff", width: 18, height: 18, borderWidth: 2 }} />
                Submitting…
              </span>
            ) : (
              <span>Submit response →</span>
            )}
          </button>

          {/* WhatsApp share below form too */}
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <a href={waUrl} target="_blank" rel="noreferrer" className="pub-wa-inline" id="wa-share-form-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Share this survey on WhatsApp
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
